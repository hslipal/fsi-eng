# Frontend agent notes

Stack: React 19 · TypeScript (strictest profile) · Vite · zod · Vitest · Testing Library · Playwright.

```bash
npm ci
npm run verify   # prettier --check → tsc → eslint → dependency-cruiser → vitest+coverage → build
npm run e2e      # Playwright (builds + serves the app, API stubbed via page.route)
```

## Recipes

**New feature** `src/features/<name>/` with `api/`, `model/`, `ui/`, `index.ts`.
Export only what `app/` needs from `index.ts`. Import shared code via `@/shared/...`.

**New API call**

```ts
// model/<thing>.ts
export const ThingSchema = z.object({ id: z.uuid(), name: z.string() });
export type Thing = z.infer<typeof ThingSchema>;
// api/<thing>Api.ts
export async function fetchThing(id: string): Promise<Thing> {
  return await getJson(`/api/things/${encodeURIComponent(id)}`, ThingSchema);
}
```

Never call `fetch` directly, never cast the response (`as Thing`) — the schema is the cast.

**Async UI state** — a discriminated union, see `features/library/model/useContentItems.ts`.

**Component test** — render, interact via `userEvent`, query by role/label:
`screen.getByRole('button', { name: 'Add' })`. Stub network with `stubFetch()` from `@/test/fetchStub`.

## Things the compiler will stop you from doing

`arr[0].x` without a check (`noUncheckedIndexedAccess`) · passing `undefined` to an optional
prop (`exactOptionalPropertyTypes`) · `obj.dynamicKey` on index signatures · unused vars/params ·
`enum`/`namespace` (`erasableSyntaxOnly`) · floating promises · `if (str)` truthiness checks on
strings/numbers (`strict-boolean-expressions`).

## FSI-Eng notes

- Planned features: `drills` (FSI pattern drills), `ielts` (mock tests), `library` (exists),
  `progress` (review queue), `review` (admin content review). One folder each, isolated.
- Never import an AI SDK (`openai`, `@anthropic-ai/*`, `deepseek*`); scoring goes through
  `/api/assessment`.
- `npm run e2e` uses Playwright's bundled Chromium; `PW_CHANNEL=chrome npm run e2e` uses a local
  Chrome instead.
