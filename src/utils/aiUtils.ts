import { jsonrepair } from 'jsonrepair';

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
      const errorData = await response.json().catch(() => ({}));
      
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
          errorData.error || 'Unknown error'
        }`
      );
    }

    const data = await response.json();
    if (!data || typeof data.result === 'undefined') {
      console.error('Invalid API response format:', data);
      return "Sorry, I received an invalid response format. Please try again.";
    }
    
    return data.result || "Sorry, I couldn't generate an insight at this time.";
  } catch (error: any) {
    console.error('Error generating insight:', error);
    
    // Handle specific error types
    if (error.name === 'AbortError') {
      return "The request took too long to process. Please try again or try a simpler question.";
    }
    
    if (error.message && error.message.includes('NetworkError')) {
      return "Network error occurred. Please check your internet connection and try again.";
    }
    
    // Use the error message if available, otherwise use a generic message
    return error.message || "I encountered an error while processing your request. Please try again.";
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
}): Promise<any> {
  const prompt = `User profile:\n- age: ${form.age}\n- income: ${form.income}\n- familyStatus: ${form.family}\n- riskTolerance: ${form.risk}\n- goals: [${form.goals.map(g => '"' + g + '"').join(", ")}]\n- mentalStatus: ${form.goalDescription || ''}\n\nGenerate a personalized financial roadmap as described.`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort('Request timeout after 120 seconds');
    }, 120000); // Increased to 120 seconds (2 minutes)
    
    const response = await fetch('/api/ask-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, systemPrompt: roadmapSystemPrompt }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle specific error cases gracefully
      if (response.status === 403 && errorData.error === 'AI chat limit reached') {
        // Return a basic roadmap structure when usage limit is reached
        console.log('Usage limit reached, returning fallback roadmap');
        return {
          summary: "You've reached your AI analysis limit. Here's a basic roadmap to get you started with your financial journey.",
          scores: {
            Readiness: 5,
            Growth: 5,
            Diversification: 5,
            "Risk Management": 5,
            Opportunity: 5,
            Stability: 5
          },
          steps: [
            { title: 'Set Financial Goals', desc: 'Define your short and long-term financial objectives.', type: 'Action', status: 'unlocked', estimatedTime: '15 mins' },
            { title: 'Track Your Spending', desc: 'Monitor your daily expenses to understand your spending patterns.', type: 'Action', status: 'unlocked', estimatedTime: '30 mins' },
            { title: 'Build Emergency Fund', desc: 'Save 3-6 months of expenses for unexpected situations.', type: 'Action', status: 'unlocked', estimatedTime: '30 mins' }
          ],
          calendar: generateFallbackCalendar(form),
          limitReached: true
        };
      }
      
      if (response.status === 401) {
        throw new Error('Please log in to access AI roadmap analysis.');
      }
      
      // For other errors, throw as before
      throw new Error(
        `API request failed with status ${response.status}: ${errorData.error || 'Unknown error'}`
      );
    }
    
    const data = await response.json();
    if (!data || typeof data.result !== 'string') {
      throw new Error('Invalid API response format: Missing or invalid result field');
    }

    // Log the raw AI response for debugging
    console.log('Raw AI response:', data.result);

    try {
      // Clean the AI response before parsing
      let cleanedResponse = data.result.trim();
      
      // Remove any potential markdown formatting
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Try to find JSON within the response if it's wrapped in text
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanedResponse = jsonMatch[0];
      }
      
      console.log('Cleaned response:', cleanedResponse);
      
      // Check if response appears to be truncated
      if (!cleanedResponse.trim().endsWith('}')) {
        console.warn('AI response appears to be truncated, attempting to fix...');
        
        // Try to fix common truncation issues
        let fixedResponse = cleanedResponse.trim();
        
        // If it ends with incomplete calendar field, remove it
        if (fixedResponse.includes('"calendar":') && !fixedResponse.includes('"calendar":[')) {
          const calendarIndex = fixedResponse.lastIndexOf('"calendar":');
          if (calendarIndex > 0) {
            // Remove the incomplete calendar field and close the JSON properly
            fixedResponse = fixedResponse.substring(0, calendarIndex - 1) + '}';
            console.log('Removed incomplete calendar field');
          }
        }
        
        // Ensure proper JSON closure
        if (!fixedResponse.endsWith('}')) {
          fixedResponse += '}';
        }
        
        cleanedResponse = fixedResponse;
        console.log('Fixed truncated response:', cleanedResponse);
      }
      
      // Try to parse the response as JSON
      const parsedResult = JSON.parse(cleanedResponse);
      console.log('Parsed result:', parsedResult);
      
      // Validate the required fields - make calendar optional since it might not always be generated
      if (!parsedResult.summary || !parsedResult.scores) {
        console.error('Missing required fields in parsed result:', {
          hasSummary: !!parsedResult.summary,
          hasSteps: !!parsedResult.steps,
          hasScores: !!parsedResult.scores,
          hasCalendar: !!parsedResult.calendar
        });
        throw new Error(`Invalid roadmap format: Missing required fields. Found: ${Object.keys(parsedResult).join(', ')}`);
      }

      // Validate and sanitize scores
      const sanitizedScores = Object.entries(parsedResult.scores).reduce((acc, [key, value]) => {
        const numValue = Number(value);
        if (isNaN(numValue) || numValue < 0 || numValue > 10) {
          acc[key] = 5; // Default to middle value if invalid
        } else {
          acc[key] = Math.min(10, Math.max(0, Math.round(numValue))); // Ensure integer between 0-10
        }
        return acc;
      }, {} as Record<string, number>);

      // Validate and sanitize steps
      const sanitizedSteps = Array.isArray(parsedResult.steps) ? parsedResult.steps.map((step: any) => ({
        title: String(step.title || 'Untitled Step'),
        desc: String(step.desc || 'No description provided'),
        type: step.type || 'Action',
        status: step.status || 'unlocked',
        estimatedTime: step.estimatedTime || '15 mins'
      })) : [
        { title: 'Set Financial Goals', desc: 'Define your short and long-term financial objectives.', type: 'Action', status: 'unlocked', estimatedTime: '15 mins' },
        { title: 'Track Your Spending', desc: 'Monitor your daily expenses to understand your spending patterns.', type: 'Action', status: 'unlocked', estimatedTime: '30 mins' },
        { title: 'Build Emergency Fund', desc: 'Save 3-6 months of expenses for unexpected situations.', type: 'Action', status: 'unlocked', estimatedTime: '30 mins' }
      ];

      // Process calendar data if present
      let sanitizedCalendar = undefined;
      if (parsedResult.calendar && Array.isArray(parsedResult.calendar)) {
        sanitizedCalendar = parsedResult.calendar.map((day: any, dayIndex: number) => {
          // Create date object - use current date + dayIndex for proper calendar
          const date = new Date();
          date.setDate(date.getDate() + dayIndex);
          
          const tasks = Array.isArray(day.tasks) ? day.tasks.map((task: any, taskIndex: number) => ({
            id: task.id || `task-${dayIndex}-${taskIndex}`,
            title: String(task.title || 'Daily Task'),
            description: String(task.description || 'Complete this financial task'),
            type: task.type || 'action',
            icon: task.icon || 'Target',
            estimated_time: task.estimated_time || '30 min',
            completed: false
          })) : [];

          return {
            date,
            tasks,
            isToday: dayIndex === 0,
            isCurrentMonth: true
          };
        });
      } else {
        // Generate a fallback calendar if AI didn't provide one
        console.log('No calendar in AI response, generating fallback calendar');
        sanitizedCalendar = [];
        for (let i = 0; i < 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() + i);
          
          const tasks = [{
            id: `ai-fallback-task-${i}-0`,
            title: i === 0 ? 'Set Financial Goals' : 
                   i === 1 ? 'Track Your Spending' :
                   i === 2 ? 'Check Credit Score' :
                   i % 7 === 0 ? 'Weekly Review' : 'Daily Financial Action',
            description: i === 0 ? 'Write down your top 3 financial goals' :
                        i === 1 ? 'Start tracking all your expenses today' :
                        i === 2 ? 'Get your free credit report' :
                        i % 7 === 0 ? 'Review your progress this week' : 'Take one small step toward your financial goals',
            type: i % 7 === 0 ? 'review' : i < 7 ? 'action' : i < 14 ? 'education' : 'action',
            icon: i % 7 === 0 ? 'Zap' : i === 0 ? 'Target' : i === 1 ? 'Calculator' : i === 2 ? 'Shield' : 'DollarSign',
            estimated_time: '30 min',
            completed: false
          }];
          
          sanitizedCalendar.push({
            date,
            tasks,
            isToday: i === 0,
            isCurrentMonth: true
          });
        }
      }

      // After parsing the AI result, ensure all 6 required score keys are present
      const REQUIRED_SCORE_KEYS = [
        'Readiness',
        'Growth',
        'Diversification',
        'Risk Management',
        'Opportunity',
        'Stability',
      ];
      // Ensure all required score keys are present
      if (parsedResult.scores) {
        for (const key of REQUIRED_SCORE_KEYS) {
          if (typeof parsedResult.scores[key] !== 'number') {
            parsedResult.scores[key] = 0;
          }
        }
      }

      // Return sanitized result
      return {
        summary: String(parsedResult.summary || 'No summary provided'),
        steps: sanitizedSteps,
        scores: sanitizedScores,
        suggestions: Array.isArray(parsedResult.suggestions) 
          ? parsedResult.suggestions.map((s: any) => String(s))
          : [],
        calendar: sanitizedCalendar
      };
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.error('Original AI response was:', data.result);
      
      // Generate fallback calendar if AI response parsing fails
      const fallbackCalendar = generateFallbackCalendar(form);
      
      return {
        summary: `Your personalized financial calendar is ready! Based on your profile (Age: ${form.age}, Income: $${form.income}, Goals: ${form.goals.join(', ')}), we've created a 7-day action plan. The AI had trouble formatting the response, so we've generated a comprehensive plan using proven financial strategies.`,
        steps: [
          { title: 'Set Clear Financial Goals', desc: 'Define your short and long-term financial objectives based on your goals: ' + form.goals.join(', ') },
          { title: 'Build an Emergency Fund', desc: 'Save 3-6 months of expenses in a high-yield savings account.' },
          { title: 'Optimize Your Budget', desc: 'Track spending and allocate funds to essentials, savings, and investments.' },
          { title: 'Explore Investment Options', desc: `Based on your ${form.risk} risk tolerance, consider appropriate investment vehicles.` },
          { title: 'Increase Income Streams', desc: form.goals.includes('Side hustles') ? 'Focus on developing side hustles as per your goals.' : 'Look into additional income opportunities.' },
          { title: 'Review & Adjust Regularly', desc: 'Revisit your plan as your life circumstances change.' }
        ],
        scores: {
          Readiness: Math.min(9, Math.max(5, parseInt(form.age) < 30 ? 8 : parseInt(form.age) < 50 ? 7 : 6)),
          Growth: form.goals.includes('Investing') ? 8 : form.goals.includes('Saving') ? 7 : 6,
          Diversification: form.goals.length <= 1 ? 4 : form.goals.length <= 3 ? 6 : 8,
          'Risk Management': form.risk === 'High' ? 6 : form.risk === 'Medium' ? 7 : 8,
          Opportunity: form.goals.includes('Side hustles') || form.goals.includes('Passive income') ? 8 : 7,
          Stability: form.goals.includes('Budgeting') || form.goals.includes('Debt reduction') ? 8 : 7
        },
        suggestions: [
          'Your plan is ready even though the AI had formatting issues. Start with Day 1!',
          `Focus on your priority goals: ${form.goals.slice(0, 2).join(' and ')}.`
        ],
        calendar: fallbackCalendar
      };
    }
  } catch (error: any) {
    console.error('AI analysis failed:', error);
    
    // Check if this is a rate limit error (should retry) vs quota error (should fallback)
    if (error.message?.includes('status 429')) {
      if (error.message?.includes('Rate limit')) {
        console.log('Rate limit exceeded, falling back to comprehensive plan generation');
        
        const fallbackCalendar = generateFallbackCalendar(form);
        
        return {
          summary: `Your personalized 7-day financial calendar is ready! Based on your profile (Age: ${form.age}, Income: $${form.income}, Goals: ${form.goals.join(', ')}), we've created a comprehensive action plan. Note: The AI service is experiencing high traffic, so we're using our proven financial framework.`,
          steps: [
            { title: 'Set Clear Financial Goals', desc: 'Define your short and long-term financial objectives based on your goals: ' + form.goals.join(', '), type: 'Action', status: 'unlocked', estimatedTime: '30 mins' },
            { title: 'Build an Emergency Fund', desc: 'Save 3-6 months of expenses in a high-yield savings account.', type: 'Action', status: 'unlocked', estimatedTime: '45 mins' },
            { title: 'Optimize Your Budget', desc: 'Track spending and allocate funds to essentials, savings, and investments.', type: 'Action', status: 'unlocked', estimatedTime: '30 mins' },
            { title: 'Explore Investment Options', desc: `Based on your ${form.risk} risk tolerance, consider appropriate investment vehicles.`, type: 'Education', status: 'unlocked', estimatedTime: '45 mins' },
            { title: 'Increase Income Streams', desc: form.goals.includes('Side hustles') ? 'Focus on developing side hustles as per your goals.' : 'Look into additional income opportunities.', type: 'Action', status: 'unlocked', estimatedTime: '60 mins' },
            { title: 'Review & Adjust Regularly', desc: 'Revisit your plan monthly as your life circumstances change.', type: 'Review', status: 'unlocked', estimatedTime: '20 mins' }
          ],
          scores: {
            Readiness: Math.min(9, Math.max(5, parseInt(form.age) < 30 ? 8 : parseInt(form.age) < 50 ? 7 : 6)),
            Growth: form.goals.includes('Investing') ? 8 : form.goals.includes('Saving') ? 7 : 6,
            Diversification: form.goals.length <= 1 ? 4 : form.goals.length <= 3 ? 6 : 8,
            'Risk Management': form.risk === 'High' ? 6 : form.risk === 'Medium' ? 7 : 8,
            Opportunity: form.goals.includes('Side hustles') ? 9 : 7,
            Stability: form.goals.includes('Debt reduction') ? 8 : 6
          },
          suggestions: [
            'Your plan is ready! The AI experienced high traffic, but we\'ve generated a robust roadmap.',
            `Focus on your priority goals: ${form.goals.slice(0, 2).join(' and ')}.`,
            'Start with Day 1 and build momentum with daily actions.'
          ],
          calendar: fallbackCalendar
        };
      } else if (error.message?.includes('quota') || error.message?.includes('exceeded')) {
        console.log('OpenAI quota exceeded, falling back to mock data generation');
        
        const fallbackCalendar = generateFallbackCalendar(form);
        
        return {
          summary: `Your personalized 7-day financial calendar is ready! Based on your profile (Age: ${form.age}, Income: $${form.income}, Goals: ${form.goals.join(', ')}), we've created a comprehensive action plan. Note: We're using our proven financial framework since the AI service is temporarily unavailable.`,
          steps: [
            { title: 'Set Clear Financial Goals', desc: 'Define your short and long-term financial objectives based on your goals: ' + form.goals.join(', '), type: 'Action', status: 'unlocked', estimatedTime: '30 mins' },
            { title: 'Build an Emergency Fund', desc: 'Save 3-6 months of expenses in a high-yield savings account.', type: 'Action', status: 'unlocked', estimatedTime: '45 mins' },
            { title: 'Optimize Your Budget', desc: 'Track spending and allocate funds to essentials, savings, and investments.', type: 'Action', status: 'unlocked', estimatedTime: '30 mins' },
            { title: 'Explore Investment Options', desc: `Based on your ${form.risk} risk tolerance, consider appropriate investment vehicles.`, type: 'Education', status: 'unlocked', estimatedTime: '45 mins' },
            { title: 'Increase Income Streams', desc: form.goals.includes('Side hustles') ? 'Focus on developing side hustles as per your goals.' : 'Look into additional income opportunities.', type: 'Action', status: 'unlocked', estimatedTime: '60 mins' },
            { title: 'Review & Adjust Regularly', desc: 'Revisit your plan monthly as your life circumstances change.', type: 'Review', status: 'unlocked', estimatedTime: '20 mins' }
          ],
          scores: {
            Readiness: Math.min(9, Math.max(5, parseInt(form.age) < 30 ? 8 : parseInt(form.age) < 50 ? 7 : 6)),
            Growth: form.goals.includes('Investing') ? 8 : form.goals.includes('Saving') ? 7 : 6,
            Diversification: form.goals.length <= 1 ? 4 : form.goals.length <= 3 ? 6 : 8,
            'Risk Management': form.risk === 'High' ? 6 : form.risk === 'Medium' ? 7 : 8,
            Opportunity: form.goals.includes('Side hustles') ? 9 : 7,
            Stability: form.goals.includes('Debt reduction') ? 8 : 6
          },
          suggestions: [
            'Your plan is ready! The AI service is temporarily unavailable, but we\'ve used proven financial strategies.',
            `Focus on your priority goals: ${form.goals.slice(0, 2).join(' and ')}.`,
            'Start with Day 1 and build momentum with daily actions.'
          ],
          calendar: fallbackCalendar
        };
      }
    }
    
    // For other errors, generate a comprehensive fallback
    const fallbackCalendar = generateFallbackCalendar(form);
    
    return {
      summary: `Your personalized financial calendar has been created based on proven strategies. Age: ${form.age}, Income: $${form.income}, Goals: ${form.goals.join(', ')}. While our AI assistant encountered an issue, we've generated a comprehensive 7-day plan using established financial planning principles.`,
      steps: [
        { title: 'Financial Assessment', desc: 'Review your current financial situation and set clear goals.', type: 'Review', status: 'unlocked', estimatedTime: '30 mins' },
        { title: 'Emergency Fund Setup', desc: 'Open a high-yield savings account and start building your emergency fund.', type: 'Action', status: 'unlocked', estimatedTime: '45 mins' },
        { title: 'Budget Creation', desc: 'Create a detailed budget using the 50/30/20 rule or similar framework.', type: 'Action', status: 'unlocked', estimatedTime: '60 mins' },
        { title: 'Investment Planning', desc: `Learn about investment options suitable for your ${form.risk} risk tolerance.`, type: 'Education', status: 'unlocked', estimatedTime: '45 mins' },
        { title: 'Income Optimization', desc: 'Explore ways to increase your income through side hustles or skill development.', type: 'Action', status: 'unlocked', estimatedTime: '90 mins' },
        { title: 'Long-term Strategy', desc: 'Develop a long-term financial plan for wealth building.', type: 'Planning', status: 'unlocked', estimatedTime: '60 mins' }
      ],
      scores: {
        Readiness: 7,
        Growth: form.goals.includes('Investing') ? 8 : 6,
        Diversification: Math.min(8, Math.max(4, form.goals.length * 2)),
        'Risk Management': form.risk === 'High' ? 6 : form.risk === 'Medium' ? 7 : 8,
        Opportunity: form.goals.includes('Side hustles') ? 9 : 7,
        Stability: form.goals.includes('Debt reduction') ? 8 : 6
      },
      suggestions: [
        'Your financial plan is ready to implement!',
        'We encountered a temporary service issue but generated a robust plan for you.',
        'Start with the basics and build momentum daily.'
      ],
      calendar: fallbackCalendar
    };
  }
}

// Helper function to generate a comprehensive fallback calendar
function generateFallbackCalendar(form: { goals: string[] }) {
  const fallbackCalendar = [];
  
  // 7 unique days with completely different tasks
  const uniqueTasks = [
    // Day 1: Goal Setting
    {
      title: 'Define Your Financial Vision',
      desc: 'Write down 3 specific financial goals with target amounts and deadlines',
      type: 'action',
      icon: 'Target'
    },
    // Day 2: Assessment
    {
      title: 'Financial Health Checkup',
      desc: 'Calculate your net worth and list all assets and debts',
      type: 'action',
      icon: 'Shield'
    },
    // Day 3: Tracking
    {
      title: 'Start Expense Tracking',
      desc: 'Download a budgeting app and log every purchase for one week',
      type: 'action',
      icon: 'Calculator'
    },
    // Day 4: Emergency Fund
    {
      title: 'Emergency Fund Setup',
      desc: 'Open a high-yield savings account and transfer $100 to start your emergency fund',
      type: 'action',
      icon: 'PiggyBank'
    },
    // Day 5: Education
    {
      title: 'Investment Basics Learning',
      desc: 'Read about index funds and watch 3 educational videos about investing',
      type: 'education',
      icon: 'BookOpen'
    },
    // Day 6: Optimization
    {
      title: 'Cut Unnecessary Expenses',
      desc: 'Cancel one subscription you don\'t use and negotiate one bill (phone, internet, etc.)',
      type: 'action',
      icon: 'DollarSign'
    },
    // Day 7: Planning
    {
      title: 'Create Next Week\'s Plan',
      desc: 'Review this week\'s progress and plan 3 specific financial actions for next week',
      type: 'review',
      icon: 'Zap'
    }
  ];

  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    
    const task = uniqueTasks[i];
    const tasks = [{
      id: `fallback-task-${i}-0`,
      title: task.title,
      description: task.desc,
      type: task.type,
      icon: task.icon,
      estimated_time: '30 min',
      completed: false
    }];
    
    fallbackCalendar.push({
      date,
      tasks,
      isToday: i === 0,
      isCurrentMonth: true
    });
  }
  return fallbackCalendar;
} 