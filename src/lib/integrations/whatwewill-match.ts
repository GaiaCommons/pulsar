import {
  NormalizedAtsJob,
  PreferredWorkType,
  WhatWeWillMatch,
  WhatWeWillProfileRequest,
} from "@/types/integrations";

const MAX_MATCHES = 20;

type CandidateSignals = {
  roleTitles: string[];
  skills: string[];
  industries: string[];
  preferredWorkTypes: PreferredWorkType[];
  preferredLocations: string[];
  summaryText: string;
  keywordSet: Set<string>;
};

type GreenhouseJobItem = {
  id: number;
  title: string;
  absolute_url: string;
  location?: { name?: string };
  content?: string;
};

type LeverJobItem = {
  id: string;
  text: string;
  hostedUrl: string;
  categories?: {
    location?: string;
    team?: string;
    commitment?: string;
  };
  description?: string;
  descriptionPlain?: string;
  lists?: Array<{ text?: string; content?: string }>;
};

export async function buildMatchesFromProfile(
  payload: WhatWeWillProfileRequest
): Promise<{ candidateSummary: string; matches: WhatWeWillMatch[] }> {
  const candidate = buildCandidateSignals(payload);
  const jobs = await fetchAtsJobs();
  const scored = jobs
    .map((job) => scoreJob(job, candidate))
    .filter((item) => item.score >= 55)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_MATCHES)
    .map((item) => item.match);

  return {
    candidateSummary: summarizeCandidate(payload, candidate),
    matches: scored,
  };
}

export function buildCandidateSignals(payload: WhatWeWillProfileRequest): CandidateSignals {
  const roleTitles = dedupeNonEmpty(payload.interestedRoleTitles);
  const skills = dedupeNonEmpty(payload.skills);
  const industries = dedupeNonEmpty(payload.interestedIndustries);
  const preferredLocations = dedupeNonEmpty(payload.preferredLocations);
  const preferredWorkTypes = Array.from(
    new Set(payload.preferredWorkTypes.filter(Boolean))
  ) as PreferredWorkType[];

  const summaryText = [
    payload.resumeText ?? "",
    payload.experienceSummary ?? "",
    roleTitles.join(" "),
    skills.join(" "),
    industries.join(" "),
  ]
    .join(" ")
    .trim();

  const keywordSet = new Set(tokenize(summaryText));

  return {
    roleTitles,
    skills,
    industries,
    preferredWorkTypes,
    preferredLocations,
    summaryText,
    keywordSet,
  };
}

async function fetchAtsJobs(): Promise<NormalizedAtsJob[]> {
  const greenhouseBoards = readCsvEnv(
    "WHATWEWILL_GREENHOUSE_BOARDS",
    "GREENHOUSE_BOARD_TOKENS"
  );
  const leverCompanies = readCsvEnv(
    "WHATWEWILL_LEVER_COMPANIES",
    "LEVER_COMPANY_SLUGS"
  );

  const [greenhouseJobs, leverJobs] = await Promise.all([
    fetchGreenhouseJobs(greenhouseBoards),
    fetchLeverJobs(leverCompanies),
  ]);

  return [...greenhouseJobs, ...leverJobs];
}

async function fetchGreenhouseJobs(boardTokens: string[]): Promise<NormalizedAtsJob[]> {
  const allJobs = await Promise.all(
    boardTokens.map(async (token) => {
      const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(token)}/jobs`;
      const response = await fetch(url, { next: { revalidate: 900 } });
      if (!response.ok) return [];

      const body = (await response.json()) as { jobs?: GreenhouseJobItem[] };
      const jobs = body.jobs ?? [];
      return jobs.map((job) => ({
        source: "greenhouse" as const,
        title: job.title ?? "Untitled role",
        company: token,
        locationText: (job.location?.name ?? "Unknown").trim(),
        remoteType: inferRemoteType(job.location?.name, job.content),
        descriptionText: stripHtml(job.content ?? ""),
        canonicalUrl: job.absolute_url ?? "",
      }));
    })
  );

  return allJobs.flat().filter((job) => Boolean(job.canonicalUrl));
}

async function fetchLeverJobs(companySlugs: string[]): Promise<NormalizedAtsJob[]> {
  const allJobs = await Promise.all(
    companySlugs.map(async (slug) => {
      const url = `https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`;
      const response = await fetch(url, { next: { revalidate: 900 } });
      if (!response.ok) return [];

      const jobs = (await response.json()) as LeverJobItem[];
      return jobs.map((job) => {
        const description = [
          job.descriptionPlain ?? "",
          job.description ?? "",
          ...(job.lists ?? []).map((list) => `${list.text ?? ""} ${list.content ?? ""}`),
        ]
          .join(" ")
          .trim();

        return {
          source: "lever" as const,
          title: job.text ?? "Untitled role",
          company: slug,
          locationText: (job.categories?.location ?? "Unknown").trim(),
          remoteType: inferRemoteType(job.categories?.location, description),
          descriptionText: stripHtml(description),
          canonicalUrl: job.hostedUrl ?? "",
        };
      });
    })
  );

  return allJobs.flat().filter((job) => Boolean(job.canonicalUrl));
}

export function scoreJob(
  job: NormalizedAtsJob,
  candidate: CandidateSignals
): { score: number; match: WhatWeWillMatch } {
  const text = `${job.title} ${job.descriptionText} ${job.locationText}`.toLowerCase();
  const titleLower = job.title.toLowerCase();

  const titleHitRatio = ratioOfMatches(candidate.roleTitles, titleLower);
  const skillHitRatio = ratioOfMatches(candidate.skills, text);
  const industryHitRatio = ratioOfMatches(candidate.industries, text);
  const keywordHitRatio = keywordOverlap(candidate.keywordSet, tokenize(text));
  const remoteFit = scoreRemoteFit(candidate.preferredWorkTypes, job.remoteType);
  const locationFit = scoreLocationFit(candidate.preferredLocations, job.locationText);

  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        titleHitRatio * 35 +
          skillHitRatio * 25 +
          industryHitRatio * 10 +
          keywordHitRatio * 10 +
          remoteFit * 10 +
          locationFit * 10
      )
    )
  );

  const reasons = buildReasons({
    titleHitRatio,
    skillHitRatio,
    industryHitRatio,
    remoteFit,
    locationFit,
    job,
  });

  const concern = buildConcern({
    score,
    remoteFit,
    locationFit,
    titleHitRatio,
    job,
  });

  const label = score >= 85 ? "Strong match" : score >= 70 ? "Good match" : "Stretch";

  return {
    score,
    match: {
      score,
      label,
      roleTitle: job.title,
      company: job.company,
      location: job.locationText,
      source: job.source,
      reasons,
      concern: concern ?? undefined,
      applyUrl: job.canonicalUrl,
    },
  };
}

function buildReasons(args: {
  titleHitRatio: number;
  skillHitRatio: number;
  industryHitRatio: number;
  remoteFit: number;
  locationFit: number;
  job: NormalizedAtsJob;
}): string[] {
  const reasons: string[] = [];

  if (args.titleHitRatio >= 0.6) {
    reasons.push("Role title aligns strongly with target titles.");
  } else if (args.titleHitRatio > 0) {
    reasons.push("Role title partially aligns with target titles.");
  }

  if (args.skillHitRatio >= 0.4) {
    reasons.push("Job description shows strong overlap with listed skills.");
  } else if (args.skillHitRatio > 0) {
    reasons.push("Job description includes some of the listed skills.");
  }

  if (args.industryHitRatio > 0) {
    reasons.push("Posting language overlaps with stated industry interests.");
  }

  if (args.remoteFit >= 0.8) {
    reasons.push(`Work style appears compatible (${args.job.remoteType}).`);
  }

  if (args.locationFit >= 0.8) {
    reasons.push("Location appears to match stated preferences.");
  }

  if (reasons.length === 0) {
    reasons.push("General keyword overlap with profile and experience context.");
  }

  return reasons.slice(0, 3);
}

function buildConcern(args: {
  score: number;
  remoteFit: number;
  locationFit: number;
  titleHitRatio: number;
  job: NormalizedAtsJob;
}): string | null {
  if (args.score < 65) {
    return "Overall alignment is moderate; review role scope before applying.";
  }
  if (args.remoteFit < 0.5 && args.job.remoteType !== "unknown") {
    return "Work style preference may not align with this role.";
  }
  if (args.locationFit < 0.5 && args.job.locationText !== "Unknown") {
    return "Location may not match preferred regions.";
  }
  if (args.titleHitRatio < 0.3) {
    return "Role title may be a stretch versus target job titles.";
  }
  return null;
}

export function summarizeCandidate(
  payload: WhatWeWillProfileRequest,
  candidate: CandidateSignals
): string {
  const titlePart =
    candidate.roleTitles.length > 0
      ? `Targeting ${candidate.roleTitles.slice(0, 3).join(", ")}`
      : "Target roles not specified";
  const skillPart =
    candidate.skills.length > 0
      ? `with strengths in ${candidate.skills.slice(0, 5).join(", ")}`
      : "with skills profile provided";
  const industryPart =
    candidate.industries.length > 0
      ? `and industry interests in ${candidate.industries.slice(0, 3).join(", ")}`
      : "";

  const linkedInPart = payload.linkedinUrl ? " LinkedIn profile included." : "";
  return `${titlePart}, ${skillPart}${industryPart}.${linkedInPart}`.trim();
}

function readCsvEnv(primary: string, fallback?: string): string[] {
  const raw = process.env[primary] ?? (fallback ? process.env[fallback] : "") ?? "";
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function dedupeNonEmpty(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
}

function keywordOverlap(profileKeywords: Set<string>, tokens: string[]): number {
  if (profileKeywords.size === 0 || tokens.length === 0) return 0;
  const tokenSet = new Set(tokens);
  let hits = 0;
  for (const keyword of profileKeywords) {
    if (tokenSet.has(keyword)) hits += 1;
  }
  return Math.min(1, hits / Math.max(8, profileKeywords.size));
}

function ratioOfMatches(needles: string[], haystackLower: string): number {
  if (needles.length === 0) return 0;
  const hits = needles.filter((needle) => haystackLower.includes(needle.toLowerCase())).length;
  return hits / needles.length;
}

function scoreRemoteFit(
  preferences: PreferredWorkType[],
  roleRemoteType: PreferredWorkType | "unknown"
): number {
  if (preferences.length === 0) return 0.7;
  if (roleRemoteType === "unknown") return 0.5;
  return preferences.includes(roleRemoteType) ? 1 : 0.2;
}

function scoreLocationFit(preferredLocations: string[], roleLocation: string): number {
  if (preferredLocations.length === 0) return 0.7;
  const role = roleLocation.toLowerCase();
  const hit = preferredLocations.some((location) => role.includes(location.toLowerCase()));
  return hit ? 1 : 0.2;
}

function inferRemoteType(
  locationText?: string,
  descriptionText?: string
): PreferredWorkType | "unknown" {
  const text = `${locationText ?? ""} ${descriptionText ?? ""}`.toLowerCase();
  if (text.includes("hybrid")) return "hybrid";
  if (text.includes("remote")) return "remote";
  if (text.includes("on-site") || text.includes("onsite") || text.includes("on site")) {
    return "onsite";
  }
  return "unknown";
}

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
