const secretAssignment = /\b(password|secret|authorization|access[_-]?token|refresh[_-]?token|api[_-]?key)\b(\s*[:=]\s*)("[^"]*"|'[^']*'|[^\s&,;]+)/gi;
const urlWithQuery = /https?:\/\/[^\s"'<>?#]+(?:\?[^\s"'<>#]*)?(?:#[^\s"'<>]*)?/gi;
const bearerCredential = /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi;
const jwt = /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;

export function sanitizeErrorReportText(value: string): string {
  return value
    .replace(urlWithQuery, (url) => url.split(/[?#]/, 1)[0] ?? url)
    .replace(secretAssignment, '$1$2[redacted]')
    .replace(bearerCredential, 'Bearer [redacted]')
    .replace(jwt, '[redacted JWT]');
}

export function getSafeErrorReportPath(): string {
  return typeof window === 'undefined' ? '' : window.location.pathname.slice(0, 500);
}
