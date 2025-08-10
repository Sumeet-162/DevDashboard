// Real LeetCode API Service using GraphQL endpoint
interface LeetCodeApiUser {
  username: string;
  profile: {
    realName: string;
    userAvatar: string;
    ranking: number;
  };
  submitStats: {
    acSubmissionNum: Array<{
      difficulty: string;
      count: number;
      submissions: number;
    }>;
    totalSubmissionNum: Array<{
      difficulty: string;
      count: number;
      submissions: number;
    }>;
  };
  badges: Array<{
    id: string;
    displayName: string;
    icon: string;
    creationDate: string;
  }>;
}

interface LeetCodeApiSubmission {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: string;
  statusDisplay: string;
  lang: string;
  runtime: string;
  memory: string;
  question: {
    questionFrontendId: string;
    title: string;
    difficulty: string;
  };
}

export class LeetCodeApiService {
  private static readonly LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql';
  private static readonly CORS_PROXY = 'https://api.allorigins.win/raw?url=';
  
  // GraphQL query to get user profile data
  private static readonly USER_PROFILE_QUERY = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          realName
          userAvatar
          ranking
        }
        submitStats: submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
            submissions
          }
          totalSubmissionNum {
            difficulty
            count
            submissions
          }
        }
        badges {
          id
          displayName
          icon
          creationDate
        }
      }
    }
  `;

  // GraphQL query to get recent submissions
  private static readonly RECENT_SUBMISSIONS_QUERY = `
    query getRecentSubmissions($username: String!, $limit: Int!) {
      recentSubmissionList(username: $username, limit: $limit) {
        id
        title
        titleSlug
        timestamp
        statusDisplay
        lang
        runtime
        memory
        question {
          questionFrontendId
          title
          difficulty
        }
      }
    }
  `;

  // GraphQL query to get user contest data
  private static readonly USER_CONTEST_QUERY = `
    query getUserContestRanking($username: String!) {
      userContestRanking(username: $username) {
        attendedContestsCount
        rating
        globalRanking
        totalParticipants
      }
    }
  `;

  static async fetchUserProfile(username: string): Promise<LeetCodeApiUser | null> {
    try {
      const response = await this.makeGraphQLRequest(this.USER_PROFILE_QUERY, { username });
      
      if (response?.data?.matchedUser) {
        return response.data.matchedUser;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching LeetCode user profile:', error);
      return null;
    }
  }

  static async fetchRecentSubmissions(username: string, limit: number = 20): Promise<LeetCodeApiSubmission[]> {
    try {
      const response = await this.makeGraphQLRequest(this.RECENT_SUBMISSIONS_QUERY, { username, limit });
      
      if (response?.data?.recentSubmissionList) {
        return response.data.recentSubmissionList;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching LeetCode submissions:', error);
      return [];
    }
  }

  static async fetchUserContestRanking(username: string): Promise<any> {
    try {
      const response = await this.makeGraphQLRequest(this.USER_CONTEST_QUERY, { username });
      
      if (response?.data?.userContestRanking) {
        return response.data.userContestRanking;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching LeetCode contest ranking:', error);
      return null;
    }
  }

  private static async makeGraphQLRequest(query: string, variables: any): Promise<any> {
    const requestBody = {
      query,
      variables
    };

    console.log('Making LeetCode API request for username:', variables.username);

    // Try direct request first
    try {
      console.log('Attempting direct request to LeetCode GraphQL...');
      const response = await fetch(this.LEETCODE_GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://leetcode.com/',
          'Origin': 'https://leetcode.com'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Direct request response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Direct request successful, data received');
        return data;
      } else {
        console.warn('Direct request failed with status:', response.status);
      }
    } catch (error) {
      console.warn('Direct request failed with error:', error);
    }

    // Try with a different approach - using a public LeetCode API proxy
    try {
      console.log('Trying alternative API approach...');
      
      // Use a simpler public endpoint that might work
      const publicUrl = `https://leetcode-stats-api.herokuapp.com/${variables.username}`;
      const response = await fetch(publicUrl);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Alternative API successful:', data);
        
        // Convert from public API format to our expected format
        return this.convertPublicApiResponse(data, variables.username);
      }
    } catch (error) {
      console.warn('Alternative API failed:', error);
    }

    // Try another public API
    try {
      console.log('Trying LeetCode Cards API...');
      const cardsUrl = `https://leetcard.jacoblin.cool/${variables.username}?ext=activity`;
      
      // This won't work directly due to CORS, but we can try
      const response = await fetch(cardsUrl, { mode: 'no-cors' });
      console.log('Cards API response (limited due to CORS):', response);
    } catch (error) {
      console.warn('Cards API failed:', error);
    }

    console.error('All API methods failed');
    throw new Error('All request methods failed - LeetCode API might be blocked or user not found');
  }

  // Convert public API response to our internal format
  private static convertPublicApiResponse(publicData: any, username: string): any {
    console.log('Converting public API data:', publicData);
    
    if (!publicData || publicData.status === 'error') {
      throw new Error('User not found or API error');
    }

    // Mock a proper GraphQL response structure
    return {
      data: {
        matchedUser: {
          username: username,
          profile: {
            realName: publicData.name || username,
            userAvatar: '',
            ranking: publicData.ranking || 0
          },
          submitStats: {
            acSubmissionNum: [
              { difficulty: 'Easy', count: publicData.easySolved || 0, submissions: publicData.easySubmissions || 0 },
              { difficulty: 'Medium', count: publicData.mediumSolved || 0, submissions: publicData.mediumSubmissions || 0 },
              { difficulty: 'Hard', count: publicData.hardSolved || 0, submissions: publicData.hardSubmissions || 0 }
            ],
            totalSubmissionNum: [
              { difficulty: 'Easy', count: publicData.easySolved || 0, submissions: publicData.easySubmissions || 0 },
              { difficulty: 'Medium', count: publicData.mediumSolved || 0, submissions: publicData.mediumSubmissions || 0 },
              { difficulty: 'Hard', count: publicData.hardSolved || 0, submissions: publicData.hardSubmissions || 0 }
            ]
          },
          badges: []
        },
        recentSubmissionList: [] // This API doesn't provide recent submissions
      }
    };
  }

  // Convert API data to our internal format
  static convertToInternalFormat(apiUser: LeetCodeApiUser, submissions: LeetCodeApiSubmission[]): any {
    if (!apiUser) return null;

    // Parse submission statistics
    const totalStats = apiUser.submitStats.totalSubmissionNum || [];
    const acStats = apiUser.submitStats.acSubmissionNum || [];

    const easyTotal = totalStats.find(s => s.difficulty === 'Easy')?.count || 0;
    const mediumTotal = totalStats.find(s => s.difficulty === 'Medium')?.count || 0;
    const hardTotal = totalStats.find(s => s.difficulty === 'Hard')?.count || 0;

    const easySolved = acStats.find(s => s.difficulty === 'Easy')?.count || 0;
    const mediumSolved = acStats.find(s => s.difficulty === 'Medium')?.count || 0;
    const hardSolved = acStats.find(s => s.difficulty === 'Hard')?.count || 0;

    const totalSolved = easySolved + mediumSolved + hardSolved;
    const totalSubmissions = totalStats.reduce((sum, stat) => sum + stat.submissions, 0);
    const acceptanceRate = totalSubmissions > 0 ? Math.round((totalSolved / totalSubmissions) * 100 * 10) / 10 : 0;

    // Convert submissions
    const convertedSubmissions = submissions.map(sub => ({
      problemId: parseInt(sub.question.questionFrontendId),
      title: sub.question.title,
      difficulty: sub.question.difficulty as 'Easy' | 'Medium' | 'Hard',
      status: sub.statusDisplay === 'Accepted' ? 'Accepted' : 'Wrong Answer',
      runtime: sub.runtime || undefined,
      memory: sub.memory || undefined,
      language: sub.lang,
      date: this.formatTimeAgo(new Date(parseInt(sub.timestamp) * 1000)),
      submissionTime: new Date(parseInt(sub.timestamp) * 1000)
    }));

    // Calculate streak (simplified - would need more data for accurate calculation)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const recentSubmissions = convertedSubmissions.filter(sub => 
      sub.submissionTime >= new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    );
    const streak = Math.min(recentSubmissions.length, 30); // Simplified streak calculation

    return {
      user: {
        username: apiUser.username,
        ranking: apiUser.profile.ranking || 0,
        totalSolved,
        easy: { solved: easySolved, total: 850 }, // LeetCode totals (approximate)
        medium: { solved: mediumSolved, total: 1750 },
        hard: { solved: hardSolved, total: 750 },
        acceptanceRate,
        streak,
        points: totalSolved * 15 + hardSolved * 25,
        badge: this.getBadgeForSolved(totalSolved),
        joinedDate: new Date().toISOString(), // Would need separate API call for this
        activeDays: Math.floor(totalSolved / 2) // Approximation
      },
      recentSubmissions: convertedSubmissions.slice(0, 20),
      // These would need additional API calls or generation
      progressChart: this.generateProgressChart(totalSolved),
      topicStats: this.generateTopicStats(),
      achievements: this.generateAchievements({ totalSolved, easy: { solved: easySolved }, medium: { solved: mediumSolved }, hard: { solved: hardSolved } }),
      monthlyGoal: this.generateMonthlyGoal()
    };
  }

  private static formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago`;
  }

  private static getBadgeForSolved(solved: number): string {
    if (solved >= 500) return 'LeetCode Champion';
    if (solved >= 300) return 'Algorithm Master';
    if (solved >= 200) return 'Problem Crusher';
    if (solved >= 100) return 'Code Ninja';
    if (solved >= 50) return 'Rising Star';
    return 'Problem Solver';
  }

  // Helper methods for data we can't get from API
  private static generateProgressChart(totalSolved: number): any[] {
    const points = [];
    const weeks = 12;
    const now = new Date();

    let currentSolved = Math.max(0, totalSolved - 30);
    
    for (let i = weeks - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weeklyIncrease = Math.floor(Math.random() * 8) + 1;
      currentSolved += weeklyIncrease;

      points.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        problems: Math.min(currentSolved, totalSolved)
      });
    }

    return points;
  }

  private static generateTopicStats(): any[] {
    const topics = [
      'Array & String', 'Two Pointers', 'Hash Table', 'Linked List',
      'Stack & Queue', 'Binary Tree', 'Graph', 'Dynamic Programming',
      'Backtracking', 'Binary Search', 'Sorting & Searching', 'Math & Geometry'
    ];

    return topics.map(topic => {
      const total = Math.floor(Math.random() * 100) + 50;
      const solved = Math.floor(Math.random() * total * 0.7);
      return {
        name: topic,
        solved,
        total,
        percentage: Math.round((solved / total) * 100),
        recentActivity: Math.floor(Math.random() * 10)
      };
    });
  }

  private static generateAchievements(user: any): any[] {
    return [
      {
        id: 'first_solve',
        title: 'First Steps',
        description: 'Solved your first problem',
        icon: '🎯',
        unlockedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
      },
      {
        id: 'hundred_club',
        title: 'Century Club',
        description: 'Solved 100 problems',
        icon: '💯',
        unlockedDate: user.totalSolved >= 100 ? new Date().toLocaleDateString() : undefined,
        progress: user.totalSolved >= 100 ? 100 : user.totalSolved,
        target: 100
      }
    ];
  }

  private static generateMonthlyGoal(): any {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysPassed = now.getDate();
    const daysLeft = daysInMonth - daysPassed;

    return {
      target: 25,
      completed: Math.floor((daysPassed / daysInMonth) * 25 * 0.8),
      daysLeft
    };
  }
}
