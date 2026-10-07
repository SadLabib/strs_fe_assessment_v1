import "server-only";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { env } from "@/lib/env";

import { ApiError } from "./errors";

const TIMEOUT_MS = 8_000;

type RequestOptions = {
  method?: "GET" | "POST" | "PUT";
  body?: unknown;
};

/**
 * Calls the FastAPI backend from the Next.js server and validates the JSON
 * against `schema`. The browser never talks to the API directly.
 */
export async function apiFetch<Schema extends z.ZodType>(
  path: string,
  schema: Schema,
  { method = "GET", body }: RequestOptions = {},
): Promise<z.output<Schema>> {
  let response: Response;
  try {
    response = await fetch(new URL(path, env.API_BASE_URL), {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined && { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (cause) {
    // Next.js signals things like "render this route dynamically" by throwing
    // from fetch; those must reach Next, not become network errors.
    unstable_rethrow(cause);
    throw new ApiError(
      "network",
      `${method} ${path} failed: training API unreachable`,
      {
        cause,
      },
    );
  }

  if (!response.ok) {
    throw await ApiError.fromResponse(response);
  }

  const json: unknown = await response.json().catch(() => undefined);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    console.error(
      `Unexpected response from ${method} ${path}:\n${z.prettifyError(parsed.error)}`,
    );
    throw new ApiError(
      "invalid_response",
      `${method} ${path} returned unexpected data`,
    );
  }

  return parsed.data;
}
