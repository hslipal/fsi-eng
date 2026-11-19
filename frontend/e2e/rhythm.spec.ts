import { expect, test } from '@playwright/test';

// Stubbed run: a timed lesson answered by typing (headless browsers have no speech recognition).
// Fullstack run: the section loads against the real backend.
const fullstack = process.env['E2E_MODE'] === 'fullstack';

const LESSON_ID = '3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90';

test('a learner runs a timed substitution drill', async ({ page }) => {
  await page.addInitScript(() => {
    Reflect.deleteProperty(globalThis, 'SpeechRecognition');
    Reflect.deleteProperty(globalThis, 'webkitSpeechRecognition');
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
            },
          ],
        },
      });
    });
    await page.route('**/api/practice/answers', async (route) => {
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
    await rhythm.getByLabel('你的答案（回车提交）').fill('I want milk');
    await rhythm.getByLabel('你的答案（回车提交）').press('Enter');
    await expect(rhythm.getByText('正确')).toBeVisible();
    await rhythm.getByRole('button', { name: '下一题' }).click();
  }

  await expect(rhythm.getByRole('heading', { name: '这一课练完了' })).toBeVisible();
  await expect(rhythm.getByRole('table')).toContainText('替换练习');
});
