import { randomUUID } from "crypto";
import {
  WhatWeWillBriefRequest,
  WhatWeWillBriefResponse,
  WhatWeWillBriefTone,
} from "@/types/integrations";

const DEFAULT_MODEL = "gpt-4o-mini";

export async function generateCareerBrief(
  payload: WhatWeWillBriefRequest
): Promise<WhatWeWillBriefResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const tone = payload.tone ?? "supportive";
  const maxWords = clampWords(payload.maxWords);
  const includeIllustrativeLinks = payload.includeIllustrativeLinks !== false;

  const prompt = buildPrompt(payload, tone, maxWords, includeIllustrativeLinks);

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.WHATWEWILL_BRIEF_MODEL || DEFAULT_MODEL,
      input: [
        {
          role: "system",
          content:
            "You are a practical career strategist. Return concise markdown with clear section headings and actionable bullets.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(`OpenAI brief generation failed (${response.status}): ${bodyText}`);
  }

  const json = (await response.json()) as {
    output_text?: string;
    model?: string;
  };

  const markdown = (json.output_text ?? "").trim();
  if (!markdown) {
    throw new Error("OpenAI returned an empty brief");
  }

  return {
    requestId: randomUUID(),
    markdown,
    model: json.model ?? process.env.WHATWEWILL_BRIEF_MODEL || DEFAULT_MODEL,
    generatedAt: new Date().toISOString(),
  };
}

function buildPrompt(
  payload: WhatWeWillBriefRequest,
  tone: WhatWeWillBriefTone,
  maxWords: number,
  includeIllustrativeLinks: boolean
): string {
  return `
Create a career brief for this community member.

Tone: ${tone}
Word limit target: ${maxWords}

Profile data:
- personId: ${payload.personId}
- linkedinUrl: ${payload.linkedinUrl ?? "not provided"}
- resumeText: ${payload.resumeText ? truncate(payload.resumeText, 2400) : "not provided"}
- experienceSummary: ${payload.experienceSummary ?? "not provided"}
- skills: ${payload.skills.join(", ") || "none provided"}
- interestedIndustries: ${payload.interestedIndustries.join(", ") || "none provided"}
- interestedRoleTitles: ${payload.interestedRoleTitles.join(", ") || "none provided"}
- preferredWorkTypes: ${payload.preferredWorkTypes.join(", ") || "not specified"}
- preferredLocations: ${payload.preferredLocations.join(", ") || "not specified"}

Output requirements:
1) Markdown only.
2) Include sections:
   - "Career Snapshot"
   - "Strengths To Highlight"
   - "Role Targets"
   - "Company Targets"
   - "Resume Tailoring Priorities"
   - "30-Day Action Plan"
3) If suggesting links or organizations, clearly label them as illustrative and possibly inactive.
4) Include a final disclaimer: "Illustrative leads may not be active postings."
5) Keep content concrete, practical, and non-generic.
6) ${includeIllustrativeLinks ? "Include 5-10 illustrative company/role leads." : "Do not include external links."}
`;
}

function clampWords(value: number | undefined): number {
  if (!value || Number.isNaN(value)) return 700;
  return Math.max(250, Math.min(1200, Math.floor(value)));
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
}

