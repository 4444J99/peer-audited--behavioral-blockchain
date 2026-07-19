import { execFileSync } from "child_process";

function hasContainerRuntime(): boolean {
  if (process.env.CI === "true") return true;
  if (process.env.STYX_REQUIRE_TESTCONTAINERS === "true") return true;
  if (process.env.STYX_SKIP_TESTCONTAINERS === "true") return false;
  if (process.env.DOCKER_HOST || process.env.TESTCONTAINERS_HOST_OVERRIDE) {
    return true;
  }

  try {
    execFileSync("docker", ["info"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export const describeWithContainerRuntime: typeof describe =
  hasContainerRuntime() ? describe : describe.skip;
