'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Styx] Global error boundary:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 bg-red-900/30 border border-red-800 rounded-full flex items-center justify-center mx-auto">
            <span className="text-red-500 text-4xl">!</span>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Something Went Wrong</h1>
            <p className="text-neutral-500 mt-2 text-sm">
              {error.message || 'An unexpected error occurred.'}
            </p>
            {error.digest && (
              <p className="text-neutral-600 text-xs mt-1 font-mono">Error ID: {error.digest}</p>
            )}
            <p className="text-neutral-600 text-xs mt-3">
              Try refreshing the page or returning to the dashboard.
            </p>
          </div>
          <button
            onClick={reset}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl text-white font-bold transition-colors"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
