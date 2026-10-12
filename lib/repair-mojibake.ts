const decoder = new TextDecoder('windows-1251');
const encoder = new Map<string, number>();

for (let byte = 0; byte < 256; byte += 1) {
  encoder.set(decoder.decode(new Uint8Array([byte])), byte);
}

function repairString(value: string): string {
  if (!/[РС][А-Яа-яЁё]|вЂ/.test(value)) return value;
  const bytes: number[] = [];
  for (const character of value) {
    const byte = encoder.get(character);
    if (byte === undefined) return value;
    bytes.push(byte);
  }
  try {
    const repaired = new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes));
    return repaired.includes('\uFFFD') ? value : repaired;
  } catch {
    return value;
  }
}

export function repairMojibake<T>(value: T): T {
  if (typeof value === 'string') return repairString(value) as T;
  if (Array.isArray(value)) return value.map((entry) => repairMojibake(entry)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, repairMojibake(entry)])) as T;
  }
  return value;
}
