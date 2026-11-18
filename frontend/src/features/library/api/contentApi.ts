import { getJson } from '@/shared/api/httpClient';
import { ContentItemListSchema, type ContentItem, type Track } from '../model/contentItem';

export async function fetchPublishedItems(
  track: Track,
  signal?: AbortSignal,
): Promise<ContentItem[]> {
  const path = `/api/content/items?track=${encodeURIComponent(track)}`;
  return await getJson(path, ContentItemListSchema, signal === undefined ? {} : { signal });
}
