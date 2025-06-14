'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface StockQuote {
  c: number;  // Current price
  h: number;  // High price of the day
  l: number;  // Low price of the day
  o: number;  // Open price of the day
  pc: number; // Previous close price
  t: number;  // Timestamp
}

export default function StockPrice() {
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        const response = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=AAPL&token=${process.env.NEXT_PUBLIC_FINNHUB_API_KEY}`,
          { cache: 'no-store' }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch stock data');
        }

        const data = await response.json();
        setQuote(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    };

    fetchStockData();
    // Refresh data every minute
    const interval = setInterval(fetchStockData, 60000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        Error: {error}
      </div>
    );
  }

  if (!quote) {
    return null;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const priceChange = quote.c - quote.pc;
  const priceChangePercent = (priceChange / quote.pc) * 100;
  const isPositive = priceChange >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full hover:shadow-green-500/20 hover:shadow-xl transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">AAPL</h2>
        <span className="text-sm text-gray-500">Apple Inc.</span>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">
              {formatPrice(quote.c)}
            </span>
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`text-sm font-semibold ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {isPositive ? '+' : ''}{formatPrice(priceChange)} ({priceChangePercent.toFixed(2)}%)
            </motion.span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div>
            <p className="text-sm text-gray-500">Today's High</p>
            <p className="text-lg font-semibold text-gray-900">{formatPrice(quote.h)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Today's Low</p>
            <p className="text-lg font-semibold text-gray-900">{formatPrice(quote.l)}</p>
          </div>
        </div>

        <div className="text-xs text-gray-400 mt-4">
          Last updated: {new Date(quote.t * 1000).toLocaleTimeString()}
        </div>
      </div>
    </motion.div>
  );
} 