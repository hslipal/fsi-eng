import { expect, test } from '@playwright/test';

// E2E_MODE=fullstack runs against the real backend; otherwise the API is stubbed.
const fullstack = process.env['E2E_MODE'] === 'fullstack';

test('the library shows the business track on first load', async ({ page }) => {
  if (!fullstack) {
    await page.route('**/api/content/items?track=business', async (route) => {
      await route.fulfill({
        json: [
          {
            id: '3f2a9c1e-5b7d-4e8a-9c21-7d4e5f6a8b90',
            track: 'business',
            title: 'Asking for a quote by Friday',
            sourceUrl: null,
            license: 'generated',
            level: 'ILR 2',
          },
        ],
      });
    });
  }

  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('FSI-Eng 英语操练');
  const library = page.getByRole('region', { name: '素材库' });
  await expect(library.getByRole('tab', { name: '商务英语' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  const list = library.getByRole('list', { name: '已发布素材' });
  const empty = library.getByText('这个赛道还没有已发布的素材。');
  await expect(list.or(empty)).toBeVisible();
  if (!fullstack) {
    await expect(list).toContainText('Asking for a quote by Friday');
  }
});
