import { Platform } from 'react-native';
import * as Application from 'expo-application';

/** Platform-scoped identifier; NOT hardware attestation or proof of a unique human.
 * Android identifiers can change after factory reset/signing/user changes; iOS IDFV
 * can change after all apps from the vendor are removed. Do not mint an AsyncStorage
 * UUID when the platform cannot supply an identifier: that would defeat correlation.
 */
export async function getNativeDeviceFingerprint(): Promise<{
  platform: 'ios' | 'android'; rawVendorId: string;
} | undefined> {
  const platform = Platform.OS;
  if (platform !== 'ios' && platform !== 'android') return undefined;
  const rawVendorId = platform === 'ios'
    ? await Application.getIosIdForVendorAsync()
    : Application.getAndroidId();
  if (typeof rawVendorId !== 'string' || rawVendorId.length < 16 || rawVendorId.length > 256) {
    throw new Error('Device identity is temporarily unavailable. Retry registration on your device.');
  }
  return { platform, rawVendorId };
}
