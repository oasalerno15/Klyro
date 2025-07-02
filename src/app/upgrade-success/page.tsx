'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { planService, type PlanType } from '@/lib/plan-service';

// Separate component that uses useSearchParams
function UpgradeSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [planName, setPlanName] = useState<string>('');

  useEffect(() => {
    const updateUserPlan = async () => {
      if (!user) {
        setError('User not authenticated');
        setIsUpdating(false);
        return;
      }

      const plan = searchParams.get('plan') as PlanType;
      
      if (!plan || !['starter', 'pro', 'premium'].includes(plan)) {
        setError('Invalid plan specified');
        setIsUpdating(false);
        return;
      }

      try {
        const updateResult = await planService.updateUserPlan(user.id, plan);
        
        if (updateResult) {
          setSuccess(true);
          setPlanName(planService.getPlanDisplayName(plan));
          
          // Force refresh the plan cache
          await planService.refreshUserPlan(user.id);
          
          // Trigger global refresh event for other components
          window.dispatchEvent(new CustomEvent('refreshSubscriptionData'));
          
          // Also refresh the page to ensure all components get the updated plan
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 2000);
        } else {
          setError('Failed to update plan');
        }
      } catch (err) {
        console.error('Error updating plan:', err);
        setError('An error occurred while updating your plan');
      } finally {
        setIsUpdating(false);
      }
    };

    if (user) {
      updateUserPlan();
    }
  }, [user, searchParams, router]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to complete your upgrade.</p>
          <button
            onClick={() => router.push('/auth')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (isUpdating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing Upgrade</h1>
          <p className="text-gray-600">Please wait while we activate your new plan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Upgrade Failed</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => router.push('/upgrade')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Upgrade Successful!</h1>
          <p className="text-gray-600 mb-4">
            Welcome to Klyro {planName}! Your account has been successfully upgraded.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            You now have access to AI insights and enhanced features. Redirecting to dashboard in 3 seconds...
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
          >
            Go to Dashboard Now
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// Loading component for Suspense fallback
function UpgradeSuccessLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading</h1>
        <p className="text-gray-600">Please wait...</p>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function UpgradeSuccess() {
  return (
    <Suspense fallback={<UpgradeSuccessLoading />}>
      <UpgradeSuccessContent />
    </Suspense>
  );
} 