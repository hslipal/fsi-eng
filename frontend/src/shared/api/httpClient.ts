import type { z } from 'zod';

/**
 * The ONLY place in the frontend allowed to call fetch().
 * Every response is validated at runtime with a zod schema, so the static types
 * the rest of the app relies on are actually true at the network boundary.
 */
export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export class ContractError extends Error {
  constructor(path: string, issues: string) {
    super(`Response from ${path} violated the API contract: ${issues}`);
    this.name = 'ContractError';
  }
}

interface RequestOptions {
  readonly signal?: AbortSignal;
}

async function request<T>(path: string, schema: z.ZodType<T>, init: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new HttpError(response.status, `${init.method ?? 'GET'} ${path} failed`);
  }

  const body: unknown = await response.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ContractError(path, parsed.error.message);
  }
  return parsed.data;
}

export async function getJson<T>(
  path: string,
  schema: z.ZodType<T>,
  options: RequestOptions = {},
): Promise<T> {
  return await request(path, schema, { method: 'GET', signal: options.signal ?? null });
}

export async function postJson<T>(
  path: string,
  payload: unknown,
  schema: z.ZodType<T>,
): Promise<T> {
  return await request(path, schema, { method: 'POST', body: JSON.stringify(payload) });
}
