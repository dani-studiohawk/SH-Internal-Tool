import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function UsageDashboard() {
  const { data: session, status } = useSession();
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchUsageData();
      // Refresh every 30 seconds
      const interval = setInterval(fetchUsageData, 30000);
      return () => clearInterval(interval);
    }
  }, [status]);

  const fetchUsageData = async () => {
    try {
      const response = await fetch('/api/usage-dashboard');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setUsageData(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch usage data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading usage dashboard...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Please sign in to view usage dashboard</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error loading usage data: {error}
        </div>
      </div>
    );
  }

  if (!usageData) {
    return null;
  }

  const { user, rateLimit, endpoints, recommendations } = usageData;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">API Usage Dashboard</h1>
      
      {/* User Info */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">User Information</h2>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>User ID:</strong> {user.id}</p>
      </div>

      {/* Rate Limit Status */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Rate Limit Status</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 p-4 rounded">
            <div className="text-2xl font-bold text-blue-600">{rateLimit.requestsInWindow}</div>
            <div className="text-sm text-gray-600">Requests Used</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded">
            <div className="text-2xl font-bold text-green-600">{rateLimit.remainingRequests}</div>
            <div className="text-sm text-gray-600">Requests Remaining</div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded">
            <div className="text-2xl font-bold text-gray-600">{rateLimit.maxRequests}</div>
            <div className="text-sm text-gray-600">Max Requests</div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded">
            <div className="text-sm font-bold text-yellow-600">
              {rateLimit.resetTime ? new Date(rateLimit.resetTime).toLocaleTimeString() : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Next Reset</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Usage Progress</span>
            <span>{Math.round((rateLimit.requestsInWindow / rateLimit.maxRequests) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${rateLimit.isLimited ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min((rateLimit.requestsInWindow / rateLimit.maxRequests) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        {rateLimit.isLimited && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Rate Limit Reached!</strong> You've used all available requests. 
            Please wait until {rateLimit.resetTime ? new Date(rateLimit.resetTime).toLocaleString() : 'the next reset'}.
          </div>
        )}
      </div>

      {/* Endpoints */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">API Endpoints</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Endpoint</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-left">Cost</th>
                <th className="px-4 py-2 text-left">Rate Limited</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(endpoints).map(([endpoint, info]) => (
                <tr key={endpoint} className="border-t">
                  <td className="px-4 py-2 font-mono text-sm">/api/{endpoint}</td>
                  <td className="px-4 py-2">{info.description}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      info.cost.includes('High') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {info.cost}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      info.rateLimited ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {info.rateLimited ? 'Yes' : 'No'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Recommendations</h2>
        <ul className="list-disc list-inside space-y-2">
          {recommendations.map((recommendation, index) => (
            <li key={index} className="text-gray-700">{recommendation}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}