'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smile, Frown, Meh, Utensils, Bus, ShoppingBag, CheckCircle2, 
  Calendar, ChevronDown, Activity, Users, User, CalendarDays, X,
  Receipt, Film, HeartPulse
} from 'lucide-react';
import * as Select from '@radix-ui/react-select';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, isWeekend, parseISO } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

const EMOTIONS = [
  { id: 'happy', label: 'Happy', icon: Smile, color: 'text-green-500', intensity: 5 },
  { id: 'excited', label: 'Excited', icon: Smile, color: 'text-purple-500', intensity: 4 },
  { id: 'calm', label: 'Calm', icon: Meh, color: 'text-blue-500', intensity: 3 },
  { id: 'neutral', label: 'Neutral', icon: Meh, color: 'text-yellow-500', intensity: 2 },
  { id: 'anxious', label: 'Anxious', icon: Frown, color: 'text-red-500', intensity: 1 },
  { id: 'stressed', label: 'Stressed', icon: Frown, color: 'text-orange-500', intensity: 0 },
];

const CATEGORIES = [
  { 
    id: 'food', 
    label: 'Food', 
    icon: Utensils, 
    gradient: 'from-slate-50 to-slate-100',
    hoverGradient: 'from-slate-100 to-slate-200',
    selectedGradient: 'from-sage-50 to-sage-100',
    borderColor: 'border-sage-200',
    subcategories: [
      'Groceries', 
      'Dining Out', 
      'Coffee/Tea', 
      'Snacks', 
      'Alcohol', 
      'Delivery', 
      'Meal Prep', 
      'Bakery'
    ] 
  },
  { 
    id: 'transport', 
    label: 'Transport', 
    icon: Bus, 
    gradient: 'from-slate-50 to-slate-100',
    hoverGradient: 'from-slate-100 to-slate-200',
    selectedGradient: 'from-peach-50 to-peach-100',
    borderColor: 'border-peach-200',
    subcategories: [
      'Public Transit', 
      'Ride Share', 
      'Gas', 
      'Parking', 
      'Tolls', 
      'Car Maintenance', 
      'Bike/Scooter', 
      'Taxi'
    ] 
  },
  { 
    id: 'shopping', 
    label: 'Shopping', 
    icon: ShoppingBag, 
    gradient: 'from-slate-50 to-slate-100',
    hoverGradient: 'from-slate-100 to-slate-200',
    selectedGradient: 'from-slate-50 to-slate-100',
    borderColor: 'border-gray-200',
    subcategories: [
      'Clothing', 
      'Electronics', 
      'Home Goods', 
      'Beauty', 
      'Books', 
      'Gifts', 
      'Sports', 
      'Hobbies'
    ] 
  },
  { 
    id: 'entertainment', 
    label: 'Entertainment', 
    icon: Film, 
    gradient: 'from-slate-50 to-slate-100',
    hoverGradient: 'from-slate-100 to-slate-200',
    selectedGradient: 'from-lavender-50 to-lavender-100',
    borderColor: 'border-lavender-200',
    subcategories: [
      'Movies', 
      'Concerts', 
      'Events', 
      'Games', 
      'Streaming', 
      'Music', 
      'Sports', 
      'Museums'
    ] 
  },
  { 
    id: 'bills', 
    label: 'Bills', 
    icon: Receipt, 
    gradient: 'from-slate-50 to-slate-100',
    hoverGradient: 'from-slate-100 to-slate-200',
    selectedGradient: 'from-mint-50 to-mint-100',
    borderColor: 'border-mint-200',
    subcategories: [
      'Rent', 
      'Utilities', 
      'Phone', 
      'Internet', 
      'Insurance', 
      'Subscriptions', 
      'Memberships', 
      'Loans'
    ] 
  },
  { 
    id: 'health', 
    label: 'Health', 
    icon: HeartPulse, 
    gradient: 'from-slate-50 to-slate-100',
    hoverGradient: 'from-slate-100 to-slate-200',
    selectedGradient: 'from-slate-50 to-slate-100',
    borderColor: 'border-gray-200',
    subcategories: [
      'Medical', 
      'Dental', 
      'Pharmacy', 
      'Fitness', 
      'Wellness', 
      'Supplements', 
      'Therapy', 
      'Insurance'
    ] 
  }
];

const TIME_RANGES = [
  { id: 'day', label: 'Today' },
  { id: 'week', label: 'This Week' },
];

const ACTIVITY_LEVELS = [
  { id: 'low', label: 'Low', icon: Activity, color: 'text-blue-500' },
  { id: 'medium', label: 'Medium', icon: Activity, color: 'text-green-500' },
  { id: 'high', label: 'High', icon: Activity, color: 'text-red-500' },
];

const SOCIAL_CONTEXTS = [
  { id: 'alone', label: 'Alone', icon: User },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'friends', label: 'Friends', icon: Users },
  { id: 'colleagues', label: 'Colleagues', icon: Users },
  { id: 'partner', label: 'Partner', icon: User },
];

const AutoExpandingTextArea = ({ placeholder }: { placeholder: string }) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleInput}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 p-3 pr-12 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none overflow-y-auto"
        style={{ minHeight: '100px' }}
      />
      <button
        type="button"
        className="absolute right-3 bottom-3 p-2 rounded-full hover:bg-gray-100 transition-colors"
        onClick={() => {
          // TODO: Implement audio recording functionality
          console.log('Start recording...');
        }}
      >
        <svg
          className="w-5 h-5 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
      </button>
    </div>
  );
};

const MOOD_RANGES = [
  { range: '1-2', label: 'Terrible' },
  { range: '3-4', label: 'Bad' },
  { range: '5-6', label: 'Neutral' },
  { range: '7-8', label: 'Good' },
  { range: '9-10', label: 'Amazing' },
];

interface LoggingCardsProps {
  onLogComplete?: () => void;
  showOnlyMoodCard?: boolean;
  darkMode?: boolean;
}

export default function LoggingCards({ onLogComplete, showOnlyMoodCard, darkMode }: LoggingCardsProps) {
  const { user } = useAuth();
  const supabase = createClient();
  const [moodValue, setMoodValue] = useState<number>(5);
  const [moodNote, setMoodNote] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSocialContext, setSelectedSocialContext] = useState<string | null>(null);
  const [activityLevel, setActivityLevel] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasLoggedMood, setHasLoggedMood] = useState(false);
  const [hasLoggedSpending, setHasLoggedSpending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<{
    type: 'mood' | 'spending';
    emotion?: string;
    amount?: number;
    date: string;
    trend?: string;
  } | null>(null);

  const currentCategory = CATEGORIES.find(cat => cat.id === selectedCategory);

  // Quick amount buttons
  const QUICK_AMOUNTS = [5, 10, 20, 50, 100];

  const handleQuickAmount = (amount: number) => {
    setAmount(amount.toString());
  };

  const handleRecording = async () => {
    try {
      setIsRecording(true);
      // TODO: Implement audio recording functionality
      console.log('Recording started...');
      // Simulate recording for 3 seconds
      await new Promise(resolve => setTimeout(resolve, 3000));
      setIsRecording(false);
      // TODO: Process the recorded audio
    } catch (error) {
      console.error('Error recording audio:', error);
      setIsRecording(false);
    }
  };

  const handleMoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSubmitting(true);
      const now = selectedDate;
      const moodData = {
        user_id: user.id,
        mood: Math.round(moodValue),
        notes: moodNote,
        date: format(now, 'yyyy-MM-dd'),
      };

      const { error } = await supabase
        .from('mood_logs')
        .upsert([moodData], { 
          onConflict: 'user_id,date',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error saving mood:', error);
        return;
      }
      
      setSuccessMessage({
        type: 'mood',
        date: format(now, 'MMM d, yyyy h:mm a'),
        trend: 'slightly better than yesterday'
      });
      setShowSuccess(true);
      setHasLoggedMood(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSuccessMessage(null);
      }, 5000);
      
      setMoodValue(5);
      setMoodNote('');
      onLogComplete?.();
    } catch (error) {
      console.error('Error saving mood:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSpendingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || (!selectedCategory && !customCategory) || !user) return;

    try {
      setIsSubmitting(true);
      const now = selectedDate;

      const spendingData = {
        user_id: user.id,
        amount: parseFloat(amount),
        category: isCustomCategory ? customCategory : currentCategory?.label,
        date: format(now, 'yyyy-MM-dd'),
        source: 'manual'
      };

      const { error } = await supabase
        .from('spending_logs')
        .insert([spendingData]);

      if (error) {
        console.error('Error saving spending:', error);
        return;
      }
      
      setSuccessMessage({
        type: 'spending',
        amount: parseFloat(amount),
        date: format(now, 'MMM d, yyyy h:mm a')
      });
      setShowSuccess(true);
      setHasLoggedSpending(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSuccessMessage(null);
      }, 5000);
      
      setAmount('');
      setSelectedCategory(null);
      setCustomCategory('');
      setIsCustomCategory(false);
      onLogComplete?.();
    } catch (error) {
      console.error('Error saving spending:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper for luxury mood color
  const getMoodColor = (value: number) => {
    if (value <= 2) return 'from-[#7f1d1d] via-[#fde68a] to-[#14532d]'; // dark red to gold to deep green
    if (value <= 4) return 'from-[#b91c1c] via-[#fde68a] to-[#166534]';
    if (value <= 6) return 'from-[#fde68a] to-[#166534]'; // gold to deep green
    if (value <= 8) return 'from-[#166534] to-[#14532d]'; // deep green
    return 'from-[#14532d] to-[#166534]';
  };
  // Helper for handle border color
  const getHandleBorderColor = (value: number) => {
    if (value <= 2) return 'border-[#7f1d1d]';
    if (value <= 4) return 'border-[#b91c1c]';
    if (value <= 6) return 'border-[#fde68a]';
    if (value <= 8) return 'border-[#166534]';
    return 'border-[#14532d]';
  };
  // Helper for marker color
  const getMarkerColor = (value: number, current: number) => {
    if (current <= 2) return value <= current ? 'bg-[#7f1d1d]' : 'bg-gray-300';
    if (current <= 4) return value <= current ? 'bg-[#b91c1c]' : 'bg-gray-300';
    if (current <= 6) return value <= current ? 'bg-[#fde68a]' : 'bg-gray-300';
    if (current <= 8) return value <= current ? 'bg-[#166534]' : 'bg-gray-300';
    return value <= current ? 'bg-[#14532d]' : 'bg-gray-300';
  };

  // Helper for mood label
  const getMoodLabel = (value: number) => {
    if (value <= 2) return 'Terrible';
    if (value <= 4) return 'Bad';
    if (value <= 6) return 'Neutral';
    if (value <= 8) return 'Good';
    return 'Amazing';
  };

  return (
    <div className={showOnlyMoodCard ? '' : 'grid grid-cols-1 md:grid-cols-2 gap-6'}>
      {/* Mood Logger Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} rounded-xl border p-6 shadow-sm`}
      >
        <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>How are you feeling today?</h2>
        {hasLoggedMood ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-center justify-center p-4 rounded-lg border ${darkMode ? 'bg-green-900 border-green-700' : 'bg-green-50 border-green-200'}`}
          >
            <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
            <span className={`text-sm font-medium ${darkMode ? 'text-green-200' : 'text-green-700'}`}>Already logged today</span>
          </motion.div>
        ) : (
          <form onSubmit={handleMoodSubmit} className="space-y-6">
            {/* Mood Meter */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Mood</span>
                <div className="flex items-center gap-2">
                  <motion.span 
                    className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                    initial={{ scale: 1 }}
                    animate={{ scale: moodValue > 5 ? 1.2 : 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {Math.round(moodValue)}/10
                  </motion.span>
                  <span className={`ml-2 text-sm px-2 py-0.5 rounded-full font-medium ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>{getMoodLabel(Math.round(moodValue))}</span>
                </div>
              </div>
              <div className="relative pt-8 pb-2">
                {/* Luxury Gradient Bar */}
                <div className={`absolute top-1/2 left-0 w-full h-3 rounded-full -translate-y-1/2 bg-gradient-to-r ${getMoodColor(moodValue)}`}></div>
                {/* Slider input */}
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.01"
                  value={moodValue}
                  onChange={(e) => setMoodValue(Number(e.target.value))}
                  className="absolute top-0 left-0 w-full h-10 opacity-0 cursor-pointer z-20"
                  style={{ WebkitAppearance: 'none', appearance: 'none' }}
                />
                {/* Smaller Floating handle */}
                <motion.div
                  className="absolute top-1/2 w-6 h-6 -translate-y-1/2 pointer-events-none"
                  style={{
                    left: `calc(${((moodValue - 1) / 9) * 100}% - 12px)`
                  }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className={`w-6 h-6 rounded-full bg-white shadow-xl flex items-center justify-center ${getHandleBorderColor(moodValue)}`}
                    style={{
                      boxShadow: `0 0 0 4px rgba(20, 83, 45, 0.10), 0 2px 8px 0 rgba(0,0,0,0.10)`
                    }}
                  >
                    {/* No emoji here */}
                  </div>
                </motion.div>
                {/* Mood labels under the slider */}
                <div className="flex justify-between mt-6 text-xs font-semibold w-full select-none">
                  <span className="w-1/5 text-left text-[#7f1d1d]">Terrible</span>
                  <span className="w-1/5 text-center text-[#b91c1c]">Bad</span>
                  <span className="w-1/5 text-center text-[#fde68a]">Neutral</span>
                  <span className="w-1/5 text-center text-[#166534]">Good</span>
                  <span className="w-1/5 text-right text-[#14532d]">Amazing</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="moodNote" className={`block text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                Note (optional)
              </label>
              <textarea
                id="moodNote"
                value={moodNote}
                onChange={(e) => setMoodNote(e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent`}
                placeholder="How are you feeling today?"
              />
            </div>

            <motion.button
              type="submit"
              disabled={isSubmitting}
              className={`mx-auto block ${darkMode ? 'bg-gray-800 text-white' : 'bg-green-800 text-white'} rounded-full px-6 py-2 text-base font-medium shadow-md border border-green-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2`}
              style={{ transition: 'transform 0.3s, box-shadow 0.3s, border-color 0.3s' }}
              onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.07)'; e.currentTarget.style.boxShadow = '0 6px 32px 0 rgba(21,128,61,0.18)'; e.currentTarget.style.borderColor = 'transparent'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = '#15803d'; }}
            >
              <span className="relative z-10 flex items-center justify-center">
                {isSubmitting ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  'Log Mood'
                )}
              </span>
            </motion.button>
          </form>
        )}
      </motion.div>

      {/* Only show spending card if not showOnlyMoodCard */}
      {!showOnlyMoodCard && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gradient-to-br from-white to-gray-50 border-gray-200'} rounded-xl border p-6 shadow-sm`}
        >
          <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Track your spending</h2>
          {hasLoggedSpending ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center justify-center p-4 rounded-lg border ${darkMode ? 'bg-green-900 border-green-700' : 'bg-green-50 border-green-200'}`}
            >
              <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
              <span className={`text-sm font-medium ${darkMode ? 'text-green-200' : 'text-green-700'}`}>Already logged today</span>
            </motion.div>
          ) : (
            <form onSubmit={handleSpendingSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="amount" className={`block text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-700'} mb-2`}>
                    Amount
                  </label>
                  <div className="flex justify-center">
                    <div className="relative w-48 rounded-full shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className={`text-gray-500 sm:text-sm ${darkMode ? 'text-gray-400' : ''}`}>$</span>
                      </div>
                      <input
                        type="number"
                        name="amount"
                        id="amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className={`block w-full pl-8 pr-4 py-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border border-gray-300'} rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-center`}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {QUICK_AMOUNTS.map((quickAmount) => (
                      <motion.button
                        key={quickAmount}
                        type="button"
                        onClick={() => handleQuickAmount(quickAmount)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-4 py-1.5 text-sm font-medium ${darkMode ? 'text-gray-400 bg-gray-800' : 'text-emerald-700 bg-emerald-50'} rounded-full hover:bg-emerald-100 transition-colors`}
                      >
                        ${quickAmount}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                    Category
                  </label>
                  {isCustomCategory ? (
                    <div className="relative">
                      <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className={`block w-full px-3 py-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent`}
                        placeholder="Enter custom category"
                      />
                      <button
                        type="button"
                        onClick={() => setIsCustomCategory(false)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <select
                        value={selectedCategory || ''}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className={`block w-full px-3 py-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent`}
                      >
                        <option value="">Select a category</option>
                        {CATEGORIES.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setIsCustomCategory(true)}
                        className={`text-sm ${darkMode ? 'text-gray-400 hover:text-gray-600' : 'text-emerald-600 hover:text-emerald-700'}`}
                      >
                        + Add custom category
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={handleRecording}
                    disabled={isRecording}
                    className={`w-full flex items-center justify-center space-x-2 px-4 py-2 ${darkMode ? 'border-gray-700' : 'border-gray-300'} rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isRecording ? (
                      <>
                        <motion.span
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="w-3 h-3 bg-red-500 rounded-full"
                        />
                        <span>Recording...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                          />
                        </svg>
                        <span>Record Description</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={isSubmitting || !amount || (!selectedCategory && !customCategory)}
                className={`w-full ${darkMode ? 'bg-gray-800 text-white' : 'bg-emerald-700 text-white'} rounded-lg px-4 py-2 font-medium hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span className="relative z-10 flex items-center justify-center">
                  {isSubmitting ? (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    'Log Spending'
                  )}
                </span>
              </motion.button>
            </form>
          )}
        </motion.div>
      )}

      {/* Success Message */}
      <AnimatePresence>
        {showSuccess && successMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-4 right-4 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl border border-gray-200 p-4 shadow-lg max-w-sm`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h3 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {successMessage.type === 'mood' 
                    ? `Mood logged: ${Math.round(moodValue)}/10`
                    : `Spending logged: $${successMessage.amount?.toFixed(2)}`}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {successMessage.date}
                </p>
                {successMessage.trend && (
                  <p className="mt-1 text-sm text-gray-500">
                    Mood trend: {successMessage.trend}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 