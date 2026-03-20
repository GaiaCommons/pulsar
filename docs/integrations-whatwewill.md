# What We Will integration API

This document describes the server-to-server endpoints that accept profile
context from What We Will and return:

- synchronous ATS job matches, and
- a broader LLM-generated career brief.

## Endpoint

- Method: `POST`
- Path: `/api/integrations/whatwewill/match`
- Auth header: `x-api-key: <WHATWEWILL_API_KEY>`
- Content type: `application/json`

## Career brief endpoint

- Method: `POST`
- Path: `/api/integrations/whatwewill/brief`
- Auth header: `x-api-key: <WHATWEWILL_API_KEY>`
- Content type: `application/json`

## Required environment variables

- `WHATWEWILL_API_KEY`: shared API key for request authentication.
- `WHATWEWILL_GREENHOUSE_BOARDS` or `GREENHOUSE_BOARD_TOKENS`: comma-separated
  Greenhouse board tokens.
- `WHATWEWILL_LEVER_COMPANIES` or `LEVER_COMPANY_SLUGS`: comma-separated Lever
  company slugs.
- `OPENAI_API_KEY`: required for `/brief`.
- `WHATWEWILL_BRIEF_MODEL` (optional): defaults to `gpt-4o-mini`.

Example:

```bash
WHATWEWILL_API_KEY=replace-with-strong-random-key
WHATWEWILL_GREENHOUSE_BOARDS=acme,globex
WHATWEWILL_LEVER_COMPANIES=initech,umbrella
```

## Request body

```json
{
  "personId": "www-12345",
  "linkedinUrl": "https://www.linkedin.com/in/example-user/",
  "resumeText": "Senior product-minded backend engineer...",
  "skills": ["TypeScript", "Node.js", "PostgreSQL", "distributed systems"],
  "experienceSummary": "8 years in platform and API engineering.",
  "interestedIndustries": ["climate", "education", "future of work"],
  "interestedRoleTitles": ["Backend Engineer", "Platform Engineer"],
  "preferredWorkTypes": ["remote", "hybrid"],
  "preferredLocations": ["San Francisco", "Remote"]
}
```

Validation notes:

- `personId` is required.
- At least one of `resumeText`, `skills`, or `experienceSummary` must be present.
- Arrays are deduplicated and capped at 50 entries each.
- Payload body is capped to 1MB.

## Success response (200)

```json
{
  "requestId": "ef6f4fbf-0b15-43f7-ab65-47e7fc653ec8",
  "candidateSummary": "Targeting Backend Engineer, Platform Engineer, with strengths in TypeScript, Node.js, PostgreSQL and industry interests in climate, education.",
  "matches": [
    {
      "score": 88,
      "label": "Strong match",
      "roleTitle": "Senior Platform Engineer",
      "company": "acme",
      "location": "Remote (US)",
      "source": "greenhouse",
      "reasons": [
        "Role title aligns strongly with target titles.",
        "Job description shows strong overlap with listed skills.",
        "Work style appears compatible (remote)."
      ],
      "concern": "Location may not match preferred regions.",
      "applyUrl": "https://boards.greenhouse.io/acme/jobs/12345"
    }
  ]
}
```

## Error responses

- `401 UNAUTHORIZED`: missing `x-api-key`.
- `403 FORBIDDEN`: invalid API key or server key not configured.
- `400 BAD_REQUEST`: invalid payload shape.
- `413 PAYLOAD_TOO_LARGE`: request exceeds size cap.
- `500 INTERNAL_ERROR`: unexpected server error.

## Career brief request body

Same profile fields as `/match`, with optional fields:

- `tone`: `supportive | direct | coach`
- `maxWords`: number (clamped to 250..1200)
- `includeIllustrativeLinks`: boolean

Example:

```json
{
  "personId": "www-12345",
  "linkedinUrl": "https://www.linkedin.com/in/example-user/",
  "resumeText": "Senior product-minded backend engineer...",
  "skills": ["TypeScript", "Node.js", "PostgreSQL", "distributed systems"],
  "experienceSummary": "8 years in platform and API engineering.",
  "interestedIndustries": ["climate", "education", "future of work"],
  "interestedRoleTitles": ["Backend Engineer", "Platform Engineer"],
  "preferredWorkTypes": ["remote", "hybrid"],
  "preferredLocations": ["San Francisco", "Remote"],
  "tone": "supportive",
  "maxWords": 700,
  "includeIllustrativeLinks": true
}
```

## Career brief success response

```json
{
  "requestId": "7d65d6ec-5c76-4f06-9f86-e06f90fd00fc",
  "markdown": "## Career Snapshot\\n...markdown omitted...",
  "model": "gpt-4o-mini",
  "generatedAt": "2026-03-20T10:10:00.000Z"
}
```

Note: Career brief content can include illustrative leads that may not currently
be active postings.

