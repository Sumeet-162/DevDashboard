import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'https://dev-dashboard-eight.vercel.app',
    'http://localhost:8082',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));
app.use(express.json());

// GitHub OAuth configuration
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'Ov23lipKSR37cO0HXzxv';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '456284e2860027e46caff42bcc08d7e402e58a4e';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://dev-dashboard-eight.vercel.app';

// Log configuration for debugging
console.log('🔧 Server Configuration:');
console.log('GITHUB_CLIENT_ID:', GITHUB_CLIENT_ID ? 'Set' : 'Missing');
console.log('GITHUB_CLIENT_SECRET:', GITHUB_CLIENT_SECRET ? 'Set' : 'Missing');
console.log('FRONTEND_URL:', FRONTEND_URL);
console.log('PORT:', PORT);

if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
  console.warn('⚠️ GitHub OAuth credentials missing, but server will continue with fallbacks');
}

// Store for OAuth states (in production, use Redis or database)
const oauthStates = new Map();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: {
      hasGitHubClientId: !!GITHUB_CLIENT_ID,
      hasGitHubClientSecret: !!GITHUB_CLIENT_SECRET,
      frontendUrl: FRONTEND_URL,
      port: PORT
    }
  });
});

// Clean up expired states every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of oauthStates.entries()) {
    if (now - data.timestamp > 600000) { // 10 minutes
      oauthStates.delete(state);
    }
  }
}, 600000);

// Generate OAuth URL
app.get('/api/oauth/github/url', (req, res) => {
  try {
    const state = Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    // Store state with timestamp
    oauthStates.set(state, {
      timestamp: Date.now(),
      used: false
    });

    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: `${FRONTEND_URL}/auth/github/callback`,
      scope: 'read:user user:email repo',
      state,
      response_type: 'code'
    });

    const authUrl = `https://github.com/login/oauth/authorize?${params}`;
    
    res.json({ 
      authUrl,
      state,
      success: true 
    });
  } catch (error) {
    console.error('Error generating OAuth URL:', error);
    res.status(500).json({ 
      error: 'Failed to generate OAuth URL',
      success: false 
    });
  }
});

// Exchange code for access token
app.post('/api/oauth/github/token', async (req, res) => {
  try {
    const { code, state } = req.body;

    if (!code || !state) {
      return res.status(400).json({ 
        error: 'Missing code or state parameter',
        success: false 
      });
    }

    // Verify state
    const stateData = oauthStates.get(state);
    if (!stateData || stateData.used) {
      return res.status(400).json({ 
        error: 'Invalid or expired state parameter',
        success: false 
      });
    }

    // Mark state as used
    stateData.used = true;

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'CodeHubDashboard/1.0'
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${FRONTEND_URL}/auth/github/callback`
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`GitHub API responded with ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return res.status(400).json({ 
        error: tokenData.error_description || tokenData.error,
        success: false 
      });
    }

    if (!tokenData.access_token) {
      return res.status(400).json({ 
        error: 'No access token received from GitHub',
        success: false 
      });
    }

    // Get user info to verify token
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'CodeHubDashboard/1.0'
      }
    });

    if (!userResponse.ok) {
      throw new Error('Failed to verify access token');
    }

    const userData = await userResponse.json();

    // Clean up used state
    oauthStates.delete(state);

    res.json({
      access_token: tokenData.access_token,
      token_type: tokenData.token_type || 'bearer',
      scope: tokenData.scope,
      user: {
        login: userData.login,
        name: userData.name,
        avatar_url: userData.avatar_url,
        id: userData.id
      },
      success: true
    });

  } catch (error) {
    console.error('OAuth token exchange error:', error);
    res.status(500).json({ 
      error: 'Failed to exchange code for access token',
      details: error.message,
      success: false 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    oauth_configured: !!(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET)
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    success: false 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    success: false 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 OAuth server running on http://localhost:${PORT}`);
  console.log(`📱 Frontend URL: ${FRONTEND_URL}`);
  console.log(`🔑 GitHub OAuth configured: ${!!(GITHUB_CLIENT_ID && GITHUB_CLIENT_SECRET)}`);
  console.log(`📊 Available endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/oauth/github/url`);
  console.log(`   POST /api/oauth/github/token`);
});

export default app;
