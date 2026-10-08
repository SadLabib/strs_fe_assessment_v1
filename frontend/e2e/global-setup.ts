import { resetData, startBackend, waitForApi } from "./support/backend";

/**
 * Runs once before the suite: start the backend (unless told it's already
 * running elsewhere), wait for it, then reset to the known seed.
 */
export default async function globalSetup() {
  if (process.env.SKIP_BACKEND_SETUP !== "1") {
    console.log("[e2e] Starting the backend with docker compose…");
    startBackend();
  }
  await waitForApi();
  resetData();
  console.log("[e2e] Backend ready and reseeded.");
}
