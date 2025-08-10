
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Search, 
  Filter, 
  TrendingUp, 
  Calendar, 
  Heart,
  MessageSquare,
  Star,
  UserPlus,
  Zap
} from "lucide-react";
import { useAuthSimple } from "@/hooks/useAuth.tsx";
import CommunityService, { CommunityPost, CommunityMember } from "@/lib/communityService";
import { supabase } from "@/lib/supabase";
import PostCard from "@/components/community/PostCard";
import CreatePostDialog from "@/components/community/CreatePostDialog";
import CommunityMemberCard from "@/components/community/CommunityMemberCard";

const CommunityPage = () => {
  const { user } = useAuthSimple();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [profiles, setProfiles] = useState<CommunityMember[]>([]);
  const [communityStats, setCommunityStats] = useState({
    totalMembers: 0,
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [profilesLoading, setProfilesLoading] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [profileSearchTerm, setProfileSearchTerm] = useState('');
  const [postsSortBy, setPostsSortBy] = useState<'recent' | 'popular' | 'featured'>('recent');
  const [profilesSortBy, setProfilesSortBy] = useState<'newest' | 'popular' | 'active'>('newest');
  const [selectedTab, setSelectedTab] = useState('popular');

  // Pagination states
  const [postsPage, setPostsPage] = useState(1);
  const [profilesPage, setProfilesPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [hasMoreProfiles, setHasMoreProfiles] = useState(true);

  useEffect(() => {
    loadInitialData();
    
    // Add debugging for testing
    (window as any).testFollow = {
      fixAllCounts: () => CommunityService.fixAllUserCounts(),
      refreshCounts: (userId: string) => CommunityService.refreshUserCounts(userId),
      getCurrentUser: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
      },
      checkUser: async (userId: string) => {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, full_name, followers_count, following_count')
          .eq('id', userId)
          .single();
        
        const { count: actualFollowers } = await supabase
          .from('user_follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', userId);
          
        const { count: actualFollowing } = await supabase
          .from('user_follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', userId);
          
        return {
          profile,
          actualFollowers,
          actualFollowing,
          error
        };
      },
      checkFollowRelation: async (targetUserId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;
        
        const { data: relation, error } = await supabase
          .from('user_follows')
          .select('*')
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId)
          .single();
          
        return { relation, error };
      }
    };
  }, []);

  useEffect(() => {
    loadPosts(true);
  }, [selectedTab, postsSortBy]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      loadProfiles(true);
    }, 300);
    return () => clearTimeout(debounce);
  }, [profileSearchTerm, profilesSortBy]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [postsResult, profilesResult, stats] = await Promise.all([
        loadPosts(true),
        loadProfiles(true),
        CommunityService.getCommunityStats()
      ]);
      setCommunityStats(stats);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async (reset = false) => {
    setPostsLoading(true);
    try {
      const page = reset ? 1 : postsPage;
      const offset = (page - 1) * 10;
      const options: any = {
        offset,
        limit: 10,
        sortBy: postsSortBy
      };

      if (selectedTab === 'following') {
        options.followingOnly = true;
      }

      const { posts: newPosts, total } = await CommunityService.getPosts(options);
      
      if (reset) {
        setPosts(newPosts);
        setPostsPage(1);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }
      
      // Calculate if there are more posts based on total and current length
      const currentTotal = reset ? newPosts.length : posts.length + newPosts.length;
      setHasMorePosts(currentTotal < total);
      if (!reset) {
        setPostsPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const loadProfiles = async (reset = false) => {
    setProfilesLoading(true);
    try {
      const page = reset ? 1 : profilesPage;
      const offset = (page - 1) * 12;
      const { members: newProfiles, total } = await CommunityService.getMembers({
        offset,
        limit: 12,
        search: profileSearchTerm,
        sortBy: profilesSortBy as 'active' | 'popular' | 'newest'
      });
      
      if (reset) {
        setProfiles(newProfiles);
        setProfilesPage(1);
      } else {
        setProfiles(prev => [...prev, ...newProfiles]);
      }
      
      // Calculate if there are more profiles based on total and current length
      const currentTotal = reset ? newProfiles.length : profiles.length + newProfiles.length;
      setHasMoreProfiles(currentTotal < total);
      if (!reset) {
        setProfilesPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setProfilesLoading(false);
    }
  };

  const handlePostCreated = (newPost: CommunityPost) => {
    setPosts(prev => [newPost, ...prev]);
    setCommunityStats(prev => ({
      ...prev,
      totalPosts: prev.totalPosts + 1
    }));
  };

  const handlePostLike = (postId: string, isLiked: boolean, likesCount: number) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, is_liked: isLiked, likes_count: likesCount }
        : post
    ));
  };

  const handleFollowChange = (profileId: string, isFollowing: boolean, followersCount: number) => {
    console.log('handleFollowChange called:', { profileId, isFollowing, followersCount });
    
    setProfiles(prev => prev.map(profile => 
      profile.id === profileId 
        ? { ...profile, is_following: isFollowing, followers_count: followersCount }
        : profile
    ));
    
    // Refresh the profiles to get accurate data from server
    setTimeout(() => {
      console.log('Refreshing profiles after follow change...');
      loadProfiles(true);
    }, 1000);
  };

  const StatCard = ({ icon: Icon, title, value, subtitle }: any) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-96 mt-2" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          
          <Skeleton className="h-10 w-full" />
          
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Community</h1>
            <p className="text-muted-foreground">Connect with fellow developers and share knowledge</p>
          </div>
          
          {user && (
            <CreatePostDialog onPostCreated={handlePostCreated} />
          )}
        </div>

        {/* Community Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            title="Total Members"
            value={communityStats.totalMembers}
            subtitle="Active developers"
          />
          <StatCard
            icon={MessageSquare}
            title="Posts Shared"
            value={communityStats.totalPosts}
            subtitle="Knowledge posts"
          />
          <StatCard
            icon={Heart}
            title="Total Likes"
            value={communityStats.totalLikes}
            subtitle="Community engagement"
          />
          <StatCard
            icon={Zap}
            title="Comments"
            value={communityStats.totalComments}
            subtitle="Discussions"
          />
        </div>
        
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="popular" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Popular
            </TabsTrigger>
            <TabsTrigger value="recent" className="gap-2">
              <Calendar className="h-4 w-4" />
              Recent
            </TabsTrigger>
            <TabsTrigger value="following" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Following
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2">
              <Users className="h-4 w-4" />
              Members
            </TabsTrigger>
          </TabsList>

          {/* Posts Tabs */}
          {['popular', 'recent', 'following'].includes(selectedTab) && (
            <TabsContent value={selectedTab} className="mt-6 space-y-6">
              {/* Posts Controls */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex gap-2">
                  <div className="relative flex-1 sm:w-80">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="search" 
                      placeholder="Search posts..." 
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Select value={postsSortBy} onValueChange={(value: any) => setPostsSortBy(value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Most Recent</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="featured">Featured</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Posts List */}
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={handlePostLike}
                  />
                ))}
                
                {postsLoading && (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-48" />
                    ))}
                  </div>
                )}
                
                {posts.length === 0 && !postsLoading && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                      <p className="text-muted-foreground mb-4">
                        {selectedTab === 'following' 
                          ? "Posts from people you follow will appear here"
                          : "Be the first to share something with the community!"
                        }
                      </p>
                      {user && selectedTab !== 'following' && (
                        <CreatePostDialog onPostCreated={handlePostCreated} />
                      )}
                    </CardContent>
                  </Card>
                )}
                
                {hasMorePosts && posts.length > 0 && (
                  <div className="text-center">
                    <Button 
                      variant="outline" 
                      onClick={() => loadPosts(false)}
                      disabled={postsLoading}
                    >
                      {postsLoading ? 'Loading...' : 'Load More Posts'}
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          )}

          {/* Members Tab */}
          <TabsContent value="members" className="mt-6 space-y-6">
            {/* Members Controls */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex gap-2">
                <div className="relative flex-1 sm:w-80">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="search" 
                    placeholder="Search members..." 
                    className="pl-8"
                    value={profileSearchTerm}
                    onChange={(e) => setProfileSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Select value={profilesSortBy} onValueChange={(value: any) => setProfilesSortBy(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Recently Joined</SelectItem>
                    <SelectItem value="most_followers">Most Followers</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Members Grid */}
            {profilesLoading && profiles.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-80" />
                ))}
              </div>
            ) : profiles.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {profiles.map((profile) => (
                    <CommunityMemberCard
                      key={profile.id}
                      profile={profile}
                      onFollowChange={handleFollowChange}
                    />
                  ))}
                </div>
                
                {profilesLoading && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-80" />
                    ))}
                  </div>
                )}
                
                {hasMoreProfiles && (
                  <div className="text-center">
                    <Button 
                      variant="outline" 
                      onClick={() => loadProfiles(false)}
                      disabled={profilesLoading}
                    >
                      {profilesLoading ? 'Loading...' : 'Load More Members'}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No members found</h3>
                  <p className="text-muted-foreground">
                    {profileSearchTerm ? 'Try adjusting your search terms' : 'Be the first to join our community!'}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default CommunityPage;
