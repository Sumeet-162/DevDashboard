import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Upload, User, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileSetupDialogProps {
  isOpen: boolean;
  onComplete: () => void;
}

const ProfileSetupDialog = ({ isOpen, onComplete }: ProfileSetupDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    bio: '',
    avatar_url: user?.user_metadata?.avatar_url || '',
    avatarFile: null as File | null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      let avatarUrl = formData.avatar_url;

      // Upload avatar if file is selected
      if (formData.avatarFile) {
        setAvatarUploading(true);
        const fileExt = formData.avatarFile.name.split('.').pop();
        const timestamp = Date.now();
        const fileName = `${user.id}/avatar-${timestamp}.${fileExt}`;
        
        // Delete old avatar files to prevent storage bloat
        try {
          const { data: existingFiles } = await supabase.storage
            .from('avatars')
            .list(`${user.id}/`, {
              limit: 100,
              search: 'avatar-'
            });

          if (existingFiles && existingFiles.length > 0) {
            const filesToDelete = existingFiles.map(file => `${user.id}/${file.name}`);
            await supabase.storage
              .from('avatars')
              .remove(filesToDelete);
          }
        } catch (error) {
          console.warn('Could not clean up old avatars:', error);
        }
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, formData.avatarFile);

        if (uploadError) {
          console.error('Avatar upload error:', uploadError);
        } else {
          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          
          avatarUrl = `${publicUrlData.publicUrl}?t=${timestamp}`;
        }
        setAvatarUploading(false);
      }

      // Create/update profile
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: formData.full_name.trim() || null,
          username: formData.username.trim() || null,
          bio: formData.bio.trim() || null,
          avatar_url: avatarUrl || null,
          email: user.email,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Profile creation error:', error);
        throw error;
      }

      onComplete();
    } catch (error) {
      console.error('Error setting up profile:', error);
    } finally {
      setLoading(false);
      setAvatarUploading(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size should be less than 2MB');
        return;
      }

      setFormData(prev => ({
        ...prev,
        avatarFile: file,
        avatar_url: '' // Clear URL if file is selected
      }));
    }
  };

  const generateUsername = () => {
    const name = formData.full_name.trim().toLowerCase().replace(/\s+/g, '');
    const randomNum = Math.floor(Math.random() * 1000);
    setFormData(prev => ({
      ...prev,
      username: name ? `${name}${randomNum}` : `user${randomNum}`
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md [&>button]:hidden">
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            Let's set up your developer profile. You can always update this later in settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Profile Picture</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage 
                  src={formData.avatarFile ? URL.createObjectURL(formData.avatarFile) : formData.avatar_url} 
                  alt="Profile" 
                />
                <AvatarFallback>
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                <label
                  htmlFor="avatar-upload"
                  className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 border border-input rounded-md text-sm font-medium hover:bg-accent transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Upload Photo
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Max 2MB • JPG, PNG, GIF
                </p>
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              placeholder="Enter your full name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              maxLength={100}
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="flex gap-2">
              <Input
                id="username"
                placeholder="your-username"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') }))}
                maxLength={50}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateUsername}
                disabled={!formData.full_name.trim()}
              >
                Generate
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This will be your unique identifier on DevDash
            </p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio (Optional)</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about yourself..."
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {formData.bio.length}/500 characters
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onComplete}
              disabled={loading || avatarUploading}
              className="flex-1"
            >
              Skip for now
            </Button>
            <Button 
              type="submit" 
              disabled={loading || avatarUploading || !formData.full_name.trim()}
              className="flex-1"
            >
              {avatarUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Uploading...
                </>
              ) : loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'Complete Setup'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileSetupDialog;
