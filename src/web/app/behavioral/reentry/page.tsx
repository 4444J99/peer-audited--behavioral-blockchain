'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function ReentryPage() {
  const [eligibility, setEligibility] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/behavioral/reentry/eligibility')
      .then(r => r.json())
      .then(setEligibility)
      .catch(() => setEligibility({ eligible: false, reason: 'Failed to check eligibility' }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <RefreshCw className="w-6 h-6 text-orange-400" />
        <h1 className="text-xl font-bold">Re-entry Path</h1>
      </div>
      <div className="p-4 bg-gray-900 rounded-lg border border-gray-800 text-sm text-gray-400 space-y-2">
        <p>Failure is not the end. The Re-entry Path gives you a structured way back after a contract fails.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>7-day cooldown period</li>
          <li>50% stake discount on your next oath</li>
          <li>$2.00 Phoenix bonus badge</li>
          <li>Max 5 re-entry attempts</li>
        </ul>
      </div>

      <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          {loading ? <Clock className="w-4 h-4 animate-spin" /> :
           eligibility?.eligible ? <CheckCircle className="w-4 h-4 text-green-400" /> :
           <XCircle className="w-4 h-4 text-red-400" />}
          Re-entry Status
        </h3>
        {loading ? (
          <div className="animate-pulse h-4 bg-gray-800 rounded w-2/3" />
        ) : (
          <div className="space-y-2">
            {eligibility?.eligible ? (
              <>
                <p className="text-green-400 text-sm">You are eligible for re-entry!</p>
                <div className="p-3 bg-gray-800 rounded-lg text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-gray-400">Attempt:</span><span>#{eligibility.attemptNumber}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Discounted stake:</span><span className="text-green-400">${(eligibility.reducedStakeCents / 100).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Phoenix bonus:</span><span className="text-orange-400">$2.00</span></div>
                </div>
              </>
            ) : (
              <p className="text-red-400 text-sm">{eligibility?.reason || 'Unable to check eligibility.'}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
