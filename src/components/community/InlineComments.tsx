import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Send, MessageCircle, MoreHorizontal, Edit3, Trash2 } from "lucide-react";
import { CommunityService, CommunityComment } from "@/lib/communityService";
import { useAuthSimple } from "@/hooks/useAuth.tsx";
import { getProfileDisplayName } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface InlineCommentsProps {
  postId: string;
  onCommentAdded?: () => void; // Callback to refresh post data
}

const InlineComments = ({ postId, onCommentAdded }: InlineCommentsProps) => {
  const { user } = useAuthSimple();
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  
  // Edit/delete states
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  useEffect(() => {
    loadComments();
  }, [postId]);

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

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const result = await CommunityService.createComment(
        postId,
        newComment.trim()
      );

      setComments(prev => [result.comment, ...prev]);
      setNewComment('');
      
      // Notify parent to refresh post data
      onCommentAdded?.();
      
    } catch (error) {
      console.error('Error creating comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = (comment: CommunityComment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.content);
  };

  const handleSaveEdit = async () => {
    if (!editingCommentId || !editText.trim()) return;

    try {
      await CommunityService.updateComment(editingCommentId, editText.trim());
      
      // Update the comment in the local state
      setComments(prev => prev.map(comment => 
        comment.id === editingCommentId 
          ? { ...comment, content: editText.trim(), updated_at: new Date().toISOString() }
          : comment
      ));
      
      setEditingCommentId(null);
      setEditText('');
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditText('');
  };

  const handleDeleteComment = (commentId: string) => {
    setDeletingCommentId(commentId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteComment = async () => {
    if (!deletingCommentId) return;

    try {
      await CommunityService.deleteComment(deletingCommentId);
      
      // Remove comment from local state
      setComments(prev => prev.filter(comment => comment.id !== deletingCommentId));
      
      setShowDeleteConfirm(false);
      setDeletingCommentId(null);
      
      // Notify parent to refresh post data
      onCommentAdded?.();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
        {/* Add Comment Form */}
        {user && (
          <div className="space-y-2 sm:space-y-3 border-b pb-3 sm:pb-4">
            <div className="flex gap-2 sm:gap-3">
              <Avatar className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0">
                <AvatarImage src={user?.user_metadata?.avatar_url} alt="You" />
                <AvatarFallback className="text-[10px] sm:text-xs">
                  {user?.email?.substring(0, 2).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[60px] sm:min-h-[80px] text-xs sm:text-sm"
                  maxLength={1000}
                />
                <div className="flex justify-between items-center flex-wrap gap-1">
                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                    {newComment.length}/1000 characters
                  </span>
                  <Button 
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim() || submitting}
                    size="sm"
                    className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
                  >
                    <Send className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                    {submitting ? 'Posting...' : 'Comment'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comments List */}
        {loading ? (
          <div className="text-center py-4 text-sm">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <MessageCircle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-xs sm:text-sm">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-2 sm:gap-3">
                <Avatar className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0">
                  <AvatarImage src={comment.author?.avatar_url} alt={getProfileDisplayName(comment.author)} />
                  <AvatarFallback className="text-[10px] sm:text-xs">
                    {getProfileDisplayName(comment.author).substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1 gap-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 min-w-0">
                      <span className="font-medium text-xs sm:text-sm truncate">
                        {getProfileDisplayName(comment.author)}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
                        <span className="truncate">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                        {comment.updated_at && comment.updated_at !== comment.created_at && (
                          <span>(edited)</span>
                        )}
                      </div>
                    </div>
                    {user && user.id === comment.user_id && (
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 sm:h-8 sm:w-8 p-0 flex-shrink-0">
                            <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32 sm:w-40">
                          <DropdownMenuItem onClick={() => handleEditComment(comment)} className="text-xs sm:text-sm">
                            <Edit3 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-destructive text-xs sm:text-sm"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  {editingCommentId === comment.id ? (
                    <div className="space-y-2 mt-2">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        placeholder="Edit your comment..."
                        rows={3}
                        className="resize-none text-xs sm:text-sm"
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleSaveEdit} size="sm" className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm">
                          Save
                        </Button>
                        <Button onClick={handleCancelEdit} variant="outline" size="sm" className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap break-words leading-relaxed mt-1">
                      {comment.content}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingCommentId(null);
        }}
        onConfirm={confirmDeleteComment}
        title="Delete Comment"
        description="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </Card>
  );
};

export default InlineComments;
