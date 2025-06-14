# Production Deployment Checklist

## 🚨 CRITICAL: Complete ALL Security Steps Before Deploying

### 1. Supabase Security (MANDATORY)
- [ ] Run `fix-security-issues.sql` in Supabase SQL Editor
- [ ] Follow all steps in `supabase-auth-config.md`
- [ ] Verify Security Advisor shows 0 errors
- [ ] Test authentication flow after RLS is enabled

### 2. Environment Variables
- [ ] Set all production environment variables
- [ ] Verify `NEXT_PUBLIC_SUPABASE_URL` points to your production Supabase
- [ ] Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the production anon key
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)
- [ ] Set any API keys (OpenAI, etc.)

### 3. Next.js Production Setup
- [ ] Update `next.config.js` for production:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // For Docker deployment
  images: {
    domains: ['your-domain.com'],
    unoptimized: process.env.NODE_ENV === 'development'
  },
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  }
}

module.exports = nextConfig
```

### 4. Supabase Production Configuration

#### 4.1 Authentication Settings
- [ ] Site URL: `https://your-domain.com`
- [ ] Redirect URLs: 
  - `https://your-domain.com/auth/callback`
  - `https://your-domain.com/dashboard`
- [ ] Enable email confirmations
- [ ] Enable leaked password protection
- [ ] Set OTP expiry to 600 seconds (10 minutes)

#### 4.2 Database Settings
- [ ] Enable SSL enforcement
- [ ] Configure connection pooling
- [ ] Set up database backups
- [ ] Consider IP restrictions if needed

#### 4.3 API Settings
- [ ] Rate limiting enabled
- [ ] CORS configured for your domain
- [ ] JWT settings optimized for production

### 5. Security Headers
Add to your `next.config.js`:
```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}
```

### 6. Error Handling & Monitoring
- [ ] Set up error boundary components
- [ ] Configure logging (consider Sentry, LogRocket)
- [ ] Set up uptime monitoring
- [ ] Configure analytics (if needed)

### 7. Performance Optimization
- [ ] Enable Next.js compression
- [ ] Optimize images with Next.js Image component
- [ ] Configure caching headers
- [ ] Minimize bundle size
- [ ] Enable gzip/brotli compression

### 8. Testing Before Deploy
- [ ] Test authentication flow
- [ ] Test all CRUD operations with RLS enabled
- [ ] Test receipt upload functionality
- [ ] Test on mobile devices
- [ ] Test with different user accounts
- [ ] Load testing (if expecting high traffic)

### 9. Deployment Platform Setup

#### For Vercel:
- [ ] Connect GitHub repository
- [ ] Set environment variables in Vercel dashboard
- [ ] Configure custom domain
- [ ] Enable preview deployments for testing

#### For Railway/Render/Other:
- [ ] Configure build settings
- [ ] Set environment variables
- [ ] Configure health checks
- [ ] Set up auto-deploy from Git

### 10. Post-Deployment Verification
- [ ] Test complete user flow end-to-end
- [ ] Verify SSL certificate is working
- [ ] Check all pages load correctly
- [ ] Test authentication (sign up, sign in, sign out)
- [ ] Test data operations (create, read, update, delete)
- [ ] Monitor error logs for first 24 hours

### 11. DNS & Domain Setup
- [ ] Configure DNS records
- [ ] Set up SSL certificate
- [ ] Configure subdomain redirects if needed
- [ ] Set up www redirect

### 12. Backup & Recovery Plan
- [ ] Database backup strategy
- [ ] Environment variables backup
- [ ] Deployment rollback plan
- [ ] Data recovery procedures

## Environment Variables Template

Create a `.env.production` file:
```bash
# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI (if using AI features)
OPENAI_API_KEY=your-openai-key

# Other APIs
NEXT_PUBLIC_API_URL=https://your-domain.com/api

# Security
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.com
```

## Common Deployment Issues & Solutions

### Issue: Authentication not working
- Check Supabase redirect URLs
- Verify environment variables
- Check RLS policies are correct

### Issue: Database queries failing
- Verify RLS policies allow user access
- Check user_id columns exist and are populated
- Test with service role key first

### Issue: Images not loading
- Configure Next.js image domains
- Check public folder deployment
- Verify CDN settings

## Final Security Check
Before going live, verify:
- [ ] No hardcoded secrets in code
- [ ] All environment variables secured
- [ ] Database access restricted to authenticated users
- [ ] API endpoints protected
- [ ] HTTPS enforced everywhere
- [ ] Error messages don't leak sensitive info

## Go Live! 🚀
Once all items are checked off, you're ready to deploy to production safely and securely. 