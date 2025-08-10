import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  ExternalLink,
  Clock
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommunityPost, CommunityService } from "@/lib/communityService";
import { useAuthSimple } from "@/hooks/useAuth.tsx";
import { getProfileDisplayName } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import CommentsSection from "./CommentsSection";

interface PostCardProps {
  post: CommunityPost;
  onLike?: (postId: string, isLiked: boolean, likesCount: number) => void;
  onComment?: (postId: string) => void;
  onEdit?: (post: CommunityPost) => void;
  onDelete?: (postId: string) => void;
  showActions?: boolean;
}

const PostCard = ({ 
  post, 
  onLike, 
  onComment, 
  onEdit, 
  onDelete, 
  showActions = true 
}: PostCardProps) => {
  const { user } = useAuthSimple();
  const navigate = useNavigate();
  const [isLiking, setIsLiking] = useState(false);
  const [currentLikesCount, setCurrentLikesCount] = useState(post.likes_count);
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [showComments, setShowComments] = useState(false);

  const isAuthor = user?.id === post.author_id;
  const authorName = post.author ? getProfileDisplayName(post.author) : 'Unknown User';

  const handleProfileClick = () => {
    if (post.author_id === user?.id) {
      // Navigate to own profile
      navigate('/profile');
    } else {
      // Navigate to user's profile
      navigate(`/profile/${post.author_id}`);
    }
  };

  const handleLike = async () => {
    if (!user || isLiking) return;

    setIsLiking(true);
    try {
      const newIsLiked = await CommunityService.togglePostLike(post.id);
      setIsLiked(newIsLiked);
      const newLikesCount = newIsLiked ? currentLikesCount + 1 : Math.max(0, currentLikesCount - 1);
      setCurrentLikesCount(newLikesCount);
      onLike?.(post.id, newIsLiked, newLikesCount);
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.content.substring(0, 100) + '...',
          url: window.location.href + `/posts/${post.id}`
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href + `/posts/${post.id}`);
    }
  };

  const truncateContent = (content: string, maxLength: number) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <>
      <Card className="w-full hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar 
                className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary transition-all" 
                onClick={handleProfileClick}
              >
                <AvatarImage src={post.author?.avatar_url} alt={authorName} />
                <AvatarFallback>
                  {authorName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h4 
                    className="font-medium text-sm cursor-pointer hover:text-primary transition-colors" 
                    onClick={handleProfileClick}
                  >
                    {authorName}
                  </h4>
                  {post.author?.username && (
                    <span 
                      className="text-xs text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                      onClick={handleProfileClick}
                    >
                      @{post.author.username}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <time title={new Date(post.created_at).toLocaleString()}>
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </time>
                </div>
              </div>
            </div>
            
            {isAuthor && showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit?.(post)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete?.(post.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg mb-2 leading-tight">{post.title}</h3>
            <div className="prose prose-sm max-w-none">
              <p className="text-muted-foreground whitespace-pre-wrap">
                {truncateContent(post.content, 300)}
              </p>
            </div>
          </div>
        </CardContent>

        {showActions && (
          <CardFooter className="pt-3 border-t">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  disabled={!user || isLiking}
                  className={`gap-1 ${isLiked ? 'text-red-500 hover:text-red-600' : ''}`}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{currentLikesCount}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComments(true)}
                  className="gap-1"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{post.comments_count}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="gap-1"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                <ExternalLink className="h-3 w-3" />
                View Post
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Comments Section */}
      <CommentsSection 
        postId={post.id} 
        isOpen={showComments} 
        onClose={() => setShowComments(false)} 
      />
    </>
  );
};

export default PostCard;
