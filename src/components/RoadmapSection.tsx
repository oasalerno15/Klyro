import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { X, Plus, Map, MoreVertical } from 'lucide-react';
import { generateRoadmapAnalysis } from '../utils/aiUtils';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const FAMILY_OPTIONS = [
  'Single',
  'Married',
  'Married with children',
  'Single parent',
  'Other',
];
const GOALS_OPTIONS = [
  'Saving',
  'Investing',
  'Side hustles',
  'Passive income',
  'Budgeting',
  'Debt reduction',
];
const RISK_OPTIONS = ['Low', 'Medium', 'High'];

type RoadmapForm = {
  age: string;
  family: string;
  income: string;
  goals: string[];
  risk: string;
  goalDescription?: string;
};

type RoadmapResult = {
  summary: string;
  steps: { title: string; desc: string }[];
  scores: Record<string, number>;
  suggestions: string[];
  calendar?: Array<{
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
};

function mockGenerateRoadmap({ age, family, income, goals, risk }: RoadmapForm): RoadmapResult {
  // Return mock steps and scores based on input
  return {
    summary: `FinancePath AI Calendar for a ${age}-year-old${family !== 'Single' ? ' (' + family + ')' : ''} with $${income}/yr income, goals: ${goals.join(', ')}, risk: ${risk}.`,
    steps: [
      { title: 'Weekly Goal Review', desc: 'Set aside time every Sunday to review your financial goals and plan the week ahead.' },
      { title: 'Monthly Budget Check', desc: 'Schedule a monthly review on the first Saturday to track spending and adjust your budget.' },
      { title: 'Daily Expense Tracking', desc: 'Log your daily expenses each evening to stay aware of your spending patterns.' },
      { title: 'Quarterly Investment Review', desc: `Based on your risk tolerance (${risk}), review and rebalance your investment portfolio every quarter.` },
      { title: 'Annual Financial Planning', desc: 'Plan a comprehensive annual review each December to set goals for the following year.' },
      { title: 'Emergency Fund Check', desc: 'Monthly reminder to ensure your emergency fund stays at 3-6 months of expenses.' },
    ],
    scores: {
      Readiness: 8,
      Growth: 9,
      Diversification: 7,
      'Risk Management': risk === 'High' ? 6 : risk === 'Medium' ? 8 : 9,
      Opportunity: 8,
      Stability: 7,
    },
    suggestions: [],
  };
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = React.useState(0);
  React.useEffect(() => {
    let raf: number;
    let start: number | null = null;
    const duration = 900;
    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setDisplay(Math.round(progress * value));
      if (progress < 1) raf = requestAnimationFrame(animate);
      else setDisplay(value);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  // Always show the final value if animation is done
  return <span>{display || value}</span>;
}

function TypewriterHeadline({ text }: { text: string }) {
  const [displayed, setDisplayed] = React.useState('');
  const [showCaret, setShowCaret] = React.useState(true);
  React.useEffect(() => {
    let i = 0;
    let timeout: NodeJS.Timeout;
    function type() {
      if (i <= text.length) {
        setDisplayed(text.slice(0, i));
        i++;
        timeout = setTimeout(type, 38 + Math.random() * 32); // randomize for realism
      }
    }
    type();
    return () => clearTimeout(timeout);
  }, [text]);
  React.useEffect(() => {
    const caretInterval = setInterval(() => setShowCaret(c => !c), 500);
    return () => clearInterval(caretInterval);
  }, []);
  const isTyping = displayed.length < text.length;
  return (
    <span className="whitespace-nowrap font-mono text-gray-100 text-2xl sm:text-3xl font-bold tracking-wide text-center mb-2">
      {displayed}
      {isTyping && (
        <span className="inline-block w-2 align-middle" style={{ color: '#d1d5db' }}>{showCaret ? '|' : ' '}</span>
      )}
    </span>
  );
}

// Helper to determine focus level
function getFocusLevel(goal: string, form: RoadmapForm) {
  if (form.goals.includes(goal)) return 'Main Focus';
  if (goal === 'Investing' && form.risk === 'High') return 'Main Focus';
  return 'Medium Focus';
}

// Helper to determine focus level (1-4 dots)
function getFocusDots(goal: string, form: RoadmapForm) {
  // Example logic:
  // 4 dots: goal is selected and matches risk or description
  // 3 dots: goal is selected
  // 2 dots: goal is related (e.g., "Investing" and "Passive income" are related)
  // 1 dot: not selected
  if (form.goals.includes(goal) && form.risk === 'High') return 4;
  if (form.goals.includes(goal)) return 3;
  if (goal === 'Investing' && form.goals.includes('Passive income')) return 2;
  if (goal === 'Passive income' && form.goals.includes('Investing')) return 2;
  return 1;
}

// Helper for progress bar segments
function FocusSegments({ value }: { value: number }) {
  return (
    <div className="flex gap-1" aria-label={`${value} of 4 steps completed`}>
      {[1, 2, 3, 4].map(i => (
        <div
          key={i}
          className={`w-4 h-2.5 rounded-full transition-all duration-300 ${
            i <= value
              ? 'bg-gradient-to-r from-gray-600 to-gray-800 shadow-sm'
              : 'bg-gray-700'
          }`}
        />
      ))}
    </div>
  );
}

function BreathingOrb() {
  // Dramatic animation keyframes for inhale (7s), hold (4s), exhale (6s)
  const scaleKeyframes = [0.6, 1.3, 1.3, 0.6, 0.6]; // start small, expand big, hold, contract, rest
  const opacityKeyframes = [0.92, 1, 1, 0.92, 0.92];
  const times = [0, 7/17, 11/17, 17/17, 1]; // 7s, 4s, 6s
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-10 px-4 my-8 mt-8 select-none"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.9, ease: 'easeOut' }}
    >
      <motion.div
        className="relative flex items-center justify-center"
        initial={false}
        animate={{}}
        whileHover="paused"
      >
        {/* Main orb with deep green gradient and breath motion */}
        <motion.div
          className="rounded-full shadow-2xl overflow-hidden"
          style={{ width: 160, height: 160, background: 'radial-gradient(circle at 60% 40%, #14532d 60%, #0b2e1c 100%)' }}
          animate={{
            scale: scaleKeyframes,
            opacity: opacityKeyframes,
          }}
          transition={{ duration: 17, times, repeat: Infinity, ease: 'easeInOut' }}
          variants={{
            paused: { transition: { repeat: 0 } }
          }}
        >
          {/* Moss/noise texture overlay (SVG pattern or PNG, fallback to soft noise) */}
          <div
            className="absolute inset-0 w-full h-full rounded-full pointer-events-none"
            style={{
              background: 'url("https://www.transparenttextures.com/patterns/green-dust-and-scratches.png"), linear-gradient(transparent, transparent)',
              opacity: 0.18,
              mixBlendMode: 'multiply',
            }}
          />
        </motion.div>
      </motion.div>
      {/* Text lines with fade-in synced to orb's breathing rhythm */}
      <motion.div
        className="mt-12 text-3xl sm:text-4xl text-white font-mono text-center max-w-xl tracking-tight font-bold"
        animate={{ opacity: opacityKeyframes }}
        transition={{ duration: 17, times, repeat: Infinity, ease: 'easeInOut' }}
      >
        Your first step starts with your breath.
      </motion.div>
      <motion.div
        className="mt-4 text-xl sm:text-2xl text-[#22c55e] font-mono text-center max-w-xl tracking-tight italic opacity-80"
        animate={{ opacity: opacityKeyframes }}
        transition={{ duration: 17, times, repeat: Infinity, ease: 'easeInOut' }}
      >
        Let your mind catch up to your goals.
      </motion.div>
    </motion.div>
  );
}

interface RoadmapSectionProps {
  user?: any; // User object passed from parent
}

export default function RoadmapSection({ user: passedUser }: RoadmapSectionProps = {}) {
  const [step, setStep] = useState<number | null>(null); // null: initial, 0: form, 1: progress, 2: result
  const [form, setForm] = useState<RoadmapForm>({
    age: '',
    family: FAMILY_OPTIONS[0],
    income: '',
    goals: [],
    risk: RISK_OPTIONS[1],
    goalDescription: '',
  });
  const [result, setResult] = useState<RoadmapResult | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [showMenu, setShowMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showVisualRoadmap, setShowVisualRoadmap] = useState(false);
  const [stepStatuses, setStepStatuses] = useState<string[]>([]);
  
  // Calendar interaction states
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventStatuses, setEventStatuses] = useState<{[key: string]: string}>({});
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [customEvents, setCustomEvents] = useState<{[key: string]: any[]}>({});
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<number>(1);

  // User state
  const [user, setUser] = useState<any>(passedUser || null);
  const [isLoading, setIsLoading] = useState(true);

  // Get current date info
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth(); // 0-11
  const currentYear = currentDate.getFullYear();
  const currentDay = currentDate.getDate();
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Get first day of current month and days in month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  // Save calendar data function
  const saveCalendarData = async () => {
    if (!user) {
      console.log('⚠️ No user, skipping save');
      return;
    }
    
    try {
      console.log('💾 Saving calendar data...', {
        user_id: user.id,
        hasForm: !!form,
        hasResult: !!result,
        eventStatusesCount: Object.keys(eventStatuses).length,
        customEventsCount: Object.keys(customEvents).length
      });
      
      // Get current session for auth
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/calendar/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token && {
            'Authorization': `Bearer ${session.access_token}`
          })
        },
        body: JSON.stringify({
          user_id: user.id,
          form_data: form,
          result_data: result,
          event_statuses: eventStatuses,
          custom_events: customEvents
        })
      });
      
      if (!response.ok) {
        throw new Error(`Save failed: ${response.status}`);
      }
      
      console.log('✅ Calendar data saved successfully');
    } catch (error) {
      console.error('❌ Failed to save calendar data:', error);
    }
  };

  // Load calendar data function
  const loadCalendarData = async (userId: string) => {
    try {
      console.log('📥 Fetching calendar data from API...');
      
      // Get current session for auth
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`/api/calendar/load`, {
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token && {
            'Authorization': `Bearer ${session.access_token}`
          })
        }
      });
      const data = await response.json();
      console.log('📥 API response:', data);
      
      if (data.success && data.data) {
        const savedData = data.data;
        console.log('✅ Found saved data:', savedData);
        
        // Restore form data
        if (savedData.form_data) {
          console.log('📝 Restoring form data:', savedData.form_data);
          setForm(savedData.form_data);
        }
        
        // Restore event statuses
        if (savedData.event_statuses) {
          console.log('📊 Restoring event statuses:', savedData.event_statuses);
          setEventStatuses(savedData.event_statuses);
        }
        
        // Restore custom events  
        if (savedData.custom_events) {
          console.log('📅 Restoring custom events:', savedData.custom_events);
          setCustomEvents(savedData.custom_events);
        }
        
        // Restore calendar result
        if (savedData.result_data) {
          console.log('📅 Restoring calendar result and showing visual roadmap');
          console.log('📅 Calendar data:', savedData.result_data);
          setResult(savedData.result_data);
          setShowVisualRoadmap(true);
          console.log('📅 Set showVisualRoadmap to true');
        }
      } else {
        console.log('ℹ️ No saved data found, starting fresh');
      }
    } catch (error) {
      console.error('❌ Error loading calendar data:', error);
    }
  };

  // Load user and calendar data on mount
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        console.log('🔄 Initializing RoadmapSection...', { passedUser: !!passedUser });
        
        if (passedUser) {
          console.log('👤 User provided by parent:', passedUser.id);
          setUser(passedUser);
          console.log('📅 Loading calendar data for user:', passedUser.id);
          await loadCalendarData(passedUser.id);
        } else {
          console.log('⚠️ No user provided by parent component');
        }
      } catch (error) {
        console.error('❌ Error initializing component:', error);
      } finally {
        console.log('⏰ Setting loading to false');
        setIsLoading(false);
      }
    };
    
    initializeComponent();
  }, [passedUser]);

  // Update user state when passedUser changes
  useEffect(() => {
    if (passedUser && passedUser.id !== user?.id) {
      console.log('👤 User changed, updating:', passedUser.id);
      setUser(passedUser);
    }
  }, [passedUser, user?.id]);

  // Save data automatically when important state changes
  useEffect(() => {
    if (user && (result || Object.keys(eventStatuses).length > 0 || Object.keys(customEvents).length > 0)) {
      console.log('💾 Auto-saving calendar data...', {
        hasResult: !!result,
        hasCalendar: !!(result?.calendar),
        eventStatusesCount: Object.keys(eventStatuses).length,
        customEventsCount: Object.keys(customEvents).length,
        showVisualRoadmap: showVisualRoadmap
      });
      saveCalendarData();
    }
  }, [user, result, eventStatuses, customEvents, showVisualRoadmap]);

  // Scroll indicator logic
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;
      const el = scrollRef.current;
      const max = el.scrollHeight - el.clientHeight;
      setScrollProgress(max > 0 ? el.scrollTop / max : 0);
    };
    const node = scrollRef.current;
    if (node) node.addEventListener('scroll', handleScroll);
    return () => { if (node) node.removeEventListener('scroll', handleScroll); };
  }, [step]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };
  const handleGoals = (goal: string) => {
    setForm((f) => ({ ...f, goals: f.goals.includes(goal) ? f.goals.filter(g => g !== goal) : [...f.goals, goal] }));
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setStep(1);
    setProgress(0);
    
    let aiReady = false;
    const animateProgress = () => {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (aiReady) return 100;
          return Math.min(prev + Math.random() * 15, 85);
        });
      }, 400);
    };
    animateProgress();
    
    try {
      // Use the new dedicated calendar API with properly mapped field names
      const response = await fetch('/api/generate-calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          age: form.age,
          familyStatus: form.family,  // Map family -> familyStatus
          income: form.income,
          goals: form.goals,
          riskTolerance: form.risk,  // Map risk -> riskTolerance
          mentalStatus: form.goalDescription || ''
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate calendar');
      }

      aiReady = true;
      setProgress(100);
      
      setTimeout(() => {
        setResult(data.calendar); // The API returns { calendar: {...} }
        setStep(2);
        console.log('🎉 AI calendar generation complete, data:', data.calendar);
      }, 400);
      
    } catch (err: any) {
      aiReady = true;
      setProgress(100);
      setTimeout(() => {
        setError(err.message || 'Failed to generate calendar. Please try again.');
        setStep(2);
      }, 400);
    }
  };
  const closeModal = () => {
    setStep(null);
    setResult(null);
    setProgress(0);
    setForm({
      age: '',
      family: FAMILY_OPTIONS[0],
      income: '',
      goals: [],
      risk: RISK_OPTIONS[1],
      goalDescription: '',
    });
  };

  // When Approve Calendar is clicked, close the modal and show visual calendar in main area
  const handleApprovePlan = () => {
    if (result?.steps) {
      setStepStatuses(result.steps.map((s: any) => s.status || 'locked'));
      setShowVisualRoadmap(true);
      setStep(null); // Close the modal
      console.log('✅ Calendar approved, saving data and showing visual roadmap');
      
      // Explicitly save the data after approval
      if (user) {
        saveCalendarData();
      }
    }
  };

  // Handler to mark a step as complete and unlock the next one
  const handleCompleteStep = (idx: number) => {
    setStepStatuses(prev => {
      const next = [...prev];
      next[idx] = 'complete';
      // Unlock the next step if it exists and is locked
      if (idx + 1 < next.length && next[idx + 1] === 'locked') {
        next[idx + 1] = 'unlocked';
      }
      return next;
    });
  };

  // Calendar event handlers
  const handleEventClick = (event: any, date: number) => {
    setSelectedEvent(event);
    setSelectedDate(date);
    setShowEventModal(true);
  };

  const handleDateClick = (date: number) => {
    if (date >= 1 && date <= 31) { // Only for current month dates
      setSelectedDate(date);
      setShowAddEventModal(true);
    }
  };

  const handleMarkEventComplete = (eventKey: string) => {
    setEventStatuses(prev => ({
      ...prev,
      [eventKey]: 'completed'
    }));
    setShowEventModal(false);
  };

  const handleRescheduleEvent = () => {
    setShowEventModal(false);
    setShowRescheduleModal(true);
  };

  const handleConfirmReschedule = () => {
    if (selectedEvent && selectedDate && rescheduleDate !== selectedDate) {
      // Remove event from original date if it's a custom event
      if (selectedEvent.key?.startsWith('custom-')) {
        setCustomEvents(prev => ({
          ...prev,
          [selectedDate]: (prev[selectedDate] || []).filter(e => e.key !== selectedEvent.key)
        }));
        
        // Add to new date
        const rescheduledEvent = { ...selectedEvent, title: `${selectedEvent.title} (Rescheduled)` };
        setCustomEvents(prev => ({
          ...prev,
          [rescheduleDate]: [...(prev[rescheduleDate] || []), rescheduledEvent]
        }));
      } else {
        // For AI-generated events, add a rescheduled version to custom events
        const rescheduledEvent = {
          title: `${selectedEvent.title} (Rescheduled)`,
          color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
          key: `rescheduled-${Date.now()}`,
          description: selectedEvent.description,
          status: 'pending'
        };
        
        setCustomEvents(prev => ({
          ...prev,
          [rescheduleDate]: [...(prev[rescheduleDate] || []), rescheduledEvent]
        }));
        
        // Mark original as rescheduled
        setEventStatuses(prev => ({
          ...prev,
          [selectedEvent.key]: 'rescheduled'
        }));
      }

      setShowSuccessMessage(`Event rescheduled to ${monthNames[currentMonth]} ${rescheduleDate}`);
      setTimeout(() => setShowSuccessMessage(null), 3000);
    }
    
    setShowRescheduleModal(false);
    setSelectedEvent(null);
  };

  const handleAddNewEvent = () => {
    if (newEventTitle.trim() && selectedDate) {
      // Create new event object
      const newEvent = {
        title: newEventTitle.trim(),
        color: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
        key: `custom-${Date.now()}`,
        description: 'Custom event added by user',
        status: 'pending'
      };

      // Add to custom events state
      setCustomEvents(prev => ({
        ...prev,
        [selectedDate]: [...(prev[selectedDate] || []), newEvent]
      }));

      // Show success message
      setShowSuccessMessage(`Added "${newEvent.title}" to ${monthNames[currentMonth]} ${selectedDate}`);
      setTimeout(() => setShowSuccessMessage(null), 3000);

      // Clear form and close modal
      setNewEventTitle('');
      setShowAddEventModal(false);
    }
  };

  return (
    <div className="w-full min-h-[60vh] flex items-center justify-center relative">
      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-600 mb-4" />
          <p className="text-gray-400">Loading financial calendar...</p>
        </div>
      )}

      {/* Show visual calendar in main area after approval or if loaded from saved data */}
      {!isLoading && showVisualRoadmap && result?.calendar && (
        <div className="w-full min-h-[60vh] flex flex-col items-center justify-center relative py-12 select-none">
          {/* Calendar Header */}
          <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Your AI-Generated Financial Calendar - {monthNames[currentMonth]} {currentYear}</h2>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded border">← Prev</button>
                <button className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded border">Next →</button>
                <button
                  onClick={() => {
                    setShowVisualRoadmap(false);
                    setStep(null);
                    setForm({
                      age: '',
                      family: '',
                      income: '',
                      goals: [],
                      risk: '',
                      goalDescription: ''
                    });
                    setResult(null);
                    setEventStatuses({});
                    setCustomEvents({});
                  }}
                  className="ml-3 bg-white text-gray-700 border border-gray-200 px-3 py-1 text-sm rounded font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New Calendar
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Days of week header */}
              <div className="grid grid-cols-7 bg-gray-50 border-b">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 border-r last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar dates */}
              <div className="grid grid-cols-7">
                {Array.from({ length: 42 }, (_, i) => {
                  const date = i - firstDayOfMonth + 1;
                  const isCurrentMonth = date >= 1 && date <= daysInMonth;
                  const isToday = date === currentDay && isCurrentMonth;
                  const displayDate = isCurrentMonth ? date : 
                    (date < 1 ? daysInPrevMonth + date : date - daysInMonth);
                  
                  // Get AI-generated events for this date (first 7 days of current month)
                  const events = [];
                  if (date >= 1 && date <= 7 && result.calendar && isCurrentMonth) {
                    const dayData = result.calendar.find((day: any) => day.day === date);
                    if (dayData && dayData.tasks) {
                      dayData.tasks.forEach((task: any) => {
                        const status = eventStatuses[task.id] || (task.completed ? 'completed' : 'pending');
                        if (status !== 'rescheduled') {
                          events.push({
                            title: task.title,
                            color: task.type === 'action' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                   task.type === 'education' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                   task.type === 'review' ? 'bg-green-50 text-green-700 border border-green-200' :
                                   'bg-gray-50 text-gray-700 border border-gray-200',
                            key: task.id,
                            description: task.description,
                            type: task.type,
                            estimatedTime: task.estimated_time,
                            status: status,
                            isAIGenerated: true
                          });
                        }
                      });
                    }
                  }

                  // Add custom events for this date
                  if (customEvents[date] && isCurrentMonth) {
                    events.push(...customEvents[date].map(event => ({
                      ...event,
                      status: eventStatuses[event.key] || event.status
                    })));
                  }

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.01, duration: 0.2 }}
                      className={`min-h-[100px] p-2 border-r border-b last:border-r-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                        isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                      } ${isToday ? 'bg-blue-50 border-blue-200' : ''}`}
                      onClick={() => isCurrentMonth && handleDateClick(date)}
                    >
                      <div className={`text-sm font-medium mb-2 flex items-center justify-between ${
                        isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                      } ${isToday ? 'text-blue-600 font-bold' : ''}`}>
                        <span>{displayDate}</span>
                        {date >= 1 && date <= 7 && isCurrentMonth && events.length > 0 && (
                          <span className="text-xs bg-green-100 text-green-700 px-1 rounded font-semibold">AI</span>
                        )}
                      </div>
                      
                      {/* Events for this date */}
                      <div className="space-y-1">
                        {events.slice(0, 2).map((event, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: (i * 0.01) + (idx * 0.1) + 0.3 }}
                            className={`text-xs px-2 py-1 rounded cursor-pointer transition-all font-medium truncate ${event.color} ${
                              event.status === 'completed' ? 'opacity-60 line-through' : 'hover:shadow-sm'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEventClick(event, date);
                            }}
                            title={`${event.description} ${event.estimatedTime ? `(${event.estimatedTime})` : ''}`}
                          >
                            {event.title}
                            {event.status === 'completed' && (
                              <span className="ml-1 text-green-600">✓</span>
                            )}
                          </motion.div>
                        ))}
                        {events.length > 2 && (
                          <div className="text-xs text-gray-500 px-2">
                            +{events.length - 2} more
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Calendar Legend */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="flex flex-wrap gap-4 mt-4 text-sm"
            >
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
                <span className="text-gray-600">Action Tasks</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-100 border border-purple-200 rounded"></div>
                <span className="text-gray-600">Learning Tasks</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                <span className="text-gray-600">Review Tasks</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-100 border border-indigo-200 rounded"></div>
                <span className="text-gray-600">Custom Events</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-gray-600">AI Generated</span>
              </div>
              {Object.keys(customEvents).length > 0 && (
                <button
                  onClick={() => setCustomEvents({})}
                  className="ml-auto px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded border"
                >
                  Clear Custom Events
                </button>
              )}
            </motion.div>

            {/* Week Summary */}
            {result.calendar && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
                className="mt-6 bg-white rounded-xl shadow-lg border border-gray-200 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week's AI-Generated Tasks</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {result.calendar.slice(0, 7).map((day: any) => (
                    <div key={day.day} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="font-medium text-gray-900 mb-3 flex items-center justify-between">
                        <span>{monthNames[currentMonth]} {day.day}</span>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Day {day.day}</span>
                      </div>
                      <div className="space-y-3">
                        {day.tasks?.map((task: any, idx: number) => (
                          <div key={idx} className="text-sm border-l-2 border-blue-200 pl-3">
                            <div className="font-medium text-gray-800 mb-1">{task.title}</div>
                            <div className="text-gray-600 text-xs mb-1 font-mono">{task.estimated_time}</div>
                            <div className="text-gray-600 text-xs leading-relaxed">{task.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}
      {/* Initial State: Start Card (hide if visual roadmap is shown or loading) */}
      {!isLoading && !showVisualRoadmap && step === null && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="flex flex-col items-center justify-center w-full min-h-[60vh] px-4 bg-white"
        >
          {/* Elegant Fully Connected Web Animation */}
          <motion.svg
            width="200" height="120" viewBox="0 0 200 120" fill="none"
            className="mb-7"
          >
            {/* Define 8 points */}
            {(() => {
              const points = [
                [30, 100], [60, 30], [100, 60], [150, 25],
                [180, 80], [140, 110], [90, 100], [50, 70]
              ];
              // Generate all unique pairs for a complete web
              const lines = [];
              let delay = 0.1;
              for (let i = 0; i < points.length; i++) {
                for (let j = i + 1; j < points.length; j++) {
                  lines.push(
                    <motion.line
                      key={`line-${i}-${j}`}
                      x1={points[i][0]} y1={points[i][1]}
                      x2={points[j][0]} y2={points[j][1]}
                      stroke="#14532d"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: delay }}
                    />
                  );
                  delay += 0.04;
                }
              }
              return lines;
            })()}
            {/* Dots: gently pulse */}
            <motion.circle cx="30" cy="100" r="3.2" fill="#14532d"
              animate={{ scale: [1, 1.18, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0 }} />
            <motion.circle cx="60" cy="30" r="3.2" fill="#14532d"
              animate={{ scale: [1, 1.18, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }} />
            <motion.circle cx="100" cy="60" r="3.2" fill="#14532d"
              animate={{ scale: [1, 1.18, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }} />
            <motion.circle cx="150" cy="25" r="3.2" fill="#14532d"
              animate={{ scale: [1, 1.18, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }} />
            <motion.circle cx="180" cy="80" r="3.2" fill="#14532d"
              animate={{ scale: [1, 1.18, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }} />
            <motion.circle cx="140" cy="110" r="3.2" fill="#14532d"
              animate={{ scale: [1, 1.18, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 1.0 }} />
            <motion.circle cx="90" cy="100" r="3.2" fill="#14532d"
              animate={{ scale: [1, 1.18, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }} />
            <motion.circle cx="50" cy="70" r="3.2" fill="#14532d"
              animate={{ scale: [1, 1.18, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }} />
          </motion.svg>
          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 text-black text-center" style={{ letterSpacing: '-0.01em' }}>
            Let's build your financial calendar.
          </h2>
          {/* Description */}
          <p className="text-base sm:text-lg text-gray-700 mt-1 mb-8 text-center max-w-xl font-medium">
            Your personalized calendar for tracking goals, habits, and financial milestones.
          </p>
          
          {/* Debug section */}
          {user && (
            <div className="mb-4 text-sm text-gray-600 text-center">
              Logged in as: {user.email} (ID: {user.id?.slice(0, 8)}...)
            </div>
          )}
          
          {/* Start Button and Debug Button */}
          <div className="flex gap-4">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setStep(0)}
              className="bg-[#14532d] hover:bg-[#166534] text-white rounded-full px-8 py-3 shadow-md transition-all font-semibold text-base focus:outline-none focus:ring-2 focus:ring-[#14532d]"
              aria-label="Start Calendar"
              style={{ boxShadow: '0 2px 16px 0 #14532d11' }}
            >
              Start Calendar
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Modal Overlay for Form/Progress/Result (hide if visual roadmap is shown or loading) */}
      {!isLoading && !showVisualRoadmap && step !== null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          {/* Glassy blurred overlay */}
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-[8px]" onClick={closeModal} />
          <div ref={scrollRef} className="relative z-50 w-full max-w-2xl mx-auto overflow-y-auto max-h-[90vh] scroll-smooth">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  onSubmit={handleSubmit}
                  className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-lg rounded-2xl shadow-2xl px-0 py-0 border border-white/10 text-gray-100 overflow-hidden overflow-y-auto max-h-[90vh]"
                  style={{ minWidth: 360 }}
                >
                  <div className="flex flex-col items-center pt-8 pb-4 px-8">
                    <div className="bg-gray-700/20 rounded-full p-4 mb-3 shadow-lg flex items-center justify-center">
                      <Map className="w-10 h-10 text-gray-400 drop-shadow-[0_0_8px_rgba(156,163,175,0.4)]" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight mb-1">Calendar Details</h2>
                    <p className="text-gray-400 text-sm text-center mb-2">Tell us about your financial journey and goals. Klyro will generate a personalized calendar for you.</p>
                  </div>
                  <div className="px-8 pb-8">
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium mb-1 text-gray-300">Age</label>
                          <input
                            name="age"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            min="10"
                            max="100"
                            required
                            value={form.age}
                            onChange={handleInput}
                            className="w-full rounded-lg bg-gray-900/80 border border-gray-700 px-3 py-2 text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1 text-gray-300">Family Situation</label>
                          <select name="family" value={form.family} onChange={handleInput} className="w-full rounded-lg bg-gray-900/80 border border-gray-700 px-3 py-2 text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none">
                            {FAMILY_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1 text-gray-300">Current Income ($/yr)</label>
                          <input
                            name="income"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            min="0"
                            required
                            value={form.income}
                            onChange={handleInput}
                            className="w-full rounded-lg bg-gray-900/80 border border-gray-700 px-3 py-2 text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium mb-1 text-gray-300">Risk Tolerance</label>
                          <select name="risk" value={form.risk} onChange={handleInput} className="w-full rounded-lg bg-gray-900/80 border border-gray-700 px-3 py-2 text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none">
                            {RISK_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1 text-gray-300">Goals</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {GOALS_OPTIONS.map(goal => (
                            <button type="button" key={goal} onClick={() => handleGoals(goal)} className={`px-3 py-1 rounded-full border text-xs font-medium transition-all ${form.goals.includes(goal) ? 'bg-gray-900 border-gray-900 text-white shadow' : 'bg-gray-900/80 border-gray-700 text-gray-300 hover:bg-gray-800'}`}>{goal}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label htmlFor="goalDescription" className="block text-xs font-medium mb-1 text-gray-300">
                          Describe your overall mental status and what you want to achieve
                        </label>
                        <textarea
                          id="goalDescription"
                          name="goalDescription"
                          value={form.goalDescription}
                          onChange={handleInput}
                          rows={3}
                          required
                          className="w-full rounded-lg bg-gray-900/80 border border-gray-700 px-3 py-2 text-gray-100 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all outline-none resize-none placeholder-gray-500"
                          placeholder="E.g. Feeling stressed, want to build confidence and save for a house"
                        />
                      </div>
                    </div>
                    <button type="submit" className="mt-8 w-full py-3 rounded-xl bg-gray-900 hover:bg-gray-800 font-semibold text-lg transition-all shadow-lg">Generate My Calendar</button>
                  </div>
                </motion.form>
              )}
              {step === 1 && (
                <motion.div
                  key="progress"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  className="bg-[#18181b] rounded-2xl border border-gray-800 flex flex-col items-center text-gray-100 w-full max-w-xl mx-auto overflow-hidden overflow-y-auto max-h-[90vh]"
                  style={{ minWidth: 360 }}
                >
                  {/* Enhanced Typewriter Headline */}
                  <div className="w-full flex flex-col items-center mb-6 mt-10">
                    <TypewriterHeadline text="Generating your calendar" />
                  </div>
                  {/* Flat Progress Bar with Percentage */}
                  <div className="w-full px-8 mb-6">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400 font-mono">Progress</span>
                      <span className="text-xs text-gray-300 font-mono">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden relative">
                      <motion.div
                        className="h-2 bg-gray-600 rounded-full"
                        style={{ width: `${progress}%` }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                  {/* Animated Checklist Steps (vertical) */}
                  <ul className="w-full flex flex-col items-start gap-y-4 px-8 pb-10">
                    {['Analyzing profile', 'Planning calendar structure', 'Generating schedule', 'Adding milestones', 'Finalizing calendar'].map((item, idx, arr) => {
                      const stepPercent = 100 / arr.length;
                      const isDone = progress >= (stepPercent * (idx + 1));
                      const isCurrent = progress >= (stepPercent * idx) && progress < (stepPercent * (idx + 1));
                      return (
                        <motion.li
                          key={item}
                          className={`flex flex-row items-center gap-3 text-base font-mono transition-colors duration-300 ${isDone ? 'text-gray-300' : isCurrent ? 'text-white' : 'text-gray-500'}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.4, delay: 0.2 + idx * 0.13 }}
                        >
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                            isDone
                              ? 'border-gray-600 bg-gray-600 text-white'
                              : isCurrent
                                ? 'border-gray-400 bg-gray-900 text-gray-400'
                                : 'border-gray-700 bg-gray-800 text-gray-500'
                          }`}>
                            {isDone ? (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            ) : (
                              <div className="animate-spin w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full" />
                            )}
                          </span>
                          <span className="text-xs text-left max-w-[120px] leading-tight">{item}</span>
                        </motion.li>
                      );
                    })}
                  </ul>
                </motion.div>
              )}
              {step === 2 && (
                <>
                  {error ? (
                    <div className="p-8 text-red-400 text-lg font-semibold text-center">
                      {error}
                    </div>
                  ) : !result ? (
                    <div className="flex flex-col items-center justify-center min-h-[300px]">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-600 mb-4" />
                      <div className="text-gray-300 text-lg font-semibold">Loading calendar...</div>
                    </div>
                  ) : (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -30 }}
                      className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-lg rounded-2xl shadow-2xl p-0 border border-white/10 text-gray-100 w-full max-w-2xl mx-auto my-12"
                      style={{ maxHeight: '90vh' }}
                    >
                      <div className="overflow-y-auto max-h-[90vh] scroll-smooth rounded-2xl scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 scrollbar-thumb-rounded transition-all duration-300 hover:scrollbar-thumb-gray-400 focus:scrollbar-thumb-gray-400">
                        {/* Three Dots Menu */}
                        <div className="absolute top-4 right-4 z-20">
                          <div className="relative group">
                            <button className="p-2 rounded-full hover:bg-gray-800/70 transition-colors" aria-label="More options" onClick={() => setShowMenu((v) => !v)}>
                              <MoreVertical className="w-6 h-6 text-gray-300" />
                            </button>
                            {showMenu && (
                              <div className="absolute right-0 mt-2 w-36 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-30">
                                <button
                                  className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 rounded-t-lg"
                                  onClick={() => { setStep(0); setShowMenu(false); }}
                                >
                                  ← Back
                                </button>
                                <button
                                  className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-800 rounded-b-lg"
                                  onClick={closeModal}
                                >
                                  Close
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Overview Header */}
                        <div className="px-8 pt-8 pb-2">
                          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1 text-white">Review Your Calendar</h2>
                          <p className="text-gray-300 text-sm mb-4">Here's your personalized calendar. Review the details and structure below.</p>
                          <div className="mb-4 bg-gray-800/80 rounded-lg p-4 flex flex-col gap-2">
                            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-300">
                              <span><span className="font-semibold text-white">Age:</span> {form.age}</span>
                              <span><span className="font-semibold text-white">Family:</span> {form.family}</span>
                              <span><span className="font-semibold text-white">Income:</span> ${form.income}/yr</span>
                              <span><span className="font-semibold text-white">Risk:</span> {form.risk}</span>
                            </div>
                            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-300">
                              <span><span className="font-semibold text-white">Goals:</span> {form.goals.join(', ')}</span>
                            </div>
                            <div className="text-sm text-gray-400 mt-2"><span className="font-semibold text-gray-300">Status:</span> {form.goalDescription}</div>
                          </div>
                        </div>
                        {/* Plan Summary/Analysis Text (from GPT) */}
                        <div className="px-8 pb-2">
                          <div className="bg-gray-800/80 rounded-xl p-6 shadow flex flex-col gap-4 relative mb-8">
                            <h3 className="text-lg font-semibold text-white mb-2">Calendar Analysis</h3>
                            <p className="text-gray-200 text-base leading-relaxed">
                              {result.summary}
                            </p>
                          </div>
                          {/* Financial Focus Areas */}
                          <motion.section
                            className="mb-12"
                            initial={{ opacity: 0, y: 32 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, ease: 'easeOut' }}
                          >
                            <div className="flex items-center gap-2 mb-6 px-2 sm:px-4">
                              <h3 className="text-2xl font-bold text-white tracking-tight">Financial Focus Areas</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-8 px-2 sm:px-4">
                              {GOALS_OPTIONS.map(goal => {
                                const isMain = getFocusLevel(goal, form) === 'Main Focus';
                                return (
                                  <div
                                    key={goal}
                                    aria-label={`View details for ${goal} focus area`}
                                    className={
                                      `w-full rounded-xl px-6 py-7 flex flex-col justify-center items-center transition-all duration-300 bg-gray-800/90 shadow-sm` +
                                      (isMain ? ' ring-2 ring-gray-600/60' : '')
                                    }
                                  >
                                    {isMain && (
                                      <div className="text-gray-400 text-xs font-semibold mb-4 text-center tracking-wide" style={{ letterSpacing: '0.04em' }}>
                                        Main Focus
                                      </div>
                                    )}
                                    <span className={
                                      isMain
                                        ? 'font-mono text-lg sm:text-xl font-bold text-white text-center'
                                        : 'font-mono text-base sm:text-lg font-medium text-gray-300/80 text-center'
                                    }>{goal}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.section>
                          {/* Breathing Orb Section (replaces Suggested Improvements) */}
                          <BreathingOrb />
                          {/* Calendar Events (from GPT) */}
                          {result.steps && result.steps.length > 0 && (
                            <div className="w-full flex flex-col mb-8">
                              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <span className="inline-block"><svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></span>
                                Calendar Events
                              </h3>
                              <ol className="space-y-4">
                                {result.steps.map((step: any, idx: number) => (
                                  <li key={idx} className="bg-gray-900/80 border border-gray-800 rounded-xl p-5 shadow flex flex-col gap-2">
                                    <div className="flex items-center gap-3 mb-1">
                                      <span className="w-7 h-7 rounded-full bg-gray-700 text-white flex items-center justify-center font-bold text-lg">{idx + 1}</span>
                                      <span className="font-semibold text-lg text-white">{step.title}</span>
                                      {step.estimatedTime && <span className="ml-auto text-xs text-gray-400">{step.estimatedTime}</span>}
                                    </div>
                                    <div className="text-gray-200 text-base mb-1">{step.desc}</div>
                                    {step.type && <div className="text-xs text-gray-300 font-mono">Type: {step.type}</div>}
                                    {step.status && <div className="text-xs text-gray-400 font-mono">Status: {step.status}</div>}
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </div>
                        {/* Bottom buttons, not sticky, just after content */}
                        <div className="flex flex-row gap-4 px-8 py-6 bg-transparent border-t border-gray-800 rounded-b-2xl">
                          <button
                            className="flex-1 py-3 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 font-semibold text-base transition-all shadow"
                            onClick={() => setStep(0)}
                          >
                            Go Back
                          </button>
                          <button
                            className="flex-1 py-3 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 font-semibold text-base transition-all shadow"
                            onClick={closeModal}
                          >
                            Start Over
                          </button>
                          <button
                            className="flex-1 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-semibold text-base transition-all shadow"
                            onClick={handleApprovePlan}
                          >
                            Approve Calendar
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      <AnimatePresence>
        {showEventModal && selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setShowEventModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{selectedEvent.title}</h3>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Date:</p>
                  <p className="font-medium">{monthNames[currentMonth]} {selectedDate}, {currentYear}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Description:</p>
                  <p className="text-gray-800">{selectedEvent.description}</p>
                </div>

                {selectedEvent.estimatedTime && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Estimated Time:</p>
                    <p className="text-gray-800">{selectedEvent.estimatedTime}</p>
                  </div>
                )}

                {selectedEvent.type && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Type:</p>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      selectedEvent.type === 'action' ? 'bg-blue-100 text-blue-800' :
                      selectedEvent.type === 'education' ? 'bg-purple-100 text-purple-800' :
                      selectedEvent.type === 'review' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedEvent.type?.charAt(0).toUpperCase() + selectedEvent.type?.slice(1)}
                    </span>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600 mb-2">Status:</p>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    selectedEvent.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedEvent.status === 'completed' ? 'Completed' : 'Pending'}
                  </span>
                  {selectedEvent.isAIGenerated && (
                    <span className="ml-2 inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      AI Generated
                    </span>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  {selectedEvent.status !== 'completed' && (
                    <button
                      onClick={() => handleMarkEventComplete(selectedEvent.key)}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Mark Complete
                    </button>
                  )}
                  <button
                    onClick={handleRescheduleEvent}
                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Reschedule
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Event Modal */}
      <AnimatePresence>
        {showAddEventModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddEventModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add Event</h3>
                <button
                  onClick={() => setShowAddEventModal(false)}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Date:</p>
                  <p className="font-medium">{monthNames[currentMonth]} {selectedDate}, {currentYear}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Title
                  </label>
                  <input
                    type="text"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="Enter event title..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Type
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                    <option value="financial">Financial Goal</option>
                    <option value="learning">Learning Task</option>
                    <option value="review">Review/Check</option>
                    <option value="action">Action Item</option>
                    <option value="reminder">Reminder</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAddEventModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddNewEvent}
                    disabled={!newEventTitle.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                  >
                    Add Event
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Notification */}
      {showSuccessMessage && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 bg-white border border-green-200 text-green-800 px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-medium">{showSuccessMessage}</span>
          </div>
        </motion.div>
      )}

      {/* Reschedule Modal */}
      <AnimatePresence>
        {showRescheduleModal && selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setShowRescheduleModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Reschedule Event</h3>
                <button
                  onClick={() => setShowRescheduleModal(false)}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Event:</p>
                  <p className="font-medium">{selectedEvent.title}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Current Date:</p>
                  <p className="text-gray-800">{monthNames[currentMonth]} {selectedDate}, {currentYear}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Date ({monthNames[currentMonth]} {currentYear})
                  </label>
                  <select
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day} disabled={day === selectedDate}>
                        {monthNames[currentMonth]} {day} {day === selectedDate ? '(current)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowRescheduleModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmReschedule}
                    disabled={rescheduleDate === selectedDate}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                  >
                    Confirm Reschedule
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 