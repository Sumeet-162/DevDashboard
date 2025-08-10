// Enhanced LeetCode API using alfa-leetcode-api for comprehensive data
export interface SimpleLeetCodeStats {
  username: string;
  totalSolved: number;
  totalQuestions: number;
  easySolved: number;
  easyTotal: number;
  mediumSolved: number;
  mediumTotal: number;
  hardSolved: number;
  hardTotal: number;
  acceptanceRate: number;
  ranking: number;
}

export interface AlfaLeetCodeProfile {
  username: string;
  name: string;
  avatar: string;
  ranking: number;
  reputation: number;
  gitHub: string;
  twitter: string;
  linkedIN: string;
  website: string[];
  country: string;
  company: string;
  school: string;
  skillTags: string[];
  about: string;
  totalSolved: number;
  totalQuestions: number;
  easySolved: number;
  easyTotal: number;
  mediumSolved: number;
  mediumTotal: number;
  hardSolved: number;
  hardTotal: number;
  acceptanceRate: number;
  totalSubmissions: number;
}

export interface AlfaSubmission {
  id: string;
  title: string;
  titleSlug: string;
  statusDisplay: string;
  lang: string;
  langName: string;
  runtime: string;
  timestamp: string;
  url: string;
  isPending: string;
  memory: string;
}

export interface AlfaCalendarEntry {
  date: string;
  submissionCount: number;
}

export interface AlfaLanguageStats {
  languageName: string;
  problemsSolved: number;
}

export interface AlfaSkillStats {
  tagName: string;
  tagSlug: string;
  problemsSolved: number;
}

export interface LeetCodeProblem {
  acRate: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  freqBar: number | null;
  frontendQuestionId: string;
  isFavor: boolean;
  paidOnly: boolean;
  status: 'ac' | 'notac' | null;
  title: string;
  titleSlug: string;
  topicTags: Array<{
    name: string;
    slug: string;
  }>;
  hasSolution: boolean;
  hasVideoSolution: boolean;
}

export class SimpleLeetCodeApi {
  // Use alfa-leetcode-api as primary source for comprehensive data
  private static readonly ALFA_API = 'https://alfa-leetcode-api.onrender.com';
  private static readonly BACKUP_ENDPOINT = 'https://leetcode-stats-api.herokuapp.com';

  // Rate limiting tracking
  private static rateLimitResetTime: number = 0;
  private static requestCount: number = 0;
  private static readonly MAX_REQUESTS_PER_MINUTE = 6; // Very conservative limit
  private static readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private static readonly RETRY_DELAY = 3000; // 3 seconds between retries

  // Check if we're currently rate limited
  private static isRateLimited(): boolean {
    const now = Date.now();
    
    // Reset counter if window has passed
    if (now - this.rateLimitResetTime > this.RATE_LIMIT_WINDOW) {
      this.requestCount = 0;
      this.rateLimitResetTime = now;
    }
    
    // Check if we've exceeded the limit
    if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
      const timeUntilReset = this.RATE_LIMIT_WINDOW - (now - this.rateLimitResetTime);
      console.warn(`🚫 Internal rate limit reached. Reset in ${Math.ceil(timeUntilReset / 1000)} seconds`);
      return true;
    }
    
    return false;
  }

  // Enhanced cache management
  private static getCacheKey(username: string, endpoint: string): string {
    return `leetcode_${endpoint}_${username}_v3`;
  }

  private static getCachedData(username: string, endpoint: string, maxAge: number = 300000): any {
    try {
      const cacheKey = this.getCacheKey(username, endpoint);
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        if (age < maxAge) {
          console.log(`📦 Using cached ${endpoint} (${Math.round(age/1000)}s old) for:`, username);
          return data;
        } else {
          console.log(`🗑️ Cache expired for ${endpoint}, removing`);
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.error('Error reading cache:', error);
    }
    return null;
  }

  private static setCachedData(username: string, endpoint: string, data: any): void {
    try {
      const cacheKey = this.getCacheKey(username, endpoint);
      const cacheData = { data, timestamp: Date.now() };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`💾 Cached ${endpoint} data for:`, username);
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  }

  // Enhanced request with comprehensive error handling and backoff
  private static async makeRequest(url: string, maxRetries: number = 1): Promise<Response> {
    // Check internal rate limiting first
    if (this.isRateLimited()) {
      console.log('🚫 Skipping request due to internal rate limiting');
      throw new Error('RATE_LIMITED');
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      this.requestCount++;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        console.log(`🌐 API Request (attempt ${attempt}/${maxRetries}):`, url);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        clearTimeout(timeoutId);

        if (response.status === 429) {
          console.warn(`🚫 Rate Limited (429) on attempt ${attempt} for:`, url);
          // Exponential backoff
          const backoffTime = this.RETRY_DELAY * Math.pow(2, attempt - 1);
          if (attempt < maxRetries) {
            console.log(`⏳ Backing off for ${backoffTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            continue;
          }
          throw new Error('RATE_LIMITED');
        }

        if (response.status === 403) {
          console.warn('🔒 Forbidden (403) - API access denied for:', url);
          throw new Error('FORBIDDEN');
        }

        if (response.status >= 500) {
          console.warn(`🔧 Server Error (${response.status}) for:`, url);
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * attempt));
            continue;
          }
          throw new Error('SERVER_ERROR');
        }

        if (response.ok) {
          console.log(`✅ Successful response from:`, url);
          return response;
        }

        console.warn(`⚠️ Unexpected status ${response.status} for:`, url);
        throw new Error(`HTTP_${response.status}`);

      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            console.warn(`⏰ Request timeout (attempt ${attempt}) for:`, url);
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * attempt));
              continue;
            }
            throw new Error('TIMEOUT');
          }
          
          // Don't retry on these errors
          if (error.message.includes('RATE_LIMITED') || 
              error.message.includes('FORBIDDEN')) {
            throw error;
          }
        }
        
        if (attempt < maxRetries) {
          console.log(`🔄 Retrying after error (attempt ${attempt}):`, error);
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * attempt));
          continue;
        }
        
        console.error(`💥 All attempts failed for:`, url, error);
        throw new Error('NETWORK_ERROR');
      }
    }

    throw new Error('MAX_RETRIES_EXCEEDED');
  }

  static async fetchUserStats(username: string): Promise<SimpleLeetCodeStats | null> {
    console.log('Fetching real LeetCode stats for:', username);

    // Try alfa-leetcode-api userProfile endpoint (most comprehensive)
    try {
      const response = await fetch(`${this.ALFA_API}/userProfile/${username}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Alfa API userProfile response:', data);
        
        if (data.totalSolved !== undefined) {
          return this.parseAlfaProfileResponse(data, username);
        }
      }
    } catch (error) {
      console.warn('Alfa API userProfile failed:', error);
    }

    // Try backup API
    try {
      const response = await fetch(`${this.BACKUP_ENDPOINT}/${username}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Backup API response:', data);
        
        if (data.status !== 'error') {
          return this.parseApiResponse(data, username);
        }
      }
    } catch (error) {
      console.warn('Backup API failed:', error);
    }

    console.error('All APIs failed for username:', username);
    return null;
  }

  // Fetch comprehensive profile data with enhanced error handling and caching
  static async fetchFullProfile(username: string): Promise<AlfaLeetCodeProfile | null> {
    try {
      console.log('🔍 Fetching full profile for:', username);

      // Check cache first (10 minute cache for profile data)
      const cached = this.getCachedData(username, 'profile', 600000);
      if (cached) {
        return cached;
      }

      // If we're rate limited, try to return older cache data
      if (this.isRateLimited()) {
        const staleCache = this.getCachedData(username, 'profile', 3600000); // 1 hour old cache
        if (staleCache) {
          console.log('⚠️ Rate limited, using 1-hour old cache data');
          return staleCache;
        }
        
        const veryStaleCache = this.getCachedData(username, 'profile', 86400000); // 24 hour old cache
        if (veryStaleCache) {
          console.log('⚠️ Rate limited, using 24-hour old cache data');
          return veryStaleCache;
        }
        
        console.log('🚫 Rate limited and no cache available');
        throw new Error('RATE_LIMITED');
      }

      const response = await this.makeRequest(`${this.ALFA_API}/userProfile/${username}`, 2);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Profile data received for:', username);
        
        // Cache the successful response
        this.setCachedData(username, 'profile', data);
        return data;
      } else {
        console.error('❌ Unexpected response status:', response.status);
        throw new Error(`API_ERROR_${response.status}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`💥 Error fetching profile for ${username}:`, error.message);
        
        // For rate limiting or network errors, try to return any available cache
        if (error.message === 'RATE_LIMITED' || error.message === 'NETWORK_ERROR' || error.message === 'TIMEOUT') {
          const emergencyCache = this.getCachedData(username, 'profile', 86400000); // 24 hour old cache
          if (emergencyCache) {
            console.log('🆘 Using emergency cache due to error:', error.message);
            return emergencyCache;
          }
        }
        
        // Return null instead of throwing for graceful degradation
        if (error.message === 'RATE_LIMITED') {
          console.log('🚫 Rate limited and no cache - will use fallback data');
          return null;
        }
        
        throw error;
      }
      throw new Error('UNKNOWN_ERROR');
    }
  }

  // Fetch solved problems count
  static async fetchSolvedCount(username: string): Promise<any> {
    try {
      console.log('Fetching solved count for:', username);
      const response = await fetch(`${this.ALFA_API}/${username}/solved`);
      if (response.ok) {
        const data = await response.json();
        console.log('Solved count data received:', data);
        return data;
      } else if (response.status === 429) {
        console.warn('Rate limited by LeetCode API (429) on solved count endpoint');
        throw new Error('RATE_LIMITED');
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'RATE_LIMITED') {
        throw error;
      }
      console.error('Error fetching solved count:', error);
    }
    return null;
  }

  // Fetch contest data including ranking
  static async fetchContestData(username: string): Promise<any> {
    try {
      console.log('Fetching contest data for:', username);
      const response = await fetch(`${this.ALFA_API}/${username}/contest`);
      if (response.ok) {
        const data = await response.json();
        console.log('Contest data received:', data);
        return data;
      } else if (response.status === 429) {
        console.warn('Rate limited by LeetCode API (429) on contest endpoint');
        throw new Error('RATE_LIMITED');
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'RATE_LIMITED') {
        throw error;
      }
      console.error('Error fetching contest data:', error);
    }
    return null;
  }

  // Fetch recent submissions from alfa-leetcode-api
  static async fetchRecentSubmissions(username: string, limit: number = 20): Promise<AlfaSubmission[]> {
    try {
      const response = await fetch(`${this.ALFA_API}/${username}/submission?limit=${limit}`);
      if (response.ok) {
        const data = await response.json();
        return data.submission || [];
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
    return [];
  }

  // Fetch calendar data from alfa-leetcode-api
  static async fetchCalendar(username: string): Promise<AlfaCalendarEntry[]> {
    try {
      console.log('Fetching calendar for:', username);
      const response = await fetch(`${this.ALFA_API}/${username}/calendar`);
      if (response.ok) {
        const data = await response.json();
        console.log('Calendar data received:', data);
        // The calendar data might be in submissionCalendar property
        return this.parseCalendarData(data);
      }
    } catch (error) {
      console.error('Error fetching calendar:', error);
    }
    return [];
  }

  // Parse calendar data to extract submission counts
  private static parseCalendarData(data: any): AlfaCalendarEntry[] {
    const calendar: AlfaCalendarEntry[] = [];
    
    if (data.submissionCalendar) {
      // Convert the calendar object to array format
      for (const [timestamp, count] of Object.entries(data.submissionCalendar)) {
        const submissionCount = Number(count);
        if (submissionCount > 0) { // Only include days with submissions
          const date = new Date(parseInt(timestamp) * 1000);
          calendar.push({
            date: date.toISOString().split('T')[0],
            submissionCount: submissionCount
          });
        }
      }
    }
    
    // If calendar is empty from submissionCalendar, try to extract from recent submissions
    if (calendar.length === 0 && data.recentSubmissions) {
      const submissionDates: { [key: string]: number } = {};
      
      data.recentSubmissions.forEach((submission: any) => {
        const date = new Date(parseInt(submission.timestamp) * 1000);
        const dateStr = date.toISOString().split('T')[0];
        submissionDates[dateStr] = (submissionDates[dateStr] || 0) + 1;
      });
      
      for (const [dateStr, count] of Object.entries(submissionDates)) {
        calendar.push({
          date: dateStr,
          submissionCount: count
        });
      }
    }
    
    return calendar.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Fetch language statistics from alfa-leetcode-api
  static async fetchLanguageStats(username: string): Promise<AlfaLanguageStats[]> {
    try {
      const response = await fetch(`${this.ALFA_API}/languageStats?username=${username}`);
      if (response.ok) {
        const data = await response.json();
        return data.matchedUser?.languageProblemCount || [];
      }
    } catch (error) {
      console.error('Error fetching language stats:', error);
    }
    return [];
  }

  // Fetch skill statistics from alfa-leetcode-api
  static async fetchSkillStats(username: string): Promise<AlfaSkillStats[]> {
    try {
      const response = await fetch(`${this.ALFA_API}/skillStats/${username}`);
      if (response.ok) {
        const data = await response.json();
        return data.data?.matchedUser?.tagProblemCounts?.fundamental || [];
      }
    } catch (error) {
      console.error('Error fetching skill stats:', error);
    }
    return [];
  }

  private static parseAlfaProfileResponse(data: any, username: string): SimpleLeetCodeStats {
    console.log('Parsing profile data for username:', username);
    console.log('Raw data:', data);
    
    // Calculate real acceptance rate from submission data
    let acceptanceRate = 0;
    
    // Try to get acceptance rate from matchedUserStats
    if (data.matchedUserStats) {
      const acSubmissions = data.matchedUserStats.acSubmissionNum?.find((s: any) => s.difficulty === 'All');
      const totalSubmissions = data.matchedUserStats.totalSubmissionNum?.find((s: any) => s.difficulty === 'All');
      
      console.log('Acceptance rate calculation:', { acSubmissions, totalSubmissions });
      
      if (acSubmissions && totalSubmissions && totalSubmissions.submissions > 0) {
        // Correct LeetCode formula: accepted_submissions / total_submission_attempts * 100
        acceptanceRate = Math.round((acSubmissions.submissions / totalSubmissions.submissions) * 100 * 100) / 100;
        console.log('Calculated acceptance rate:', acceptanceRate, 'from', acSubmissions.submissions, '/', totalSubmissions.submissions);
      }
    }
    
    // Fallback: calculate from totalSubmissions array directly
    if (acceptanceRate === 0 && data.totalSubmissions && Array.isArray(data.totalSubmissions)) {
      const allStats = data.totalSubmissions.find((s: any) => s.difficulty === 'All');
      const acStats = data.matchedUserStats?.acSubmissionNum?.find((s: any) => s.difficulty === 'All');
      
      if (allStats && acStats && allStats.submissions > 0) {
        // Use accepted submissions / total attempts (LeetCode's actual formula)
        acceptanceRate = Math.round((acStats.submissions / allStats.submissions) * 100 * 100) / 100;
        console.log('Fallback acceptance rate:', acceptanceRate, 'from', acStats.submissions, '/', allStats.submissions);
      }
    }
    
    console.log('Final acceptance rate:', acceptanceRate);
    
    const result = {
      username: username, // Use the input username directly
      totalSolved: data.totalSolved || 0,
      totalQuestions: data.totalQuestions || 2500,
      easySolved: data.easySolved || 0,
      easyTotal: data.totalEasy || 850,
      mediumSolved: data.mediumSolved || 0,
      mediumTotal: data.totalMedium || 1750,
      hardSolved: data.hardSolved || 0,
      hardTotal: data.totalHard || 750,
      acceptanceRate: acceptanceRate,
      ranking: data.ranking || 0
    };
    
    console.log('Parsed result:', result);
    return result;
  }

  private static parseApiResponse(data: any, username: string): SimpleLeetCodeStats {
    return {
      username: username,
      totalSolved: data.totalSolved || 0,
      totalQuestions: data.totalQuestions || 2500,
      easySolved: data.easySolved || 0,
      easyTotal: data.totalEasy || 850,
      mediumSolved: data.mediumSolved || 0,
      mediumTotal: data.totalMedium || 1750,
      hardSolved: data.hardSolved || 0,
      hardTotal: data.totalHard || 750,
      acceptanceRate: data.acceptanceRate || 0,
      ranking: data.ranking || 0
    };
  }

  private static parseBackupApiResponse(data: any, username: string): SimpleLeetCodeStats {
    const submitStats = data.submitStatsGlobal?.acSubmissionNum || [];
    const totalStats = data.submitStatsGlobal?.totalSubmissionNum || [];

    const easySolved = submitStats.find((s: any) => s.difficulty === 'Easy')?.count || 0;
    const mediumSolved = submitStats.find((s: any) => s.difficulty === 'Medium')?.count || 0;
    const hardSolved = submitStats.find((s: any) => s.difficulty === 'Hard')?.count || 0;

    const totalSolved = easySolved + mediumSolved + hardSolved;
    const totalSubmissions = totalStats.reduce((sum: number, stat: any) => sum + stat.submissions, 0);
    const acceptanceRate = totalSubmissions > 0 ? Math.round((totalSolved / totalSubmissions) * 100) : 0;

    return {
      username: username,
      totalSolved,
      totalQuestions: 2500,
      easySolved,
      easyTotal: 850,
      mediumSolved,
      mediumTotal: 1750,
      hardSolved,
      hardTotal: 750,
      acceptanceRate,
      ranking: data.profile?.ranking || 0
    };
  }

  // Test if a username exists
  static async testUsername(username: string): Promise<boolean> {
    try {
      const stats = await this.fetchUserStats(username);
      return stats !== null;
    } catch {
      return false;
    }
  }

  // Get some sample usernames for testing
  static getSampleUsernames(): string[] {
    return [
      'leetcode', // Official LeetCode account
      'huahua', // Famous competitive programmer
      'wisdompeak', // Well-known LeetCode content creator
      'user1234', // Example username
    ];
  }

  // Enhanced method to get comprehensive user data with fallback handling
  static async fetchComprehensiveUserData(username: string) {
    try {
      console.log('🔍 Fetching comprehensive data for:', username);
      
      // Check for cached comprehensive data first (5 minute cache)
      const cachedComprehensive = this.getCachedData(username, 'comprehensive', 300000);
      if (cachedComprehensive) {
        console.log('📦 Using cached comprehensive data');
        return cachedComprehensive;
      }
      
      // The userProfile endpoint already contains most data we need
      const profile = await this.fetchFullProfile(username);
      
      if (!profile) {
        console.log('⚠️ No profile data found - using fallback structure');
        const fallbackResult = {
          profile: null,
          solved: null,
          contest: null,
          submissions: [],
          calendar: [],
          languageStats: [],
          skillStats: [],
          isRateLimited: true
        };
        
        // Cache the fallback for a short time to avoid repeated failures
        this.setCachedData(username, 'comprehensive', fallbackResult);
        return fallbackResult;
      }

      // Extract submissions and calendar from profile data (use any type for flexibility)
      const profileData = profile as any;
      const submissions = profileData.recentSubmissions || [];
      const calendar = this.parseCalendarData(profileData);

      console.log('✅ Profile data parsed successfully:', {
        totalSolved: profileData.totalSolved,
        submissions: submissions.length,
        calendar: calendar.length,
        ranking: profileData.ranking
      });

      const result = {
        profile: profileData,
        solved: profileData, // Profile contains solved data
        contest: null, // Could fetch separately if needed
        submissions: submissions,
        calendar: calendar,
        languageStats: [], // Could be enhanced later
        skillStats: [], // Could be enhanced later
        isRateLimited: false
      };

      // Cache the successful result
      this.setCachedData(username, 'comprehensive', result);
      
      console.log('✅ Comprehensive data result prepared');
      return result;
    } catch (error) {
      console.error('💥 Error fetching comprehensive data:', error);
      
      // Try to return cached data even if stale
      const staleCache = this.getCachedData(username, 'comprehensive', 3600000); // 1 hour
      if (staleCache) {
        console.log('🆘 Using stale comprehensive cache due to error');
        staleCache.isRateLimited = true;
        return staleCache;
      }
      
      // Return error structure but don't crash
      const errorResult = {
        profile: null,
        solved: null,
        contest: null,
        submissions: [],
        calendar: [],
        languageStats: [],
        skillStats: [],
        isRateLimited: true,
        error: error instanceof Error ? error.message : 'UNKNOWN_ERROR'
      };
      
      return errorResult;
    }
  }

  // Method to check if API is available
  static async isApiAvailable(): Promise<boolean> {
    try {
      const stats = await this.fetchUserStats('leetcode'); // Try a known username
      return stats !== null;
    } catch {
      return false;
    }
  }

  // Method to reset rate limiting (useful for testing or manual intervention)
  static resetRateLimit(): void {
    this.requestCount = 0;
    this.rateLimitResetTime = 0;
    console.log('🔄 Rate limit reset manually');
  }

  // Method to get current rate limit status
  static getRateLimitStatus(): { requests: number; maxRequests: number; resetTime: number; timeUntilReset: number } {
    const now = Date.now();
    const timeUntilReset = Math.max(0, this.RATE_LIMIT_WINDOW - (now - this.rateLimitResetTime));
    
    return {
      requests: this.requestCount,
      maxRequests: this.MAX_REQUESTS_PER_MINUTE,
      resetTime: this.rateLimitResetTime,
      timeUntilReset
    };
  }

  // Fetch problems by difficulty from alfa-leetcode-api
  static async fetchProblemsByDifficulty(difficulty: 'Easy' | 'Medium' | 'Hard'): Promise<LeetCodeProblem[]> {
    try {
      console.log('Fetching problems for difficulty:', difficulty);
      
      // Try multiple endpoints to get more problems
      let allProblems: any[] = [];
      
      // Method 1: Try the problems endpoint without filters first
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
        
        const response = await fetch(`${this.ALFA_API}/problems`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            allProblems = data;
            console.log(`Fetched ${allProblems.length} total problems from API`);
          }
        } else if (response.status === 429) {
          console.warn('API rate limited, using fallback immediately');
          return this.getRotatedFallbackProblems(difficulty);
        }
      } catch (error) {
        console.warn('Failed to fetch from /problems endpoint:', error);
        // For rate limiting or network issues, go straight to fallback
        if (error instanceof Error && (error.message.includes('429') || error.name === 'AbortError')) {
          console.log('API timeout or rate limit detected, using fallback');
          return this.getRotatedFallbackProblems(difficulty);
        }
      }
      
      // Method 2: If no problems, try the problemset endpoint
      if (allProblems.length === 0) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
          
          const response = await fetch(`${this.ALFA_API}/problemset`, {
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            if (data.problems && Array.isArray(data.problems)) {
              allProblems = data.problems;
              console.log(`Fetched ${allProblems.length} problems from problemset endpoint`);
            }
          } else if (response.status === 429) {
            console.warn('Problemset API rate limited, using fallback');
            return this.getRotatedFallbackProblems(difficulty);
          }
        } catch (error) {
          console.warn('Failed to fetch from /problemset endpoint:', error);
          // If both API calls fail, use fallback immediately
          console.log('Both API endpoints failed, using enhanced fallback');
          return this.getRotatedFallbackProblems(difficulty);
        }
      }
      
      // Filter problems by difficulty and remove paid-only problems
      const filteredProblems = allProblems.filter((problem: any) => 
        problem.difficulty === difficulty && 
        !problem.paidOnly && 
        problem.title && 
        problem.titleSlug
      );
      
      console.log(`Found ${filteredProblems.length} ${difficulty} problems after filtering`);
      
      if (filteredProblems.length === 0) {
        console.log('No problems found from API, using fallback');
        return this.getRotatedFallbackProblems(difficulty);
      }
      
      // Sort by acceptance rate and randomize selection
      const sortedProblems = filteredProblems.sort((a: any, b: any) => {
        // For Easy: Higher acceptance rate first (easier problems)
        // For Medium/Hard: Mix of acceptance rates for variety
        if (difficulty === 'Easy') {
          return (b.acRate || 0) - (a.acRate || 0);
        } else {
          // Add some randomization while still considering acceptance rate
          const randomFactor = (Math.random() - 0.5) * 20; // ±10% random adjustment
          return ((b.acRate || 0) - (a.acRate || 0)) + randomFactor;
        }
      });
      
      // Get daily rotation seed based on current date
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const seed = this.generateSeedFromString(today + difficulty);
      
      // Select 30 problems with daily rotation
      const selectedProblems = this.selectProblemsWithSeed(sortedProblems, 30, seed);
      
      return selectedProblems.map(this.normalizeProblem);
      
    } catch (error) {
      console.error('Error fetching problems:', error);
      return this.getRotatedFallbackProblems(difficulty);
    }
  }

  // Generate a seed number from a string for consistent daily rotation
  private static generateSeedFromString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Select problems using seeded randomization for daily rotation
  private static selectProblemsWithSeed(problems: any[], count: number, seed: number): any[] {
    if (problems.length <= count) return problems;
    
    // Create a seeded random number generator
    let currentSeed = seed;
    const seededRandom = () => {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      return currentSeed / 233280;
    };
    
    // Fisher-Yates shuffle with seeded random
    const shuffled = [...problems];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled.slice(0, count);
  }

  // Normalize problem data from API to our interface
  private static normalizeProblem(problem: any): LeetCodeProblem {
    return {
      frontendQuestionId: problem.frontendQuestionId || problem.questionId || problem.id?.toString() || '0',
      title: problem.title || 'Unknown Problem',
      titleSlug: problem.titleSlug || problem.slug || '',
      difficulty: problem.difficulty || 'Easy',
      acRate: problem.acRate || problem.acceptanceRate || Math.random() * 50 + 25, // 25-75% if not available
      paidOnly: problem.paidOnly || false,
      status: problem.status || null,
      isFavor: problem.isFavor || false,
      freqBar: problem.freqBar || null,
      topicTags: (problem.topicTags || problem.tags || []).map((tag: any) => ({
        name: tag.name || tag,
        slug: tag.slug || tag.toLowerCase().replace(/\s+/g, '-')
      })),
      hasSolution: problem.hasSolution !== false, // Default to true if not specified
      hasVideoSolution: problem.hasVideoSolution || false
    };
  }

  // Enhanced fallback problems with daily rotation
  private static getRotatedFallbackProblems(difficulty: 'Easy' | 'Medium' | 'Hard'): LeetCodeProblem[] {
    const allProblems = {
      Easy: [
        // Array Problems
        { id: "1", title: "Two Sum", slug: "two-sum", acRate: 52.3, tags: ["Array", "Hash Table"] },
        { id: "26", title: "Remove Duplicates from Sorted Array", slug: "remove-duplicates-from-sorted-array", acRate: 53.1, tags: ["Array", "Two Pointers"] },
        { id: "27", title: "Remove Element", slug: "remove-element", acRate: 54.2, tags: ["Array", "Two Pointers"] },
        { id: "35", title: "Search Insert Position", slug: "search-insert-position", acRate: 42.8, tags: ["Array", "Binary Search"] },
        { id: "66", title: "Plus One", slug: "plus-one", acRate: 43.5, tags: ["Array", "Math"] },
        { id: "88", title: "Merge Sorted Array", slug: "merge-sorted-array", acRate: 46.2, tags: ["Array", "Two Pointers"] },
        { id: "118", title: "Pascal's Triangle", slug: "pascals-triangle", acRate: 71.2, tags: ["Array", "Dynamic Programming"] },
        { id: "119", title: "Pascal's Triangle II", slug: "pascals-triangle-ii", acRate: 58.9, tags: ["Array", "Dynamic Programming"] },
        { id: "169", title: "Majority Element", slug: "majority-element", acRate: 65.1, tags: ["Array", "Hash Table"] },
        { id: "217", title: "Contains Duplicate", slug: "contains-duplicate", acRate: 61.2, tags: ["Array", "Hash Table"] },
        { id: "268", title: "Missing Number", slug: "missing-number", acRate: 63.4, tags: ["Array", "Math"] },
        { id: "283", title: "Move Zeroes", slug: "move-zeroes", acRate: 61.7, tags: ["Array", "Two Pointers"] },
        
        // String Problems
        { id: "14", title: "Longest Common Prefix", slug: "longest-common-prefix", acRate: 42.1, tags: ["String"] },
        { id: "20", title: "Valid Parentheses", slug: "valid-parentheses", acRate: 40.2, tags: ["String", "Stack"] },
        { id: "28", title: "Find the Index of the First Occurrence", slug: "find-the-index-of-the-first-occurrence-in-a-string", acRate: 38.9, tags: ["String", "Two Pointers"] },
        { id: "58", title: "Length of Last Word", slug: "length-of-last-word", acRate: 42.3, tags: ["String"] },
        { id: "67", title: "Add Binary", slug: "add-binary", acRate: 52.4, tags: ["Math", "String"] },
        { id: "125", title: "Valid Palindrome", slug: "valid-palindrome", acRate: 45.8, tags: ["Two Pointers", "String"] },
        { id: "151", title: "Reverse Words in a String", slug: "reverse-words-in-a-string", acRate: 31.8, tags: ["Two Pointers", "String"] },
        { id: "242", title: "Valid Anagram", slug: "valid-anagram", acRate: 63.2, tags: ["Hash Table", "String"] },
        { id: "344", title: "Reverse String", slug: "reverse-string", acRate: 78.1, tags: ["Two Pointers", "String"] },
        { id: "383", title: "Ransom Note", slug: "ransom-note", acRate: 60.3, tags: ["Hash Table", "String"] },
        
        // Linked List Problems
        { id: "21", title: "Merge Two Sorted Lists", slug: "merge-two-sorted-lists", acRate: 63.4, tags: ["Linked List", "Recursion"] },
        { id: "83", title: "Remove Duplicates from Sorted List", slug: "remove-duplicates-from-sorted-list", acRate: 51.2, tags: ["Linked List"] },
        { id: "141", title: "Linked List Cycle", slug: "linked-list-cycle", acRate: 48.9, tags: ["Hash Table", "Linked List"] },
        { id: "160", title: "Intersection of Two Linked Lists", slug: "intersection-of-two-linked-lists", acRate: 54.1, tags: ["Hash Table", "Linked List"] },
        { id: "203", title: "Remove Linked List Elements", slug: "remove-linked-list-elements", acRate: 45.6, tags: ["Linked List", "Recursion"] },
        { id: "206", title: "Reverse Linked List", slug: "reverse-linked-list", acRate: 73.2, tags: ["Linked List", "Recursion"] },
        { id: "234", title: "Palindrome Linked List", slug: "palindrome-linked-list", acRate: 51.8, tags: ["Linked List", "Two Pointers"] },
        
        // Tree Problems
        { id: "94", title: "Binary Tree Inorder Traversal", slug: "binary-tree-inorder-traversal", acRate: 74.8, tags: ["Stack", "Tree"] },
        { id: "100", title: "Same Tree", slug: "same-tree", acRate: 58.2, tags: ["Tree", "Depth-First Search"] },
        { id: "101", title: "Symmetric Tree", slug: "symmetric-tree", acRate: 54.3, tags: ["Tree", "Depth-First Search"] },
        { id: "104", title: "Maximum Depth of Binary Tree", slug: "maximum-depth-of-binary-tree", acRate: 74.9, tags: ["Tree", "Depth-First Search"] },
        { id: "110", title: "Balanced Binary Tree", slug: "balanced-binary-tree", acRate: 49.8, tags: ["Tree", "Depth-First Search"] },
        { id: "111", title: "Minimum Depth of Binary Tree", slug: "minimum-depth-of-binary-tree", acRate: 45.1, tags: ["Tree", "Breadth-First Search"] },
        { id: "112", title: "Path Sum", slug: "path-sum", acRate: 48.9, tags: ["Tree", "Depth-First Search"] },
        { id: "144", title: "Binary Tree Preorder Traversal", slug: "binary-tree-preorder-traversal", acRate: 67.2, tags: ["Stack", "Tree"] },
        { id: "145", title: "Binary Tree Postorder Traversal", slug: "binary-tree-postorder-traversal", acRate: 69.1, tags: ["Stack", "Tree"] },
        { id: "226", title: "Invert Binary Tree", slug: "invert-binary-tree", acRate: 76.8, tags: ["Tree", "Depth-First Search"] },
        { id: "235", title: "Lowest Common Ancestor of BST", slug: "lowest-common-ancestor-of-a-binary-search-tree", acRate: 62.1, tags: ["Tree", "Depth-First Search"] },
        { id: "257", title: "Binary Tree Paths", slug: "binary-tree-paths", acRate: 61.3, tags: ["String", "Tree"] },
        
        // Math Problems
        { id: "7", title: "Reverse Integer", slug: "reverse-integer", acRate: 27.4, tags: ["Math"] },
        { id: "9", title: "Palindrome Number", slug: "palindrome-number", acRate: 54.1, tags: ["Math"] },
        { id: "13", title: "Roman to Integer", slug: "roman-to-integer", acRate: 59.2, tags: ["Hash Table", "Math"] },
        { id: "69", title: "Sqrt(x)", slug: "sqrtx", acRate: 38.1, tags: ["Math", "Binary Search"] },
        { id: "70", title: "Climbing Stairs", slug: "climbing-stairs", acRate: 52.3, tags: ["Math", "Dynamic Programming"] },
        { id: "121", title: "Best Time to Buy and Sell Stock", slug: "best-time-to-buy-and-sell-stock", acRate: 54.1, tags: ["Array", "Dynamic Programming"] },
        { id: "136", title: "Single Number", slug: "single-number", acRate: 71.2, tags: ["Array", "Bit Manipulation"] },
        { id: "171", title: "Excel Sheet Column Number", slug: "excel-sheet-column-number", acRate: 62.4, tags: ["Math", "String"] },
        { id: "190", title: "Reverse Bits", slug: "reverse-bits", acRate: 55.1, tags: ["Divide and Conquer", "Bit Manipulation"] },
        { id: "191", title: "Number of 1 Bits", slug: "number-of-1-bits", acRate: 69.8, tags: ["Bit Manipulation"] }
      ],
      
      Medium: [
        // Array Problems
        { id: "11", title: "Container With Most Water", slug: "container-with-most-water", acRate: 54.2, tags: ["Array", "Two Pointers"] },
        { id: "15", title: "3Sum", slug: "3sum", acRate: 32.4, tags: ["Array", "Two Pointers"] },
        { id: "16", title: "3Sum Closest", slug: "3sum-closest", acRate: 45.8, tags: ["Array", "Two Pointers"] },
        { id: "18", title: "4Sum", slug: "4sum", acRate: 35.1, tags: ["Array", "Two Pointers"] },
        { id: "31", title: "Next Permutation", slug: "next-permutation", acRate: 38.2, tags: ["Array", "Two Pointers"] },
        { id: "33", title: "Search in Rotated Sorted Array", slug: "search-in-rotated-sorted-array", acRate: 39.1, tags: ["Array", "Binary Search"] },
        { id: "34", title: "Find First and Last Position", slug: "find-first-and-last-position-of-element-in-sorted-array", acRate: 42.3, tags: ["Array", "Binary Search"] },
        { id: "39", title: "Combination Sum", slug: "combination-sum", acRate: 68.9, tags: ["Array", "Backtracking"] },
        { id: "40", title: "Combination Sum II", slug: "combination-sum-ii", acRate: 53.8, tags: ["Array", "Backtracking"] },
        { id: "46", title: "Permutations", slug: "permutations", acRate: 76.1, tags: ["Array", "Backtracking"] },
        { id: "47", title: "Permutations II", slug: "permutations-ii", acRate: 57.2, tags: ["Array", "Backtracking"] },
        { id: "48", title: "Rotate Image", slug: "rotate-image", acRate: 71.8, tags: ["Array", "Math"] },
        { id: "49", title: "Group Anagrams", slug: "group-anagrams", acRate: 67.2, tags: ["Array", "Hash Table"] },
        { id: "53", title: "Maximum Subarray", slug: "maximum-subarray", acRate: 50.1, tags: ["Array", "Dynamic Programming"] },
        { id: "54", title: "Spiral Matrix", slug: "spiral-matrix", acRate: 45.2, tags: ["Array", "Matrix"] },
        { id: "55", title: "Jump Game", slug: "jump-game", acRate: 38.4, tags: ["Array", "Dynamic Programming"] },
        { id: "56", title: "Merge Intervals", slug: "merge-intervals", acRate: 46.8, tags: ["Array", "Sorting"] },
        { id: "59", title: "Spiral Matrix II", slug: "spiral-matrix-ii", acRate: 67.1, tags: ["Array", "Matrix"] },
        { id: "62", title: "Unique Paths", slug: "unique-paths", acRate: 63.4, tags: ["Math", "Dynamic Programming"] },
        { id: "63", title: "Unique Paths II", slug: "unique-paths-ii", acRate: 39.8, tags: ["Array", "Dynamic Programming"] },
        
        // String Problems
        { id: "3", title: "Longest Substring Without Repeating Characters", slug: "longest-substring-without-repeating-characters", acRate: 33.1, tags: ["Hash Table", "String"] },
        { id: "5", title: "Longest Palindromic Substring", slug: "longest-palindromic-substring", acRate: 33.2, tags: ["String", "Dynamic Programming"] },
        { id: "6", title: "Zigzag Conversion", slug: "zigzag-conversion", acRate: 47.1, tags: ["String"] },
        { id: "8", title: "String to Integer (atoi)", slug: "string-to-integer-atoi", acRate: 16.9, tags: ["Math", "String"] },
        { id: "12", title: "Integer to Roman", slug: "integer-to-roman", acRate: 64.1, tags: ["Hash Table", "Math"] },
        { id: "17", title: "Letter Combinations of a Phone Number", slug: "letter-combinations-of-a-phone-number", acRate: 58.1, tags: ["Hash Table", "String"] },
        { id: "22", title: "Generate Parentheses", slug: "generate-parentheses", acRate: 73.8, tags: ["String", "Backtracking"] },
        { id: "49", title: "Group Anagrams", slug: "group-anagrams", acRate: 67.2, tags: ["Array", "Hash Table"] },
        { id: "71", title: "Simplify Path", slug: "simplify-path", acRate: 40.1, tags: ["String", "Stack"] },
        { id: "91", title: "Decode Ways", slug: "decode-ways", acRate: 32.4, tags: ["String", "Dynamic Programming"] },
        
        // Linked List Problems
        { id: "2", title: "Add Two Numbers", slug: "add-two-numbers", acRate: 40.1, tags: ["Linked List", "Math"] },
        { id: "19", title: "Remove Nth Node From End", slug: "remove-nth-node-from-end-of-list", acRate: 40.8, tags: ["Linked List", "Two Pointers"] },
        { id: "24", title: "Swap Nodes in Pairs", slug: "swap-nodes-in-pairs", acRate: 61.2, tags: ["Linked List", "Recursion"] },
        { id: "61", title: "Rotate List", slug: "rotate-list", acRate: 36.1, tags: ["Linked List", "Two Pointers"] },
        { id: "82", title: "Remove Duplicates from Sorted List II", slug: "remove-duplicates-from-sorted-list-ii", acRate: 45.8, tags: ["Linked List", "Two Pointers"] },
        { id: "86", title: "Partition List", slug: "partition-list", acRate: 53.2, tags: ["Linked List", "Two Pointers"] },
        { id: "92", title: "Reverse Linked List II", slug: "reverse-linked-list-ii", acRate: 47.2, tags: ["Linked List"] },
        { id: "138", title: "Copy List with Random Pointer", slug: "copy-list-with-random-pointer", acRate: 52.1, tags: ["Hash Table", "Linked List"] },
        { id: "142", title: "Linked List Cycle II", slug: "linked-list-cycle-ii", acRate: 48.2, tags: ["Hash Table", "Linked List"] },
        { id: "143", title: "Reorder List", slug: "reorder-list", acRate: 53.8, tags: ["Linked List", "Two Pointers"] },
        
        // Tree Problems
        { id: "95", title: "Unique Binary Search Trees II", slug: "unique-binary-search-trees-ii", acRate: 52.1, tags: ["Dynamic Programming", "Tree"] },
        { id: "96", title: "Unique Binary Search Trees", slug: "unique-binary-search-trees", acRate: 60.2, tags: ["Math", "Dynamic Programming"] },
        { id: "98", title: "Validate Binary Search Tree", slug: "validate-binary-search-tree", acRate: 32.1, tags: ["Tree", "Depth-First Search"] },
        { id: "102", title: "Binary Tree Level Order Traversal", slug: "binary-tree-level-order-traversal", acRate: 65.2, tags: ["Tree", "Breadth-First Search"] },
        { id: "103", title: "Binary Tree Zigzag Level Order", slug: "binary-tree-zigzag-level-order-traversal", acRate: 56.8, tags: ["Tree", "Breadth-First Search"] },
        { id: "105", title: "Construct Binary Tree from Preorder and Inorder", slug: "construct-binary-tree-from-preorder-and-inorder-traversal", acRate: 61.2, tags: ["Array", "Hash Table"] },
        { id: "106", title: "Construct Binary Tree from Inorder and Postorder", slug: "construct-binary-tree-from-inorder-and-postorder-traversal", acRate: 58.4, tags: ["Array", "Hash Table"] },
        { id: "113", title: "Path Sum II", slug: "path-sum-ii", acRate: 53.2, tags: ["Backtracking", "Tree"] },
        { id: "114", title: "Flatten Binary Tree to Linked List", slug: "flatten-binary-tree-to-linked-list", acRate: 61.8, tags: ["Linked List", "Tree"] },
        { id: "116", title: "Populating Next Right Pointers", slug: "populating-next-right-pointers-in-each-node", acRate: 60.4, tags: ["Tree", "Depth-First Search"] }
      ],
      
      Hard: [
        // Array Problems
        { id: "4", title: "Median of Two Sorted Arrays", slug: "median-of-two-sorted-arrays", acRate: 35.2, tags: ["Array", "Binary Search"] },
        { id: "23", title: "Merge k Sorted Lists", slug: "merge-k-sorted-lists", acRate: 47.8, tags: ["Linked List", "Divide and Conquer"] },
        { id: "25", title: "Reverse Nodes in k-Group", slug: "reverse-nodes-in-k-group", acRate: 56.1, tags: ["Linked List", "Recursion"] },
        { id: "30", title: "Substring with Concatenation of All Words", slug: "substring-with-concatenation-of-all-words", acRate: 30.8, tags: ["Hash Table", "String"] },
        { id: "32", title: "Longest Valid Parentheses", slug: "longest-valid-parentheses", acRate: 33.2, tags: ["String", "Dynamic Programming"] },
        { id: "37", title: "Sudoku Solver", slug: "sudoku-solver", acRate: 58.9, tags: ["Array", "Backtracking"] },
        { id: "41", title: "First Missing Positive", slug: "first-missing-positive", acRate: 37.8, tags: ["Array", "Hash Table"] },
        { id: "42", title: "Trapping Rain Water", slug: "trapping-rain-water", acRate: 59.1, tags: ["Array", "Two Pointers"] },
        { id: "44", title: "Wildcard Matching", slug: "wildcard-matching", acRate: 27.2, tags: ["String", "Dynamic Programming"] },
        { id: "45", title: "Jump Game II", slug: "jump-game-ii", acRate: 38.4, tags: ["Array", "Dynamic Programming"] },
        { id: "51", title: "N-Queens", slug: "n-queens", acRate: 64.2, tags: ["Array", "Backtracking"] },
        { id: "52", title: "N-Queens II", slug: "n-queens-ii", acRate: 71.8, tags: ["Array", "Backtracking"] },
        { id: "57", title: "Insert Interval", slug: "insert-interval", acRate: 39.1, tags: ["Array", "Sorting"] },
        { id: "60", title: "Permutation Sequence", slug: "permutation-sequence", acRate: 44.2, tags: ["Math", "Recursion"] },
        { id: "65", title: "Valid Number", slug: "valid-number", acRate: 18.9, tags: ["Math", "String"] },
        { id: "68", title: "Text Justification", slug: "text-justification", acRate: 39.8, tags: ["Array", "String"] },
        { id: "72", title: "Edit Distance", slug: "edit-distance", acRate: 53.8, tags: ["String", "Dynamic Programming"] },
        { id: "76", title: "Minimum Window Substring", slug: "minimum-window-substring", acRate: 40.2, tags: ["Hash Table", "String"] },
        { id: "84", title: "Largest Rectangle in Histogram", slug: "largest-rectangle-in-histogram", acRate: 42.1, tags: ["Array", "Stack"] },
        { id: "85", title: "Maximal Rectangle", slug: "maximal-rectangle", acRate: 45.2, tags: ["Array", "Dynamic Programming"] },
        { id: "87", title: "Scramble String", slug: "scramble-string", acRate: 35.1, tags: ["String", "Dynamic Programming"] },
        { id: "97", title: "Interleaving String", slug: "interleaving-string", acRate: 37.8, tags: ["String", "Dynamic Programming"] },
        { id: "99", title: "Recover Binary Search Tree", slug: "recover-binary-search-tree", acRate: 52.1, tags: ["Tree", "Depth-First Search"] },
        { id: "115", title: "Distinct Subsequences", slug: "distinct-subsequences", acRate: 43.2, tags: ["String", "Dynamic Programming"] },
        { id: "123", title: "Best Time to Buy and Sell Stock III", slug: "best-time-to-buy-and-sell-stock-iii", acRate: 48.1, tags: ["Array", "Dynamic Programming"] },
        { id: "124", title: "Binary Tree Maximum Path Sum", slug: "binary-tree-maximum-path-sum", acRate: 38.2, tags: ["Dynamic Programming", "Tree"] },
        { id: "126", title: "Word Ladder II", slug: "word-ladder-ii", acRate: 27.1, tags: ["Hash Table", "String"] },
        { id: "127", title: "Word Ladder", slug: "word-ladder", acRate: 36.8, tags: ["Hash Table", "String"] },
        { id: "128", title: "Longest Consecutive Sequence", slug: "longest-consecutive-sequence", acRate: 48.9, tags: ["Union Find", "Array"] },
        { id: "132", title: "Palindrome Partitioning II", slug: "palindrome-partitioning-ii", acRate: 34.2, tags: ["String", "Dynamic Programming"] }
      ]
    };

    const problemList = allProblems[difficulty] || [];
    
    // Get daily rotation
    const today = new Date().toISOString().split('T')[0];
    const seed = this.generateSeedFromString(today + difficulty);
    const rotatedProblems = this.selectProblemsWithSeed(problemList, 25, seed);
    
    // Convert to LeetCodeProblem format
    return rotatedProblems.map((p: any) => ({
      frontendQuestionId: p.id,
      title: p.title,
      titleSlug: p.slug,
      difficulty: difficulty,
      acRate: p.acRate,
      paidOnly: false,
      status: null,
      isFavor: false,
      freqBar: null,
      topicTags: p.tags.map((tag: string) => ({
        name: tag,
        slug: tag.toLowerCase().replace(/\s+/g, '-')
      })),
      hasSolution: true,
      hasVideoSolution: Math.random() > 0.5 // Random for fallback
    }));
  }
}
