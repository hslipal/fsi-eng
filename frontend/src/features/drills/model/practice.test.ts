import { CardSchema, FeedbackSchema } from './practice';

describe('practice schemas', () => {
  it('accepts a card without a model sentence', () => {
    const card = {
      cardKey: 'k',
      title: 't',
      type: 'response',
      instruction: 'Reply.',
      model: null,
      cue: 'Any blockers?',
    };
    expect(CardSchema.safeParse(card).success).toBe(true);
  });

  it('rejects dialogue cards, which are not auto-graded', () => {
    const card = {
      cardKey: 'k',
      title: 't',
      type: 'dialogue',
      instruction: '',
      model: null,
      cue: '',
    };
    expect(CardSchema.safeParse(card).success).toBe(false);
  });

  it('rejects a box outside 0-5', () => {
    const feedback = {
      verdict: 'correct',
      expected: 'x',
      box: 6,
      nextReviewAt: '2026-11-20T00:00:00Z',
    };
    expect(FeedbackSchema.safeParse(feedback).success).toBe(false);
  });
});
