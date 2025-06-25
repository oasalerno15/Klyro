'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DailyBriefCard from './DailyBriefCard';
import PaywallModal from './PaywallModal';
import { usePaywall } from '@/hooks/usePaywall';
import { useAuth } from '@/lib/auth';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// General suggestions for quick actions
const SUGGESTIONS = [
  "What's my spending trend this week?",
  "Show me my budget breakdown",
  "How am I doing with my financial goals?",
  "Suggest ways to save money"
];

// Category-specific suggestions
const categorySuggestions = {
  mood: [
    "How has my mood changed over the past week?",
    "Does my spending affect my mood?",
    "What moods are most common for me?",
    "When am I most productive?",
    "How does exercise impact my mood?"
  ],
  budget: [
    "Am I on track with my monthly budget?",
    "Where can I cut expenses this month?",
    "How does my spending compare to last month?",
    "What are my biggest budget categories?",
    "How much have I saved this month?"
  ],
  habit: [
    "Which habits improve my wellbeing the most?",
    "Am I consistent with my daily habits?",
    "What new habits should I consider adding?",
    "How do my habits affect my finances?",
    "Which days am I most consistent with habits?"
  ],
  spending: [
    "What are my top spending categories?",
    "Where am I spending more than usual?",
    "How does my spending relate to my mood?",
    "Am I making impulsive purchases?",
    "What spending patterns should I be aware of?"
  ]
};

export default function AIAssistant() {
  const { user } = useAuth();
  const { checkFeatureAccess, incrementUsage, paywallState, hidePaywall } = usePaywall();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentTypingText, setCurrentTypingText] = useState('');
  const [fullResponse, setFullResponse] = useState('');
  const [typingSpeed, setTypingSpeed] = useState(20); // ms per character
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const [activeSuggestionCategory, setActiveSuggestionCategory] = useState<string | null>(null);
  const suggestionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({
    mood: null,
    budget: null,
    habit: null,
    spending: null
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get today's date in a formatted string
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Handle clicks outside of the suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeSuggestionCategory) {
        const suggestionElement = suggestionRefs.current[activeSuggestionCategory];
        if (suggestionElement && !suggestionElement.contains(event.target as Node)) {
          setActiveSuggestionCategory(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeSuggestionCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Check paywall access for AI chat BEFORE making the call
    console.log('🔍 AI chat attempted in AIAssistant');
    if (!checkFeatureAccess('ai_chat')) {
      console.log('❌ AI chat blocked by paywall in AIAssistant');
      return; // Paywall will be shown by checkFeatureAccess
    }
    console.log('✅ AI chat allowed in AIAssistant');

    // Add user message
    const newMessage: Message = {
      text: message,
      isUser: true,
      timestamp: new Date()
    };
    
    if (isFirstMessage) {
      setIsFirstMessage(false);
    }
    
    setMessages(prev => [...prev, newMessage]);
    setIsTyping(true); // Show typing indicator

    // Clear the input immediately
    setMessage('');
    
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
      
      // Create context for the AI with structured response format
      const contextPrompt = `
        User query: ${message.trim()}
        
        Context:
        - Current Date: ${today}
        - User's Mood: Productive
        - Today's Spending: $125.50
        - Budget Remaining: $874.50
        - Monthly Budget: $4000
        - Current Spent: $2750
        - Top Spending Categories: Food & Dining: $850, Shopping: $650, Bills & Utilities: $550
        - Top Habits: Morning Exercise (5/7 days), Meditation (4/7 days), Reading (3/7 days)
        
        RESPONSE FORMAT INSTRUCTIONS:
        Structure your response in the following format with clear section headers:
        
        1. Start with "${primaryCategory} Analysis:" section
           - This should be 3-4 full sentences (no bullet points)
           - Analyze the user's ${primaryCategory.toLowerCase()} data in detail
           - Provide specific insights about patterns and trends
           - Use actual numbers and percentages when relevant
        
        2. Then include a "Mood Analysis:" section
           - This should be 3-4 full sentences (no bullet points) 
           - Analyze the connection between mood and the primary category
           - Provide insights on how emotional states impact financial behaviors
           - Mention specific mood-finance correlations from the data
        
        3. End with a "Next Steps:" section
           - This should be 3-4 full sentences (no bullet points)
           - Provide actionable recommendations
           - Suggest small, achievable goals
           - Focus on both financial and emotional well-being
        
        4. Add a brief "Summary:" section at the very end
           - Concisely recap the key points in 1-2 sentences
        
        Example output format:
        ${primaryCategory} Analysis:
        You're pacing toward $2750 this month, staying well under your $4000 budget. Most of your spending is concentrated in essential categories like Food, Bills, and Utilities. So far, your budget discipline is strong, and there's no major deviation from your targets. Maintaining this pattern suggests a high level of financial self-control.
        
        Mood Analysis:
        Your overall mood has remained stable and calm throughout this spending period. Calm moods often indicate that financial stress is minimal, allowing you to focus on broader goals. Data shows that when your spending stays close to your budget, your emotional state tends to stay positive. This connection between budget adherence and emotional balance is a strong foundation for long-term financial wellness.
        
        Next Steps:
        Continue monitoring both your budget and mood together. If possible, set small reward milestones when you stay within budget to maintain positive motivation. Consider reviewing discretionary spending for small optimizations without adding pressure. Keeping both emotional and financial health balanced will help you build wealth sustainably over time.
        
        Summary:
        Your financial habits align well with your emotional wellness goals, creating a positive feedback loop for continued success.
        
        Keep the language clean, natural, and professional. Always first break down what the user asked about, then tie it back to mood, then offer smart next steps.
      `;
      
      // Call the AI API endpoint
      const response = await fetch('/api/ask-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: contextPrompt }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }
      
      const data = await response.json();
      const aiResponseText = data.result || "I'm sorry, I couldn't process your request at this time.";
      
      // Set the full response for the typing animation to use
      setFullResponse(aiResponseText);
      setCurrentTypingText('');
      
      // Begin typing animation after a short delay
      setTimeout(() => {
        startTypingAnimation(aiResponseText);
      }, 800);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage = "I'm sorry, there was a problem processing your request. Please try again.";
      setFullResponse(errorMessage);
      setCurrentTypingText('');
      
      setTimeout(() => {
        startTypingAnimation(errorMessage);
      }, 800);
    }
  };

  const startTypingAnimation = (text: string) => {
    let currentIndex = 0;
    
    // Reset text
    setCurrentTypingText('');
    
    const typingInterval = setInterval(() => {
      if (currentIndex < text.length) {
        setCurrentTypingText(prev => prev + text[currentIndex]);
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        finishTyping();
      }
    }, typingSpeed);
  };

  const finishTyping = () => {
    // Add the completed AI message to the messages array
    setMessages(prev => [...prev, {
      text: fullResponse,
      isUser: false,
      timestamp: new Date()
    }]);
    
    // Trigger global subscription refresh for other components (usage is tracked in API)
    // Add a small delay to ensure database update completes before refresh
    setTimeout(() => {
      console.log('🔄 Triggering global refresh after AI response');
      triggerGlobalRefresh();
    }, 500);
    
    // Reset typing states
    setIsTyping(false);
    setCurrentTypingText('');
    setFullResponse('');
  };

  // Function to trigger a global subscription refresh
  const triggerGlobalRefresh = () => {
    // Dispatch a custom event that other components can listen to
    window.dispatchEvent(new CustomEvent('refreshSubscriptionData'));
  };

  const handleSuggestionClick = (suggestion: string, category: string) => {
    setMessage(suggestion);
    setSelectedCategory(category);
    setActiveSuggestionCategory(null);
  };

  const toggleSuggestionDropdown = (category: string) => {
    setActiveSuggestionCategory(prev => prev === category ? null : category);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Scroll to bottom when messages change or during typing
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, currentTypingText]);

  return (
    <div className="flex flex-col h-screen relative">
      {/* Title - Only show when no messages */}
      {messages.length === 0 && (
        <div className="text-center py-8">
          <h1 className="text-4xl font-semibold text-gray-900 tracking-tight">What's on the agenda today?</h1>
        </div>
      )}

      {/* Daily Brief Card - Only show when no messages */}
      {messages.length === 0 && (
        <DailyBriefCard
          date={today}
          mood="Productive"
          spendingToday={125.50}
          budgetRemaining={874.50}
        />
      )}

      {/* Chat Messages */}
      <div ref={chatContainerRef} className={`flex-1 overflow-y-auto ${messages.length > 0 ? 'pt-4' : 'mt-8'} pb-24`}>
        <div className="max-w-3xl mx-auto py-6 space-y-6">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start max-w-[80%] ${msg.isUser ? 'flex-row-reverse' : 'flex-row'} group`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 ${msg.isUser ? 'ml-3' : 'mr-3'}`}>
                  {msg.isUser ? (
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Message Content */}
                <div
                  className={`flex flex-col ${
                    msg.isUser
                      ? 'items-end'
                      : 'items-start'
                  }`}
                >
                  <div
                    className={`px-4 py-2 ${
                      msg.isUser
                        ? 'text-white bg-green-600 rounded-2xl'
                        : 'text-gray-900 bg-gray-100 rounded-2xl'
                    }`}
                  >
                    {msg.isUser ? (
                      <p className="text-sm whitespace-pre-wrap tracking-tight">{msg.text}</p>
                    ) : (
                      // Format the AI response to highlight section headers
                      msg.text.split('\n\n').map((paragraph, i) => {
                        // Check if the paragraph is a section header
                        if (paragraph.endsWith(':') && 
                            (paragraph.includes('Analysis:') || 
                             paragraph.includes('Next Steps:') || 
                             paragraph.includes('Summary:'))) {
                          return (
                            <div key={i} className="mt-3 first:mt-0">
                              <div className="font-semibold text-gray-800 mb-1 text-sm">{paragraph}</div>
                            </div>
                          );
                        }
                        return <p key={i} className="text-sm whitespace-pre-wrap tracking-tight mb-3 last:mb-0">{paragraph}</p>;
                      })
                    )}
                  </div>
                  <span className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start max-w-[80%] flex-row group">
                {/* Avatar */}
                <div className="flex-shrink-0 mr-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>

                {/* Message Content */}
                <div className="flex flex-col items-start">
                  {currentTypingText ? (
                    <div className="px-4 py-2 text-gray-900 bg-gray-100 rounded-2xl">
                      {currentTypingText.split('\n\n').map((paragraph, i) => {
                        // Check if the paragraph is a section header
                        if (paragraph.endsWith(':') && 
                            (paragraph.includes('Analysis:') || 
                             paragraph.includes('Next Steps:') || 
                             paragraph.includes('Summary:'))) {
                          return (
                            <div key={i} className="mt-3 first:mt-0">
                              <div className="font-semibold text-gray-800 mb-1 text-sm">{paragraph}</div>
                            </div>
                          );
                        }
                        return <p key={i} className="text-sm whitespace-pre-wrap tracking-tight mb-3 last:mb-0">{paragraph}</p>;
                      })}
                    </div>
                  ) : (
                    <div className="px-4 py-3 bg-gray-100 rounded-full flex space-x-1">
                      <motion.div 
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                        className="w-2 h-2 bg-gray-400 rounded-full"
                      />
                      <motion.div 
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                        className="w-2 h-2 bg-gray-400 rounded-full"
                      />
                      <motion.div 
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                        className="w-2 h-2 bg-gray-400 rounded-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area - Conditionally positioned with animation */}
      <AnimatePresence>
        <motion.div 
          layout
          initial={{ y: 0 }}
          animate={{ 
            y: 0,
            transition: { type: "spring", stiffness: 300, damping: 30 }
          }}
          className={`w-full px-4 ${
            messages.length === 0 
              ? "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" 
              : "fixed bottom-0 py-2 bg-gradient-to-t from-white via-white to-transparent w-full"
          }`}
        >
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="relative">
              <motion.div 
                layout
                className={`max-w-3xl mx-auto ${messages.length === 0 ? "bg-white shadow-[0_0_15px_rgba(0,0,0,0.1)] rounded-lg" : ""}`}
              >
                {/* Input Field */}
                <div className="relative">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={messages.length === 0 ? "Ask anything" : "Continue the conversation..."}
                    className={`w-full bg-transparent text-gray-800 placeholder-gray-500 text-lg p-4 focus:outline-none ${
                      messages.length === 0 ? "" : "border-t border-gray-200"
                    }`}
                    autoFocus
                  />
                
                  {/* Category buttons - Show when input has focus */}
                  {messages.length > 0 && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex space-x-2">
                      {/* Mood Button with Dropdown */}
                      <div className="relative" ref={(el) => { suggestionRefs.current.mood = el }}>
                        <button 
                          type="button"
                          onClick={() => toggleSuggestionDropdown('mood')}
                          className={`p-1.5 ${activeSuggestionCategory === 'mood' ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100 text-gray-500'} rounded-full transition-colors`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        
                        {/* Mood Suggestions Dropdown */}
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
                                    type="button"
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
                      
                      {/* Budget Button with Dropdown */}
                      <div className="relative" ref={(el) => { suggestionRefs.current.budget = el }}>
                        <button
                          type="button" 
                          onClick={() => toggleSuggestionDropdown('budget')}
                          className={`p-1.5 ${activeSuggestionCategory === 'budget' ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100 text-gray-500'} rounded-full transition-colors`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        
                        {/* Budget Suggestions Dropdown */}
                        <AnimatePresence>
                          {activeSuggestionCategory === 'budget' && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden"
                            >
                              <div className="py-1">
                                {categorySuggestions.budget.map((suggestion, index) => (
                                  <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleSuggestionClick(suggestion, 'Budget')}
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
                      <div className="relative" ref={(el) => { suggestionRefs.current.habit = el }}>
                        <button
                          type="button" 
                          onClick={() => toggleSuggestionDropdown('habit')}
                          className={`p-1.5 ${activeSuggestionCategory === 'habit' ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100 text-gray-500'} rounded-full transition-colors`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </button>
                        
                        {/* Habit Suggestions Dropdown */}
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
                                    type="button"
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
                      <div className="relative" ref={(el) => { suggestionRefs.current.spending = el }}>
                        <button
                          type="button" 
                          onClick={() => toggleSuggestionDropdown('spending')}
                          className={`p-1.5 ${activeSuggestionCategory === 'spending' ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100 text-gray-500'} rounded-full transition-colors`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </button>
                        
                        {/* Spending Suggestions Dropdown */}
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
                                    type="button"
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
                  )}
                
                  {/* Right Side Icons */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {/* Voice Input Button */}
                    <button 
                      type="button"
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </button>

                    {/* Send Button - Only visible when there's text */}
                    {message.trim() !== '' && (
                      <button 
                        type="submit"
                        className="p-1.5 bg-green-500 hover:bg-green-600 rounded-full transition-colors"
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Action Pills - Only show if no messages */}
                {messages.length === 0 && (
                  <div className="px-4 py-3 flex items-center gap-2 flex-wrap">
                    {/* Plus Sign */}
                    <button 
                      type="button"
                      className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>

                    {SUGGESTIONS.map((suggestion, index) => (
                      <button 
                        key={index}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion, 'Budget')}
                        className="flex items-center gap-2 px-4 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 text-sm transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            </form>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={paywallState.isOpen}
        onClose={hidePaywall}
        feature={paywallState.feature as 'receipt' | 'ai_chat' | 'transaction' | 'upgrade'}
        currentPlan={paywallState.currentPlan}
        onUpgrade={hidePaywall}
      />
    </div>
  );
} 