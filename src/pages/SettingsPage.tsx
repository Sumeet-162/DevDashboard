import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  User, 
  Shield, 
  Bell, 
  RefreshCw, 
  Upload, 
  Save,
  Eye,
  EyeOff,
  Loader2,
  Check,
  AlertTriangle,
  Mail,
  Calendar,
  Settings
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const SettingsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [passwordChanging, setPasswordChanging] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    bio: '',
    location: '',
    website: '',
    job_title: '',
    company: '',
    github_username: '',
    leetcode_username: '',
    avatar_url: ''
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Avatar upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    securityAlerts: true,
    communityUpdates: false
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          full_name: data.full_name || '',
          username: data.username || '',
          bio: data.bio || '',
          location: data.location || '',
          website: data.website || '',
          job_title: data.job_title || '',
          company: data.company || '',
          github_username: data.github_username || '',
          leetcode_username: data.leetcode_username || '',
          avatar_url: data.avatar_url || ''
        });
        setAvatarPreview(data.avatar_url || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationChange = (setting: string, value: boolean) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image size should be less than 2MB",
          variant: "destructive"
        });
        return;
      }

      // Set file and show preview immediately
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));

      // Upload immediately and update database
      setAvatarUploading(true);
      try {
        const fileExt = file.name.split('.').pop();
        const timestamp = Date.now();
        const fileName = `${user.id}/avatar-${timestamp}.${fileExt}`;
        
        // Delete old avatar files first (cleanup)
        try {
          const { data: existingFiles } = await supabase.storage
            .from('avatars')
            .list(user.id);
          
          if (existingFiles && existingFiles.length > 0) {
            const filesToDelete = existingFiles.map(file => `${user.id}/${file.name}`);
            await supabase.storage
              .from('avatars')
              .remove(filesToDelete);
          }
        } catch (cleanupError) {
          console.warn('Error cleaning up old avatars:', cleanupError);
        }
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        
        const avatarUrlWithCacheBust = `${publicUrlData.publicUrl}?t=${timestamp}`;
        
        // Update profile in database immediately
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            avatar_url: avatarUrlWithCacheBust,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (updateError) throw updateError;

        // Update form data and preview
        setFormData(prev => ({
          ...prev,
          avatar_url: avatarUrlWithCacheBust
        }));
        
        setAvatarPreview(avatarUrlWithCacheBust);
        setAvatarFile(null);

        toast({
          title: "Success",
          description: "Profile picture updated successfully",
        });

      } catch (error) {
        console.error('Avatar upload error:', error);
        toast({
          title: "Error",
          description: "Failed to update profile picture",
          variant: "destructive"
        });
        // Reset preview on error
        setAvatarPreview(formData.avatar_url);
        setAvatarFile(null);
      } finally {
        setAvatarUploading(false);
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // No need to upload avatar here anymore as it's done immediately
      const { error } = await supabase
        .from('profiles')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    setPasswordChanging(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      toast({
        title: "Success",
        description: "Password changed successfully",
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive"
      });
    } finally {
      setPasswordChanging(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your profile information and avatar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Profile Picture</Label>
                  <div className="flex items-center gap-6">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={avatarPreview || formData.avatar_url} alt="Profile" />
                      <AvatarFallback>
                        <User className="h-10 w-10" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        id="avatar-upload"
                      />
                      <label
                        htmlFor="avatar-upload"
                        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-input rounded-md text-base font-medium hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ pointerEvents: avatarUploading ? 'none' : 'auto', opacity: avatarUploading ? 0.5 : 1 }}
                      >
                        {avatarUploading ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            Change Avatar
                          </>
                        )}
                      </label>
                      <p className="text-sm text-muted-foreground">
                        Max 2MB • JPG, PNG, GIF
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      placeholder="Your full name"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder="your-username"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="City, Country"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      placeholder="https://yourwebsite.com"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                {/* Professional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Professional</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="job_title">Job Title</Label>
                      <Input
                        id="job_title"
                        placeholder="Software Developer"
                        value={formData.job_title}
                        onChange={(e) => handleInputChange('job_title', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        placeholder="Your Company"
                        value={formData.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Social Profiles */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Social Profiles</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="github_username">GitHub Username</Label>
                      <Input
                        id="github_username"
                        placeholder="your-github-username"
                        value={formData.github_username}
                        onChange={(e) => handleInputChange('github_username', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="leetcode_username">LeetCode Username</Label>
                      <Input
                        id="leetcode_username"
                        placeholder="your-leetcode-username"
                        value={formData.leetcode_username}
                        onChange={(e) => handleInputChange('leetcode_username', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={loadProfile}>
                    Reset
                  </Button>
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={saving}
                    className="gap-2"
                  >
                    {saving ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new_password"
                      type={showPasswords.new ? "text" : "password"}
                      placeholder="Enter new password"
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                    >
                      {showPasswords.new ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm_password"
                      type={showPasswords.confirm ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={handleChangePassword} 
                  disabled={passwordChanging || !passwordData.newPassword || !passwordData.confirmPassword}
                  className="gap-2"
                >
                  {passwordChanging ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4" />
                  )}
                  {passwordChanging ? 'Changing...' : 'Change Password'}
                </Button>
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  View your account details and membership information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </Label>
                    <div className="p-2 bg-muted rounded-md">
                      <p className="text-base">{user?.email || 'Not available'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      Account Status
                    </Label>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <span className="text-base">Active</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Member Since
                    </Label>
                    <div className="p-2 bg-muted rounded-md">
                      <p className="text-base">
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Not available'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Last Updated
                    </Label>
                    <div className="p-2 bg-muted rounded-md">
                      <p className="text-base">
                        {user?.updated_at ? new Date(user.updated_at).toLocaleDateString() : 'Not available'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose what notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive important updates via email
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notifications in your browser
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={(checked) => handleNotificationChange('pushNotifications', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Security Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Important security and login notifications
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.securityAlerts}
                      onCheckedChange={(checked) => handleNotificationChange('securityAlerts', checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Community Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        New posts, comments, and community activity
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.communityUpdates}
                      onCheckedChange={(checked) => handleNotificationChange('communityUpdates', checked)}
                    />
                  </div>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Security alerts cannot be disabled for account safety.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default SettingsPage;
