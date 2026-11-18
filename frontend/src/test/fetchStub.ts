import { vi } from 'vitest';

/** Replaces global fetch with a stub that answers every call with `status` and `body`. */
export function stubFetch(status: number, body: unknown): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(() =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

type Route = (url: string, init: RequestInit | undefined) => { status: number; body: unknown };

/** Replaces global fetch with a stub whose answer depends on the URL and request. */
export function stubFetchRoutes(route: Route): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn((input: string, init?: RequestInit) => {
    const { status, body } = route(input, init);
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
