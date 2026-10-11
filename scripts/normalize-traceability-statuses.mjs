import { readFile, writeFile } from 'node:fs/promises';

const path = new URL('../docs/REQUIREMENTS_TRACEABILITY.csv', import.meta.url);
let csv = await readFile(path, 'utf8');
for (const [source, target] of Object.entries({
  PARTIAL: 'ЧАСТИЧНО',
  NOT_TESTED: 'НЕ ПРОВЕРЕНО',
  NOT_IMPLEMENTED: 'НЕ РЕАЛИЗОВАНО',
  BLOCKED: 'ЗАБЛОКИРОВАНО',
  FAIL: 'ЧАСТИЧНО',
})) {
  csv = csv.replaceAll(`"${source}"`, `"${target}"`);
}
await writeFile(path, csv);
