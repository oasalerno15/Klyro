'use client';

import { useState } from 'react';

interface StockSearchProps {
  onSymbolSelect: (symbol: string) => void;
  className?: string;
}

const marketCategories = {
  'Popular Tech': ['AAPL', 'GOOGL', 'MSFT', 'META', 'AMZN'],
  'Electric Vehicles': ['TSLA', 'RIVN', 'LCID', 'NIO'],
  'Crypto & Blockchain': ['COIN', 'MSTR', 'RIOT', 'MARA'],
  'AI & Semiconductors': ['NVDA', 'AMD', 'INTC', 'MU'],
  'Social Media': ['META', 'SNAP', 'PINS', 'TWTR']
};

const StockSearch = ({ onSymbolSelect, className = '' }: StockSearchProps) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Popular Tech');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      onSymbolSelect(search.toUpperCase());
      setSearch('');
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex gap-4 items-center">
        <form onSubmit={handleSubmit} className="flex gap-2 w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder="Search ticker..."
            className="w-full px-3 py-1.5 bg-emerald-900/20 border border-emerald-600/20 rounded-lg 
                     text-emerald-100 placeholder-emerald-300/50 focus:outline-none 
                     focus:ring-2 focus:ring-emerald-500/30 text-sm"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-emerald-50 
                     rounded-lg transition-colors duration-200 text-sm"
          >
            Go
          </button>
        </form>

        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-3 py-1.5 bg-emerald-900/20 border border-emerald-600/20 rounded-lg 
                     text-emerald-100 hover:bg-emerald-800/30 transition-colors duration-200 text-sm
                     flex items-center gap-2"
          >
            {selectedCategory}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-emerald-900/95 
                      border border-emerald-700/30 rounded-lg shadow-xl z-10">
          <div className="p-2">
            {Object.entries(marketCategories).map(([category, symbols]) => (
              <div key={category} className="mb-2">
                <button
                  onClick={() => {
                    setSelectedCategory(category);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-emerald-800/50 rounded 
                           text-emerald-100 text-sm font-medium"
                >
                  {category}
                </button>
                {selectedCategory === category && (
                  <div className="grid grid-cols-2 gap-1 px-2 mt-1">
                    {symbols.map((symbol) => (
                      <button
                        key={symbol}
                        onClick={() => {
                          onSymbolSelect(symbol);
                          setIsOpen(false);
                        }}
                        className="text-left px-2 py-1 hover:bg-emerald-800/30 rounded 
                                 text-emerald-300/70 text-sm"
                      >
                        {symbol}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StockSearch; 