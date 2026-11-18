import { z } from 'zod';

export const TRACKS = ['business', 'it', 'ielts'] as const;
export type Track = (typeof TRACKS)[number];

export const TRACK_LABELS: Readonly<Record<Track, string>> = {
  business: '商务英语',
  it: 'IT 职场英语',
  ielts: '雅思',
};

export const DRILL_TYPES = [
  'substitution',
  'transformation',
  'expansion',
  'translation',
  'response',
  'reading',
] as const;
export type DrillType = (typeof DRILL_TYPES)[number];

export const DRILL_TYPE_LABELS: Readonly<Record<DrillType, string>> = {
  substitution: '替换操练',
  transformation: '转换操练',
  expansion: '扩展操练',
  translation: '翻译操练',
  response: '情景回应',
  reading: '阅读理解',
};

export const CardSchema = z.object({
  cardKey: z.string().min(1),
  title: z.string(),
  type: z.enum(DRILL_TYPES),
  instruction: z.string(),
  model: z.string().nullable(),
  passage: z.string().nullable(),
  cue: z.string(),
  options: z.array(z.string()),
});
export type Card = z.infer<typeof CardSchema>;
export const CardListSchema = z.array(CardSchema);

export const VERDICTS = ['correct', 'close', 'wrong'] as const;
export type Verdict = (typeof VERDICTS)[number];

export const VERDICT_LABELS: Readonly<Record<Verdict, string>> = {
  correct: '正确',
  close: '接近，注意拼写',
  wrong: '不对',
};

export const FeedbackSchema = z.object({
  verdict: z.enum(VERDICTS),
  expected: z.string(),
  box: z.number().int().min(0).max(5),
  nextReviewAt: z.string(),
});
export type Feedback = z.infer<typeof FeedbackSchema>;
