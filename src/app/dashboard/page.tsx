'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import FinanceSection from '@/components/FinanceSection';
import SpendingChart from '@/components/PlaceholderChart';
import InsightsSection from '@/components/InsightsSection';
import RoadmapSection from '@/components/RoadmapSection';
import { FaPaypal, FaBitcoin, FaApple, FaGoogle, FaAmazon, FaFacebook, FaUber, FaShoppingBag, FaGasPump, FaCoffee, FaUtensils, FaFilm, FaGamepad, FaBook, FaPlane, FaCar, FaHome, FaShoppingCart, FaMedkit, FaGraduationCap, FaDumbbell, FaPaw, FaGift, FaMusic, FaTshirt, FaLaptop, FaMobile, FaCamera, FaHeadphones, FaWifi, FaLightbulb, FaWrench, FaPaintBrush, FaLeaf, FaRecycle, FaBaby, FaRing, FaUmbrella, FaSuitcase, FaMapMarkedAlt, FaHotel, FaTicketAlt, FaBus, FaTrain, FaTaxi, FaShip, FaMotorcycle, FaBicycle, FaWalking, FaRunning, FaSwimmer, FaSkiing, FaFutbol, FaBasketballBall, FaVolleyballBall, FaTableTennis, FaBowlingBall, FaChess, FaDice, FaPuzzlePiece, FaRobot, FaRocket, FaSatellite, FaMicroscope, FaFlask, FaAtom, FaDna, FaVirus, FaPills, FaStethoscope, FaSyringe, FaBandAid, FaThermometerHalf, FaWeight, FaRuler, FaClock, FaCalendarAlt, FaCalendarCheck, FaCalendarPlus, FaCalendarMinus, FaCalendarTimes, FaStopwatch, FaHourglass, FaBell, FaVolumeUp, FaVolumeDown, FaVolumeMute, FaMicrophone, FaMicrophoneSlash, FaPhoneAlt, FaPhoneSlash, FaVideo, FaVideoSlash, FaDesktop, FaTabletAlt, FaKeyboard, FaMouse, FaPrint, FaFax, FaProjectDiagram, FaNetworkWired, FaServer, FaDatabase, FaCloud, FaCloudUploadAlt, FaCloudDownloadAlt } from 'react-icons/fa';
import { SiEthereum, SiTether, SiTesla, SiNetflix, SiStarbucks, SiWalmart, SiTarget, SiMcdonalds, SiCocacola, SiVisa, SiMastercard } from 'react-icons/si';
import ReceiptUpload from '@/components/ReceiptUpload';
import TransactionList from '@/components/TransactionList';
import StockPrice from '@/components/StockPrice';
import { generateInsight } from '@/utils/aiUtils';
import { toast } from 'sonner';

// Placeholder data - in real app would come from API
const analyticsData = {
  moodConsistency: {
    value: 'Stable',
    trend: '+4.3%',
    label: 'Mood Consistency',
    tooltip: 'Steady moods help reduce emotional spending',
    explanation: 'This score reflects how steady your mood has been over the past 7 days.\n\nConsistency helps reduce impulse spending.\n\nCalculated based on your daily mood log variance.'
  },
  moodMoneyScore: {
    value: '92.3%',
    trend: '+0.8%',
    label: 'Mood X Money Score',
    tooltip: 'How well your mood and spending align',
    explanation: 'Shows how aligned your spending is with your emotional state.\n\nA higher score means you\'re less likely to spend impulsively on low-mood days.'
  },
  calmCapital: {
    value: '756',
    trend: '+11.2%',
    label: 'Calm Capital',
    tooltip: 'Your cushion to stay cool during chaos',
    explanation: 'This number reflects your emotional resilience in high-spending situations.\n\nBased on mood stability during financial peaks or stress days.'
  },
  spendingScore: {
    value: '$2.4K',
    trend: '-12.5%',
    label: 'Monthly Spending',
    tooltip: 'Track your monthly spending patterns',
    explanation: 'Tracks your total spending logged this month.\n\nLower spending during consistent moods is seen as a positive sign of control.'
  }
};

interface ChartData {
  date: string;
  mood: number | null;
  spending: number | null;
}

const generatePlaceholderData = (userData: ChartData[]): ChartData[] => {
  // Get today's date and create array of last 7 days
  const today = new Date();
  const dateRange = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - i));
    return format(date, 'MMM d');
  });

  // Create a map of all dates with default null values
  const combinedData: { [key: string]: ChartData } = {};
  dateRange.forEach(date => {
    combinedData[date] = {
      date,
      mood: null,
      spending: null
    };
  });

  // Fill in any existing user data
  userData.forEach(data => {
    if (combinedData[data.date]) {
      // Ensure mood is a number between 1-10
      let mood = data.mood;
      if (typeof mood === 'string') {
        mood = parseFloat(mood);
      }
      mood = typeof mood === 'number' && !isNaN(mood) ? Math.min(10, Math.max(1, mood)) : null;
      
      // Ensure spending data is properly formatted
      let spending = data.spending;
      if (typeof spending === 'string') {
        spending = parseFloat(spending);
      }
      spending = typeof spending === 'number' && !isNaN(spending) ? spending : null;
      
      combinedData[data.date] = {
        ...data,
        mood,
        spending
      };
      
      console.log(`Processed data for ${data.date}: mood=${mood}, spending=${spending}`);
    }
  });

  // Return sorted array of data points
  return Object.values(combinedData)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const welcomeMessages = [
  {
    text: "Welcome back, {name}. Let's grow a little today.",
    style: "text-gray-600"
  },
  {
    text: "Good to see you, {name} 👋 You're one step closer to calm.",
    style: "text-gray-600"
  },
  {
    text: "{name}, your clarity starts here.",
    style: "text-gray-600"
  }
];

const mockTransactions = [
  {
    id: 'tx1',
    name: 'Starbucks',
    date: '2024-06-01',
    amount: 5.75,
    category: 'Coffee Shop',
    account_id: 'mock-account-1',
    pending: false
  },
  {
    id: 'tx2',
    name: 'Whole Foods',
    date: '2024-05-31',
    amount: 54.12,
    category: 'Groceries',
    account_id: 'mock-account-1',
    pending: false
  },
  {
    id: 'tx3',
    name: 'Uber',
    date: '2024-05-30',
    amount: 18.40,
    category: 'Transport',
    account_id: 'mock-account-1',
    pending: false
  },
  {
    id: 'tx4',
    name: 'Netflix',
    date: '2024-05-29',
    amount: 15.99,
    category: 'Subscription',
    account_id: 'mock-account-1',
    pending: false
  },
  {
    id: 'tx5',
    name: 'Amazon',
    date: '2024-05-28',
    amount: 32.50,
    category: 'Shopping',
    account_id: 'mock-account-1',
    pending: false
  }
];

const clearUserSpendingData = async (userId: string) => {
  const supabase = createClient();
  const { error } = await supabase
    .from('spending_logs')
    .delete()
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error clearing spending data:', error);
  }
};

// Helper to clear all transactions for the user
const clearUserTransactions = async (userId: string) => {
  const supabase = createClient();
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error clearing transactions:', error);
  }
};

// Helper to infer transaction type from category
const inferTransactionType = (categories: string[]) => {
  if (!categories || categories.length === 0) return 'purchase';
  const lowerCats = categories.map(cat => cat.toLowerCase());
  if (lowerCats.some(cat => cat.includes('subscription'))) return 'subscription';
  if (lowerCats.some(cat => cat.includes('bill') || cat.includes('utilities') || cat.includes('service'))) return 'bill';
  if (lowerCats.some(cat => cat.includes('transfer'))) return 'transfer';
  if (lowerCats.some(cat => cat.includes('loan'))) return 'loan';
  if (lowerCats.some(cat => cat.includes('investment'))) return 'investment';
  if (lowerCats.some(cat => cat.includes('income') || cat.includes('payroll'))) return 'income';
  return 'purchase';
};

// Portfolio summary mock data with icon components
const portfolioItems = [
  { icon: <FaPaypal size={20} className="text-blue-600" />, label: 'PayPal USD', percent: 40.87, value: '$6,291.92', color: 'blue' },
  { icon: <FaBitcoin size={20} className="text-orange-500" />, label: 'Bitcoin', percent: 26.54, value: '$4,823.43', color: 'orange' },
  { icon: <SiEthereum size={20} className="text-purple-600" />, label: 'Ethereum', percent: 16.71, value: '$2,215.32', color: 'purple' },
  { icon: <SiTether size={20} className="text-green-600" />, label: 'Tether', percent: 9.21, value: '$825.45', color: 'green' },
  { icon: <FaPaypal size={20} className="text-gray-500" />, label: 'USD Coin', percent: 6.67, value: '$600.00', color: 'gray' },
];

// Ticker items: finance/mood stats and trending stocks
const tickerItems = [
  { type: 'stat', content: <span>This week: 73% needs vs 27% wants - great balance</span> },
  { type: 'stat', content: <span>Coffee spending: 23% of food budget during low mood</span> },
  { type: 'stat', content: <span>Weekend spending up 28% vs weekdays</span> },
  { type: 'stock', icon: <FaApple className="text-gray-900" />, ticker: 'AAPL', price: '$192.32', change: '+1.2%', up: true },
  { type: 'stock', icon: <SiTesla className="text-red-600" />, ticker: 'TSLA', price: '$672.10', change: '-2.1%', up: false },
  { type: 'stock', icon: <FaGoogle className="text-blue-700" />, ticker: 'GOOGL', price: '$2,850.00', change: '+0.8%', up: true },
  { type: 'stock', icon: <FaAmazon className="text-yellow-700" />, ticker: 'AMZN', price: '$3,400.00', change: '+0.5%', up: true },
  { type: 'stock', icon: <FaFacebook className="text-blue-600" />, ticker: 'META', price: '$320.00', change: '-0.7%', up: false },
  { type: 'stat', content: <span>Top 3 categories account for 74% of spending</span> },
  { type: 'stat', content: <span>Amazon purchases spike 45% during stress days</span> },
];

// Helper to get merchant logo for transactions
function getMerchantLogo(name: string) {
  // Early return pattern to improve readability
  const lowerName = name.toLowerCase();
  
  // Food & Beverage
  if (lowerName.includes('starbucks')) return <SiStarbucks size={24} className="text-green-600" />;
  if (lowerName.includes('mcdonalds') || lowerName.includes("mcdonald's")) return <SiMcdonalds size={24} className="text-yellow-500" />;
  if (lowerName.includes('coca cola') || lowerName.includes('coke')) return <SiCocacola size={24} className="text-red-600" />;
  
  // Retail & Shopping  
  if (lowerName.includes('walmart')) return <SiWalmart size={24} className="text-blue-600" />;
  if (lowerName.includes('target')) return <SiTarget size={24} className="text-red-600" />;
  if (lowerName.includes('amazon')) return <FaAmazon size={24} className="text-orange-500" />;
  
  // Technology
  if (lowerName.includes('google')) return <FaGoogle size={24} className="text-blue-500" />;
  if (lowerName.includes('apple')) return <FaApple size={24} className="text-gray-600" />;
  if (lowerName.includes('microsoft')) return <FaMicrosoft size={24} className="text-blue-600" />;
  
  // Transportation
  if (lowerName.includes('uber')) return <FaUber size={24} className="text-black" />;
  if (lowerName.includes('tesla')) return <SiTesla size={24} className="text-red-500" />;
  
  // Entertainment & Media
  if (lowerName.includes('netflix')) return <SiNetflix className="text-red-600" />;
  if (lowerName.includes('spotify')) return <FaSpotify className="text-green-500" />;
  if (lowerName.includes('facebook') || lowerName.includes('meta')) return <FaFacebook className="text-blue-600" />;
  
  // Financial
  if (lowerName.includes('paypal')) return <FaPaypal className="text-blue-600" />;
  if (lowerName.includes('visa')) return <SiVisa className="text-blue-700" />;
  if (lowerName.includes('mastercard')) return <SiMastercard className="text-red-600" />;
  
  // Crypto
  if (lowerName.includes('bitcoin')) return <FaBitcoin className="text-orange-400" />;
  if (lowerName.includes('ethereum')) return <SiEthereum className="text-purple-500" />;
  if (lowerName.includes('tether')) return <SiTether className="text-green-500" />;
  
  // Default shopping icon for unrecognized merchants
  return <FaShoppingBag className="text-gray-500" />;
}

export default function Dashboard() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [currentWelcomeIndex, setCurrentWelcomeIndex] = useState(0);
  const [welcomeMessage, setWelcomeMessage] = useState(welcomeMessages[0]);
  const loggingRef = useRef<HTMLDivElement>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [receiptTransactions, setReceiptTransactions] = useState<any[]>([]);
  const [unclassifiedTransactions, setUnclassifiedTransactions] = useState<any[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showChart, setShowChart] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [dataLoggingSuccess, setDataLoggingSuccess] = useState(false);
  const [spendingEntryCount, setSpendingEntryCount] = useState<number | null>(null);
  const [showReceiptUpload, setShowReceiptUpload] = useState(false);
  const [tablesExist, setTablesExist] = useState(true);
  const [isTransactionOverviewExpanded, setIsTransactionOverviewExpanded] = useState(false);
  const [archiveFilter, setArchiveFilter] = useState('all'); // 'all' or 'archived'
  const [expandedInsights, setExpandedInsights] = useState<{[key: string]: boolean}>({});
  const [archiveSuccess, setArchiveSuccess] = useState<string | null>(null);
  const [aiTickerInsights, setAiTickerInsights] = useState<string[]>([]);
  const [aiForecastData, setAiForecastData] = useState<any>(null);

  const supabase = createClient();

  // Function to handle receipt analysis results
  const handleReceiptAnalyzed = async (receiptData: any) => {
    if (!user?.id) {
      console.error('No user ID available');
      return;
    }

    try {
      console.log('📝 Processing receipt upload...');

      // Generate AI insight if we have the user's classification and mood
      let aiInsight = null;
      if (receiptData.needVsWant && receiptData.mood) {
        console.log('🧠 Generating AI insight...');
        try {
          const response = await fetch('/api/generate-insight', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              merchant: receiptData.merchant || 'Unknown Merchant',
              category: receiptData.category || 'General',
              amount: Math.abs(receiptData.amount),
              mood: receiptData.mood,
              needVsWant: receiptData.needVsWant
            })
          });
          
          if (response.ok) {
            const result = await response.json();
            aiInsight = result.insight;
            console.log('✅ AI insight generated successfully');
          } else {
            console.error('❌ AI insight generation failed:', response.status);
          }
        } catch (insightError) {
          console.error('❌ Error generating AI insight:', insightError);
        }
      } else {
        console.log('⚠️ Partial data - skipping AI insight generation');
      }

      console.log('Receipt data received:', {
        merchant: receiptData.merchant,
        amount: receiptData.amount,
        needVsWant: receiptData.needVsWant,
        mood: receiptData.mood,
        aiInsight: aiInsight
      });

      // Create a simplified transaction object with AI fields
      const todaysDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const receiptTransaction = {
        user_id: user.id,
        name: receiptData.merchant || 'Unknown Merchant',
        amount: Math.abs(receiptData.amount),
        date: todaysDate, // Always use today's date
        category: Array.isArray(receiptData.category) ? receiptData.category : [receiptData.category || 'General'],
        source: 'receipt',
        confidence: receiptData.confidence || 0.8,
        items: receiptData.items || null,
        file_name: receiptData.fileName || null,
        need_vs_want: (receiptData.needVsWant === 'Need' || receiptData.needVsWant === 'Want') ? receiptData.needVsWant : null,
        mood_at_purchase: receiptData.mood || null,
        ai_insight: aiInsight
      };

      console.log('💾 Saving receipt to database with date:', receiptTransaction.date);
      
      // Save to database with better error handling
      let transactionData;
      try {
        // Try to insert with AI fields first
        const { data, error } = await supabase
          .from('transactions')
          .insert([receiptTransaction])
          .select();
        
        if (error) {
          // If error is about missing columns, try without AI fields
          if (error.message?.includes('column') && error.message?.includes('does not exist')) {
            console.warn('AI fields not available, saving basic transaction only');
            const basicTransaction = {
              user_id: user.id,
              name: receiptData.merchant || 'Unknown Merchant',
              amount: Math.abs(receiptData.amount),
              date: todaysDate,
              category: Array.isArray(receiptData.category) ? receiptData.category : [receiptData.category || 'General'],
              source: 'receipt',
              confidence: receiptData.confidence || 0.8,
              items: receiptData.items || null,
              file_name: receiptData.fileName || null
            };
            
            const { data: basicData, error: basicError } = await supabase
              .from('transactions')
              .insert([basicTransaction])
              .select();
              
            if (basicError) {
              console.error('Error saving transaction:', basicError.message);
            } else {
              console.log('✅ Basic transaction saved successfully');
              transactionData = basicData;
            }
          } else {
            console.error('Error saving transaction:', error.message);
          }
        } else {
          console.log('✅ Transaction with AI fields saved successfully');
          transactionData = data;
        }
      } catch (insertError) {
        console.error('Unexpected error during transaction insert:', insertError);
      }
      
      // Save spending log
      const spendingLog = {
        user_id: user.id,
        amount: receiptData.amount,
        date: todaysDate,
        category: receiptData.category || 'General',
        merchant: receiptData.merchant || 'Unknown Merchant',
        source: 'receipt'
      };
      
      const { data: spendingData, error: spendingError } = await supabase
        .from('spending_logs')
        .insert([spendingLog])
        .select();

      if (spendingError) {
        if (spendingError.message?.includes('RLS') || spendingError.message?.includes('policy')) {
          console.warn('Spending log save restricted by database policies. Receipt will still appear in UI.');
        } else if (spendingError.message && spendingError.message.trim() !== '') {
          console.error('Error saving spending log:', spendingError.message);
        }
      } else {
        console.log('✅ Spending log saved to database successfully');
      }

      // Update local state regardless of database save status
      const displayTransaction = {
        transaction_id: `receipt_${Date.now()}`,
        id: transactionData?.[0]?.id || `receipt_${Date.now()}`,
        name: receiptData.merchant || 'Unknown Merchant',
        amount: -receiptData.amount, // Negative for display (spending)
        date: todaysDate, // Always use today's date
        category: [receiptData.category || 'General'],
        source: 'receipt',
        confidence: receiptData.confidence,
        need_vs_want: (receiptData.needVsWant === 'Need' || receiptData.needVsWant === 'Want') ? receiptData.needVsWant : null,
        mood_at_purchase: receiptData.mood || null,
        ai_insight: aiInsight,
        archived: false
      };

      console.log('📋 Adding transaction to display with date:', displayTransaction.date);
      console.log('📋 Display transaction:', displayTransaction);

      setReceiptTransactions(prev => [displayTransaction, ...prev]);
      setTransactions(prev => {
        const updated = [displayTransaction, ...prev];
        console.log('📋 Total transactions after update:', updated.length);
        return updated;
      });

      // No need to add to unclassified since it's already classified during upload

      console.log('🎉 Receipt processed successfully and added to your transaction history!');
    } catch (error) {
      console.error('Error processing receipt:', error);
    }
  };

  // Function to handle Need vs Want classification updates
  const handleNeedVsWantUpdate = async (transactionId: string, needVsWant: string, mood?: string) => {
    if (!user?.id) {
      console.error('No user ID available');
      return;
    }

    try {
      // Update the transaction in the database
      const updateData: any = { need_vs_want: needVsWant };
      if (mood) {
        updateData.mood_at_purchase = mood;
        
        // Generate new AI insight based on mood if provided
        const transaction = transactions.find(t => t.id === transactionId);
        if (transaction) {
          const response = await fetch('/api/generate-insight', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              merchant: transaction.name,
              category: Array.isArray(transaction.category) ? transaction.category[0] : transaction.category,
              amount: Math.abs(transaction.amount),
              mood: mood,
              needVsWant: needVsWant
            })
          });
          
          if (response.ok) {
            const { insight } = await response.json();
            updateData.ai_insight = insight;
          }
        }
      }

      const { error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', transactionId);

      if (error) {
        if (error.message?.includes('column') && error.message?.includes('does not exist')) {
          console.warn('AI fields not available for update, classification not saved to database');
          // Still update local state even if database update fails
          setTransactions(prev => prev.map(t => 
            t.id === transactionId 
              ? { ...t, need_vs_want: needVsWant, mood_at_purchase: mood }
              : t
          ));

          setReceiptTransactions(prev => prev.map(t => 
            t.id === transactionId 
              ? { ...t, need_vs_want: needVsWant, mood_at_purchase: mood }
              : t
          ));

          // Remove from unclassified transactions
          setUnclassifiedTransactions(prev => prev.filter(t => t.id !== transactionId));
          console.log('✅ Transaction classification updated locally (database not updated)');
        } else {
          console.error('Error updating transaction:', error.message);
        }
        return;
      }

      // Update local state
      setTransactions(prev => prev.map(t => 
        t.id === transactionId 
          ? { ...t, need_vs_want: needVsWant, mood_at_purchase: mood, ai_insight: updateData.ai_insight || t.ai_insight }
          : t
      ));

      setReceiptTransactions(prev => prev.map(t => 
        t.id === transactionId 
          ? { ...t, need_vs_want: needVsWant, mood_at_purchase: mood, ai_insight: updateData.ai_insight || t.ai_insight }
          : t
      ));

      // Remove from unclassified transactions
      setUnclassifiedTransactions(prev => prev.filter(t => t.id !== transactionId));

      console.log('✅ Transaction classification updated successfully');
    } catch (error) {
      console.error('Error updating transaction classification:', error);
    }
  };

  // Function to handle transaction deletion
  const handleDeleteTransaction = async (transactionId: string) => {
    if (!user?.id) {
      console.error('No user ID available');
      return;
    }

    if (!confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)
        .eq('user_id', user.id); // Extra security check

      if (error) {
        console.error('Error deleting transaction:', error.message);
        return;
      }

      // Remove from local state
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
      setReceiptTransactions(prev => prev.filter(t => t.id !== transactionId));
      setUnclassifiedTransactions(prev => prev.filter(t => t.id !== transactionId));

      console.log('✅ Transaction deleted successfully');
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  // Function to archive a transaction
  const handleArchiveTransaction = async (transactionId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ archived: true })
        .eq('id', transactionId)
        .eq('user_id', user.id);

      if (error) {
        if (error.message?.includes('column') && error.message?.includes('archived') && error.message?.includes('does not exist')) {
          console.warn('Archive column not available yet. Feature will be available after adding the column.');
          return;
        }
        console.error('Error archiving transaction:', error.message);
        return;
      }

      // Update local state
      setTransactions(prev => prev.map(t => 
        t.id === transactionId ? { ...t, archived: true } : t
      ));
      setReceiptTransactions(prev => prev.map(t => 
        t.id === transactionId ? { ...t, archived: true } : t
      ));
      setUnclassifiedTransactions(prev => prev.map(t => 
        t.id === transactionId ? { ...t, archived: true } : t
      ));

      // Show success animation
      setArchiveSuccess(transactionId);
      setTimeout(() => setArchiveSuccess(null), 2000);

      console.log('✅ Transaction archived successfully');
    } catch (error) {
      console.error('Error archiving transaction:', error);
    }
  };

  // Function to unarchive a transaction
  const handleUnarchiveTransaction = async (transactionId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ archived: false })
        .eq('id', transactionId)
        .eq('user_id', user.id);

      if (error) {
        if (error.message?.includes('column') && error.message?.includes('archived') && error.message?.includes('does not exist')) {
          console.warn('Archive column not available yet. Feature will be available after adding the column.');
          return;
        }
        console.error('Error unarchiving transaction:', error.message);
        return;
      }

      // Update local state
      setTransactions(prev => prev.map(t => 
        t.id === transactionId ? { ...t, archived: false } : t
      ));
      setReceiptTransactions(prev => prev.map(t => 
        t.id === transactionId ? { ...t, archived: false } : t
      ));
      setUnclassifiedTransactions(prev => prev.map(t => 
        t.id === transactionId ? { ...t, archived: false } : t
      ));

      console.log('✅ Transaction unarchived successfully');
    } catch (error) {
      console.error('Error unarchiving transaction:', error);
    }
  };

  useEffect(() => {
    // Pick a welcome message when user logs in (only once per session)
    if (user && !welcomeMessage) {
      const randomIndex = Math.floor(Math.random() * welcomeMessages.length);
      setWelcomeMessage(welcomeMessages[randomIndex]);
    }
  }, [user, welcomeMessage]);

  useEffect(() => {
    setWelcomeMessage(welcomeMessages[currentWelcomeIndex]);
  }, [currentWelcomeIndex]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const scrollToLogging = () => {
    if (loggingRef.current) {
      loggingRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Function to generate ticker items based on user's actual transactions
  const generateTickerItems = (transactions: any[], aiInsights: string[]) => {
    // Calculate spending by merchant
    const merchantSpending = transactions.reduce((acc: any, tx: any) => {
      const merchant = tx.name || 'Unknown';
      acc[merchant] = (acc[merchant] || 0) + Math.abs(tx.amount);
      return acc;
    }, {});

    // Get total spending
    const totalSpending = Object.values(merchantSpending).reduce((sum: number, amount: any) => sum + amount, 0);

    // Get top merchants
    const topMerchants = Object.entries(merchantSpending)
      .sort(([,a]: any, [,b]: any) => b - a)
      .slice(0, 4); // Show top 4 merchants

    const tickerItems: any[] = [];

    // Only show real data - no fake content
    if (topMerchants.length > 0) {
      // Add merchant spending data with icons
      topMerchants.forEach(([merchant, amount]: [string, any]) => {
        const percentage = totalSpending > 0 ? ((amount / totalSpending) * 100).toFixed(1) : 0;
        tickerItems.push({
          type: 'merchant',
          icon: getMerchantLogo(merchant),
          merchant: merchant,
          amount: `$${amount.toFixed(2)}`,
          percentage: `${percentage}%`,
          content: `${merchant}: ${percentage}% of spending ($${amount.toFixed(2)})`
        });
      });
    }

    // Add AI-generated insights (real data only)
    aiInsights.forEach(insight => {
      tickerItems.push({ type: 'stat', content: <span>{insight}</span> });
    });

    // If no data at all, show analytics placeholder
    if (tickerItems.length === 0) {
      tickerItems.push(
        { type: 'stat', content: <span>📊 Analytics will display here once you upload receipts</span> },
        { type: 'stat', content: <span>💡 AI insights and spending patterns coming soon</span> },
        { type: 'stat', content: <span>🏪 Merchant spending percentages will appear here</span> },
        { type: 'stat', content: <span>📈 Real-time financial metrics loading...</span> },
        { type: 'stat', content: <span>🔍 Upload your first receipt to see personalized data</span> },
        { type: 'stat', content: <span>💰 Spending categories and trends will show here</span> }
      );
    }

    return tickerItems;
  };

  const renderContent = () => {
    // Remove global gating: always show dashboard
    switch (activeSection) {
      case 'finances':
        return <FinanceSection />;
      case 'insights':
        return <InsightsSection />;
      case 'roadmap':
        return <RoadmapSection user={user} />;
      case 'dashboard':
        return (
          <div className="min-h-screen">
            {/* Top Bar with Stock Ticker Animation */}
            <div className="w-full rounded-xl bg-white shadow flex items-center px-0 py-0 mb-8 overflow-hidden relative" style={{ height: '56px' }}>
              <div
                className="flex items-center gap-6 whitespace-nowrap animate-ticker text-sm font-medium h-full"
                style={{ 
                  animation: 'ticker 30s linear infinite',
                  background: 'white',
                  minWidth: 'max-content'
                }}
                onMouseEnter={e => (e.currentTarget.style.animationPlayState = 'paused')}
                onMouseLeave={e => (e.currentTarget.style.animationPlayState = 'running')}
              >
                {/* Display dynamic ticker items - duplicate content for seamless loop */}
                {[...Array(8)].map((_, i) => (
                  <React.Fragment key={i}>
                    {generateTickerItems(transactions, aiTickerInsights).map((item, idx) => (
                      <div key={`ticker-item-${i}-${idx}`} className="flex items-center gap-3 px-6 flex-shrink-0">
                        {item.type === 'merchant' ? (
                          <>
                            <span className="w-8 h-8 flex items-center justify-center">{(item as any).icon}</span>
                            <span className="text-gray-700">{item.content}</span>
                          </>
                        ) : (
                          <span className="text-gray-700">{item.content}</span>
                        )}
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
              <style>{`
                @keyframes ticker {
                  0% { transform: translateX(0%); }
                  100% { transform: translateX(-50%); }
                }
                .animate-ticker {
                  will-change: transform;
                  animation-timing-function: linear;
                }
              `}</style>
            </div>

            {/* Database Setup Notice */}
            {!tablesExist && (
              <DatabaseSetupNotice darkMode={darkMode} />
            )}

            {/* Backdrop for expanded card */}
            {isTransactionOverviewExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 backdrop-blur-sm z-40"
                onClick={() => setIsTransactionOverviewExpanded(false)}
              />
            )}

            {/* Main Content: Graph and Sidebar Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 items-stretch">
              {/* Left: Main Graph (spans two columns) */}
              <div className="lg:col-span-2 flex flex-col justify-stretch">
                <div className="bg-white rounded-xl shadow p-6 h-full flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Spending and Mood Over Time</h2>
                  </div>
                  <div className="flex-1 min-h-[450px]">
                    {/* Skeleton loader for chart if loading */}
            {loading ? (
                      <div className="w-full h-64 flex items-center justify-center">
                        <div className="animate-pulse w-full h-48 bg-gray-100 rounded-xl" />
              </div>
                    ) : (
                      <SpendingChart transactions={transactions} />
                    )}
                  </div>
                </div>
              </div>
              {/* Right: Portfolio Summary above Log Mood */}
              <div className="flex flex-col gap-6 h-full justify-stretch">
                {/* Transaction Overview Card (expandable) */}
                <AnimatePresence>
                  {isTransactionOverviewExpanded && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4"
                      onClick={() => setIsTransactionOverviewExpanded(false)}
                    >
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-6xl max-h-[90vh] overflow-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h2 className="text-2xl font-semibold text-gray-900">Transaction Overview</h2>
                            <p className="text-sm text-gray-500 mt-1">Detailed view of all your transactions and AI insights</p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <select
                              value={archiveFilter}
                              onChange={(e) => setArchiveFilter(e.target.value)}
                              className="text-sm border border-gray-300 rounded px-3 py-2 bg-white text-gray-700"
                            >
                              <option value="all">All Time</option>
                              <option value="archived">Archived</option>
                            </select>
                            <button
                              onClick={() => setIsTransactionOverviewExpanded(false)}
                              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                              title="Close expanded view"
                            >
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        <div className="w-full flex flex-col gap-4 max-h-[600px] overflow-y-auto">
                          {transactions.length === 0 ? (
                            <div className="text-center py-8">
                              <div className="text-gray-400 mb-4">
                                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <p className="text-lg text-gray-500">No transactions yet</p>
                              <p className="text-sm text-gray-400 mt-1">Upload receipts to start tracking your spending</p>
                            </div>
                          ) : (
                            <>
                              {transactions
                                .filter(transaction => {
                                  return archiveFilter === 'archived' 
                                    ? transaction.archived === true 
                                    : transaction.archived !== true;
                                })
                                .map((transaction) => (
                                  <div key={transaction.id} className="border border-gray-300 rounded-lg p-6 bg-gray-50">
                                    {/* Transaction details */}
                                    <div className="mb-4">
                                      <div className="flex items-center justify-between text-base">
                                        <div className="flex items-center gap-4">
                                          <span className="font-semibold text-gray-900">{transaction.name}</span>
                                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                            transaction.need_vs_want === 'Need' 
                                              ? 'bg-blue-100 text-blue-800' 
                                              : transaction.need_vs_want === 'Want'
                                              ? 'bg-orange-100 text-orange-800'
                                              : 'bg-gray-100 text-gray-600'
                                          }`}>
                                            {transaction.need_vs_want || 'Processing...'}
                                          </span>
                                          <span className="font-semibold text-gray-900">${Math.abs(transaction.amount).toFixed(2)}</span>
                                          {transaction.mood_at_purchase && (
                                            <span className="text-sm text-gray-600">
                                              | Mood: {transaction.mood_at_purchase.split(':')[0]}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* AI insight section */}
                                    {transaction.ai_insight && (
                                      <div className="border-t border-gray-200 pt-4">
                                        <div className="text-base font-medium text-gray-800 mb-3">AI Insight:</div>
                                        <div className="text-base text-gray-700 leading-relaxed bg-blue-50 p-4 rounded-lg">
                                          {expandedInsights[transaction.id] ? (
                                            <div>
                                              "{transaction.ai_insight}"
                                              <div className="mt-4 flex gap-3">
                                                <button
                                                  onClick={() => setExpandedInsights(prev => ({ ...prev, [transaction.id]: false }))}
                                                  className="px-4 py-2 bg-white text-black border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                                                >
                                                  Show less
                                                </button>
                                                <button
                                                  onClick={() => transaction.archived ? handleUnarchiveTransaction(transaction.id) : handleArchiveTransaction(transaction.id)}
                                                  className={`px-4 py-2 rounded-lg text-sm ${
                                                    archiveSuccess === transaction.id 
                                                      ? 'bg-green-500 text-white' 
                                                      : 'bg-black text-white hover:bg-gray-800'
                                                  }`}
                                                >
                                                  {archiveSuccess === transaction.id 
                                                    ? 'Successfully archived!' 
                                                    : transaction.archived ? 'Unarchive' : 'Archive'
                                                  }
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <div>
                                              "{transaction.ai_insight.split('.')[0]}..."
                                              <div className="mt-4 flex gap-3">
                                                <button
                                                  onClick={() => setExpandedInsights(prev => ({ ...prev, [transaction.id]: true }))}
                                                  className="px-4 py-2 bg-white text-black border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                                                >
                                                  View more details
                                                </button>
                                                <button
                                                  onClick={() => transaction.archived ? handleUnarchiveTransaction(transaction.id) : handleArchiveTransaction(transaction.id)}
                                                  className={`px-4 py-2 rounded-lg text-sm ${
                                                    archiveSuccess === transaction.id 
                                                      ? 'bg-green-500 text-white' 
                                                      : 'bg-black text-white hover:bg-gray-800'
                                                  }`}
                                                >
                                                  {archiveSuccess === transaction.id 
                                                    ? 'Successfully archived!' 
                                                    : transaction.archived ? 'Unarchive' : 'Archive'
                                                  }
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Processing state */}
                                    {!transaction.ai_insight && transaction.need_vs_want && (
                                      <div className="border-t border-gray-200 pt-4">
                                        <div className="text-base text-yellow-700 bg-yellow-50 p-4 rounded-lg">
                                          AI insight is being generated...
                                          <div className="mt-4">
                                            <button
                                              onClick={() => transaction.archived ? handleUnarchiveTransaction(transaction.id) : handleArchiveTransaction(transaction.id)}
                                              className={`px-4 py-2 rounded-lg text-sm ${
                                                archiveSuccess === transaction.id ? "bg-green-500 text-white" : "bg-black text-white hover:bg-gray-800" 
                                              }`}
                                            >
                                              {transaction.archived ? 'Unarchive' : 'Archive'}
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* No insight/classification state */}
                                    {!transaction.ai_insight && !transaction.need_vs_want && (
                                      <div className="border-t border-gray-200 pt-4">
                                        <button
                                          onClick={() => transaction.archived ? handleUnarchiveTransaction(transaction.id) : handleArchiveTransaction(transaction.id)}
                                          className={`px-4 py-2 rounded-lg text-sm ${
                                            archiveSuccess === transaction.id ? "bg-green-500 text-white" : "bg-black text-white hover:bg-gray-800" 
                                          }`}
                                        >
                                          {transaction.archived ? 'Unarchive' : 'Archive'}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              
                              {transactions
                                .filter(transaction => {
                                  return archiveFilter === 'archived' 
                                    ? transaction.archived === true 
                                    : transaction.archived !== true;
                                }).length === 0 && (
                                  <div className="text-center py-8">
                                    <p className="text-lg text-gray-500">
                                      {archiveFilter === 'archived' ? 'No archived transactions' : 'No transactions yet'}
                                    </p>
                                  </div>
                                )}
                            </>
                          )}
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Regular Transaction Overview Card */}
                <motion.div 
                  className="bg-white rounded-xl border border-gray-200 p-6 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setIsTransactionOverviewExpanded(true)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold text-gray-900">Transaction Overview</h3>
                    <div className="flex items-center gap-2">
                      <select
                        value={archiveFilter}
                        onChange={(e) => {
                          e.stopPropagation();
                          setArchiveFilter(e.target.value);
                        }}
                        className="text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="all">All Time</option>
                        <option value="archived">Archived</option>
                      </select>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                        title="Expand transactions"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsTransactionOverviewExpanded(true);
                        }}
                      >
                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                      </motion.button>
                    </div>
                  </div>

                  {/* Compact Content */}
                  <div className="w-full flex flex-col gap-3 max-h-48 overflow-y-auto">
                    {transactions.length === 0 ? (
                      <div className="text-center py-4">
                        <div className="text-gray-400 mb-2">
                          <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-500">No transactions yet</p>
                        <p className="text-xs text-gray-400 mt-1">Upload receipts to start tracking</p>
                      </div>
                    ) : (
                      <>
                        {/* Show only 2 transactions when collapsed */}
                        {transactions
                          .filter(transaction => {
                            return archiveFilter === 'archived' 
                              ? transaction.archived === true 
                              : transaction.archived !== true;
                          })
                          .slice(0, 2)
                          .map((transaction) => (
                            <div key={transaction.id} className="border border-gray-300 rounded-lg p-4 bg-gray-50" onClick={(e) => e.stopPropagation()}>
                              <div className="mb-3">
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-3">
                                    <span className="font-medium text-gray-900">{transaction.name}</span>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                      transaction.need_vs_want === 'Need' 
                                        ? 'bg-blue-100 text-blue-800' 
                                        : transaction.need_vs_want === 'Want'
                                        ? 'bg-orange-100 text-orange-800'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {transaction.need_vs_want || 'Processing...'}
                                    </span>
                                    <span className="font-medium text-gray-900">${Math.abs(transaction.amount).toFixed(2)}</span>
                                    {transaction.mood_at_purchase && (
                                      <span className="text-sm text-gray-600">
                                        | Mood: {transaction.mood_at_purchase.split(':')[0]}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Show AI insight if available */}
                              {transaction.ai_insight && (
                                <div className="border-t border-gray-200 pt-3">
                                  <div className="text-sm font-medium text-gray-800 mb-2">AI Insight:</div>
                                  <div className="text-sm text-gray-700 leading-relaxed bg-blue-50 p-3 rounded-lg">
                                    {expandedInsights[transaction.id] ? (
                                      <div>
                                        "{transaction.ai_insight}"
                                        <div className="mt-3 flex gap-2">
                                          <button
                                            onClick={() => setExpandedInsights(prev => ({ ...prev, [transaction.id]: false }))}
                                            className="px-3 py-1 bg-white text-black border border-gray-300 rounded text-xs hover:bg-gray-50"
                                          >
                                            Show less
                                          </button>
                                          <button
                                            onClick={() => transaction.archived ? handleUnarchiveTransaction(transaction.id) : handleArchiveTransaction(transaction.id)}
                                            className={`px-3 py-1 rounded text-xs ${
                                              archiveSuccess === transaction.id 
                                                ? 'bg-green-500 text-white' 
                                                : 'bg-black text-white hover:bg-gray-800'
                                            }`}
                                          >
                                            {archiveSuccess === transaction.id 
                                              ? 'Successfully archived!' 
                                              : transaction.archived ? 'Unarchive' : 'Archive'
                                            }
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div>
                                        "{transaction.ai_insight.split('.')[0]}..."
                                        <div className="mt-3 flex gap-2">
                                          <button
                                            onClick={() => setExpandedInsights(prev => ({ ...prev, [transaction.id]: true }))}
                                            className="px-3 py-1 bg-white text-black border border-gray-300 rounded text-xs hover:bg-gray-50"
                                          >
                                            View more details
                                          </button>
                                          <button
                                            onClick={() => transaction.archived ? handleUnarchiveTransaction(transaction.id) : handleArchiveTransaction(transaction.id)}
                                            className={`px-3 py-1 rounded text-xs ${
                                              archiveSuccess === transaction.id 
                                                ? 'bg-green-500 text-white' 
                                                : 'bg-black text-white hover:bg-gray-800'
                                            }`}
                                          >
                                            {archiveSuccess === transaction.id 
                                              ? 'Successfully archived!' 
                                              : transaction.archived ? 'Unarchive' : 'Archive'
                                            }
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {/* Processing state */}
                              {!transaction.ai_insight && transaction.need_vs_want && (
                                <div className="border-t border-gray-200 pt-3">
                                  <div className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg">
                                    AI insight is being generated...
                                    <div className="mt-3">
                                      <button
                                        onClick={() => transaction.archived ? handleUnarchiveTransaction(transaction.id) : handleArchiveTransaction(transaction.id)}
                                        className={`px-3 py-1 rounded text-xs ${
                                          archiveSuccess === transaction.id ? "bg-green-500 text-white" : "bg-black text-white hover:bg-gray-800" 
                                        }`}
                                      >
                                        {transaction.archived ? 'Unarchive' : 'Archive'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* No insight/classification state */}
                              {!transaction.ai_insight && !transaction.need_vs_want && (
                                <div className="border-t border-gray-200 pt-3">
                                  <button
                                    onClick={() => transaction.archived ? handleUnarchiveTransaction(transaction.id) : handleArchiveTransaction(transaction.id)}
                                    className={`px-3 py-1 rounded text-xs ${
                                      archiveSuccess === transaction.id ? "bg-green-500 text-white" : "bg-black text-white hover:bg-gray-800" 
                                    }`}
                                  >
                                    {transaction.archived ? 'Unarchive' : 'Archive'}
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        
                        {transactions
                          .filter(transaction => {
                            return archiveFilter === 'archived' 
                              ? transaction.archived === true 
                              : transaction.archived !== true;
                          }).length === 0 && (
                            <div className="text-center py-2">
                              <p className="text-sm text-gray-500">
                                {archiveFilter === 'archived' ? 'No archived transactions' : 'No transactions yet'}
                              </p>
                            </div>
                          )}
                      </>
                    )}
                  </div>
                </motion.div>
                {/* Financial Stress Analysis Card */}
                <div className="bg-white rounded-xl shadow p-6 flex flex-col items-start w-full min-h-[180px] justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Financial Stress Analysis
                  </h3>
                  
                  <div className="w-full">
                    <div className="flex items-start mb-3 w-full justify-between">
                      <span className="text-4xl font-bold text-gray-900">18%</span>
                      <span className="flex items-center text-base font-medium text-gray-700 mt-1">
                        <span className="w-3 h-3 rounded-full bg-green-400 mr-2"></span>
                        Low Stress
                      </span>
                    </div>
                    
                    {/* Stress Analysis */}
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Your spending patterns show consistent behavior. Transaction frequency and category distribution indicate stable financial habits.
                      </p>
                    </div>
                    
                    {/* Stress Indicators */}
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-green-800">
                        Stress Indicators:
                      </p>
                      <div className="text-sm text-green-700 mt-1 space-y-1">
                        <div className="flex justify-between">
                          <span>• Category concentration:</span>
                          <span className="font-medium">67%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>• Transaction frequency:</span>
                          <span className="font-medium">4.2/week</span>
                        </div>
                        <div className="flex justify-between">
                          <span>• Spending consistency:</span>
                          <span className="font-medium">High</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Transactions</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowReceiptUpload(true)}
                    className="inline-flex items-center px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Upload Receipt
                  </button>
                  <input type="text" placeholder="Search transactions..." className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                  <button className="ml-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 text-gray-600 text-sm flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 5h18M4 9v10a1 1 0 001 1h14a1 1 0 001-1V9" /></svg>
                    Filter
                  </button>
                </div>
              </div>
              
              {/* Receipt Upload Section */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FaReceipt className="text-gray-600" size={20} />
                    <div>
                      <h3 className="font-medium text-gray-900">Receipt Upload & Analysis</h3>
                      <p className="text-sm text-gray-600">Upload receipt photos to automatically track spending with AI analysis</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 font-medium">
                    {receiptTransactions.length} receipts uploaded
                  </div>
                </div>
              </div>

              {/* Transactions table */}
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <FaReceipt className="text-gray-400 mb-4" size={48} />
                  <p className="text-lg text-gray-500 mb-2">No transactions yet</p>
                  <p className="text-sm text-gray-400 mb-4">Upload receipts using the "Upload Receipt" button in the chart above to start tracking your spending</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-gray-500">
                        <th className="py-2 px-4 text-left">Merchant</th>
                        <th className="py-2 px-4 text-right">Amount</th>
                        <th className="py-2 px-4 text-left">Category</th>
                        <th className="py-2 px-4 text-left">Classification</th>
                        <th className="py-2 px-4 text-left">Mood</th>
                        <th className="py-2 px-4 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx, index) => (
                        <tr key={tx.transaction_id || tx.id || `tx-${index}`} className="hover:bg-gray-50 transition">
                          <td className="py-2 px-4 flex items-center gap-3">
                            {/* Merchant logo */}
                            <span className="w-7 h-7 flex items-center justify-center">{getMerchantLogo(tx.name)}</span>
                            <div>
                              <div className="font-semibold text-gray-900">{tx.name}</div>
                              <div className="text-xs text-gray-500">{Array.isArray(tx.category) ? tx.category[0] : tx.category}</div>
                            </div>
                          </td>
                          <td className={`py-2 px-4 text-right font-semibold text-red-600`}>${Math.abs(tx.amount).toFixed(2)}</td>
                          <td className="py-2 px-4">{Array.isArray(tx.category) ? tx.category[0] : tx.category}</td>
                          <td className="py-2 px-4">
                            {tx.need_vs_want ? (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                tx.need_vs_want === 'Need' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-orange-100 text-orange-800'
                              }`}>
                                {tx.need_vs_want}
                              </span>
                            ) : tx.source === 'receipt' ? (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                Pending
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          <td className="py-2 px-4">
                            {tx.mood_at_purchase ? (
                              <span className="text-sm text-gray-700">
                                {tx.mood_at_purchase.split(':')[0]}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">No mood logged</span>
                            )}
                          </td>
                          <td className="py-2 px-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-900">{format(new Date(tx.date), 'MMM d, yyyy')}</span>
                              <button
                                onClick={() => handleDeleteTransaction(tx.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors opacity-60 hover:opacity-100 ml-2"
                                title="Delete transaction"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H9a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return <div className="p-4">Coming soon...</div>;
    }
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'insights', label: 'Insights', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'roadmap', label: 'Calendar', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
    { id: 'finances', label: 'Finances', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'wellness', label: 'Wellness', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  ];

  // Function to fetch AI-generated ticker insights
  const fetchAiTickerInsights = useCallback(async () => {
    try {
      const recentTransactions = transactions.slice(0, 10); // Last 10 transactions
      const response = await fetch('/api/generate-ticker-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: recentTransactions,
          recentMoods: [7, 6, 8, 7, 5], // Mock mood data for now
          timeframe: '7d'
        })
      });

      if (response.ok) {
        const { insights } = await response.json();
        setAiTickerInsights(insights);
      }
    } catch (error) {
      console.error('Error fetching AI ticker insights:', error);
    }
  }, [transactions]);

  // Function to fetch AI-generated mood insights
  const fetchAiForecastData = useCallback(async () => {
    try {
      const recentTransactions = transactions.slice(0, 5); // Last 5 transactions
      const response = await fetch('/api/generate-mood-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentMood: 7, // Mock current mood for now
          recentMoods: [7, 6, 8, 7, 5], // Mock mood history
          recentTransactions: recentTransactions,
          spendingPatterns: {}
        })
      });

      if (response.ok) {
        const { forecastData } = await response.json();
        setAiForecastData(forecastData);
      }
    } catch (error) {
      console.error('Error fetching AI forecast data:', error);
    }
  }, [transactions]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Check if database tables exist
  useEffect(() => {
    if (!user) return;

    const checkTablesExist = async () => {
      try {
        // Try a simple query to check if tables exist
        const { error: moodError } = await supabase
          .from('mood_logs')
          .select('id')
          .limit(1);

        const { error: spendingError } = await supabase
          .from('spending_logs')
          .select('id')
          .limit(1);

        const { error: transactionError } = await supabase
          .from('transactions')
          .select('id')
          .limit(1);

        // If any table doesn't exist, set tablesExist to false
        if (
          moodError?.message?.includes('relation') ||
          spendingError?.message?.includes('relation') ||
          transactionError?.message?.includes('relation')
        ) {
          setTablesExist(false);
          console.warn('Database tables not found. Please create them using the SQL in SUPABASE_SETUP.md');
        } else {
          setTablesExist(true);
          console.log('Database tables verified successfully');
        }
      } catch (error) {
        console.warn('Could not verify database tables:', error);
        setTablesExist(false);
      }
    };

    checkTablesExist();
  }, [user, supabase]);

  // Fetch transactions from Supabase
  useEffect(() => {
    const fetchTransactionsFromSupabase = async () => {
      if (!user) return;
      
      try {
        setTransactionsLoading(true);
        
        // Start with the most basic fields that should always exist
        let data: any[] = [];
        let querySuccess = false;
        
        // Try minimal query first (core fields only)
        try {
          console.log('🔍 Trying minimal query...');
          const minimalQuery = await supabase
            .from('transactions')
            .select('id, user_id, name, amount, date, category, created_at, updated_at')
            .eq('user_id', user.id)
            .order('date', { ascending: false });
            
          if (minimalQuery.error) {
            console.error('❌ Minimal query failed:', minimalQuery.error.message);
          } else {
            console.log('✅ Minimal query successful');
            data = minimalQuery.data || [];
            querySuccess = true;
          }
        } catch (minimalError) {
          console.error('❌ Minimal query exception:', minimalError);
        }
        
        if (!querySuccess) {
          // If even minimal query fails, try with just the absolute essentials
          try {
            console.log('🔍 Trying ultra-minimal query...');
            const ultraMinimalQuery = await supabase
              .from('transactions')
              .select('id, name, amount, date')
              .eq('user_id', user.id)
              .order('date', { ascending: false });
              
            if (ultraMinimalQuery.error) {
              console.error('❌ Ultra-minimal query failed:', ultraMinimalQuery.error.message);
              setTransactionsLoading(false);
              setTransactions([]);
              setReceiptTransactions([]);
              setUnclassifiedTransactions([]);
              return;
            } else {
              console.log('✅ Ultra-minimal query successful');
              data = ultraMinimalQuery.data || [];
              querySuccess = true;
            }
          } catch (ultraMinimalError) {
            console.error('❌ Ultra-minimal query exception:', ultraMinimalError);
            setTransactionsLoading(false);
            setTransactions([]);
            setReceiptTransactions([]);
            setUnclassifiedTransactions([]);
            return;
          }
        }
        
        // Try to add receipt-specific fields if they exist
        if (querySuccess) {
          try {
            console.log('🔍 Trying extended query (receipt fields)...');
            const extendedQuery = await supabase
              .from('transactions')
              .select('id, user_id, name, amount, date, category, source, confidence, items, file_name, created_at, updated_at')
              .eq('user_id', user.id)
              .order('date', { ascending: false });
              
            if (!extendedQuery.error) {
              console.log('✅ Receipt fields available');
              data = extendedQuery.data || [];
            } else {
              console.warn('⚠️ Receipt fields not available, using minimal data:', extendedQuery.error.message);
            }
          } catch (extendedError) {
            console.warn('⚠️ Receipt fields not available, using minimal data (exception):', extendedError);
          }
        }
        
        // Try to add AI fields if they exist
        if (querySuccess) {
          try {
            console.log('🔍 Trying full query (AI fields)...');
            const fullQuery = await supabase
              .from('transactions')
              .select('id, user_id, name, amount, date, category, source, confidence, items, file_name, need_vs_want, mood_at_purchase, ai_insight, created_at, updated_at')
              .eq('user_id', user.id)
              .order('date', { ascending: false });
              
            if (!fullQuery.error) {
              console.log('✅ AI fields available');
              data = fullQuery.data || [];
            } else {
              console.warn('⚠️ AI fields not available:', fullQuery.error.message);
            }
          } catch (fullQueryError) {
            console.warn('⚠️ AI fields not available (exception):', fullQueryError);
          }
        }

        if (data && data.length > 0) {
          console.log('🔍 Raw transaction data from DB:', data.slice(0, 2)); // Log first 2 transactions
          
          const transactionsData = data.map((tx: any) => ({
            transaction_id: tx.id,
            id: tx.id,
            name: tx.name,
            date: tx.date,
            amount: tx.amount,
            category: tx.category || [],
            source: tx.source || 'manual',
            confidence: tx.confidence || 1.0,
            need_vs_want: tx.need_vs_want || null,
            mood_at_purchase: tx.mood_at_purchase || null,
            ai_insight: tx.ai_insight || null,
            archived: false // Default to false since column doesn't exist yet
          }));
          
          console.log('🔍 Processed transactions with AI insights:', 
            transactionsData.filter((tx: any) => tx.ai_insight).length + '/' + transactionsData.length
          );
          
          setTransactions(transactionsData);
          setReceiptTransactions(transactionsData.filter((tx: any) => tx.source === 'receipt'));
          
          // Set unclassified transactions (those without need_vs_want classification)
          setUnclassifiedTransactions(
            transactionsData.filter((tx: any) => tx.source === 'receipt' && !tx.need_vs_want)
          );
        } else {
          console.log('📝 No transaction data found');
          setTransactions([]);
          setReceiptTransactions([]);
          setUnclassifiedTransactions([]);
        }
        
        setTransactionsLoading(false);
      } catch (error) {
        // Silent error handling for unexpected errors
        console.warn('❌ Unexpected error fetching transactions:', error);
        setTransactionsLoading(false);
        setTransactions([]);
        setReceiptTransactions([]);
        setUnclassifiedTransactions([]);
      }
    };
    
    fetchTransactionsFromSupabase();
  }, [user, supabase]);

  // Fetch AI insights when transactions change
  useEffect(() => {
    if (transactions.length > 0) {
      fetchAiTickerInsights();
    }
  }, [transactions.length, fetchAiTickerInsights]);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'} flex`}>
      {/* Sidebar */}
      <div className={`w-64 ${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-r sticky top-0 h-screen overflow-y-auto`}>
        <div className="p-3">
          <div className="flex items-center">
            <span className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Klyro</span>
          </div>
        </div>
        <nav className="mt-8">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                activeSection === item.id
                  ? 'text-gray-900'
                  : darkMode 
                    ? 'text-gray-400 hover:text-gray-300' 
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg
                className={`w-5 h-5 transition-all duration-200 ${
                  activeSection === item.id ? 'text-gray-900' : darkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-600 group-hover:text-gray-900'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d={item.icon}
                />
              </svg>
              <span className="group-hover:drop-shadow-[0_0_4px_rgba(75,85,99,0.5)]">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <header className={`${darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-b sticky top-0 z-10`}>
          <div className="px-8 py-6 flex items-center justify-between">
            <h1 className={`text-lg ${welcomeMessage.style} leading-relaxed ${darkMode ? 'text-gray-300' : ''}`}>
              {welcomeMessage.text.replace('{name}', user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there')}
            </h1>
            <div className="flex items-center space-x-4">
              <button className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <div className="relative" ref={settingsRef}>
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className={`absolute right-0 mt-2 w-48 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg shadow-lg border py-1 z-50`}
                    >
                      <button
                        onClick={() => {
                          // Handle profile click
                          setShowSettings(false);
                          setShowProfile(true);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} flex items-center`}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile
                      </button>
                      <button
                        onClick={toggleDarkMode}
                        className={`w-full px-4 py-2 text-left text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} flex items-center`}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                        {darkMode ? 'Light Mode' : 'Dark Mode'}
                      </button>
                      <button
                        onClick={() => {
                          // Handle notifications click
                          setShowSettings(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} flex items-center`}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        Notifications
                      </button>
                      <button
                        onClick={() => {
                          // Handle help click
                          setShowSettings(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} flex items-center`}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Help & Support
                      </button>
                      <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} my-1`}></div>
                      <button
                        onClick={async () => {
                          await signOut();
                          setShowSettings(false);
                          router.push('/');
                        }}
                        className={`w-full px-4 py-2 text-left text-sm ${darkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-gray-100'} flex items-center`}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className={`h-6 w-px ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
            </div>
          </div>
        </header>
        <div className={`p-8 ${darkMode ? 'bg-gray-900' : 'bg-white'} min-h-screen`}>
          {renderContent()}
        </div>
      </div>

      {/* Receipt Upload Modal */}
      <ReceiptUpload
        onReceiptAnalyzed={handleReceiptAnalyzed}
        darkMode={darkMode}
        onClose={() => setShowReceiptUpload(false)}
        isOpen={showReceiptUpload}
      />

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfile && (
          <ProfileModal
            user={user}
            darkMode={darkMode}
            onClose={() => setShowProfile(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function getCategoryColor(category: string | string[]): string {
  // Simple color mapping for demo; expand as needed
  const colors: { [key: string]: string } = {
    'Coffee Shop': '#F59E42',
    'Groceries': '#34D399',
    'Transport': '#60A5FA',
    'Subscription': '#A78BFA',
    'Shopping': '#F472B6',
    'default': '#9CA3AF'
  };
  if (Array.isArray(category)) category = category[0];
  return colors[category] || colors['default'];
}

