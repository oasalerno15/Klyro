'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PaywallModal from './PaywallModal';
import { useAuth } from '@/lib/auth';
import { useSubscription } from '@/hooks/useSubscription';

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

export default function AIAssistant() {
  const { user } = useAuth();
  const { usage, limits, getCurrentTier, refreshSubscription } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentTypingText, setCurrentTypingText] = useState('');
  const [fullResponse, setFullResponse] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const currentResponseRef = useRef<string>('');

  // Simple check if user can use AI chat
  const canUseAIChat = () => {
    if (!usage || !limits) return false;
    if (limits.aiChats === -1) return true; // Unlimited
    return usage.aiChats < limits.aiChats;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Refresh usage data first
    await refreshSubscription();
    
    // Simple paywall check
    if (!canUseAIChat()) {
      setShowPaywall(true);
      return;
    }

    // Add user message
    const newMessage: Message = {
      text: message,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setIsTyping(true);
    setMessage('');
    
    try {
      // Create context for the AI
      const contextPrompt = `
        User query: ${message.trim()}
        
        IMPORTANT: Keep your response SHORT and conversational - maximum 2-3 sentences total.
        
        Context:
        - Current Date: ${new Date().toLocaleDateString()}
        - Today's Spending: $125.50
        - Monthly Budget: $4000
        - Current Spent: $2750
        
        Give a brief, helpful response about their finances. No bullet points, no sections, just a short conversational answer.
      `;

      // Send to AI API
      const response = await fetch('/api/ask-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: contextPrompt,
          systemPrompt: 'You are a financial wellness AI assistant. Keep responses very short - 2-3 sentences maximum. Be conversational and helpful.'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const aiResponseText = data.result || "I couldn't process that request. Please try again.";

      // Start typing animation
      setTimeout(() => {
        startTypingAnimation(aiResponseText);
        
        // Refresh subscription after successful response
        setTimeout(() => {
          refreshSubscription();
        }, 1000);
      }, 500);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      
      // Add error message
      const errorMessage: Message = {
        text: "I'm sorry, I encountered an error. Please try again.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const startTypingAnimation = (text: string) => {
    setFullResponse(text);
    currentResponseRef.current = text;
    setCurrentTypingText('');
    
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
      text: responseText,
      isUser: false,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, aiMessage]);
    
    // Clear typing state after message is added
    setIsTyping(false);
    setCurrentTypingText('');
    setFullResponse('');
    currentResponseRef.current = '';
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, currentTypingText]);

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Klyro AI</h1>
          <p className="text-gray-600 mb-4">Get personalized insights on your financial wellness</p>
          
          {/* Usage Indicator */}
          {usage && limits && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-sm">
              <span className="text-gray-700">
                {limits.aiChats === -1 ? `${usage.aiChats} chats used` : `${usage.aiChats}/${limits.aiChats} chats used this month`}
              </span>
              {limits.aiChats !== -1 && (
                <div className="w-8 h-1.5 bg-gray-300 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      usage.aiChats >= limits.aiChats ? 'bg-red-500' :
                      usage.aiChats >= limits.aiChats * 0.8 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ 
                      width: `${Math.min((usage.aiChats / limits.aiChats) * 100, 100)}%` 
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Welcome State */}
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-semibold text-gray-900 mb-4">What can I help you with today?</h2>
            <p className="text-gray-600">Ask me anything about your finances, spending habits, or financial goals.</p>
          </div>
          
          {/* Quick Suggestions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl mb-8">
            {SUGGESTIONS.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
              >
                <span className="text-gray-700">{suggestion}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      {messages.length > 0 && (
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
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
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className={`flex flex-col ${msg.isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        msg.isUser
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
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
                <div className="flex items-start max-w-[80%] flex-row">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex flex-col items-start">
                    {currentTypingText ? (
                      <div className="px-4 py-3 bg-gray-100 rounded-2xl">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed text-gray-900">{currentTypingText}</p>
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
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 p-6 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask me anything about your finances..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              autoFocus
            />
            <button
              type="submit"
              disabled={!message.trim() || isTyping}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors shadow-sm"
            >
              <svg className="w-4 h-4 text-white translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </form>
      </div>

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature="ai_chat"
        currentPlan={getCurrentTier()}
        onUpgrade={() => setShowPaywall(false)}
      />
    </div>
  );
} 