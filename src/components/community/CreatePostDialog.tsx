import { useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { X, ImagePlus, Hash, Send, Plus, Upload, Loader2 } from "lucide-react";
import { CommunityService, CommunityPost } from "@/lib/communityService";
import { useAuthSimple } from "@/hooks/useAuth.tsx";
import { getProfileDisplayName } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface CreatePostDialogProps {
  onPostCreated?: (post: CommunityPost) => void;
  trigger?: React.ReactNode;
  //to be triggered
}

const CreatePostDialog = ({ onPostCreated, trigger }: CreatePostDialogProps) => {
  const { user } = useAuthSimple();
  const [open, setOpen] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSubmitting) return;

    if (!formData.title.trim() || !formData.content.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = formData.image_url;

      // Upload image if file is selected
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

      const post = await CommunityService.createPostWithImage(
        formData.title.trim(),
        formData.content.trim(),
        imageUrl || undefined
      );

      onPostCreated?.(post);
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        tags: [],
        image_url: '',
        imageFile: null
      });
      setCurrentTag('');
      setOpen(false);
    } catch (error) {
      console.error('Error creating post:', error);
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

  const authorName = user?.email?.split('@')[0] || 'You';

  const defaultTrigger = (
    <Button className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-10 px-3 sm:px-4">
      <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
      <span className="hidden sm:inline">Create Post</span>
      <span className="sm:hidden">Post</span>
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-full sm:max-w-2xl w-[95vw] sm:w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader className="pb-2 sm:pb-4">
          <DialogTitle className="text-base sm:text-lg">Create New Post</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Share your thoughts, ideas, or questions with the community
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Author Preview */}
          <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/50 rounded-lg">
            <Avatar className="h-6 w-6 sm:h-8 sm:w-8">
              <AvatarImage src={user?.user_metadata?.avatar_url} alt={authorName} />
              <AvatarFallback className="text-[10px] sm:text-xs">
                {authorName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-xs sm:text-sm truncate">{authorName}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Posting to community</p>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1 sm:space-y-2">
            <label htmlFor="title" className="text-xs sm:text-sm font-medium">
              Title *
            </label>
            <Input
              id="title"
              placeholder="What's your post about?"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              maxLength={200}
              required
              className="text-xs sm:text-sm"
            />
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {formData.title.length}/200 characters
            </p>
          </div>

          {/* Content */}
          <div className="space-y-1 sm:space-y-2">
            <label htmlFor="content" className="text-xs sm:text-sm font-medium">
              Content *
            </label>
            <Textarea
              id="content"
              placeholder="Share your thoughts, code snippets, questions, or insights..."
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="min-h-[100px] sm:min-h-[120px] resize-none text-xs sm:text-sm"
              maxLength={10000}
              required
            />
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {formData.content.length}/10,000 characters
            </p>
          </div>

          {/* Image Upload */}
          <div className="space-y-1 sm:space-y-2">
            <label className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
              <ImagePlus className="h-3 w-3 sm:h-4 sm:w-4" />
              Upload Image (optional)
            </label>
            
            {!formData.imageFile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-6">
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
                  <span>Click to upload image</span>
                  <span className="text-xs">Max size: 5MB • Supports: JPG, PNG, GIF</span>
                </label>
              </div>
            ) : (
              <div className="relative border rounded-lg p-2">
                <img
                  src={URL.createObjectURL(formData.imageFile)}
                  alt="Preview"
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

          {/* Preview */}
          {(formData.title || formData.content) && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Preview</label>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.user_metadata?.avatar_url} alt={authorName} />
                      <AvatarFallback>
                        {authorName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{authorName}</p>
                      <p className="text-xs text-muted-foreground">Just now</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {formData.title && (
                    <h3 className="font-semibold">{formData.title}</h3>
                  )}
                  {formData.content && (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {formData.content.substring(0, 200)}
                      {formData.content.length > 200 && '...'}
                    </p>
                  )}
                  {(formData.image_url || formData.imageFile) && (
                    <div className="rounded border">
                      <img 
                        src={formData.imageFile ? URL.createObjectURL(formData.imageFile) : formData.image_url} 
                        alt="Preview" 
                        className="w-full h-32 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Submit */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 sm:pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
              className="order-2 sm:order-1 w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-10"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!formData.title.trim() || !formData.content.trim() || isSubmitting || imageUploading}
              className="gap-1 sm:gap-2 order-1 sm:order-2 w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-10"
            >
              {imageUploading ? (
                <>
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  <span className="hidden sm:inline">Uploading Image...</span>
                  <span className="sm:hidden">Uploading...</span>
                </>
              ) : (
                <>
                  <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{isSubmitting ? 'Publishing...' : 'Publish Post'}</span>
                  <span className="sm:hidden">{isSubmitting ? 'Publishing...' : 'Publish'}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;
