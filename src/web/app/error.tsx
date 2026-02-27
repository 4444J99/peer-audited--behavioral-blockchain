'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Styx] Unhandled error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 bg-red-900/30 border border-red-800 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="text-red-500" size={40} />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Something Went Wrong</h1>
          <p className="text-neutral-500 mt-2 text-sm">
            {error.message || 'An unexpected error occurred. The Truth Log has been notified.'}
          </p>
          {error.digest && (
            <p className="text-neutral-600 text-xs mt-1 font-mono">Error ID: {error.digest}</p>
          )}
        </div>
        <button
          onClick={reset}
          className="px-6 py-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white font-bold hover:bg-neutral-800 transition-colors inline-flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    </div>
  );
}
