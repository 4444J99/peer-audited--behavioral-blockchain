import { snapshotContractParams } from '../../../lib/snapshot-params';

/**
 * Exists only to declare the pages the Cloudflare snapshot export generates for this
 * dynamic segment -- `output: export` refuses to build a dynamic route without it, and
 * the page itself is a client component, which cannot carry this export.
 *
 * It covers both /contracts/[id] and /contracts/[id]/attest, since both live under this
 * segment. Outside a snapshot build the helper returns [], leaving these routes to
 * render on demand exactly as they did before.
 */
export function generateStaticParams() {
  return snapshotContractParams();
}

export default function ContractSegmentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
