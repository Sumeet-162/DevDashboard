# Database Fixes Instructions

## To Fix Like Count Persistence

**Step 1: Apply Database Triggers**
1. Go to your Supabase Dashboard → SQL Editor
2. Copy and paste the entire content of `fix-like-counts.sql`
3. Click "Run" to execute the SQL

This will:
- Create database triggers to automatically update like counts
- Initialize existing counts correctly
- Add a manual refresh function
- Create performance indexes

**Step 2: Test the Fix**
1. Go to the Community page
2. Click the "🔄 Refresh Counts" button
3. Like/unlike posts to test real-time updates
4. Refresh the page to verify counts persist

## To Fix GitHub Repository Count

**The code has been updated to:**
1. Fetch the `github_username` from your profile
2. Use the real GitHub API to get your repository count
3. Show your actual repository data instead of fallback data

**To ensure your GitHub username is set:**
1. Go to Settings → Profile
2. Make sure your GitHub username is saved
3. Refresh the dashboard

## Current Status

✅ **News Page**: Expanded from 15 to 25+ articles with 30+ new tech articles
✅ **GitHub Fix**: Updated to fetch real repository count from GitHub API  
⏳ **Like Counts**: Requires manual SQL execution in Supabase
✅ **Community Features**: All follower/following counts working

## Next Steps

1. Run the SQL file in Supabase to fix like count persistence
2. Verify your GitHub username is set in your profile
3. Test all functionality
