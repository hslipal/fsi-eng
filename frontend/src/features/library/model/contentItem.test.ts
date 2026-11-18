import { ContentItemSchema } from './contentItem';

const valid = {
  id: '3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90',
  track: 'it',
  title: 'Writing a pull request description',
  sourceUrl: null,
  license: 'generated',
  level: 'ILR 2',
};

describe('ContentItemSchema', () => {
  it('accepts a published item', () => {
    expect(ContentItemSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects dev-only material, which must never reach learners', () => {
    expect(ContentItemSchema.safeParse({ ...valid, license: 'dev-only' }).success).toBe(false);
  });

  it('rejects an unknown track', () => {
    expect(ContentItemSchema.safeParse({ ...valid, track: 'toefl' }).success).toBe(false);
  });
});
