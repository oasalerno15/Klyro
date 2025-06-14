'use client';

export default function FinanceSection() {
  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Finance Section Coming Soon</h2>
          <p className="text-gray-600">We're working on bringing you the best financial tools and insights. Stay tuned!</p>
        </div>
      </div>
    </div>
  );
} 