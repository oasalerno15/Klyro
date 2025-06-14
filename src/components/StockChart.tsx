'use client';

import { useEffect } from 'react';

interface StockChartProps {
  symbol?: string;
  theme?: 'light' | 'dark';
}

const StockChart = ({ symbol = 'AAPL', theme = 'dark' }: StockChartProps) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      "symbol": symbol,
      "width": "100%",
      "height": "100%",
      "locale": "en",
      "dateRange": "1D",
      "colorTheme": theme,
      "isTransparent": true,
      "autosize": true,
      "largeChartUrl": "",
      "chartOnly": false,
      "backgroundColor": "rgba(6, 78, 59, 0.1)"
    });

    const container = document.getElementById('tradingview-widget-container');
    if (container) {
      container.innerHTML = '';
      const div = document.createElement('div');
      div.className = 'tradingview-widget-container__widget';
      container.appendChild(div);
      container.appendChild(script);
    }

    return () => {
      const container = document.getElementById('tradingview-widget-container');
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [symbol, theme]);

  return (
    <div className="w-full h-full bg-white rounded-xl p-4 shadow-lg border border-gray-200/30">
      <div 
        id="tradingview-widget-container" 
        className="w-full aspect-[16/9] md:aspect-[21/9]"
      />
    </div>
  );
};

export default StockChart; 