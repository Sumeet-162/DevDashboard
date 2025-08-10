# 🚀 DevDash Deployment Guide

This guide will help you deploy your DevDash application to various hosting platforms.

## 📋 Pre-Deployment Checklist

### 1. Environment Variables Setup
Copy `.env.example` to `.env.local` and fill in your values:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# GitHub OAuth Configuration
VITE_GITHUB_CLIENT_ID=your_github_client_id
VITE_GITHUB_CLIENT_SECRET=your_github_client_secret
```

### 2. Test Local Build
```bash
npm run build
npm run preview
```

## 🌐 Deployment Options

### Option 1: Vercel (Recommended - Free & Easy)

**Why Vercel?**
- Zero-config deployment for React/Vite apps
- Automatic HTTPS and CDN
- Easy environment variable management
- Excellent performance

**Steps:**
1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with your GitHub account

2. **Import Project**
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite settings

3. **Configure Environment Variables**
   - In Vercel dashboard: Project → Settings → Environment Variables
   - Add all variables from your `.env.local`

4. **Update GitHub OAuth**
   - Go to [GitHub Developer Settings](https://github.com/settings/developers)
   - Update OAuth app callback URL to: `https://your-app.vercel.app/auth/github/callback`

5. **Deploy**
   - Vercel automatically deploys on every push to main branch
   - Your app will be live at `https://your-app.vercel.app`

### Option 2: Netlify

**Steps:**
1. **Create Netlify Account**
   - Go to [netlify.com](https://netlify.com)
   - Connect with GitHub

2. **Deploy**
   - Click "New site from Git"
   - Select your repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`

3. **Environment Variables**
   - Site Settings → Environment Variables
   - Add your environment variables

4. **Custom Domain (Optional)**
   - Domain Settings → Add custom domain

### Option 3: Railway

**For full-stack deployment with Docker:**

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Connect GitHub

2. **Deploy**
   - Click "Deploy from GitHub repo"
   - Select your repository
   - Railway will use the included `Dockerfile`

3. **Environment Variables**
   - Add in Railway dashboard

### Option 4: GitHub Pages

**For free hosting directly from GitHub:**

1. **Enable GitHub Pages**
   - Repository → Settings → Pages
   - Source: GitHub Actions

2. **Add Secrets**
   - Repository → Settings → Secrets and Variables → Actions
   - Add all environment variables as secrets

3. **Deploy**
   - The included GitHub Action (`.github/workflows/deploy.yml`) will automatically deploy on push

## 🔧 Production Optimizations

### 1. Environment-Specific Builds
```bash
# Development build (with source maps)
npm run build:dev

# Production build (optimized)
npm run build
```

### 2. Performance Optimizations
The `vite.config.ts` includes:
- Code splitting for better loading
- Vendor chunk separation
- Minification with esbuild
- Tree shaking for smaller bundles

### 3. Security Considerations
- ✅ Environment variables are properly prefixed with `VITE_`
- ✅ GitHub client secret should ideally be handled server-side in production
- ✅ Supabase RLS (Row Level Security) policies should be configured
- ✅ CORS is properly configured in Supabase

## 🚦 Deployment Status Checks

After deployment, verify:

1. **App loads correctly** ✅
2. **Authentication works** (login/signup) ✅
3. **GitHub integration** (if configured) ✅
4. **LeetCode data fetching** ✅
5. **Community features** ✅
6. **Theme switching** ✅
7. **Mobile responsiveness** ✅

## 🐛 Common Issues & Solutions

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

### Environment Variable Issues
- Ensure all variables are prefixed with `VITE_`
- Check that values don't contain special characters
- Verify Supabase URL format: `https://project.supabase.co`

### GitHub OAuth Issues
- Verify callback URL matches exactly
- Check that GitHub app is public (not private)
- Ensure client ID is correct

### Supabase Connection Issues
- Test connection in Supabase dashboard
- Check RLS policies are properly configured
- Verify database schema is set up

## 📱 Mobile & PWA Considerations

The app is already mobile-responsive, but for PWA features:

1. Add `manifest.json` to `public/`
2. Implement service worker for offline functionality
3. Add app icons in various sizes

## 🔄 Continuous Deployment

All platforms support automatic deployment:
- **Vercel/Netlify**: Deploy on every push to main
- **Railway**: Deploy on every push
- **GitHub Pages**: Deploy via GitHub Actions

## 🌟 Post-Deployment

1. **Custom Domain**: Configure your own domain
2. **Analytics**: Add Google Analytics or similar
3. **Monitoring**: Set up error tracking (Sentry)
4. **Performance**: Monitor with Lighthouse
5. **Feedback**: Collect user feedback for improvements

## 🆘 Need Help?

- Check the build logs in your hosting platform
- Verify all environment variables are set
- Test locally with `npm run build && npm run preview`
- Check browser console for JavaScript errors

---

**Happy Deploying! 🚀**

Your DevDash should now be live and accessible to users worldwide!
