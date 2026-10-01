export function formatUzbekPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  const nationalNumber = (digits.startsWith('998') ? digits.slice(3) : digits).slice(0, 9);
  const groups = [
    nationalNumber.slice(0, 2),
    nationalNumber.slice(2, 5),
    nationalNumber.slice(5, 7),
    nationalNumber.slice(7, 9),
  ].filter(Boolean);
  return `+998${groups.length ? ` ${groups.join(' ')}` : ' '}`;
}

export function normalizeUzbekPhoneInput(value: string): string | null {
  const digits = value.replace(/\D/g, '');
  const nationalNumber = digits.startsWith('998') ? digits.slice(3) : digits;
  return /^\d{9}$/.test(nationalNumber) ? `+998${nationalNumber}` : null;
}
