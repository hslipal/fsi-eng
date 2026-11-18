# AGENTS.md — rules for AI coding agents (Codex, Claude Code, Copilot, …)

This repository is **guardrailed**. Lint rules, the type system and architecture tests are
not suggestions — they are executable and CI rejects any violation. Your job is to produce
code that passes them *without weakening them*.

## 0. The one command

```bash
./scripts/verify.sh          # everything CI runs, in the same order
./scripts/verify.sh frontend # or: guardrails | content | backend | e2e
```

A task is **done** only when `./scripts/verify.sh` exits 0. Run it before you say you are
finished. If it fails, read the error, fix the code, run it again.

## 1. Never do these (CI will catch them, and the PR will be rejected)

- Do **not** edit any file listed in `guardrails.lock` (lint configs, tsconfig, ArchUnit tests,
  dependency rules, CI workflow, this file). If a rule blocks you, stop and explain why in the
  PR description — a human decides whether to change the rule.
- Do **not** add `eslint-disable`, `@ts-ignore`, `@ts-nocheck`, `as any`, `as SomeType`,
  `!` non-null assertions, `@SuppressWarnings("NullAway")` or `@SuppressWarnings("all")`.
- Do **not** delete, skip (`it.skip`, `@Disabled`, `test.fixme`) or weaken existing tests
  to make the build pass.
- Do **not** add runtime dependencies (npm or Maven) without saying so explicitly in the PR;
  they are allowlisted and the build will fail.
- Do **not** call `Instant.now()`, `LocalDateTime.now()`, `System.currentTimeMillis()` —
  inject `java.time.Clock`.
- Do **not** commit anything from `content-dev/` or any file with license `dev-only`.

## 2. Architecture

### Backend — hexagonal (`backend/src/main/java/com/fsieng/`)

Modules: `content` (material + licences), `course` (units, drill types), `practice` (sessions,
spaced repetition), `assessment` (auto-grading + AI-estimated scores), `learner`. Shared base
types live in `common/`.

```
<module>/domain/                 pure Java: records, value objects, domain exceptions
<module>/application/port/in/    use-case interfaces (what the app can do)
<module>/application/port/out/   interfaces the app needs (repositories, gateways)
<module>/application/service/    use-case implementations, NO Spring annotations
<module>/adapter/in/web/         @RestController, request/response DTOs, error mapping
<module>/adapter/out/persistence/ JPA entities + Spring Data repositories (Hibernate)
<module>/adapter/out/llm/        the ONLY place that calls DeepSeek chat/scoring
<module>/adapter/out/asr/        the ONLY place that calls DeepSeek speech-to-text
config/                          the only place with @Configuration / @Bean wiring
```

Enforced by `ArchitectureTest.java`:
domain and application never import `org.springframework`, `jakarta`, Jackson;
controllers depend on `port.in` interfaces only; no cycles; no field injection;
no `System.out`; no generic `RuntimeException`; domain exceptions extend `DomainException`;
`@Entity` only in `adapter.out.persistence`; HTTP/model clients only in `adapter.out.llm|asr`.

### Frontend — layered features (`frontend/src/`)

```
app/                 composition root — imports features ONLY via features/<name>/index.ts
features/<name>/     drills · ielts · library · progress · review
  api/               network calls (via shared/api/httpClient + zod schema)
  model/             types, zod schemas, pure functions, hooks
  ui/                React components — call hooks from model/, never api/ directly
  index.ts           the feature's public API
shared/              business-agnostic building blocks; must not import features or app
```

Enforced by `.dependency-cruiser.cjs` + ESLint: no cross-feature imports, no cycles,
no orphan files, `fetch` only in `shared/api/httpClient.ts`, runtime deps allowlisted.

## 3. Coding conventions that the type system relies on

- **Parse at the boundary.** Every HTTP response is validated with a zod schema
  (`getJson(path, Schema)`); every backend request DTO uses Bean Validation, and the domain
  re-checks its own invariants in value-object constructors.
- **Model states as discriminated unions** (`{ kind: 'loading' } | { kind: 'ready', … }`)
  rather than several booleans. `switch` on them; `switch-exhaustiveness-check` will tell you
  when you forget a case.
- **No `enum` in TypeScript** — use `as const` arrays + union types.
- **Strongly typed ids** in Java (`record TaskId(UUID value)`), never raw `String`/`UUID`
  across layers.
- **Nullness:** backend is compiled with NullAway (JSpecify mode). Everything is non-null
  unless annotated `@org.jspecify.annotations.Nullable`.
- Keep functions small: ESLint enforces complexity ≤ 10, ≤ 60 lines/function,
  ≤ 250 lines/file, ≤ 4 params.

## 4. Tests are part of the change

| Change | Required tests |
|---|---|
| domain / application logic | JUnit unit test, no Spring context |
| new endpoint | `*IntegrationTest` with `@SpringBootTest(RANDOM_PORT)` |
| new module or package | the ArchUnit rules must still pass (they scan everything) |
| frontend pure logic / schema | Vitest unit test |
| component | Vitest + Testing Library (query by role/label, not CSS) |
| user-visible flow | Playwright spec in `frontend/e2e/` |
| content file | `./scripts/verify.sh content` |
| LLM / speech adapter | test with recorded responses in `src/test/resources/llm-fixtures/` |

Coverage gates: frontend ≥ 85 % lines / 80 % branches (Vitest), backend ≥ 85 % lines /
80 % branches (JaCoCo). Both fail the build.

## 5. API contract

Backend response records (e.g. `ContentItemResponse`) and frontend zod schemas (e.g.
`ContentItemSchema`) describe the same JSON. If you change one,
change the other **in the same PR** and update `docs/api-contract.md`.

## 6. Workflow for a task

1. Read the relevant `AGENTS.md` files (root + `frontend/` or `backend/`).
2. Write/adjust the tests first, watch them fail.
3. Implement the smallest change that makes them pass.
4. `./scripts/verify.sh` → fix → repeat until green.
5. In the PR description list: what changed, which tests cover it, and any rule you
   believe should change (with reasoning) — but do not change it yourself.

## 7. FSI-Eng domain rules

- Content is licensed data. Every item under `content/` needs `id`, `track`, `title`, `level`
  (ILR or target IELTS band), `source` (`url` or `generator`), `license.kind` and
  `reviewed_by` (an admin listed in `content-policy.json`). `./scripts/verify.sh content`
  rejects anything else.
- Copyrighted test material (license `dev-only`) lives ONLY in the git-ignored `content-dev/`
  folder. Never commit it, never copy it into `content/`, never change its license yourself.
- LLM and speech calls go to DeepSeek ONLY through `<module>/adapter/out/llm/` and
  `<module>/adapter/out/asr/`. Domain and application code use the `ScoringPort`,
  `GenerationPort` and `TranscriptionPort` interfaces. The frontend never calls a model; it calls
  `/api/assessment`.
- Parse LLM output at the boundary: DTO + Bean Validation, then `EstimatedBand` (0–9, steps of
  0.5). Never pass raw model text into the domain.
- Scores shown to learners are ESTIMATES. The score card must show the "estimated" label and the
  disclaimer; pronunciation is shown as "not scored". The e2e test checks it.
- Scoring prompts in `prompts/scoring/` are protected. If you think one should change, explain
  why in the PR; a human runs the baseline-set evaluation.
- Tests use recorded DeepSeek responses. Never call a real model from a test.
- The database is PostgreSQL 18 in Docker; schema changes are Flyway migrations, never
  `ddl-auto=update`. Persistence is Hibernate/JPA. `@Entity` classes live only in `adapter/out/persistence/` and
  are mapped to domain records; a port never returns an entity. Keep
  `spring.jpa.open-in-view=false`.
- Spaced-repetition scheduling uses the injected `Clock`.
