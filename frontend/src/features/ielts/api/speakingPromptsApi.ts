import { getJson, HttpError } from '@/shared/api/httpClient';
import { SpeakingPromptListSchema, type SpeakingPrompt } from '../model/assessment';
import { SubtitlesSchema, type SubtitleLine } from '../model/subtitles';

export async function fetchSpeakingPrompts(signal?: AbortSignal): Promise<SpeakingPrompt[]> {
  return await getJson(
    '/api/content/speaking-prompts',
    SpeakingPromptListSchema,
    signal === undefined ? {} : { signal },
  );
}

/** Subtitle lines of a sample answer, or null when it has no subtitles. */
export async function fetchSubtitles(
  key: string,
  signal?: AbortSignal,
): Promise<SubtitleLine[] | null> {
  try {
    const subtitles = await getJson(
      `/api/content/speaking-prompts/${encodeURIComponent(key)}/subtitles`,
      SubtitlesSchema,
      signal === undefined ? {} : { signal },
    );
    return subtitles.lines;
  } catch (error: unknown) {
    if (error instanceof HttpError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
