// GitHub API Service
import { githubAuthService } from './githubAuthService';
import { githubGraphQLService } from './githubGraphQLService';

class GitHubService {
  private readonly baseURL = 'https://api.github.com';
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  // Check if user has authenticated for real data
  isAuthenticated(): boolean {
    return githubAuthService.isAuthenticated();
  }

  // Get authentication URL
  async getAuthUrl(): Promise<string> {
    return await githubAuthService.generateAuthUrl();
  }

  // Set personal access token
  async setPersonalAccessToken(token: string): Promise<void> {
    return githubAuthService.setPersonalAccessToken(token);
  }

  // Sign out
  async signOut(): Promise<void> {
    await githubAuthService.signOut();
    this.cache.clear();
  }

  private async fetchWithCache(url: string, cacheKey: string) {
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error('GitHub API fetch error:', error);
      
      // Return cached data if available, even if expired
      if (cached) {
        return cached.data;
      }
      
      throw error;
    }
  }

  async getUserProfile(username: string) {
    try {
      const url = `${this.baseURL}/users/${username}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`GitHub user '${username}' not found`);
          return this.getFallbackUserData(username);
        }
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache the result
      this.cache.set(`user_${username}`, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return this.getFallbackUserData(username);
    }
  }

  async getUserRepos(username: string, limit: number = 6) {
    try {
      const url = `${this.baseURL}/users/${username}/repos?sort=updated&per_page=${limit}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`GitHub user '${username}' not found`);
          return this.getFallbackReposData();
        }
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      const repos = await response.json();
      
      // Cache the result
      this.cache.set(`repos_${username}_${limit}`, {
        data: repos,
        timestamp: Date.now()
      });
      
      return repos.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        description: repo.description,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        issues: repo.open_issues_count,
        updatedAt: this.formatDate(repo.updated_at),
        url: repo.html_url,
        isPrivate: repo.private,
        isFork: repo.fork
      }));
    } catch (error) {
      console.error('Error fetching user repos:', error);
      return this.getFallbackReposData();
    }
  }

  async getUserStats(username: string) {
    console.log(`🔍 Getting GitHub stats for: ${username}`);
    
    // Always try to get real data first, regardless of authentication
    try {
      const userUrl = `${this.baseURL}/users/${username}`;
      const reposUrl = `${this.baseURL}/users/${username}/repos?per_page=100`;
      
      console.log(`📡 Fetching GitHub stats for ${username} from API...`);
      console.log(`🌐 User URL: ${userUrl}`);
      console.log(`📂 Repos URL: ${reposUrl}`);
      
      const [userResponse, reposResponse] = await Promise.all([
        fetch(userUrl),
        fetch(reposUrl)
      ]);

      console.log(`📊 Response status - User: ${userResponse.status}, Repos: ${reposResponse.status}`);

      if (!userResponse.ok || !reposResponse.ok) {
        if (userResponse.status === 404 || reposResponse.status === 404) {
          console.warn(`❌ GitHub user '${username}' not found (404)`);
          console.log('📦 Using fallback data for non-existent user');
          return this.getFallbackStatsData();
        }
        throw new Error(`GitHub API error: ${userResponse.status}/${reposResponse.status}`);
      }

      const [user, repos] = await Promise.all([
        userResponse.json(),
        reposResponse.json()
      ]);

      console.log(`✅ Successfully fetched REAL GitHub data for ${username}:`, {
        repos: repos.length,
        publicRepos: user.public_repos,
        followers: user.followers,
        following: user.following
      });

      // Cache the results
      this.cache.set(`user_${username}`, { data: user, timestamp: Date.now() });
      this.cache.set(`all_repos_${username}`, { data: repos, timestamp: Date.now() });

      const totalStars = repos.reduce((sum: number, repo: any) => sum + repo.stargazers_count, 0);
      const languages = repos.reduce((acc: Record<string, number>, repo: any) => {
        if (repo.language) {
          acc[repo.language] = (acc[repo.language] || 0) + 1;
        }
        return acc;
      }, {});

      const realStats = {
        totalRepos: user.public_repos,
        totalStars,
        followers: user.followers,
        following: user.following,
        contributions: totalStars + repos.length * 5, // Rough estimate
        languages,
        topLanguage: Object.keys(languages).length > 0 ? 
          Object.keys(languages).reduce((a, b) => 
            languages[a] > languages[b] ? a : b
          ) : null,
        isRealData: true // Flag to indicate this is real data
      };

      console.log('🎉 Returning REAL GitHub stats (not fallback):', realStats);
      return realStats;
    } catch (error) {
      console.error('💥 Error fetching real GitHub stats:', error);
      
      // Try enhanced stats if authenticated (fallback)
      if (this.isAuthenticated()) {
        try {
          console.log('🔄 Trying enhanced stats as fallback...');
          const enhancedStats = await githubGraphQLService.getDetailedUserStats(username);
          return { ...enhancedStats, isRealData: true };
        } catch (enhancedError) {
          console.error('💥 Enhanced stats also failed:', enhancedError);
        }
      }
      
      console.log('📦 Using fallback data for GitHub stats (API failed)');
      const fallbackData = { ...this.getFallbackStatsData(), isRealData: false };
      console.log('📊 Fallback data:', fallbackData);
      return fallbackData;
    }
  }

  async getContributionData(username: string) {
    // Try to get real data if user is authenticated
    if (this.isAuthenticated()) {
      try {
        return await githubGraphQLService.getRealContributions(username);
      } catch (error) {
        console.error('Failed to fetch real contribution data, falling back to simulation:', error);
        // Fall back to simulated data if real data fails
      }
    }

    // Use simulated data for non-authenticated users or when real data fails
    try {
      const repos = await this.getUserRepos(username, 100);
      return this.generateRealisticContributions(repos);
    } catch (error) {
      console.error('Error fetching contribution data:', error);
      return this.generateRealisticContributions([]);
    }
  }

  private generateRealisticContributions(repos: any[] = []) {
    const contributions = [];
    const today = new Date();
    
    // Calculate activity patterns based on repository data
    const recentRepos = repos.filter(repo => {
      const updatedDate = new Date(repo.updatedAt || '2024-01-01');
      const monthsAgo = (today.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      return monthsAgo < 12; // Repos updated in last year
    });

    const avgRepoActivity = recentRepos.length;
    const baseActivityLevel = Math.min(Math.max(avgRepoActivity / 10, 0.3), 0.8);
    
    // Generate last 365 days with more realistic patterns
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dayOfWeek = date.getDay();
      
      // More activity on weekdays, less on weekends
      const weekdayMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 0.3 : 1.0;
      
      // Simulate periods of high and low activity
      const weekOfYear = Math.floor(i / 7);
      const activityCycle = Math.sin(weekOfYear * 0.3) * 0.5 + 0.5;
      
      // Check if this date corresponds to a recent repo update
      const hasRepoActivity = recentRepos.some(repo => {
        const repoDate = new Date(repo.updatedAt || '2024-01-01');
        const diffDays = Math.abs((date.getTime() - repoDate.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays < 7; // Activity within a week of repo update
      });
      
      const baseChance = baseActivityLevel * weekdayMultiplier * activityCycle;
      const finalChance = hasRepoActivity ? Math.min(baseChance + 0.4, 0.9) : baseChance;
      
      let contributionCount = 0;
      if (Math.random() < finalChance) {
        if (hasRepoActivity) {
          contributionCount = Math.floor(Math.random() * 8) + 2; // 2-9 contributions
        } else {
          contributionCount = Math.floor(Math.random() * 5) + 1; // 1-5 contributions
        }
      }
      
      contributions.push({
        date: date.toISOString().split('T')[0],
        count: contributionCount,
        level: contributionCount === 0 ? 0 : 
               contributionCount <= 2 ? 1 :
               contributionCount <= 5 ? 2 :
               contributionCount <= 8 ? 3 : 4
      });
    }

    const totalContributions = contributions.reduce((sum, day) => sum + day.count, 0);
    const currentStreak = this.calculateCurrentStreak(contributions);
    const longestStreak = this.calculateLongestStreak(contributions);

    return {
      contributions,
      totalContributions,
      currentStreak,
      longestStreak
    };
  }

  private calculateCurrentStreak(contributions: any[]): number {
    let streak = 0;
    for (let i = contributions.length - 1; i >= 0; i--) {
      if (contributions[i].count > 0) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  private calculateLongestStreak(contributions: any[]): number {
    let maxStreak = 0;
    let currentStreak = 0;
    
    for (const day of contributions) {
      if (day.count > 0) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    return maxStreak;
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Updated yesterday';
    if (diffDays < 7) return `Updated ${diffDays} days ago`;
    if (diffDays < 30) return `Updated ${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `Updated ${Math.ceil(diffDays / 30)} months ago`;
    return `Updated ${Math.ceil(diffDays / 365)} years ago`;
  }

  // Fallback data for when API fails
  private getFallbackUserData(username: string) {
    return {
      login: username,
      name: 'GitHub User',
      bio: 'Passionate developer building amazing things',
      location: 'Somewhere on Earth',
      avatar_url: `https://github.com/${username}.png`,
      public_repos: 12,
      followers: 50,
      following: 25,
      created_at: '2020-01-01T00:00:00Z'
    };
  }

  private getFallbackReposData() {
    return [
      {
        id: 1,
        name: 'awesome-project',
        description: 'A really awesome project that does amazing things',
        language: 'TypeScript',
        stars: 45,
        forks: 12,
        issues: 3,
        updatedAt: 'Updated 2 days ago',
        url: '#',
        isPrivate: false,
        isFork: false
      },
      {
        id: 2,
        name: 'react-components',
        description: 'Collection of reusable React components',
        language: 'JavaScript',
        stars: 23,
        forks: 8,
        issues: 1,
        updatedAt: 'Updated 1 week ago',
        url: '#',
        isPrivate: false,
        isFork: false
      },
      {
        id: 3,
        name: 'api-server',
        description: 'RESTful API server with Node.js and Express',
        language: 'JavaScript',
        stars: 15,
        forks: 5,
        issues: 0,
        updatedAt: 'Updated 2 weeks ago',
        url: '#',
        isPrivate: false,
        isFork: false
      }
    ];
  }

  private getFallbackStatsData() {
    console.log('🔄 Using FALLBACK GitHub stats data (not real user data)');
    return {
      totalRepos: 42, // Fake data
      totalStars: 150, // Fake data 
      followers: 25, // Fake data
      following: 50, // Fake data
      contributions: 245, // Fake data
      languages: {
        'TypeScript': 12,
        'JavaScript': 8,
        'Python': 6,
        'HTML': 4,
        'CSS': 2,
        'Java': 2
      },
      topLanguage: 'TypeScript',
      isRealData: false // Flag to indicate this is fake data
    };
  }

  // Get real Pull Requests data (authenticated users only)
  async getUserPullRequests(username: string, limit: number = 20) {
    if (this.isAuthenticated()) {
      try {
        return await githubGraphQLService.getUserPullRequests(username, limit);
      } catch (error) {
        console.warn('Failed to fetch real PR data, falling back to mock data:', error);
        return this.getMockPullRequests(username, limit);
      }
    } else {
      return this.getMockPullRequests(username, limit);
    }
  }

  // Get real Issues data (authenticated users only)
  async getUserIssues(username: string, limit: number = 20) {
    if (this.isAuthenticated()) {
      try {
        return await githubGraphQLService.getUserIssues(username, limit);
      } catch (error) {
        console.warn('Failed to fetch real issues data, falling back to mock data:', error);
        return this.getMockIssues(username, limit);
      }
    } else {
      return this.getMockIssues(username, limit);
    }
  }

  // Mock Pull Requests data for non-authenticated users
  private getMockPullRequests(username: string, limit: number) {
    const mockPRs = [
      {
        id: 'pr1',
        number: 42,
        title: 'Fix performance issues in data fetching',
        state: 'OPEN',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        mergedAt: null,
        closedAt: null,
        url: `https://github.com/${username}/react-dashboard-template/pull/42`,
        repository: {
          name: 'react-dashboard-template',
          nameWithOwner: `${username}/react-dashboard-template`,
          owner: username,
        },
        author: username,
        mergeable: 'MERGEABLE',
        reviewDecision: null,
        additions: 145,
        deletions: 23,
        changedFiles: 8,
        labels: [
          { name: 'enhancement', color: 'a2eeef' },
          { name: 'performance', color: 'fbca04' }
        ],
      },
      {
        id: 'pr2',
        number: 38,
        title: 'Add dark mode support',
        state: 'MERGED',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        mergedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        closedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        url: `https://github.com/${username}/node-api-starter/pull/38`,
        repository: {
          name: 'node-api-starter',
          nameWithOwner: `${username}/node-api-starter`,
          owner: username,
        },
        author: username,
        mergeable: 'MERGED',
        reviewDecision: 'APPROVED',
        additions: 89,
        deletions: 12,
        changedFiles: 5,
        labels: [
          { name: 'feature', color: '0075ca' },
          { name: 'UI/UX', color: 'd4c5f9' }
        ],
      },
      {
        id: 'pr3',
        number: 35,
        title: 'Update dependencies to latest versions',
        state: 'OPEN',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        mergedAt: null,
        closedAt: null,
        url: `https://github.com/${username}/react-state-management/pull/35`,
        repository: {
          name: 'react-state-management',
          nameWithOwner: `${username}/react-state-management`,
          owner: username,
        },
        author: username,
        mergeable: 'MERGEABLE',
        reviewDecision: null,
        additions: 234,
        deletions: 156,
        changedFiles: 12,
        labels: [
          { name: 'dependencies', color: '0366d6' },
          { name: 'maintenance', color: 'fef2c0' }
        ],
      },
    ];

    return {
      totalCount: mockPRs.length,
      pullRequests: mockPRs.slice(0, limit),
    };
  }

  // Mock Issues data for non-authenticated users
  private getMockIssues(username: string, limit: number) {
    const mockIssues = [
      {
        id: 'issue1',
        number: 15,
        title: 'Memory leak in useEffect cleanup',
        state: 'OPEN',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        closedAt: null,
        url: `https://github.com/${username}/react-dashboard-template/issues/15`,
        repository: {
          name: 'react-dashboard-template',
          nameWithOwner: `${username}/react-dashboard-template`,
          owner: username,
        },
        author: username,
        assignees: [username],
        labels: [
          { name: 'bug', color: 'd73a4a' },
          { name: 'priority:high', color: 'b60205' }
        ],
        commentCount: 5,
      },
      {
        id: 'issue2',
        number: 12,
        title: 'Add tests for API endpoints',
        state: 'CLOSED',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
        closedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
        url: `https://github.com/${username}/node-api-starter/issues/12`,
        repository: {
          name: 'node-api-starter',
          nameWithOwner: `${username}/node-api-starter`,
          owner: username,
        },
        author: username,
        assignees: [],
        labels: [
          { name: 'enhancement', color: 'a2eeef' },
          { name: 'testing', color: '0052cc' }
        ],
        commentCount: 3,
      },
      {
        id: 'issue3',
        number: 8,
        title: 'Improve documentation for state management patterns',
        state: 'OPEN',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        closedAt: null,
        url: `https://github.com/${username}/react-state-management/issues/8`,
        repository: {
          name: 'react-state-management',
          nameWithOwner: `${username}/react-state-management`,
          owner: username,
        },
        author: 'contributor123',
        assignees: [username],
        labels: [
          { name: 'documentation', color: '0075ca' },
          { name: 'good first issue', color: '7057ff' }
        ],
        commentCount: 2,
      },
      {
        id: 'issue4',
        number: 9,
        title: 'Add TypeScript strict mode configuration',
        state: 'OPEN',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        closedAt: null,
        url: `https://github.com/${username}/react-dashboard-template/issues/9`,
        repository: {
          name: 'react-dashboard-template',
          nameWithOwner: `${username}/react-dashboard-template`,
          owner: username,
        },
        author: username,
        assignees: [],
        labels: [
          { name: 'enhancement', color: 'a2eeef' },
          { name: 'typescript', color: '0366d6' }
        ],
        commentCount: 1,
      },
    ];

    return {
      totalCount: mockIssues.length,
      issues: mockIssues.slice(0, limit),
    };
  }

  // Clear cache manually
  clearCache() {
    this.cache.clear();
  }

  // Get cache status
  getCacheInfo() {
    const entries = Array.from(this.cache.entries()).map(([key, value]) => ({
      key,
      age: Date.now() - value.timestamp,
      expired: Date.now() - value.timestamp > this.cacheTimeout
    }));
    
    return {
      size: this.cache.size,
      entries
    };
  }
}

// Language color mapping for repository languages
export const languageColors: Record<string, string> = {
  'TypeScript': '#3178c6',
  'JavaScript': '#f1e05a',
  'HTML': '#e34c26',
  'CSS': '#563d7c',
  'Python': '#3572A5',
  'Java': '#b07219',
  'C++': '#f34b7d',
  'C#': '#239120',
  'PHP': '#4F5D95',
  'Ruby': '#701516',
  'Go': '#00ADD8',
  'Rust': '#dea584',
  'Swift': '#fa7343',
  'Kotlin': '#A97BFF',
  'Dart': '#00B4AB',
  'Vue': '#4FC08D',
  'Shell': '#89e051',
  'Dockerfile': '#384d54'
};

export const githubService = new GitHubService();
