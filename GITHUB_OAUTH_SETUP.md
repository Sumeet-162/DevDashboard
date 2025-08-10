# GitHub OAuth Integration Setup

This guide explains how to set up GitHub OAuth integration to access real contribution data and enhanced GitHub features.

## 🚀 Quick Setup

### 1. Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/applications/new)
2. Create a new OAuth App with these settings:
   - **Application name**: `DevDash` (or your preferred name)
   - **Homepage URL**: `http://localhost:5173` (or your domain)
   - **Authorization callback URL**: `http://localhost:5173/auth/github/callback`
   - **Application description**: `Developer dashboard with GitHub integration`

### 2. Configure Environment Variables

1. Copy `.env.example` to `.env.local`
2. Add your GitHub OAuth credentials:
   ```bash
   VITE_GITHUB_CLIENT_ID=your_client_id_here
   VITE_GITHUB_CLIENT_SECRET=your_client_secret_here
   ```

### 3. Features Enabled with OAuth

#### ✅ Real Contribution Data
- Actual GitHub contribution graph
- Real contribution counts and streaks
- Historical contribution data

#### ✅ Enhanced Statistics
- Detailed repository stats
- Language usage analytics
- Contribution breakdowns (commits, PRs, issues, reviews)

#### ✅ Advanced Repository Data
- Private repository access (if authorized)
- Fork and star details
- Repository contribution tracking

## 🔒 Security Considerations

### Production Deployment
- **Never expose client secret in frontend code**
- Move OAuth flow to backend server
- Use environment variables for sensitive data
- Implement proper token storage and rotation

### Current Implementation
- Client secret is in frontend (development only)
- Tokens stored in localStorage (should use httpOnly cookies in production)
- No token refresh mechanism (implement for production)

## 🛠 API Usage & Rate Limits

### GitHub GraphQL API
- **Rate limit**: 5,000 points per hour
- **Point cost**: 1 point per query + field costs
- **Reset**: Every hour
- **Monitoring**: Built-in rate limit tracking

### Caching Strategy
- **Real data**: 10-minute cache
- **Simulated data**: 5-minute cache
- **User stats**: 10-minute cache
- **Automatic fallback**: To simulated data if API fails

## 🔄 Authentication Flow

1. **User clicks "Authenticate for Real Data"**
2. **Redirect to GitHub OAuth**
3. **User authorizes application**
4. **GitHub redirects to callback**
5. **Exchange code for access token**
6. **Store token securely**
7. **Fetch real contribution data**

## 📊 Data Sources

### With Authentication
- ✅ Real GitHub contributions via GraphQL
- ✅ Enhanced repository statistics
- ✅ Detailed user analytics
- ✅ Private repository data (if authorized)

### Without Authentication
- ✅ Public repository data via REST API
- ✅ Simulated contribution data
- ✅ Basic user statistics
- ✅ Repository language analysis

## 🐛 Troubleshooting

### Common Issues

#### "Authentication failed"
- Check Client ID and Secret
- Verify callback URL matches exactly
- Ensure OAuth app is active

#### "Rate limit exceeded"
- Wait for rate limit reset
- Implement exponential backoff
- Cache data more aggressively

#### "Invalid state parameter"
- Clear browser localStorage
- Check for CSRF protection
- Verify state generation/validation

### Debug Mode
Enable debug logging:
```javascript
localStorage.setItem('github_debug', 'true');
```

## 📈 Performance Optimization

### Best Practices
- Cache API responses appropriately
- Implement request deduplication
- Use background refresh for stale data
- Monitor rate limit usage

### Future Enhancements
- [ ] Implement OAuth refresh tokens
- [ ] Add webhook support for real-time updates
- [ ] Backend proxy for secure token handling
- [ ] Advanced caching with Redis
- [ ] Rate limit optimization algorithms

---

## 🎯 Production Checklist

- [ ] Move OAuth flow to backend
- [ ] Implement secure token storage
- [ ] Add refresh token handling
- [ ] Set up proper CORS policies
- [ ] Configure rate limit monitoring
- [ ] Implement error tracking
- [ ] Add performance monitoring
- [ ] Security audit OAuth flow
