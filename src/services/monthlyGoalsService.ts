// Monthly Goals Service
// Handles CRUD operations for user monthly goals
// Integrates with LeetCode API for automatic progress tracking

import { supabase } from '@/lib/supabase';

export interface MonthlyGoal {
  target: number;
  completed: number;
  month: string;
  daysLeft: number;
  daysInMonth: number;
  daysPassed: number;
  progressPercentage: number;
  lastUpdated?: string;
  isFromLeetCode?: boolean; // Track if progress comes from LeetCode API
}

export interface MonthlyGoalUpdate {
  target?: number;
  completed?: number;
}

export class MonthlyGoalsService {
  // Helper to check if we should use database vs localStorage
  private static shouldUseDatabase(userId: string | undefined): boolean {
    // Use database if we have a userId (any non-empty string)
    // Use localStorage for demo mode (undefined, empty, or 'demo-user')
    return !!(userId && userId !== 'demo-user' && userId.trim().length > 0);
  }

  // Demo user data management
  private static getDemoGoalData(): { target: number; completed: number; month: string } {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const stored = localStorage.getItem('demo_monthly_goal');
    
    if (stored) {
      try {
        const data = JSON.parse(stored);
        // Check if it's for current month, reset if not
        if (data.month !== currentMonth) {
          this.setDemoGoalData({ target: 30, completed: 0, month: currentMonth });
          return { target: 30, completed: 0, month: currentMonth };
        }
        
        // Special fix: If we have a real LeetCode username but high completed count,
        // it's likely fake demo data that needs to be reset
        const username = localStorage.getItem('leetcode_username');
        if (username && username !== 'developer_coder' && data.completed > 15) {
          console.log('Detected fake demo progress (' + data.completed + ') for real user (' + username + '), resetting to 0');
          this.setDemoGoalData({ target: data.target, completed: 0, month: currentMonth });
          return { target: data.target, completed: 0, month: currentMonth };
        }
        
        return data;
      } catch (error) {
        console.error('Error parsing demo goal data:', error);
      }
    }
    
    // Default demo data
    const defaultData = { target: 30, completed: 0, month: currentMonth };
    this.setDemoGoalData(defaultData);
    return defaultData;
  }

  private static setDemoGoalData(data: { target: number; completed: number; month: string }): void {
    localStorage.setItem('demo_monthly_goal', JSON.stringify(data));
  }

  // Get monthly progress from LeetCode service if available
  private static async getActualLeetCodeProgress(): Promise<{ progress: number; isValid: boolean }> {
    try {
      // Check if we have a real username (not demo data)
      const username = localStorage.getItem('leetcode_username');
      if (!username || username === 'developer_coder') {
        console.log('No real LeetCode username configured');
        return { progress: 0, isValid: false };
      }

      console.log('Checking LeetCode progress for user:', username);

      // Try to get monthly progress directly from LeetCode service
      try {
        const leetcodeData = await import('./leetcodeService').then(service => service.default.getUserData());
        if (leetcodeData && leetcodeData.monthlyGoal) {
          const actualProgress = leetcodeData.monthlyGoal.completed || 0;
          console.log('✅ LeetCode monthly progress from service (includes local):', actualProgress);
          return { progress: actualProgress, isValid: true };
        }
      } catch (serviceError) {
        console.log('Could not get fresh LeetCode data from service:', serviceError);
      }

      // Fallback: Try to get cached LeetCode data
      const leetcodeData = localStorage.getItem('leetcode_stats');
      if (leetcodeData) {
        const parsed = JSON.parse(leetcodeData);
        
        // Check if the data has monthly goal information
        if (parsed.monthlyGoal && parsed.monthlyGoal.completed !== undefined) {
          const cachedProgress = parsed.monthlyGoal.completed || 0;
          console.log('✅ Found LeetCode monthly progress from cache:', cachedProgress);
          return { progress: cachedProgress, isValid: true };
        }
        
        console.log('⚠️ LeetCode data exists but no monthly goal data found');
      }

      // Fallback: Check for locally completed problems from Topics Mastery
      try {
        const LeetCodeService = await import('./leetcodeService').then(service => service.default);
        const localProgress = LeetCodeService.getLocallyCompletedProblemsCount();
        if (localProgress > 0) {
          console.log('✅ Found local progress from Topics Mastery:', localProgress);
          return { progress: localProgress, isValid: true };
        }
      } catch (error) {
        console.log('Could not get local progress:', error);
      }
      
      console.log('✅ LeetCode username configured (' + username + ') but no cached data available - assuming 0 progress (correct for new month)');
      return { progress: 0, isValid: true }; // Valid connection but 0 progress (which is correct for your account)
      
    } catch (error) {
      console.error('❌ Error getting LeetCode progress:', error);
      return { progress: 0, isValid: false };
    }
  }

  // Get current month's goal for a user
  static async getUserMonthlyGoal(userId: string): Promise<MonthlyGoal | null> {
    try {
      // For demo users or when not using database, return demo data from localStorage
      if (!this.shouldUseDatabase(userId)) {
        const demoData = this.getDemoGoalData();
        
        // Try to get actual LeetCode progress for demo users
        const leetcodeResult = await this.getActualLeetCodeProgress();
        if (leetcodeResult.isValid) {
          // Use actual LeetCode progress instead of demo progress
          demoData.completed = leetcodeResult.progress;
          console.log('Overriding demo progress with actual LeetCode progress:', leetcodeResult.progress);
          
          // Also update the stored demo data so it persists
          this.setDemoGoalData({
            target: demoData.target,
            completed: leetcodeResult.progress,
            month: demoData.month
          });
        } else {
          console.log('No valid LeetCode data, using stored demo progress:', demoData.completed);
        }
        
        const result = this.calculateMonthlyGoalStats(demoData);
        result.isFromLeetCode = leetcodeResult.isValid;
        return result;
      }

      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

      const { data, error } = await supabase
        .from('user_preferences')
        .select('monthly_goal_target, monthly_goal_completed, monthly_goal_month, monthly_goal_last_updated')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching monthly goal:', error);
        // Return demo data instead of failing
        const demoData = this.getDemoGoalData();
        const leetcodeResult = await this.getActualLeetCodeProgress();
        if (leetcodeResult.isValid) {
          demoData.completed = leetcodeResult.progress;
        }
        const result = this.calculateMonthlyGoalStats(demoData);
        result.isFromLeetCode = leetcodeResult.isValid;
        return result;
      }

      if (!data) {
        // Create default preferences if they don't exist
        await this.createDefaultPreferences(userId);
        return this.getDefaultMonthlyGoal();
      }

      // Check if we need to reset for new month
      const goalMonth = data.monthly_goal_month || currentMonth;
      if (goalMonth !== currentMonth) {
        // Auto-reset for new month
        await this.resetMonthlyGoal(userId);
        return this.getDefaultMonthlyGoal();
      }

      // For real users, try to get actual LeetCode progress
      const leetcodeResult = await this.getActualLeetCodeProgress();
      let completed = data.monthly_goal_completed || 0;
      let isFromLeetCode = false;
      
      if (leetcodeResult.isValid) {
        // Use actual LeetCode progress and update database
        completed = leetcodeResult.progress;
        isFromLeetCode = true;
        // Update the database with real progress (but don't wait for it)
        this.updateMonthlyGoalProgress(userId, leetcodeResult.progress);
        console.log('Using actual LeetCode progress for real user:', leetcodeResult.progress);
      }

      const result = this.calculateMonthlyGoalStats({
        target: data.monthly_goal_target || 30,
        completed,
        month: goalMonth,
        lastUpdated: data.monthly_goal_last_updated
      });
      
      result.isFromLeetCode = isFromLeetCode;
      return result;

    } catch (error) {
      console.error('Error in getUserMonthlyGoal:', error);
      const demoData = this.getDemoGoalData();
      const result = this.calculateMonthlyGoalStats(demoData);
      result.isFromLeetCode = false;
      return result;
    }
  }

  // Update monthly goal target
  static async updateMonthlyGoalTarget(userId: string, target: number): Promise<boolean> {
    try {
      console.log('updateMonthlyGoalTarget called with:', { userId, target });
      
      // For demo users, save to localStorage
      if (!this.shouldUseDatabase(userId)) {
        console.log('Using localStorage for demo user');
        const currentMonth = new Date().toISOString().slice(0, 7);
        const currentData = this.getDemoGoalData();
        this.setDemoGoalData({
          target: Math.max(1, Math.min(target, 200)),
          completed: currentData.completed,
          month: currentMonth
        });
        console.log('Demo user goal updated to:', target);
        return true;
      }

      console.log('Using database for authenticated user:', userId);
      const currentMonth = new Date().toISOString().slice(0, 7);

      // First try to upsert the record
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          id: userId,
          monthly_goal_target: Math.max(1, Math.min(target, 200)), // Limit between 1-200
          monthly_goal_month: currentMonth,
          monthly_goal_last_updated: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating monthly goal target:', error);
        return false;
      }

      console.log('Monthly goal target updated successfully in database');
      return true;
    } catch (error) {
      console.error('Error in updateMonthlyGoalTarget:', error);
      return false;
    }
  }

  // Update monthly goal progress
  static async updateMonthlyGoalProgress(userId: string, completed: number): Promise<boolean> {
    try {
      // For demo users, save to localStorage
      if (!this.shouldUseDatabase(userId)) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const currentData = this.getDemoGoalData();
        this.setDemoGoalData({
          target: currentData.target,
          completed: Math.max(0, completed),
          month: currentMonth
        });
        console.log('Demo user progress updated to:', completed);
        return true;
      }

      const currentMonth = new Date().toISOString().slice(0, 7);

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          id: userId,
          monthly_goal_completed: Math.max(0, completed),
          monthly_goal_month: currentMonth,
          monthly_goal_last_updated: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating monthly goal progress:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateMonthlyGoalProgress:', error);
      return false;
    }
  }

  // Increment monthly goal progress by one
  static async incrementMonthlyGoalProgress(userId: string): Promise<boolean> {
    try {
      // For demo users, update localStorage
      if (!this.shouldUseDatabase(userId)) {
        const currentData = this.getDemoGoalData();
        return await this.updateMonthlyGoalProgress(userId, currentData.completed + 1);
      }

      const currentGoal = await this.getUserMonthlyGoal(userId);
      if (!currentGoal) return false;

      return await this.updateMonthlyGoalProgress(userId, currentGoal.completed + 1);
    } catch (error) {
      console.error('Error in incrementMonthlyGoalProgress:', error);
      return false;
    }
  }

  // Reset monthly goal for new month
  static async resetMonthlyGoal(userId: string): Promise<boolean> {
    try {
      // For demo users, just return success
      if (!this.shouldUseDatabase(userId)) {
        console.log('Demo user - goal reset simulated');
        return true;
      }

      const currentMonth = new Date().toISOString().slice(0, 7);

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          id: userId,
          monthly_goal_month: currentMonth,
          monthly_goal_completed: 0,
          monthly_goal_last_updated: new Date().toISOString()
        });

      if (error) {
        console.error('Error resetting monthly goal:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in resetMonthlyGoal:', error);
      return false;
    }
  }

  // Create default preferences for new user
  private static async createDefaultPreferences(userId: string): Promise<void> {
    try {
      // Only create for database users
      if (!this.shouldUseDatabase(userId)) {
        return;
      }

      const currentMonth = new Date().toISOString().slice(0, 7);

      await supabase
        .from('user_preferences')
        .upsert({
          id: userId,
          monthly_goal_target: 30,
          monthly_goal_completed: 0,
          monthly_goal_month: currentMonth,
          monthly_goal_last_updated: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error creating default preferences:', error);
    }
  }

  // Calculate monthly goal statistics
  private static calculateMonthlyGoalStats(data: {
    target: number;
    completed: number;
    month: string;
    lastUpdated?: string;
  }): MonthlyGoal {
    const now = new Date();
    const year = parseInt(data.month.split('-')[0]);
    const month = parseInt(data.month.split('-')[1]) - 1; // JS months are 0-indexed

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    
    const daysInMonth = monthEnd.getDate();
    const daysPassed = now.getDate();
    const daysLeft = Math.max(0, daysInMonth - daysPassed);
    
    const progressPercentage = Math.round((data.completed / data.target) * 100);

    return {
      target: data.target,
      completed: data.completed,
      month: data.month,
      daysLeft,
      daysInMonth,
      daysPassed,
      progressPercentage,
      lastUpdated: data.lastUpdated
    };
  }

  // Get default monthly goal when none exists or for demo users
  static getDefaultMonthlyGoal(): MonthlyGoal {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    
    return this.calculateMonthlyGoalStats({
      target: 30,
      completed: 0, // Start with 0 problems solved for demo users
      month: currentMonth
    });
  }

  // Get monthly goal history for analytics
  static async getMonthlyGoalHistory(userId: string, months: number = 6): Promise<MonthlyGoal[]> {
    // For now, return current month only
    // In a full implementation, you'd store historical data
    const current = await this.getUserMonthlyGoal(userId);
    return current ? [current] : [];
  }

  // Calculate suggested target based on recent activity
  static calculateSuggestedTarget(recentActivity: number[]): number {
    if (recentActivity.length === 0) return 30;
    
    const average = recentActivity.reduce((sum, val) => sum + val, 0) / recentActivity.length;
    const suggested = Math.ceil(average * 1.2); // 20% increase from average
    
    return Math.max(10, Math.min(suggested, 100)); // Between 10-100
  }
}
