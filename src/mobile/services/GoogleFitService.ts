/**
 * Minimal mock of the Google Fit / Health Connect types for the Styx Oracle implementation.
 * Maps to the Kotlin Google Fit History API bridge.
 */

export interface FitDataPoint {
  id: string;
  value: number;
  startTimeNanos: string;
  endTimeNanos: string;
  dataSource: {
    streamName: string;
    type: string;
  };
}

export class GoogleFitService {
  /**
   * Requests permission to read vital metrics from Google Fit.
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      console.log('GoogleFitService: Requesting read permissions for TYPE_STEP_COUNT_DELTA and TYPE_CALORIES_EXPENDED...');
      // MOCK NATIVE BRIDGE CALL
      return true;
    } catch (e) {
      console.error('GoogleFitService: Permission denied or unavailable', e);
      return false;
    }
  }

  /**
   * Core Oracle Function: Fetches data strictly filtered for hardware truth.
   * Discards ANY data point where the dataSource `type` indicates a user-entered soft-source.
   */
  static async fetchHardwareOnlyMetrics(startTime: Date, endTime: Date): Promise<FitDataPoint[]> {
    console.log(`GoogleFitService: Fetching hardware logs from ${startTime.toISOString()} to ${endTime.toISOString()}`);
    
    // MOCK NATIVE RESPONSE
    const mockNativeData: FitDataPoint[] = [
      {
        id: 'mock-hw-1',
        value: 8500, // Steps
        startTimeNanos: startTime.getTime().toString() + '000000',
        endTimeNanos: endTime.getTime().toString() + '000000',
        dataSource: {
          streamName: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps',
          type: 'raw', // Indicates hardware sensor aggregation
        }
      },
      {
        id: 'mock-manual-1',
        value: 2000, // Steps manually added in Google Fit app
        startTimeNanos: startTime.getTime().toString() + '000000',
        endTimeNanos: endTime.getTime().toString() + '000000',
        dataSource: {
          streamName: 'user_input',
          type: 'derived', // Typically flagged when user explicitly types data
        }
      }
    ];

    // ZERO TRUST FILTER: Hardware Only
    // In actual Google Fit, you check if the `streamName` contains "user_input" or if the app package is not a trusted hardware source.
    const verifiedHardwareData = mockNativeData.filter(
      (dataPoint) => !dataPoint.dataSource.streamName.includes('user_input')
    );

    console.log(`GoogleFitService: Filtered ${mockNativeData.length - verifiedHardwareData.length} manual entries. Hardware proofs remaining: ${verifiedHardwareData.length}`);

    return verifiedHardwareData;
  }
}
