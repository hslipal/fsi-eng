import { z } from 'zod';

export const TRACKS = ['business', 'it', 'ielts'] as const;
export const TrackSchema = z.enum(TRACKS);
export type Track = z.infer<typeof TrackSchema>;

/** Only publishable licenses ever reach the frontend; `dev-only` is rejected by the backend. */
export const LICENSE_KINDS = ['public-domain-us-gov', 'cc-by', 'generated', 'licensed'] as const;
export const LicenseKindSchema = z.enum(LICENSE_KINDS);
export type LicenseKind = z.infer<typeof LicenseKindSchema>;

export const ContentItemSchema = z.object({
  id: z.uuid(),
  track: TrackSchema,
  title: z.string().min(1),
  sourceUrl: z.string().nullable(),
  license: LicenseKindSchema,
  level: z.string().min(1),
});
export type ContentItem = z.infer<typeof ContentItemSchema>;

export const ContentItemListSchema = z.array(ContentItemSchema);

export const TRACK_LABELS: Readonly<Record<Track, string>> = {
  business: '商务英语',
  it: 'IT 职场英语',
  ielts: '雅思',
};

export const LICENSE_LABELS: Readonly<Record<LicenseKind, string>> = {
  'public-domain-us-gov': '公有领域',
  'cc-by': 'CC BY',
  generated: '原创生成',
  licensed: '已授权',
};
