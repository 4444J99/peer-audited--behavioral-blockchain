'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Shield, Send, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

export default function WhistleblowerPage() {
  const params = useParams();
  const linkId = params.linkId as string;

  const [mediaUri, setMediaUri] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUri.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      // Use the public API URL if available, otherwise relative for same-host deployment
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiBase}/api/contracts/bounty/${linkId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mediaUri }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: 'Evidence submitted successfully. The Fury network will audit your submission.',
        });
        setMediaUri('');
      } else {
        setResult({
          success: false,
          message: data.message || 'Failed to submit evidence.',
        });
      }
    } catch (err) {
      setResult({
        success: false,
        message: 'Network error. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans flex items-center justify-center p-6">
      <div className="w-full max-w-md p-8 bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-red-600 rounded-full mb-4 flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.3)]">
            <Shield size={32} className="text-black" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase mb-2">STYX</h1>
          <p className="text-red-500 font-bold tracking-widest text-xs uppercase">Ex-Bounty Intake</p>
        </div>

        {result?.success ? (
          <div className="text-center py-8 space-y-4">
            <CheckCircle className="text-green-500 mx-auto" size={64} />
            <h2 className="text-xl font-bold">Evidence Received</h2>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Your submission has been securely logged and routed to the Fury network for verification.
              If the breach is confirmed, the contract funds will be redistributed.
            </p>
            <button
              onClick={() => setResult(null)}
              className="mt-6 text-neutral-500 hover:text-white transition-colors underline text-sm"
            >
              Submit more evidence
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-neutral-500 font-bold tracking-widest text-xs uppercase ml-1">
                Evidence Artifact URL
              </label>
              <input
                type="text"
                value={mediaUri}
                onChange={(e) => setMediaUri(e.target.value)}
                placeholder="https://shared-link.com/screenshot.jpg"
                className="w-full px-5 py-4 bg-black border border-neutral-800 rounded-2xl text-white placeholder-neutral-700 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/30 transition-all"
                required
              />
              <p className="text-[10px] text-neutral-600 italic mt-2 px-1">
                Submit a link to a communication screenshot, call log, or video proof of a "No Contact" breach.
              </p>
            </div>

            {result?.success === false && (
              <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-900/50 rounded-2xl text-red-400 text-sm">
                <AlertTriangle size={18} />
                <p>{result.message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !mediaUri.trim()}
              className="w-full py-5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 text-white font-black rounded-2xl transition-all shadow-lg flex items-center justify-center gap-3 uppercase tracking-tighter"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              {loading ? 'Processing...' : 'Submit Evidence'}
            </button>

            <p className="text-[11px] text-neutral-500 text-center px-4 leading-relaxed">
              By submitting evidence, you verify that this information is truthful. Malicious or fraudulent submissions may be flagged by the Fury network.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
