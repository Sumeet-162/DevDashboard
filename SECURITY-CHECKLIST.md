# 🔒 Security & Deployment Checklist

## ✅ Environment Variables Security

### BEFORE EVERY COMMIT:
1. **Check git status**: `git status`
2. **Verify no .env files are staged**: Look for any `.env` files in "Changes to be committed"
3. **If .env files are staged**: Run `git restore --staged .env` immediately

### Environment Files Status:
- ✅ `.env` - Contains your real secrets (IGNORED by git)
- ✅ `.env.local` - Local development overrides (IGNORED by git)  
- ✅ `.env.example` - Template file (SAFE to commit)
- ✅ `server/.env.example` - Server template (SAFE to commit)

## 🚨 What NOT to Commit:
```
❌ .env
❌ .env.local
❌ .env.production.local
❌ server/.env
❌ Any file containing real API keys/secrets
```

## ✅ What IS SAFE to Commit:
```
✅ .env.example
✅ .env.example.local
✅ server/.env.example
✅ Template files with placeholder values
```

## 🔧 Setup Your Environment Variables:

### 1. Copy the example file:
```bash
cp .env.example .env.local
```

### 2. Fill in your real values:
```bash
# In .env.local (NEVER commit this file)
VITE_SUPABASE_URL=https://your-real-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GITHUB_CLIENT_ID=your_real_github_client_id
```

## 🚀 Deployment Platform Setup:

### Vercel (Recommended):
1. Connect your GitHub repo
2. Add environment variables in Vercel dashboard:
   - Project Settings → Environment Variables
   - Add each variable from your `.env.local`

### Netlify:
1. Connect your GitHub repo  
2. Add environment variables in Netlify dashboard:
   - Site Settings → Environment Variables
   - Add each variable from your `.env.local`

### Railway:
1. Connect your GitHub repo
2. Add environment variables in Railway dashboard
3. Add each variable from your `.env.local`

## 🔍 Pre-Deployment Verification:

### Test Build Locally:
```bash
npm run build
npm run preview
```

### Check Environment Loading:
```bash
# Verify your app loads with your .env.local
npm run dev
```

### Verify Git Status:
```bash
git status
# Should NOT show any .env files in "Changes to be committed"
```

## 🛡️ Post-Deployment Security:

1. **Test your deployed app** - ensure all features work
2. **Monitor for exposed secrets** - check browser dev tools
3. **Set up Supabase RLS policies** - protect your database
4. **Configure GitHub OAuth callback URLs** - match your domain

## 🆘 If You Accidentally Commit Secrets:

### Immediate Actions:
1. **Stop everything** - don't push if you haven't yet
2. **Remove from staging**: `git restore --staged .env`
3. **If already pushed**: 
   - Change all API keys immediately
   - Force push with removed secrets
   - Consider the keys compromised

### GitHub Secret Scanning:
- GitHub automatically scans for common secrets
- You'll get email alerts if secrets are detected
- Rotate keys immediately if alerted

## 📋 Final Deployment Checklist:

- [ ] All `.env` files are in `.gitignore`
- [ ] No secrets in git staging area
- [ ] Environment variables set in hosting platform
- [ ] Local build test passes
- [ ] GitHub OAuth URLs updated for production domain
- [ ] Supabase CORS settings include production domain
- [ ] All sensitive data removed from code

---

**Remember: When in doubt, check `git status` before every commit!**
