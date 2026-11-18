import { expect, test } from '@playwright/test';

// Stubbed: the score card must say "estimate" and show the disclaimer.
// Fullstack: CI has no DEEPSEEK_API_KEY, so the real backend answers 503 and the page says so.
const fullstack = process.env['E2E_MODE'] === 'fullstack';

test('an essay gets an estimated band with the disclaimer', async ({ page }) => {
  if (!fullstack) {
    await page.route('**/api/assessment/writing', async (route) => {
      await route.fulfill({
        json: {
          estimated: true,
          disclaimer: 'AI 估计分数，仅供练习参考，不等同于雅思官方考官评分。',
          skill: 'writing',
          overallBand: 6.5,
          criteria: [
            { criterion: 'task-response', band: 6.5, comment: '立场清楚。' },
            { criterion: 'coherence-cohesion', band: 6.5, comment: '段落清楚。' },
            { criterion: 'lexical-resource', band: 6.5, comment: '用词恰当。' },
            { criterion: 'grammatical-range-accuracy', band: 6, comment: '注意时态。' },
          ],
          summary: '多用复合句。',
          pronunciationScored: false,
          transcript: null,
        },
      });
    });
  }

  await page.goto('/');
  await page
    .getByRole('navigation', { name: '板块' })
    .getByRole('button', { name: '雅思写作与口语' })
    .click();
  const ielts = page.getByRole('region', { name: '雅思写作与口语估分' });
  await ielts.getByLabel('你的作文').fill('Working from home saves time. '.repeat(10));
  await ielts.getByRole('button', { name: '估分' }).click();

  if (fullstack) {
    await expect(ielts.getByRole('alert')).toContainText('AI 评分暂时不可用');
    return;
  }
  await expect(ielts.getByRole('heading', { name: 'AI 估计分数（非官方）' })).toBeVisible();
  await expect(ielts.getByText('估计总分：6.5')).toBeVisible();
  await expect(ielts.getByRole('note')).toContainText('不等同于雅思官方考官评分');
});
