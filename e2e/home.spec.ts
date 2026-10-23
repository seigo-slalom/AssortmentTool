import { expect, test } from '@playwright/test';

// Outside the Power Apps host the app shows the host-unavailable state; this smoke
// test only verifies the app shell responds.
test('app shell responds', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.ok()).toBeTruthy();
});
