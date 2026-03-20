export type PreferredWorkType = "remote" | "hybrid" | "onsite";

export type AtsSource = "greenhouse" | "lever";

export type MatchLabel = "Strong match" | "Good match" | "Stretch";

export type WhatWeWillProfileRequest = {
  personId: string;
  linkedinUrl?: string;
  resumeText?: string;
  resumeUrl?: string;
  skills: string[];
  experienceSummary?: string;
  interestedIndustries: string[];
  interestedRoleTitles: string[];
  preferredWorkTypes: PreferredWorkType[];
  preferredLocations: string[];
};

export type WhatWeWillMatch = {
  score: number;
  label: MatchLabel;
  roleTitle: string;
  company: string;
  location: string;
  source: AtsSource;
  reasons: string[];
  concern?: string;
  applyUrl: string;
};

export type WhatWeWillMatchResponse = {
  requestId: string;
  candidateSummary: string;
  matches: WhatWeWillMatch[];
};

export type WhatWeWillBriefTone = "supportive" | "direct" | "coach";

export type WhatWeWillBriefRequest = WhatWeWillProfileRequest & {
  tone?: WhatWeWillBriefTone;
  maxWords?: number;
  includeIllustrativeLinks?: boolean;
};

export type WhatWeWillBriefResponse = {
  requestId: string;
  markdown: string;
  model: string;
  generatedAt: string;
};

export type IntegrationErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "BAD_REQUEST"
  | "PAYLOAD_TOO_LARGE"
  | "UPSTREAM_ERROR"
  | "INTERNAL_ERROR";

export type IntegrationErrorResponse = {
  code: IntegrationErrorCode;
  message: string;
};

export type NormalizedAtsJob = {
  source: AtsSource;
  title: string;
  company: string;
  locationText: string;
  remoteType: PreferredWorkType | "unknown";
  descriptionText: string;
  canonicalUrl: string;
};
