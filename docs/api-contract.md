# API contract

Backend response records and frontend zod schemas describe the same JSON. Change both, and this
file, in the same PR.

## GET /api/content/items?track={business|it|ielts}

Published items of one track (publishable license **and** reviewed by an admin).

| Field | Type | Notes |
| --- | --- | --- |
| id | string (UUID) | |
| track | `business` \| `it` \| `ielts` | |
| title | string | non-empty |
| sourceUrl | string \| null | null for generated material |
| license | `public-domain-us-gov` \| `cc-by` \| `generated` \| `licensed` | never `dev-only` |
| level | string | ILR level or target IELTS band |

Unknown track → `400` with an RFC 9457 problem detail.

Backend: `ContentItemResponse`. Frontend: `ContentItemSchema`
(`frontend/src/features/library/model/contentItem.ts`).

## Practice

Until login exists the learner is the `X-Learner-Id` header (default `local`). This is not
authentication.

### GET /api/practice/cards?track={business|it|ielts}&limit={1-50, default 10}

Due reviews first (oldest first), then cards the learner has never answered. Only pattern
drills are cards; dialogues are not. Answers are never sent.

| Field | Type | Notes |
| --- | --- | --- |
| cardKey | string | `<contentId>:<drillIndex>:<itemIndex>` |
| title | string | content item title |
| type | `substitution` \| `transformation` \| `expansion` \| `translation` \| `response` | |
| instruction | string | |
| model | string \| null | model sentence, if the drill has one |
| cue | string | |

### POST /api/practice/answers

Request `{ "cardKey": string, "answer": string (1-1000 chars) }`.

| Field | Type | Notes |
| --- | --- | --- |
| verdict | `correct` \| `close` \| `wrong` | case, spacing and final punctuation are ignored; `close` = a typing slip |
| expected | string | the accepted answer closest to the learner's |
| box | 0-5 | Leitner box after this answer (correct +1, close same, wrong 0) |
| nextReviewAt | string (ISO-8601 instant) | box 1-5 wait 1/3/7/14/30 days; wrong: 10 minutes |

Unknown card → `404`; blank answer, bad limit or learner id → `400`.

Backend: `CardResponse`, `FeedbackResponse`. Frontend: `CardSchema`, `FeedbackSchema`
(`frontend/src/features/drills/model/practice.ts`).

## Assessment (AI-estimated IELTS bands)

Scores come from DeepSeek and are **estimates**: every response has `estimated: true` and a
disclaimer, and clients must show both. Without `DEEPSEEK_API_KEY` both endpoints answer `503`
after validating the input.

### POST /api/assessment/writing

Request `{ "task": "task-1" | "task-2", "prompt": string (1-2000), "essay": string (≥ 20 words, ≤ 10000 chars) }`.

### POST /api/assessment/speaking (multipart)

Fields `part` (1-3), `question` (1-1000 chars), `audio` (file, ≤ 8 MiB; DeepSeek speech-to-text
also limits it to 120 seconds).

### Response (both)

| Field | Type | Notes |
| --- | --- | --- |
| estimated | `true` | always |
| disclaimer | string | shown with every score |
| skill | `writing` \| `speaking` | |
| overallBand | 0-9, step 0.5 | computed by the backend from the criteria (IELTS rounding), never taken from the model |
| criteria | `{ criterion, band, comment }[]` | writing: task-response, coherence-cohesion, lexical-resource, grammatical-range-accuracy; speaking: fluency-coherence, lexical-resource, grammatical-range-accuracy |
| summary | string | Simplified Chinese |
| pronunciationScored | `false` | speech-to-text cannot judge pronunciation |
| transcript | string \| null | speaking only |

Invalid input → `400`; AI not configured, unreachable or returning an unusable score → `503`.

Backend: `AssessmentResponse`. Frontend: `AssessmentSchema`
(`frontend/src/features/ielts/model/assessment.ts`).
