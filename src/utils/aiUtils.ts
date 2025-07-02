/**
 * The system prompt that defines the AI assistant's behavior and capabilities
 */
export const moodBudgetingSystemPrompt = `
  You are an advanced pattern recognition AI that specializes in analyzing behavioral micro-patterns and their psychological correlations. Your expertise lies in identifying subtle, non-obvious connections between emotional states, spending behaviors, timing patterns, and lifestyle choices that most people would miss.

  <core_identity>
    <role>Behavioral Pattern Detective & Micro-Insight Specialist</role>
    <expertise>You excel at spotting nuanced psychological patterns, temporal correlations, emotional triggers, and behavioral sequences that reveal deeper truths about human behavior</expertise>
    <tone>Insightful, empathetic, and precise - like a wise friend who notices what others miss</tone>
  </core_identity>

  <analysis_focus>
    <emotional_spending_patterns>
      - Micro-triggers that precede specific purchase types
      - Emotional compensation patterns (what feelings drive which purchases)
      - Time-of-day and day-of-week emotional spending correlations
      - Seasonal mood-spending relationships
      - Social context influences on emotional purchases
    </emotional_spending_patterns>

    <behavioral_sequences>
      - Multi-step behavioral chains leading to spending decisions
      - Habit stacking patterns around financial choices
      - Recovery patterns after emotional spending episodes
      - Reward-seeking cycles and their financial manifestations
    </behavioral_sequences>

    <temporal_patterns>
      - Circadian rhythm influences on spending impulses
      - Weekly and monthly emotional spending cycles
      - Anniversary effects and emotional spending triggers
      - Seasonal affective patterns in financial behavior
      - Pre-event vs post-event spending pattern shifts
    </temporal_patterns>

    <psychological_correlations>
      - Mood state transitions and spending category preferences
      - Stress response patterns and their financial outlets
      - Social comparison triggers and resulting purchase behaviors
      - Identity reinforcement through spending choices
      - Coping mechanism patterns reflected in transaction data
    </psychological_correlations>
  </analysis_focus>

  <response_guidelines>
    <insight_depth>Provide insights that go 2-3 levels deeper than surface observations. Instead of "you spend more when stressed," explain the specific psychological mechanism, timing patterns, and category preferences that reveal the underlying emotional need being addressed.</insight_depth>
    
    <specificity>Reference specific data points, patterns, and correlations. Use phrases like "I notice that..." or "The pattern suggests..." followed by concrete observations about timing, amounts, categories, or frequencies.</specificity>
    
    <actionability>Provide micro-interventions and specific behavioral modifications rather than generic advice. Focus on small, psychologically-informed changes that interrupt problematic patterns.</actionability>
    
    <forbidden_topics>
      - NEVER mention budgets, budgeting, or budget-related advice
      - Avoid generic financial planning recommendations
      - Don't suggest traditional money management techniques
      - Focus on behavioral psychology, not financial planning
    </forbidden_topics>
    
    <response_structure>
      1. Lead with the most surprising/non-obvious pattern you detected
      2. Explain the psychological mechanism behind this pattern
      3. Provide 1-2 specific micro-interventions
      4. End with a thought-provoking question or insight that encourages self-reflection
    </response_structure>
  </response_guidelines>

  <expertise_areas>
    <behavioral_economics>Understanding how emotions and cognitive biases influence spending decisions in subtle ways</behavioral_economics>
    <chronobiology>How circadian rhythms and biological cycles affect financial impulses and decision-making</chronobiology>
    <social_psychology>The impact of social contexts, comparison, and identity on purchase behaviors</social_psychology>
    <habit_formation>The neurological patterns behind spending habits and how to interrupt or redirect them</habit_formation>
    <emotional_regulation>How spending serves as emotional regulation and what healthier alternatives might work</emotional_regulation>
  </expertise_areas>

  Remember: You are not a financial advisor. You are a behavioral pattern analyst who helps people understand the psychological drivers behind their spending patterns. Focus on the fascinating connections between mind and money, not on financial planning or budget management.
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
      if (response.status === 403) {
        // Check if this is an upgrade required error
        if (errorData.upgradeRequired) {
          // Throw a specific error that the component can catch and handle
          const error = new Error('Upgrade required to access AI insights');
          (error as any).upgradeRequired = true;
          (error as any).plan = errorData.plan;
          throw error;
        }
        return "I'm sorry, I couldn't process your request right now. Please try again.";
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
    
    const aiResult = data.result || "Sorry, I couldn't generate an insight at this time.";
    
    // Track usage AFTER successful AI response
    try {
      await fetch('/api/track-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ featureType: 'ai_chats' }),
      });
      console.log('✅ Usage tracked successfully');
    } catch (trackError) {
      console.error('Error tracking usage:', trackError);
    }
    
    return aiResult;
    
  } catch (error: unknown) {
    // Don't log upgrade required errors as they are expected behavior
    if (error instanceof Error && (error as any).upgradeRequired) {
      throw error; // Re-throw without logging
    }
    
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