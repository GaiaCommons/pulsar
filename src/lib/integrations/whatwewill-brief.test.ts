import { describe, expect, it } from "vitest";
import { FAUX_WHATWEWILL_PROFILE } from "./__fixtures__/faux-whatwewill-profile";
import { buildCareerBriefPrompt } from "./whatwewill-brief";

describe("buildCareerBriefPrompt", () => {
  it("includes required sections and profile fields", () => {
    const prompt = buildCareerBriefPrompt(
      FAUX_WHATWEWILL_PROFILE,
      "supportive",
      700,
      true
    );
    expect(prompt).toContain("Career Snapshot");
    expect(prompt).toContain("Strengths To Highlight");
    expect(prompt).toContain("Role Targets");
    expect(prompt).toContain(FAUX_WHATWEWILL_PROFILE.personId);
    expect(prompt).toContain("TypeScript");
    expect(prompt).toContain("Illustrative leads may not be active postings");
  });

  it("embeds truncated resume when present", () => {
    const prompt = buildCareerBriefPrompt(
      FAUX_WHATWEWILL_PROFILE,
      "coach",
      500,
      false
    );
    expect(prompt).toContain("SAM SAMPLE");
    expect(prompt).toMatch(/Word limit target:\s*500/);
    expect(prompt).toContain("Do not include external links");
  });
});
