function sanitizeSegment(value: string, fallback = 'unknown'): string {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || fallback;
}

function createNonce(): string {
  const nowPart = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${nowPart}${randomPart}`;
}

export function createCameraWatermark(contractId?: string): string {
  const stamp = new Date().toISOString();
  const contractPart = sanitizeSegment(contractId || 'no-contract');
  return `STYX//${contractPart}::${stamp}::${createNonce()}`;
}

export function createSimulatedCaptureUri(contractId?: string): string {
  const contractPart = sanitizeSegment(contractId || 'no-contract');
  return `file:///data/user/0/com.styx.mobile/cache/live_proof_${contractPart}_${createNonce()}.mp4`;
}

export function createSyntheticProofMediaUri(
  contractId: string,
  source: 'camera-screen' | 'contract-detail' | 'digital-exhaust',
): string {
  const safeContract = sanitizeSegment(contractId, 'contract');
  return `local://proof/${source}/${safeContract}/${createNonce()}`;
}

export function createZkProofMediaUri(
  contractId: string,
  proofHash: string,
  breachDetected: boolean,
  timestamp: string,
): string {
  const safeContract = sanitizeSegment(contractId, 'contract');
  const safeHash = sanitizeSegment(proofHash, 'hash');
  const ts = encodeURIComponent(timestamp);
  const breach = breachDetected ? '1' : '0';
  return `zk://proof/${safeContract}/${safeHash}?breach=${breach}&ts=${ts}`;
}
