import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const [directory, route, scoreFloor] = process.argv.slice(2);
const maxScriptBytes = 500_000;
const files = (await readdir(directory)).filter(file => file.endsWith('.json') && file !== 'manifest.json');
if (files.length < 3) throw new Error(`Expected three Lighthouse reports in ${directory}, found ${files.length}`);
const results = await Promise.all(files.map(async file => {
  const report = JSON.parse(await readFile(path.join(directory, file), 'utf8'));
  const script = report.audits['resource-summary'].details.items.find(item => item.resourceType === 'script')?.transferSize ?? 0;
  const score = report.categories.performance.score;
  console.log(`${report.finalUrl}: Performance ${Math.round(score * 100)}, transferred JS ${script} bytes`);
  if (!report.finalUrl.endsWith(route)) throw new Error(`Unexpected route in ${file}: ${report.finalUrl}`);
  if (score < Number(scoreFloor)) throw new Error(`Performance score ${score} below ${scoreFloor} for ${route}`);
  if (script > maxScriptBytes) throw new Error(`Transferred JS ${script} exceeds ${maxScriptBytes} bytes for ${route}`);
  return { score, script };
}));
console.log(`PASS ${route}: 3 runs; Performance >= ${scoreFloor}; JS transfer <= ${maxScriptBytes} bytes`);
