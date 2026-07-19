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

function hashFnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash +=
      (hash << 1) +
      (hash << 4) +
      (hash << 7) +
      (hash << 8) +
      (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function encodeBase64(value: string): string {
  const maybeBuffer = (globalThis as any).Buffer;
  if (maybeBuffer?.from) {
    return maybeBuffer.from(value, 'utf8').toString('base64');
  }

  if (typeof globalThis.btoa === 'function') {
    const utf8AsBinary = encodeURIComponent(value).replace(
      /%([0-9A-F]{2})/g,
      (_, hex: string) => String.fromCharCode(parseInt(hex, 16)),
    );
    return globalThis.btoa(utf8AsBinary);
  }

  throw new Error('No base64 encoder available in runtime.');
}

export type SyntheticCaptureSession = {
  mediaUri: string;
  captureId: string;
  captureHash: string;
  createdAt: string;
  durationMs: number;
};

export function createCameraWatermark(contractId?: string): string {
  const stamp = new Date().toISOString();
  const contractPart = sanitizeSegment(contractId || 'no-contract');
  return `STYX//${contractPart}::${stamp}::${createNonce()}`;
}

export function createSimulatedCaptureUri(contractId?: string): string {
  const contractPart = sanitizeSegment(contractId || 'no-contract');
  return `file:///data/user/0/com.styx.mobile/cache/live_proof_${contractPart}_${createNonce()}.mp4`;
}

export function createSyntheticCaptureSession(
  contractId?: string,
  watermark?: string | null,
  captureStartedAt?: number | null,
  captureStoppedAt: number = Date.now(),
): SyntheticCaptureSession {
  const contractPart = sanitizeSegment(contractId || 'no-contract');
  const startedAt = captureStartedAt && captureStartedAt > 0 ? captureStartedAt : captureStoppedAt;
  const durationMs = Math.max(0, captureStoppedAt - startedAt);
  const createdAt = new Date(captureStoppedAt).toISOString();

  const payload = {
    v: 1,
    kind: 'styx-synthetic-capture',
    contract: contractPart,
    createdAt,
    startedAt: new Date(startedAt).toISOString(),
    durationMs,
    watermark: watermark || null,
    nonce: createNonce(),
  };

  const rawPayload = JSON.stringify(payload);
  const captureHash = hashFnv1a(rawPayload);
  const mediaUri = `data:video/mp4;base64,${encodeBase64(rawPayload)}`;

  return {
    mediaUri,
    captureId: `syn-${contractPart}-${captureHash}`,
    captureHash,
    createdAt,
    durationMs,
  };
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
