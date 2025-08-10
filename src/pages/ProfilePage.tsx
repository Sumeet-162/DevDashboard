
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { CommunityService, CommunityPost, type UserProfile } from '@/lib/communityService'
import { formatDistanceToNow } from 'date-fns'
import { getProfileDisplayName } from '@/lib/utils'
import Layout from '@/components/layout/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Github, 
  Code2, 
  User, 
  Calendar, 
  Mail, 
  MapPin, 
  Edit3, 
  Save, 
  X,
  Loader2,
  ExternalLink,
  Link2,
  Briefcase,
  Award,
  FileText,
  Plus,
  Trash2,
  Globe,
  Camera,
  Upload,
  Star,
  UserPlus,
  UserMinus,
  Users,
  Heart,
  Share2,
  MoreHorizontal
} from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Profile {
  id: string
  username: string | null
  full_name: string | null
  github_username: string | null
  leetcode_username: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  website: string | null
  skills: string[] | null
  resume_url: string | null
  job_title: string | null
  company: string | null
  experience_years: number | null
  is_profile_public: boolean | null
  twitter_username: string | null
  linkedin_url: string | null
  discord_username: string | null
  followers_count: number | null
  following_count: number | null
  posts_count: number | null
  total_likes_received: number | null
  created_at: string
  updated_at: string
}

interface UserProject {
  id: string
  title: string
  description: string | null
  tech_stack: string[] | null
  source_code_url: string | null
  live_url: string | null
  image_url: string | null
  is_featured: boolean
  display_order: number
}

interface UserAchievement {
  id: string
  title: string
  description: string | null
  category: string | null
  issuer: string | null
  date_achieved: string | null
  credential_url: string | null
  image_url: string | null
}

const ProfilePage = () => {
  const { user } = useAuth()
  const { userId } = useParams<{ userId: string }>()
  const isOwnProfile = !userId || userId === user?.id
  
  const [profile, setProfile] = useState<Profile | null>(null)
  const [communityProfile, setCommunityProfile] = useState<UserProfile | null>(null)
  const [userPosts, setUserPosts] = useState<CommunityPost[]>([])
  const [projects, setProjects] = useState<UserProject[]>([])
  const [achievements, setAchievements] = useState<UserAchievement[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [following, setFollowing] = useState(false)
  const [error, setError] = useState('')

  // Modal states
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showAchievementModal, setShowAchievementModal] = useState(false)
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [editingProject, setEditingProject] = useState<UserProject | null>(null)
  const [editingAchievement, setEditingAchievement] = useState<UserAchievement | null>(null)
  
  // Upload states
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [savingProject, setSavingProject] = useState(false)
  const [savingAchievement, setSavingAchievement] = useState(false)
  const [uploadingProjectImage, setUploadingProjectImage] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    github_username: '',
    leetcode_username: '',
    bio: '',
    location: '',
    website: '',
    job_title: '',
    company: '',
    experience_years: '',
    resume_url: '',
    skills: [] as string[],
    skillInput: ''
  })

  // Project form state
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    tech_stack: [] as string[],
    techInput: '',
    source_code_url: '',
    live_url: '',
    image_url: '',
    is_featured: false
  })

  // Achievement form state
  const [achievementForm, setAchievementForm] = useState({
    title: '',
    description: '',
    category: '',
    issuer: '',
    date_achieved: '',
    credential_url: '',
    image_url: ''
  })

  useEffect(() => {
    if (user) {
      fetchUserData()
      fetchUserPosts()
    }
  }, [user, userId])

  const fetchUserPosts = async () => {
    try {
      setLoadingPosts(true)
      const targetUserId = userId || user?.id
      
      if (!targetUserId) return

      const { posts } = await CommunityService.getPosts({ 
        authorId: targetUserId,
        sortBy: 'recent',
        limit: 20 
      })
      
      setUserPosts(posts)
    } catch (error) {
      console.error('Error fetching user posts:', error)
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive"
      })
    } finally {
      setLoadingPosts(false)
    }
  }

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const targetUserId = userId || user?.id
      
      if (!targetUserId) return

      // If viewing someone else's profile, get community profile data
      if (!isOwnProfile) {
        const communityProfileData = await CommunityService.getUserProfile(targetUserId)
        setCommunityProfile(communityProfileData)
        
        // For other users, we only show public information
        if (communityProfileData) {
          setProfile({
            id: communityProfileData.id,
            username: communityProfileData.username,
            full_name: communityProfileData.full_name,
            avatar_url: communityProfileData.avatar_url,
            bio: communityProfileData.bio,
            location: communityProfileData.location,
            website: communityProfileData.website,
            job_title: communityProfileData.job_title,
            company: communityProfileData.company,
            is_profile_public: communityProfileData.is_profile_public,
            twitter_username: communityProfileData.twitter_username,
            linkedin_url: communityProfileData.linkedin_url,
            discord_username: communityProfileData.discord_username,
            followers_count: communityProfileData.followers_count,
            following_count: communityProfileData.following_count,
            posts_count: communityProfileData.posts_count,
            total_likes_received: communityProfileData.total_likes_received,
            // Other fields can be null for other users
            github_username: null,
            leetcode_username: null,
            skills: null,
            resume_url: null,
            experience_years: null,
            created_at: '',
            updated_at: ''
          })
        }
        return
      }
      
      // For own profile, fetch full profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single()

      // Fetch projects (only for own profile)
      const { data: projectsData, error: projectsError } = await supabase
        .from('user_projects')
        .select('*')
        .eq('user_id', targetUserId)
        .order('display_order')

      // Fetch achievements (only for own profile)
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', targetUserId)
        .order('date_achieved', { ascending: false })

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError
      }

      setProfile(profileData)
      setProjects(projectsData || [])
      setAchievements(achievementsData || [])
      
      if (profileData) {
        setFormData({
          username: profileData.username || '',
          full_name: profileData.full_name || '',
          github_username: profileData.github_username || '',
          leetcode_username: profileData.leetcode_username || '',
          bio: profileData.bio || '',
          location: profileData.location || '',
          website: profileData.website || '',
          job_title: profileData.job_title || '',
          company: profileData.company || '',
          experience_years: profileData.experience_years?.toString() || '',
          resume_url: profileData.resume_url || '',
          skills: profileData.skills || [],
          skillInput: ''
        })
      }
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFollow = async () => {
    if (!userId || !communityProfile) return
    
    try {
      setFollowing(true)
      const { isFollowing, followersCount, followingCount } = await CommunityService.toggleFollow(userId)
      
      // Update both communityProfile and profile states to ensure consistency
      setCommunityProfile(prev => prev ? {
        ...prev,
        is_following: isFollowing,
        followers_count: followersCount
      } : null)
      
      // Also update the profile state if it exists
      setProfile(prev => prev ? {
        ...prev,
        followers_count: followersCount
      } : null)
      
      // If viewing own profile, also update following count
      if (isOwnProfile && profile) {
        setProfile(prev => prev ? {
          ...prev,
          following_count: followingCount
        } : null)
      }
      
      toast({
        title: "Success",
        description: isFollowing ? "User followed successfully" : "User unfollowed successfully"
      })
      
      // Refresh the profile data after a short delay to ensure database consistency
      setTimeout(() => {
        console.log('Refreshing profile data after follow action...');
        fetchUserData();
      }, 500);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setFollowing(false)
    }
  }

  const handleLikePost = async (postId: string) => {
    try {
      const isLiked = await CommunityService.togglePostLike(postId)
      
      // Update the post in the local state
      setUserPosts(prev => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              is_liked: isLiked,
              likes_count: isLiked ? post.likes_count + 1 : post.likes_count - 1
            }
          : post
      ))
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const handleDeletePost = async (postId: string) => {
    try {
      await CommunityService.deletePost(postId)
      setUserPosts(prev => prev.filter(post => post.id !== postId))
      
      toast({
        title: "Success",
        description: "Post deleted successfully"
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          username: formData.username || null,
          full_name: formData.full_name || null,
          github_username: formData.github_username || null,
          leetcode_username: formData.leetcode_username || null,
          bio: formData.bio || null,
          location: formData.location || null,
          website: formData.website || null,
          job_title: formData.job_title || null,
          company: formData.company || null,
          experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
          resume_url: formData.resume_url || null,
          skills: formData.skills,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      toast({
        title: "Success",
        description: "Profile updated successfully"
      })

      setEditing(false)
      fetchUserData()
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const addSkill = () => {
    if (formData.skillInput.trim() && !formData.skills.includes(formData.skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, prev.skillInput.trim()],
        skillInput: ''
      }))
    }
  }

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  // Project management functions
  const addTechToProject = () => {
    const tech = projectForm.techInput.trim()
    if (tech && !projectForm.tech_stack.includes(tech)) {
      setProjectForm(prev => ({
        ...prev,
        tech_stack: [...prev.tech_stack, tech],
        techInput: ''
      }))
    }
  }

  const removeTechFromProject = (techToRemove: string) => {
    setProjectForm(prev => ({
      ...prev,
      tech_stack: prev.tech_stack.filter(tech => tech !== techToRemove)
    }))
  }

  const openProjectModal = (project?: UserProject) => {
    if (project) {
      setEditingProject(project)
      setProjectForm({
        title: project.title,
        description: project.description || '',
        tech_stack: project.tech_stack || [],
        techInput: '',
        source_code_url: project.source_code_url || '',
        live_url: project.live_url || '',
        image_url: project.image_url || '',
        is_featured: project.is_featured || false
      })
    } else {
      setEditingProject(null)
      setProjectForm({
        title: '',
        description: '',
        tech_stack: [],
        techInput: '',
        source_code_url: '',
        live_url: '',
        image_url: '',
        is_featured: false
      })
    }
    setShowProjectModal(true)
  }

  const saveProject = async () => {
    try {
      setSavingProject(true)
      
      const projectData = {
        user_id: user?.id,
        title: projectForm.title,
        description: projectForm.description,
        tech_stack: projectForm.tech_stack,
        source_code_url: projectForm.source_code_url,
        live_url: projectForm.live_url,
        image_url: projectForm.image_url,
        is_featured: projectForm.is_featured,
        display_order: editingProject?.display_order || projects.length
      }

      console.log('Saving project data:', projectData) // Debug log

      let result
      if (editingProject) {
        result = await supabase
          .from('user_projects')
          .update(projectData)
          .eq('id', editingProject.id)
          .select()
      } else {
        result = await supabase
          .from('user_projects')
          .insert([projectData])
          .select()
      }

      console.log('Project save result:', result) // Debug log

      if (result.error) throw result.error

      toast({
        title: "Success",
        description: `Project ${editingProject ? 'updated' : 'added'} successfully`
      })

      setShowProjectModal(false)
      await fetchUserData() // Refresh data
    } catch (err: any) {
      console.error('Project save error:', err) // Debug log
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setSavingProject(false)
    }
  }

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('user_projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Project deleted successfully"
      })

      fetchUserData() // Refresh data
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      })
    }
  }

  // Achievement management functions
  const openAchievementModal = (achievement?: UserAchievement) => {
    if (achievement) {
      setEditingAchievement(achievement)
      setAchievementForm({
        title: achievement.title,
        description: achievement.description || '',
        category: achievement.category || '',
        issuer: achievement.issuer || '',
        date_achieved: achievement.date_achieved || '',
        credential_url: achievement.credential_url || '',
        image_url: achievement.image_url || ''
      })
    } else {
      setEditingAchievement(null)
      setAchievementForm({
        title: '',
        description: '',
        category: '',
        issuer: '',
        date_achieved: '',
        credential_url: '',
        image_url: ''
      })
    }
    setShowAchievementModal(true)
  }

  const saveAchievement = async () => {
    try {
      setSavingAchievement(true)
      
      const achievementData = {
        user_id: user?.id,
        title: achievementForm.title,
        description: achievementForm.description,
        category: achievementForm.category,
        issuer: achievementForm.issuer,
        date_achieved: achievementForm.date_achieved,
        credential_url: achievementForm.credential_url,
        image_url: achievementForm.image_url
      }

      if (editingAchievement) {
        const { error } = await supabase
          .from('user_achievements')
          .update(achievementData)
          .eq('id', editingAchievement.id)
      } else {
        const { error } = await supabase
          .from('user_achievements')
          .insert([achievementData])
      }

      if (error) throw error

      toast({
        title: "Success",
        description: `Achievement ${editingAchievement ? 'updated' : 'added'} successfully`
      })

      setShowAchievementModal(false)
      fetchUserData() // Refresh data
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setSavingAchievement(false)
    }
  }

  const deleteAchievement = async (achievementId: string) => {
    try {
      const { error } = await supabase
        .from('user_achievements')
        .delete()
        .eq('id', achievementId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Achievement deleted successfully"
      })

      fetchUserData() // Refresh data
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      })
    }
  }

  // Avatar upload function
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingAvatar(true)
      
      const file = event.target.files?.[0]
      if (!file) return

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 5MB",
          variant: "destructive"
        })
        return
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select an image file",
          variant: "destructive"
        })
        return
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}/avatar.${fileExt}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id)

      if (updateError) throw updateError

      toast({
        title: "Success",
        description: "Profile picture updated successfully"
      })

      setShowAvatarModal(false)
      fetchUserData() // Refresh data
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setUploadingAvatar(false)
    }
  }

  // Project image upload function
  const handleProjectImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingProjectImage(true)
      
      const file = event.target.files?.[0]
      if (!file) return

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 5MB",
          variant: "destructive"
        })
        return
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select an image file",
          variant: "destructive"
        })
        return
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}/projects/${Date.now()}.${fileExt}`

      // Upload to project-images bucket (fallback to avatars if project-images doesn't exist)
      let uploadResult = await supabase.storage
        .from('project-images')
        .upload(fileName, file)

      // If project-images bucket doesn't exist, use avatars bucket
      if (uploadResult.error && uploadResult.error.message.includes('Bucket not found')) {
        uploadResult = await supabase.storage
          .from('avatars')
          .upload(fileName, file)
      }

      if (uploadResult.error) throw uploadResult.error

      // Get public URL from the appropriate bucket
      const bucketName = uploadResult.error ? 'avatars' : 'project-images'
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName)

      // Update project form with the image URL
      setProjectForm(prev => ({
        ...prev,
        image_url: publicUrl
      }))

      toast({
        title: "Success",
        description: "Project image uploaded successfully"
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setUploadingProjectImage(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center md:items-start gap-4">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-2 border-primary/10">
                    <AvatarImage 
                      src={profile?.avatar_url || user?.user_metadata?.avatar_url} 
                      alt={profile?.full_name || 'User'} 
                    />
                    <AvatarFallback className="text-lg">
                      {getInitials(profile?.full_name || user?.user_metadata?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  {isOwnProfile && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                      onClick={() => setShowAvatarModal(true)}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="text-center md:text-left">
                  <h1 className="text-2xl font-bold">
                    {profile?.full_name || user?.user_metadata?.full_name || 'Anonymous User'}
                  </h1>
                  {profile?.username && (
                    <p className="text-muted-foreground">@{profile.username}</p>
                  )}
                  {profile?.job_title && (
                    <p className="text-primary font-medium">
                      {profile.job_title} 
                      {profile.company && ` at ${profile.company}`}
                    </p>
                  )}
                  {profile?.bio && (
                    <p className="text-sm text-muted-foreground mt-2 max-w-md">
                      {profile.bio}
                    </p>
                  )}
                  
                  {/* Follower/Following Stats */}
                  {(communityProfile || (profile && isOwnProfile)) && (
                    <div className="flex gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {communityProfile?.followers_count ?? profile?.followers_count ?? 0}
                        </span>
                        <span className="text-muted-foreground">followers</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {communityProfile?.following_count ?? profile?.following_count ?? 0}
                        </span>
                        <span className="text-muted-foreground">following</span>
                      </div>
                      {(communityProfile?.posts_count ?? profile?.posts_count) && (
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {communityProfile?.posts_count ?? profile?.posts_count ?? 0}
                          </span>
                          <span className="text-muted-foreground">posts</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {profile?.github_username && (
                    <Badge variant="secondary" className="gap-1">
                      <Github size={14} />
                      <a 
                        href={`https://github.com/${profile.github_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline flex items-center gap-1"
                      >
                        {profile.github_username}
                        <ExternalLink size={10} />
                      </a>
                    </Badge>
                  )}
                  {profile?.leetcode_username && (
                    <Badge variant="secondary" className="gap-1">
                      <Code2 size={14} />
                      <a 
                        href={`https://leetcode.com/${profile.leetcode_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline flex items-center gap-1"
                      >
                        {profile.leetcode_username}
                        <ExternalLink size={10} />
                      </a>
                    </Badge>
                  )}
                  {profile?.experience_years && (
                    <Badge variant="secondary" className="gap-1">
                      <Briefcase size={14} />
                      {profile.experience_years} years experience
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-2">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{user?.email}</span>
                  </div>
                  {profile?.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile?.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {profile.website}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Joined {formatDate(user?.created_at || '')}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  {isOwnProfile ? (
                    <>
                      <Dialog open={editing} onOpenChange={setEditing}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="gap-2">
                            <Edit3 size={14} />
                            Edit Profile
                          </Button>
                        </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name</Label>
                            <Input
                              id="full_name"
                              value={formData.full_name}
                              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                              placeholder="Enter your full name"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                              id="username"
                              value={formData.username}
                              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                              placeholder="Choose a username"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="job_title">Job Title</Label>
                            <Input
                              id="job_title"
                              value={formData.job_title}
                              onChange={(e) => setFormData(prev => ({ ...prev, job_title: e.target.value }))}
                              placeholder="e.g. Software Engineer"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="company">Company</Label>
                            <Input
                              id="company"
                              value={formData.company}
                              onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                              placeholder="Your current company"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                              id="location"
                              value={formData.location}
                              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                              placeholder="City, Country"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="experience_years">Years of Experience</Label>
                            <Input
                              id="experience_years"
                              type="number"
                              value={formData.experience_years}
                              onChange={(e) => setFormData(prev => ({ ...prev, experience_years: e.target.value }))}
                              placeholder="0"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="website">Website</Label>
                            <Input
                              id="website"
                              value={formData.website}
                              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                              placeholder="https://yourwebsite.com"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="resume_url">Resume URL</Label>
                            <Input
                              id="resume_url"
                              value={formData.resume_url}
                              onChange={(e) => setFormData(prev => ({ ...prev, resume_url: e.target.value }))}
                              placeholder="Link to your resume"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="github_username">GitHub Username</Label>
                            <Input
                              id="github_username"
                              value={formData.github_username}
                              onChange={(e) => setFormData(prev => ({ ...prev, github_username: e.target.value }))}
                              placeholder="Your GitHub username"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="leetcode_username">LeetCode Username</Label>
                            <Input
                              id="leetcode_username"
                              value={formData.leetcode_username}
                              onChange={(e) => setFormData(prev => ({ ...prev, leetcode_username: e.target.value }))}
                              placeholder="Your LeetCode username"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <Textarea
                            id="bio"
                            value={formData.bio}
                            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                            placeholder="Tell us about yourself..."
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Skills</Label>
                          <div className="flex gap-2">
                            <Input
                              value={formData.skillInput}
                              onChange={(e) => setFormData(prev => ({ ...prev, skillInput: e.target.value }))}
                              placeholder="Add a skill..."
                              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                            />
                            <Button type="button" onClick={addSkill} size="sm">
                              <Plus size={14} />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {formData.skills.map((skill, index) => (
                              <Badge key={index} variant="secondary" className="gap-1">
                                {skill}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                  onClick={() => removeSkill(skill)}
                                >
                                  <X size={10} />
                                </Button>
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2 pt-4">
                          <Button onClick={handleSave} disabled={saving} className="flex-1">
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Save size={14} className="mr-2" />
                            Save Changes
                          </Button>
                          <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                            <X size={14} className="mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {profile?.resume_url && (
                    <Button variant="outline" asChild>
                      <a 
                        href={profile.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="gap-2"
                      >
                        <FileText size={14} />
                        View Resume
                      </a>
                    </Button>
                  )}
                </>
              ) : (
                /* Follow button for other users */
                communityProfile && (
                  <Button 
                    onClick={handleFollow}
                    disabled={following}
                    variant={communityProfile.is_following ? "outline" : "default"}
                    className="gap-2"
                  >
                    {following ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : communityProfile.is_following ? (
                      <>
                        <UserMinus className="h-4 w-4" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Follow
                      </>
                    )}
                  </Button>
                )
              )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Skills Section */}
        {profile?.skills && profile.skills.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Skills & Technologies</CardTitle>
              <CardDescription>Programming languages and technologies I work with</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, index) => (
                  <Badge key={index} variant="outline" className="text-sm">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Tabs - Only show for own profile */}
        {isOwnProfile && (
        <Tabs defaultValue="projects" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="projects" className="mt-6 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Featured Projects</CardTitle>
                    <CardDescription>My top projects and contributions</CardDescription>
                  </div>
                  <Button onClick={() => openProjectModal()} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Project
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {projects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.slice(0, 6).map((project) => (
                      <Card key={project.id} className="project-card overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                        {/* Project Image */}
                        {project.image_url && (
                          <div className="relative h-48 w-full overflow-hidden">
                            <img 
                              src={project.image_url} 
                              alt={project.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                            {project.is_featured && (
                              <div className="featured-badge flex items-center gap-1">
                                <Star className="h-3 w-3 fill-current" />
                                <span>Featured</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <CardContent className="project-card-content p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2 flex-1">
                              <h3 className="font-semibold text-lg leading-tight text-foreground">{project.title}</h3>
                              {project.is_featured && !project.image_url && (
                                <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-900 dark:to-yellow-800 px-2 py-1 rounded-full">
                                  <Star className="h-3 w-3 text-yellow-600 dark:text-yellow-400 fill-current" />
                                  <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">Featured</span>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1 ml-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => openProjectModal(project)}
                                title="Edit project"
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => deleteProject(project.id)}
                                title="Delete project"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {project.description && (
                            <p className="project-description mb-4">
                              {project.description}
                            </p>
                          )}

                          {project.tech_stack && project.tech_stack.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {project.tech_stack.map((tech, index) => (
                                <Badge key={index} variant="secondary" className="text-xs px-2.5 py-1 font-medium">
                                  {tech}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="flex gap-2 pt-2 mt-auto">
                            {project.source_code_url && (
                              <Button variant="outline" size="sm" asChild className="flex-1">
                                <a 
                                  href={project.source_code_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-2"
                                >
                                  <Github size={14} />
                                  <span>Code</span>
                                </a>
                              </Button>
                            )}
                            {project.live_url && (
                              <Button variant="outline" size="sm" asChild className="flex-1">
                                <a 
                                  href={project.live_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-2"
                                >
                                  <ExternalLink size={14} />
                                  <span>Live Demo</span>
                                </a>
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Code2 className="mx-auto h-16 w-16 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-medium">No projects yet</h3>
                    <p className="text-muted-foreground mt-2">Start building and showcase your work!</p>
                    <Button onClick={() => openProjectModal()} className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Project
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="achievements" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Achievements & Certifications</CardTitle>
                    <CardDescription>Awards, certifications, and recognitions</CardDescription>
                  </div>
                  <Button onClick={() => openAchievementModal()} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Achievement
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {achievements.length > 0 ? (
                  <div className="space-y-4">
                    {achievements.map((achievement) => (
                      <div key={achievement.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                        <div className="rounded-full bg-primary/10 p-2 h-fit">
                          <Award size={16} className="text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium">{achievement.title}</h3>
                              {achievement.issuer && (
                                <p className="text-sm text-muted-foreground">
                                  Issued by {achievement.issuer}
                                </p>
                              )}
                              {achievement.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {achievement.description}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1 ml-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => openAchievementModal(achievement)}
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                onClick={() => deleteAchievement(achievement.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            {achievement.date_achieved && (
                              <span className="text-xs text-muted-foreground">
                                {formatDate(achievement.date_achieved)}
                              </span>
                            )}
                            {achievement.credential_url && (
                              <Button variant="outline" size="sm" asChild>
                                <a 
                                  href={achievement.credential_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink size={12} className="mr-1" />
                                  View Credential
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Award className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">No achievements yet</h3>
                    <p className="text-muted-foreground">Keep learning and growing!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="posts" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Community Posts</CardTitle>
                    <CardDescription>All posts shared in the community</CardDescription>
                  </div>
                  <Button onClick={() => window.location.href = '/community'} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Post
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingPosts ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-6 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : userPosts.length > 0 ? (
                  <div className="space-y-4">
                    {userPosts.map((post) => (
                      <Card key={post.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={post.author?.avatar_url} />
                              <AvatarFallback>
                                {getProfileDisplayName(post.author).split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-semibold text-lg">{post.title}</h3>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>{getProfileDisplayName(post.author)}</span>
                                    <span>•</span>
                                    <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                                  </div>
                                </div>
                                {isOwnProfile && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleDeletePost(post.id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              
                              <div className="prose prose-sm max-w-none">
                                <p className="text-foreground whitespace-pre-wrap line-clamp-3">
                                  {post.content}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-6 pt-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleLikePost(post.id)}
                                  className={`gap-2 ${post.is_liked ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                  <Heart className={`h-4 w-4 ${post.is_liked ? 'fill-current' : ''}`} />
                                  <span>{post.likes_count}</span>
                                </Button>
                                
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="gap-2 text-muted-foreground hover:text-foreground"
                                >
                                  <Users className="h-4 w-4" />
                                  <span>{post.comments_count}</span>
                                </Button>
                                
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="gap-2 text-muted-foreground hover:text-foreground"
                                  onClick={() => {
                                    navigator.share?.({
                                      title: post.title,
                                      text: post.content,
                                      url: window.location.origin + '/community'
                                    }).catch(() => {
                                      navigator.clipboard.writeText(post.title + '\n\n' + post.content);
                                      toast({
                                        title: "Copied to clipboard",
                                        description: "Post content copied to clipboard"
                                      });
                                    });
                                  }}
                                >
                                  <Share2 className="h-4 w-4" />
                                  <span>Share</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-16 w-16 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-medium">No posts yet</h3>
                    <p className="text-muted-foreground mt-2">
                      {isOwnProfile 
                        ? "Share your thoughts and connect with the community!" 
                        : "This user hasn't posted anything yet."
                      }
                    </p>
                    {isOwnProfile && (
                      <Button 
                        onClick={() => window.location.href = '/community'} 
                        className="mt-4"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Post
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        )}

        {/* For other users, show their posts */}
        {!isOwnProfile && communityProfile && (
          <Card>
            <CardHeader>
              <CardTitle>
                {profile?.full_name || 'User'}'s Posts
              </CardTitle>
              <CardDescription>
                Posts shared by this user in the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPosts ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ))}
                </div>
              ) : userPosts.length > 0 ? (
                <div className="space-y-4">
                  {userPosts.slice(0, 5).map((post) => (
                    <Card key={post.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={post.author?.avatar_url} />
                            <AvatarFallback>
                              {getProfileDisplayName(post.author).split(' ').map(n => n[0]).join('').substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div>
                              <h4 className="font-medium text-sm">{post.title}</h4>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                              </p>
                            </div>
                            
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {post.content}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs">
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {post.likes_count}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {post.comments_count}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {userPosts.length > 5 && (
                    <div className="text-center pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => window.location.href = '/community'}
                      >
                        View All Posts in Community
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-medium">No posts yet</h3>
                  <p className="text-muted-foreground">
                    This user hasn't shared any posts in the community yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Avatar Upload Modal - Only for own profile */}
        {isOwnProfile && (
        <>
        <Dialog open={showAvatarModal} onOpenChange={setShowAvatarModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Update Profile Picture</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage 
                    src={profile?.avatar_url || user?.user_metadata?.avatar_url} 
                    alt={profile?.full_name || 'User'} 
                  />
                  <AvatarFallback className="text-lg">
                    {getInitials(profile?.full_name || user?.user_metadata?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Label htmlFor="avatar-upload">Choose a new profile picture</Label>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supported formats: JPG, PNG, GIF. Max size: 5MB
                  </p>
                </div>
              </div>
              {uploadingAvatar && (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Uploading...</span>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Project Modal */}
        <Dialog open={showProjectModal} onOpenChange={setShowProjectModal}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProject ? 'Edit Project' : 'Add New Project'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project-title">Project Title *</Label>
                  <Input
                    id="project-title"
                    value={projectForm.title}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="My Awesome Project"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Project Image</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleProjectImageUpload}
                        disabled={uploadingProjectImage}
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        disabled={uploadingProjectImage}
                      >
                        {uploadingProjectImage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Input
                      placeholder="Or paste image URL"
                      value={projectForm.image_url}
                      onChange={(e) => setProjectForm(prev => ({ ...prev, image_url: e.target.value }))}
                    />
                    {projectForm.image_url && (
                      <div className="mt-3">
                        <Label className="text-sm font-medium">Preview:</Label>
                        <div className="relative mt-2">
                          <img 
                            src={projectForm.image_url} 
                            alt="Project preview" 
                            className="w-full h-40 object-cover rounded-lg border"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 h-6 w-6 p-0"
                            onClick={() => setProjectForm(prev => ({ ...prev, image_url: '' }))}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  value={projectForm.description}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your project..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="project-source">Source Code URL</Label>
                  <Input
                    id="project-source"
                    value={projectForm.source_code_url}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, source_code_url: e.target.value }))}
                    placeholder="https://github.com/username/project"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-live">Live Demo URL</Label>
                  <Input
                    id="project-live"
                    value={projectForm.live_url}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, live_url: e.target.value }))}
                    placeholder="https://myproject.vercel.app"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Technologies Used</Label>
                <div className="flex gap-2">
                  <Input
                    value={projectForm.techInput}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, techInput: e.target.value }))}
                    placeholder="Add a technology..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechToProject())}
                  />
                  <Button type="button" onClick={addTechToProject} size="sm">
                    <Plus size={14} />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {projectForm.tech_stack.map((tech, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {tech}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => removeTechFromProject(tech)}
                      >
                        <X size={10} />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <input
                  type="checkbox"
                  id="featured"
                  checked={projectForm.is_featured}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, is_featured: e.target.checked }))}
                  className="h-4 w-4"
                />
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <Label htmlFor="featured" className="font-medium">Featured Project</Label>
                </div>
                <p className="text-xs text-muted-foreground ml-auto">
                  Show with star badge
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={saveProject} disabled={savingProject || !projectForm.title} className="flex-1">
                  {savingProject && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save size={14} className="mr-2" />
                  {editingProject ? 'Update' : 'Add'} Project
                </Button>
                <Button variant="outline" onClick={() => setShowProjectModal(false)} disabled={savingProject}>
                  <X size={14} className="mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Achievement Modal */}
        <Dialog open={showAchievementModal} onOpenChange={setShowAchievementModal}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAchievement ? 'Edit Achievement' : 'Add New Achievement'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="achievement-title">Achievement Title *</Label>
                  <Input
                    id="achievement-title"
                    value={achievementForm.title}
                    onChange={(e) => setAchievementForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="AWS Certified Developer"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="achievement-category">Category</Label>
                  <Input
                    id="achievement-category"
                    value={achievementForm.category}
                    onChange={(e) => setAchievementForm(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="certification, award, course, etc."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="achievement-issuer">Issuer/Organization</Label>
                  <Input
                    id="achievement-issuer"
                    value={achievementForm.issuer}
                    onChange={(e) => setAchievementForm(prev => ({ ...prev, issuer: e.target.value }))}
                    placeholder="Amazon Web Services"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="achievement-date">Date Achieved</Label>
                  <Input
                    id="achievement-date"
                    type="date"
                    value={achievementForm.date_achieved}
                    onChange={(e) => setAchievementForm(prev => ({ ...prev, date_achieved: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="achievement-description">Description</Label>
                <Textarea
                  id="achievement-description"
                  value={achievementForm.description}
                  onChange={(e) => setAchievementForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this achievement..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="achievement-credential">Credential URL</Label>
                  <Input
                    id="achievement-credential"
                    value={achievementForm.credential_url}
                    onChange={(e) => setAchievementForm(prev => ({ ...prev, credential_url: e.target.value }))}
                    placeholder="Link to certificate or credential"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="achievement-image">Badge/Image URL</Label>
                  <Input
                    id="achievement-image"
                    value={achievementForm.image_url}
                    onChange={(e) => setAchievementForm(prev => ({ ...prev, image_url: e.target.value }))}
                    placeholder="Link to achievement badge"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={saveAchievement} disabled={savingAchievement || !achievementForm.title} className="flex-1">
                  {savingAchievement && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save size={14} className="mr-2" />
                  {editingAchievement ? 'Update' : 'Add'} Achievement
                </Button>
                <Button variant="outline" onClick={() => setShowAchievementModal(false)} disabled={savingAchievement}>
                  <X size={14} className="mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </>
        )}
      </div>
    </Layout>
  )
}

export default ProfilePage
