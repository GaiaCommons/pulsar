import type { NextRequest } from "next/server";

type ApiKeyCheckResult =
  | { ok: true }
  | { ok: false; status: 401 | 403; code: "UNAUTHORIZED" | "FORBIDDEN"; message: string };

export function verifyWhatWeWillApiKey(req: NextRequest): ApiKeyCheckResult {
  const configuredApiKey = process.env.WHATWEWILL_API_KEY;
  const incomingApiKey = req.headers.get("x-api-key");

  if (!incomingApiKey) {
    return {
      ok: false,
      status: 401,
      code: "UNAUTHORIZED",
      message: "Missing x-api-key header",
    };
  }

  if (!configuredApiKey) {
    return {
      ok: false,
      status: 403,
      code: "FORBIDDEN",
      message: "Server API key is not configured",
    };
  }

  if (incomingApiKey !== configuredApiKey) {
    return {
      ok: false,
      status: 403,
      code: "FORBIDDEN",
      message: "Invalid API key",
    };
  }

  return { ok: true };
}
