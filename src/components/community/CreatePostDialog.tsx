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
import { X, ImagePlus, Hash, Send, Plus } from "lucide-react";
import { CommunityService, CommunityPost } from "@/services/communityService";
import { useAuthSimple } from "@/hooks/useAuth";
import { getProfileDisplayName } from "@/lib/utils";

interface CreatePostDialogProps {
  onPostCreated?: (post: CommunityPost) => void;
  trigger?: React.ReactNode;
}

const CreatePostDialog = ({ onPostCreated, trigger }: CreatePostDialogProps) => {
  const { user } = useAuthSimple();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: [] as string[],
    image_url: ''
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
      const post = await CommunityService.createPost({
        title: formData.title.trim(),
        content: formData.content.trim(),
        tags: formData.tags,
        image_url: formData.image_url.trim() || undefined
      });

      onPostCreated?.(post);
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        tags: [],
        image_url: ''
      });
      setCurrentTag('');
      setOpen(false);
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsSubmitting(false);
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

  const authorName = user?.email?.split('@')[0] || 'You';

  const defaultTrigger = (
    <Button className="gap-2">
      <Plus className="h-4 w-4" />
      New Post
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
          <DialogDescription>
            Share your thoughts, ideas, or questions with the community
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Author Preview */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user?.user_metadata?.avatar_url} alt={authorName} />
              <AvatarFallback>
                {authorName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{authorName}</p>
              <p className="text-xs text-muted-foreground">Posting to community</p>
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

          {/* Image URL */}
          <div className="space-y-2">
            <label htmlFor="image_url" className="text-sm font-medium flex items-center gap-2">
              <ImagePlus className="h-4 w-4" />
              Image URL (optional)
            </label>
            <Input
              id="image_url"
              placeholder="https://example.com/image.jpg"
              value={formData.image_url}
              onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
              type="url"
            />
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
                  {formData.image_url && (
                    <div className="rounded border">
                      <img 
                        src={formData.image_url} 
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
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!formData.title.trim() || !formData.content.trim() || isSubmitting}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Publishing...' : 'Publish Post'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;
