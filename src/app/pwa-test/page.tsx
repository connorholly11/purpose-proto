'use client';

import NotificationTester from "@/app/components/NotificationTester";

export default function PwaTestPage() {
  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">PWA Features Test</h1>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">Push Notifications Test</h2>
          <p className="mb-4 text-gray-700">
            Use this tool to test if push notifications are working correctly on your device. 
            You can schedule a test notification to appear after a specified delay.
          </p>
          <NotificationTester />
        </section>
        
        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-3">PWA Installation</h2>
          <p className="mb-4 text-gray-700">
            If you&apos;re using a supported browser, you should see an install prompt 
            to add this app to your home screen. If you&apos;ve already installed the PWA, 
            you won&apos;t see the prompt again.
          </p>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              Note: Some browsers may require multiple visits to the site before showing 
              the install prompt. Chrome typically shows the prompt after the user has 
              visited the site a few times.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
} 