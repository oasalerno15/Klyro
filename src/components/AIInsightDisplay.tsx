'use client';

import { useState } from 'react';

interface AIInsightDisplayProps {
  insight: string;
}

export default function AIInsightDisplay({ insight }: AIInsightDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract the most important sentence (usually the first sentence or main point)
  const extractKeySentence = (text: string): string => {
    // Remove quotes if they exist
    const cleanText = text.replace(/^"|"$/g, '');
    
    // Split by periods and find the most meaningful sentence
    const sentences = cleanText.split('.').map(s => s.trim()).filter(s => s.length > 0);
    
    // Look for sentences with key words that indicate the main point
    const keyWords = ['reflection:', 'seems like', 'shows', 'indicates', 'suggests', 'reveals'];
    const mainSentence = sentences.find(sentence => 
      keyWords.some(keyword => sentence.toLowerCase().includes(keyword))
    );
    
    // If we found a key sentence, return it, otherwise return the first sentence
    return mainSentence || sentences[0] || cleanText;
  };

  const keySentence = extractKeySentence(insight);
  const hasMoreContent = insight.length > keySentence.length + 20; // Check if there's significantly more content

  return (
    <div className="text-sm text-gray-700 leading-relaxed bg-blue-50 p-3 rounded-lg">
      <div>
        "{isExpanded ? insight : keySentence}"
        {!isExpanded && hasMoreContent && '...'}
      </div>
      
      {hasMoreContent && (
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center px-3 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-black text-xs font-medium rounded-md transition-colors"
          >
            {isExpanded ? (
              <>
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                Show less
              </>
            ) : (
              <>
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                View more details
              </>
            )}
          </button>
          <button className="inline-flex items-center px-3 py-1 bg-black hover:bg-gray-800 text-white text-xs font-medium rounded-md transition-colors">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6 6-6" />
            </svg>
            Archive
          </button>
        </div>
      )}
    </div>
  );
} 