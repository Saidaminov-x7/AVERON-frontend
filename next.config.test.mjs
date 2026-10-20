import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const configPath = pathToFileURL(resolve(process.cwd(), 'next.config.mjs')).href;
const probeConfig = (environment, assertions) => {
  const script = `import assert from 'node:assert/strict';
const config = (await import(${JSON.stringify(configPath)})).default;
${assertions}`;
  try {
    return execFileSync(process.execPath, ['--input-type=module', '-e', script], {
      encoding: 'utf8',
      env: { ...process.env, VITEST: '', JEST_WORKER_ID: '', ...environment },
    });
  } catch (error) {
    return error.stderr.toString();
  }
};

describe('Next.js local API egress isolation', () => {
  it('keeps rewrites and CSP local for a production-mode local preview', async () => {
    const result = probeConfig(
      {
        NODE_ENV: 'production',
        NEXT_PUBLIC_AVERON_RUNTIME_TARGET: 'local',
        NEXT_PUBLIC_API_URL: 'https://averon-backend-production.up.railway.app',
        CSP_REPORT_URI: 'https://reports.example.test/csp',
      },
      `const rewrites = await config.rewrites();
const headers = await config.headers();
const csp = headers[0].headers.find((header) => header.key === 'Content-Security-Policy').value;
assert.equal(rewrites[0].destination, 'http://127.0.0.1:8080/:path*');
assert(csp.includes('http://127.0.0.1:8080'));
assert(!csp.includes('averon-backend-production.up.railway.app'));
assert(!csp.includes('report-uri'));
console.log('isolated');`,
    );
    expect(result).toContain('isolated');
  });

  it('fails closed for a non-loopback preview API override', async () => {
    const result = probeConfig(
      {
        NODE_ENV: 'test',
        NEXT_PUBLIC_AVERON_LOCAL_API_URL: 'https://averon-backend-production.up.railway.app',
      },
      'console.log("config loaded");',
    );
    expect(result).toContain('NEXT_PUBLIC_AVERON_LOCAL_API_URL must be an HTTP loopback URL');
  });
});
