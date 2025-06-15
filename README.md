# Klyro - Financial Wellness App

<!-- Updated for live domain: https://kly-ro.xyz -->

Klyro connects your emotional wellbeing with your financial health, helping you make more mindful money decisions.

## Features

- 🧠 Mood-based financial tracking
- 📊 AI-powered spending insights  
- 📝 Receipt upload and analysis
- 📈 Visual spending patterns
- 💡 Personalized recommendations
- 🔒 Secure Supabase backend

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **AI**: OpenAI GPT-4
- **Charts**: Recharts
- **Animation**: Framer Motion

## Quick Start

```bash
git clone <your-repo>
cd klyro
npm install
npm run dev
```

## Prerequisites

- Node.js 18+ 
- A Supabase account and project
- OpenAI API key (optional - fallbacks provided)

## Quick Start

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd klyro
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file with:
   ```env
   # Required
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Optional (fallbacks provided)
   OPENAI_API_KEY=your_openai_api_key
   ```

3. **Set up database**:
   Run this SQL in your Supabase SQL editor:
   ```sql
   CREATE TABLE transactions (
     id SERIAL PRIMARY KEY,
     merchant VARCHAR(255) NOT NULL,
     amount DECIMAL(10,2) NOT NULL,
     category VARCHAR(100),
     date DATE NOT NULL,
     need_vs_want VARCHAR(10),
     mood_at_purchase TEXT,
     ai_insight TEXT,
     archived BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Check system health**: Visit `/api/health` to verify all services are working

## 🛠️ Troubleshooting

### Common Issues and Solutions

#### **Environment Variable Issues**
**Problem**: API returns 500 errors or "Environment not configured"
- **Solution**: Restart the development server: `npm run dev`
- **Prevention**: Use the health check endpoint at `/api/health` to verify configuration

#### **OpenAI API Errors**
**Problem**: Receipt analysis fails with image format errors
- **Check**: Ensure image is in JPG, PNG, or WebP format
- **Fallback**: App works without OpenAI API key (uses fallback insights)

#### **Development Server Issues**
**Problem**: Multiple servers running or port conflicts
- **Solution**: 
  ```bash
  # Kill existing processes
  pkill -f "next dev"
  lsof -ti:3000 | xargs kill -9
  
  # Clean build cache
  rm -rf .next
  
  # Restart server
  npm run dev
  ```

#### **Database Connection Issues**
**Problem**: Transactions not saving or loading
- **Check**: Verify Supabase credentials in `.env.local`
- **Test**: Visit `/api/health` to check database status

### Health Monitoring

- **System Status**: Check `/api/health` for real-time system status
- **Environment Check**: Add `<EnvironmentStatus showDetails />` to any page for diagnostics
- **Logs**: Check browser console and terminal for detailed error messages

### Getting Help

1. Check the health endpoint: `/api/health`
2. Review browser console for client-side errors
3. Check terminal logs for server-side issues
4. Verify all environment variables are set correctly

## Architecture

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT models (with fallbacks)
- **Charts**: Chart.js with react-chartjs-2
- **Animations**: Framer Motion

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Check system health
curl http://localhost:3000/api/health
```

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
