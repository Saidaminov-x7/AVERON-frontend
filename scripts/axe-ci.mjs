import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const baseURL = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
const reportDir = 'artifacts/axe';
await mkdir(reportDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const failures = [];
try {
  for (const locale of ['ru', 'uz', 'en']) {
    const context = await browser.newContext();
    for (const [pageName, path, expected] of [
      ['home', `/${locale}`, 'AVERON'],
      ['catalog', `/${locale}/catalog`, null],
      ['product', `/${locale}/catalog/ci-product-1`, locale === 'ru' ? 'Тестовое пальто' : locale === 'uz' ? 'Sinov palto' : 'Test coat'],
    ]) {
      const page = await context.newPage();
      let pageError = null;
      page.on('pageerror', error => { pageError = error.message; });
      const response = await page.goto(`${baseURL}${path}`, { waitUntil: 'networkidle' });
      try {
        if (!response?.ok()) throw new Error(`HTTP ${response?.status() ?? 'no response'}`);
        if (pageName === 'catalog') {
          const heading = page.locator('h1').first();
          await heading.waitFor({ state: 'visible', timeout: 10000 });
          if (!(await heading.innerText()).trim()) throw new Error('Catalog heading is empty');
        } else if (pageName === 'product') {
          const heading = page.locator('h1').first();
          await heading.waitFor({ state: 'visible', timeout: 10000 });
          const title = await heading.innerText();
          if (!title.includes(expected)) throw new Error(`Product heading mismatch: ${title}`);
        } else {
          await page.getByText(expected, { exact: false }).first().waitFor({ state: 'visible', timeout: 10000 });
        }
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
        const report = { page: pageName, locale, url: path, pageError, violations: results.violations, passes: results.passes.length, incomplete: results.incomplete.length };
        await writeFile(`${reportDir}/${locale}-${pageName}.json`, `${JSON.stringify(report, null, 2)}\n`);
        const serious = results.violations.filter(item => item.impact === 'critical' || item.impact === 'serious');
        if (serious.length) failures.push(`${locale} ${pageName}: ${serious.map(item => `${item.id} (${item.impact})`).join(', ')}`);
      } catch (error) {
        await writeFile(`${reportDir}/${locale}-${pageName}.json`, `${JSON.stringify({ page: pageName, locale, url: path, error: String(error) }, null, 2)}\n`);
        failures.push(`${locale} ${pageName}: ${error}`);
      } finally { await page.close(); }
    }
    await context.close();
  }
} finally { await browser.close(); }
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
