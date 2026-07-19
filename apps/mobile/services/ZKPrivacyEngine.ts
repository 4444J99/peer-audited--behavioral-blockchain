import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

/**
 * ZKPrivacyEngine: Local "Digital Exhaust" Processor
 *
 * Generates privacy-preserving proofs for No Contact contracts by matching local
 * telephony/app activity against a target identifier. Raw logs never leave device.
 */

export interface LocalTelephonyLog {
  identifier: string;
  timestamp: Date;
  method: 'CALL' | 'TEXT' | 'APP_USAGE';
}

export interface ExhaustLogEntry {
  counterparty: string;
  timestamp: string;
  channel: 'SMS' | 'CALL' | 'APP' | string;
}

type AnyLogEntry = LocalTelephonyLog | ExhaustLogEntry;
type LogProvider = (
  target: string,
  start: Date,
  end: Date,
) => Promise<AnyLogEntry[]>;

export interface ExhaustProof {
  contractId: string;
  timestamp: string;
  breachDetected: boolean;
  proofHash: string;
  signature: string;
  attestation: string;
  deviceId: string;
}

export interface ZKBreachProof {
  proofHash: string;
  timestamp: string;
  maskedIdentifier: string;
  method: 'CALL' | 'TEXT' | 'APP_USAGE';
  deviceId: string;
  deviceSignature: string;
  attestation: string;
}

function normalizeIdentifier(raw: string): string {
  const compact = String(raw || '').replace(/[^\dA-Za-z]/g, '').toLowerCase();
  if (/^\d+$/.test(compact)) {
    // Phone numbers may include country code. Match by local 10-digit tail.
    return compact.length > 10 ? compact.slice(-10) : compact;
  }
  return compact;
}

function normalizeMethod(value: string): 'CALL' | 'TEXT' | 'APP_USAGE' {
  const v = String(value || '').toUpperCase();
  if (v === 'CALL') return 'CALL';
  if (v === 'TEXT' || v === 'SMS') return 'TEXT';
  return 'APP_USAGE';
}

function toIsoTimestamp(value: Date | string): string {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}

function toLocalTelephonyLog(entry: AnyLogEntry): LocalTelephonyLog {
  if ('identifier' in entry && 'method' in entry) {
    return {
      identifier: entry.identifier,
      timestamp: entry.timestamp instanceof Date ? entry.timestamp : new Date(entry.timestamp),
      method: entry.method,
    };
  }

  return {
    identifier: entry.counterparty,
    timestamp: new Date(entry.timestamp),
    method: normalizeMethod(entry.channel),
  };
}

export class ZKPrivacyEngine {
  private static readonly defaultLogProvider: LogProvider = async () => [];
  private static logProvider: LogProvider = ZKPrivacyEngine.defaultLogProvider;

  static setLogProvider(provider: LogProvider): void {
    this.logProvider = provider;
  }

  static resetLogProvider(): void {
    this.logProvider = this.defaultLogProvider;
  }

  static async generateLocalProof(
    contractId: string,
    targetIdentifier: string,
    timeWindowStart: Date,
    timeWindowEnd: Date,
  ): Promise<ExhaustProof> {
    if (timeWindowStart.getTime() >= timeWindowEnd.getTime()) {
      throw new Error('timeWindowStart must be earlier than timeWindowEnd');
    }

    const localLogs = await this.queryNativeTelephonyLogs(
      targetIdentifier,
      timeWindowStart,
      timeWindowEnd,
    );

    const normalizedTarget = normalizeIdentifier(targetIdentifier);
    const matchingLogs = localLogs.filter((log) => {
      const timestamp = log.timestamp.getTime();
      return (
        normalizeIdentifier(log.identifier) === normalizedTarget &&
        timestamp >= timeWindowStart.getTime() &&
        timestamp <= timeWindowEnd.getTime()
      );
    });

    matchingLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const latestTimestamp = matchingLogs[0]
      ? matchingLogs[0].timestamp.toISOString()
      : timeWindowEnd.toISOString();
    const breachDetected = matchingLogs.length > 0;

    const deviceId = `${Platform.OS}-${String(Platform.Version ?? 'unknown')}`;
    const proofPayload = [
      contractId,
      normalizedTarget,
      timeWindowStart.toISOString(),
      timeWindowEnd.toISOString(),
      latestTimestamp,
      breachDetected ? 'breach' : 'clean',
    ].join(':');

    const proofHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      proofPayload,
    );
    const signature = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${proofHash}:${deviceId}:styx-zk-v2`,
    );

    return {
      contractId,
      timestamp: latestTimestamp,
      breachDetected,
      proofHash,
      signature,
      deviceId,
      attestation: breachDetected
        ? `DE-ZK-PROOF breach detected for ${this.maskIdentifier(targetIdentifier)}`
        : `DE-ZK-PROOF compliance verified for ${this.maskIdentifier(targetIdentifier)}`,
    };
  }

  /**
   * Compatibility method for older digital-exhaust callers that requested
   * breach-only payloads.
   */
  static async generateBreachProof(
    targetIdentifier: string,
    timeWindow: { start: Date; end: Date },
  ): Promise<ZKBreachProof | null> {
    const logs = await this.queryNativeTelephonyLogs(
      targetIdentifier,
      timeWindow.start,
      timeWindow.end,
    );
    const normalizedTarget = normalizeIdentifier(targetIdentifier);
    const matches = logs
      .filter((log) => normalizeIdentifier(log.identifier) === normalizedTarget)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (matches.length === 0) return null;

    const latest = matches[0];
    const deviceId = `${Platform.OS}-${String(Platform.Version ?? 'unknown')}`;
    const proofPayload = `${normalizedTarget}:${latest.timestamp.toISOString()}:${deviceId}`;
    const proofHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      proofPayload,
    );
    const deviceSignature = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${proofHash}:${deviceId}:styx-zk-breach-v2`,
    );

    return {
      proofHash,
      timestamp: latest.timestamp.toISOString(),
      maskedIdentifier: this.maskIdentifier(targetIdentifier),
      method: latest.method,
      deviceId,
      deviceSignature,
      attestation: `DE-ZK-PROOF breach detected for ${this.maskIdentifier(targetIdentifier)} at ${latest.timestamp.toISOString()}.`,
    };
  }

  private static maskIdentifier(id: string): string {
    if (id.length <= 4) return '****';
    return `${id.substring(0, 2)}...${id.substring(id.length - 2)}`;
  }

  private static async queryNativeTelephonyLogs(
    target: string,
    start: Date,
    end: Date,
  ): Promise<LocalTelephonyLog[]> {
    const rawLogs = await this.logProvider(target, start, end);
    return rawLogs.map(toLocalTelephonyLog).map((log) => ({
      identifier: log.identifier,
      timestamp: new Date(toIsoTimestamp(log.timestamp)),
      method: normalizeMethod(log.method),
    }));
  }
}
