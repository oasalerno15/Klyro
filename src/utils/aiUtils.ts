/**
 * The system prompt that defines the AI assistant's behavior and capabilities
 */
export const moodBudgetingSystemPrompt = `
  You are a friendly, concise AI assistant for a mood-based budgeting app. Your purpose is to help users understand the relationship between their emotions and spending habits, provide personalized financial insights, and offer supportive guidance without being judgmental. Respond like a knowledgeable friend who cares about the user's financial and emotional wellbeing.
  
  <guidelines>
    <!-- Response Style -->
    <style>
      <tone>Friendly, supportive, and conversational</tone>
      <length>Brief and concise responses (typically 1-3 sentences unless detailed analysis is requested)</length>
      <approach>Direct answers first, then brief supportive context if helpful</approach>
    </style>
    
    <!-- Core Capabilities -->
    <capabilities>
      <capability>Analyze spending patterns in relation to reported moods</capability>
      <capability>Provide quick budget insights and gentle recommendations</capability>
      <capability>Identify potential emotional spending triggers</capability>
      <capability>Offer mood-aware financial tips and strategies</capability>
      <capability>Help set and track financial goals with mood considerations</capability>
    </capabilities>
    
    <!-- Special Instructions -->
    <instructions>
      <instruction>Always prioritize the user's direct question - answer first, elaborate only if necessary</instruction>
      <instruction>Don't show your reasoning process unless specifically asked</instruction>
      <instruction>Personalize responses using available user data (spending history, mood patterns)</instruction>
      <instruction>Frame advice positively, focusing on opportunity rather than restriction</instruction>
      <instruction>When discussing emotional spending, be empathetic and non-judgmental</instruction>
      <instruction>Keep technical financial terms simple unless the user demonstrates expertise</instruction>
      <instruction>If uncertain about specific app features, provide general guidance and suggest checking app functionality</instruction>
    </instructions>
    
    <!-- Response Structure -->
    <responseFormat>
      <format>Start with direct answer to the question</format>
      <format>Add brief context or personalized insight if relevant</format>
      <format>Include action-oriented suggestion when appropriate</format>
      <format>Use friendly closing for longer exchanges</format>
    </responseFormat>
  </guidelines>
  
  <!-- Knowledge Domain -->
  <knowledge>
    <domain>Personal finance and budgeting fundamentals</domain>
    <domain>Behavioral economics and emotional spending patterns</domain>
    <domain>Basic psychological aspects of money habits</domain>
    <domain>Common financial goals and strategies</domain>
    <domain>Spending categories and typical budget breakdowns</domain>
  </knowledge>
  
  <!-- Example Persona -->
  <persona>
    Imagine you're like a financially-savvy friend who's supportive but direct. You understand that money and emotions are connected, and you help users see these patterns without judgment. You're concise but warm, focusing on practical insights rather than lengthy explanations.
  </persona>
`;

/**
 * Generate an AI insight based on a prompt
 * @param prompt The user prompt or query to analyze
 * @returns A promise that resolves to the AI-generated insight
 */
export async function generateInsight(prompt: string): Promise<string> {
  // Call the API endpoint rather than returning mock responses
  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch('/api/ask-ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        prompt,
        systemPrompt: moodBudgetingSystemPrompt 
      }),
      signal: controller.signal
    });
    
    // Clear the timeout
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as Record<string, unknown>;
      
      // Handle specific error cases
      if (response.status === 403 && errorData.error === 'AI chat limit reached') {
        return `🔒 You've reached your AI chat limit for your current plan. ${
          errorData.upgradeRequired ? 'Consider upgrading your plan to get more AI insights.' : 'Please try again later.'
        }`;
      }
      
      if (response.status === 401) {
        return "🔐 Please log in to access AI insights.";
      }
      
      if (response.status === 429) {
        return "🕐 Too many requests. Please wait a moment and try again.";
      }
      
      if (response.status >= 500) {
        return "🛠️ Our AI service is temporarily unavailable. Please try again in a few minutes.";
      }
      
      // For other errors, throw to be handled by the catch block
      throw new Error(
        `API request failed with status ${response.status}: ${
          (errorData.error as string) || 'Unknown error'
        }`
      );
    }

    const data = await response.json() as { result?: string };
    if (!data || typeof data.result === 'undefined') {
      console.error('Invalid API response format:', data);
      return "Sorry, I received an invalid response format. Please try again.";
    }
    
    return data.result || "Sorry, I couldn't generate an insight at this time.";
  } catch (error: unknown) {
    console.error('Error generating insight:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Handle specific error types
    if (error instanceof Error && error.name === 'AbortError') {
      return "The request took too long to process. Please try again or try a simpler question.";
    }
    
    if (errorMessage.includes('NetworkError')) {
      return "Network error occurred. Please check your internet connection and try again.";
    }
    
    // Use the error message if available, otherwise use a generic message
    return errorMessage || "I encountered an error while processing your request. Please try again.";
  }
}

/**
 * Example function demonstrating how to use the generateInsight function
 */
export async function testAIInsight(): Promise<void> {
  try {
    const prompt = "Give me a financial insight.";
    console.log("Asking AI:", prompt);
    
    const response = await generateInsight(prompt);
    console.log("AI Response:", response);
  } catch (error) {
    console.error("Test AI insight failed:", error);
  }
}

/**
 * System prompt for roadmap analysis and planning
 */
export const roadmapSystemPrompt = `
You are a financial roadmap generator. You MUST return ONLY a valid JSON object with NO additional text, markdown, or formatting.

Based on the user's profile, return a raw JSON object with a tailored plan that includes BOTH a traditional roadmap AND a 7-day calendar with daily actionable tasks.

You will receive:
- age (number)
- income (number)
- familyStatus (string: "Single", "Married", etc.)
- riskTolerance (string: "Low", "Medium", "High")
- goals (array of strings like ["Saving", "Investing", "Passive income"])
- mentalStatus (string, free text from user)

Scoring System (1–10 for each, integers only):

Clarity Index:
- High (8–10): mentalStatus is detailed, focused, or specific (e.g., "I want to save $5k to feel less anxious")
- Medium (6–7): general (e.g., "I want to feel better with money")
- Low (3–5): vague, blank, or disconnected from goals
- Bonus: If goals match mentalStatus, score higher

Readiness Score:
- High (8–10): e.g., age 25, single, $50k income, risk = Medium
- Medium (5–7): e.g., age 22, $12k income, risk = High
- Low (3–5): over 60, low income, no savings goal
- Logic: Based on age, income, family, and risk alignment

Diversification Score:
- 1 goal: 3
- 2–3 goals: 6–7
- 4+ goals: 8–10

Volatility Risk:
- High risk + low income: 3
- High risk well-aligned to income/family: 8–10
- Low risk for young user: 6–7
- Logic: High score if risk matches context, low if risky

Confidence Alignment:
- Direct match between mentalStatus and goals: 8–10
- Partial match: 6–7
- Mismatch/unclear: 3–5

All scores must be integers from 1 to 10. Do not use decimals or numbers above 10.
Never suggest consulting a financial advisor or professional as a suggestion or step.
Be realistic and critical in your scoring. Most users should not receive a perfect 10/10 unless their profile is truly exceptional. Use the full range of the scale. For an average user, scores should typically fall between 5 and 8.
Do NOT give all 10/10 scores. Only give a 10/10 if the user's profile is truly exceptional in that category. Most users should receive a mix of scores between 3 and 8. Never give all perfect scores.

Calendar Guidelines:
- Create exactly 7 days of tasks (one week)
- Each day should have 1-2 specific, actionable tasks that are COMPLETELY DIFFERENT
- Tasks should take 15-45 minutes each
- Prioritize based on user's goals and risk tolerance
- Include 4 types: "action", "education", "milestone", "review"
- Day 1: Goal setting and vision
- Day 2: Financial assessment
- Day 3: Tracking setup
- Day 4: Emergency fund start
- Day 5: Investment education
- Day 6: Expense optimization
- Day 7: Weekly review and next steps
- Tasks should be personalized to user's profile and goals
- Make each day's task UNIQUE - no repeating content

IMPORTANT: Return ONLY the JSON object below. No markdown, no backticks, no additional text:

{
  "summary": "short personalized summary (4-5 sentences)",
  "scores": {
    "Readiness": integer (1-10),
    "Growth": integer (1-10),
    "Diversification": integer (1-10),
    "Risk Management": integer (1-10),
    "Opportunity": integer (1-10),
    "Stability": integer (1-10)
  },
  "suggestions": [
    "string",
    "string"
  ],
  "steps": [
    {
      "title": "Step title",
      "desc": "Short explanation",
      "type": "Action | Learning | Reflection",
      "status": "unlocked | locked",
      "estimatedTime": "e.g. '15 mins'"
    }
  ],
  "calendar": [
    {
      "date": "2024-01-01",
      "tasks": [
        {
          "id": "task-0-0",
          "title": "Task title",
          "description": "Detailed description of what to do",
          "type": "action",
          "icon": "Target",
          "estimated_time": "30 min",
          "completed": false
        }
      ],
      "isToday": false,
      "isCurrentMonth": true
    }
  ]
}

For calendar tasks, use these icon names: Target, Shield, TrendingUp, DollarSign, PiggyBank, Calculator, Home, Briefcase, BookOpen, Zap
Always escape double quotes and special characters in JSON strings. Return only valid JSON.
`;

/**
 * Generate a roadmap analysis and plan using GPT-3.5
 * @param form The RoadmapForm object with user inputs
 * @returns A promise that resolves to the parsed roadmap result
 */
export async function generateRoadmapAnalysis(form: {
  age: string;
  family: string;
  income: string;
  goals: string[];
  risk: string;
  goalDescription?: string;
}): Promise<RoadmapAnalysisResult> {
  try {
    const response = await fetch('/api/generate-calendar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        age: form.age,
        familyStatus: form.family,
        income: form.income,
        goals: form.goals,
        riskTolerance: form.risk,
        mentalStatus: form.goalDescription || ''
      })
    });
    
    if (!response.ok) {
      console.error('Calendar generation failed:', response.status);
      return generateFallbackRoadmap(form);
    }
    
    const data = await response.json() as { calendar?: CalendarData };
    
    if (!data.calendar) {
      console.error('No calendar data received');
      return generateFallbackRoadmap(form);
      }
      
    // Convert calendar data to roadmap format
    return convertCalendarToRoadmap(data.calendar, form);

  } catch (error) {
    console.error('Error generating roadmap analysis:', error);
    return generateFallbackRoadmap(form);
  }
}

interface RoadmapAnalysisResult {
  summary: string;
  scores: {
    Readiness: number;
    Growth: number;
    Diversification: number;
    'Risk Management': number;
    Opportunity: number;
    Stability: number;
  };
  suggestions: string[];
  steps: Array<{
    title: string;
    desc: string;
    type: string;
    status: string;
    estimatedTime: string;
  }>;
  calendar: Array<{
    day: number;
    tasks: Array<{
      id: string;
      title: string;
      description: string;
      type: string;
      icon: string;
      estimated_time: string;
      completed: boolean;
    }>;
  }>;
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

function convertCalendarToRoadmap(calendar: CalendarData, form: { goals: string[] }): RoadmapAnalysisResult {
  const { profileSummary } = calendar;
      
      return {
    summary: `Your personalized financial roadmap is ready! Based on your profile, we've created a 7-day action plan focused on ${form.goals.join(', ')}.`,
        scores: {
      Readiness: profileSummary.urgencyScore,
      Growth: profileSummary.complexityScore,
      Diversification: Math.min(form.goals.length * 2, 10),
      'Risk Management': profileSummary.riskTolerance === 'High' ? 6 : profileSummary.riskTolerance === 'Medium' ? 7 : 8,
      Opportunity: profileSummary.urgencyScore,
      Stability: profileSummary.stabilityScore
        },
    suggestions: calendar.tips,
    steps: calendar.days.slice(0, 3).map((day, index) => ({
      title: day.focusArea,
      desc: day.activities[0]?.description || 'Focus on your financial goals',
      type: 'Action',
      status: 'unlocked',
      estimatedTime: `${day.activities[0]?.timeRequired || 30} mins`
    })),
    calendar: calendar.days.map((day, index) => ({
      day: index + 1,
      tasks: day.activities.map((activity, actIndex) => ({
        id: `task-${index + 1}-${actIndex + 1}`,
        title: activity.title,
        description: activity.description,
        type: activity.category,
        icon: getIconForCategory(activity.category),
        estimated_time: `${activity.timeRequired} min`,
        completed: activity.completed
      }))
    }))
  };
}

function getIconForCategory(category: string): string {
  const iconMap: Record<string, string> = {
    tracking: 'Calculator',
    analysis: 'Shield',
    saving: 'DollarSign',
    investing: 'Target',
    planning: 'Calendar',
    protection: 'Shield',
    goals: 'Target'
  };
  return iconMap[category] || 'Target';
}

function generateFallbackRoadmap(form: { goals: string[] }): RoadmapAnalysisResult {
        return {
    summary: `Your financial roadmap is ready! We've created a personalized plan to help you achieve your goals: ${form.goals.join(', ')}.`,
          scores: {
      Readiness: 7,
      Growth: 6,
      Diversification: Math.min(form.goals.length * 2, 10),
      'Risk Management': 7,
      Opportunity: 7,
      Stability: 7
          },
          suggestions: [
      'Start with small, achievable daily actions',
      'Focus on your priority goals first',
      'Track your progress weekly'
    ],
          steps: [
      { title: 'Set Clear Goals', desc: 'Define specific financial objectives', type: 'Action', status: 'unlocked', estimatedTime: '30 mins' },
      { title: 'Create Budget', desc: 'Track income and expenses', type: 'Action', status: 'unlocked', estimatedTime: '45 mins' },
      { title: 'Build Emergency Fund', desc: 'Save 3-6 months of expenses', type: 'Action', status: 'unlocked', estimatedTime: '60 mins' }
    ],
    calendar: Array.from({ length: 7 }, (_, i) => ({
      day: i + 1,
      tasks: [{
        id: `fallback-task-${i + 1}`,
        title: ['Set Goals', 'Track Spending', 'Check Credit', 'Research Investments', 'Create Budget', 'Emergency Fund', 'Weekly Review'][i],
        description: `Day ${i + 1}: Take action toward your financial goals`,
        type: i === 6 ? 'review' : 'action',
        icon: ['Target', 'Calculator', 'Shield', 'DollarSign', 'Calculator', 'Shield', 'Zap'][i],
        estimated_time: '30 min',
        completed: false
      }]
    }))
  };
}

/**
 * Generate a financial calendar based on user profile
 * @param userProfile The user's financial profile
 * @returns A promise that resolves to calendar data
 */
export async function generateFinancialCalendar(userProfile: {
  age: number;
  income: number;
  goals: string[];
  riskTolerance: string;
}): Promise<CalendarData> {
  // This would typically call an AI service, but for now return structured data
  const today = new Date();
  
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    return {
      date: date.toISOString().split('T')[0],
      dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
      activities: [
        {
          title: `Day ${i + 1} Financial Task`,
          description: 'Complete your daily financial goal',
          category: 'planning',
          difficulty: 2,
          timeRequired: 30,
          completed: false,
          priority: 'medium' as const
        }
      ],
      focusArea: userProfile.goals[i % userProfile.goals.length] || 'General Finance'
    };
  });

  return {
    weekOf: today.toISOString().split('T')[0],
    profileSummary: {
      urgencyScore: userProfile.age < 30 ? 8 : 6,
      complexityScore: userProfile.goals.length > 2 ? 8 : 5,
      stabilityScore: 7,
      riskTolerance: userProfile.riskTolerance,
      primaryGoals: userProfile.goals.slice(0, 3)
    },
    days,
    tips: [
      'Start with small, manageable tasks',
      'Track your progress daily',
      'Focus on building consistent habits'
    ]
  };
} 