import { NativeModules, Platform } from 'react-native';

const NativeCameraModule = NativeModules?.NativeCameraModule || null;

export interface NonceResult {
  nonce: string;
  raw: string;
  expiresAt: number;
}

export interface CaptureResult {
  path: string;
  nonce: string;
  width?: number;
  height?: number;
  durationMs?: number;
  format: string;
}

export interface CameraAvailability {
  available: boolean;
  authorized: boolean;
  notDetermined: boolean;
}

function assertNativeModule(): void {
  if (!NativeCameraModule) {
    throw new Error(
      'NativeCameraModule is not available. ' +
      'Ensure the native module is linked and you are on a physical iOS device.',
    );
  }
}

export const NativeCameraBridge = {
  generateSecureNonce(): Promise<string> {
    if (Platform.OS !== 'ios' || !NativeCameraModule) {
      return Promise.resolve(fallbackNonce());
    }
    return NativeCameraModule.generateSecureNonce();
  },

  requestNonce(contractId: string): Promise<NonceResult> {
    if (Platform.OS !== 'ios' || !NativeCameraModule) {
      return Promise.resolve(fallbackNonceResult(contractId));
    }
    return NativeCameraModule.requestNonce(contractId);
  },

  isCameraAvailable(): Promise<CameraAvailability> {
    if (Platform.OS !== 'ios' || !NativeCameraModule) {
      return Promise.resolve({ available: false, authorized: false, notDetermined: false });
    }
    return NativeCameraModule.isCameraAvailable();
  },

  capturePhoto(
    outputPath: string,
    nonce: string,
    watermark: string,
  ): Promise<CaptureResult> {
    if (Platform.OS !== 'ios' || !NativeCameraModule) {
      return Promise.reject(new Error('Native camera not available on this platform'));
    }
    return NativeCameraModule.capturePhoto(outputPath, nonce, watermark);
  },

  captureVideo(
    outputPath: string,
    nonce: string,
    watermark: string,
    maxDurationMs: number = 30000,
  ): Promise<CaptureResult> {
    if (Platform.OS !== 'ios' || !NativeCameraModule) {
      return Promise.reject(new Error('Native camera not available on this platform'));
    }
    return NativeCameraModule.captureVideo(outputPath, nonce, watermark, maxDurationMs);
  },

  applyWatermark(mediaPath: string, watermarkText: string): Promise<string> {
    if (Platform.OS !== 'ios' || !NativeCameraModule) {
      return Promise.resolve(mediaPath);
    }
    return NativeCameraModule.applyWatermark(mediaPath, watermarkText);
  },
};

function fallbackNonce(): string {
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function fallbackNonceResult(contractId: string): NonceResult {
  const raw = fallbackNonce().slice(0, 32);
  const timestamp = Date.now();
  return {
    nonce: `STYX::${raw}::${timestamp}::${contractId.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase()}`,
    raw,
    expiresAt: timestamp + 120_000,
  };
}
