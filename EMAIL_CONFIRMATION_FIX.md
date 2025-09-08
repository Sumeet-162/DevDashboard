# Fix Email Confirmation Issues - Supabase Configuration

## Problem
New users receive confirmation emails with links to `localhost` that result in "ERR_CONNECTION_REFUSED" errors, but users can still sign in manually after that.

## Root Cause
Supabase is configured to send confirmation emails with the wrong Site URL. Your app runs on `localhost:8082` but Supabase might be configured for a different URL.

## Solutions Applied

### 1. Code Changes Made
- ✅ Updated `signUp` function to include `emailRedirectTo` option
- ✅ Updated `resetPassword` function to include correct redirect URL
- ✅ Created `AuthConfirmPage.tsx` to handle email confirmations properly
- ✅ Added `/auth/confirm` route to handle all auth confirmations

### 2. Supabase Dashboard Configuration Required

**IMPORTANT**: You need to configure these settings in your Supabase dashboard:

#### Go to Supabase Dashboard → Authentication → URL Configuration

1. **Site URL**: Set to `http://localhost:8082`
2. **Redirect URLs**: Add these URLs:
   ```
   http://localhost:8082/auth/confirm
   http://localhost:8082/dashboard
   http://localhost:8082/settings
   ```

#### Steps:
1. Visit https://supabase.com/dashboard
2. Select your project: `tabygwebffbtjilvhkbm`
3. Go to **Authentication** → **URL Configuration**
4. Set **Site URL** to: `http://localhost:8082`
5. Under **Redirect URLs**, add:
   - `http://localhost:8082/auth/confirm`
   - `http://localhost:8082/dashboard` 
   - `http://localhost:8082/settings`
6. Click **Save**

### 3. Email Template Configuration (Optional)
If you want to customize the email templates:
1. Go to **Authentication** → **Email Templates**
2. Update the confirmation email template if needed

## How It Works Now

1. **User Signs Up**: Email/password or GitHub OAuth
2. **Confirmation Email**: Sent with correct `http://localhost:8082/auth/confirm` URL
3. **User Clicks Link**: Redirected to `/auth/confirm` page
4. **Token Processing**: AuthConfirmPage handles token validation
5. **Success**: User redirected to dashboard with confirmed account

## Testing

After making the Supabase dashboard changes:

1. Create a new test account
2. Check the confirmation email - should now link to `localhost:8082`
3. Click the confirmation link - should work without connection errors
4. User should be automatically logged in and redirected to dashboard

## For Production

When deploying to production, update the Supabase URL configuration with your production domain:
- Site URL: `https://your-domain.com`
- Redirect URLs: `https://your-domain.com/auth/confirm`, etc.

## Troubleshooting

If issues persist:
1. Check browser console for any auth-related errors
2. Verify the email confirmation link URL in the email
3. Ensure Supabase project URL and keys are correct in `.env.local`
4. Check Supabase logs in the dashboard for any errors
