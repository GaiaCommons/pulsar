import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { verifyWhatWeWillApiKey } from "@/lib/integrations/auth";
import { buildMatchesFromProfile } from "@/lib/integrations/whatwewill-match";
import {
  IntegrationErrorResponse,
  PreferredWorkType,
  WhatWeWillMatchResponse,
  WhatWeWillProfileRequest,
} from "@/types/integrations";

const MAX_BODY_BYTES = 1_000_000;
const MAX_LIST_LENGTH = 50;
const MAX_TEXT_LENGTH = 20_000;

export async function POST(req: NextRequest) {
  const authResult = verifyWhatWeWillApiKey(req);
  if (!authResult.ok) {
    return NextResponse.json<IntegrationErrorResponse>(
      { code: authResult.code, message: authResult.message },
      { status: authResult.status }
    );
  }

  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json<IntegrationErrorResponse>(
      {
        code: "PAYLOAD_TOO_LARGE",
        message: `Payload must be <= ${MAX_BODY_BYTES} bytes`,
      },
      { status: 413 }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json<IntegrationErrorResponse>(
      { code: "BAD_REQUEST", message: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const validated = validateProfilePayload(rawBody);
  if (!validated.ok) {
    return NextResponse.json<IntegrationErrorResponse>(
      { code: "BAD_REQUEST", message: validated.message },
      { status: 400 }
    );
  }

  try {
    const result = await buildMatchesFromProfile(validated.payload);
    const response: WhatWeWillMatchResponse = {
      requestId: randomUUID(),
      candidateSummary: result.candidateSummary,
      matches: result.matches,
    };
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("WhatWeWill match API error", error);
    return NextResponse.json<IntegrationErrorResponse>(
      {
        code: "INTERNAL_ERROR",
        message: "Failed to generate matches",
      },
      { status: 500 }
    );
  }
}

function validateProfilePayload(
  input: unknown
): { ok: true; payload: WhatWeWillProfileRequest } | { ok: false; message: string } {
  if (!input || typeof input !== "object") {
    return { ok: false, message: "Payload must be an object" };
  }

  const body = input as Record<string, unknown>;
  const personId = asTrimmedString(body.personId);
  if (!personId) return { ok: false, message: "personId is required" };

  const linkedinUrl = asOptionalString(body.linkedinUrl);
  const resumeText = asOptionalString(body.resumeText);
  const resumeUrl = asOptionalString(body.resumeUrl);
  const experienceSummary = asOptionalString(body.experienceSummary);

  const skills = asStringList(body.skills, "skills");
  if (!skills.ok) return skills;
  const interestedIndustries = asStringList(body.interestedIndustries, "interestedIndustries");
  if (!interestedIndustries.ok) return interestedIndustries;
  const interestedRoleTitles = asStringList(body.interestedRoleTitles, "interestedRoleTitles");
  if (!interestedRoleTitles.ok) return interestedRoleTitles;
  const preferredLocations = asStringList(body.preferredLocations, "preferredLocations");
  if (!preferredLocations.ok) return preferredLocations;
  const preferredWorkTypes = asWorkTypes(body.preferredWorkTypes);
  if (!preferredWorkTypes.ok) return preferredWorkTypes;

  const safeResumeText = resumeText ?? "";
  const safeExperienceSummary = experienceSummary ?? "";

  if (!safeResumeText && skills.value.length === 0 && safeExperienceSummary.length === 0) {
    return {
      ok: false,
      message: "Provide at least one of resumeText, skills, or experienceSummary",
    };
  }

  if (safeResumeText.length > MAX_TEXT_LENGTH || safeExperienceSummary.length > MAX_TEXT_LENGTH) {
    return { ok: false, message: `Text fields must be <= ${MAX_TEXT_LENGTH} characters` };
  }

  return {
    ok: true,
    payload: {
      personId,
      linkedinUrl,
      resumeText,
      resumeUrl,
      skills: skills.value,
      experienceSummary,
      interestedIndustries: interestedIndustries.value,
      interestedRoleTitles: interestedRoleTitles.value,
      preferredWorkTypes: preferredWorkTypes.value,
      preferredLocations: preferredLocations.value,
    },
  };
}

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asOptionalString(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function asStringList(
  value: unknown,
  field: string
): { ok: true; value: string[] } | { ok: false; message: string } {
  if (value == null) return { ok: true, value: [] };
  if (!Array.isArray(value)) return { ok: false, message: `${field} must be an array of strings` };
  if (value.length > MAX_LIST_LENGTH) {
    return { ok: false, message: `${field} can contain at most ${MAX_LIST_LENGTH} entries` };
  }
  const normalized = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  if (normalized.length !== value.length) {
    return { ok: false, message: `${field} must only contain strings` };
  }
  return { ok: true, value: Array.from(new Set(normalized)) };
}

function asWorkTypes(
  value: unknown
): { ok: true; value: PreferredWorkType[] } | { ok: false; message: string } {
  const parsed = asStringList(value, "preferredWorkTypes");
  if (!parsed.ok) return parsed;

  const allowed = new Set<PreferredWorkType>(["remote", "hybrid", "onsite"]);
  const list = parsed.value.map((item) => item.toLowerCase());
  const invalid = list.filter((item) => !allowed.has(item as PreferredWorkType));
  if (invalid.length > 0) {
    return { ok: false, message: "preferredWorkTypes values must be remote, hybrid, or onsite" };
  }

  return {
    ok: true,
    value: list as PreferredWorkType[],
  };
}
