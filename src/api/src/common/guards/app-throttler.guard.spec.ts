import { ExecutionContext } from "@nestjs/common";
import { MODULE_METADATA } from "@nestjs/common/constants";
import { APP_GUARD, Reflector } from "@nestjs/core";
import { ThrottlerException, ThrottlerStorage } from "@nestjs/throttler";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { AppModule } from "../../app.module";
import { AuthController } from "../../modules/auth/auth.controller";
import { AppThrottlerGuard } from "./app-throttler.guard";

interface GuardHarness {
  context: ExecutionContext;
  guard: AppThrottlerGuard;
  increment: jest.MockedFunction<ThrottlerStorage["increment"]>;
  responseHeader: jest.Mock;
}

function readEnvFile(path: string): Record<string, string> {
  const values: Record<string, string> = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    values[line.slice(0, separator)] = line.slice(separator + 1);
  }
  return values;
}

describe("AppThrottlerGuard", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.STYX_DEMO_BYPASS_LOGIN_THROTTLE;
    delete process.env.STYX_DEMO_RUNTIME;
    delete process.env.STYX_ENV_LABEL;
    delete process.env.STYX_TEST_MONEY_MODE;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  async function createHarness(options?: {
    path?: string;
    method?: string;
    remoteAddress?: string;
    headers?: Record<string, string>;
    handler?: (...args: never[]) => unknown;
  }): Promise<GuardHarness> {
    let totalHits = 0;
    const increment = jest.fn<
      ReturnType<ThrottlerStorage["increment"]>,
      Parameters<ThrottlerStorage["increment"]>
    >(async (_key, _ttl, limit) => {
      totalHits += 1;
      const isBlocked = totalHits > limit;
      return {
        totalHits,
        timeToExpire: 60,
        isBlocked,
        timeToBlockExpire: isBlocked ? 60 : 0,
      };
    });
    const storage = { increment } as ThrottlerStorage;
    const responseHeader = jest.fn();
    const handler = options?.handler ?? AuthController.prototype.login;
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: options?.method ?? "POST",
          originalUrl: options?.path ?? "/auth/login",
          headers: options?.headers ?? {},
          ip: options?.remoteAddress ?? "127.0.0.1",
          socket: {
            remoteAddress: options?.remoteAddress ?? "127.0.0.1",
          },
        }),
        getResponse: () => ({ header: responseHeader }),
      }),
      getHandler: () => handler,
      getClass: () => AuthController,
    } as unknown as ExecutionContext;

    const guard = new AppThrottlerGuard(
      [{ ttl: 60_000, limit: 60 }],
      storage,
      new Reflector(),
    );
    await guard.onModuleInit();

    return { context, guard, increment, responseHeader };
  }

  async function expectSixthRequestBlocked(
    harness: GuardHarness,
  ): Promise<void> {
    for (let request = 1; request <= 5; request += 1) {
      await expect(harness.guard.canActivate(harness.context)).resolves.toBe(
        true,
      );
    }
    await expect(
      harness.guard.canActivate(harness.context),
    ).rejects.toBeInstanceOf(ThrottlerException);
    expect(harness.responseHeader).toHaveBeenCalledWith("Retry-After", 60);
  }

  it("keeps the login policy at five requests per minute by default", async () => {
    process.env.NODE_ENV = "development";
    process.env.STYX_ENV_LABEL = "local-development";
    const harness = await createHarness();

    await expectSixthRequestBlocked(harness);
    expect(harness.increment).toHaveBeenCalledTimes(6);
  });

  it("bypasses repeated loopback logins only when the local demo opts in", async () => {
    process.env.NODE_ENV = "demo";
    process.env.STYX_ENV_LABEL = "local-canonical-demo";
    process.env.STYX_DEMO_BYPASS_LOGIN_THROTTLE = "true";
    process.env.STYX_DEMO_RUNTIME = "native";
    process.env.STYX_TEST_MONEY_MODE = "true";
    const harness = await createHarness();

    for (let request = 1; request <= 8; request += 1) {
      await expect(harness.guard.canActivate(harness.context)).resolves.toBe(
        true,
      );
    }
    expect(harness.increment).not.toHaveBeenCalled();
  });

  it("accepts the documented local label with canonical Compose overrides", async () => {
    const repoRoot = resolve(__dirname, "../../../../..");
    const baseEnvironment = {
      ...readEnvFile(resolve(repoRoot, ".config/docker/compose.defaults.env")),
      ...readEnvFile(resolve(repoRoot, ".env.example")),
    };
    const canonicalOverrides = {
      STYX_TEST_MONEY_MODE: "true",
      STYX_ENV_LABEL: "local-canonical-demo",
      STYX_DEMO_RUNTIME: "compose",
      STYX_DEMO_BYPASS_LOGIN_THROTTLE: "true",
    };
    const resolvedEnvironment = {
      ...baseEnvironment,
      ...canonicalOverrides,
    };
    const composeConfig = readFileSync(
      resolve(repoRoot, ".config/docker/docker-compose.yml"),
      "utf8",
    );
    const canonicalLauncher = readFileSync(
      resolve(repoRoot, "scripts/demo/launch-canonical.sh"),
      "utf8",
    );
    const resetLauncher = readFileSync(
      resolve(repoRoot, "scripts/demo/reset.sh"),
      "utf8",
    );

    expect(baseEnvironment.STYX_ENV_LABEL).toBe("local");
    expect(resolvedEnvironment).toMatchObject({
      STYX_ENV_LABEL: "local-canonical-demo",
      STYX_DEMO_RUNTIME: "compose",
      STYX_DEMO_BYPASS_LOGIN_THROTTLE: "true",
      STYX_TEST_MONEY_MODE: "true",
    });
    expect(composeConfig).toContain(
      "127.0.0.1:${STYX_DOCKER_API_PORT:?STYX_DOCKER_API_PORT is required}",
    );
    expect(composeConfig).toContain(
      "127.0.0.1:${STYX_DOCKER_WEB_PORT:?STYX_DOCKER_WEB_PORT is required}",
    );
    for (const launcher of [canonicalLauncher, resetLauncher]) {
      expect(launcher).toContain("STYX_DEMO_RUNTIME=compose");
      expect(launcher).toContain("STYX_DEMO_BYPASS_LOGIN_THROTTLE=true");
    }

    process.env.NODE_ENV = "demo";
    process.env.STYX_ENV_LABEL = baseEnvironment.STYX_ENV_LABEL;
    process.env.STYX_DEMO_BYPASS_LOGIN_THROTTLE =
      resolvedEnvironment.STYX_DEMO_BYPASS_LOGIN_THROTTLE;
    process.env.STYX_DEMO_RUNTIME = resolvedEnvironment.STYX_DEMO_RUNTIME;
    process.env.STYX_TEST_MONEY_MODE = resolvedEnvironment.STYX_TEST_MONEY_MODE;
    const harness = await createHarness({ remoteAddress: "172.18.0.1" });

    for (let request = 1; request <= 8; request += 1) {
      await expect(harness.guard.canActivate(harness.context)).resolves.toBe(
        true,
      );
    }
    expect(harness.increment).not.toHaveBeenCalled();
  });

  it("does not bypass a private LAN peer in the native demo", async () => {
    process.env.NODE_ENV = "demo";
    process.env.STYX_ENV_LABEL = "local-native-demo";
    process.env.STYX_DEMO_BYPASS_LOGIN_THROTTLE = "true";
    process.env.STYX_DEMO_RUNTIME = "native";
    process.env.STYX_TEST_MONEY_MODE = "true";
    const harness = await createHarness({ remoteAddress: "192.168.1.42" });

    await expectSixthRequestBlocked(harness);
  });

  it.each(["development", "demo"])(
    "does not bypass in %s without the explicit flag",
    async (environment) => {
      process.env.NODE_ENV = environment;
      process.env.STYX_ENV_LABEL = "local-canonical-demo";
      const harness = await createHarness();

      await expectSixthRequestBlocked(harness);
    },
  );

  it("does not bypass without an explicit local demo runtime", async () => {
    process.env.NODE_ENV = "demo";
    process.env.STYX_ENV_LABEL = "local-canonical-demo";
    process.env.STYX_DEMO_BYPASS_LOGIN_THROTTLE = "true";
    process.env.STYX_TEST_MONEY_MODE = "true";
    const harness = await createHarness();

    await expectSixthRequestBlocked(harness);
  });

  it("does not bypass outside synthetic test-money mode", async () => {
    process.env.NODE_ENV = "demo";
    process.env.STYX_ENV_LABEL = "local-canonical-demo";
    process.env.STYX_DEMO_BYPASS_LOGIN_THROTTLE = "true";
    process.env.STYX_DEMO_RUNTIME = "native";
    const harness = await createHarness();

    await expectSixthRequestBlocked(harness);
  });

  it("does not bypass a non-login route", async () => {
    process.env.NODE_ENV = "demo";
    process.env.STYX_ENV_LABEL = "local-canonical-demo";
    process.env.STYX_DEMO_BYPASS_LOGIN_THROTTLE = "true";
    process.env.STYX_DEMO_RUNTIME = "native";
    process.env.STYX_TEST_MONEY_MODE = "true";
    const harness = await createHarness({
      path: "/auth/register",
      handler: AuthController.prototype.register,
    });

    await expectSixthRequestBlocked(harness);
  });

  it("does not bypass a non-loopback login request", async () => {
    process.env.NODE_ENV = "demo";
    process.env.STYX_ENV_LABEL = "local-canonical-demo";
    process.env.STYX_DEMO_BYPASS_LOGIN_THROTTLE = "true";
    process.env.STYX_DEMO_RUNTIME = "native";
    process.env.STYX_TEST_MONEY_MODE = "true";
    const harness = await createHarness({ remoteAddress: "203.0.113.8" });

    await expectSixthRequestBlocked(harness);
  });

  it("does not treat the internal service token as throttler bypass authority", async () => {
    process.env.NODE_ENV = "development";
    process.env.STYX_ENV_LABEL = "local-development";
    process.env.INTERNAL_SERVICE_TOKEN = "internal-service-test-token";
    const harness = await createHarness({
      headers: {
        "x-styx-throttle-bypass": "internal-service-test-token",
      },
    });

    await expectSixthRequestBlocked(harness);
  });

  it("does not bypass when the environment label is not explicitly local", async () => {
    process.env.NODE_ENV = "demo";
    process.env.STYX_ENV_LABEL = "beta-demo";
    process.env.STYX_DEMO_BYPASS_LOGIN_THROTTLE = "true";
    process.env.STYX_DEMO_RUNTIME = "native";
    process.env.STYX_TEST_MONEY_MODE = "true";
    const harness = await createHarness();

    await expectSixthRequestBlocked(harness);
  });

  it("fails closed in production even when every local marker is present", async () => {
    process.env.NODE_ENV = "production";
    process.env.STYX_ENV_LABEL = "local-canonical-demo";
    process.env.STYX_DEMO_BYPASS_LOGIN_THROTTLE = "true";
    process.env.STYX_DEMO_RUNTIME = "native";
    process.env.STYX_TEST_MONEY_MODE = "true";
    const harness = await createHarness();

    await expectSixthRequestBlocked(harness);
  });

  it("is registered as the application-wide guard", () => {
    const providers = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      AppModule,
    ) as Array<{
      provide?: unknown;
      useClass?: unknown;
    }>;

    expect(providers).toContainEqual({
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    });
  });
});
