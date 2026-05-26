import { Injectable, Logger } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { lookup } from 'dns/promises';
import { isIP } from 'net';
import * as https from 'node:https';
import * as http from 'node:http';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
// Reject signatures whose signed timestamp is older/newer than this skew window
// to defeat replay of captured webhook deliveries.
const MAX_TIMESTAMP_SKEW_SECONDS = 5 * 60;

function requireWebhookSecret(): string {
  const secret = process.env.STYX_WEBHOOK_SECRET; // allow-secret
  if (!secret) {
    throw new Error('STYX_WEBHOOK_SECRET must be set');
  }
  return secret;
}

export interface WebhookDeliveryResult {
  success: boolean;
  attempts: number;
  statusCode?: number;
  error?: string;
}

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  // Resolved lazily (not in a field initializer) so a missing STYX_WEBHOOK_SECRET
  // fails webhook signing/verification at use-time rather than crashing app boot.
  private get webhookSecret(): string {
    return requireWebhookSecret(); // allow-secret
  }

  /**
   * Pushes anonymized behavioral velocity changes to an enterprise CRM endpoint.
   * Signs the payload with HMAC-SHA256 and retries with exponential backoff.
   */
  async dispatchEnterpriseMetricEvent(
    webhookUrl: string,
    payload: Record<string, unknown>,
  ): Promise<boolean> {
    const result = await this.deliverWithRetry(webhookUrl, payload);
    if (!result.success) {
      this.logger.error(
        `Webhook delivery failed after ${result.attempts} attempts to [${webhookUrl}]: ${result.error}`,
      );
    }
    return result.success;
  }

  async deliverWithRetry(
    url: string,
    payload: Record<string, unknown>,
  ): Promise<WebhookDeliveryResult> {
    // The guard validates the URL and returns the exact IP it resolved+approved.
    // We pin the actual connection to that IP (sendWebhook) so a DNS-rebinding
    // attacker cannot repoint the hostname to an internal address between this
    // check and the request.
    const { parsed, pinnedAddress } = await this.assertSafeWebhookUrl(url);

    const body = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = this.sign(timestamp, body);

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await this.sendWebhook(parsed, {
          headers: {
            'Content-Type': 'application/json',
            'X-Styx-Signature': signature,
            'X-Styx-Timestamp': timestamp,
          },
          body,
          pinnedAddress,
        });

        if (response.ok) {
          this.logger.log(
            `Webhook delivered to [${url}] on attempt ${attempt} (${response.status})`,
          );
          return { success: true, attempts: attempt, statusCode: response.status };
        }

        // Non-retryable client errors (4xx except 429)
        if (response.status >= 400 && response.status < 500 && response.status !== 429) {
          return {
            success: false,
            attempts: attempt,
            statusCode: response.status,
            error: `HTTP ${response.status}`,
          };
        }

        this.logger.warn(
          `Webhook attempt ${attempt}/${MAX_RETRIES} to [${url}] failed: HTTP ${response.status}`,
        );
      } catch (error: any) {
        this.logger.warn(
          `Webhook attempt ${attempt}/${MAX_RETRIES} to [${url}] error: ${error.message}`,
        );
        if (attempt === MAX_RETRIES) {
          return { success: false, attempts: attempt, error: error.message };
        }
      }

      // Exponential backoff before retry
      if (attempt < MAX_RETRIES) {
        await this.delay(BASE_DELAY_MS * Math.pow(2, attempt - 1));
      }
    }

    return { success: false, attempts: MAX_RETRIES, error: 'Max retries exhausted' };
  }

  /**
   * Generate HMAC-SHA256 signature: sign(timestamp + "." + body)
   */
  sign(timestamp: string, body: string): string {
    const message = `${timestamp}.${body}`;
    return createHmac('sha256', this.webhookSecret).update(message).digest('hex');
  }

  /**
   * Verify an incoming webhook signature (for consumers to validate).
   * Rejects stale/replayed deliveries outside the allowed timestamp skew and
   * compares the HMAC in constant time.
   */
  verify(timestamp: string, body: string, signature: string): boolean {
    // Reject deliveries whose signed timestamp is too far from now (replay guard).
    const ts = Number(timestamp);
    if (!Number.isFinite(ts)) {
      return false;
    }
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSeconds - ts) > MAX_TIMESTAMP_SKEW_SECONDS) {
      return false;
    }

    const expected = this.sign(timestamp, body);
    const expectedBuf = Buffer.from(expected);
    const providedBuf = Buffer.from(signature);
    // timingSafeEqual requires equal-length buffers.
    if (expectedBuf.length !== providedBuf.length) {
      return false;
    }
    return timingSafeEqual(expectedBuf, providedBuf);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async assertSafeWebhookUrl(
    rawUrl: string,
  ): Promise<{ parsed: URL; pinnedAddress: string }> {
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      throw new Error('Invalid webhook URL');
    }

    if (!['https:', 'http:'].includes(parsed.protocol)) {
      throw new Error('Webhook URL protocol must be http or https');
    }

    if (parsed.username || parsed.password) {
      throw new Error('Webhook URL must not include credentials');
    }

    // URL.hostname strips brackets from IPv6 literals; lowercase for matching.
    const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');

    // PRV7: reject hostnames that are non-dotted / obfuscated IPv4 literals
    // (decimal e.g. 2130706433, octal e.g. 0177.0.0.1, hex e.g. 0x7f000001) and
    // IPv4-mapped IPv6 (::ffff:127.0.0.1). isIP only recognises canonical forms,
    // so anything that "looks numeric" but is not a canonical IP is suspicious.
    if (this.looksLikeObfuscatedIp(host)) {
      throw new Error('Webhook URL host is an unsupported numeric/obfuscated address');
    }

    // If the host is already a literal IP, validate it directly.
    const literalKind = isIP(host);
    if (literalKind !== 0) {
      if (this.isBlockedIp(host)) {
        throw new Error('Webhook URL must not target loopback, private, or link-local addresses');
      }
      // Already a literal IP — pin to it directly.
      return { parsed, pinnedAddress: host };
    }

    // Obvious local names short-circuit before DNS.
    if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.localhost')) {
      throw new Error('Webhook URL must not target localhost or private network addresses');
    }

    // PRV7: resolve the hostname and block if ANY resolved address is private /
    // loopback / link-local. Inspecting only the literal hostname allowed DNS
    // rebinding (a public name pointing at an internal IP). Fail closed if DNS
    // resolution fails (we cannot prove the target is safe).
    let resolved: { address: string }[];
    try {
      resolved = await this.resolveHost(host);
    } catch {
      throw new Error('Webhook URL host could not be resolved');
    }

    if (resolved.length === 0) {
      throw new Error('Webhook URL host did not resolve to any address');
    }

    for (const { address } of resolved) {
      if (this.isBlockedIp(address)) {
        throw new Error('Webhook URL resolves to a loopback, private, or link-local address');
      }
    }

    // Pin to the first validated address so the request connects to an IP we
    // actually checked, not whatever a later DNS lookup might return.
    return { parsed, pinnedAddress: resolved[0].address };
  }

  /**
   * Sends a single signed POST, connecting to a pre-validated IP.
   *
   * Why not `fetch`: Node's global fetch re-resolves the hostname at connect
   * time, so the IP the SSRF guard validated and the IP actually dialed can
   * differ (DNS-rebinding TOCTOU). Here we force the socket to the validated
   * `pinnedAddress` via a custom `lookup`, while the URL's hostname still drives
   * the Host header and TLS SNI/certificate validation. Redirects are never
   * followed (a 3xx is surfaced as a non-2xx response), closing the redirect
   * SSRF vector as well.
   *
   * `protected` so unit tests can stub the actual network call.
   */
  protected sendWebhook(
    parsed: URL,
    opts: { headers: Record<string, string>; body: string; pinnedAddress: string },
  ): Promise<{ ok: boolean; status: number }> {
    const transport = parsed.protocol === 'https:' ? https : http;
    const family = isIP(opts.pinnedAddress) || 4;

    const pinnedLookup = (
      _hostname: string,
      options: any,
      callback: (err: NodeJS.ErrnoException | null, address: any, family?: number) => void,
    ): void => {
      if (options && options.all) {
        callback(null, [{ address: opts.pinnedAddress, family }]);
      } else {
        callback(null, opts.pinnedAddress, family);
      }
    };

    return new Promise((resolve, reject) => {
      const req = transport.request(
        parsed,
        {
          method: 'POST',
          headers: {
            ...opts.headers,
            'Content-Length': Buffer.byteLength(opts.body).toString(),
          },
          lookup: pinnedLookup as any,
          timeout: 10_000,
        },
        (res) => {
          const status = res.statusCode ?? 0;
          res.resume(); // drain & discard the response body
          resolve({ ok: status >= 200 && status < 300, status });
        },
      );
      req.on('timeout', () => req.destroy(new Error('Webhook request timed out')));
      req.on('error', (err) => reject(err));
      req.write(opts.body);
      req.end();
    });
  }

  /**
   * DNS resolution seam. Overridable in tests so unit tests need no real network.
   * Returns all A/AAAA records for the host.
   */
  protected async resolveHost(host: string): Promise<{ address: string }[]> {
    return lookup(host, { all: true });
  }

  /**
   * Detect numeric hosts that are not canonical dotted-quad IPv4 / standard IPv6.
   * Browsers/Node's fetch will happily parse 0x7f000001, 2130706433, 0177.1, etc.
   * as 127.0.0.1, bypassing a naive `^127\.` check.
   */
  private looksLikeObfuscatedIp(host: string): boolean {
    if (isIP(host) !== 0) return false; // canonical IP, handled elsewhere
    // Pure decimal integer (e.g. 2130706433) — not a valid hostname label.
    if (/^\d+$/.test(host)) return true;
    // Hex (0x...) or octal (leading 0) numeric segments anywhere, or any segment
    // that is a bare hex literal. A legitimate DNS label never starts with 0x.
    if (/(^|\.)0x[0-9a-f]+/.test(host)) return true;
    // Dotted form where every part is numeric but contains an octal-style leading
    // zero (0177.0.0.1) or has fewer/odd parts that are all-numeric and not a
    // canonical IPv4 (isIP already returned 0 above).
    const parts = host.split('.');
    if (parts.length > 0 && parts.every((p) => /^\d+$/.test(p) && p.length > 0)) {
      return true; // all-numeric dotted but not a canonical IPv4 => obfuscated
    }
    return false;
  }

  private isBlockedIp(ip: string): boolean {
    const kind = isIP(ip);
    if (kind === 4) {
      return this.isBlockedIpv4(ip);
    }
    if (kind === 6) {
      const lower = ip.toLowerCase();
      // Unspecified / loopback.
      if (lower === '::' || lower === '::1') return true;
      // Unique-local (fc00::/7) and link-local (fe80::/10).
      if (/^f[cd][0-9a-f]*:/.test(lower) || lower.startsWith('fe8') || lower.startsWith('fe9') ||
          lower.startsWith('fea') || lower.startsWith('feb')) {
        return true;
      }
      // IPv4-mapped (::ffff:a.b.c.d) — validate the embedded IPv4. Anchored at the
      // start so a legitimate public address that merely ENDS in ":ffff:x:y" is not
      // misclassified as mapped.
      const mappedDotted = lower.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
      if (mappedDotted) {
        return this.isBlockedIpv4(mappedDotted[1]);
      }
      // URL/Node normalizes ::ffff:127.0.0.1 to the hex form ::ffff:7f00:1, which the
      // dotted check above misses — decode the trailing 32 bits back to dotted-quad
      // and re-check. (This was the IPv4-mapped-loopback SSRF bypass.)
      const mappedHex = lower.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
      if (mappedHex) {
        const hi = parseInt(mappedHex[1], 16);
        const lo = parseInt(mappedHex[2], 16);
        const dotted = `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
        return this.isBlockedIpv4(dotted);
      }
      return false;
    }
    // Unknown/non-IP — block defensively.
    return true;
  }

  private isBlockedIpv4(ip: string): boolean {
    if (/^0\./.test(ip)) return true; // "this network" 0.0.0.0/8
    if (/^127\./.test(ip)) return true; // loopback
    if (/^10\./.test(ip)) return true; // private
    if (/^192\.168\./.test(ip)) return true; // private
    if (/^169\.254\./.test(ip)) return true; // link-local
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true; // private
    if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(ip)) return true; // CGNAT 100.64/10
    return false;
  }
}
