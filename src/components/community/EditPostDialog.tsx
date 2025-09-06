import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X, ImagePlus, Hash, Send, Upload, Loader2 } from "lucide-react";
import { CommunityService, CommunityPost } from "@/lib/communityService";
import { useAuthSimple } from "@/hooks/useAuth.tsx";
import { getProfileDisplayName } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface EditPostDialogProps {
  post: CommunityPost;
  isOpen: boolean;
  onClose: () => void;
  onPostUpdated?: (updatedPost: CommunityPost) => void;
}

const EditPostDialog = ({ post, isOpen, onClose, onPostUpdated }: EditPostDialogProps) => {
  const { user } = useAuthSimple();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: [] as string[],
    image_url: '',
    imageFile: null as File | null
  });
  
  const [currentTag, setCurrentTag] = useState('');

  // Initialize form data when post changes
  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || '',
        content: post.content || '',
        tags: post.tags || [],
        image_url: post.image_url || '',
        imageFile: null
      });
    }
  }, [post]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSubmitting || !post) return;

    if (!formData.title.trim() || !formData.content.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = formData.image_url;

      // Upload new image if file is selected
      if (formData.imageFile) {
        setImageUploading(true);
        const fileExt = formData.imageFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(fileName, formData.imageFile);

        if (uploadError) {
          console.error('Image upload error:', uploadError);
        } else {
          const { data: publicUrlData } = supabase.storage
            .from('post-images')
            .getPublicUrl(fileName);
          
          imageUrl = publicUrlData.publicUrl;
        }
        setImageUploading(false);
      }

      const updatedPost = await CommunityService.updatePost(
        post.id,
        formData.title.trim(),
        formData.content.trim(),
        formData.tags,
        imageUrl || undefined
      );

      onPostUpdated?.(updatedPost);
      onClose();
    } catch (error) {
      console.error('Error updating post:', error);
    } finally {
      setIsSubmitting(false);
      setImageUploading(false);
    }
  };

  const addTag = () => {
    const tag = currentTag.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      setFormData(prev => ({
        ...prev,
        imageFile: file,
        image_url: '' // Clear URL if file is selected
      }));
    }
  };

  const removeImage = () => {
    setFormData(prev => ({
      ...prev,
      imageFile: null,
      image_url: ''
    }));
  };

  const authorName = post?.author ? getProfileDisplayName(post.author) : 'Unknown User';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
          <DialogDescription>
            Update your post content and settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Author Preview */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Avatar className="h-8 w-8">
              <AvatarImage src={post?.author?.avatar_url} alt={authorName} />
              <AvatarFallback>
                {authorName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{authorName}</p>
              <p className="text-xs text-muted-foreground">Editing post</p>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title *
            </label>
            <Input
              id="title"
              placeholder="What's your post about?"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              maxLength={200}
              required
            />
            <p className="text-xs text-muted-foreground">
              {formData.title.length}/200 characters
            </p>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">
              Content *
            </label>
            <Textarea
              id="content"
              placeholder="Share your thoughts, code snippets, questions, or insights..."
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="min-h-[120px] resize-none"
              maxLength={10000}
              required
            />
            <p className="text-xs text-muted-foreground">
              {formData.content.length}/10,000 characters
            </p>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <ImagePlus className="h-4 w-4" />
              Update Image (optional)
            </label>
            
            {!formData.imageFile ? (
              <div>
                {/* Current image preview */}
                {formData.image_url && (
                  <div className="relative border rounded-lg p-2 mb-2">
                    <img
                      src={formData.image_url}
                      alt="Current image"
                      className="w-full h-32 object-cover rounded"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Current image
                    </p>
                  </div>
                )}
                
                {/* Upload new image */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Upload className="h-8 w-8" />
                    <span>{formData.image_url ? 'Replace image' : 'Upload image'}</span>
                    <span className="text-xs">Max size: 5MB • Supports: JPG, PNG, GIF</span>
                  </label>
                </div>
              </div>
            ) : (
              <div className="relative border rounded-lg p-2">
                <img
                  src={URL.createObjectURL(formData.imageFile)}
                  alt="New image preview"
                  className="w-full h-32 object-cover rounded"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  {formData.imageFile.name} ({(formData.imageFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Tags (optional)
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={handleTagKeyPress}
                maxLength={30}
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addTag}
                disabled={!currentTag.trim() || formData.tags.length >= 10}
              >
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs gap-1">
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.tags.length}/10 tags
            </p>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!formData.title.trim() || !formData.content.trim() || isSubmitting || imageUploading}
              className="gap-2"
            >
              {imageUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading Image...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {isSubmitting ? 'Updating...' : 'Update Post'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPostDialog;
