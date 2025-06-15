# Vercel Environment Variables Setup

Your Vercel deployment is failing because the required environment variables are not configured. Here's how to set them up:

## 🚀 Quick Fix Steps

### 1. Go to your Vercel Dashboard
1. Visit [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your **Klyro** project
3. Go to **Settings** → **Environment Variables**

### 2. Add Required Variables

Add these environment variables one by one:

#### **Supabase Configuration (Required)**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

#### **App Configuration (Required)**
```
NEXT_PUBLIC_APP_URL=https://your-vercel-app-url.vercel.app
```

#### **OpenAI Configuration (Optional but recommended)**
```
OPENAI_API_KEY=sk-your_openai_api_key
```

#### **Stripe Configuration (Optional - for payments)**
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
```

### 3. Where to find your Supabase values:

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### 4. Deploy again

After adding the environment variables:
1. Go to your project's **Deployments** tab
2. Click **Redeploy** on the latest deployment

## 🔧 Alternative: Use Vercel CLI

If you prefer using the command line:

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Link to your project
vercel link

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXT_PUBLIC_APP_URL
vercel env add OPENAI_API_KEY

# Deploy
vercel --prod
```

## ✅ Expected Result

After setting the environment variables, your build should succeed and you'll see:
- ✅ Build completed successfully
- ✅ Deployment ready
- ✅ App accessible at your Vercel URL

## 🚨 If you still get errors:

1. Make sure all environment variable names are exactly as shown (case-sensitive)
2. Ensure no extra spaces or quotes in the values
3. Check that your Supabase project is active and accessible
4. Verify your OpenAI API key has available credits

## 📝 Notes:

- The app will work without OpenAI (shows demo data instead)
- Stripe variables are only needed if you plan to use payments
- All `NEXT_PUBLIC_*` variables are exposed to the browser
- Keep service role keys secret (don't prefix with `NEXT_PUBLIC_`) 