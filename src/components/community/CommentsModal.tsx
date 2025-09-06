import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MessageCircle, 
  Send, 
  Heart, 
  MoreHorizontal, 
  Edit3, 
  Trash2, 
  Reply 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommunityService, CommunityComment } from "@/lib/communityService";
import { useAuthSimple } from "@/hooks/useAuth.tsx";
import { getProfileDisplayName } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface CommentsModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded?: () => void; // Callback to refresh post data
}

const CommentsModal = ({ postId, isOpen, onClose, onCommentAdded }: CommentsModalProps) => {
  const { user } = useAuthSimple();
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  
  // Edit/Delete state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

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

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const comment = await CommunityService.createComment(
        postId,
        newComment.trim()
      );

      setComments(prev => [comment, ...prev]);
      setNewComment('');
      
      // Notify parent to refresh post data (for updated comment count)
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
      
      // Notify parent to refresh post data (for updated comment count)
      onCommentAdded?.();
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleCommentLike = async (commentId: string) => {
    if (!user) return;

    try {
      const { isLiked, likesCount } = await CommunityService.toggleCommentLike(commentId);
      
      // Update the comment in local state
      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, is_liked: isLiked, likes_count: likesCount }
          : comment
      ));
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comments
          </DialogTitle>
          <DialogDescription>
            View and add comments for this post
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Add Comment Form */}
          {user && (
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
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim() || submitting}
                      size="sm"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      {submitting ? 'Posting...' : 'Comment'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Comments List */}
          {loading ? (
            <div className="text-center py-4">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={comment.author?.avatar_url} alt={getProfileDisplayName(comment.author)} />
                    <AvatarFallback className="text-xs">
                      {getProfileDisplayName(comment.author).substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {getProfileDisplayName(comment.author)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                        {comment.updated_at && comment.updated_at !== comment.created_at && (
                          <span className="text-xs text-muted-foreground">(edited)</span>
                        )}
                      </div>
                      {user && user.id === comment.user_id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditComment(comment)}>
                              <Edit3 className="h-4 w-4 mr-2" />
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
                    {editingCommentId === comment.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          placeholder="Edit your comment..."
                          rows={3}
                          className="resize-none"
                        />
                        <div className="flex gap-2">
                          <Button onClick={handleSaveEdit} size="sm">
                            Save
                          </Button>
                          <Button onClick={handleCancelEdit} variant="outline" size="sm">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
      
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
    </Dialog>
  );
};

export default CommentsModal;
