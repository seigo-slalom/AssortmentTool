import { expect, test, type Page } from '@playwright/test';
import { MATRIX_PAGES } from '../fixtures/screens';
import { VIEWPORTS } from '../fixtures/viewports';

const noHorizontalOverflow = async (page: Page) => {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
};

const expectMinSize = async (page: Page, selector: string, min: number) => {
  const boxes = await page.locator(selector).evaluateAll((els) =>
    els
      .filter((el) => (el as HTMLElement).offsetParent !== null)
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { w: r.width, h: r.height, text: el.textContent };
      }),
  );
  expect(boxes.length).toBeGreaterThan(0);
  for (const box of boxes) {
    expect(box.h, `${box.text} height`).toBeGreaterThanOrEqual(min);
    expect(box.w, `${box.text} width`).toBeGreaterThanOrEqual(min);
  }
};

for (const vp of VIEWPORTS) {
  test.describe(`${vp.name} (${vp.tier})`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const screen of MATRIX_PAGES) {
      test(`${screen.id} adapts to the ${vp.tier} tier`, async ({ page }) => {
        await page.goto(`/${screen.hash}`);
        await expect(page.getByRole('heading', { level: 1, name: screen.title })).toBeVisible();
        await expect(page.locator('.cds-root')).toHaveAttribute('data-tier', vp.tier);
        await noHorizontalOverflow(page);
        await expect(page.getByTestId('app-header')).toBeVisible();

        if (vp.tier === 'compact') {
          await expect(page.getByTestId('nav-trigger')).toBeVisible();
          await expect(page.getByTestId('nav-rail')).toHaveCount(0);
          await expectMinSize(page, '[data-testid="app-header"] button', 44);
          await page.getByTestId('nav-trigger').click();
          const drawer = page.getByRole('dialog');
          await expect(drawer.getByRole('navigation', { name: 'Main' })).toBeVisible();
          const links = await drawer
            .getByRole('link')
            .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
          for (const height of links) expect(height).toBeGreaterThanOrEqual(44);
          await page.keyboard.press('Escape');
          await expect(drawer).toBeHidden();
        } else {
          await expect(page.getByTestId('nav-trigger')).toHaveCount(0);
          await expect(page.getByTestId('rail-toggle')).toBeVisible();
          expect((await page.getByTestId('nav-rail').boundingBox())?.width).toBe(240);
          const item = page.getByRole('navigation', { name: 'Main' }).getByRole('link').first();
          expect((await item.boundingBox())?.height).toBe(40);
        }

        if (vp.tier === 'wide') {
          const content = page.locator('.cds-content');
          expect((await content.boundingBox())!.width).toBeLessThanOrEqual(2200);
          await expect(content).toHaveCSS('padding-left', '32px');
        }
      });
    }

    test('host loading and error states do not overflow', async ({ page }) => {
      await page.goto('/?host=slow#/');
      await expect(page.getByRole('region', { name: 'Loading content' })).toBeVisible();
      await noHorizontalOverflow(page);
      await page.goto('/?host=error#/');
      await expect(page.getByText('Power Platform host unavailable')).toBeVisible();
      await noHorizontalOverflow(page);
    });
  });
}

test.describe('edge widths', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  for (const screen of MATRIX_PAGES) {
    test(`${screen.id} has no overflow at 320 px`, async ({ page }) => {
      await page.goto(`/${screen.hash}`);
      await expect(page.getByRole('heading', { level: 1, name: screen.title })).toBeVisible();
      await noHorizontalOverflow(page);
      const trigger = (await page.getByTestId('nav-trigger').boundingBox())!;
      const brand = (await page.getByTestId('app-name').boundingBox())!;
      expect(brand.x).toBeGreaterThanOrEqual(trigger.x + trigger.width);
    });
  }

  test('tier boundaries follow the token breakpoints', async ({ page }) => {
    await page.goto('/#/');
    for (const [width, tier] of [
      [991, 'compact'],
      [992, 'standard'],
      [1599, 'standard'],
      [1600, 'wide'],
    ] as const) {
      await page.setViewportSize({ width, height: 800 });
      await expect(page.locator('.cds-root')).toHaveAttribute('data-tier', tier);
    }
  });
});

test.describe('live behaviour', () => {
  test.use({ viewport: { width: 1366, height: 768 } });

  test('resizing switches navigation mode and keeps the screen', async ({ page }) => {
    await page.goto('/#/exceptions');
    await page.setViewportSize({ width: 800, height: 768 });
    await expect(page.getByTestId('nav-trigger')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Exceptions' })).toBeVisible();
    await page.getByTestId('nav-trigger').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.setViewportSize({ width: 1366, height: 768 });
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByTestId('nav-rail')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Exceptions' })).toBeVisible();
  });

  test('the rail collapses to 64 px with icons visible', async ({ page }) => {
    await page.goto('/#/');
    await page.getByTestId('rail-toggle').click();
    await expect(page.getByTestId('rail-toggle')).toHaveAccessibleName('Expand navigation');
    await expect
      .poll(async () => (await page.getByTestId('nav-rail').boundingBox())?.width)
      .toBe(64);
    await expect(page.getByRole('link', { name: 'Doors' }).locator('.anticon')).toBeVisible();
  });

  test('the drawer is 300 px wide, or 85vw when narrower', async ({ page }) => {
    for (const [width, expected] of [
      [768, 300],
      [320, 272],
    ] as const) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/#/');
      await page.getByTestId('nav-trigger').click();
      const panel = page.locator('.cds-drawer-root .ant-drawer-content-wrapper');
      await expect
        .poll(async () => Math.round((await panel.boundingBox())?.width ?? 0))
        .toBe(expected);
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toBeHidden();
    }
  });

  test('first meaningful render is under 3 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/#/');
    await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
    expect(Date.now() - start).toBeLessThan(3000);
  });

  test('the layout holds when the brand font fails to load', async ({ page }) => {
    await page.route('**/*.ttf', (route) => route.abort());
    await page.goto('/#/');
    await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
    await noHorizontalOverflow(page);
  });
});
