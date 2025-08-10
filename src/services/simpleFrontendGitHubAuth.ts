// Simple Frontend GitHub OAuth Service (No Backend Required)
class SimpleFrontendGitHubAuth {
  private readonly clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
  
  // Generate OAuth URL directly (frontend-only)
  generateAuthUrl(): string {
    if (!this.clientId) {
      throw new Error('GitHub Client ID not configured. Please set VITE_GITHUB_CLIENT_ID in your environment variables.');
    }

    const baseUrl = 'https://github.com/login/oauth/authorize';
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: `${window.location.origin}/auth/github/callback`,
      scope: 'read:user,public_repo,user:email',
      state: this.generateState()
    });

    return `${baseUrl}?${params.toString()}`;
  }

  // Generate and store state for security
  private generateState(): string {
    const state = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('github_oauth_state', state);
    return state;
  }

  // Validate state from callback
  validateState(receivedState: string): boolean {
    const storedState = localStorage.getItem('github_oauth_state');
    localStorage.removeItem('github_oauth_state');
    return storedState === receivedState;
  }

  // Exchange code for token (this would normally be done by backend, but we'll use a public proxy)
  async exchangeCodeForToken(code: string): Promise<string> {
    // Note: This is a workaround. In production, you'd want your own backend.
    // For now, we'll skip this and recommend Personal Access Token instead.
    throw new Error('Code exchange requires backend server. Please use Personal Access Token instead.');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('github_access_token');
  }

  // Set Personal Access Token (recommended approach)
  setPersonalAccessToken(token: string): void {
    localStorage.setItem('github_access_token', token);
  }

  // Get stored token
  getAccessToken(): string | null {
    return localStorage.getItem('github_access_token');
  }

  // Sign out
  signOut(): void {
    localStorage.removeItem('github_access_token');
    localStorage.removeItem('github_oauth_state');
  }
}

export const simpleFrontendGitHubAuth = new SimpleFrontendGitHubAuth();
