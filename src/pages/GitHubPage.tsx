
import { useState, useEffect } from 'react';
import { 
  Github, 
  GitPullRequest, 
  GitBranch, 
  Star, 
  FileCode, 
  AlertCircle,
  Calendar,
  MapPin,
  Link,
  Settings2,
  Loader2,
  ExternalLink,
  Eye,
  GitFork,
  CheckCircle,
  Server
} from "lucide-react";
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ContributionGraph } from "@/components/github/ContributionGraph";
import { githubService, languageColors } from "@/services/githubService";
import { githubAuthService } from "@/services/githubAuthService";

const GitHubPage = () => {
  const [githubUsername, setGithubUsername] = useState('');
  const [storedUsername, setStoredUsername] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [repositories, setRepositories] = useState<any[]>([]);
  const [stats, setStats] = useState<any | null>(null);
  const [contributions, setContributions] = useState<any>({
    contributions: [],
    totalContributions: 0,
    currentStreak: 0,
    longestStreak: 0
  });
  const [pullRequests, setPullRequests] = useState<any>({
    totalCount: 0,
    pullRequests: []
  });
  const [issues, setIssues] = useState<any>({
    totalCount: 0,
    issues: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfiguring, setIsConfiguring] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [personalToken, setPersonalToken] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('github-username');
    setIsAuthenticated(githubService.isAuthenticated());
    
    if (saved) {
      setStoredUsername(saved);
      fetchGitHubData(saved);
    }
  }, []);

  // Add effect to check for authentication changes (e.g., after OAuth callback)
  useEffect(() => {
    const handleStorageChange = () => {
      const newAuthState = githubService.isAuthenticated();
      if (newAuthState !== isAuthenticated) {
        setIsAuthenticated(newAuthState);
        // Refresh data if user becomes authenticated and we have a username
        if (newAuthState && storedUsername) {
          console.log('Authentication state changed, refreshing data...');
          fetchGitHubData(storedUsername);
        }
      }
    };

    // Listen for localStorage changes (like after OAuth)
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for auth state changes
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [isAuthenticated, storedUsername]);

  const fetchGitHubData = async (username: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const [userData, reposData, statsData, contributionsData, pullRequestsData, issuesData] = await Promise.all([
        githubService.getUserProfile(username),
        githubService.getUserRepos(username),
        githubService.getUserStats(username),
        githubService.getContributionData(username),
        githubService.getUserPullRequests(username, 20),
        githubService.getUserIssues(username, 20)
      ]);

      setUser(userData);
      setRepositories(reposData);
      setStats(statsData);
      setContributions(contributionsData);
      setPullRequests(pullRequestsData);
      setIssues(issuesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch GitHub data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUsername = () => {
    if (!githubUsername.trim()) return;
    
    localStorage.setItem('github-username', githubUsername);
    setStoredUsername(githubUsername);
    setIsConfiguring(false);
    fetchGitHubData(githubUsername);
  };

  const handleAuthenticateGitHub = async () => {
    try {
      const authUrl = await githubAuthService.generateAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('OAuth initiation failed:', error);
      setError('OAuth server is not available. Please use a Personal Access Token instead.');
      setShowTokenInput(true); // Show token input as fallback
    }
  };

  const handleEnableCorsProxy = () => {
    window.open('https://cors-anywhere.herokuapp.com/corsdemo', '_blank');
  };

  const handlePersonalToken = async () => {
    if (!personalToken.trim()) return;
    
    try {
      await githubService.setPersonalAccessToken(personalToken);
      setIsAuthenticated(true);
      setShowTokenInput(false);
      setPersonalToken('');
      
      // Refresh data with new token
      if (storedUsername) {
        fetchGitHubData(storedUsername);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Invalid token');
    }
  };

  const handleSignOut = async () => {
    await githubService.signOut();
    setIsAuthenticated(false);
    // Clear local data
    setUser(null);
    setRepositories([]);
    setStats(null);
    setContributions({
      contributions: [],
      totalContributions: 0,
      currentStreak: 0,
      longestStreak: 0
    });
    setPullRequests({
      totalCount: 0,
      pullRequests: []
    });
    setIssues({
      totalCount: 0,
      issues: []
    });
  };

  const handleRefreshData = async () => {
    if (storedUsername) {
      // Clear cache to ensure fresh data
      githubService.clearCache();
      await fetchGitHubData(storedUsername);
    }
  };

  const handleReconfigure = () => {
    setIsConfiguring(true);
    setGithubUsername(storedUsername || '');
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return `Joined ${date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })}`;
  };

  const formatUpdateDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Updated yesterday';
    if (diffDays < 7) return `Updated ${diffDays} days ago`;
    if (diffDays < 30) return `Updated ${Math.ceil(diffDays / 7)} weeks ago`;
    return `Updated ${Math.ceil(diffDays / 30)} months ago`;
  };

  // Show configuration if no username is saved or user is configuring
  if (!storedUsername || isConfiguring) {
    return (
      <Layout>
        <div className="max-w-md mx-auto mt-20">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                Configure GitHub Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="github-username">GitHub Username</Label>
                <Input
                  id="github-username"
                  placeholder="Enter your GitHub username"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveUsername()}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveUsername} className="flex-1">
                  <Github className="h-4 w-4 mr-2" />
                  Connect GitHub
                </Button>
                {isConfiguring && (
                  <Button variant="outline" onClick={() => setIsConfiguring(false)}>
                    Cancel
                  </Button>
                )}
              </div>
              {error && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading GitHub data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Alert className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex justify-between items-center">
            {error}
            <Button variant="outline" size="sm" onClick={handleReconfigure}>
              Reconfigure
            </Button>
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  if (!user || !stats) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">No GitHub data available</p>
          <Button variant="outline" onClick={handleReconfigure} className="mt-4">
            Configure GitHub
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header with authentication status and controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">GitHub Profile</h1>
            {isAuthenticated ? (
              <p className="text-sm text-green-600 mt-1">
                ✓ Authenticated - Showing real contribution data
              </p>
            ) : stats?.isRealData ? (
              <p className="text-sm text-blue-600 mt-1">
                ✓ Showing real GitHub data via public API
              </p>
            ) : (
              <p className="text-sm text-orange-600 mt-1">
                ⚠️ Showing demo data - authenticate for real data
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
            {isAuthenticated ? (
              <Button variant="outline" onClick={handleSignOut} size="sm">
                <Github className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
                <Button onClick={handleAuthenticateGitHub} size="sm">
                  <Github className="h-4 w-4 mr-2" />
                  OAuth Login
                </Button>
                <Button variant="outline" onClick={() => setShowTokenInput(!showTokenInput)} size="sm">
                  <Settings2 className="h-4 w-4 mr-2" />
                  Use Personal Token
                </Button>
              </div>
            )}
            <Button variant="outline" onClick={handleRefreshData} disabled={loading} size="sm">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Server className="h-4 w-4 mr-2" />}
              <span className="hidden sm:inline">Refresh Data</span>
              <span className="sm:hidden">Refresh</span>
            </Button>
            <Button variant="outline" onClick={handleReconfigure} size="sm">
              <Settings2 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Reconfigure</span>
              <span className="sm:hidden">Settings</span>
            </Button>
          </div>
        </div>

        {/* Personal Token Input */}
        {showTokenInput && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">GitHub Personal Access Token</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p><strong>Alternative to OAuth:</strong> Use a GitHub Personal Access Token for real data access.</p>
                    <details className="text-xs">
                      <summary className="cursor-pointer font-medium">How to create a Personal Access Token</summary>
                      <div className="mt-2 space-y-1 text-muted-foreground">
                        <p>1. Go to <a href="https://github.com/settings/tokens" target="_blank" className="text-primary">GitHub Settings → Developer settings → Personal access tokens</a></p>
                        <p>2. Click "Generate new token (classic)"</p>
                        <p>3. Select scopes: <code>read:user</code>, <code>repo</code>, <code>user:email</code></p>
                        <p>4. Copy the generated token and paste it below</p>
                      </div>
                    </details>
                  </div>
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="personal-token">Personal Access Token</Label>
                <Input
                  id="personal-token"
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={personalToken}
                  onChange={(e) => setPersonalToken(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePersonalToken()}
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handlePersonalToken} disabled={!personalToken.trim()}>
                  <Github className="h-4 w-4 mr-2" />
                  Authenticate with Token
                </Button>
                <Button variant="outline" onClick={() => setShowTokenInput(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Section */}
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* User Info */}
          <Card className="w-full lg:w-1/3 card-hover">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 mb-4">
                  <AvatarImage src={user.avatar_url} alt={user.name || user.login} />
                  <AvatarFallback>
                    {(user.name || user.login)[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl sm:text-2xl font-bold break-words">{user.name || user.login}</h2>
                <p className="text-muted-foreground mb-2 break-all">@{user.login}</p>
                {user.bio && <p className="mb-4 text-sm text-center">{user.bio}</p>}
                <div className="text-sm text-muted-foreground space-y-1 w-full">
                  {user.location && (
                    <p className="flex items-center justify-center gap-2 break-words">
                      <Github size={16} /> {user.location}
                    </p>
                  )}
                  <p className="flex items-center justify-center gap-2">
                    <Calendar size={16} /> {formatJoinDate(user.created_at)}
                  </p>
                </div>
                <Button className="mt-4 w-full" asChild>
                  <a href={user.html_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View GitHub Profile
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Stats */}
          <Card className="w-full lg:w-2/3 card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold">{stats.totalRepos}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Repositories</p>
                </div>
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold">{stats.totalStars}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Stars Received</p>
                </div>
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold">{user.followers}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold">{user.following}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Following</p>
                </div>
              </div>
              
              {/* Languages */}
              {stats.languages && Object.keys(stats.languages).length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Top Languages</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(stats.languages)
                      .sort(([,a], [,b]) => (b as number) - (a as number))
                      .slice(0, 5)
                      .map(([language, count]) => (
                        <Badge key={language} variant="secondary">
                          <span 
                            className={`w-2 h-2 rounded-full mr-2`}
                            style={{ backgroundColor: languageColors[language] || '#6b7280' }}
                          />
                          {language} ({count as number})
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Contribution Graph */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Contribution Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ContributionGraph 
              contributions={contributions.contributions}
              totalContributions={contributions.totalContributions}
            />
          </CardContent>
        </Card>
        
        {/* GitHub Activity */}
        <Card className="card-hover">
          <CardHeader className="pb-0">
            <CardTitle>GitHub Activity</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Tabs defaultValue="repositories">
              <TabsList className="mb-4 flex-wrap h-auto">
                <TabsTrigger value="repositories" className="flex items-center gap-2 text-xs sm:text-sm">
                  <FileCode size={16} /> 
                  <span className="hidden sm:inline">Repositories</span>
                  <span className="sm:hidden">Repos</span>
                  ({repositories.length})
                </TabsTrigger>
                <TabsTrigger value="pullRequests" className="flex items-center gap-2 text-xs sm:text-sm">
                  <GitPullRequest size={16} /> 
                  <span className="hidden sm:inline">Pull Requests</span>
                  <span className="sm:hidden">PRs</span>
                  ({pullRequests.totalCount})
                </TabsTrigger>
                <TabsTrigger value="issues" className="flex items-center gap-2 text-xs sm:text-sm">
                  <AlertCircle size={16} /> 
                  <span className="hidden sm:inline">Issues</span>
                  <span className="sm:hidden">Issues</span>
                  ({issues.totalCount})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="repositories" className="space-y-4">
                {repositories.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No public repositories found
                  </p>
                ) : (
                  repositories.map((repo) => (
                    <div key={repo.id} className="border rounded-lg p-3 sm:p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-base sm:text-lg font-medium hover:text-primary break-words">
                              <a 
                                href={repo.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1"
                              >
                                <span className="break-all">{repo.name}</span>
                                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                              </a>
                            </h3>
                            {repo.isPrivate && (
                              <Badge variant="secondary" className="text-xs">
                                Private
                              </Badge>
                            )}
                            {repo.isFork && (
                              <Badge variant="outline" className="text-xs">
                                Fork
                              </Badge>
                            )}
                          </div>
                          {repo.description && (
                            <p className="text-sm text-muted-foreground mb-3 break-words">
                              {repo.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-wrap">
                            {repo.language && (
                              <div className="flex items-center gap-1">
                                <span 
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: languageColors[repo.language] || '#6b7280' }}
                                />
                                <span className="break-words">{repo.language}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Star size={14} />
                              {repo.stars}
                            </div>
                            <div className="flex items-center gap-1">
                              <GitFork size={14} />
                              {repo.forks}
                            </div>
                            {repo.issues > 0 && (
                              <div className="flex items-center gap-1">
                                <AlertCircle size={14} />
                                {repo.issues}
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground sm:ml-4 flex-shrink-0">
                          {repo.updatedAt}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
              
              <TabsContent value="pullRequests">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Total Pull Requests: {pullRequests.totalCount}
                  </p>
                  
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {pullRequests.pullRequests.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          No pull requests found
                        </p>
                      ) : (
                        pullRequests.pullRequests.map((pr: any) => (
                          <div key={pr.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="font-medium mb-1 hover:text-primary">
                                  <a 
                                    href={pr.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1"
                                  >
                                    {pr.title}
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {pr.repository.nameWithOwner}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                  <span className={`${
                                    pr.state === 'OPEN' ? 'text-green-600' : 
                                    pr.state === 'MERGED' ? 'text-purple-600' : 'text-gray-600'
                                  }`}>
                                    #{pr.number}
                                  </span>
                                  <span>
                                    {pr.state === 'MERGED' && pr.mergedAt
                                      ? `merged ${new Date(pr.mergedAt).toLocaleDateString()}`
                                      : `opened ${new Date(pr.createdAt).toLocaleDateString()}`
                                    }
                                  </span>
                                  {pr.additions !== undefined && pr.deletions !== undefined && (
                                    <span>
                                      +{pr.additions} -{pr.deletions}
                                    </span>
                                  )}
                                </div>
                                {pr.labels && pr.labels.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {pr.labels.map((label: any) => (
                                      <Badge 
                                        key={label.name} 
                                        variant="secondary" 
                                        className="text-xs"
                                        style={{ 
                                          backgroundColor: `#${label.color}20`,
                                          borderColor: `#${label.color}`,
                                          color: `#${label.color}`
                                        }}
                                      >
                                        {label.name}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <Badge 
                                variant="outline" 
                                className={`${
                                  pr.state === 'OPEN' ? 'bg-green-50 text-green-700 border-green-200' :
                                  pr.state === 'MERGED' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                  'bg-gray-50 text-gray-700 border-gray-200'
                                }`}
                              >
                                {pr.state === 'MERGED' ? 'Merged' : pr.state === 'OPEN' ? 'Open' : 'Closed'}
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>
              
              <TabsContent value="issues">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Total Issues: {issues.totalCount}
                  </p>
                  
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {issues.issues.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          No issues found
                        </p>
                      ) : (
                        issues.issues.map((issue: any) => (
                          <div key={issue.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="font-medium mb-1 hover:text-primary">
                                  <a 
                                    href={issue.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1"
                                  >
                                    {issue.title}
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {issue.repository.nameWithOwner}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                  <span className={`${
                                    issue.state === 'OPEN' ? 'text-green-600' : 'text-gray-600'
                                  }`}>
                                    #{issue.number}
                                  </span>
                                  <span>
                                    {issue.state === 'CLOSED' && issue.closedAt
                                      ? `closed ${new Date(issue.closedAt).toLocaleDateString()}`
                                      : `opened ${new Date(issue.createdAt).toLocaleDateString()}`
                                    }
                                  </span>
                                  {issue.commentCount > 0 && (
                                    <span>{issue.commentCount} comment{issue.commentCount !== 1 ? 's' : ''}</span>
                                  )}
                                  {issue.assignees && issue.assignees.length > 0 && (
                                    <span>assigned to {issue.assignees.join(', ')}</span>
                                  )}
                                </div>
                                {issue.labels && issue.labels.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {issue.labels.map((label: any) => (
                                      <Badge 
                                        key={label.name} 
                                        variant="secondary" 
                                        className="text-xs"
                                        style={{ 
                                          backgroundColor: `#${label.color}20`,
                                          borderColor: `#${label.color}`,
                                          color: `#${label.color}`
                                        }}
                                      >
                                        {label.name}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <Badge 
                                variant="outline" 
                                className={`${
                                  issue.state === 'OPEN' ? 'bg-green-50 text-green-700 border-green-200' :
                                  'bg-gray-50 text-gray-700 border-gray-200'
                                }`}
                              >
                                {issue.state === 'OPEN' ? 'Open' : 'Closed'}
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default GitHubPage;