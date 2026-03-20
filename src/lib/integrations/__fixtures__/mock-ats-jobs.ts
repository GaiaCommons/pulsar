import type { NormalizedAtsJob } from "@/types/integrations";

/** Aligned with FAUX_WHATWEWILL_PROFILE for deterministic scoring tests. */
export const MOCK_ATS_JOBS: NormalizedAtsJob[] = [
  {
    source: "greenhouse",
    title: "Senior Software Engineer — Civic Platform",
    company: "mock-board",
    locationText: "Remote — United States",
    remoteType: "remote",
    descriptionText:
      "We need a senior engineer with strong TypeScript and React experience. " +
      "You will build dashboards for nonprofits and government partners. PostgreSQL and GraphQL a plus. " +
      "Civic tech background welcome. Full remote within US.",
    canonicalUrl: "https://example.com/jobs/1",
  },
  {
    source: "lever",
    title: "Barista — Downtown Cafe",
    company: "mock-lever",
    locationText: "On-site — Portland, OR",
    remoteType: "onsite",
    descriptionText:
      "Prepare espresso drinks and provide excellent customer service. No engineering required.",
    canonicalUrl: "https://example.com/jobs/2",
  },
  {
    source: "greenhouse",
    title: "Full Stack Engineer",
    company: "mock-board",
    locationText: "Hybrid — Austin, TX",
    remoteType: "hybrid",
    descriptionText:
      "Ruby on Rails and React. Work with product on edtech features for K-12 schools.",
    canonicalUrl: "https://example.com/jobs/3",
  },
];
