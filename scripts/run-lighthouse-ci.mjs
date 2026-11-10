import { spawn } from 'node:child_process';

const runs = [
  { url: 'http://127.0.0.1:3000/ru', formFactor: 'mobile', output: 'artifacts/lighthouse/home', route: '/ru', floor: '0.45' },
  { url: 'http://127.0.0.1:3000/ru/catalog', formFactor: 'desktop', output: 'artifacts/lighthouse/catalog', route: '/ru/catalog', floor: '0.40' },
];

for (const run of runs) {
  const env = {
    ...process.env,
    LHCI_URL: run.url,
    LHCI_FORM_FACTOR: run.formFactor,
    LHCI_OUTPUT: run.output,
  };
  await new Promise((resolve, reject) => {
    const child = spawn('pnpm', ['lhci'], { env, stdio: 'inherit', shell: process.platform === 'win32' });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`LHCI exited ${code}`)));
  });
  const check = spawn(process.execPath, ['scripts/check-lighthouse-budget.mjs', run.output, run.route, run.floor], { stdio: 'inherit' });
  await new Promise((resolve, reject) => {
    check.on('error', reject);
    check.on('exit', code => code === 0 ? resolve() : reject(new Error(`Budget check exited ${code}`)));
  });
}
