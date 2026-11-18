import { getJson } from '@/shared/api/httpClient';
import { SpeakingPromptListSchema, type SpeakingPrompt } from '../model/assessment';

export async function fetchSpeakingPrompts(signal?: AbortSignal): Promise<SpeakingPrompt[]> {
  return await getJson(
    '/api/content/speaking-prompts',
    SpeakingPromptListSchema,
    signal === undefined ? {} : { signal },
  );
}
