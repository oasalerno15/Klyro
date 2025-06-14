import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Transaction } from '@/types/transactions';
import { useAuth } from '@/lib/auth';

export default function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    async function fetchReceiptTransactions() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('source', 'receipt')
          .order('date', { ascending: false })
          .limit(20);

        if (error) {
          if (error.message?.includes('relation "transactions" does not exist')) {
            console.warn('Transactions table does not exist yet. Please run the database setup script.');
            setTransactions([]);
            return;
          }
          throw error;
        }

        setTransactions(data || []);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load transactions');
      } finally {
        setLoading(false);
      }
    }

    fetchReceiptTransactions();
  }, [user, supabase]);

  // Helper to get merchant icon
  const merchantIcons: Record<string, string> = {
    'Starbucks': 'https://logo.clearbit.com/starbucks.com',
    'Whole Foods': 'https://logo.clearbit.com/wholefoodsmarket.com',
    'Target': 'https://logo.clearbit.com/target.com',
    'Amazon': 'https://logo.clearbit.com/amazon.com',
    'Walmart': 'https://logo.clearbit.com/walmart.com',
    'Costco': 'https://logo.clearbit.com/costco.com',
    'CVS': 'https://logo.clearbit.com/cvs.com',
    'McDonald\'s': 'https://logo.clearbit.com/mcdonalds.com',
    'Subway': 'https://logo.clearbit.com/subway.com',
  };

  function getMerchantIcon(name: string) {
    const cleanName = name?.split(' ')[0] || '';
    return merchantIcons[cleanName] || `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=10b981&color=fff&size=40`;
  }

  function formatCategory(category: string[] | string) {
    if (Array.isArray(category)) return category[0] || 'General';
    return category || 'General';
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: new Date(date).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  }

  function getConfidenceColor(confidence?: number) {
    if (!confidence) return 'bg-gray-100 text-gray-600';
    if (confidence >= 0.9) return 'bg-green-100 text-green-700';
    if (confidence >= 0.7) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-600">
          <h3 className="font-semibold mb-2">Error loading transactions</h3>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">Please log in to view your transactions</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Receipt Transactions</h2>
        <p className="text-sm text-gray-600 mt-1">
          {transactions.length > 0 
            ? `${transactions.length} receipt${transactions.length === 1 ? '' : 's'} processed`
            : 'No receipts uploaded yet'
          }
        </p>
      </div>
      
      <div className="p-6">
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No receipts yet</h3>
            <p className="text-gray-500">Upload a receipt to get started with tracking your spending!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <img
                    src={getMerchantIcon(transaction.name)}
                    alt={transaction.name}
                    className="h-10 w-10 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(transaction.name)}&background=10b981&color=fff&size=40`;
                    }}
                  />
                  <div>
                    <div className="font-medium text-gray-900">{transaction.name}</div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>{formatCategory(transaction.category)}</span>
                      <span>•</span>
                      <span>{formatDate(transaction.date)}</span>
                      {transaction.confidence && (
                        <>
                          <span>•</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${getConfidenceColor(transaction.confidence)}`}>
                            {Math.round(transaction.confidence * 100)}% confident
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    ${Math.abs(transaction.amount).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {transaction.source === 'receipt' ? '📄 Receipt' : transaction.source}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 