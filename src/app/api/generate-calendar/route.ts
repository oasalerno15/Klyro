import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { serverUsageService } from '@/lib/usage-service-server';

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

    // Check usage limits before generating calendar
    const canPerform = await serverUsageService.canPerformAction(user.id, 'ai_chat');
    
    if (!canPerform.allowed) {
      return NextResponse.json({ 
        error: 'Usage limit reached',
        upgradeRequired: true,
        message: 'You have reached your AI calendar generation limit for this billing period. Please upgrade your plan to continue.'
      }, { status: 403 });
    }

    // Increment usage before generating
    await serverUsageService.incrementUsage(user.id, 'ai_chat');

    // Generate AI-powered calendar
    const calendar = await generateAICalendar({
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

async function generateAICalendar(profile: {
  age: number;
  familyStatus: string;
  income: number;
  goals: string[];
  riskTolerance: string;
  mentalStatus: string;
}): Promise<CalendarData> {
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log('⚠️ OpenAI API key not available, using fallback calendar');
    return generateFallbackCalendar(profile);
  }

  try {
    const prompt = `You are an expert financial life coach creating a personalized 7-day financial wellness calendar. Generate a specific, actionable calendar based on this user profile:

PROFILE:
- Age: ${profile.age}
- Family: ${profile.familyStatus}
- Income: $${profile.income}/year
- Financial Goals: ${profile.goals.join(', ')}
- Risk Tolerance: ${profile.riskTolerance}
- Mental Status: ${profile.mentalStatus}

Create a 7-day calendar with 1-3 specific, personalized tasks per day. Each task should be:
- Highly specific to their profile and goals
- Actionable and measurable
- Emotionally supportive given their mental status
- Progressive (building toward their goals)
- Time-efficient (5-45 minutes each)

Return ONLY a JSON object in this exact format:
{
  "summary": "A compelling 2-sentence summary of this personalized financial journey plan",
  "steps": [
    {
      "title": "Specific action title",
      "desc": "Detailed description with specific steps to take",
      "status": "unlocked",
      "estimatedTime": "X minutes",
      "type": "action"
    }
  ],
  "scores": {
    "Readiness": 8,
    "Growth": 9,
    "Diversification": 7,
    "Risk Management": 8,
    "Opportunity": 8,
    "Stability": 7
  },
  "suggestions": ["3-4 specific tips tailored to their profile"],
  "calendar": [
    {
      "day": 1,
      "tasks": [
        {
          "id": "day1_task1",
          "title": "Specific task title",
          "description": "Detailed steps to complete this task",
          "type": "action",
          "icon": "💰",
          "estimated_time": "15 minutes",
          "completed": false
        }
      ]
    }
  ]
}

Make the tasks SPECIFIC to their situation. For example:
- If they mention stress: include stress-reducing financial habits
- If they want to save for a house: include house-buying preparation steps  
- If they're young: focus on foundation building
- If they have high income: include advanced strategies
- If they're married: include partner communication tasks

Each day should build logically toward their goals. Make it feel like a personal financial coach designed this specifically for them.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert financial wellness coach who creates highly personalized, actionable financial calendars. Always return valid JSON only.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      return generateFallbackCalendar(profile);
    }

    const data = await response.json();
    const aiContent = data.choices[0]?.message?.content;

    if (!aiContent) {
      console.error('No AI content generated');
      return generateFallbackCalendar(profile);
    }

    // Parse AI response
    try {
      const aiCalendar = JSON.parse(aiContent);
      
      // Validate structure and add any missing fields
      if (!aiCalendar.calendar || !Array.isArray(aiCalendar.calendar)) {
        throw new Error('Invalid calendar structure');
      }

      // Ensure all required fields exist
      const validatedCalendar: CalendarData = {
        summary: aiCalendar.summary || 'Your personalized financial wellness journey starts here.',
        steps: aiCalendar.steps || [],
        scores: aiCalendar.scores || {
          Readiness: 7,
          Growth: 7,
          Diversification: 6,
          'Risk Management': profile.riskTolerance === 'High' ? 6 : 8,
          Opportunity: 7,
          Stability: 7
        },
        suggestions: aiCalendar.suggestions || ['Start with small, consistent actions', 'Track your progress daily'],
        calendar: aiCalendar.calendar.map((day: any) => ({
          day: day.day,
          tasks: (day.tasks || []).map((task: any) => ({
            id: task.id || `day${day.day}_${Date.now()}`,
            title: task.title || 'Financial Task',
            description: task.description || 'Complete this financial task',
            type: task.type || 'action',
            icon: task.icon || '💰',
            estimated_time: task.estimated_time || '15 minutes',
            completed: false
          }))
        }))
      };

      console.log('✅ AI calendar generated successfully');
      return validatedCalendar;

    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return generateFallbackCalendar(profile);
    }

  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return generateFallbackCalendar(profile);
  }
}

function generateFallbackCalendar(profile: {
  age: number;
  familyStatus: string;
  income: number;
  goals: string[];
  riskTolerance: string;
  mentalStatus: string;
}): CalendarData {
  // Enhanced fallback calendar that's still somewhat personalized
  const calendar = [];
  const today = new Date();
  
  // Create personalized fallback tasks based on profile
  const personalizedTasks = [
    {
      title: `Set Your ${profile.goals[0] || 'Financial'} Goal`,
      description: `Define specific targets for your ${profile.goals[0]?.toLowerCase() || 'financial'} objectives based on your $${profile.income} income`,
      type: 'goal-setting',
      icon: '🎯',
      estimated_time: '20 minutes'
    },
    {
      title: `${profile.familyStatus} Budget Planning`,
      description: `Create a budget plan tailored to your ${profile.familyStatus.toLowerCase()} lifestyle and $${profile.income} annual income`,
      type: 'planning',
      icon: '📊',
      estimated_time: '30 minutes'
    },
    {
      title: `${profile.riskTolerance} Risk Investment Research`,
      description: `Research investment options matching your ${profile.riskTolerance.toLowerCase()} risk tolerance`,
      type: 'research',
      icon: '📈',
      estimated_time: '25 minutes'
    }
  ];

  for (let i = 0; i < 7; i++) {
    const dayTasks = personalizedTasks
      .slice(i % personalizedTasks.length, (i % personalizedTasks.length) + 2)
      .map((task, index) => ({
        id: `day${i + 1}_task${index + 1}`,
        title: task.title,
        description: task.description,
        type: task.type,
        icon: task.icon,
        estimated_time: task.estimated_time,
        completed: false
      }));

    calendar.push({
      day: i + 1,
      tasks: dayTasks
    });
  }

  return {
    summary: `A personalized financial wellness plan designed for your ${profile.familyStatus.toLowerCase()} lifestyle and ${profile.goals.join(', ').toLowerCase()} goals.`,
    steps: [
      {
        title: 'Foundation Building',
        desc: 'Establish your financial basics and tracking systems',
        status: 'unlocked',
        estimatedTime: '30 minutes',
        type: 'foundation'
      }
    ],
    scores: {
      Readiness: 7,
      Growth: 7,
      Diversification: 6,
      'Risk Management': profile.riskTolerance === 'High' ? 6 : 8,
      Opportunity: 7,
      Stability: 7
    },
    suggestions: [
      `Focus on ${profile.goals[0]?.toLowerCase() || 'your primary goal'} as your main priority`,
      `Your ${profile.riskTolerance.toLowerCase()} risk tolerance suggests a balanced approach`,
      'Start with small daily habits to build momentum',
      'Track progress weekly to stay motivated'
    ],
    calendar
  };
}

interface CalendarData {
  summary: string;
  steps: Array<{
    title: string;
    desc: string;
    status?: string;
    estimatedTime?: string;
    type?: string;
  }>;
  scores: Record<string, number>;
  suggestions: string[];
  calendar: Array<{
    day: number;
    tasks: Array<{
      id: string;
      title: string;
      description: string;
      type: string;
      icon?: string;
      estimated_time: string;
      completed: boolean;
    }>;
  }>;
} 