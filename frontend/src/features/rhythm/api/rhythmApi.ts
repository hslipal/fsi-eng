import { getJson, postJson } from '@/shared/api/httpClient';
import {
  FeedbackSchema,
  type Verdict,
  LessonSchema,
  LessonSummaryListSchema,
  type Feedback,
  type Lesson,
  type LessonSummary,
  type Track,
} from '../model/lesson';

export async function fetchLessons(track: Track, signal?: AbortSignal): Promise<LessonSummary[]> {
  const path = `/api/practice/lessons?track=${encodeURIComponent(track)}`;
  return await getJson(path, LessonSummaryListSchema, signal === undefined ? {} : { signal });
}

export async function fetchLesson(id: string, signal?: AbortSignal): Promise<Lesson> {
  const path = `/api/practice/lessons/${encodeURIComponent(id)}`;
  return await getJson(path, LessonSchema, signal === undefined ? {} : { signal });
}

/** `slow`: the learner missed the time limit; the server then reviews the card sooner. */
export async function submitTimedAnswer(
  cardKey: string,
  answer: string,
  slow: boolean,
): Promise<Feedback> {
  return await postJson('/api/practice/answers', { cardKey, answer, slow }, FeedbackSchema);
}

/** The learner's own verdict after hearing the model answer. */
export async function submitSelfGrade(
  cardKey: string,
  verdict: Verdict,
  slow: boolean,
): Promise<Feedback> {
  return await postJson('/api/practice/self-grades', { cardKey, verdict, slow }, FeedbackSchema);
}
