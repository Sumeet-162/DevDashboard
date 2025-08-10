// GitHub OAuth Service for real contribution data
/// <reference types="vite/client" />
class GitHubAuthService {
  private readonly serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

  // Generate OAuth authorization URL using backend
  async generateAuthUrl(): Promise<string> {
    try {
      const response = await fetch(`${this.serverUrl}/api/oauth/github/url`);
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate OAuth URL');
      }

      // Store state for verification
      localStorage.setItem('github_oauth_state', data.state);
      
      return data.authUrl;
    } catch (error) {
      console.error('Failed to generate OAuth URL:', error);
      throw new Error('OAuth server is not available. Please try using a Personal Access Token instead.');
    }
  }

  // Exchange authorization code for access token using backend
  async exchangeCodeForToken(code: string, state: string): Promise<boolean> {
    try {
      // Verify state matches what we stored
      const storedState = localStorage.getItem('github_oauth_state');
      if (!storedState || storedState !== state) {
        throw new Error('Invalid OAuth state parameter');
      }

      const response = await fetch(`${this.serverUrl}/api/oauth/github/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Token exchange failed');
      }

      // Store the access token and user data
      localStorage.setItem('github_access_token', data.access_token);
      localStorage.setItem('github_user_data', JSON.stringify(data.user));
      localStorage.removeItem('github_oauth_state'); // Clean up

      return true;
    } catch (error) {
      console.error('Token exchange failed:', error);
      localStorage.removeItem('github_oauth_state'); // Clean up on error
      throw error;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('github_access_token');
  }

  // Get stored access token
  getAccessToken(): string | null {
    return localStorage.getItem('github_access_token');
  }

  // Get stored user data
  getUserData(): any {
    const userData = localStorage.getItem('github_user_data');
    return userData ? JSON.parse(userData) : null;
  }

  // Alternative: Use Personal Access Token for development
  async setPersonalAccessToken(token: string): Promise<void> {
    if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
      throw new Error('Invalid GitHub Personal Access Token format');
    }
    
    // Validate the token by making a test request
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error('Invalid token or insufficient permissions');
      }

      const userData = await response.json();
      
      // Store the token and user data
      localStorage.setItem('github_access_token', token);
      localStorage.setItem('github_user_data', JSON.stringify({
        login: userData.login,
        name: userData.name,
        avatar_url: userData.avatar_url,
        id: userData.id
      }));
    } catch (error) {
      throw new Error('Failed to validate Personal Access Token');
    }
  }

  // Sign out user
  async signOut(): Promise<void> {
    localStorage.removeItem('github_access_token');
    localStorage.removeItem('github_user_data');
    localStorage.removeItem('github_oauth_state');
  }

  // Check if backend server is available
  async checkServerHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverUrl}/api/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Get token type
  getTokenType(): 'oauth' | 'personal' | null {
    const token = this.getAccessToken();
    if (!token) return null;
    
    if (token.startsWith('ghp_') || token.startsWith('github_pat_')) {
      return 'personal';
    }
    return 'oauth';
  }

  // Test if token is still valid
  async validateToken(): Promise<boolean> {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (response.status === 401) {
        await this.signOut();
        return false;
      }

      return response.ok;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }
}

export const githubAuthService = new GitHubAuthService();
