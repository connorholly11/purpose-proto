'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// Use dynamic imports to prevent layout issues
const KnowledgeBase = dynamic(() => import('../components/KnowledgeBase'), { ssr: false });
const RagAnalytics = dynamic(() => import('../components/RagAnalytics'), { ssr: false });
const TestRag = dynamic(() => import('../components/TestRag'), { ssr: false });

// Loading component for suspense
function RagPageLoading() {
  return <div className="container mx-auto px-4 py-6">Loading...</div>;
}

export default function RagPage() {
  return (
    <Suspense fallback={<RagPageLoading />}>
      <RagPageContent />
    </Suspense>
  );
}

function RagPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'knowledge' | 'analytics' | 'test'>('analytics');
  
  // Set the active tab based on URL query parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'knowledge' || tabParam === 'analytics' || tabParam === 'test') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);
  
  // Update URL when tab changes
  const handleTabChange = (tab: 'knowledge' | 'analytics' | 'test') => {
    setActiveTab(tab);
    router.push(`/rag?tab=${tab}`);
  };
  
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">RAG System</h1>
      
      {/* Tabs */}
      <div className="mb-6 border-b">
        <div className="flex">
          <button
            className={`py-2 px-4 ${activeTab === 'knowledge' ? 'border-b-2 border-indigo-500 font-medium text-indigo-600' : 'text-gray-500'}`}
            onClick={() => handleTabChange('knowledge')}
          >
            Knowledge Base
          </button>
          <button
            className={`py-2 px-4 ${activeTab === 'analytics' ? 'border-b-2 border-indigo-500 font-medium text-indigo-600' : 'text-gray-500'}`}
            onClick={() => handleTabChange('analytics')}
          >
            RAG Analytics
          </button>
          <button
            className={`py-2 px-4 ${activeTab === 'test' ? 'border-b-2 border-indigo-500 font-medium text-indigo-600' : 'text-gray-500'}`}
            onClick={() => handleTabChange('test')}
          >
            Test RAG
          </button>
        </div>
      </div>
      
      {/* Content based on active tab */}
      <div className="mt-4">
        {activeTab === 'knowledge' && <KnowledgeBase />}
        {activeTab === 'analytics' && <RagAnalytics />}
        {activeTab === 'test' && <TestRag />}
      </div>
    </div>
  );
} 