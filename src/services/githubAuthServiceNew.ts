/// <reference types="vite/client" />
// Simplified GitHub OAuth Service
class GitHubAuthService {
  private readonly clientId: string;

  constructor() {
    this.clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    
    if (!this.clientId) {
      console.warn('GitHub Client ID not found in environment variables');
    }
  }

  /**
   * Generate GitHub OAuth URL directly (simplified approach)
   */
  async generateAuthUrl(): Promise<string> {
    try {
      if (!this.clientId) {
        throw new Error('GitHub Client ID not configured');
      }

      // Generate secure random state for CSRF protection
      const state = this.generateSecureRandomString(32);
      
      // Store state in localStorage for verification
      localStorage.setItem('github_oauth_state', state);

      const params = new URLSearchParams({
        client_id: this.clientId,
        redirect_uri: `${window.location.origin}/auth/github/callback`,
        scope: 'read:user user:email repo',
        state,
        response_type: 'code'
      });

      return `https://github.com/login/oauth/authorize?${params}`;
    } catch (error) {
      console.error('Failed to generate OAuth URL:', error);
      throw error;
    }
  }

  /**
   * For demo purposes, we'll show a message about using Personal Access Token
   */
  async exchangeCodeForToken(code: string, state: string): Promise<boolean> {
    try {
      // Verify state matches what we stored
      const storedState = localStorage.getItem('github_oauth_state');
      if (!storedState || storedState !== state) {
        throw new Error('Invalid OAuth state parameter');
      }

      // For simplicity, we'll redirect user to use Personal Access Token
      throw new Error('OAuth token exchange requires a backend server. Please use a Personal Access Token instead for immediate access to your GitHub data.');
    } catch (error) {
      console.error('Token exchange failed:', error);
      localStorage.removeItem('github_oauth_state'); // Clean up on error
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('github_access_token');
  }

  /**
   * Get stored access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem('github_access_token');
  }

  /**
   * Get stored user data
   */
  getUserData(): any {
    const userData = localStorage.getItem('github_user_data');
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Sign out user
   */
  signOut(): void {
    localStorage.removeItem('github_access_token');
    localStorage.removeItem('github_user_data');
    localStorage.removeItem('github_oauth_state');
  }

  /**
   * Always return true since we're using simplified approach
   */
  async checkServerHealth(): Promise<boolean> {
    return true; // Simplified - no backend required
  }

  /**
   * Generate cryptographically secure random string
   */
  private generateSecureRandomString(length: number): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}

// Export singleton instance
export const githubAuthService = new GitHubAuthService();
