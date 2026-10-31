// Run with Playwright MCP browser_run_code_unsafe against local Next.js.
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
async page => {
  const origin = 'http://127.0.0.1:3018';
  const results = [];

  for (const width of [320, 375, 390, 767, 768, 1023]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${origin}/ru`);
    const consentButton = page.getByRole('button', { name: 'Отклонить аналитику' });
    if (await consentButton.isVisible().catch(() => false)) await consentButton.click();

    await page.locator('button[aria-controls="mobile-navigation"]').click();
    await page.waitForFunction(() => document.querySelector('#mobile-navigation')?.getAttribute('aria-hidden') === 'false');
    await page.waitForFunction(() => {
      const rect = document.querySelector('#mobile-navigation')?.getBoundingClientRect();
      const style = getComputedStyle(document.querySelector('#mobile-navigation'));
      const phoneWidth = innerWidth < 768;
      const expectedLeft = phoneWidth ? 0 : innerWidth - rect.width - 14;
      return rect && style.position === 'absolute' && Math.abs(rect.left - expectedLeft) < 0.05;
    });

    const layout = await page.evaluate(() => {
      const drawer = document.querySelector('#mobile-navigation');
      const rect = drawer.getBoundingClientRect();
      return {
        width: innerWidth,
        drawerWidth: rect.width,
        left: rect.left,
        right: innerWidth - rect.right,
        top: rect.top,
        bottom: innerHeight - rect.bottom,
        position: getComputedStyle(drawer).position,
        overflow: document.documentElement.scrollWidth > innerWidth,
        bodyOverflow: getComputedStyle(document.body).overflow,
      };
    });
    const phoneWidth = width < 768;
    const expectedWidth = phoneWidth ? width : Math.min(width - 28, 400);
    const horizontalMarginsAreWrong = phoneWidth
      ? layout.left !== 0 || layout.right !== 0
      : layout.left !== width - expectedWidth - 14 || layout.right !== 14;
    if (layout.overflow || layout.drawerWidth !== expectedWidth || horizontalMarginsAreWrong || layout.top !== 0 || layout.bottom !== 0 || layout.position !== 'absolute' || layout.bodyOverflow !== 'hidden') {
      throw new Error(`Drawer geometry/lock failed at ${width}px: ${JSON.stringify(layout)}`);
    }

    await page.locator('#mobile-navigation button[aria-label]').first().click();
    await page.waitForFunction(() => document.querySelector('#mobile-navigation')?.getAttribute('aria-hidden') === 'true');
    if (await page.evaluate(() => getComputedStyle(document.body).overflow) === 'hidden') {
      throw new Error(`Drawer close left page scroll locked at ${width}px`);
    }
    results.push(layout);
  }

  return results;
}
