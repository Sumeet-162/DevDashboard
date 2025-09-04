import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  github_username: string | null;
  leetcode_username: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  skills: string[] | null;
}

export class ProfileService {
  /**
   * Get the current user's profile from Supabase
   */
  static async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No authenticated user found');
        return null;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return profile;
    } catch (error) {
      console.error('Error in getCurrentUserProfile:', error);
      return null;
    }
  }

  /**
   * Get the GitHub username from the user's profile
   */
  static async getGitHubUsername(): Promise<string | null> {
    try {
      const profile = await this.getCurrentUserProfile();
      return profile?.github_username || null;
    } catch (error) {
      console.error('Error getting GitHub username:', error);
      return null;
    }
  }

  /**
   * Update the GitHub username in the user's profile
   */
  static async updateGitHubUsername(githubUsername: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        return false;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ github_username: githubUsername })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating GitHub username:', error);
        return false;
      }

      console.log('GitHub username updated successfully');
      return true;
    } catch (error) {
      console.error('Error in updateGitHubUsername:', error);
      return false;
    }
  }

  /**
   * Get the LeetCode username from the user's profile
   */
  static async getLeetCodeUsername(): Promise<string | null> {
    try {
      const profile = await this.getCurrentUserProfile();
      return profile?.leetcode_username || null;
    } catch (error) {
      console.error('Error getting LeetCode username:', error);
      return null;
    }
  }

  /**
   * Update the LeetCode username in the user's profile
   */
  static async updateLeetCodeUsername(leetcodeUsername: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        return false;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ leetcode_username: leetcodeUsername })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating LeetCode username:', error);
        return false;
      }

      console.log('LeetCode username updated successfully');
      return true;
    } catch (error) {
      console.error('Error in updateLeetCodeUsername:', error);
      return false;
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return !!user;
    } catch (error) {
      return false;
    }
  }
}
