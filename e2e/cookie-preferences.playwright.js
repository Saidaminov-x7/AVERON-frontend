// Run through Playwright MCP against the local test storefront.
async page => {
  const origin = 'http://127.0.0.1:3018';
  const results = [];
  await page.route('https://averon-backend-production.up.railway.app/**', route => route.abort());
  for (const locale of ['ru', 'uz', 'en']) for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${origin}/${locale}`);
    await page.evaluate(() => localStorage.removeItem('averon_cookie_consent'));
    await page.reload();
    const banner = page.locator('aside[aria-labelledby="cookie-consent-title"]');
    await banner.waitFor();
    const bounds = await banner.boundingBox();
    if (!bounds || Math.abs(bounds.y + bounds.height - 900) > 1) throw new Error(`Banner bottom: ${locale} ${width}`);
    const trigger = banner.locator('button').nth(1);
    await trigger.click();
    const dialog = page.locator('[role="dialog"][aria-modal="true"]:not(#mobile-navigation)');
    await dialog.waitFor();
    await page.waitForTimeout(250);
    if (!await dialog.evaluate(element => element.contains(document.activeElement)) || await page.evaluate(() => getComputedStyle(document.body).overflow !== 'hidden')) throw new Error(`Open modal focus/scroll: ${locale} ${width}`);
    for (let index = 0; index < 6; index++) {
      await page.keyboard.press('Tab');
      if (!await dialog.evaluate(element => element.contains(document.activeElement))) throw new Error(`Modal focus trap: ${locale} ${width}`);
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    if (await dialog.count() || !await trigger.evaluate(element => document.activeElement === element) || await page.evaluate(() => getComputedStyle(document.body).overflow === 'hidden')) throw new Error(`Escape modal: ${locale} ${width}`);
    await trigger.click();
    await dialog.waitFor();
    await page.mouse.click(2, 2);
    await page.waitForTimeout(300);
    if (await dialog.count() || await page.evaluate(() => getComputedStyle(document.body).overflow === 'hidden')) throw new Error(`Backdrop close: ${locale} ${width}`);
    await trigger.click();
    await dialog.waitFor();
    await dialog.locator('input[type="checkbox"]').check();
    await dialog.locator('button').last().click();
    await page.waitForTimeout(300);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('averon_cookie_consent') || 'null'));
    if (!saved?.analytics || await page.evaluate(() => getComputedStyle(document.body).overflow === 'hidden')) throw new Error(`Save preference: ${locale} ${width}`);
    const footer = page.locator('footer .grid.grid-cols-2').first();
    const controls = footer.locator(':scope > *');
    const boxes = await controls.evaluateAll(elements => elements.map(element => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y, right: rect.right, scroll: element.scrollWidth, client: element.clientWidth };
    }));
    if (boxes.length !== 4 || Math.abs(boxes[0].y - boxes[1].y) > 1 || Math.abs(boxes[2].y - boxes[3].y) > 1 || boxes.some(box => box.x < -1 || box.right > width + 1 || box.scroll > box.client + 1)) throw new Error(`Footer control layout: ${locale} ${width}`);
    await controls.nth(1).click();
    await dialog.waitFor();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    if (await dialog.count() || await banner.count() || await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error(`Reopen/close or page overflow: ${locale} ${width}`);
    results.push(`${locale}/${width}`);
  }
  return { passed: results.length, results };
}
