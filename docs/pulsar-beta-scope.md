# Pulsar Beta — Scope

## Overview

Pulsar Beta is a fast, worker‑focused tool that helps laid‑off tech workers find good job matches.

Users upload their resume and paste a few example job descriptions. Pulsar then scans common ATS job boards (Greenhouse, Lever) and returns a ranked shortlist of roles that match their experience.

The goal is to produce something **useful within days**, not weeks.

This is the **first vertical slice of the real product**, not a throwaway prototype.

---

## Product Goal

**Upload a resume + paste 1–3 target job descriptions → get a ranked shortlist of jobs with reasons and apply links.**

This helps workers quickly identify roles worth applying to instead of manually searching job boards.

---

## What Pulsar Beta Does

**User inputs**

- Upload resume (PDF)
- Paste 1–3 example job descriptions
- Optional text: “What I want next”

**System actions**

1. Extract resume text
2. Build a temporary candidate profile
3. Fetch jobs from ATS sources
4. Normalize job descriptions
5. Score job matches
6. Rank matches
7. Generate explanations for top results

**Output**

- Ranked shortlist
- Score (0–100)
- Match label
- 2–3 reasons
- Possible concern
- Apply link

---

## What Pulsar Beta Does **Not** Do

Not included in v0:

- Authentication
- User accounts
- Persistent profiles
- Saved jobs
- Dashboards
- Feedback loops
- Background job ingestion
- Database
- Queues
- Cron jobs
- Complex pipelines

Everything runs **ephemerally in a single request**.

---

## Core Architecture

### Frontend

Single route:

- `/match`

User interface includes:

- Resume upload
- Target job description fields
- Optional notes field
- “Find matches” button
- Ranked results list

---

### Backend

Single endpoint:

- `POST /api/match`

Workflow:

1. Parse multipart form
2. Extract resume text
3. Derive temporary candidate profile
4. Fetch jobs from ATS sources
5. Normalize job data
6. Score matches
7. Select top results
8. Generate explanations
9. Return JSON

---

## Temporary Candidate Profile

A lightweight in‑memory profile derived from the user's inputs.  
It exists **only during the request lifecycle** and is not persisted.

Example:

```ts
type TemporaryCandidateProfile = {
  summary: string;
  targetTitles: string[];
  inferredSkills: string[];
  seniority: "junior" | "mid" | "senior" | "staff+" | "unknown";
  keywords: string[];
};
```

---

## Job Sources

Initial sources:

- Greenhouse
- Lever

Possible later additions:

- Ashby
- Workday

These are common ATS systems with publicly accessible job pages.

---

## Job Normalization

All jobs should be mapped into a common format.

Example:

```ts
type NormalizedJob = {
  source: "greenhouse" | "lever";
  title: string;
  company: string;
  locationText: string;
  remoteType: "remote" | "hybrid" | "onsite" | "unknown";
  descriptionText: string;
  canonicalUrl: string;
};
```

---

## Matching Model

Deterministic scoring with weighted factors.

**Weights**

| Factor                   | Weight |
| ------------------------ | ------ |
| Target role similarity   | 35%    |
| Resume/job similarity    | 30%    |
| Seniority fit            | 20%    |
| Location/remote fit      | 15%    |

**Score scale**

| Score | Label         |
| ----- | ------------- |
| 85+   | Strong match  |
| 70–84 | Good match    |
| 55–69 | Stretch       |
| <55   | Hidden        |

---

## Explanations

LLM explanations are generated only for top matches.

Each result includes:

- 2–3 reasons for the match
- Optional concern

Example:

**Reasons**

- Strong overlap with backend API development  
- Seniority aligns with required experience  
- Relevant experience with distributed systems  

**Concern**

- Role emphasizes Java while resume shows mostly TypeScript

---

## Lean Repository Structure

```text
app/
  match/page.tsx
  api/match/route.ts

components/
  upload/
  matches/
  shared/

lib/
  parse/
  profile/
  jobs/
  matching/
  llm/
  utils/

docs/
  pulsar-beta-scope.md
  pulsar-beta-day-plan.md
```

---

## Key Design Principles

- Ship fast
- Avoid unnecessary infrastructure
- Keep architecture modular
- Optimize for usefulness, not completeness
- Only build what the first users need
