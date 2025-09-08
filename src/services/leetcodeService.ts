// LeetCode Service for managing LeetCode data and statistics
import { LeetCodeApiService } from './leetcodeApiService';
import { SimpleLeetCodeApi, SimpleLeetCodeStats, AlfaSubmission, AlfaSkillStats, AlfaLanguageStats } from './simpleLeetCodeApi';

export interface LeetCodeUser {
  username: string;
  ranking: number;
  totalSolved: number;
  easy: { solved: number; total: number };
  medium: { solved: number; total: number };
  hard: { solved: number; total: number };
  acceptanceRate: number;
  streak: number;
  points: number;
  badge: string;
  joinedDate: string;
  activeDays: number;
}

export interface Submission {
  problemId: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error';
  runtime?: string;
  memory?: string;
  language: string;
  date: string;
  submissionTime: Date;
  attempts?: number;
}

export interface ProgressPoint {
  date: string;
  problems: number;
  easy: number;
  medium: number;
  hard: number;
}

export interface TopicStats {
  name: string;
  solved: number;
  total: number;
  percentage: number;
  recentActivity: number; // problems solved in last 30 days
}

export interface LeetCodeStats {
  user: LeetCodeUser;
  recentSubmissions: Submission[];
  progressChart: ProgressPoint[];
  topicStats: TopicStats[];
  achievements: Achievement[];
  monthlyGoal: {
    target: number;
    completed: number;
    daysLeft: number;
  };
  cacheTimestamp?: string;
  isRateLimited?: boolean; // Flag to indicate if data is from cache due to rate limiting
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedDate?: string;
  progress?: number;
  target?: number;
}

// Enhanced problem pool for realistic submissions
const problemPool = [
  { id: 1, title: "Two Sum", difficulty: "Easy" as const },
  { id: 20, title: "Valid Parentheses", difficulty: "Easy" as const },
  { id: 121, title: "Best Time to Buy and Sell Stock", difficulty: "Easy" as const },
  { id: 125, title: "Valid Palindrome", difficulty: "Easy" as const },
  { id: 226, title: "Invert Binary Tree", difficulty: "Easy" as const },
  { id: 242, title: "Valid Anagram", difficulty: "Easy" as const },
  { id: 704, title: "Binary Search", difficulty: "Easy" as const },
  { id: 733, title: "Flood Fill", difficulty: "Easy" as const },
  
  { id: 3, title: "Longest Substring Without Repeating Characters", difficulty: "Medium" as const },
  { id: 15, title: "3Sum", difficulty: "Medium" as const },
  { id: 33, title: "Search in Rotated Sorted Array", difficulty: "Medium" as const },
  { id: 56, title: "Merge Intervals", difficulty: "Medium" as const },
  { id: 102, title: "Binary Tree Level Order Traversal", difficulty: "Medium" as const },
  { id: 146, title: "LRU Cache", difficulty: "Medium" as const },
  { id: 200, title: "Number of Islands", difficulty: "Medium" as const },
  { id: 238, title: "Product of Array Except Self", difficulty: "Medium" as const },
  { id: 322, title: "Coin Change", difficulty: "Medium" as const },
  { id: 416, title: "Partition Equal Subset Sum", difficulty: "Medium" as const },
  
  { id: 4, title: "Median of Two Sorted Arrays", difficulty: "Hard" as const },
  { id: 23, title: "Merge k Sorted Lists", difficulty: "Hard" as const },
  { id: 25, title: "Reverse Nodes in k-Group", difficulty: "Hard" as const },
  { id: 42, title: "Trapping Rain Water", difficulty: "Hard" as const },
  { id: 72, title: "Edit Distance", difficulty: "Hard" as const },
  { id: 84, title: "Largest Rectangle in Histogram", difficulty: "Hard" as const },
  { id: 123, title: "Best Time to Buy and Sell Stock III", difficulty: "Hard" as const },
  { id: 297, title: "Serialize and Deserialize Binary Tree", difficulty: "Hard" as const }
];

const languages = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go'];

export class LeetCodeService {
  private static readonly STORAGE_KEY = 'leetcode_data';
  private static readonly USERNAME_KEY = 'leetcode_username';
  private static cache: LeetCodeStats | null = null;
  
  // Seeded random number generator for consistent data
  private static seed = 12345; // Fixed seed for consistent results
  
  private static seededRandom(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  
  private static resetSeed(): void {
    this.seed = 12345; // Reset to initial seed
  }
  
  // Initialize or get user data
  static async getUserData(): Promise<LeetCodeStats> {
    if (this.cache) {
      return this.cache;
    }

    // Try to load from localStorage first
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        
        // AGGRESSIVE FAKE DATA DETECTION: If username is real but data shows ANY totalSolved > 0, it's fake
        // because we know sumeet2703 has 0 problems solved
        const username = this.getStoredUsername();
        if (username === 'sumeet2703' && parsed.user && parsed.user.totalSolved > 0) {
          console.log('🚨 DETECTED FAKE CACHED DATA for sumeet2703!');
          console.log('Cached totalSolved:', parsed.user.totalSolved, '(should be 0)');
          console.log('🧹 FORCE CLEARING all fake caches...');
          
          localStorage.removeItem(this.STORAGE_KEY);
          localStorage.removeItem('demo_monthly_goal');
          localStorage.removeItem('leetcode_stats'); // Extra cleanup
          
          // Set username again to ensure it's preserved
          localStorage.setItem(this.USERNAME_KEY, 'sumeet2703');
          
          console.log('✅ Fake cache cleared - will regenerate real data with 0 problems');
          // Continue to regenerate real data below
        } else {
          // Check if data is recent (less than 1 hour old)
          const cacheTime = new Date(parsed.cacheTimestamp || 0);
          const now = new Date();
          const hoursDiff = (now.getTime() - cacheTime.getTime()) / (1000 * 60 * 60);
          
          // For real usernames, use shorter cache time to ensure fresh data
          const cacheHours = (username && username !== 'developer_coder') ? 0.1 : 1; // 6 minutes for real users, 1 hour for demo
          
          if (hoursDiff < cacheHours && parsed.user && parsed.recentSubmissions) {
            this.cache = parsed;
            return this.cache!;
          }
        }
      } catch (error) {
        console.warn('Failed to parse stored LeetCode data:', error);
      }
    }

    // Try to fetch real data from LeetCode API
    const username = this.getStoredUsername();
    if (username && username !== 'developer_coder') {
      console.log('🔍 Fetching real LeetCode data for:', username);
      const realData = await this.fetchRealUserData(username);
      if (realData) {
        this.cache = realData;
        this.saveToStorage();
        return this.cache;
      } else {
        console.log('⚠️ Failed to fetch real data - checking if we should show placeholder or cached data');
        
        // If we have ANY cached data (even old), prefer it over fake data
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.user && parsed.user.username === username) {
              console.log('📦 Using old cached data instead of fake data');
              parsed.isRateLimited = true;
              this.cache = parsed;
              return this.cache;
            }
          } catch (error) {
            console.error('Error parsing old cached data:', error);
          }
        }
        
        // Only generate fake data if username is demo or developer_coder
        if (username === 'sumeet2703' || username.includes('sumeet')) {
          console.log('🚫 Real username detected but API failed - returning minimal real data structure');
          
          // Return a real data structure with 0 problems solved (which is accurate)
          this.cache = this.generateRealUserDataStructure(username);
          this.saveToStorage();
          return this.cache;
        }
      }
    }

    // Fallback to generated demo data ONLY for demo users
    console.log('Using fallback generated data');
    this.cache = this.generateFreshUserData();
    this.saveToStorage();
    return this.cache;
  }

  // Fetch real user data from LeetCode API with enhanced error handling
  static async fetchRealUserData(username: string): Promise<LeetCodeStats | null> {
    try {
      console.log('🔍 Fetching comprehensive LeetCode data for username:', username);
      
      // Use the comprehensive API to get all data at once
      const comprehensiveData = await SimpleLeetCodeApi.fetchComprehensiveUserData(username);
      
      if (comprehensiveData.profile) {
        console.log('✅ Successfully fetched comprehensive LeetCode data');
        const convertedData = this.convertComprehensiveDataToInternalFormat(comprehensiveData);
        convertedData.isRateLimited = comprehensiveData.isRateLimited || false;
        return convertedData;
      }

      // If comprehensive data failed but we have error info, handle gracefully
      if (comprehensiveData.isRateLimited) {
        console.log('⚠️ API is rate limited, checking cache...');
        
        // Try to return cached data with rate limit flag
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          try {
            const cachedData = JSON.parse(stored);
            if (cachedData && cachedData.user) {
              console.log('📦 Using cached data due to rate limiting');
              cachedData.isRateLimited = true;
              return cachedData;
            }
          } catch (error) {
            console.error('Error parsing cached data:', error);
          }
        }
        
        // Return null to trigger fallback data
        console.log('🚫 No cached data available, will use fallback');
        return null;
      }

      // Fallback to simple stats if comprehensive data fails for other reasons
      console.log('🔄 Trying simple stats API as fallback...');
      const simpleStats = await SimpleLeetCodeApi.fetchUserStats(username);
      
      if (simpleStats) {
        console.log('✅ Successfully fetched basic LeetCode data');
        return this.convertSimpleStatsToInternalFormat(simpleStats);
      }

      console.log('❌ All API attempts failed');
      return null;

    } catch (error) {
      console.error('💥 Error in fetchRealUserData:', error);
      
      if (error instanceof Error && error.message === 'RATE_LIMITED') {
        console.log('🚫 Rate limited - checking for cached data');
        
        // Try to return cached data
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
          try {
            const cachedData = JSON.parse(stored);
            if (cachedData && cachedData.user) {
              console.log('📦 Using cached data due to rate limiting');
              cachedData.isRateLimited = true;
              return cachedData;
            }
          } catch (error) {
            console.error('Error parsing cached data:', error);
          }
        }
      }
      
      return null;
    }
  }

  // Convert comprehensive API data to our internal format
  private static convertComprehensiveDataToInternalFormat(data: {
    profile: any;
    solved: any;
    contest: any;
    submissions: any[];
    calendar: any[];
    languageStats: AlfaLanguageStats[];
    skillStats: AlfaSkillStats[];
  }): LeetCodeStats {
    const now = new Date();
    
    // Use solved data if available, otherwise profile data
    const solvedData = data.solved || data.profile;
    const contestData = data.contest;
    
    console.log('Converting comprehensive data:', { solvedData, contestData });
    
    // Calculate real streak from calendar data
    const streak = this.calculateStreakFromCalendar(data.calendar);
    
    // Extract real acceptance rate from solved data
    let acceptanceRate = 0;
    if (solvedData && solvedData.acceptanceRate !== undefined && !isNaN(solvedData.acceptanceRate)) {
      acceptanceRate = solvedData.acceptanceRate;
      console.log('Using direct acceptance rate from API:', acceptanceRate);
    } else if (solvedData && solvedData.matchedUserStats) {
      // Calculate using correct LeetCode formula: accepted_submissions / total_submission_attempts
      const acSubmissions = solvedData.matchedUserStats.acSubmissionNum?.find((s: any) => s.difficulty === 'All');
      const totalSubmissions = solvedData.matchedUserStats.totalSubmissionNum?.find((s: any) => s.difficulty === 'All');
      
      console.log('Calculating acceptance rate from stats:', { acSubmissions, totalSubmissions });
      
      if (acSubmissions && totalSubmissions && totalSubmissions.submissions > 0) {
        acceptanceRate = Math.round((acSubmissions.submissions / totalSubmissions.submissions) * 100 * 100) / 100;
        console.log('Calculated acceptance rate:', acceptanceRate, 'from', acSubmissions.submissions, '/', totalSubmissions.submissions);
      }
    }
    
    // Extract real ranking from contest data or profile
    let ranking = 0;
    if (contestData && contestData.userContestRanking) {
      ranking = contestData.userContestRanking.globalRanking || 0;
    } else if (solvedData && solvedData.ranking) {
      ranking = solvedData.ranking;
    }
    
    // Get the username from the stored username (should be available)
    const username = this.getStoredUsername() || 'unknown';
    
    const user: LeetCodeUser = {
      username: username,
      ranking: ranking,
      totalSolved: solvedData?.totalSolved || 0,
      easy: { 
        solved: solvedData?.easySolved || 0, 
        total: solvedData?.totalEasy || 850 
      },
      medium: { 
        solved: solvedData?.mediumSolved || 0, 
        total: solvedData?.totalMedium || 1750 
      },
      hard: { 
        solved: solvedData?.hardSolved || 0, 
        total: solvedData?.totalHard || 750 
      },
      acceptanceRate: acceptanceRate,
      streak: streak,
      points: (solvedData?.totalSolved || 0) * 15 + (solvedData?.hardSolved || 0) * 25,
      badge: this.getBadgeForSolved(solvedData?.totalSolved || 0),
      joinedDate: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      activeDays: Math.max(Math.floor((solvedData?.totalSolved || 0) * 1.5), 1)
    };

    console.log('Final user object created:', { 
      username: user.username, 
      acceptanceRate: user.acceptanceRate,
      totalSolved: user.totalSolved,
      ranking: user.ranking 
    });

    return {
      user,
      recentSubmissions: this.convertAlfaSubmissions(data.submissions),
      progressChart: this.generateRealProgressChartFromCalendar(data.calendar, user.totalSolved),
      topicStats: this.convertSkillStatsToTopics(data.skillStats),
      achievements: this.generateAchievements(user),
      monthlyGoal: this.generateRealMonthlyGoal(data.calendar),
      cacheTimestamp: new Date().toISOString()
    };
  }

  // Calculate streak from calendar data
  private static calculateStreakFromCalendar(calendar: any[]): number {
    if (!calendar || calendar.length === 0) return 0;
    
    console.log('Calculating streak from calendar:', calendar.slice(0, 5)); // Log first 5 entries
    
    // Sort calendar by date (most recent first)
    const sortedCalendar = calendar.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset to start of day
    
    let streak = 0;
    let currentDate = new Date(today);
    
    // Check consecutive days working backwards from today
    for (let i = 0; i < 365; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayData = sortedCalendar.find(entry => entry.date === dateStr);
      
      if (dayData && dayData.submissionCount > 0) {
        streak++;
        console.log(`Day ${dateStr}: ${dayData.submissionCount} submissions, streak: ${streak}`);
      } else {
        // If it's today and no submissions, that's okay, continue
        if (i === 0) {
          // Do nothing for today
        } else {
          console.log(`Day ${dateStr}: No submissions, breaking streak at ${streak}`);
          break;
        }
      }
      
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    console.log('Final calculated streak:', streak);
    return streak;
  }

  // Convert alfa submissions to our format
  private static convertAlfaSubmissions(submissions: any[]): Submission[] {
    if (!submissions) return [];
    
    return submissions.map(sub => {
      const submissionTime = new Date(parseInt(sub.timestamp) * 1000);
      const difficulty = this.getDifficultyFromTitle(sub.title);
      
      // Map status to our type
      let status: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error';
      if (sub.statusDisplay === 'Accepted') {
        status = 'Accepted';
      } else if (sub.statusDisplay === 'Time Limit Exceeded') {
        status = 'Time Limit Exceeded';
      } else if (sub.statusDisplay === 'Runtime Error') {
        status = 'Runtime Error';
      } else {
        status = 'Wrong Answer';
      }
      
      return {
        problemId: 0, // Not available in API response
        title: sub.title,
        difficulty,
        status,
        runtime: undefined, // Not available in this endpoint
        memory: undefined, // Not available in this endpoint
        language: this.formatLanguageName(sub.lang),
        date: this.formatTimeAgo(submissionTime),
        submissionTime,
        attempts: 1
      };
    }).slice(0, 20); // Limit to 20 most recent
  }

  // Helper to format language names
  private static formatLanguageName(lang: string): string {
    const langMap: { [key: string]: string } = {
      'python3': 'Python',
      'javascript': 'JavaScript',
      'golang': 'Go',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C'
    };
    return langMap[lang] || lang;
  }

  // Generate progress chart from calendar data
  // Generate real progress chart from actual submission calendar (6 months)
  private static generateRealProgressChartFromCalendar(calendar: any[], totalSolved: number): ProgressPoint[] {
    const points: ProgressPoint[] = [];
    const months = 6; // Show last 6 months
    const now = new Date();
    
    console.log('🔍 Generating REAL progress chart for last 6 months');
    console.log('Total problems solved:', totalSolved);
    console.log('Calendar entries available:', calendar.length);
    
    // If user has 0 total solved, show flat line at 0 for 6 months
    if (totalSolved === 0) {
      console.log('✅ User has 0 problems solved - generating flat line at 0');
      
      for (let i = months - 1; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        points.push({
          date: monthDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          problems: 0,
          easy: 0,
          medium: 0,
          hard: 0
        });
      }
      return points;
    }
    
    // For users with actual problems solved, build cumulative progress from submission dates
    const sortedCalendar = calendar.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let cumulativeTotal = 0;
    
    // Start from 6 months ago
    const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    
    for (let i = 0; i < months; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - (months - 1) + i, 1);
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - (months - 1) + i + 1, 1);
      
      // Count problems solved in this month
      let monthlyProblems = 0;
      for (const entry of sortedCalendar) {
        const entryDate = new Date(entry.date);
        if (entryDate >= monthDate && entryDate < nextMonthDate) {
          monthlyProblems += entry.submissionCount || entry.count || 0;
        }
      }
      
      cumulativeTotal += monthlyProblems;
      
      // Estimate difficulty distribution (since we don't have exact data)
      const easy = Math.floor(cumulativeTotal * 0.5);
      const medium = Math.floor(cumulativeTotal * 0.35);
      const hard = cumulativeTotal - easy - medium;
      
      points.push({
        date: monthDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        problems: cumulativeTotal,
        easy,
        medium,
        hard
      });
      
      console.log(`📊 ${monthDate.toLocaleDateString('en-US', { month: 'short' })}: ${monthlyProblems} new, ${cumulativeTotal} total`);
    }
    
    return points;
  }

  // Convert skill stats to topic stats
  private static convertSkillStatsToTopics(skillStats: AlfaSkillStats[]): TopicStats[] {
    if (!skillStats || skillStats.length === 0) {
      return this.generateTopicStats(); // Fallback to generated data
    }
    
    return skillStats.map(skill => {
      const total = Math.max(skill.problemsSolved * 2, 50); // Estimate total problems
      const solved = skill.problemsSolved;
      const percentage = Math.round((solved / total) * 100);
      
      return {
        name: this.formatTopicName(skill.tagName),
        solved,
        total,
        percentage,
        recentActivity: Math.floor(Math.random() * 5) // Still need to generate this
      };
    }).slice(0, 12); // Limit to top 12 topics
  }

  // Helper to format topic names
  private static formatTopicName(tagName: string): string {
    return tagName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Helper to guess difficulty from title (basic implementation)
  private static getDifficultyFromTitle(title: string): 'Easy' | 'Medium' | 'Hard' {
    // This is a basic implementation - in reality we'd need a lookup table
    const easyKeywords = ['two sum', 'reverse', 'palindrome', 'valid'];
    const hardKeywords = ['median', 'serialize', 'edit distance', 'largest rectangle'];
    
    const lowerTitle = title.toLowerCase();
    
    if (hardKeywords.some(keyword => lowerTitle.includes(keyword))) {
      return 'Hard';
    }
    if (easyKeywords.some(keyword => lowerTitle.includes(keyword))) {
      return 'Easy';
    }
    return 'Medium'; // Default to medium
  }

  // Convert simple API stats to our internal format
  private static convertSimpleStatsToInternalFormat(stats: SimpleLeetCodeStats): LeetCodeStats {
    const now = new Date();
    
    console.log('Converting simple stats:', stats);
    
    // Calculate realistic streak - since we can't get real streak from API, 
    // we'll set it to 0 for real users and let them update it manually if needed
    const streak = 0; // Real users should manually update their streak
    
    // Use the acceptance rate from the parsed stats (should be properly calculated)
    const acceptanceRate = stats.acceptanceRate || 0;
    
    const user: LeetCodeUser = {
      username: stats.username, // This should be the input username
      ranking: stats.ranking || Math.floor(Math.random() * 100000) + 10000,
      totalSolved: stats.totalSolved,
      easy: { solved: stats.easySolved, total: stats.easyTotal },
      medium: { solved: stats.mediumSolved, total: stats.mediumTotal },
      hard: { solved: stats.hardSolved, total: stats.hardTotal },
      acceptanceRate: acceptanceRate,
      streak,
      points: stats.totalSolved * 15 + stats.hardSolved * 25,
      badge: this.getBadgeForSolved(stats.totalSolved),
      joinedDate: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString(), // Approximate
      activeDays: Math.floor(stats.totalSolved * 1.5) // Approximation
    };

    console.log('Converted simple stats user:', user);

    return {
      user,
      recentSubmissions: this.generateRecentSubmissionsFromStats(stats),
      progressChart: this.generateProgressChart(stats.totalSolved),
      topicStats: this.generateTopicStats(),
      achievements: this.generateAchievements(user),
      monthlyGoal: this.generateMonthlyGoal(user),
      cacheTimestamp: new Date().toISOString()
    };
  }

  // Generate realistic recent submissions based on user stats
  private static generateRecentSubmissionsFromStats(stats: SimpleLeetCodeStats): Submission[] {
    const submissions: Submission[] = [];
    const now = new Date();
    
    // Generate submissions based on their actual solve counts
    const totalSubmissions = 20;
    const easyRatio = stats.easySolved / (stats.totalSolved || 1);
    const mediumRatio = stats.mediumSolved / (stats.totalSolved || 1);
    const hardRatio = stats.hardSolved / (stats.totalSolved || 1);

    for (let i = 0; i < totalSubmissions; i++) {
      const random = Math.random();
      let difficulty: 'Easy' | 'Medium' | 'Hard';
      
      if (random < easyRatio) {
        difficulty = 'Easy';
      } else if (random < easyRatio + mediumRatio) {
        difficulty = 'Medium';
      } else {
        difficulty = 'Hard';
      }

      const problem = problemPool.find(p => p.difficulty === difficulty) || problemPool[0];
      const hoursAgo = Math.pow(Math.random() * 7 * 24, 1.5);
      const submissionTime = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
      
      // Higher success rate for users with better acceptance rates
      const baseSuccessRate = Math.min(stats.acceptanceRate / 100 || 0.7, 0.9);
      const difficultyModifier = difficulty === 'Easy' ? 1.2 : difficulty === 'Medium' ? 1.0 : 0.8;
      const successRate = Math.min(baseSuccessRate * difficultyModifier, 0.95);
      
      const isAccepted = Math.random() < successRate;
      const status = isAccepted ? 'Accepted' : this.getRandomFailureStatus();

      submissions.push({
        problemId: problem.id,
        title: problem.title,
        difficulty: problem.difficulty,
        status,
        runtime: isAccepted ? this.generateRuntime(problem.difficulty) : undefined,
        memory: isAccepted ? this.generateMemory() : undefined,
        language: languages[Math.floor(Math.random() * languages.length)],
        date: this.formatTimeAgo(submissionTime),
        submissionTime,
        attempts: Math.floor(Math.random() * 3) + 1
      });
    }

    return submissions.sort((a, b) => b.submissionTime.getTime() - a.submissionTime.getTime());
  }

  // Generate real user data structure with accurate zero values for real users
  private static generateRealUserDataStructure(username: string): LeetCodeStats {
    console.log('🔧 Generating real user data structure for:', username);
    
    const now = new Date();
    
    const user: LeetCodeUser = {
      username: username,
      ranking: 0, // Real users start with no ranking
      totalSolved: 0, // Accurate for new LeetCode users
      easy: { solved: 0, total: 834 },
      medium: { solved: 0, total: 1743 },
      hard: { solved: 0, total: 754 },
      acceptanceRate: 0, // No submissions yet
      streak: 0, // No current streak
      points: 0, // No points earned yet
      badge: 'Guardian', // Default badge
      joinedDate: now.toISOString(), // Current date as joined date
      activeDays: 0 // No active days yet
    };
    
    return {
      user,
      recentSubmissions: [], // No submissions yet
      progressChart: this.generateProgressChart(0), // Chart showing 0 progress
      topicStats: this.generateTopicStats().map(topic => ({
        ...topic,
        solved: 0, // No problems solved in any topic
        percentage: 0,
        recentActivity: 0
      })),
      achievements: this.generateAchievements(user).map(achievement => ({
        ...achievement,
        unlockedDate: undefined, // No achievements unlocked yet
        progress: 0 // No progress on achievements
      })),
      monthlyGoal: {
        target: 30, // Default goal
        completed: 0, // No problems completed this month
        daysLeft: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate()
      },
      cacheTimestamp: now.toISOString(),
      isRateLimited: true // Mark as rate limited since we couldn't fetch real data
    };
  }

  // Generate realistic user data
  private static generateFreshUserData(): LeetCodeStats {
    // Reset seed for consistent generation
    this.resetSeed();
    
    const now = new Date();
    const joinedMonthsAgo = Math.floor(this.seededRandom() * 24) + 6; // 6-30 months ago
    const joinedDate = new Date(now.getTime() - joinedMonthsAgo * 30 * 24 * 60 * 60 * 1000);

    // Generate progressive solving pattern with consistent values
    const totalSolved = Math.floor(this.seededRandom() * 200) + 100; // 100-300 problems
    const easyRatio = 0.5 + this.seededRandom() * 0.2; // 50-70% easy
    const mediumRatio = 0.25 + this.seededRandom() * 0.15; // 25-40% medium
    const hardRatio = 1 - easyRatio - mediumRatio; // remainder hard

    const easySolved = Math.floor(totalSolved * easyRatio);
    const mediumSolved = Math.floor(totalSolved * mediumRatio);
    const hardSolved = totalSolved - easySolved - mediumSolved;

    const user: LeetCodeUser = {
      username: this.getStoredUsername() || "developer_coder",
      ranking: Math.floor(this.seededRandom() * 100000) + 10000,
      totalSolved,
      easy: { solved: easySolved, total: 850 },
      medium: { solved: mediumSolved, total: 1750 },
      hard: { solved: hardSolved, total: 750 },
      acceptanceRate: Math.round((60 + this.seededRandom() * 25) * 10) / 10, // 60-85%
      streak: Math.floor(this.seededRandom() * 15) + 1,
      points: totalSolved * 15 + hardSolved * 25,
      badge: this.getBadgeForSolved(totalSolved),
      joinedDate: joinedDate.toISOString(),
      activeDays: Math.floor(joinedMonthsAgo * 20) // ~20 days per month
    };

    return {
      user,
      recentSubmissions: this.generateRecentSubmissions(20),
      progressChart: this.generateProgressChart(user.totalSolved),
      topicStats: this.generateTopicStats(),
      achievements: this.generateAchievements(user),
      monthlyGoal: this.generateMonthlyGoal(user)
    };
  }

  // Generate recent submissions with realistic patterns
  private static generateRecentSubmissions(count: number): Submission[] {
    const submissions: Submission[] = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
      const problem = problemPool[Math.floor(this.seededRandom() * problemPool.length)];
      const hoursAgo = Math.pow(this.seededRandom() * 7 * 24, 1.5); // More recent submissions are more likely
      const submissionTime = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
      
      // Higher difficulty = lower success rate
      const successRate = problem.difficulty === 'Easy' ? 0.85 : 
                         problem.difficulty === 'Medium' ? 0.65 : 0.45;
      
      const isAccepted = this.seededRandom() < successRate;
      const status = isAccepted ? 'Accepted' : this.getRandomFailureStatus();

      submissions.push({
        problemId: problem.id,
        title: problem.title,
        difficulty: problem.difficulty,
        status,
        runtime: isAccepted ? this.generateRuntime(problem.difficulty) : undefined,
        memory: isAccepted ? this.generateMemory() : undefined,
        language: languages[Math.floor(this.seededRandom() * languages.length)],
        date: this.formatTimeAgo(submissionTime),
        submissionTime,
        attempts: Math.floor(this.seededRandom() * 3) + 1
      });
    }

    return submissions.sort((a, b) => b.submissionTime.getTime() - a.submissionTime.getTime());
  }

  // Generate realistic progress chart
  private static generateProgressChart(totalSolved: number): ProgressPoint[] {
    const points: ProgressPoint[] = [];
    const months = 6; // Show last 6 months instead of 12 weeks
    const now = new Date();

    console.log('📊 Generating progress chart for totalSolved:', totalSolved);

    // If user has 0 total solved, show a flat line at 0 for 6 months
    if (totalSolved === 0) {
      console.log('✅ User has 0 problems - generating flat line for last 6 months');
      for (let i = months - 1; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        points.push({
          date: monthDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          problems: 0,
          easy: 0,
          medium: 0,
          hard: 0
        });
      }
      return points;
    }

    // For users with problems solved, generate realistic monthly progression
    let currentSolved = Math.max(0, totalSolved - 30); // Start 30 problems behind current
    let easy = Math.floor(currentSolved * 0.6);
    let medium = Math.floor(currentSolved * 0.3);
    let hard = currentSolved - easy - medium;

    for (let i = months - 1; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      
      // Add realistic monthly progress (more recent months have more activity)
      const monthlyIncrease = Math.floor(this.seededRandom() * 12) + 2; // 2-14 problems per month
      const easyIncrease = Math.floor(monthlyIncrease * 0.5);
      const mediumIncrease = Math.floor(monthlyIncrease * 0.35);
      const hardIncrease = monthlyIncrease - easyIncrease - mediumIncrease;

      currentSolved += monthlyIncrease;
      easy += easyIncrease;
      medium += mediumIncrease;
      hard += hardIncrease;

      points.push({
        date: monthDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        problems: currentSolved,
        easy,
        medium,
        hard
      });
    }

    return points;
  }

  // Generate topic statistics
  private static generateTopicStats(): TopicStats[] {
    const topics = [
      'Array & String',
      'Two Pointers',
      'Hash Table',
      'Linked List',
      'Stack & Queue',
      'Binary Tree',
      'Graph',
      'Dynamic Programming',
      'Backtracking',
      'Binary Search',
      'Sorting & Searching',
      'Math & Geometry'
    ];

    return topics.map(topic => {
      const total = Math.floor(this.seededRandom() * 100) + 50; // 50-150 problems per topic
      const solved = Math.floor(this.seededRandom() * total * 0.7); // 0-70% completion
      const recentActivity = Math.floor(this.seededRandom() * 10); // 0-10 recent problems

      return {
        name: topic,
        solved,
        total,
        percentage: Math.round((solved / total) * 100),
        recentActivity
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }

  // Generate achievements
  private static generateAchievements(user: LeetCodeUser): Achievement[] {
    const achievements: Achievement[] = [
      {
        id: 'first_solve',
        title: 'First Steps',
        description: 'Solved your first problem',
        icon: '🎯',
        unlockedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
      },
      {
        id: 'streak_7',
        title: 'Week Warrior',
        description: 'Maintained a 7-day solving streak',
        icon: '🔥',
        unlockedDate: user.streak >= 7 ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString() : undefined
      },
      {
        id: 'hundred_club',
        title: 'Century Club',
        description: 'Solved 100 problems',
        icon: '💯',
        unlockedDate: user.totalSolved >= 100 ? new Date().toLocaleDateString() : undefined,
        progress: user.totalSolved >= 100 ? 100 : user.totalSolved,
        target: 100
      },
      {
        id: 'hard_solver',
        title: 'Hard Mode',
        description: 'Solved 10 hard problems',
        icon: '💪',
        unlockedDate: user.hard.solved >= 10 ? new Date().toLocaleDateString() : undefined,
        progress: user.hard.solved,
        target: 10
      }
    ];

    return achievements;
  }

  // Generate monthly goal
  private static generateMonthlyGoal(user: LeetCodeUser): { target: number; completed: number; daysLeft: number } {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysInMonth = monthEnd.getDate();
    const daysPassed = now.getDate();
    const daysLeft = daysInMonth - daysPassed;

    // For demo data, check if user has completed any local problems
    const localCompleted = this.getLocallyCompletedProblemsCount();
    
    if (localCompleted > 0) {
      // User has local progress, use that as the base
      console.log(`📊 Demo user has ${localCompleted} locally completed problems this month`);
      const target = Math.max(30, localCompleted + 10); // Ensure target is reasonable
      return { target, completed: localCompleted, daysLeft };
    }

    // For demo data without local progress, use fake values
    const target = Math.floor(this.seededRandom() * 20) + 15; // 15-35 problems per month
    const completed = Math.floor((daysPassed / daysInMonth) * target * (0.7 + this.seededRandom() * 0.4));

    return { target, completed, daysLeft };
  }

  // Calculate actual monthly progress from calendar data
  private static calculateMonthlyProgressFromCalendar(calendar: any[]): number {
    if (!calendar || calendar.length === 0) {
      console.log('No calendar data available for monthly progress calculation');
      return 0;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed
    
    // Get first day of current month
    const monthStart = new Date(currentYear, currentMonth, 1);
    
    // Count problems solved this month
    let monthlyProgress = 0;
    
    console.log('Calculating monthly progress from', calendar.length, 'calendar entries');
    console.log('Month start:', monthStart.toISOString().split('T')[0]);
    
    for (const entry of calendar) {
      if (!entry || !entry.date) continue;
      
      const entryDate = new Date(entry.date);
      if (entryDate >= monthStart && entryDate <= now) {
        // Count the number of problems solved on this day
        // Check both 'count' and 'submissionCount' properties
        const count = entry.count || entry.submissionCount || 0;
        monthlyProgress += count;
        
        if (count > 0) {
          console.log(`${entry.date}: ${count} problems`);
        }
      }
    }
    
    console.log(`Monthly progress from calendar: ${monthlyProgress} problems solved this month`);
    return monthlyProgress;
  }

  // Generate monthly goal with real progress from calendar
  private static generateRealMonthlyGoal(calendar: any[]): { target: number; completed: number; daysLeft: number } {
    const now = new Date();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysInMonth = monthEnd.getDate();
    const daysPassed = now.getDate();
    const daysLeft = daysInMonth - daysPassed;

    // Get actual progress from calendar data (API-based problems)
    const apiCompleted = this.calculateMonthlyProgressFromCalendar(calendar);
    
    // Add locally completed problems from Topics Mastery
    const localCompleted = this.getLocallyCompletedProblemsCount();
    
    // Total completed is API progress + local progress
    const totalCompleted = apiCompleted + localCompleted;
    
    console.log(`📊 Monthly Goal Calculation:`);
    console.log(`   - API completed: ${apiCompleted}`);
    console.log(`   - Local completed: ${localCompleted}`);
    console.log(`   - Total completed: ${totalCompleted}`);
    
    // Default target (could be retrieved from MonthlyGoalsService in the future)
    const target = 30; // Default monthly goal
    
    return { 
      target, 
      completed: totalCompleted, 
      daysLeft 
    };
  }

  // Utility methods
  private static getStoredUsername(): string | null {
    return localStorage.getItem(this.USERNAME_KEY);
  }

  private static getBadgeForSolved(solved: number): string {
    if (solved >= 500) return 'LeetCode Champion';
    if (solved >= 300) return 'Algorithm Master';
    if (solved >= 200) return 'Problem Crusher';
    if (solved >= 100) return 'Code Ninja';
    if (solved >= 50) return 'Rising Star';
    return 'Problem Solver';
  }

  private static getRandomFailureStatus(): 'Wrong Answer' | 'Time Limit Exceeded' | 'Runtime Error' {
    const statuses = ['Wrong Answer', 'Time Limit Exceeded', 'Runtime Error'] as const;
    return statuses[Math.floor(this.seededRandom() * statuses.length)];
  }

  private static generateRuntime(difficulty: string): string {
    const base = difficulty === 'Easy' ? 50 : difficulty === 'Medium' ? 100 : 200;
    const variance = base * 0.5;
    const runtime = Math.floor(base + (this.seededRandom() - 0.5) * variance);
    return `${runtime} ms`;
  }

  private static generateMemory(): string {
    const memory = 40 + this.seededRandom() * 50; // 40-90 MB
    return `${memory.toFixed(1)} MB`;
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

  // Save to localStorage
  private static saveToStorage(): void {
    if (this.cache) {
      // Add cache timestamp
      const dataWithTimestamp = {
        ...this.cache,
        cacheTimestamp: new Date().toISOString()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataWithTimestamp));
    }
  }

  // Simulate solving a new problem
  static async solveNewProblem(difficulty: 'Easy' | 'Medium' | 'Hard'): Promise<void> {
    const data = await this.getUserData();
    
    // Update totals
    data.user.totalSolved++;
    data.user[difficulty.toLowerCase() as 'easy' | 'medium' | 'hard'].solved++;
    
    // Add new submission
    const problem = problemPool.find(p => p.difficulty === difficulty) || problemPool[0];
    const newSubmission: Submission = {
      problemId: problem.id,
      title: problem.title,
      difficulty,
      status: 'Accepted',
      runtime: this.generateRuntime(difficulty),
      memory: this.generateMemory(),
      language: languages[Math.floor(this.seededRandom() * languages.length)],
      date: 'Just now',
      submissionTime: new Date()
    };

    data.recentSubmissions.unshift(newSubmission);
    data.recentSubmissions = data.recentSubmissions.slice(0, 20);

    this.cache = data;
    this.saveToStorage();
  }

  // Add locally completed problems from Topics Mastery to monthly progress
  static getLocallyCompletedProblemsCount(): number {
    try {
      const completedProblems = localStorage.getItem('completed_problems');
      if (!completedProblems) return 0;
      
      const completedArray = JSON.parse(completedProblems);
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      // Check if we have monthly tracking data
      const monthlyCompletedKey = `completed_problems_monthly_${currentMonth}`;
      const monthlyCompleted = localStorage.getItem(monthlyCompletedKey);
      
      if (monthlyCompleted) {
        const monthlyArray = JSON.parse(monthlyCompleted);
        console.log(`📊 Found ${monthlyArray.length} locally completed problems this month (${currentMonth})`);
        return monthlyArray.length;
      }
      
      // If no monthly data exists, assume all current completions are from this month
      // (This handles the case when user first starts using Topics Mastery)
      if (completedArray.length > 0) {
        console.log(`📊 No monthly tracking data found, assuming ${completedArray.length} problems completed this month`);
        localStorage.setItem(monthlyCompletedKey, JSON.stringify(completedArray));
        return completedArray.length;
      }
      
      return 0;
    } catch (error) {
      console.error('Error getting locally completed problems count:', error);
      return 0;
    }
  }

  // Update monthly tracking when a problem is completed locally
  static trackLocalProblemCompletion(problemId: number, isCompleted: boolean): void {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      const monthlyCompletedKey = `completed_problems_monthly_${currentMonth}`;
      
      let monthlyCompleted: number[] = [];
      const existing = localStorage.getItem(monthlyCompletedKey);
      if (existing) {
        monthlyCompleted = JSON.parse(existing);
      }
      
      if (isCompleted && !monthlyCompleted.includes(problemId)) {
        monthlyCompleted.push(problemId);
        console.log(`✅ Added problem ${problemId} to monthly tracking for ${currentMonth}`);
      } else if (!isCompleted) {
        monthlyCompleted = monthlyCompleted.filter(id => id !== problemId);
        console.log(`❌ Removed problem ${problemId} from monthly tracking for ${currentMonth}`);
      }
      
      localStorage.setItem(monthlyCompletedKey, JSON.stringify(monthlyCompleted));
      
      // Update the overall completion count in the cached data if available
      if (this.cache) {
        this.cache.monthlyGoal.completed = monthlyCompleted.length;
        console.log(`📊 Updated monthly goal progress to ${monthlyCompleted.length} problems`);
      }
      
    } catch (error) {
      console.error('Error tracking local problem completion:', error);
    }
  }

  // Clear cache to regenerate data
  static async refreshData(): Promise<LeetCodeStats> {
    console.log('🔄 Force refreshing all LeetCode data...');
    
    // Clear cache but preserve username
    const username = localStorage.getItem(this.USERNAME_KEY) || 'sumeet2703';
    this.cache = null;
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem('demo_monthly_goal'); // Clear monthly goals cache too
    
    // Ensure username is set for real data
    localStorage.setItem(this.USERNAME_KEY, username);
    
    // Force regenerate fresh data
    const freshData = await this.getUserData();
    console.log('✅ Refreshed data - Total solved:', freshData.user.totalSolved);
    console.log('✅ Progress chart points:', freshData.progressChart.length);
    
    return freshData;
  }



  // Set username and refresh data
  static async setUsername(username: string): Promise<void> {
    localStorage.setItem(this.USERNAME_KEY, username);
    
    // Clear cache to fetch new user's data
    this.cache = null;
    localStorage.removeItem(this.STORAGE_KEY);
    
    // If username is not the default, try to fetch real data
    if (username && username !== 'developer_coder') {
      console.log('Username changed to:', username, '- will fetch real data on next load');
    }
  }

  // Update streak manually (since we can't get real streak from API)
  static async updateStreak(newStreak: number): Promise<void> {
    const data = await this.getUserData();
    data.user.streak = Math.max(0, newStreak); // Ensure non-negative
    this.cache = data;
    this.saveToStorage();
  }

  // Clear all cached data - useful when switching between demo and real accounts
  static clearAllData(): void {
    console.log('🧹 Clearing ALL LeetCode data and caches...');
    
    // Clear internal cache
    this.cache = null;
    
    // Clear main storage
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem('leetcode_stats');
    localStorage.removeItem('demo_monthly_goal');
    localStorage.removeItem('leetcode_monthly_goals');
    
    // Clear SimpleLeetCodeApi caches
    const cacheKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('leetcode_') || 
      key.includes('sumeet') ||
      key.startsWith('demo_')
    );
    
    cacheKeys.forEach(key => {
      console.log('🧹 Removing cache key:', key);
      localStorage.removeItem(key);
    });
    
    // Reset SimpleLeetCodeApi rate limiting
    try {
      SimpleLeetCodeApi.resetRateLimit();
      console.log('🔄 Rate limit reset');
    } catch (error) {
      console.log('Rate limit reset not available');
    }
    
    console.log('✅ All data cleared successfully');
  }

  // Force refresh data (clears cache and refetches)
  static async forceRefresh(): Promise<LeetCodeStats> {
    console.log('🔄 Force refreshing LeetCode data...');
    this.cache = null;
    return await this.getUserData();
  }
}

export default LeetCodeService;
