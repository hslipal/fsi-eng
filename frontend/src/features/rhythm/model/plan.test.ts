import type { LessonCard, StepType } from './lesson';
import { buildPlan } from './plan';

function card(type: StepType, cue: string, base: string | null = null): LessonCard {
  return { cardKey: `${type}:${cue}`, type, instruction: 'Do it.', model: 'Model.', cue, base };
}

describe('buildPlan', () => {
  it('repeats every drill type to the target count, in lesson order', () => {
    const plan = buildPlan(
      [card('substitution', 'milk'), card('substitution', 'tea'), card('transformation', 'car')],
      3,
    );

    expect(plan.map((turn) => `${turn.type}:${turn.card.cue}:${String(turn.turn)}`)).toEqual([
      'substitution:milk:1',
      'substitution:tea:2',
      'substitution:milk:3',
      'transformation:car:1',
      'transformation:car:2',
      'transformation:car:3',
    ]);
    expect(plan.every((turn) => turn.of === 3)).toBe(true);
  });

  it('repeats a chain as a whole and stops at the target count', () => {
    const plan = buildPlan(
      [
        card('expansion', 'spoon', 'There is a cup on the table.'),
        card('expansion', 'on the chair', 'There is a spoon on the table.'),
      ],
      3,
    );

    expect(plan.map((turn) => turn.card.cue)).toEqual(['spoon', 'on the chair', 'spoon']);
  });

  it('is empty without cards', () => {
    expect(buildPlan([], 20)).toEqual([]);
  });
});
