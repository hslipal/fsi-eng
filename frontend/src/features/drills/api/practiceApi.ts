import { getJson, postJson } from '@/shared/api/httpClient';
import {
  CardListSchema,
  FeedbackSchema,
  type Card,
  type Feedback,
  type Track,
} from '../model/practice';

export async function fetchCards(track: Track, signal?: AbortSignal): Promise<Card[]> {
  const path = `/api/practice/cards?track=${encodeURIComponent(track)}`;
  return await getJson(path, CardListSchema, signal === undefined ? {} : { signal });
}

export async function submitAnswer(cardKey: string, answer: string): Promise<Feedback> {
  return await postJson('/api/practice/answers', { cardKey, answer }, FeedbackSchema);
}
