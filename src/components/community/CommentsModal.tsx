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
  onCommentAdded?: (newCommentsCount: number) => void; // Callback to refresh post data
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
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadComments();
      setActiveDropdown(null); // Close any open dropdowns when modal opens
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
      console.log('💬 CommentsModal: Creating comment for post', postId);
      
      const result = await CommunityService.createComment(
        postId,
        newComment.trim()
      );

      console.log('✅ CommentsModal: Comment created successfully', result.comment.id);
      setComments(prev => [result.comment, ...prev]);
      setNewComment('');
      
      console.log('🔄 CommentsModal: Calling onCommentAdded callback with count:', result.newCommentsCount);
      // Notify parent with the new comment count
      onCommentAdded?.(result.newCommentsCount);
      
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
      
      // For delete, we don't have the exact count, so trigger a refresh in PostCard
      // TODO: Update deleteComment to return new count like createComment
      if (onCommentAdded) {
        // Estimate: current count minus 1
        const estimatedNewCount = Math.max(0, comments.length - 1);
        onCommentAdded(estimatedNewCount);
      }
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
      <DialogContent 
        className="max-w-full sm:max-w-2xl w-[95vw] sm:w-full max-h-[95vh] sm:max-h-[90vh] p-3 sm:p-6"
        onClick={() => setActiveDropdown(null)} // Close dropdown when clicking outside
      >
        <DialogHeader className="pb-2 sm:pb-4">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            Comments
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            View and add comments for this post
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 sm:space-y-4 max-h-[70vh] sm:max-h-[60vh] overflow-y-auto">
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
                        <div className="relative flex-shrink-0">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Three dots clicked for comment:', comment.id);
                              setActiveDropdown(activeDropdown === comment.id ? null : comment.id);
                            }}
                          >
                            <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          
                          {activeDropdown === comment.id && (
                            <div className="fixed right-2 sm:right-4 z-[99999] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-xl py-1 min-w-[120px] sm:min-w-[140px]" 
                                 style={{ 
                                   position: 'fixed',
                                   zIndex: 99999,
                                   top: '50%',
                                   right: '10px',
                                   transform: 'translateY(-50%)'
                                 }}>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Edit clicked for comment:', comment.id);
                                  handleEditComment(comment);
                                  setActiveDropdown(null);
                                }}
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs sm:text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1.5 sm:gap-2"
                              >
                                <Edit3 className="h-3 w-3 sm:h-4 sm:w-4 text-gray-700 dark:text-gray-300" />
                                <span className="text-gray-900 dark:text-gray-100">Edit</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Delete clicked for comment:', comment.id);
                                  handleDeleteComment(comment.id);
                                  setActiveDropdown(null);
                                }}
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-left text-xs sm:text-sm hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-1.5 sm:gap-2"
                              >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                                <span className="text-red-600 dark:text-red-400">Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
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
                      <>
                        <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap break-words leading-relaxed mt-1">
                          {comment.content}
                        </p>
                        
                        {/* Comment Actions */}
                        <div className="flex items-center gap-1 sm:gap-2 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCommentLike(comment.id)}
                            disabled={!user}
                            className={`gap-0.5 sm:gap-1 h-6 sm:h-7 px-1 sm:px-2 text-xs ${
                              comment.is_liked ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground'
                            }`}
                          >
                            <Heart className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${comment.is_liked ? 'fill-current' : ''}`} />
                            <span className="min-w-[1ch]">{comment.likes_count || 0}</span>
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-0.5 sm:gap-1 h-6 sm:h-7 px-1 sm:px-2 text-xs text-muted-foreground"
                            disabled
                          >
                            <Reply className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            <span className="hidden sm:inline">Reply</span>
                          </Button>
                        </div>
                      </>
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
