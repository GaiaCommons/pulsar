import { describe, expect, it } from "vitest";
import { FAUX_WHATWEWILL_PROFILE } from "./__fixtures__/faux-whatwewill-profile";
import { generateCareerBrief } from "./whatwewill-brief";

const runLive = Boolean(process.env.OPENAI_API_KEY);

describe.skipIf(!runLive)("generateCareerBrief (live OpenAI)", () => {
  it("returns markdown brief for faux profile", async () => {
    const result = await generateCareerBrief(FAUX_WHATWEWILL_PROFILE);
    expect(result.markdown.length).toBeGreaterThan(200);
    expect(result.markdown.toLowerCase()).toMatch(/career|strength|role|action/i);
    expect(result.requestId).toBeTruthy();
    expect(result.model).toBeTruthy();
    console.log("\n--- Career brief (live) ---\n", result.markdown.slice(0, 1200), "\n...");
  });
});
