import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Heart, 
  MessageCircle, 
  Send, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  Reply,
  Clock
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommunityService, PostComment } from "@/services/communityService";
import { useAuthSimple } from "@/hooks/useAuth";
import { getProfileDisplayName } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface CommentsSectionProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

const CommentsSection = ({ postId, isOpen, onClose }: CommentsSectionProps) => {
  const { user } = useAuthSimple();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, postId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const fetchedComments = await CommunityService.getPostComments(postId);
      setComments(fetchedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (parentCommentId?: string) => {
    if (!user || !newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const comment = await CommunityService.createComment({
        post_id: postId,
        content: newComment.trim(),
        parent_comment_id: parentCommentId
      });

      if (parentCommentId) {
        // Add reply to parent comment
        setComments(prev => prev.map(c => 
          c.id === parentCommentId 
            ? { ...c, replies: [...(c.replies || []), comment] }
            : c
        ));
      } else {
        // Add new top-level comment
        setComments(prev => [comment, ...prev]);
      }

      setNewComment('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!user) return;

    try {
      const { isLiked, likesCount } = await CommunityService.toggleCommentLike(commentId);
      
      // Update comment likes in state
      const updateComment = (comments: PostComment[]): PostComment[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, is_liked: isLiked, likes_count: likesCount };
          }
          if (comment.replies) {
            return { ...comment, replies: updateComment(comment.replies) };
          }
          return comment;
        });
      };

      setComments(prev => updateComment(prev));
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim() || submitting) return;

    setSubmitting(true);
    try {
      const updatedComment = await CommunityService.updateComment(commentId, editContent.trim());
      
      const updateComment = (comments: PostComment[]): PostComment[] => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, content: updatedComment.content, updated_at: updatedComment.updated_at };
          }
          if (comment.replies) {
            return { ...comment, replies: updateComment(comment.replies) };
          }
          return comment;
        });
      };

      setComments(prev => updateComment(prev));
      setEditingComment(null);
      setEditContent('');
    } catch (error) {
      console.error('Error updating comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await CommunityService.deleteComment(commentId);
      
      const removeComment = (comments: PostComment[]): PostComment[] => {
        return comments.filter(comment => {
          if (comment.id === commentId) return false;
          if (comment.replies) {
            comment.replies = removeComment(comment.replies);
          }
          return true;
        });
      };

      setComments(prev => removeComment(prev));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const CommentItem = ({ comment, isReply = false, depth = 0 }: { comment: PostComment; isReply?: boolean; depth?: number }) => {
    const isAuthor = user?.id === comment.user_id;
    const authorName = comment.author ? getProfileDisplayName(comment.author) : 'Unknown User';
    const isEditing = editingComment === comment.id;
    const maxDepth = 3; // Limit nesting depth for UI readability

    return (
      <div className={`space-y-3 ${isReply ? `ml-${Math.min(depth * 4, 12)} border-l-2 border-muted pl-4` : ''}`}>
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={comment.author?.avatar_url} alt={authorName} />
            <AvatarFallback className="text-xs">
              {authorName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{authorName}</span>
                {comment.author?.username && (
                  <span className="text-xs text-muted-foreground">@{comment.author.username}</span>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <time title={new Date(comment.created_at).toLocaleString()}>
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </time>
                  {comment.updated_at !== comment.created_at && (
                    <Badge variant="outline" className="text-xs">Edited</Badge>
                  )}
                </div>
              </div>

              {isAuthor && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setEditingComment(comment.id);
                      setEditContent(comment.content);
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[60px]"
                  maxLength={1000}
                />
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleEditComment(comment.id)}
                    disabled={!editContent.trim() || submitting}
                  >
                    Save
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setEditingComment(null);
                      setEditContent('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>

                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLikeComment(comment.id)}
                    disabled={!user}
                    className={`gap-1 h-6 px-2 text-xs ${comment.is_liked ? 'text-red-500 hover:text-red-600' : ''}`}
                  >
                    <Heart className={`h-3 w-3 ${comment.is_liked ? 'fill-current' : ''}`} />
                    {comment.likes_count > 0 && <span>{comment.likes_count}</span>}
                  </Button>

                  {depth < maxDepth && user && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      className="gap-1 h-6 px-2 text-xs"
                    >
                      <Reply className="h-3 w-3" />
                      Reply
                    </Button>
                  )}
                </div>

                {replyingTo === comment.id && (
                  <div className="space-y-2">
                    <Textarea
                      placeholder={`Reply to ${authorName}...`}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[60px]"
                      maxLength={1000}
                    />
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleSubmitComment(comment.id)}
                        disabled={!newComment.trim() || submitting}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Reply
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setReplyingTo(null);
                          setNewComment('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Nested Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-3">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} isReply={true} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Comments
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto space-y-4">
          {/* Add Comment Form */}
          {user && !replyingTo && (
            <div className="space-y-3 border-b pb-4">
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={user?.user_metadata?.avatar_url} alt="You" />
                  <AvatarFallback className="text-xs">
                    {user?.email?.substring(0, 2).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[80px]"
                    maxLength={1000}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      {newComment.length}/1000 characters
                    </span>
                    <Button 
                      onClick={() => handleSubmitComment()}
                      disabled={!newComment.trim() || submitting}
                      size="sm"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Comment
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-6">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              ))
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No comments yet. Be the first to comment!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommentsSection;
