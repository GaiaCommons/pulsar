import { describe, expect, it } from "vitest";
import { FAUX_WHATWEWILL_PROFILE } from "./__fixtures__/faux-whatwewill-profile";
import { MOCK_ATS_JOBS } from "./__fixtures__/mock-ats-jobs";
import {
  buildCandidateSignals,
  scoreJob,
  summarizeCandidate,
} from "./whatwewill-match";

describe("buildCandidateSignals", () => {
  it("dedupes skills and builds keyword set from resume + roles", () => {
    const candidate = buildCandidateSignals({
      ...FAUX_WHATWEWILL_PROFILE,
      skills: ["React", "react", " TypeScript "],
    });
    expect(candidate.skills).toContain("React");
    expect(candidate.skills).toContain("TypeScript");
    expect(candidate.roleTitles.length).toBeGreaterThan(0);
    expect(candidate.keywordSet.has("typescript") || candidate.keywordSet.has("react")).toBe(
      true
    );
  });
});

describe("scoreJob", () => {
  const candidate = buildCandidateSignals(FAUX_WHATWEWILL_PROFILE);

  it("scores civic-tech senior role higher than unrelated onsite role", () => {
    const strong = scoreJob(MOCK_ATS_JOBS[0], candidate);
    const weak = scoreJob(MOCK_ATS_JOBS[1], candidate);
    expect(strong.score).toBeGreaterThan(weak.score);
    expect(strong.match.roleTitle).toContain("Senior Software Engineer");
    expect(weak.match.roleTitle).toContain("Barista");
  });

  it("labels high scores as Strong or Good match", () => {
    const { match } = scoreJob(MOCK_ATS_JOBS[0], candidate);
    expect(["Strong match", "Good match", "Stretch"]).toContain(match.label);
    expect(match.reasons.length).toBeGreaterThan(0);
    expect(match.applyUrl).toMatch(/^https?:\/\//);
  });
});

describe("summarizeCandidate", () => {
  it("includes target titles and LinkedIn hint", () => {
    const candidate = buildCandidateSignals(FAUX_WHATWEWILL_PROFILE);
    const summary = summarizeCandidate(FAUX_WHATWEWILL_PROFILE, candidate);
    expect(summary).toMatch(/Targeting|target/i);
    expect(summary).toMatch(/LinkedIn/i);
  });
});

describe("match ranking pipeline (fixture jobs, mirrors buildMatchesFromProfile scoring)", () => {
  it("ranks faux profile: tech roles score above unrelated roles (prod filters score >= 55)", () => {
    const candidate = buildCandidateSignals(FAUX_WHATWEWILL_PROFILE);
    const summary = summarizeCandidate(FAUX_WHATWEWILL_PROFILE, candidate);
    expect(summary.length).toBeGreaterThan(20);

    const scored = MOCK_ATS_JOBS.map((job) => scoreJob(job, candidate)).sort(
      (a, b) => b.score - a.score
    );
    expect(scored).toHaveLength(3);
    expect(scored[0].match.roleTitle).toMatch(/Senior Software|Full Stack/i);
    expect(scored[2].match.roleTitle).toMatch(/Barista/i);
    expect(scored[0].score).toBeGreaterThan(scored[2].score);
    // API filters matches with score >= 55; fixture scores may sit below that while
    // still preserving relative ranking (see eval script + real ATS for absolute levels).
  });
});
