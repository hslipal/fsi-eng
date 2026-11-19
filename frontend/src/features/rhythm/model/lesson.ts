import { z } from 'zod';

export const TRACKS = ['business', 'it', 'ielts'] as const;
export type Track = (typeof TRACKS)[number];

export const TRACK_LABELS: Readonly<Record<Track, string>> = {
  business: '商务英语',
  it: 'IT 职场英语',
  ielts: '雅思',
};

/** The FSI pattern drills of a lesson, in the order they are practised. */
export const STEP_TYPES = ['substitution', 'transformation', 'response', 'expansion'] as const;
export type StepType = (typeof STEP_TYPES)[number];

export const STEP_LABELS: Readonly<Record<StepType, string>> = {
  substitution: '替换练习',
  transformation: '转换练习',
  response: '回应练习',
  expansion: '扩展练习',
};

/** What each drill trains, shown before it starts. */
export const STEP_PURPOSE: Readonly<Record<StepType, string>> = {
  substitution: '句型不变，只换一个词。练到不用想语法，张嘴就来。',
  transformation: '按要求改句子：单复数、代词、时态。练的是语法的反射。',
  response: '听情境，立刻用一句话回应，没有时间想。',
  expansion: '每次在上一句的基础上改一处，句子越来越长，要跟上节奏。',
};

export const LessonSummarySchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  level: z.string(),
  steps: z.array(z.object({ type: z.enum(STEP_TYPES), count: z.number().int().positive() })),
  /** Built from copyrighted, unlicensed books; only served by a backend in the dev profile. */
  devOnly: z.boolean().default(false),
});
export type LessonSummary = z.infer<typeof LessonSummarySchema>;
export const LessonSummaryListSchema = z.array(LessonSummarySchema);

export const LessonCardSchema = z.object({
  cardKey: z.string().min(1),
  type: z.enum(STEP_TYPES),
  instruction: z.string(),
  model: z.string().nullable(),
  cue: z.string(),
  base: z.string().nullable(),
});
export type LessonCard = z.infer<typeof LessonCardSchema>;

export const LessonSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  level: z.string(),
  cards: z.array(LessonCardSchema),
  devOnly: z.boolean().default(false),
});
export type Lesson = z.infer<typeof LessonSchema>;

export const VERDICTS = ['correct', 'close', 'wrong'] as const;
export type Verdict = (typeof VERDICTS)[number];

export const VERDICT_LABELS: Readonly<Record<Verdict, string>> = {
  correct: '正确',
  close: '接近',
  wrong: '不对',
};

export const FeedbackSchema = z.object({
  verdict: z.enum(VERDICTS),
  expected: z.string(),
});
export type Feedback = z.infer<typeof FeedbackSchema>;
