
---

# Pulsar Beta — 3 Day Build Plan

This plan breaks the MVP into three days of work.

Each task should be small enough for Cursor to implement in a single PR.

---

# Day 1 — Build the End-to-End Flow

## Goal

User can:

- Upload resume
- Paste job descriptions
- Click “Find matches”
- See results

Even if results are mocked.

---

## Tasks

### 1. Create route structure

Create:

- `app/match/page.tsx`
- `app/api/match/route.ts`


---

### 2. Build the input UI

Inputs:

- Resume upload
- Target job description textarea (1–3)
- Optional notes textarea

Add button:

- “Find matches”

---

### 3. Implement multipart form submission

Submit form data to:

- `POST /api/match`

Handle file uploads.

---

### 4. Add resume text extraction

Support:

- PDF parsing
- Plain text fallback

Return extracted resume text.

---

### 5. Return mocked match results

API should temporarily return:

- Candidate summary
- 3–5 mock matches

Example:

- Score: 84
- Strong match
- Reasons:
  - Backend engineering experience
  - Relevant distributed systems work

---

### 6. Build results UI

Create components:

- `MatchResults`
- `MatchCard`
- `ScoreBadge`

Render mock results cleanly.

---

## End of Day 1

Working pipeline:

- UI → API → mocked results → rendered UI

User experience is functional.

---

# Day 2 — Implement Real Job Matching

## Goal

Replace mock results with real ranked jobs.

---

## Tasks

### 1. Create normalized job types

Add:

- `lib/jobs/types.ts`

Define:

- `NormalizedJob`

---

### 2. Implement Greenhouse adapter

File:

- `lib/jobs/greenhouse.ts`

Responsibilities:

- Fetch job listings
- Extract job data
- Return normalized jobs

---

### 3. Implement Lever adapter

File:

- `lib/jobs/lever.ts`

Handle:

- Remote detection
- Location normalization
- Description cleanup

---

### 5. Build temporary candidate profile

File:

- `lib/profile/buildTemporaryProfile.ts`

Inputs:

- Resume text
- Target job descriptions
- Optional notes

Output:

- `TemporaryCandidateProfile`

---

### 6. Implement scoring system

File:

- `lib/matching/score.ts`

Calculate match score using weighted model.

---

### 7. Rank jobs

Sort by score and return top results.

Limit to:

- Top 20 jobs

---

### 8. Replace mocked API response

`/api/match` should now return real ranked jobs.

---

## End of Day 2

Working system:

- Resume → Candidate Profile → Fetch Jobs → Score Jobs → Ranked Results

Results are real.

---

# Day 3 — Add Explanations and Polish

## Goal

Make results trustworthy and demo-ready.

---

## Tasks

### 1. Add LLM client

Create:
- lib/llm/client.ts
- lib/llm/prompts.ts


---

### 2. Generate candidate summary

Create short explanation of user background.

Example:

- Senior backend engineer with strong experience in TypeScript APIs and distributed systems.


---

### 3. Generate match explanations

For top results:

Generate:

- 2–3 reasons
- Optional concern

Limit explanations to:

- Top 10 jobs


---

### 4. Improve loading state

Add spinner or progress UI.

---

### 5. Add error states

Handle cases like:

- Resume parse failure
- No jobs found
- ATS fetch error

---

### 6. Improve match cards

Add:

- Source badges
- Apply links
- Score labels

---

### 7. Test with real resumes

Test using:

- 2–3 resumes
- Multiple target roles

Adjust score thresholds.

---

### 8. Improve README

Document:

- What Pulsar Beta does
- How to run locally
- How to test

---

# End of Day 3

Pulsar Beta should:

- Produce meaningful ranked matches
- Generate helpful explanations
- Feel trustworthy
- Be demo‑ready for Tech Workers Coalition users

---

# Development Workflow

Recommended loop:

- Ticket → Cursor implements → PR → Review → Merge

Work on tasks sequentially to avoid conflicts.

---

# Success Criteria

Pulsar Beta is successful if a user can:

1. Upload resume
2. Paste example roles
3. Click “Find matches”
4. Receive a shortlist of relevant jobs within seconds