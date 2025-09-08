
import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import WelcomeCard from "@/components/dashboard/WelcomeCard";
import StatsCard from "@/components/dashboard/StatsCard";
import GitHubCard from "@/components/dashboard/GitHubCard";
import LeetCodeCard from "@/components/dashboard/LeetCodeCard";
import NewsCard from "@/components/dashboard/NewsCard";
import PostCard from "@/components/dashboard/PostCard";
import UserInfoCard from "@/components/dashboard/UserInfoCard";
import ProductivityCard from "@/components/dashboard/ProductivityCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { CommunityService, CommunityPost } from "@/lib/communityService";
import LeetCodeService from "@/services/leetcodeService";
import { githubService } from "@/services/githubService";
import { 
  Code2, 
  Github, 
  Users, 
  User, 
  TrendingUp, 
  Calendar,
  Heart,
  MessageSquare,
  ExternalLink,
  Trophy,
  Target,
  Activity,
  Zap,
  Clock,
  GitBranch,
  Star,
  RotateCcw,
  Timer
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getProfileDisplayName } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface DashboardStats {
  profile: {
    followers_count: number;
    following_count: number;
    posts_count: number;
    total_likes_received: number;
    github_username?: string;
    leetcode_username?: string;
  } | null;
  github: {
    contributions: number;
    totalRepos: number;
    stars: number;
  } | null;
  leetcode: {
    totalSolved: number;
    easySolved: number;
    mediumSolved: number;
    hardSolved: number;
    ranking: number;
  } | null;
  community: {
    totalMembers: number;
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
  } | null;
  recentPosts: CommunityPost[];
}

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    profile: null,
    github: null,
    leetcode: null,
    community: null,
    recentPosts: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      
      // Auto-refresh every 30 seconds to pick up any follower/following changes
      const refreshInterval = setInterval(() => {
        console.log('Auto-refreshing dashboard data...');
        fetchDashboardData();
      }, 30000);

      return () => clearInterval(refreshInterval);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // First fetch profile data to get GitHub username
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('followers_count, following_count, posts_count, total_likes_received, github_username, leetcode_username')
        .eq('id', user?.id)
        .single();
      
      if (profileError) {
        console.error('Error fetching profile data:', profileError);
      }
      
      console.log('Profile data fetched:', profileData);
      
      // Now fetch other data in parallel, using the GitHub username
      const [
        communityStats,
        recentPosts,
        githubData,
        leetcodeData
      ] = await Promise.allSettled([
        // Community stats  
        CommunityService.getCommunityStats(),
        
        // Recent community posts
        CommunityService.getPosts({ limit: 5, sortBy: 'recent' }),
        
        // GitHub data (if username available)
        (async () => {
          try {
            console.log('🔍 Profile data for GitHub lookup:', profileData);
            
            if (!profileData?.github_username) {
              console.log('❌ No GitHub username found in profile. Profile data:', profileData);
              console.log('🔄 Returning null for new user without GitHub credentials');
              
              // Return null to indicate no GitHub data available
              return null;
            }
            
            console.log('📡 Fetching GitHub stats for username:', profileData.github_username);
            const stats = await githubService.getUserStats(profileData.github_username);
            console.log('📊 GitHub stats received:', stats);
            
            // Ensure we return the correct structure with proper mapping
            const formattedStats = {
              contributions: stats.contributions || 0,
              totalRepos: stats.totalRepos || 0,
              stars: stats.totalStars || stats.stars || 0
            };
            
            console.log('✅ Formatted GitHub stats:', formattedStats);
            return formattedStats;
          } catch (error) {
            console.error('💥 Error fetching GitHub stats:', error);
            
            // Return null for error cases when user hasn't connected GitHub
            if (!profileData?.github_username) {
              return null;
            }
            
            // Only use fallback data if user has GitHub username but API failed
            const fallbackStats = {
              contributions: 245,
              totalRepos: 42,
              stars: 150
            };
            console.log('📦 Using dashboard fallback stats:', fallbackStats);
            return fallbackStats;
          }
        })(),
        
        // LeetCode data (if connected)
        (async () => {
          try {
            // Check if user has connected their LeetCode account by checking profile
            if (!profileData?.leetcode_username) {
              console.log('❌ No LeetCode username found in profile - user has not connected LeetCode');
              return null;
            }
            
            console.log('📡 Fetching LeetCode data for user with connected account');
            const data = await LeetCodeService.getUserData();
            
            if (data?.user) {
              return {
                totalSolved: data.user.totalSolved,
                easySolved: data.user.easy.solved,
                mediumSolved: data.user.medium.solved,
                hardSolved: data.user.hard.solved,
                ranking: data.user.ranking
              };
            }
            return null;
          } catch (error) {
            console.error('Error fetching LeetCode data:', error);
            // Only return null for new users, don't show fake data
            return null;
          }
        })()
      ]);

      setStats({
        profile: profileData || null,
        community: communityStats.status === 'fulfilled' ? communityStats.value : null,
        recentPosts: recentPosts.status === 'fulfilled' ? recentPosts.value.posts : [],
        github: githubData.status === 'fulfilled' ? githubData.value : null,
        leetcode: leetcodeData.status === 'fulfilled' ? leetcodeData.value : null
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const handleRefreshData = async () => {
    console.log('Manual refresh triggered');
    await fetchDashboardData();
    
    // Also refresh user counts
    try {
      await CommunityService.refreshUserCounts(user?.id || '');
    } catch (error) {
      console.error('Error refreshing user counts:', error);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Enhanced Welcome Card */}
        <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Left Side - Image */}
              <div className="flex-shrink-0">
                <img 
                  src="https://raw.githubusercontent.com/Sumeet-162/DEVDASH-IMAGES/refs/heads/main/Open%20Peeps%20-%20Bust.png" 
                  alt="Developer illustration"
                  className="w-24 h-24 md:w-32 md:h-32 object-contain"
                />
              </div>
              
              {/* Right Side - Content */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {getGreeting()}, {user?.user_metadata?.full_name || 'Developer'}!
                    </CardTitle>
                    <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 mt-2">
                      Ready to code and collaborate today?
                    </p>
                  </div>
                  
                  <div className="flex-shrink-0 mt-2 md:mt-0">
                    <UserInfoCard />
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
        
        {/* Key Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <StatsCard 
                title="GitHub Repositories" 
                value={stats.github?.totalRepos || 0}
                description={stats.profile?.github_username ? "Total repos" : "Connect GitHub to see data"}
                lordIcon={{
                  src: "https://cdn.lordicon.com/lllcnxva.json",
                  trigger: "hover"
                }}
              />
              <StatsCard 
                title="LeetCode Problems" 
                value={stats.leetcode?.totalSolved || 0}
                description={stats.profile?.leetcode_username ? "Total solved" : "Connect LeetCode to see data"}
                lordIcon={{
                  src: "https://cdn.lordicon.com/xpesqpji.json",
                  trigger: "hover"
                }}
              />
              <StatsCard 
                title="Community Impact" 
                value={stats.profile?.total_likes_received || 0}
                description="Total likes received"
                lordIcon={{
                  src: "https://cdn.lordicon.com/ewmfucya.json",
                  trigger: "hover"
                }}
              />
              <StatsCard 
                title="Network Size" 
                value={stats.profile?.followers_count || 0}
                description="Followers"
                lordIcon={{
                  src: "https://cdn.lordicon.com/xvmmqwjv.json",
                  trigger: "hover"
                }}
              />
            </>
          )}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <lord-icon
                src="https://cdn.lordicon.com/vnxhpszd.json"
                trigger="hover"
                style={{ width: '20px', height: '20px' }}
              />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2"
                onClick={() => navigate('/community')}
              >
                <lord-icon
                  src="https://cdn.lordicon.com/etzspqzb.json"
                  trigger="hover"
                  style={{ width: '32px', height: '32px' }}
                />
                <span>Create Post</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2"
                onClick={() => navigate('/leetcode')}
              >
                <lord-icon
                  src="https://cdn.lordicon.com/rkozjzdh.json"
                  trigger="hover"
                  style={{ width: '32px', height: '32px' }}
                />
                <span>Solve Problems</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2"
                onClick={() => navigate('/github')}
              >
                <lord-icon
                  src="https://cdn.lordicon.com/yxsnnbst.json"
                  trigger="hover"
                  style={{ width: '32px', height: '32px' }}
                />
                <span>Check Repos</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2"
                onClick={() => navigate('/productivity/pomodoro')}
              >
                <lord-icon
                  src="https://cdn.lordicon.com/gdowkrjt.json"
                  trigger="hover"
                  style={{ width: '32px', height: '32px' }}
                />
                <span>Start Focus</span>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Productivity Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <lord-icon
              src="https://cdn.lordicon.com/cqaznhoh.json"
              trigger="hover"
              style={{ width: '28px', height: '28px' }}
            />
            Productivity
          </h2>
          <ProductivityCard />
        </div>
        
        {/* Detailed Cards Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enhanced GitHub Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Github className="h-4 w-4" />
                GitHub Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : stats.github ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xl font-bold">{stats.github.contributions}</div>
                      <div className="text-sm text-muted-foreground font-medium">Contributions</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold">{stats.github.totalRepos}</div>
                      <div className="text-sm text-muted-foreground font-medium">Repositories</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold">{stats.github.stars}</div>
                      <div className="text-sm text-muted-foreground font-medium">Stars</div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => navigate('/github')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Detailed Stats
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Github className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Connect your GitHub account to see activity</p>
                  <Button onClick={() => navigate('/github')}>
                    Connect GitHub
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhanced LeetCode Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Code2 className="h-4 w-4" />
                LeetCode Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : stats.leetcode ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.leetcode.totalSolved}</div>
                    <div className="text-base text-muted-foreground font-medium">Problems Solved</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="bg-green-100 dark:bg-green-900 p-3 rounded text-center">
                      <div className="font-semibold">{stats.leetcode.easySolved}</div>
                      <div className="text-green-600 dark:text-green-400 font-medium">Easy</div>
                    </div>
                    <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded text-center">
                      <div className="font-semibold">{stats.leetcode.mediumSolved}</div>
                      <div className="text-yellow-600 dark:text-yellow-400 font-medium">Medium</div>
                    </div>
                    <div className="bg-red-100 dark:bg-red-900 p-3 rounded text-center">
                      <div className="font-semibold">{stats.leetcode.hardSolved}</div>
                      <div className="text-red-600 dark:text-red-400 font-medium">Hard</div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => navigate('/leetcode')}
                  >
                    <Trophy className="h-4 w-4 mr-2" />
                    View Progress
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Code2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Connect your LeetCode account to track progress</p>
                  <Button onClick={() => navigate('/leetcode')}>
                    Connect LeetCode
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Recent Activity & Community */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Community Posts */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <lord-icon
                    src="https://cdn.lordicon.com/pbamwmcj.json"
                    trigger="hover"
                    style={{ width: '20px', height: '20px' }}
                  />
                  Recent Community Activity
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/community')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : stats.recentPosts.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentPosts.slice(0, 3).map((post) => (
                    <div 
                      key={post.id} 
                      className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate('/community')}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.author?.avatar_url} />
                        <AvatarFallback>
                          {getProfileDisplayName(post.author).split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {getProfileDisplayName(post.author)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {post.title}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {post.likes_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {post.comments_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No recent community activity</p>
                  <Button onClick={() => navigate('/community')}>
                    Join Community
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* News & Updates */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <lord-icon
                  src="https://cdn.lordicon.com/ulgefjgj.json"
                  trigger="hover"
                  style={{ width: '20px', height: '20px' }}
                />
                Latest News
              </CardTitle>
            </CardHeader>
            <CardContent>
              <NewsCard />
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
