
import { useState, useEffect } from 'react';
import Layout from "@/components/layout/Layout";
import HeaderStats from "@/components/leetcode/HeaderStats";
import DifficultyBreakdown from "@/components/leetcode/DifficultyBreakdown";
import ProgressChart from "@/components/leetcode/ProgressChart";
import RecentSubmissions from "@/components/leetcode/RecentSubmissions";
import TopicsMastery from "@/components/leetcode/TopicsMastery";
import MonthlyGoalSelector from "@/components/leetcode/MonthlyGoalSelector";
import ProblemListDialog from "@/components/leetcode/ProblemListDialog";
import LeetCodeWelcome from "@/components/leetcode/LeetCodeWelcome";
import RateLimitStatus from "@/components/leetcode/RateLimitStatus";
import { ProfileService } from "@/services/profileService";
import { MonthlyGoalsService } from "@/services/monthlyGoalsService";
import { SimpleLeetCodeApi } from "@/services/simpleLeetCodeApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, 
  Target, 
  Calendar, 
  Code2, 
  RefreshCw, 
  Settings2, 
  TrendingUp,
  Award,
  Zap,
  CheckCircle,
  User,
  AlertTriangle,
  Info
} from "lucide-react";
import LeetCodeService, { LeetCodeStats } from "@/services/leetcodeService";

const LeetCodePage = () => {
  const [data, setData] = useState<LeetCodeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'real' | 'fallback'>('fallback');
  const [apiStatus, setApiStatus] = useState<string>('');
  const [monthlyGoalKey, setMonthlyGoalKey] = useState(0); // Force re-render of monthly goal
  const [problemDialogOpen, setProblemDialogOpen] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);

  useEffect(() => {
    checkUserProfile();
  }, []);

  const checkUserProfile = async () => {
    setCheckingProfile(true);
    
    try {
      // Check if user is authenticated
      const authenticated = await ProfileService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (!authenticated) {
        // User not logged in, proceed with fallback/demo data
        setShowWelcome(false);
        setUsername('demo-user');
        setCurrentUserId(undefined); // Use demo mode
        await loadData();
        return;
      }

      // Get the current user profile to get the user ID
      const profile = await ProfileService.getCurrentUserProfile();
      if (profile) {
        setCurrentUserId(profile.id);
        
        // Check for LeetCode username in profile
        if (profile.leetcode_username) {
          // User has LeetCode username in profile, use it
          setUsername(profile.leetcode_username);
          setShowWelcome(false);
          // Store in localStorage for LeetCode service
          localStorage.setItem('leetcode_username', profile.leetcode_username);
          await loadData();
        } else {
          // User is authenticated but no LeetCode username, show welcome
          setShowWelcome(true);
          setLoading(false); // Reset loading state for welcome screen
        }
      } else {
        // Could not get profile, show welcome
        setShowWelcome(true);
        setLoading(false); // Reset loading state for welcome screen
      }
    } catch (error) {
      console.error('Error checking user profile:', error);
      // Fallback to asking for username
      setShowWelcome(true);
      setLoading(false); // Reset loading state for welcome screen
    } finally {
      setCheckingProfile(false);
    }
  };

  const handleWelcomeUsernameSubmit = async (newUsername: string) => {
    setLoading(true);
    
    try {
      // Update profile with LeetCode username
      const success = await ProfileService.updateLeetCodeUsername(newUsername);
      
      if (success) {
        setUsername(newUsername);
        setShowWelcome(false);
        // Store in localStorage for LeetCode service
        localStorage.setItem('leetcode_username', newUsername);
        await loadData();
      } else {
        setError('Failed to save LeetCode username to profile');
      }
    } catch (error) {
      console.error('Error saving username:', error);
      setError('Failed to save LeetCode username');
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    setApiStatus('');
    try {
      const leetcodeData = await LeetCodeService.getUserData();
      setData(leetcodeData);
      setUsername(leetcodeData.user.username);
      
      // Check if data is rate limited
      if (leetcodeData.isRateLimited) {
        setApiStatus('⚠️ LeetCode API is currently rate-limited. Showing cached data.');
        setError('API rate limited - showing cached data. Please try refreshing in a few minutes.');
      } else {
        setApiStatus('✅ LeetCode data loaded successfully');
      }
      
      // Determine data source
      const storedUsername = localStorage.getItem('leetcode_username');
      setDataSource(storedUsername && storedUsername !== 'developer_coder' ? 'real' : 'fallback');
      
      // Refresh monthly goal component to pick up new LeetCode data
      setMonthlyGoalKey(prev => prev + 1);
      
    } catch (error) {
      console.error('Error loading LeetCode data:', error);
      if (error instanceof Error && error.message === 'RATE_LIMITED') {
        setError('LeetCode API is rate-limited. Please wait a few minutes before refreshing.');
        setApiStatus('🚫 Rate Limited - Please wait before refreshing');
      } else {
        setError('Failed to load LeetCode data. Please try again.');
        setApiStatus('❌ Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSolveNewProblem = async (difficulty: 'Easy' | 'Medium' | 'Hard') => {
    try {
      await LeetCodeService.solveNewProblem(difficulty);
      await loadData();
    } catch (error) {
      console.error('Error solving problem:', error);
    }
  };

  const handleOpenProblemList = (difficulty: 'Easy' | 'Medium' | 'Hard') => {
    setSelectedDifficulty(difficulty);
    setProblemDialogOpen(true);
  };

  const handleRefreshData = async () => {
    setLoading(true);
    try {
      const newData = await LeetCodeService.refreshData();
      setData(newData);
      // Refresh monthly goal to pick up updated progress
      setMonthlyGoalKey(prev => prev + 1);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    LeetCodeService.clearAllData();
    // Also clear the monthly goal data to reset it with correct progress
    localStorage.removeItem('demo_monthly_goal');
    console.log('Cleared all LeetCode data and monthly goal cache');
    await loadData();
  };

  const handleUsernameChange = async () => {
    if (username.trim()) {
      setLoading(true);
      setApiStatus('Fetching data...');
      try {
        // Update LeetCode service
        await LeetCodeService.setUsername(username.trim());
        
        // If user is authenticated, also update their profile
        if (isAuthenticated) {
          await ProfileService.updateLeetCodeUsername(username.trim());
        }
        
        setApiStatus('Loading user data...');
        await loadData();
        setIsConfiguring(false);
        setApiStatus('');
      } catch (error) {
        console.error('Error updating username:', error);
        setApiStatus('Failed to fetch data');
        setError('Failed to fetch LeetCode data for this username');
      } finally {
        setLoading(false);
      }
    }
  };

  // Show loading spinner while checking profile
  if (checkingProfile) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Code2 className="h-8 w-8 animate-pulse mx-auto" />
            <p className="text-muted-foreground">Checking your profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show welcome screen for authenticated users without LeetCode username
  if (showWelcome) {
    return (
      <Layout>
        <LeetCodeWelcome 
          onUsernameSubmit={handleWelcomeUsernameSubmit}
          loading={loading}
        />
      </Layout>
    );
  }

  if (loading || !data) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-6 max-w-2xl mx-auto">
            <Code2 className="h-8 w-8 animate-pulse mx-auto" />
            <p className="text-muted-foreground">
              {error ? error : 'Loading LeetCode stats...'}
            </p>
            
            {/* Enhanced Error Display */}
            {error && (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <p className="text-red-800 text-sm font-medium">
                      {error.includes('rate-limited') || error.includes('429') ? 
                        '🚫 API Rate Limited' : 
                        '❌ Error Loading Data'
                      }
                    </p>
                  </div>
                  <p className="text-red-600 text-xs mb-3">{error}</p>
                  
                  {(error.includes('rate-limited') || error.includes('429')) && (
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <Info className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <div className="text-sm text-yellow-800">
                          <p className="font-medium">Rate Limit Information</p>
                          <p className="mt-1">
                            LeetCode APIs have usage limits to ensure fair access. This is normal and temporary.
                          </p>
                        </div>
                      </div>
                      
                      {/* Rate Limit Status Component */}
                      <RateLimitStatus 
                        isRateLimited={true}
                        onRetry={loadData}
                        className="text-left"
                      />
                    </div>
                  )}
                  
                  <div className="flex gap-2 mt-3">
                    <Button onClick={loadData} variant="outline" size="sm">
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Try Again
                    </Button>
                    <Button 
                      onClick={() => {
                        SimpleLeetCodeApi.resetRateLimit();
                        loadData();
                      }} 
                      variant="ghost" 
                      size="sm"
                    >
                      Reset & Retry
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* API Status Display */}
            {apiStatus && !error && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm">{apiStatus}</p>
              </div>
            )}

            {error && !error.includes('rate-limited') && (
              <Button onClick={loadData} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  const { user, recentSubmissions, progressChart, topicStats, achievements } = data;
  
  // Calculate total and solved problems
  const totalProblems = user.easy.total + user.medium.total + user.hard.total;
  const totalSolved = user.easy.solved + user.medium.solved + user.hard.solved;
  const solvedPercentage = Math.round((totalSolved / totalProblems) * 100);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with username and controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold">LeetCode Dashboard</h1>
              <Badge variant="outline" className="text-xs break-all">
                @{user.username}
              </Badge>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <Button variant="outline" onClick={handleRefreshData} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Refresh Data</span>
              <span className="sm:hidden">Refresh</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsConfiguring(!isConfiguring)}
              size="sm"
            >
              <Settings2 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{isConfiguring ? 'Cancel' : 'Change Username'}</span>
              <span className="sm:hidden">{isConfiguring ? 'Cancel' : 'Settings'}</span>
            </Button>
          </div>
        </div>

        {/* Username Configuration */}
        {isConfiguring && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configure LeetCode Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground break-words">
                  Current Profile: <strong className="break-all">@{user.username}</strong>
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  placeholder="Enter your LeetCode username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUsernameChange()}
                  className="flex-1"
                />
                <Button onClick={handleUsernameChange} disabled={loading} size="sm" className="sm:w-auto w-full">
                  {loading ? (apiStatus || 'Loading...') : 'Update'}
                </Button>
              </div>
              {apiStatus && !loading && (
                <div className="text-sm text-blue-600 font-medium break-words">
                  Status: {apiStatus}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Header Stats */}
        <HeaderStats 
          totalSolved={user.totalSolved} 
          solvedPercentage={solvedPercentage}
          ranking={user.ranking}
          streak={user.streak}
          acceptanceRate={user.acceptanceRate}
          username={user.username}
          isRealData={dataSource === 'real'}
        />

        {/* Monthly Goal & Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Monthly Goal */}
          <div className="md:col-span-2 lg:col-span-1">
            <MonthlyGoalSelector 
              key={monthlyGoalKey} // Force re-render when LeetCode data updates
              userId={currentUserId} // Pass actual user ID when authenticated, undefined for demo mode
            />
          </div>

          {/* Quick Actions */}
          <Card className="card-hover">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Quick Solve
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button 
                  onClick={() => handleOpenProblemList('Easy')}
                  variant="outline" 
                  className="w-full justify-start text-green-600 border-green-200 hover:bg-green-50"
                  size="sm"
                >
                  <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Solve Easy Problem</span>
                </Button>
                <Button 
                  onClick={() => handleOpenProblemList('Medium')}
                  variant="outline" 
                  className="w-full justify-start text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                  size="sm"
                >
                  <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Solve Medium Problem</span>
                </Button>
                <Button 
                  onClick={() => handleOpenProblemList('Hard')}
                  variant="outline" 
                  className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                  size="sm"
                >
                  <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="truncate">Solve Hard Problem</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Achievements Preview */}
          <Card className="card-hover">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {achievements.slice(0, 3).map((achievement) => (
                  <div key={achievement.id} className="flex items-center gap-3">
                    <span className="text-lg flex-shrink-0">{achievement.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{achievement.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {achievement.description}
                      </p>
                    </div>
                    {achievement.unlockedDate && (
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Progress Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Distribution by Difficulty */}
          <DifficultyBreakdown 
            easySolved={user.easy.solved}
            easyTotal={user.easy.total}
            mediumSolved={user.medium.solved}
            mediumTotal={user.medium.total}
            hardSolved={user.hard.solved}
            hardTotal={user.hard.total}
            username={user.username}
            isRealData={dataSource === 'real'}
          />
          
          {/* Progress Chart */}
          <div className="md:col-span-1 lg:col-span-2">
            <ProgressChart 
              progressData={progressChart} 
              username={user.username}
              isRealData={dataSource === 'real'}
            />
          </div>
        </div>
        
        {/* Detailed Stats */}
        <Tabs defaultValue="submissions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="submissions" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Recent Submissions</span>
              <span className="sm:hidden">Submissions</span>
            </TabsTrigger>
            <TabsTrigger value="topics" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Topics Mastery</span>
              <span className="sm:hidden">Topics</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="text-xs sm:text-sm">
              Achievements
            </TabsTrigger>
            <TabsTrigger value="stats" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Detailed Stats</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="submissions">
            <RecentSubmissions 
              submissions={recentSubmissions} 
              username={user.username}
              isRealData={dataSource === 'real'}
            />
          </TabsContent>

          <TabsContent value="topics">
            <TopicsMastery 
              topicDistribution={topicStats} 
              username={user.username}
              isRealData={dataSource === 'real'}
            />
          </TabsContent>

          <TabsContent value="achievements">
            <Card>
              <CardHeader>
                <CardTitle>All Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map((achievement) => (
                    <div 
                      key={achievement.id} 
                      className={`border rounded-lg p-4 ${
                        achievement.unlockedDate ? 'bg-green-50 border-green-200' : 'bg-muted/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{achievement.icon}</span>
                        <div className="flex-1">
                          <h3 className="font-medium">{achievement.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {achievement.description}
                          </p>
                          {achievement.unlockedDate ? (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Unlocked {achievement.unlockedDate}
                            </Badge>
                          ) : achievement.progress !== undefined ? (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>Progress</span>
                                <span>{achievement.progress}/{achievement.target}</span>
                              </div>
                              <Progress 
                                value={(achievement.progress / (achievement.target || 1)) * 100} 
                                className="h-2"
                              />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Activity Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Joined LeetCode</span>
                    <span className="text-sm">{new Date(user.joinedDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Active Days</span>
                    <span className="text-sm">{user.activeDays} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Points</span>
                    <span className="text-sm">{user.points.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg per Day</span>
                    <span className="text-sm">
                      {(user.totalSolved / user.activeDays).toFixed(1)} problems
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Difficulty Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Easy Problems</span>
                      <span>{Math.round((user.easy.solved / user.totalSolved) * 100)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-yellow-600">Medium Problems</span>
                      <span>{Math.round((user.medium.solved / user.totalSolved) * 100)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-red-600">Hard Problems</span>
                      <span>{Math.round((user.hard.solved / user.totalSolved) * 100)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Global Ranking</span>
                    <span className="text-sm">#{user.ranking.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Acceptance Rate</span>
                    <span className="text-sm">{user.acceptanceRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Current Streak</span>
                    <span className="text-sm flex items-center gap-1">
                      🔥 {user.streak} days
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Problem List Dialog */}
      <ProblemListDialog
        isOpen={problemDialogOpen}
        onClose={() => setProblemDialogOpen(false)}
        difficulty={selectedDifficulty}
      />
    </Layout>
  );
};

export default LeetCodePage;
