# Vercel Deployment Guide

## Prerequisites

- ✅ Code pushed to GitHub/GitLab/Bitbucket
- ✅ Supabase project configured
- ✅ Google OAuth configured in Supabase

## Step-by-Step Deployment

### 1. Push Your Code to Git

```bash
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### 2. Deploy to Vercel

**Option A: Via Vercel Dashboard (Recommended)**

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"New Project"**
3. Import your repository
4. Configure project settings:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

**Option B: Via Vercel CLI**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# For production deployment
vercel --prod
```

### 3. Configure Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

**Important:**

- Replace `your_supabase_project_url` with your actual Supabase project URL
- Replace `your_supabase_anon_key` with your Supabase anon key
- Replace `your-app.vercel.app` with your actual Vercel deployment URL (you'll get this after first deployment)
- Set these for **Production**, **Preview**, and **Development** environments

### 4. Update Supabase OAuth Configuration

After your first deployment, update Supabase:

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel URL to **Redirect URLs**:
   ```
   https://your-app.vercel.app/auth/callback
   ```
3. Also add your domain if you have a custom domain:
   ```
   https://your-domain.com/auth/callback
   ```

### 5. Redeploy After Environment Variables

After adding environment variables:

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**

Or trigger a new deployment by pushing a commit:

```bash
git commit --allow-empty -m "Trigger redeploy with env vars"
git push
```

## Post-Deployment Checklist

- [ ] Verify environment variables are set correctly
- [ ] Test Google sign-in flow
- [ ] Test sign-out functionality
- [ ] Verify event creation works
- [ ] Check that protected routes work correctly
- [ ] Update Supabase redirect URLs with actual Vercel URL

## Troubleshooting

### Build Fails

- Check build logs in Vercel Dashboard
- Ensure all environment variables are set
- Verify `package.json` has correct build script

### Authentication Not Working

- Verify `NEXT_PUBLIC_APP_URL` matches your Vercel URL exactly
- Check Supabase redirect URLs include your Vercel URL
- Ensure environment variables are set for the correct environment

### Environment Variables Not Working

- Make sure variables are prefixed with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding environment variables
- Check variable names match exactly (case-sensitive)

## Custom Domain (Optional)

1. In Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Update `NEXT_PUBLIC_APP_URL` to your custom domain
4. Update Supabase redirect URLs
5. Redeploy

## Monitoring

- Check Vercel Dashboard → Analytics for performance metrics
- Check Function Logs for server-side errors
- Monitor Supabase Dashboard for database queries
