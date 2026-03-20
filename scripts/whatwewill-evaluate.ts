/**
 * Print match + brief quality for the faux member profile (human review).
 *
 * Matches: uses real Greenhouse/Lever env if set; otherwise same mocked ATS as unit tests.
 * Brief: calls OpenAI only if OPENAI_API_KEY is set.
 *
 * Usage:
 *   npx tsx scripts/whatwewill-evaluate.ts
 *   WHATWEWILL_GREENHOUSE_BOARDS=yourboard OPENAI_API_KEY=... npx tsx scripts/whatwewill-evaluate.ts
 */
import { FAUX_WHATWEWILL_PROFILE } from "../src/lib/integrations/__fixtures__/faux-whatwewill-profile";
import { MOCK_ATS_JOBS } from "../src/lib/integrations/__fixtures__/mock-ats-jobs";
import { generateCareerBrief } from "../src/lib/integrations/whatwewill-brief";
import { buildMatchesFromProfile } from "../src/lib/integrations/whatwewill-match";

async function main() {
  console.log("=== What We Will — faux member eval ===\n");
  console.log("personId:", FAUX_WHATWEWILL_PROFILE.personId);
  console.log("target roles:", FAUX_WHATWEWILL_PROFILE.interestedRoleTitles.join(", "));

  const hasBoards =
    Boolean(process.env.WHATWEWILL_GREENHOUSE_BOARDS?.trim()) ||
    Boolean(process.env.WHATWEWILL_LEVER_COMPANIES?.trim()) ||
    Boolean(process.env.GREENHOUSE_BOARD_TOKENS?.trim()) ||
    Boolean(process.env.LEVER_COMPANY_SLUGS?.trim());

  if (hasBoards) {
    console.log("\n--- Live matches (real ATS from env) ---\n");
    try {
      const { candidateSummary, matches } = await buildMatchesFromProfile(
        FAUX_WHATWEWILL_PROFILE
      );
      console.log("Candidate summary:\n", candidateSummary, "\n");
      console.log(`Top ${Math.min(8, matches.length)} matches:\n`);
      for (const m of matches.slice(0, 8)) {
        console.log(
          `- [${m.score}] ${m.label} — ${m.roleTitle} @ ${m.company} (${m.location})`
        );
        console.log(`  ${m.applyUrl}`);
        console.log(`  Reasons: ${m.reasons.join(" | ")}`);
        if (m.concern) console.log(`  Concern: ${m.concern}`);
        console.log("");
      }
    } catch (e) {
      console.error("Live match fetch failed:", e);
    }
  } else {
    console.log("\n--- Mock matches (no ATS env; synthetic jobs only) ---\n");
    const { buildCandidateSignals, scoreJob, summarizeCandidate } = await import(
      "../src/lib/integrations/whatwewill-match"
    );
    const candidate = buildCandidateSignals(FAUX_WHATWEWILL_PROFILE);
    const summary = summarizeCandidate(FAUX_WHATWEWILL_PROFILE, candidate);
    console.log("Candidate summary:\n", summary, "\n");
    const ranked = MOCK_ATS_JOBS.map((job) => scoreJob(job, candidate))
      .filter((x) => x.score >= 55)
      .sort((a, b) => b.score - a.score);
    for (const { match: m } of ranked) {
      console.log(`- [${m.score}] ${m.label} — ${m.roleTitle} @ ${m.company}`);
      console.log(`  Reasons: ${m.reasons.join(" | ")}\n`);
    }
  }

  if (!process.env.OPENAI_API_KEY) {
    console.log("\n(Set OPENAI_API_KEY to print a live career brief.)\n");
    return;
  }

  console.log("\n--- Career brief (OpenAI) ---\n");
  try {
    const brief = await generateCareerBrief(FAUX_WHATWEWILL_PROFILE);
    console.log(brief.markdown);
    console.log("\n--- meta ---\nmodel:", brief.model, "\nrequestId:", brief.requestId);
  } catch (e) {
    console.error("Brief generation failed:", e);
  }
}

main();
