import { useState, useEffect } from 'react';

interface EnvironmentStatusProps {
  showDetails?: boolean;
}

interface HealthStatus {
  status: string;
  services: {
    environment: {
      hasOpenAI: boolean;
      hasSupabase: boolean;
    };
    openai: string;
    supabase: string;
    timestamp: string;
  };
  message: string;
}

export default function EnvironmentStatus({ showDetails = false }: EnvironmentStatusProps) {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health');
        if (response.ok) {
          const data = await response.json();
          setHealth(data);
        } else {
          setError('Health check failed');
        }
      } catch (err) {
        setError('Failed to check system health');
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  if (loading) {
    return showDetails ? (
      <div className="p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600">Checking system status...</div>
      </div>
    ) : null;
  }

  if (error || !health) {
    return showDetails ? (
      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-sm text-red-600">⚠️ System status unknown</div>
      </div>
    ) : null;
  }

  const isHealthy = health.status === 'healthy';
  const hasIssues = !health.services.environment.hasOpenAI;

  if (!showDetails && isHealthy && !hasIssues) {
    return null; // Don't show anything if everything is working
  }

  return (
    <div className={`p-3 rounded-lg border ${
      isHealthy 
        ? hasIssues 
          ? 'bg-yellow-50 border-yellow-200' 
          : 'bg-green-50 border-green-200'
        : 'bg-red-50 border-red-200'
    }`}>
      <div className={`text-sm font-medium ${
        isHealthy 
          ? hasIssues 
            ? 'text-yellow-800' 
            : 'text-green-800'
          : 'text-red-800'
      }`}>
        {isHealthy 
          ? hasIssues 
            ? '⚠️ Limited functionality' 
            : '✅ All systems operational'
          : '❌ System issues detected'
        }
      </div>
      
      {showDetails && (
        <div className="mt-2 space-y-1">
          <div className={`text-xs ${
            health.services.environment.hasSupabase ? 'text-green-600' : 'text-red-600'
          }`}>
            Database: {health.services.environment.hasSupabase ? 'Connected' : 'Not configured'}
          </div>
          <div className={`text-xs ${
            health.services.environment.hasOpenAI ? 'text-green-600' : 'text-yellow-600'
          }`}>
            AI Features: {health.services.openai}
          </div>
        </div>
      )}

      {hasIssues && !showDetails && (
        <div className="mt-1 text-xs text-yellow-700">
          AI features using fallback mode. Check environment configuration.
        </div>
      )}
    </div>
  );
} 