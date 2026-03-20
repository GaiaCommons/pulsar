import type { WhatWeWillBriefRequest } from "@/types/integrations";

/**
 * Synthetic member used in tests and `npm run eval:whatwewill`.
 * Resume-style text + structured fields so match scoring and brief prompts are realistic.
 */
export const FAUX_WHATWEWILL_PROFILE: WhatWeWillBriefRequest = {
  personId: "faux-member-001",
  linkedinUrl: "https://www.linkedin.com/in/example-member",
  resumeText: `
    SAM SAMPLE
    Software Engineer | Civic Tech

    EXPERIENCE
    Senior Software Engineer — Community Data Co. (2021–Present)
    - Built React/TypeScript dashboards used by 50+ nonprofits for grant reporting.
    - Led migration from REST to typed APIs; cut incident rate by 30%.
    - Mentored two junior engineers; ran weekly code review sessions.

    Software Engineer — LocalGov Labs (2018–2021)
    - Ruby on Rails and PostgreSQL for permitting and licensing workflows.
    - Partnered with product and policy teams on accessibility (WCAG 2.1 AA).

    SKILLS
    TypeScript, React, Node.js, PostgreSQL, Ruby on Rails, GraphQL, AWS basics,
    data visualization, agile delivery, stakeholder communication.

    EDUCATION
    B.S. Computer Science — State University (2018)
  `.trim(),
  experienceSummary:
    "Full-stack engineer focused on civic tech and social impact; strong React/TypeScript and Rails; remote-friendly.",
  skills: [
    "TypeScript",
    "React",
    "Node.js",
    "PostgreSQL",
    "Ruby on Rails",
    "GraphQL",
    "AWS",
    "data visualization",
  ],
  interestedIndustries: ["civic technology", "education technology", "nonprofit"],
  interestedRoleTitles: ["Senior Software Engineer", "Full Stack Engineer", "Engineering Lead"],
  preferredWorkTypes: ["remote", "hybrid"],
  preferredLocations: ["Remote", "United States"],
  tone: "supportive",
  maxWords: 700,
  includeIllustrativeLinks: true,
};
