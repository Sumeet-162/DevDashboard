import { useState, useEffect } from "react";
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
import CommentsModal from "./CommentsModal";
import { supabase } from "@/lib/supabase";

interface PostCardProps {
  post: CommunityPost;
  onLike?: (postId: string, isLiked: boolean, likesCount: number) => void;
  onComment?: (postId: string, commentsCount: number) => void;
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
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [actualCommentsCount, setActualCommentsCount] = useState<number | null>(null);
  const [actualLikesCount, setActualLikesCount] = useState<number | null>(null);

  // Use actual counts if available, otherwise fall back to post props
  const currentLikesCount = actualLikesCount !== null ? actualLikesCount : post.likes_count;
  const currentCommentsCount = actualCommentsCount !== null ? actualCommentsCount : post.comments_count;
  const isLiked = post.is_liked || false;

  const isAuthor = user?.id === post.author_id;
  const authorName = post.author ? getProfileDisplayName(post.author) : 'Unknown User';

  // Fetch actual counts on mount
  useEffect(() => {
    const fetchActualCounts = async () => {
      try {
        // Get actual likes count
        const { count: likesCount } = await supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        // Get actual comments count  
        const { count: commentsCount } = await supabase
          .from('post_comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', post.id);

        setActualLikesCount(likesCount || 0);
        setActualCommentsCount(commentsCount || 0);
      } catch (error) {
        console.error('Error fetching actual counts:', error);
        // Fallback to post props on error
        setActualLikesCount(post.likes_count);
        setActualCommentsCount(post.comments_count);
      }
    };

    fetchActualCounts();
  }, [post.id, post.likes_count, post.comments_count]);

  const handleProfileClick = () => {
    if (post.author_id === user?.id) {
      navigate('/profile');
    } else {
      navigate(`/profile/${post.author_id}`);
    }
  };

  // VIEW POST - Navigate to full post page
  const handleViewPost = () => {
    navigate(`/community/post/${post.id}`);
  };

  // COMMENT BUTTON - Open comments modal
  const handleOpenComments = () => {
    setShowCommentsModal(true);
  };

  const handleCloseComments = () => {
    setShowCommentsModal(false);
  };

  // Handle comment added with direct count update
  const handleCommentAdded = async (newCommentsCount: number) => {
    console.log('🔄 PostCard: Received new comment count:', newCommentsCount);
    // Update both local state and parent state
    setActualCommentsCount(newCommentsCount);
    onComment?.(post.id, newCommentsCount);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user || isLiking) return;

    setIsLiking(true);
    try {
      const { isLiked: newIsLiked, likesCount: newLikesCount } = await CommunityService.togglePostLike(post.id);
      // Update both local state and parent state
      setActualLikesCount(newLikesCount);
      onLike?.(post.id, newIsLiked, newLikesCount);
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
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
        <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <Avatar 
                className="h-8 w-8 sm:h-10 sm:w-10 cursor-pointer hover:ring-2 hover:ring-primary transition-all flex-shrink-0" 
                onClick={handleProfileClick}
              >
                <AvatarImage src={post.author?.avatar_url} alt={authorName} />
                <AvatarFallback className="text-xs sm:text-sm">
                  {authorName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                  <h4 
                    className="font-medium text-xs sm:text-sm cursor-pointer hover:text-primary transition-colors truncate" 
                    onClick={handleProfileClick}
                  >
                    {authorName}
                  </h4>
                  {post.author?.username && (
                    <span 
                      className="text-[10px] sm:text-xs text-muted-foreground cursor-pointer hover:text-primary transition-colors truncate"
                      onClick={handleProfileClick}
                    >
                      @{post.author.username}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
                  <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                  <time 
                    title={new Date(post.created_at).toLocaleString()}
                    className="truncate"
                  >
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </time>
                </div>
              </div>
            </div>
            
            {isAuthor && showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 sm:h-8 sm:w-8 p-0 flex-shrink-0">
                    <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => onEdit?.(post)} className="text-xs sm:text-sm">
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete?.(post.id)}
                    className="text-destructive text-xs sm:text-sm"
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-4 md:p-6 pt-0">
          <div>
            <h3 className="font-semibold text-sm sm:text-lg mb-1 sm:mb-2 leading-tight break-words">
              {post.title}
            </h3>
            <div className="prose prose-sm max-w-none">
              <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap break-words leading-relaxed">
                {truncateContent(post.content, 300)}
              </p>
            </div>
          </div>
        </CardContent>

        {showActions && (
          <CardFooter className="pt-2 sm:pt-3 border-t p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between w-full gap-2">
              <div className="flex items-center gap-1 sm:gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  disabled={!user || isLiking}
                  className={`gap-0.5 sm:gap-1 h-7 sm:h-8 px-1.5 sm:px-3 text-xs sm:text-sm ${
                    isLiked ? 'text-red-500 hover:text-red-600' : ''
                  }`}
                >
                  <Heart className={`h-3 w-3 sm:h-4 sm:w-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span className="min-w-[1ch]">{currentLikesCount}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenComments}
                  className="gap-0.5 sm:gap-1 h-7 sm:h-8 px-1.5 sm:px-3 text-xs sm:text-sm"
                >
                  <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="min-w-[1ch]">{currentCommentsCount}</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="gap-0.5 sm:gap-1 h-7 sm:h-8 px-1.5 sm:px-3 text-xs sm:text-sm"
                >
                  <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
              </div>

              {/* VIEW POST BUTTON */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleViewPost}
                className="gap-0.5 sm:gap-1 h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm flex-shrink-0"
              >
                <ExternalLink className="h-3 w-3 sm:h-3 sm:w-3" />
                <span className="hidden sm:inline">View Post</span>
                <span className="sm:hidden">View</span>
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Comments Modal */}
      <CommentsModal 
        postId={post.id}
        isOpen={showCommentsModal}
        onClose={handleCloseComments}
        onCommentAdded={handleCommentAdded}
      />
    </>
  );
};

export default PostCard;
