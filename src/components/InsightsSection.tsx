'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { generateInsight } from '@/utils/aiUtils';
import { useAuth } from '@/lib/auth';
import { usePaywall } from '@/hooks/usePaywall';
import MetricCard from './MetricCard';
import MetricModal from './MetricModal';
import ViewDropdown, { VIEW_OPTIONS } from './ViewDropdown';
import BudgetPieChart from './BudgetPieChart';
import SpendingBarChart from './SpendingBarChart';
import TrendLineChart from './TrendLineChart';
import AIInsightsView from './AIInsightsView';
import TrialPaywallModal from './TrialPaywallModal';
import { 
  createChatSession, 
  addChatMessage, 
  getUserChatSessions, 
  getChatMessages, 
  deleteChatSession,
  generateChatTitle,
  type ChatSession as DBChatSession,
  type ChatMessage as DBChatMessage
} from '@/utils/chatUtils';

// Custom CSS for pulse animation
const pulseStyles = `
  @keyframes pulse-border {
    0% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.7); }
    70% { box-shadow: 0 0 0 4px rgba(52, 211, 153, 0); }
    100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); }
  }
  
  .pulse-border {
    animation: pulse-border 1.5s 2;
    border-color: #10b981 !important;
  }
`;

// Placeholder data - in real app would come from API
const moodData = {
  currentMood: 'Calm',
  moodTrend: '+2.1%',
  moodScore: '85%',
  moodInsights: [
    'Your mood has been consistently positive this week',
    'You tend to feel more energetic in the mornings',
    'Your mood improves after exercise'
  ]
};

const spendingData = {
  monthlyBudget: 4000,
  currentSpent: 2750,
  topCategories: [
    { name: 'Food & Dining', amount: 850 },
    { name: 'Shopping', amount: 650 },
    { name: 'Bills & Utilities', amount: 550 }
  ]
};

const habitsData = {
  topHabits: [
    { name: 'Morning Exercise', frequency: '5/7 days', impact: 'High' },
    { name: 'Meditation', frequency: '4/7 days', impact: 'Medium' },
    { name: 'Reading', frequency: '3/7 days', impact: 'Medium' }
  ],
  habitInsights: [
    'Exercise has the highest positive impact on your mood',
    "You're most consistent with morning routines",
    'Weekends show more variation in habits'
  ]
};

// Category-specific suggestions
const categorySuggestions = {
  mood: [
    "How has my mood affected my spending this month?",
    "What mood triggers my impulse purchases?",
    "Why do I spend more when I'm stressed?",
    "How can I improve my mood without spending?",
    "What activities boost my mood and save money?"
  ],
  budget: [
    "How can I balance my budget for better well-being?",
    "What's a good spending limit for my 'feel good' purchases?",
    "How much should I budget for stress relief?",
    "Can you suggest a mood-based budget plan?",
    "How does my budget compare to others with similar moods?"
  ],
  habit: [
    "Which habits improve both my mood and finances?",
    "What spending habits trigger negative emotions?",
    "How can I replace expensive habits with cheaper ones?",
    "What morning routine would improve my financial mindset?",
    "Which of my habits cost the most money?"
  ],
  spending: [
    "How is my emotional state affecting my spending?",
    "Am I making too many impulse purchases?",
    "What's my spending pattern when I'm happy vs. anxious?",
    "How can I control emotional spending?",
    "What spending categories boost my mood the most?"
  ]
};

// Suggestion prompts for the user
const suggestionPrompts = [
  "Why do I always spend so much when I'm stressed?",
  "How does my happy spending compare to my sad spending?",
  "What should I do with my extra $200 this month?",
  "Can you analyze my spending from last week?"
];

// Metrics data
const metricsData = [
  {
    id: 'calmCapital',
    title: 'Calm Capital',
    value: '812/1000',
    changePercent: -3.1,
    insight: 'Low mood during high spending days may have impacted this.',
    description: `Calm Capital measures your emotional resilience in high-spending situations.

This score is calculated based on the correlation between your mood ratings and spending amounts during the past week. The higher your mood remains during significant financial transactions, the better your Calm Capital score.

Your score declined 3.1% this week due to several instances of lower mood ratings coinciding with higher spending days. In particular, we noticed a pattern on May 28th when you spent $32.50 at Amazon while your mood was rated 5/10 (Neutral).

Improving this score: Try to plan larger purchases for days when your mood is higher, or develop mindfulness practices to maintain emotional balance during spending decisions.`,
    query: "Tell me more about my Calm Capital score and how to improve it."
  },
  {
    id: 'moodMoneyScore',
    title: 'Mood x Money Score',
    value: '92.3%',
    changePercent: 5.6,
    insight: 'Great consistency in mood and spending alignment.',
    description: `Your Mood x Money Score shows how well your spending aligns with your emotional state.

This metric assesses whether you tend to spend more during low mood periods (potentially indicating emotional spending) or maintain steady spending regardless of mood.

Your score improved by 5.6% this week, reaching an excellent 92.3%. This indicates you've been making financial decisions that aren't heavily influenced by temporary emotional states.

Last week, you maintained consistent spending patterns across varying mood states, avoiding impulse purchases during lower mood days. For example, on May 29th, despite a middling mood score of 7/10, you kept your spending to just $15.99.

Keep up this pattern of mindful spending regardless of emotional state to maintain or improve this score.`,
    query: "How can I maintain my good Mood x Money Score?"
  },
  {
    id: 'moodConsistency',
    title: 'Mood Consistency',
    value: 'Stable',
    changePercent: 4.3,
    insight: 'Your mood variance has improved since last week.',
    description: `Mood Consistency measures how steady your emotional state has been throughout the week.

This score is calculated based on the variance between your daily mood ratings. A more consistent mood generally indicates better emotional regulation, which tends to lead to better financial decisions.

Your score improved by 4.3% this week. Your mood ratings stayed within a narrower range (between 6-9 out of 10) compared to previous weeks, with fewer dramatic shifts.

The positive rating comes despite one notable dip in mood (to 5/10) on May 28th. However, you recovered quickly the next day with a 7/10 rating.

Maintaining consistent mood helps reduce emotional spending and creates more predictable financial patterns. Keep up your current activities that seem to be supporting your emotional stability.`,
    query: "What activities help maintain my mood consistency?"
  },
  {
    id: 'weeklySpending',
    title: 'Weekly Spending',
    value: '$259.97',
    changePercent: -12.5,
    insight: 'Down compared to your average weekly spending.',
    description: `Weekly Spending tracks your total expenditures over the past 7 days.

This score is a straightforward sum of all transactions recorded in your account during the period from May 26th to June 1st. Your total spending this week was $259.97.

This represents a 12.5% decrease from your average weekly spending of approximately $297.10, which is a positive trend for your financial health.

Your spending was distributed across several categories:
- Home: $87.99 (HomeCare)
- Shopping: $77.72 (Amazon, Target)
- Groceries: $54.12 (Whole Foods)
- Transportation: $18.40 (Uber)
- Subscription: $15.99 (Netflix)
- Coffee: $5.75 (Starbucks)

Maintaining or further reducing this spending level will help improve your overall financial wellness and support your saving goals.`,
    query: "Break down my spending by category this week."
  }
];

// Define the message type
type Message = {
  role: 'user' | 'assistant';
  content: string;
};

// Define chat history type
type ChatSession = {
  id: string;
  title: string;
  lastMessage: string;
  date: string;
  messages: Message[];
};

export default function InsightsSection() {
  const { user } = useAuth();
  const { checkFeatureAccess, paywallState, hidePaywall } = usePaywall();
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentSuggestion, setCurrentSuggestion] = useState(0);
  const [activeSuggestionCategory, setActiveSuggestionCategory] = useState<string | null>(null);
  
  // Typing animation states
  const [isTyping, setIsTyping] = useState(false);
  const [currentTypingText, setCurrentTypingText] = useState('');
  const [fullResponse, setFullResponse] = useState('');
  const currentResponseRef = useRef<string>('');
  
  const suggestionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({
    mood: null,
    budget: null,
    habit: null,
    spending: null,
    fileUpload: null
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [monthlySpending, setMonthlySpending] = useState({ currentMonth: 0, lastMonth: 0, percentChange: 0 });
  
  // State for metric detail modal
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // View toggle state
  const [activeView, setActiveView] = useState('cards');
  
  // Chat history state
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<DBChatSession[]>([]);
  const [selectedHistorySession, setSelectedHistorySession] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // Refs for dropdown handling
  const historyDropdownRef = useRef<HTMLDivElement>(null);
  
  // Add session-based tracking for AI chats
  const [sessionChatCount, setSessionChatCount] = useState(0);
  
  // Add paywall modal state
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  
  // Auto-scroll to bottom when new messages arrive or typing animation updates
  useEffect(() => {
    scrollToBottom();
  }, [messages, currentTypingText, isTyping]);

  // Load chat history on component mount
  useEffect(() => {
    const loadChatHistory = async () => {
      if (user?.id) {
        const sessions = await getUserChatSessions(user.id);
        setChatHistory(sessions);
      }
    };
    
    loadChatHistory();
  }, [user?.id]);
  
  // Function to load a chat session
  const loadChatSession = async (sessionId: string) => {
    try {
      const messages = await getChatMessages(sessionId);
      const formattedMessages: Message[] = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));
      
      setMessages(formattedMessages);
      setCurrentSessionId(sessionId);
      setSelectedHistorySession(sessionId);
      setShowHistory(false);
    } catch (error) {
      console.error('Error loading chat session:', error);
    }
  };
  
  // Function to start new chat
  const startNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setSelectedHistorySession(null);
    setShowHistory(false);
  };
  
  // Function to delete a chat session
  const handleDeleteChatSession = async (sessionId: string) => {
    try {
      const success = await deleteChatSession(sessionId);
      if (success) {
        // Remove from local state
        setChatHistory(prev => prev.filter(session => session.id !== sessionId));
        
        // If this was the current session, clear it
        if (currentSessionId === sessionId) {
          setMessages([]);
          setCurrentSessionId(null);
        }
        
        console.log('✅ Chat session deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting chat session:', error);
    }
  };
  
  // Get the selected metric data
  const getSelectedMetricData = () => {
    return metricsData.find(metric => metric.id === selectedMetric) || metricsData[0];
  };
  
  // Handle metric card click
  const handleMetricClick = (metricId: string) => {
    const metric = metricsData.find(m => m.id === metricId);
    if (metric) {
      // Set the message input to the query associated with this metric
      setMessage(metric.query);
      
      // Focus the textarea with a delay to allow animation to start
      setTimeout(() => {
        const textarea = document.querySelector('textarea');
        if (textarea) {
          textarea.focus();
          textarea.style.height = 'auto';
          textarea.style.height = `${Math.max(textarea.scrollHeight, 96)}px`;
          
          // Add a visual indicator that the user should press Enter
          textarea.classList.add('pulse-border');
          setTimeout(() => {
            textarea.classList.remove('pulse-border');
          }, 1500);
        }
      }, 50);
    }
  };

  // Fetch transactions from database when component mounts
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        // For now, using mock data that would normally come from Supabase
        // In a real implementation, this would fetch from the database
        
        const mockTransactions = [
          {
            id: 'tx1',
            name: 'Starbucks',
            amount: 5.75,
            category: 'Coffee Shop',
            date: '2024-06-01',
            timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 }
          },
          {
            id: 'tx2',
            name: 'Whole Foods',
            amount: 54.12,
            category: 'Groceries',
            date: '2024-05-31',
            timestamp: { seconds: Date.now() / 1000 - 86400, nanoseconds: 0 }
          },
          {
            id: 'tx3',
            name: 'Uber',
            amount: 18.40,
            category: 'Transport',
            date: '2024-05-30',
            timestamp: { seconds: Date.now() / 1000 - 86400 * 2, nanoseconds: 0 }
          },
          {
            id: 'tx4',
            name: 'Netflix',
            amount: 15.99,
            category: 'Subscription',
            date: '2024-05-29',
            timestamp: { seconds: Date.now() / 1000 - 86400 * 3, nanoseconds: 0 }
          },
          {
            id: 'tx5',
            name: 'Amazon',
            amount: 32.50,
            category: 'Shopping',
            date: '2024-05-28',
            timestamp: { seconds: Date.now() / 1000 - 86400 * 4, nanoseconds: 0 }
          },
          {
            id: 'tx6',
            name: 'Target',
            amount: 45.22,
            category: 'Shopping', 
            date: '2024-05-27',
            timestamp: { seconds: Date.now() / 1000 - 86400 * 5, nanoseconds: 0 }
          },
          {
            id: 'tx7',
            name: 'HomeGoods',
            amount: 87.99,
            category: 'Home',
            date: '2024-05-26',
            timestamp: { seconds: Date.now() / 1000 - 86400 * 6, nanoseconds: 0 }
          },
          // Adding extra transactions for previous month to show change
          {
            id: 'tx8',
            name: 'Target',
            amount: 67.50,
            category: 'Shopping',
            date: '2024-04-28',
            timestamp: { seconds: Date.now() / 1000 - 86400 * 34, nanoseconds: 0 }
          },
          {
            id: 'tx9',
            name: 'Safeway',
            amount: 82.15,
            category: 'Groceries',
            date: '2024-04-26',
            timestamp: { seconds: Date.now() / 1000 - 86400 * 36, nanoseconds: 0 }
          },
          {
            id: 'tx10',
            name: 'Gas Station',
            amount: 45.75,
            category: 'Transportation',
            date: '2024-04-22',
            timestamp: { seconds: Date.now() / 1000 - 86400 * 40, nanoseconds: 0 }
          },
          {
            id: 'tx11',
            name: 'Restaurant',
            amount: 78.30,
            category: 'Food & Dining',
            date: '2024-04-18',
            timestamp: { seconds: Date.now() / 1000 - 86400 * 44, nanoseconds: 0 }
          },
          {
            id: 'tx12',
            name: 'Amazon',
            amount: 56.99,
            category: 'Shopping',
            date: '2024-04-15',
            timestamp: { seconds: Date.now() / 1000 - 86400 * 47, nanoseconds: 0 }
          }
        ];

        setTransactions(mockTransactions);
        
        // Calculate monthly spending
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();
        const lastMonth = currentMonth - 1 >= 0 ? currentMonth - 1 : 11;
        const lastMonthYear = currentMonth - 1 >= 0 ? currentYear : currentYear - 1;
        
        // Filter transactions for current month
        const currentMonthSpending = mockTransactions
          .filter(tx => {
            const txDate = new Date(tx.date);
            return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
          })
          .reduce((sum, tx) => sum + tx.amount, 0);
          
        // Filter transactions for last month
        const lastMonthSpending = mockTransactions
          .filter(tx => {
            const txDate = new Date(tx.date);
            return txDate.getMonth() === lastMonth && txDate.getFullYear() === lastMonthYear;
          })
          .reduce((sum, tx) => sum + tx.amount, 0);
          
        // Calculate percent change
        const percentChange = lastMonthSpending > 0 
          ? ((currentMonthSpending - lastMonthSpending) / lastMonthSpending) * 100 
          : 0;
          
        setMonthlySpending({
          currentMonth: currentMonthSpending,
          lastMonth: lastMonthSpending,
          percentChange
        });
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };

    fetchTransactions();
  }, []);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const formattedDateTime = now.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });
      setCurrentDateTime(formattedDateTime);
    };

    updateDateTime(); // Initial update
    const interval = setInterval(updateDateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Rotate through suggestion prompts
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSuggestion((prev) => (prev + 1) % suggestionPrompts.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Handle clicks outside of the suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeSuggestionCategory) {
        const suggestionElement = suggestionRefs.current[activeSuggestionCategory];
        if (suggestionElement && !suggestionElement.contains(event.target as Node)) {
          setActiveSuggestionCategory(null);
        }
      }
      
      // Handle chat history dropdown
      if (showHistory && historyDropdownRef.current && !historyDropdownRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeSuggestionCategory, showHistory]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Typing animation functions
  const startTypingAnimation = (text: string) => {
    setFullResponse(text);
    currentResponseRef.current = text;
    setCurrentTypingText('');
    setIsTyping(true);
    
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex < text.length) {
        setCurrentTypingText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        finishTyping();
      }
    }, 20); // 20ms per character
  };

  const finishTyping = () => {
    // Use the ref to ensure we have the correct text
    const responseText = currentResponseRef.current;
    
    // Add the complete AI message
    const aiMessage: Message = {
      role: 'assistant',
      content: responseText
    };
    
    setMessages(prev => [...prev, aiMessage]);
    
    // Save AI message to database
    if (currentSessionId && user?.id) {
      addChatMessage(currentSessionId, user.id, 'assistant', responseText);
    }
    
    // Clear typing state after message is added
    setIsTyping(false);
    setCurrentTypingText('');
    setFullResponse('');
    currentResponseRef.current = '';
    
    // Trigger global refresh after successful response
    setTimeout(() => {
      triggerGlobalRefresh();
    }, 500);
  };

  const handleSend = async () => {
    if (message.trim()) {
      // Check paywall access for AI chat with session count
      console.log('🔍 AI chat attempted');
      
      // Enhanced check including session count
      const canUseAI = () => {
        // Use the paywall hook to get current usage and limits
        const usageData = paywallState;
        // For now, let's use the existing checkFeatureAccess but also track session
        return checkFeatureAccess('ai_chat');
      };
      
      if (!canUseAI()) {
        console.log('❌ AI chat blocked by paywall');
        setShowPaywallModal(true);
        return; // Paywall will be shown by checkFeatureAccess
      }
      
      // Increment session counter immediately
      setSessionChatCount(prev => prev + 1);
      console.log('✅ AI chat allowed, session count:', sessionChatCount + 1);
      
      // Create or get current session
      let sessionId = currentSessionId;
      if (!sessionId && user?.id) {
        // Create a new session with a title based on the first message
        const title = generateChatTitle(message.trim());
        const newSession = await createChatSession(user.id, title);
        if (newSession) {
          sessionId = newSession.id;
          setCurrentSessionId(sessionId);
          
          // Update chat history
          setChatHistory(prev => [newSession, ...prev]);
        }
      }
      
      // Add user message to the chat
      const userMessage: Message = { role: 'user', content: message.trim() };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      
      // Save user message to database
      if (sessionId && user?.id) {
        await addChatMessage(sessionId, user.id, 'user', message.trim());
      }
      
      setMessage('');
      setIsLoading(true);
      // Close any open suggestion dropdowns
      setActiveSuggestionCategory(null);

      try {
        // Determine which category the message most closely relates to
        let primaryCategory = 'Budget'; // Default category
        
        // Use the selected category if available, otherwise determine from message content
        if (selectedCategory) {
          primaryCategory = selectedCategory;
          setSelectedCategory(null); // Reset after use
        } else {
          // Simple keyword matching to determine category
          const messageText = message.toLowerCase();
          if (messageText.includes('mood') || messageText.includes('feel') || messageText.includes('emotion')) {
            primaryCategory = 'Mood';
          } else if (messageText.includes('spend') || messageText.includes('purchase') || messageText.includes('buy')) {
            primaryCategory = 'Spending';
          } else if (messageText.includes('habit') || messageText.includes('routine') || messageText.includes('practice')) {
            primaryCategory = 'Habit';
          } else if (messageText.includes('budget') || messageText.includes('money') || messageText.includes('finance')) {
            primaryCategory = 'Budget';
          }
        }
        
        // Get today's date
        const today = new Date();
        const endDate = today.toISOString().split('T')[0];
        
        // Get date from 30 days ago
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 30);
        const startDateStr = startDate.toISOString().split('T')[0];
        
        // Format transactions for XML
        const transactionXml = transactions.map(tx => {
          // Calculate a mock time proximity to mood in minutes (random between 10-120 minutes)
          const timeProximity = Math.floor(Math.random() * 110) + 10;
          
          return `
    <transaction date="${tx.date}">
      <merchant>${tx.name}</merchant>
      <category>${tx.category}</category>
      <amount>${tx.amount}</amount>
      <time_proximity_to_mood>${timeProximity}</time_proximity_to_mood>
    </transaction>`;
        }).join('\n');
        
        // Create mock mood entries (one for each transaction date with varying scores)
        const moodXml = transactions.map((tx, index) => {
          // Generate a score between 3-8 for diversity
          const score = index % 2 === 0 
            ? Math.floor(Math.random() * 3) + 6 // Higher scores for even indices (6-8)
            : Math.floor(Math.random() * 3) + 3; // Lower scores for odd indices (3-5)
          
          // Map score to label
          let label;
          if (score >= 7) label = 'Happy';
          else if (score >= 5) label = 'Content';
          else if (score >= 3) label = 'Neutral';
          else label = 'Sad';
          
          // Add special note for one entry to trigger emotional analysis
          let note = '';
          if (index === 1) {
            note = "My cat died so I spent a lot of money on comfort foods";
          } else if (index === 3) {
            note = "Got a promotion at work, feeling great about my finances";
          } else if (index === 5) {
            note = "Worried about bills this month, but trying to stay positive";
          }
          
          const time = `${Math.floor(Math.random() * 12) + 8}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;
          
          return `
    <mood_entry date="${tx.date}" time="${time}">
      <mood_score>${score}</mood_score>
      <mood_label>${label}</mood_label>
      <notes>${note}</notes>
    </mood_entry>`;
        }).join('\n');
        
        // Create XML mood analysis request
        const moodAnalysisXml = `
<mood_analysis_request>
  <user_profile>
    <user_id>user-123</user_id>
    <n>Oscar</n>
    <current_mood>${moodData.currentMood}</current_mood>
    <analysis_period>
      <start_date>${startDateStr}</start_date>
      <end_date>${endDate}</end_date>
    </analysis_period>
  </user_profile>
  
  <mood_logs>
${moodXml}
  </mood_logs>
  
  <transaction_logs>
${transactionXml}
  </transaction_logs>
  
  <query>${userMessage.content}</query>
  
  <analysis_parameters>
    <primary_focus>emotional_spending_patterns</primary_focus>
    <category_of_interest>${primaryCategory}</category_of_interest>
    <tone>friendly</tone>
    <pattern_detection>true</pattern_detection>
  </analysis_parameters>
</mood_analysis_request>`;
        
        // Use the regular context data for additional context
        const userContextJson = {
          mood: {
            current: moodData.currentMood,
            trend: moodData.moodTrend,
            score: moodData.moodScore,
            insights: moodData.moodInsights
          },
          spending: {
            monthlyBudget: spendingData.monthlyBudget,
            currentSpent: spendingData.currentSpent,
            categories: spendingData.topCategories,
            transactions: transactions // Add transactions data
          },
          habits: {
            top: habitsData.topHabits,
            insights: habitsData.habitInsights
          }
        };
        
        // Combined prompt with XML structure and user query
        const combinedPrompt = `
User query: ${userMessage.content}

Please analyze this person's mood and spending data to provide actionable financial wellness insights. Keep your response conversational and supportive.

Primary Focus: ${primaryCategory}

${moodAnalysisXml}

Additional Context (JSON):
${JSON.stringify(userContextJson, null, 2)}

IMPORTANT: 
- Keep your response friendly and conversational
- Focus on the connection between mood and spending patterns
- Provide 1-2 specific, actionable suggestions
- Limit response to 3-4 sentences maximum
- Address the user's specific question while considering their emotional state
`;

        // Call AI API
        const response = await generateInsight(combinedPrompt);
        
        if (response) {
          // Start typing animation instead of immediately adding message
          setTimeout(() => {
            startTypingAnimation(response);
          }, 500);
        }
      } catch (error) {
        // Check if this is an upgrade required error
        if (error instanceof Error && (error as any).upgradeRequired) {
          console.log('🚫 Plan restriction - showing paywall modal');
          setShowPaywallModal(true);
          setIsLoading(false);
          return;
        }
        
        console.error('Error generating AI response:', error);
        
        const errorMessage: Message = { 
          role: 'assistant', 
          content: "I'm sorry, I encountered an error processing your request. Please try again." 
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Close any suggestion dropdowns when sending via Enter key
      setActiveSuggestionCategory(null);
      handleSend();
    }
  };

  const toggleSuggestionDropdown = (category: string) => {
    setActiveSuggestionCategory(prev => prev === category ? null : category);
  };

  const handleSuggestionClick = (suggestion: string, category: string) => {
    setMessage(suggestion);
    setSelectedCategory(category);
    setActiveSuggestionCategory(null);
  };

  // Function to trigger a global subscription refresh
  const triggerGlobalRefresh = () => {
    // Dispatch a custom event that other components can listen to
    window.dispatchEvent(new CustomEvent('refreshSubscriptionData'));
  };

  // Listen for plan refresh events after successful upgrade
  useEffect(() => {
    const handlePlanRefresh = async () => {
      console.log('🔄 Plan refresh event received in InsightsSection');
      // Force refresh any plan-related state or caches here
      // This could trigger a re-check of plan permissions
    };

    window.addEventListener('refreshSubscriptionData', handlePlanRefresh);
    
    // Also listen for window focus to refresh plan status
    const handleWindowFocus = () => {
      console.log('🔄 Window focused - checking plan status');
      // This helps catch plan upgrades that happened in another tab
    };
    
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('refreshSubscriptionData', handlePlanRefresh);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 mt-8">
      {/* Header */}
      <div className="mb-8 text-center relative">
        {/* Centered Title */}
        <h1 className="text-3xl font-extrabold text-emerald-700 tracking-tight mb-2">Klyro AI</h1>
        
        {/* Buttons positioned absolutely */}
        <div className="absolute top-0 right-0 flex items-center gap-2">
          {/* Chat History Button */}
          <div className="relative" ref={historyDropdownRef}>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
            </button>

            {/* History Dropdown */}
            {showHistory && (
              <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                {chatHistory.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 text-center">
                    No chat history yet. Start a conversation to see it here.
                  </div>
                ) : (
                  <div className="p-2">
                    {chatHistory.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded group">
                        <button
                          onClick={() => loadChatSession(session.id)}
                          className="flex-1 text-left text-sm text-gray-700 hover:text-gray-900 truncate"
                        >
                          {session.title}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChatSession(session.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                          title="Delete chat session"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H9a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Clear Chat Button */}
          <button
            onClick={() => {
              setMessages([]);
              setCurrentSessionId(null);
              setShowHistory(false);
            }}
            className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H9a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear Chat
          </button>
        </div>
        <p className="text-gray-500 text-base">Ask anything about your mood, spending, or habits. Klyro AI is here to help!</p>
      </div>

      {/* Chat Messages - only shown when there are messages */}
      {messages.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full mb-8 space-y-6 max-h-[65vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent px-1"
        >
          {messages.map((msg, index) => (
            <div key={index} className="group w-full">
              <div className="text-xs uppercase tracking-wider text-gray-400 mb-1.5 font-medium">
                {msg.role === 'user' ? 'You' : 'Klyro'}
              </div>
              <div className={`text-base leading-relaxed whitespace-pre-wrap break-words w-full ${
                msg.role === 'user' 
                  ? 'text-gray-800' 
                  : 'text-gray-600'
              } letter-spacing-tight`}>
                {msg.role === 'user' ? (
                  msg.content
                ) : (
                  <div className="space-y-3">
                    {msg.content.split('\n\n').map((paragraph, i) => (
                      <p key={i} className={`${i === 0 ? 'text-gray-800' : ''}`}>{paragraph}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Typing Animation */}
          {isTyping && (
            <div className="group w-full">
              <div className="text-xs uppercase tracking-wider text-gray-400 mb-1.5 font-medium">
                Klyro
              </div>
              <div className="text-base leading-relaxed whitespace-pre-wrap break-words w-full text-gray-600 letter-spacing-tight">
                <div className="space-y-3">
                  {currentTypingText.split('\n\n').map((paragraph, i) => (
                    <p key={i} className={`${i === 0 ? 'text-gray-800' : ''}`}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {isLoading && !isTyping && (
            <div className="group flex flex-col items-start">
              <motion.div
                className="flex items-center gap-0.5 mt-2 mb-1"
                initial="hidden"
                animate="visible"
                variants={{}}
              >
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="inline-block w-2 h-2 rounded-full bg-emerald-400"
                    variants={{
                      hidden: { scale: 0.7, opacity: 0.4, y: 0 },
                      visible: {
                        scale: [1, 1.18, 1],
                        opacity: [0.5, 0.8, 0.5],
                        y: [0, -4, 0],
                        transition: {
                          repeat: Infinity,
                          duration: 0.9,
                          delay: i * 0.18,
                          repeatType: 'loop',
                          ease: 'easeInOut',
                        },
                      },
                    }}
                  />
                ))}
              </motion.div>
              <div className="text-xs tracking-wide uppercase font-medium mt-2 ml-1 bg-gradient-to-r from-emerald-700 to-emerald-500 bg-clip-text text-transparent">Klyro is thinking...</div>
            </div>
          )}
        </motion.div>
      )}

      {/* Restored original chat input area */}
      <div className="w-full">
        <motion.div 
          initial={false}
          animate={{ y: messages.length > 0 ? 0 : 0, scale: messages.length > 0 ? 1 : 1 }}
          transition={{ duration: 0.4 }}
          className={`relative rounded-xl border ${messages.length > 0 ? 'border-gray-300 shadow-sm' : 'border-gray-200'} transition-all duration-200 hover:border-gray-300 focus-within:border-gray-400 focus-within:shadow-sm bg-white`}
        >
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              // Auto-resize the textarea as content grows
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.max(e.target.scrollHeight, messages.length > 0 ? 24 : 96)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder={messages.length > 0 ? "Message Klyro..." : "Ask anything about your finances, mood patterns, or habits..."}
            className={`w-full py-3 px-4 bg-transparent rounded-xl focus:outline-none text-gray-700 resize-none overflow-hidden word-break-all font-medium ${messages.length > 0 ? 'text-sm' : 'text-base'}`}
            style={{ 
              lineHeight: '1.5',
              paddingBottom: messages.length > 0 ? '2.5rem' : '4.5rem',
              minHeight: messages.length > 0 ? '3rem' : '6rem',
              height: 'auto',
              letterSpacing: '-0.01em',
            }}
          />
          {/* Action buttons at bottom with microphone and send on right */}
          <div className={`absolute ${messages.length > 0 ? 'bottom-1.5' : 'bottom-3'} left-0 right-0 px-3 flex justify-between items-center z-10 bg-white py-1 backdrop-blur-sm`}>
            {/* Category buttons - left aligned */}
            <div className="flex space-x-1">
              {/* Mood Button with Dropdown */}
              <div className="relative" ref={el => { suggestionRefs.current.mood = el }}>
                <button 
                  onClick={() => toggleSuggestionDropdown('mood')}
                  className={`px-4 py-1.5 flex items-center space-x-1.5 rounded-full ${activeSuggestionCategory === 'mood' ? 'bg-green-100 text-green-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'} transition-colors text-sm`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Mood</span>
                </button>
                <AnimatePresence>
                  {activeSuggestionCategory === 'mood' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden"
                    >
                      <div className="py-1">
                        {categorySuggestions.mood.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion, 'Mood')}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {/* Habit Button with Dropdown */}
              <div className="relative" ref={el => { suggestionRefs.current.habit = el }}>
                <button 
                  onClick={() => toggleSuggestionDropdown('habit')}
                  className={`px-4 py-1.5 flex items-center space-x-1.5 rounded-full ${activeSuggestionCategory === 'habit' ? 'bg-green-100 text-green-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'} transition-colors text-sm`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>Habit</span>
                </button>
                <AnimatePresence>
                  {activeSuggestionCategory === 'habit' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden"
                    >
                      <div className="py-1">
                        {categorySuggestions.habit.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion, 'Habit')}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {/* Spending Button with Dropdown */}
              <div className="relative" ref={el => { suggestionRefs.current.spending = el }}>
                <button 
                  onClick={() => toggleSuggestionDropdown('spending')}
                  className={`px-4 py-1.5 flex items-center space-x-1.5 rounded-full ${activeSuggestionCategory === 'spending' ? 'bg-green-100 text-green-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'} transition-colors text-sm`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span>Spending</span>
                </button>
                <AnimatePresence>
                  {activeSuggestionCategory === 'spending' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden"
                    >
                      <div className="py-1">
                        {categorySuggestions.spending.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion, 'Spending')}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            {/* Mic and Send buttons - right aligned */}
            <div className="flex space-x-1.5 bg-gray-100 rounded-full p-0.5">
              {messages.length === 0 && (
                <button 
                  className="p-1.5 rounded-full transition-all duration-200 hover:bg-gray-200 text-gray-500"
                  aria-label="Voice input"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              )}
              <button
                onClick={handleSend}
                disabled={isLoading || message.trim() === ''}
                className={`${messages.length > 0 ? 'p-1' : 'p-1.5'} rounded-full transition-all duration-200 flex items-center justify-center ${
                  isLoading || message.trim() === ''
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-gray-200'
                }`}
                aria-label="Send message"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`${messages.length > 0 ? 'w-4 h-4' : 'w-5 h-5'} text-gray-600`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
        {/* Privacy info */}
        {messages.length > 0 && (
          <div className="mt-2 text-xs text-center text-gray-400">
            Your data is secure and private.
          </div>
        )}
      </div>

      {/* Paywall Modal */}
      <TrialPaywallModal
        isOpen={showPaywallModal}
        onClose={() => setShowPaywallModal(false)}
        feature="AI chat"
      />
    </div>
  );
}