'use client';

import { AuthProvider } from '../contexts/AuthContext';
import { installSnapshotFetch } from '../services/snapshot-fetch';

// At module scope, not in an effect: this module is evaluated when the client
// bundle loads, which is before any page's data-fetching effect runs. Installed
// from the one component every route mounts, so a page cannot be added that
// forgets it. A no-op outside snapshot builds.
installSnapshotFetch();

export function Providers({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
