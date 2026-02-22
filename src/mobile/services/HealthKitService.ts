/**
 * Minimal mock of the Apple HealthKit types for the Styx Oracle implementation.
 * In a true Native Module, these types map directly to the Swift HKStore bridge.
 */

export interface HealthDataPoint {
  id: string;
  value: number;
  startDate: string;
  endDate: string;
  metadata: {
    HKMetadataKeyWasUserEntered?: boolean;
    [key: string]: any;
  };
}

export class HealthKitService {
  /**
   * Requests permission to read vital metrics from the Apple Health Store.
   * Styx only requests Read access. We never Write to HealthKit.
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      console.log('HealthKitService: Requesting read permissions for ActiveEnergyBurned, StepCount, BodyMass...');
      // MOCK NATIVE BRIDGE CALL
      return true;
    } catch (e) {
      console.error('HealthKitService: Permission denied or unavailable', e);
      return false;
    }
  }

  /**
   * Core Oracle Function: Fetches data strictly filtered for hardware truth.
   * Discards ANY data point where `HKMetadataKeyWasUserEntered` is true to prevent manual spoofing.
   */
  static async fetchHardwareOnlyMetrics(startDate: Date, endDate: Date): Promise<HealthDataPoint[]> {
    console.log(`HealthKitService: Fetching hardware logs from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // MOCK NATIVE RESPONSE
    const mockNativeData: HealthDataPoint[] = [
      {
        id: 'mock-hw-1',
        value: 1450, // Calories
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        metadata: {
          HKMetadataKeyWasUserEntered: false,
          device: 'Apple Watch Series 9',
        }
      },
      {
        id: 'mock-manual-1',
        value: 500, // Calories (User manually typed this in the Health App)
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        metadata: {
          HKMetadataKeyWasUserEntered: true,
        }
      }
    ];

    // ZERO TRUST FILTER: Hardware Only
    const verifiedHardwareData = mockNativeData.filter(
      (dataPoint) => dataPoint.metadata.HKMetadataKeyWasUserEntered !== true
    );

    console.log(`HealthKitService: Filtered ${mockNativeData.length - verifiedHardwareData.length} manual entries. Hardware proofs remaining: ${verifiedHardwareData.length}`);

    return verifiedHardwareData;
  }
}
