import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      age,
      familyStatus,
      income,
      goals,
      riskTolerance,
      mentalStatus
    } = body;

    // Validate required fields
    if (!age || !familyStatus || !income || !goals || !riskTolerance) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate calendar based on profile
    const calendar = generateCalendarForProfile({
      age: parseInt(age),
      familyStatus,
      income: parseFloat(income),
      goals: Array.isArray(goals) ? goals : [goals],
      riskTolerance,
      mentalStatus: mentalStatus || ''
    });

    return NextResponse.json({ calendar });

  } catch (error) {
    console.error('Error generating calendar:', error);
    return NextResponse.json(
      { error: 'Failed to generate calendar' },
      { status: 500 }
    );
  }
}

function generateCalendarForProfile(profile: {
  age: number;
  familyStatus: string;
  income: number;
  goals: string[];
  riskTolerance: string;
  mentalStatus: string;
}): CalendarData {
  // Calculate priority scores
  const urgencyScore = profile.age < 30 ? 8 : profile.age < 50 ? 6 : 4;
  const complexityScore = profile.goals.length > 2 ? 8 : 5;
  const stabilityScore = profile.familyStatus === 'Married' ? 7 : 5;
  
  // Generate 7-day calendar
  const days = [];
  const today = new Date();
  
  const baseActivities = [
    {
      title: 'Track Daily Expenses',
      description: 'Log all spending in your budget app',
      category: 'tracking',
      difficulty: 1,
      timeRequired: 10
    },
    {
      title: 'Review Bank Statements',
      description: 'Check for unauthorized charges and categorize spending',
      category: 'analysis',
      difficulty: 2,
      timeRequired: 20
    },
    {
      title: 'Set Up Emergency Fund',
      description: 'Start saving for unexpected expenses',
      category: 'saving',
      difficulty: 3,
      timeRequired: 30
    },
    {
      title: 'Research Investment Options',
      description: 'Look into index funds and retirement accounts',
      category: 'investing',
      difficulty: 4,
      timeRequired: 45
    },
    {
      title: 'Create Monthly Budget',
      description: 'Plan your spending for the upcoming month',
      category: 'planning',
      difficulty: 3,
      timeRequired: 25
    },
    {
      title: 'Review Insurance Coverage',
      description: 'Ensure adequate protection for your situation',
      category: 'protection',
      difficulty: 2,
      timeRequired: 15
    },
    {
      title: 'Plan Financial Goals',
      description: 'Set specific, measurable financial objectives',
      category: 'goals',
      difficulty: 4,
      timeRequired: 35
    }
  ];

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
      
    // Select activities based on profile
    const dailyActivities = baseActivities
      .filter(() => Math.random() > 0.3) // Random selection
      .slice(0, Math.random() > 0.5 ? 2 : 1) // 1-2 activities per day
      .map(activity => ({
        ...activity,
        completed: false,
        priority: urgencyScore > 6 ? 'high' : 'medium'
      }));

    days.push({
      date: date.toISOString().split('T')[0],
      dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
      activities: dailyActivities,
      focusArea: profile.goals[i % profile.goals.length] || 'General Finance'
    });
  }

  return {
    weekOf: today.toISOString().split('T')[0],
    profileSummary: {
      urgencyScore,
      complexityScore,
      stabilityScore,
      riskTolerance: profile.riskTolerance,
      primaryGoals: profile.goals.slice(0, 3)
    },
    days,
    tips: [
      'Start with small, manageable tasks',
      'Track your progress daily',
      'Adjust activities based on your schedule',
      'Focus on building consistent habits'
    ]
  };
    }

interface CalendarData {
  weekOf: string;
  profileSummary: {
    urgencyScore: number;
    complexityScore: number;
    stabilityScore: number;
    riskTolerance: string;
    primaryGoals: string[];
  };
  days: Array<{
    date: string;
    dayName: string;
    activities: Array<{
      title: string;
      description: string;
      category: string;
      difficulty: number;
      timeRequired: number;
      completed: boolean;
      priority: string;
    }>;
    focusArea: string;
  }>;
  tips: string[];
} 