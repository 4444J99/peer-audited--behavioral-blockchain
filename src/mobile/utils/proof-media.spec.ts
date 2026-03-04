import {
  createCameraWatermark,
  createSimulatedCaptureUri,
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
