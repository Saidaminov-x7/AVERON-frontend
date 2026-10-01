import { describe, expect, it } from 'vitest';
import { sanitizeErrorReportText } from './safe-error-report';

describe('sanitizeErrorReportText', () => {
  it('removes query strings, credentials, and bearer tokens from reports', () => {
    const result = sanitizeErrorReportText(
      'request https://averon.example/reset?token=secret Bearer abc.def password="hunter2"',
    );
    expect(result).toBe('request https://averon.example/reset Bearer [redacted] password=[redacted]');
    expect(result).not.toContain('secret');
    expect(result).not.toContain('hunter2');
    expect(result).not.toContain('abc.def');
  });
});
