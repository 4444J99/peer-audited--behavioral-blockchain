import {
  createCameraWatermark,
  createSimulatedCaptureUri,
  createSyntheticCaptureSession,
  createSyntheticProofMediaUri,
  createZkProofMediaUri,
} from './proof-media';

describe('proof-media utils', () => {
  it('creates camera watermark with contract marker and styx prefix', () => {
    const watermark = createCameraWatermark('Contract ABC');
    expect(watermark).toContain('STYX//contract-abc::');
  });

  it('creates unique simulated capture uris', () => {
    const first = createSimulatedCaptureUri('contract_1');
    const second = createSimulatedCaptureUri('contract_1');
    expect(first).toContain('file:///data/user/0/com.styx.mobile/cache/live_proof_contract_1_');
    expect(second).not.toBe(first);
  });

  it('creates local synthetic proof uri for camera-screen source', () => {
    const uri = createSyntheticProofMediaUri('contract-1', 'camera-screen');
    expect(uri).toContain('local://proof/camera-screen/contract-1/');
  });

  it('creates uploadable synthetic capture session media with deterministic metadata', () => {
    const session = createSyntheticCaptureSession(
      'contract-1',
      'STYX//contract-1::2026-03-05T00:00:00.000Z::abc123',
      1_700_000_000_000,
      1_700_000_000_900,
    );

    expect(session.mediaUri).toContain('data:video/mp4;base64,');
    expect(session.captureId).toContain('syn-contract-1-');
    expect(session.captureHash).toHaveLength(8);
    expect(session.durationMs).toBe(900);
  });

  it('creates zk proof uri with breach and timestamp metadata', () => {
    const uri = createZkProofMediaUri(
      'contract-xyz',
      'abc123deadbeef',
      true,
      '2026-03-04T01:00:00.000Z',
    );
    expect(uri).toContain('zk://proof/contract-xyz/abc123deadbeef?');
    expect(uri).toContain('breach=1');
    expect(uri).toContain('ts=2026-03-04T01%3A00%3A00.000Z');
  });
});
