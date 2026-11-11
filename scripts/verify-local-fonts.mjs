/* eslint-disable @typescript-eslint/no-unused-expressions -- Playwright MCP evaluates this function expression. */
async page => {
  // Open the production server from this separate frontend checkout before running:
  // FONT_TEST_URL=http://127.0.0.1:3000 (or localhost/IPv6 loopback).
  const baseURL = page.url();
  let origin;
  try {
    const target = new URL(baseURL);
    if (!['localhost', '127.0.0.1', '[::1]'].includes(target.hostname)) {
      throw new Error('The current page must be on localhost, 127.0.0.1, or [::1].');
    }
    if (!['http:', 'https:'].includes(target.protocol)) throw new Error('The current page must use http or https.');
    origin = target.origin;
  } catch (error) {
    throw new Error(`Open FONT_TEST_URL on the local production server before running this check. ${error.message}`);
  }

  const failures = [];
  await page.unrouteAll({ behavior: 'wait' });
  for (const locale of ['ru', 'uz', 'en']) {
    for (const viewport of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844 }]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      const fontRequests = [];
      const onRequest = request => {
        if (/fonts\.(?:googleapis|gstatic)\.com/i.test(new URL(request.url()).hostname)) failures.push(`${locale}/${viewport.name}: external Google Fonts request ${request.url()}`);
        if (/\.(?:woff2?|ttf|otf)(?:\?|$)/i.test(request.url())) fontRequests.push(request.url());
      };
      const onResponse = response => {
        if (/fonts\.(?:googleapis|gstatic)\.com/i.test(new URL(response.url()).hostname)) {
          failures.push(`${locale}/${viewport.name}: external Google Fonts response ${response.url()}`);
        }
      };
      page.on('request', onRequest);
      page.on('response', onResponse);
      try {
        await page.route('**/*', async route => {
          const requestURL = new URL(route.request().url());
          if (/fonts\.(?:googleapis|gstatic)\.com/i.test(requestURL.hostname)) {
            await route.abort();
            return;
          }
          // Browser-side API calls are replaced with harmless empty fixtures.
          // SSR calls cannot be intercepted here; the already-running local test server must be isolated.
          if (/\/(?:api\/|analytics\/|site-settings\/|catalog-facets)/i.test(requestURL.pathname)) {
            const body = /\/categories(?:\?|$)/.test(requestURL.pathname)
              ? []
              : { items: [], pagination: { page: 1, limit: 24, total: 0, pages: 0 } };
            await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
            return;
          }
          await route.continue();
        });
        const response = await page.goto(`${origin}/${locale}`, { waitUntil: 'networkidle' });
        if (!response?.ok()) throw new Error(`HTTP ${response?.status() ?? 'no response'}`);
        await page.evaluate(async () => {
          await document.fonts.ready;
          await document.fonts.load('400 16px Inter', 'AVERON storefront');
        });
        const result = await page.evaluate(() => ({
          family: getComputedStyle(document.body).fontFamily,
          interAvailable: document.fonts.check('400 16px Inter', 'AVERON storefront'),
          loadedInterFaces: [...document.fonts].filter(face => /inter/i.test(face.family) && face.status === 'loaded').length,
          fontResources: performance.getEntriesByType('resource')
            .filter(entry => /\.(?:woff2?|ttf|otf)(?:\?|$)/i.test(entry.name))
            .map(entry => entry.name),
        }));
        if (!/\bInter\b/i.test(result.family)) throw new Error(`Computed family does not include Inter: ${result.family}`);
        if (!result.interAvailable || result.loadedInterFaces < 1) throw new Error(`Inter face did not load: ${JSON.stringify(result)}`);
        const requests = [...new Set([...fontRequests, ...result.fontResources])];
        if (requests.length === 0) throw new Error('No font file request was observed');
        for (const url of requests) {
          const parsed = new URL(url);
          if (parsed.origin !== origin) throw new Error(`Font request is not same-origin: ${url}`);
          if (/fonts\.(?:googleapis|gstatic)\.com/i.test(parsed.hostname)) throw new Error(`External Google font request: ${url}`);
          if (!/\.woff2?(?:\?|$)/i.test(parsed.pathname + parsed.search)) throw new Error(`Unexpected font asset: ${url}`);
        }
        console.log(`PASS ${locale}/${viewport.name}: Inter loaded; ${requests.length} same-origin font request(s)`);
      } catch (error) {
        failures.push(`${locale}/${viewport.name}: ${error.message}`);
      } finally {
        await page.unroute('**/*');
        page.off('request', onRequest);
        page.off('response', onResponse);
      }
    }
  }
  if (failures.length) throw new Error(failures.join('\n'));
}
