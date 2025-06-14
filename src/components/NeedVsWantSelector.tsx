'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface NeedVsWantSelectorProps {
  transaction: {
    id: string;
    name: string;
    amount: number;
    category: string[];
    needVsWant?: string | null;
    aiInsight?: string | null;
  };
  onUpdate: (transactionId: string, needVsWant: string, mood?: string) => void;
}

const moodOptions = [
  'Happy',
  'Neutral', 
  'Stressed',
  'Excited',
  'Sad',
  'Anxious'
];

export default function NeedVsWantSelector({ transaction, onUpdate }: NeedVsWantSelectorProps) {
  const [selectedNeedVsWant, setSelectedNeedVsWant] = useState<string | null>(transaction.needVsWant || null);
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [showMoodInput, setShowMoodInput] = useState(false);
  const [moodReason, setMoodReason] = useState('');
  const [showReason, setShowReason] = useState(false);

  const handleNeedVsWantSelect = (selection: string) => {
    setSelectedNeedVsWant(selection);
    // Always show mood input after classification (for both Need and Want)
    setShowMoodInput(true);
  };

  const handleMoodSubmit = () => {
    if (selectedMood && showReason && moodReason.trim()) {
      onUpdate(transaction.id, selectedNeedVsWant!, `${selectedMood}: ${moodReason.trim()}`);
      setShowMoodInput(false);
      setShowReason(false);
    } else if (selectedMood && !showReason) {
      setShowReason(true);
    }
  };

  if (selectedNeedVsWant && !showMoodInput) {
    // Show the result with AI insight
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Classification:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            selectedNeedVsWant === 'Need' 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-orange-100 text-orange-800'
          }`}>
            {selectedNeedVsWant}
          </span>
        </div>
        
        {transaction.aiInsight && (
          <div className="mt-3 p-3 bg-white rounded border border-gray-100">
            <p className="text-sm text-gray-600 leading-relaxed">
              {transaction.aiInsight}
            </p>
          </div>
        )}
        
        <button
          onClick={() => {
            setSelectedNeedVsWant(null);
            setShowMoodInput(false);
            setShowReason(false);
            setSelectedMood('');
            setMoodReason('');
          }}
          className="mt-3 text-xs text-gray-500 hover:text-gray-700 underline"
        >
          Change classification
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
      {!selectedNeedVsWant && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Was this purchase a Need or Want?
          </h4>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNeedVsWantSelect('Need')}
              className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Need
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNeedVsWantSelect('Want')}
              className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
            >
              Want
            </motion.button>
          </div>
        </div>
      )}

      {showMoodInput && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4"
        >
          {!showReason && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                How did you feel when making this purchase?
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {moodOptions.map((mood) => (
                  <button
                    key={mood}
                    onClick={() => setSelectedMood(mood)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedMood === mood
                        ? 'bg-purple-500 text-white'
                        : 'bg-white hover:bg-purple-50 text-gray-700 border border-gray-200'
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
              {selectedMood && (
                <button
                  onClick={handleMoodSubmit}
                  className="mt-3 w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                >
                  Continue
                </button>
              )}
            </div>
          )}

          {showReason && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Tell us more about how you were feeling and why you made this purchase:
              </h4>
              <textarea
                value={moodReason}
                onChange={(e) => setMoodReason(e.target.value)}
                placeholder={selectedNeedVsWant === 'Want' 
                  ? "I was feeling stressed about work and wanted something to cheer me up..."
                  : "I was running low on groceries and needed to restock for the week..."
                }
                className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-200"
                rows={3}
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    setShowReason(false);
                    setSelectedMood('');
                  }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleMoodSubmit}
                  disabled={!moodReason.trim()}
                  className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  Submit
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
} 