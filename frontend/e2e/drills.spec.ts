import { expect, test } from '@playwright/test';

// The stubbed run checks the drill flow; the fullstack run only checks that the page loads,
// because a fresh database has no reviewed content yet.
const fullstack = process.env['E2E_MODE'] === 'fullstack';

test('a learner answers a substitution drill and sees feedback', async ({ page }) => {
  if (!fullstack) {
    await page.route('**/api/practice/cards?track=business', async (route) => {
      await route.fulfill({
        json: [
          {
            cardKey: 'quote:1:0',
            title: 'Requesting a quote by a deadline',
            type: 'substitution',
            instruction: 'Replace the document and the deadline.',
            model: 'Could you send me the quote by Friday?',
            passage: null,
            cue: 'the contract / Monday',
            options: [],
          },
        ],
      });
    });
    await page.route('**/api/practice/answers', async (route) => {
      await route.fulfill({
        json: {
          verdict: 'close',
          expected: 'Could you send me the contract by Monday?',
          box: 0,
          nextReviewAt: '2026-11-20T00:00:00Z',
        },
      });
    });
  }

  await page.goto('/');
  const drills = page.getByRole('region', { name: '句型操练' });
  await expect(drills).toBeVisible();
  if (fullstack) {
    await expect(drills.getByText(/没有要练的题|第 1\//)).toBeVisible();
    return;
  }

  await drills.getByLabel('你的答案').fill('Could you send me the contrat by Monday?');
  await drills.getByRole('button', { name: '提交' }).click();

  await expect(drills.getByText('接近，注意拼写')).toBeVisible();
  await expect(
    drills.getByText('参考答案：Could you send me the contract by Monday?'),
  ).toBeVisible();
  await drills.getByRole('button', { name: '下一题' }).click();
  await expect(drills.getByText('本轮练习完成，共 1 题。')).toBeVisible();
});
