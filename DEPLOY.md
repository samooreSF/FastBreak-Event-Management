# Quick Vercel Deployment Checklist

## Before Deploying

1. ✅ Code is committed and pushed to Git
2. ✅ Build passes locally (`npm run build`)
3. ✅ Environment variables ready:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` (will be your Vercel URL)

## Deploy Steps

1. **Go to vercel.com** → New Project → Import repository
2. **Configure** (defaults are fine for Next.js)
3. **Add Environment Variables** in Vercel Settings:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_value
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_value
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```
4. **Deploy** - Vercel will build and deploy automatically
5. **After first deployment**, update Supabase:
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add: `https://your-app.vercel.app/auth/callback`
   - Save
6. **Redeploy** in Vercel (or push a new commit) to pick up changes

## Verify Deployment

- [ ] Home page loads
- [ ] Google sign-in works
- [ ] Sign-out works
- [ ] Can create events
- [ ] Can edit/delete events

## Common Issues

**Auth not working?**

- Check `NEXT_PUBLIC_APP_URL` matches your Vercel URL exactly
- Verify Supabase redirect URL includes `/auth/callback`
- Redeploy after adding env vars

**Build fails?**

- Check build logs in Vercel
- Ensure all env vars are set
- Verify `package.json` scripts are correct
