# AI Insights Feature Implementation

## Overview
The AI-enhanced receipt upload feature has been successfully implemented. This feature goes beyond basic receipt storage by analyzing spending behavior and providing personalized insights.

## Database Migration Required

**IMPORTANT**: Before using the AI insights features, you must apply the database migration to add the new fields:

### Option 1: Manual SQL (Recommended)
Run this SQL in your Supabase SQL Editor:

```sql
-- Add AI insights fields to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS need_vs_want TEXT CHECK (need_vs_want IN ('Need', 'Want')),
ADD COLUMN IF NOT EXISTS mood_at_purchase TEXT,
ADD COLUMN IF NOT EXISTS ai_insight TEXT;
```

### Option 2: Using Migration File
If you have Supabase CLI set up locally:
1. The migration file is located at: `supabase/migrations/20250120_add_ai_insights_to_transactions.sql`
2. Apply it using: `supabase db push` (if using local development)

### Backwards Compatibility
The application has been designed to work both with and without the new fields:
- If migration is not applied: Basic transaction functionality works, AI features are disabled
- After migration: Full AI insights functionality is available

## New Features Implemented

### 1. Enhanced Database Schema
- Added three new fields to the `transactions` table:
  - `need_vs_want`: Classification as "Need" or "Want"
  - `mood_at_purchase`: User's mood when making the purchase
  - `ai_insight`: AI-generated behavioral insight

### 2. AI Classification & Insights
- **Need vs Want Classification**: AI automatically classifies purchases as essential needs or discretionary wants
- **AI Insights Generation**: Contextual insights about spending behavior
- **Mood Integration**: For "Want" purchases, users can log their emotional state and reasoning

### 3. User Interface Enhancements
- **AI Insights Panel**: Replaced the Financial Snapshot with an interactive AI insights section
- **Need vs Want Selector**: Interactive component for users to classify purchases
- **Enhanced Transactions Table**: Shows classification status and AI insights
- **Mood Input Flow**: Multi-step flow for capturing emotional context

### 4. API Endpoints
- **Enhanced `/api/analyze-receipt`**: Now includes AI classification and initial insights
- **New `/api/generate-insight`**: Generates mood-based insights after user input

## How It Works

### Receipt Upload Flow
1. User uploads a receipt photo
2. OCR extracts merchant, amount, category, and items
3. AI automatically classifies as "Need" or "Want"
4. AI generates an initial behavioral insight
5. Transaction is saved with AI data

### User Classification Flow
1. Unclassified transactions appear in the AI Insights panel
2. User clicks "Need" or "Want"
3. If "Want", user is prompted for mood and reasoning
4. AI generates enhanced insight based on mood context
5. Transaction is updated and removed from pending classification

### Data Persistence
- All insights and classifications are stored in the database
- Data persists across page refreshes and sessions
- Insights are displayed in the enhanced transactions table

## Features Highlights

### Smart Classification
- Uses GPT-3.5-turbo for intelligent categorization
- Considers merchant type, category, and amount
- Provides fallback logic when AI is unavailable

### Emotional Context
- 6 mood options: Happy, Neutral, Stressed, Excited, Sad, Anxious
- Free-text reasoning for deeper context
- Generates mood-specific insights

### User Experience
- Clean, intuitive interface
- Progressive disclosure (mood input only for "Want" purchases)
- Visual feedback with color-coded badges
- Compact display in existing dashboard layout

## Technical Implementation

### Database Migration
```sql
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS need_vs_want TEXT CHECK (need_vs_want IN ('Need', 'Want')),
ADD COLUMN IF NOT EXISTS mood_at_purchase TEXT,
ADD COLUMN IF NOT EXISTS ai_insight TEXT;
```

### Key Components
- `NeedVsWantSelector.tsx`: Interactive classification component
- `src/app/api/analyze-receipt/route.ts`: Enhanced with AI classification
- `src/app/api/generate-insight/route.ts`: Mood-based insight generation

### State Management
- Tracks unclassified transactions
- Updates local state for immediate UI feedback
- Syncs with database for persistence

## Future Enhancements
- Spending pattern analysis across multiple transactions
- Personalized budget recommendations based on Need/Want ratios
- Mood-spending correlation insights
- Weekly/monthly behavioral summaries

## Usage
1. Upload a receipt using the existing upload button
2. Check the AI Insights panel for unclassified transactions
3. Click "Need" or "Want" to classify purchases
4. For "Want" purchases, provide mood and reasoning
5. View AI insights in the transactions table

The feature is fully functional and ready for user testing. All data persists correctly and the UI integrates seamlessly with the existing dashboard design. 