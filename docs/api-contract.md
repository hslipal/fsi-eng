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
