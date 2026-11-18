import { z } from 'zod';
import { stubFetch } from '@/test/fetchStub';
import { ContractError, getJson, HttpError, postJson } from './httpClient';

const Schema = z.object({ name: z.string() });

describe('httpClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the parsed body when it matches the schema', async () => {
    stubFetch(200, { name: 'ok' });
    await expect(getJson('/api/x', Schema)).resolves.toEqual({ name: 'ok' });
  });

  it('throws HttpError on a non-2xx status', async () => {
    stubFetch(500, {});
    await expect(getJson('/api/x', Schema)).rejects.toBeInstanceOf(HttpError);
  });

  it('throws ContractError when the body violates the schema', async () => {
    stubFetch(200, { name: 42 });
    await expect(getJson('/api/x', Schema)).rejects.toBeInstanceOf(ContractError);
  });

  it('posts a JSON body', async () => {
    const fetchMock = stubFetch(200, { name: 'saved' });
    await expect(postJson('/api/x', { a: 1 }, Schema)).resolves.toEqual({ name: 'saved' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
