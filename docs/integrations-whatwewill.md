# What We Will integration API

This document describes the v1 server-to-server endpoint that accepts profile
context from What We Will and returns synchronous job matches.

## Endpoint

- Method: `POST`
- Path: `/api/integrations/whatwewill/match`
- Auth header: `x-api-key: <WHATWEWILL_API_KEY>`
- Content type: `application/json`

## Required environment variables

- `WHATWEWILL_API_KEY`: shared API key for request authentication.
- `WHATWEWILL_GREENHOUSE_BOARDS` or `GREENHOUSE_BOARD_TOKENS`: comma-separated
  Greenhouse board tokens.
- `WHATWEWILL_LEVER_COMPANIES` or `LEVER_COMPANY_SLUGS`: comma-separated Lever
  company slugs.

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

