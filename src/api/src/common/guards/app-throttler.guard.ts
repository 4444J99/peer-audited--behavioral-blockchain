import { ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { InjectThrottlerOptions, InjectThrottlerStorage, ThrottlerGuard, ThrottlerStorage } from "@nestjs/throttler";
import type { ThrottlerModuleOptions } from "@nestjs/throttler";
import { isIP } from "node:net";

const LOCAL_ENVIRONMENTS = new Set(["development", "demo"]);
const LOCAL_LOGIN_PATHS = new Set(["/auth/login", "/api/auth/login"]);
const LOCAL_DEMO_RUNTIMES = new Set(["native", "compose"]);

function isLocalEnvironmentLabel(value: string): boolean {
  return value === "local" || value.startsWith("local-");
}

function normalizeIpAddress(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  const withoutZone = value.toLowerCase().split("%", 1)[0];
  return withoutZone.startsWith("::ffff:")
    ? withoutZone.slice("::ffff:".length)
    : withoutZone;
}

function isLoopbackAddress(value: unknown): boolean {
  const address = normalizeIpAddress(value);
  if (!address) return false;
  if (address === "::1") return true;
  if (isIP(address) !== 4) return false;
  return Number(address.split(".", 1)[0]) === 127;
}

function isPrivateOrLoopbackAddress(value: unknown): boolean {
  const address = normalizeIpAddress(value);
  if (!address) return false;
  if (isLoopbackAddress(address)) return true;
  if (
    isIP(address) === 6 &&
    (address.startsWith("fc") || address.startsWith("fd"))
  ) {
    return true;
  }

  if (isIP(address) !== 4) return false;
  const [first, second] = address.split(".").map(Number);
  return (
    first === 10 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storageService: ThrottlerStorage,
    reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    if (this.isExplicitLocalLoginBypass(context)) return true;
    return super.shouldSkip(context);
  }

  private isExplicitLocalLoginBypass(context: ExecutionContext): boolean {
    const environment = process.env.NODE_ENV ?? "";
    const environmentLabel = process.env.STYX_ENV_LABEL ?? "";
    const demoRuntime = process.env.STYX_DEMO_RUNTIME ?? "";

    if (
      process.env.STYX_DEMO_BYPASS_LOGIN_THROTTLE !== "true" ||
      process.env.STYX_TEST_MONEY_MODE !== "true" ||
      !LOCAL_ENVIRONMENTS.has(environment) ||
      !isLocalEnvironmentLabel(environmentLabel) ||
      !LOCAL_DEMO_RUNTIMES.has(demoRuntime)
    ) {
      return false;
    }

    const { req } = this.getRequestResponse(context);
    if (req?.method !== "POST") return false;

    const rawPath = req?.originalUrl ?? req?.url ?? req?.path;
    const path = typeof rawPath === "string" ? rawPath.split("?", 1)[0] : "";
    if (!LOCAL_LOGIN_PATHS.has(path)) return false;

    const peerAddress =
      req?.socket?.remoteAddress ?? req?.connection?.remoteAddress ?? req?.ip;
    return demoRuntime === "native"
      ? isLoopbackAddress(peerAddress)
      : isPrivateOrLoopbackAddress(peerAddress);
  }
}
