import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { ApiError } from '../services/api-client';

/**
 * The dashboard's full-page error surface, extracted so the branch that renders
 * the jurisdiction notice is testable in isolation (issue #867: the notice was
 * unreachable until #868, and nothing pinned it afterwards). Three branches:
 *
 * - JURISDICTION_BLOCKED ApiError → the yellow notice carrying the API's own
 *   message (a deliberate product state, not an outage)
 * - network error (ApiError status 0) → the reachability hint
 * - anything else → the message alone, with no misleading reachability line
 */
export function DashboardErrorNotice({ error }: { error: Error }) {
  const apiError = error instanceof ApiError ? error : null;
  const jurisdictionBlocked = apiError?.code === 'JURISDICTION_BLOCKED';
  const isNetworkError = apiError?.status === 0;
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md px-6">
        <AlertTriangle className={`mx-auto ${jurisdictionBlocked ? 'text-yellow-500' : 'text-red-500'}`} size={48} />
        {jurisdictionBlocked ? (
          <>
            <p className="text-yellow-400 font-bold">Not available in your jurisdiction</p>
            <p className="text-neutral-400 text-sm">{error.message}</p>
          </>
        ) : (
          <>
            <p className="text-red-400 font-bold">{error.message}</p>
            {isNetworkError && (
              <p className="text-neutral-500 text-sm">Ensure the backend service is reachable.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
