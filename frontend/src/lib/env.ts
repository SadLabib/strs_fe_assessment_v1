import "server-only";
import { z } from "zod";

const envSchema = z.object({
  API_BASE_URL: z
    .url({ protocol: /^https?$/ })
    .default("http://localhost:8000"),
});

const parsed = envSchema.safeParse({
  API_BASE_URL: process.env.API_BASE_URL,
});

if (!parsed.success) {
  throw new Error(
    `Invalid environment variables (see .env.example):\n${z.prettifyError(parsed.error)}`,
  );
}

export const env = parsed.data;
