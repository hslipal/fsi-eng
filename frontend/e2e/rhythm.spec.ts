import { expect, test } from '@playwright/test';

// Stubbed run: a tape-style lesson (cue, answer aloud, model answer, self-grade), silent browser.
// Fullstack run: the section loads against the real backend.
const fullstack = process.env['E2E_MODE'] === 'fullstack';

const LESSON_ID = '3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90';

test('a learner runs a tape-style substitution drill', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, 'speechSynthesis', { value: undefined });
  });
  if (!fullstack) {
    await page.route('**/api/practice/lessons?track=business', async (route) => {
      await route.fulfill({
        json: [
          {
            id: LESSON_ID,
            title: 'Things I want',
            level: 'ILR 1',
            steps: [{ type: 'substitution', count: 1 }],
          },
        ],
      });
    });
    await page.route(`**/api/practice/lessons/${LESSON_ID}`, async (route) => {
      await route.fulfill({
        json: {
          id: LESSON_ID,
          title: 'Things I want',
          level: 'ILR 1',
          cards: [
            {
              cardKey: 'k:0:0',
              title: 'Things I want',
              type: 'substitution',
              instruction: 'Replace the drink.',
              model: 'I want water.',
              passage: null,
              cue: 'milk',
              options: [],
              base: null,
              answer: 'I want milk.',
            },
          ],
        },
      });
    });
    await page.route('**/api/practice/self-grades', async (route) => {
      await route.fulfill({
        json: {
          verdict: 'correct',
          expected: 'I want milk.',
          box: 1,
          nextReviewAt: '2026-11-20T00:00:00Z',
        },
      });
    });
  }

  await page.goto('/');
  const rhythm = page.getByRole('region', { name: '节奏训练' });
  await expect(rhythm).toBeVisible();
  if (fullstack) {
    return;
  }

  await rhythm.getByLabel('每种练习').selectOption('5');
  await rhythm.getByRole('button', { name: '开始练习：Things I want' }).click();
  await rhythm.getByRole('button', { name: '开始替换练习' }).click();
  for (let turn = 1; turn <= 5; turn++) {
    await expect(rhythm.getByText(`替换练习 第 ${String(turn)}/5 次`)).toBeVisible();
    await expect(rhythm.getByText('大声说出整句', { exact: true })).toBeVisible();
    await page.keyboard.press('Space');
    await expect(rhythm.getByText('I want milk.')).toBeVisible();
    await page.keyboard.press('1');
  }

  await expect(rhythm.getByRole('heading', { name: '这一课练完了' })).toBeVisible();
  await expect(rhythm.getByRole('table')).toContainText('替换练习');
});
