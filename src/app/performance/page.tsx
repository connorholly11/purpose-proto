'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/app/contexts/UserContext';

interface PerformanceMetric {
  id: string;
  feature: string;
  responseTime: number;
  tokensUsed?: number;
  cost?: number;
  timestamp: string;
  userId?: string;
  user?: {
    name?: string;
  };
}

interface AggregatedMetric {
  feature: string;
  avgResponseTime: number;
  avgTokensUsed: number | null;
  avgCost: number | null;
  count: number;
}

export default function PerformancePage() {
  const { currentUser } = useUser();
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [aggregatedMetrics, setAggregatedMetrics] = useState<AggregatedMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'detailed' | 'aggregated'>('aggregated');
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  
  // Fetch aggregated metrics
  useEffect(() => {
    async function fetchAggregatedMetrics() {
      try {
        setLoading(true);
        const response = await fetch('/api/performance?averages=true');
        
        if (response.ok) {
          const data = await response.json();
          setAggregatedMetrics(data.metrics);
        } else {
          setError('Failed to fetch performance metrics');
        }
      } catch (err) {
        console.error('Error fetching aggregated metrics:', err);
        setError('An error occurred while fetching metrics');
      } finally {
        setLoading(false);
      }
    }
    
    fetchAggregatedMetrics();
  }, []);
  
  // Fetch detailed metrics when feature is selected
  useEffect(() => {
    if (!selectedFeature && viewMode === 'detailed') {
      // Fetch all metrics for detailed view
      fetchDetailedMetrics();
    } else if (selectedFeature) {
      // Fetch metrics for the selected feature
      fetchFeatureMetrics(selectedFeature);
    }
  }, [selectedFeature, viewMode]);
  
  // Fetch all detailed metrics
  const fetchDetailedMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/performance');
      
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
      } else {
        setError('Failed to fetch performance metrics');
      }
    } catch (err) {
      console.error('Error fetching detailed metrics:', err);
      setError('An error occurred while fetching metrics');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch metrics for a specific feature
  const fetchFeatureMetrics = async (feature: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/performance?feature=${feature}`);
      
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
      } else {
        setError('Failed to fetch feature metrics');
      }
    } catch (err) {
      console.error('Error fetching feature metrics:', err);
      setError('An error occurred while fetching metrics');
    } finally {
      setLoading(false);
    }
  };
  
  // Format number as milliseconds
  const formatMs = (ms: number) => {
    return `${ms.toFixed(2)} ms`;
  };
  
  // Format cost as dollars
  const formatCost = (cost?: number | null) => {
    if (cost === null || cost === undefined) return 'N/A';
    return `$${cost.toFixed(6)}`;
  };
  
  // Select a feature to view detailed metrics
  const handleFeatureSelect = (feature: string) => {
    setSelectedFeature(feature);
    setViewMode('detailed');
  };
  
  // Get feature color for visualization
  const getFeatureColor = (feature: string) => {
    const colorMap: Record<string, string> = {
      'embedding': 'bg-blue-100 text-blue-800',
      'completion': 'bg-green-100 text-green-800',
      'tts': 'bg-purple-100 text-purple-800',
      'whisper': 'bg-yellow-100 text-yellow-800',
      'rag': 'bg-red-100 text-red-800'
    };
    
    return colorMap[feature] || 'bg-gray-100 text-gray-800';
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Performance Monitoring</h1>
      
      {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">{error}</div>}
      
      {/* View toggle */}
      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setViewMode('aggregated')}
            className={`px-4 py-2 rounded ${
              viewMode === 'aggregated' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Aggregated View
          </button>
          <button
            onClick={() => {
              setViewMode('detailed');
              if (!selectedFeature) {
                fetchDetailedMetrics();
              }
            }}
            className={`px-4 py-2 rounded ${
              viewMode === 'detailed' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Detailed View
          </button>
        </div>
      </div>
      
      {/* Feature filter (only for detailed view) */}
      {viewMode === 'detailed' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Feature:</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedFeature(null)}
              className={`px-3 py-1 rounded-full text-sm ${
                selectedFeature === null
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              All Features
            </button>
            {aggregatedMetrics.map(metric => (
              <button
                key={metric.feature}
                onClick={() => setSelectedFeature(metric.feature)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedFeature === metric.feature
                    ? 'bg-indigo-600 text-white'
                    : getFeatureColor(metric.feature)
                }`}
              >
                {metric.feature}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Metrics display */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">Loading metrics...</div>
        ) : viewMode === 'aggregated' ? (
          <div className="divide-y divide-gray-200">
            <div className="grid grid-cols-5 p-4 font-semibold bg-gray-50">
              <div>Feature</div>
              <div>Average Response Time</div>
              <div>Average Tokens Used</div>
              <div>Average Cost</div>
              <div>Count</div>
            </div>
            {aggregatedMetrics.length === 0 ? (
              <div className="p-6 text-center">No metrics available</div>
            ) : (
              aggregatedMetrics.map(metric => (
                <div key={metric.feature} className="grid grid-cols-5 p-4 hover:bg-gray-50">
                  <div className="font-medium">
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getFeatureColor(metric.feature)}`}>
                      {metric.feature}
                    </span>
                  </div>
                  <div>{formatMs(metric.avgResponseTime)}</div>
                  <div>{metric.avgTokensUsed ? metric.avgTokensUsed.toFixed(2) : 'N/A'}</div>
                  <div>{formatCost(metric.avgCost)}</div>
                  <div>{metric.count}</div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            <div className="grid grid-cols-6 p-4 font-semibold bg-gray-50">
              <div>Feature</div>
              <div>Response Time</div>
              <div>Tokens Used</div>
              <div>Cost</div>
              <div>User</div>
              <div>Timestamp</div>
            </div>
            {metrics.length === 0 ? (
              <div className="p-6 text-center">No detailed metrics available</div>
            ) : (
              metrics.map(metric => (
                <div key={metric.id} className="grid grid-cols-6 p-4 hover:bg-gray-50">
                  <div className="font-medium">
                    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getFeatureColor(metric.feature)}`}>
                      {metric.feature}
                    </span>
                  </div>
                  <div>{formatMs(metric.responseTime)}</div>
                  <div>{metric.tokensUsed || 'N/A'}</div>
                  <div>{formatCost(metric.cost)}</div>
                  <div>{metric.user?.name || metric.userId || 'Anonymous'}</div>
                  <div>{new Date(metric.timestamp).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
} 