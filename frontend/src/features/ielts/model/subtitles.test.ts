import { activeLine, SubtitlesSchema, type SubtitleLine } from './subtitles';

const LINES: SubtitleLine[] = [
  { start: 0.5, end: 2, text: 'Yes.', translation: '是的。' },
  { start: 2, end: 4, text: 'I am.', translation: null },
  { start: 5, end: 6, text: 'Thanks.', translation: '谢谢。' },
];

describe('activeLine', () => {
  it('finds the line being spoken', () => {
    expect(activeLine(LINES, 0)).toBe(-1);
    expect(activeLine(LINES, 0.5)).toBe(0);
    expect(activeLine(LINES, 2)).toBe(1);
    expect(activeLine(LINES, 4.5)).toBe(-1);
    expect(activeLine(LINES, 5.9)).toBe(2);
    expect(activeLine(LINES, 6)).toBe(-1);
  });
});

describe('SubtitlesSchema', () => {
  it('accepts lines with or without a translation and rejects negative times', () => {
    expect(SubtitlesSchema.parse({ lines: LINES }).lines).toHaveLength(3);
    expect(SubtitlesSchema.safeParse({ lines: [{ ...LINES[0], start: -1 }] }).success).toBe(false);
  });
});
