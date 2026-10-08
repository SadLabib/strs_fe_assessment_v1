import { execFileSync } from "node:child_process";
import path from "node:path";

export const API_URL = process.env.E2E_API_URL ?? "http://localhost:8000";

const BACKEND_DIR =
  process.env.E2E_BACKEND_DIR ?? path.resolve(__dirname, "../../../backend");

function compose(...args: string[]) {
  execFileSync("docker", ["compose", ...args], {
    cwd: BACKEND_DIR,
    stdio: "pipe",
  });
}

/** Builds (first run only) and starts Postgres and the API, waiting until both are healthy. */
export function startBackend() {
  compose("up", "-d", "--wait");
}

/**
 * Wipes every draft and submission and reseeds the six training properties.
 * The seed is identical on every run, which is what makes the suite deterministic.
 */
export function resetData() {
  compose("exec", "-T", "api", "python", "-m", "scripts.seed", "--reset");
}

export async function waitForApi(timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${API_URL}/api/health`);
      if (response.ok) return;
    } catch {
      // Not up yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(
    `The training API at ${API_URL} didn't become healthy within ${timeoutMs / 1000}s`,
  );
}
