# content/

Learning material as JSON, one file per item. `./scripts/verify.sh content` checks every file
against `content-policy.json`; the backend imports `content/<track>/*.json` into the database
(profile `postgres` does it at startup).

## Review flow

1. New material goes in `content/_drafts/<track>/` **without** `reviewed_by`. Drafts are checked
   but never imported.
2. An admin reviews it in a pull request, moves the file to `content/<track>/` and adds
   `"reviewed_by": "<admin>"`. CODEOWNERS makes that PR need the owner's approval.
3. On the next start (or import) the item reaches learners.

## Format

```json
{
  "id": "3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90",
  "track": "business",
  "title": "Requesting a quote by a deadline",
  "level": "ILR 1+",
  "source": { "generator": "claude-opus-5.5" },
  "license": { "kind": "generated" },
  "reviewed_by": "admin",
  "drills": [
    { "type": "dialogue", "lines": [{ "speaker": "Buyer", "text": "Could you send me a quote?" }] },
    {
      "type": "substitution",
      "instruction": "Replace the document.",
      "model": "Could you send me the quote by Friday?",
      "items": [{ "cue": "contract", "answers": ["Could you send me the contract by Friday?"] }]
    }
  ]
}
```

- `track`: `business` | `it` | `ielts`
- `level`: ILR level (`ILR 2`) or target IELTS band (`band 6.5`)
- `source`: `url` for real material, `generator` for system-written material
- `license.kind`: `public-domain-us-gov` | `cc-by` (+ `attribution`) | `generated` |
  `licensed` (+ `grantId`). `dev-only` is **not allowed here**.
- `reviewed_by`: an admin listed in `content-policy.json`; required outside `_drafts/`,
  forbidden inside it
- `drills[].type`:
  - `dialogue`: `lines` (speaker + text), for listening and memorising; not graded
  - `substitution` | `transformation` | `expansion` | `translation` | `response`:
    `instruction`, optional `model`, `items` (`cue` + every accepted `answers`), typed answers
  - `speaking`: `instruction`, `items` with `cue` (the question), `part` (1-3), optional
    `audio` (sample answer, path relative to the content root, e.g.
    `ielts/speaking-audio/q1.mp3`) and `seconds`; not graded
  - `reading`: `instruction`, `passage`, `items` with `options` (e.g. `TRUE`/`FALSE`/`NOT GIVEN`
    or A-D); every answer must be one of the options, and choices are graded strictly

Copyrighted material used only for development (Cambridge IELTS past papers, BEC, commercial
textbooks, audio of unknown origin) goes in `content-dev/<track>/`, same format with
`"license": { "kind": "dev-only" }`. It is git-ignored and loaded only with the backend's `dev`
profile. `tools/build_speaking_manifest.py content-dev/ielts` turns a folder of speaking
recordings (`content-dev/ielts/speaking-audio/*.mp3`, named after the question) into
`content-dev/ielts/speaking-questions.json`.
