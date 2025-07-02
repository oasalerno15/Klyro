'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { useSubscription } from '@/hooks/useSubscription';
import PaywallModal from './PaywallModal';
import { createChatSession, addChatMessage, getUserChatSessions, getChatMessages } from '@/utils/chatUtils';

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
  
  // Add session-based tracking and database persistence
  const [sessionChatCount, setSessionChatCount] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Create a ref for smooth scrolling to the bottom
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Initialize chat session and load previous session when component mounts
  useEffect(() => {
    const initializeSession = async () => {
      if (user?.id) {
        setIsLoadingSession(true);
        try {
          console.log('🔄 Initializing AI Chat for user:', user.id);
          
          // Get saved session from localStorage first (for immediate restore)
          const savedSessionId = localStorage.getItem('vireo_current_session_id');
          console.log('💾 Found saved session ID:', savedSessionId);
          
          // Get all user sessions
          const sessions = await getUserChatSessions(user.id);
          setChatHistory(sessions);
          console.log('📚 Found', sessions.length, 'total sessions');
          
          if (savedSessionId && sessions.some(s => s.id === savedSessionId)) {
            // Restore the exact session the user was in (ChatGPT behavior)
            console.log('✅ Restoring exact session from localStorage:', savedSessionId);
            const sessionMessages = await getChatMessages(savedSessionId);
            const formattedMessages: Message[] = sessionMessages.map(msg => ({
              text: msg.content,
              isUser: msg.role === 'user',
              timestamp: new Date(msg.created_at)
            }));
            
            setMessages(formattedMessages);
            setCurrentSessionId(savedSessionId);
            console.log('🎯 RESTORED CONVERSATION with', formattedMessages.length, 'messages');
            
            // Immediate scroll to bottom for restored conversation
            setTimeout(() => scrollToBottom(true), 100);
            
          } else if (sessions.length > 0) {
            // If no valid saved session, load most recent
            const mostRecentSession = sessions[0];
            console.log('📚 Loading most recent session:', mostRecentSession.id);
            
            const sessionMessages = await getChatMessages(mostRecentSession.id);
            const formattedMessages: Message[] = sessionMessages.map(msg => ({
              text: msg.content,
              isUser: msg.role === 'user',
              timestamp: new Date(msg.created_at)
            }));
            
            setMessages(formattedMessages);
            setCurrentSessionId(mostRecentSession.id);
            localStorage.setItem('vireo_current_session_id', mostRecentSession.id);
            console.log('✅ Loaded most recent session with', formattedMessages.length, 'messages');
            
            // Immediate scroll to bottom
            setTimeout(() => scrollToBottom(true), 100);
            
          } else {
            // Create new session if none exist
            console.log('🆕 Creating first chat session');
            const session = await createChatSession(user.id, 'New Chat');
            if (session) {
              setCurrentSessionId(session.id);
              localStorage.setItem('vireo_current_session_id', session.id);
              setMessages([]);
              console.log('✅ Created new session:', session.id);
            }
          }
          
        } catch (error) {
          console.error('❌ Error initializing session:', error);
          // Fallback: create new session
          try {
            const session = await createChatSession(user.id, 'New Chat');
            if (session) {
              setCurrentSessionId(session.id);
              localStorage.setItem('vireo_current_session_id', session.id);
              setMessages([]);
            }
          } catch (fallbackError) {
            console.error('❌ Error creating fallback session:', fallbackError);
          }
        } finally {
          setIsLoadingSession(false);
        }
      }
    };
    
    // Initialize immediately when component mounts
    initializeSession();
  }, [user?.id]);

  // Additional effect to handle user changes while preserving session
  useEffect(() => {
    if (user?.id && currentSessionId) {
      // Verify the current session still belongs to this user
      const verifySesssion = async () => {
        try {
          const sessions = await getUserChatSessions(user.id);
          if (!sessions.some(s => s.id === currentSessionId)) {
            console.log('⚠️ Current session no longer valid, resetting');
            localStorage.removeItem('vireo_current_session_id');
            setCurrentSessionId(null);
            setMessages([]);
          }
        } catch (error) {
          console.error('Error verifying session:', error);
        }
      };
      verifySesssion();
    }
  }, [user?.id, currentSessionId]);

  // Save current session ID to localStorage for persistence across navigations
  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem('vireo_current_session_id', currentSessionId);
    }
  }, [currentSessionId]);

  // Load session ID from localStorage on mount
  useEffect(() => {
    const savedSessionId = localStorage.getItem('vireo_current_session_id');
    if (savedSessionId && user?.id && !currentSessionId) {
      // Try to load the saved session
      loadChatSession(savedSessionId).catch(() => {
        // If loading fails, remove the invalid session ID
        localStorage.removeItem('vireo_current_session_id');
      });
    }
  }, [user?.id]);

  // Monitor scroll position to show/hide scroll button
  useEffect(() => {
    const handleScroll = () => {
      if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setShowScrollButton(!isNearBottom && messages.length > 0);
      }
    };

    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [messages.length]);

  // Smooth scroll to bottom function - ChatGPT-like behavior
  const scrollToBottom = (force = false) => {
    const container = chatContainerRef.current;
    const element = messagesEndRef.current;
    
    if (!container || !element) return;
    
    // Always scroll to bottom smoothly
    const scrollToEnd = () => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    };
    
    // Immediate scroll for force or when at bottom
    if (force || container.scrollHeight - container.scrollTop - container.clientHeight < 150) {
      scrollToEnd();
    }
    
    // Follow-up scroll to ensure we're at the bottom
    setTimeout(scrollToEnd, 100);
  };

  // Auto-scroll when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom(true);
    }
  }, [messages]);

  // Auto-scroll during typing
  useEffect(() => {
    if (isTyping || currentTypingText) {
      scrollToBottom();
    }
  }, [isTyping, currentTypingText]);

  // Scroll to bottom when user clicks the scroll button
  const handleScrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Enhanced check if user can use AI chat
  const canUseAIChat = () => {
    if (!usage || !limits) return false;
    if (limits.aiChats === -1) return true; // Unlimited

    // For free tier, check both database usage AND session count
    const totalUsage = usage.aiChats + sessionChatCount;
    console.log('🔍 AI Chat Check:', {
      dbUsage: usage.aiChats,
      sessionCount: sessionChatCount,
      totalUsage,
      limit: limits.aiChats,
      canUse: totalUsage < limits.aiChats
    });
    
    return totalUsage < limits.aiChats;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Check paywall BEFORE making the request
    if (!canUseAIChat()) {
      console.log('❌ Paywall triggered - showing modal');
      setShowPaywall(true);
      return;
    }

    console.log('✅ AI chat allowed - proceeding with API call');

    // Increment session counter immediately
    setSessionChatCount(prev => prev + 1);

    // Add user message to local state
    const newMessage: Message = {
      text: message,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Clear input immediately
    setMessage('');
    
    // Save user message to database
    if (currentSessionId && user?.id) {
      try {
        await addChatMessage(currentSessionId, user.id, 'user', message);
        console.log('✅ User message saved to database');
      } catch (error) {
        console.error('Error saving user message:', error);
      }
    }
    
    setIsTyping(true);
    
    try {
      // Create context for the AI
      const contextPrompt = `
        User query: ${message.trim()}
        
        IMPORTANT: Keep your response SHORT and conversational - maximum 2-3 sentences total.
        
        Please provide a brief, helpful response about their finances based on their actual spending data. No bullet points, no sections, just a short conversational answer.
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
        // If API fails, decrement session counter
        setSessionChatCount(prev => Math.max(0, prev - 1));
        
        // Check if it's a plan restriction error
        const errorData = await response.json();
        if (response.status === 403 && errorData.upgradeRequired) {
          // Show paywall modal for plan restrictions
          console.log('🚫 Plan restriction - showing paywall modal');
          setShowPaywall(true);
          setSessionChatCount(prev => Math.max(0, prev - 1)); // Decrement since we're showing paywall
          setIsTyping(false);
          return;
        }
        
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const aiResponseText = data.result || "I couldn't process that request. Please try again.";

      console.log('✅ AI response received, usage tracked in session and database');

      // Start typing animation
      setTimeout(() => {
        startTypingAnimation(aiResponseText);
        
        // Refresh subscription after successful response
        setTimeout(() => {
          console.log('🔄 Refreshing usage data after AI response');
          refreshSubscription();
        }, 1000);
      }, 500);
      
    } catch (error) {
      console.error('Error sending message:', error);
      // If there was an error, decrement session counter
      setSessionChatCount(prev => Math.max(0, prev - 1));
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

  const finishTyping = async () => {
    // Use the ref to ensure we have the correct text
    const responseText = currentResponseRef.current;
    
    // Add the complete AI message to local state
    const aiMessage: Message = {
      text: responseText,
      isUser: false,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, aiMessage]);
    
    // Save AI message to database
    if (currentSessionId && user?.id) {
      try {
        await addChatMessage(currentSessionId, user.id, 'assistant', responseText);
        console.log('✅ AI response saved to database');
        
        // Refresh chat history to show the new messages
        const updatedSessions = await getUserChatSessions(user.id);
        setChatHistory(updatedSessions);
      } catch (error) {
        console.error('Error saving AI response:', error);
      }
    }
    
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

  const loadChatSession = async (sessionId: string) => {
    try {
      console.log('📚 Loading chat session:', sessionId);
      const sessionMessages = await getChatMessages(sessionId);
      const formattedMessages: Message[] = sessionMessages.map(msg => ({
        text: msg.content,
        isUser: msg.role === 'user',
        timestamp: new Date(msg.created_at)
      }));
      
      setMessages(formattedMessages);
      setCurrentSessionId(sessionId);
      // Update localStorage with the new session
      localStorage.setItem('vireo_current_session_id', sessionId);
      console.log('✅ Loaded chat session with', formattedMessages.length, 'messages');
      
      // Scroll to bottom after loading messages
      setTimeout(() => scrollToBottom(true), 500);
    } catch (error) {
      console.error('Error loading chat session:', error);
      // If loading fails, remove the invalid session ID from localStorage
      localStorage.removeItem('vireo_current_session_id');
    }
  };

  const startNewChat = async () => {
    if (user?.id) {
      try {
        const session = await createChatSession(user.id, 'New Chat');
        if (session) {
          setCurrentSessionId(session.id);
          setMessages([]);
          setSessionChatCount(0);
          // Update localStorage with the new session
          localStorage.setItem('vireo_current_session_id', session.id);
          console.log('✅ Started new chat session');
          
          // Update chat history
          const updatedSessions = await getUserChatSessions(user.id);
          setChatHistory(updatedSessions);
        }
      } catch (error) {
        console.error('Error creating new chat session:', error);
      }
    }
  };

  return (
    <div className="flex h-screen max-w-6xl mx-auto">
      {/* Chat History Sidebar */}
      <div className={`${showHistory ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-gray-200 bg-gray-50`}>
        {showHistory && (
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Chat History</h3>
                <button
                  onClick={startNewChat}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  New Chat
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {chatHistory.map((session) => (
                <button
                  key={session.id}
                  onClick={() => loadChatSession(session.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    currentSessionId === session.id 
                      ? 'bg-blue-100 border-blue-300' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-gray-900 truncate">
                    {session.title}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(session.updated_at).toLocaleDateString()}
                  </div>
                </button>
              ))}
              
              {chatHistory.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-sm">No chat history yet</div>
                  <div className="text-xs mt-1">Start a conversation to see your history</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header with History Toggle */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {showHistory ? 'Hide History' : 'Show History'}
            </button>
            
            {/* Usage Indicator */}
            {usage && limits && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-sm">
                <span className="text-gray-700">
                  {limits.aiChats === -1 
                    ? `${usage.aiChats + sessionChatCount} chats used` 
                    : `${usage.aiChats + sessionChatCount}/${limits.aiChats} chats used this month`}
                </span>
                {limits.aiChats !== -1 && (
                  <div className="w-8 h-1.5 bg-gray-300 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        (usage.aiChats + sessionChatCount) >= limits.aiChats ? 'bg-red-500' :
                        (usage.aiChats + sessionChatCount) >= limits.aiChats * 0.8 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ 
                        width: `${Math.min(((usage.aiChats + sessionChatCount) / limits.aiChats) * 100, 100)}%` 
                      }}
                    />
                  </div>
                )}
                {sessionChatCount > 0 && (
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                    +{sessionChatCount} this session
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Input Area - Moved higher */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200">
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

        {/* Welcome State */}
        {messages.length === 0 && !isLoadingSession && (
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

        {/* Loading State */}
        {isLoadingSession && (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-600 mb-4" />
            <p className="text-gray-600">Loading your conversation...</p>
          </div>
        )}

        {/* Chat Messages */}
        {messages.length > 0 && !isLoadingSession && (
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 relative">
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
              
              {/* Invisible element for scrolling to bottom */}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Scroll to Bottom Button */}
            <AnimatePresence>
              {showScrollButton && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleScrollToBottom}
                  className="fixed bottom-24 right-8 bg-white hover:bg-gray-50 text-gray-600 rounded-full p-3 shadow-lg border border-gray-200 z-10 transition-colors"
                  aria-label="Scroll to bottom"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        )}
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