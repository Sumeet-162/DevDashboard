import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  UserPlus, 
  UserMinus, 
  MapPin, 
  ExternalLink, 
  Users, 
  Heart,
  MessageSquare
} from "lucide-react";
import { CommunityMember, CommunityService } from "@/lib/communityService";
import { useAuthSimple } from "@/hooks/useAuth";
import { getProfileDisplayName } from "@/lib/utils";

interface CommunityMemberCardProps {
  profile: CommunityMember;
  onFollowChange?: (profileId: string, isFollowing: boolean, followersCount: number) => void;
  variant?: 'default' | 'compact';
}

const CommunityMemberCard = ({ 
  profile, 
  onFollowChange, 
  variant = 'default' 
}: CommunityMemberCardProps) => {
  const { user } = useAuthSimple();
  const navigate = useNavigate();
  const [isFollowing, setIsFollowing] = useState(profile.is_following || false);
  const [followersCount, setFollowersCount] = useState(profile.followers_count);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [lastActionTime, setLastActionTime] = useState(0);

  const isOwnProfile = user?.id === profile.id;
  const displayName = getProfileDisplayName(profile);

  // Sync state with props when they change
  useEffect(() => {
    setIsFollowing(profile.is_following || false);
    setFollowersCount(profile.followers_count);
  }, [profile.is_following, profile.followers_count]);

  const handleProfileClick = () => {
    if (isOwnProfile) {
      navigate('/profile');
    } else {
      navigate(`/profile/${profile.id}`);
    }
  };

  const handleFollowToggle = async () => {
    if (!user || isOwnProfile || isActionLoading) return;

    // Prevent rapid successive calls
    const now = Date.now();
    if (now - lastActionTime < 1000) {
      console.log('Preventing rapid follow toggle');
      return;
    }
    setLastActionTime(now);

    console.log('Follow toggle started for:', profile.id, 'current following:', isFollowing);
    setIsActionLoading(true);
    try {
      const result = await CommunityService.toggleFollow(profile.id);
      console.log('Follow toggle result:', result);
      
      setIsFollowing(result.isFollowing);
      setFollowersCount(result.followersCount);
      onFollowChange?.(profile.id, result.isFollowing, result.followersCount);
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (variant === 'compact') {
    return (
      <Card className="hover:shadow-sm transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar 
              className="h-12 w-12 cursor-pointer hover:ring-2 hover:ring-primary transition-all" 
              onClick={handleProfileClick}
            >
              <AvatarImage src={profile.avatar_url} alt={displayName} />
              <AvatarFallback>
                {displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 
                  className="font-medium truncate cursor-pointer hover:text-primary transition-colors"
                  onClick={handleProfileClick}
                >
                  {displayName}
                </h3>
                {profile.username && (
                  <span 
                    className="text-xs text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                    onClick={handleProfileClick}
                  >
                    @{profile.username}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {followersCount} followers
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {profile.posts_count} posts
                </span>
              </div>
            </div>

            {!isOwnProfile && user && (
              <Button
                variant={isFollowing ? "outline" : "default"}
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleFollowToggle();
                }}
                disabled={isActionLoading}
                className="flex-shrink-0"
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="h-3 w-3 mr-1" />
                    Unfollow
                  </>
                ) : (
                  <>
                    <UserPlus className="h-3 w-3 mr-1" />
                    Follow
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col items-center gap-3">
          {/* Avatar and Name */}
          <div className="text-center space-y-2">
            <Avatar 
              className="h-14 w-14 mx-auto cursor-pointer hover:ring-2 hover:ring-primary transition-all" 
              onClick={handleProfileClick}
            >
              <AvatarImage src={profile.avatar_url} alt={displayName} />
              <AvatarFallback className="text-sm font-medium">
                {displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-1">
              <h3 
                className="font-medium text-sm leading-tight cursor-pointer hover:text-primary transition-colors"
                onClick={handleProfileClick}
              >
                {displayName}
              </h3>
              {profile.username && (
                <p 
                  className="text-xs text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                  onClick={handleProfileClick}
                >
                  @{profile.username}
                </p>
              )}
            </div>
          </div>

          {/* Compact Info */}
          <div className="text-center space-y-1">
            {profile.bio && (
              <p className="text-xs text-muted-foreground truncate max-w-full">
                {profile.bio}
              </p>
            )}
          </div>

          {/* Compact Stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {followersCount}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {profile.posts_count}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {profile.total_likes_received}
            </span>
          </div>

          {/* Action Button */}
          {!isOwnProfile && user ? (
            <Button
              variant={isFollowing ? "outline" : "default"}
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleFollowToggle();
              }}
              disabled={isActionLoading}
              className="w-full text-xs"
            >
              {isFollowing ? (
                <>
                  <UserMinus className="h-3 w-3 mr-1" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="h-3 w-3 mr-1" />
                  Follow
                </>
              )}
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-xs"
              onClick={handleProfileClick}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View Profile
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CommunityMemberCard;
