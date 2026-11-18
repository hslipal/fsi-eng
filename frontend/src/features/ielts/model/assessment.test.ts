import { AssessmentSchema, countWords } from './assessment';

const scored = {
  estimated: true,
  disclaimer: 'AI 估计分数，仅供练习参考。',
  skill: 'writing',
  overallBand: 6.5,
  criteria: [{ criterion: 'task-response', band: 6.5, comment: 'ok' }],
  summary: 's',
  pronunciationScored: false,
  transcript: null,
};

describe('AssessmentSchema', () => {
  it('accepts an estimated score', () => {
    expect(AssessmentSchema.safeParse(scored).success).toBe(true);
  });

  it('rejects anything not marked as an estimate', () => {
    expect(AssessmentSchema.safeParse({ ...scored, estimated: false }).success).toBe(false);
  });

  it('rejects bands off the half-band scale', () => {
    expect(AssessmentSchema.safeParse({ ...scored, overallBand: 6.3 }).success).toBe(false);
    expect(AssessmentSchema.safeParse({ ...scored, overallBand: 9.5 }).success).toBe(false);
  });
});

describe('countWords', () => {
  it('counts words separated by any whitespace', () => {
    expect(countWords('  one two\nthree  ')).toBe(3);
    expect(countWords('   ')).toBe(0);
  });
});
