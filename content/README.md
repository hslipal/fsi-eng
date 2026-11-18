# content/

Reviewed, publishable learning material. One JSON file per item; `./scripts/verify.sh content`
checks every file against `content-policy.json`.

```json
{
  "id": "3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90",
  "track": "business",
  "title": "Asking for a quote by Friday",
  "level": "ILR 2",
  "source": { "generator": "deepseek" },
  "license": { "kind": "generated" },
  "reviewed_by": "admin",
  "drills": []
}
```

- `track`: `business` | `it` | `ielts`
- `source`: `url` for real material, `generator` for system-written material
- `license.kind`: `public-domain-us-gov` | `cc-by` (+ `attribution`) | `generated` |
  `licensed` (+ `grantId`). `dev-only` is **not allowed here**.
- `reviewed_by`: an admin listed in `content-policy.json`

Copyrighted material used only for development (Cambridge IELTS past papers, BEC, commercial
textbooks) goes in `content-dev/`, which is git-ignored and never loaded in production.
