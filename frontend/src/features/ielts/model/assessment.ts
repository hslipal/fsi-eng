import { z } from 'zod';

export const CRITERIA = [
  'task-response',
  'coherence-cohesion',
  'fluency-coherence',
  'lexical-resource',
  'grammatical-range-accuracy',
  'pronunciation',
] as const;
export type Criterion = (typeof CRITERIA)[number];

export const CRITERION_LABELS: Readonly<Record<Criterion, string>> = {
  'task-response': '任务回应',
  'coherence-cohesion': '连贯与衔接',
  'fluency-coherence': '流利度与连贯性',
  'lexical-resource': '词汇丰富度',
  'grammatical-range-accuracy': '语法多样性与准确性',
  pronunciation: '发音',
};

const Band = z.number().min(0).max(9).multipleOf(0.5);

/** `estimated` is always true: an AI score must never be shown as official. */
export const AssessmentSchema = z.object({
  estimated: z.literal(true),
  disclaimer: z.string().min(1),
  skill: z.enum(['writing', 'speaking']),
  overallBand: Band,
  criteria: z.array(z.object({ criterion: z.enum(CRITERIA), band: Band, comment: z.string() })),
  summary: z.string(),
  pronunciationScored: z.boolean(),
  transcript: z.string().nullable(),
});
export type Assessment = z.infer<typeof AssessmentSchema>;

export type WritingTask = 'task-1' | 'task-2';

export interface WritingPrompt {
  readonly id: string;
  readonly task: WritingTask;
  readonly text: string;
}

/** Original practice prompts (not taken from IELTS papers). */
export const WRITING_PROMPTS: readonly WritingPrompt[] = [
  {
    id: 'remote-work',
    task: 'task-2',
    text: 'More companies now let employees work from home several days a week. Do the advantages of this outweigh the disadvantages? Give reasons for your answer and include relevant examples.',
  },
  {
    id: 'city-transport',
    task: 'task-2',
    text: 'Some people think cities should make public transport free. Others think passengers should pay. Discuss both views and give your own opinion.',
  },
  {
    id: 'phone-ownership',
    task: 'task-1',
    text: 'Imagine a line graph showing the share of adults owning a smartphone in two countries from 2010 to 2025: Country A rose from 20% to 90%, Country B from 35% to 70%. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
  },
];

export const SPEAKING_QUESTIONS: readonly string[] = [
  'Do you prefer working from home or in an office? Why?',
  'Describe a skill you learned recently. You should say what it is, how you learned it, and explain why it is useful.',
  'How might technology change the way people learn languages in the future?',
];

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
}
