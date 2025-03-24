'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PromptsRedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/system-prompts');
  }, [router]);
  
  return (
    <div className="container mx-auto p-4 flex items-center justify-center h-64">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting to System Prompts...</h1>
        <div className="animate-pulse">Please wait</div>
      </div>
    </div>
  );
} 