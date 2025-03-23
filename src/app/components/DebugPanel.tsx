'use client';

import React from 'react';

interface DebugMessage {
  timestamp: Date;
  actionType: string;
  details: string;
}

interface DebugPanelProps {
  debugMessages: DebugMessage[];
  onClose: () => void;
}

export default function DebugPanel({ debugMessages, onClose }: DebugPanelProps) {
  return (
    <div className="fixed top-0 right-0 w-full sm:w-96 h-full bg-white shadow-lg border-l border-gray-300 z-50 overflow-y-auto flex flex-col">
      <div className="flex items-center justify-between p-4 bg-gray-200 border-b border-gray-300">
        <h2 className="font-bold text-gray-700">Debug Logs</h2>
        <button
          onClick={onClose}
          className="text-gray-600 hover:text-gray-900"
        >
          Close
        </button>
      </div>
      <div className="p-4 space-y-4">
        {debugMessages.length === 0 ? (
          <div className="text-sm text-gray-500">No debug messages yet.</div>
        ) : (
          debugMessages.map((msg, index) => (
            <div key={index} className="text-sm border-b pb-2 mb-2">
              <div className="text-gray-600 font-semibold">
                {msg.actionType} @ {msg.timestamp.toLocaleTimeString()}
              </div>
              <div className="text-gray-800 mt-1">
                {msg.details}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
