import type { LessonCard, StepType } from './lesson';

export const REPETITION_CHOICES = [5, 10, 20] as const;
export type Repetitions = (typeof REPETITION_CHOICES)[number];

/** One prompt of a timed lesson. `turn` counts from 1 within its drill type, up to `of`. */
export interface Turn {
  readonly card: LessonCard;
  readonly type: StepType;
  readonly turn: number;
  readonly of: number;
}

function groupByType(cards: readonly LessonCard[]): Map<StepType, LessonCard[]> {
  const groups = new Map<StepType, LessonCard[]>();
  for (const card of cards) {
    const group = groups.get(card.type) ?? [];
    group.push(card);
    groups.set(card.type, group);
  }
  return groups;
}

/**
 * Every drill type practised `repetitions` times, in lesson order. A drill with fewer items is
 * repeated from its first item; a chained drill is repeated as a whole chain, so every sentence
 * still builds on the one shown before it.
 */
export function buildPlan(cards: readonly LessonCard[], repetitions: number): Turn[] {
  const plan: Turn[] = [];
  for (const [type, group] of groupByType(cards)) {
    for (let turn = 0; turn < repetitions; turn++) {
      const card = group[turn % group.length];
      if (card !== undefined) {
        plan.push({ card, type, turn: turn + 1, of: repetitions });
      }
    }
  }
  return plan;
}
