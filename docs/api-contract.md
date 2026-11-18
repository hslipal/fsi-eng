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
