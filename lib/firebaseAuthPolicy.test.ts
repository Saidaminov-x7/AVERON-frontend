import { describe, expect, it } from 'vitest';
import { shouldUseFirebaseAuthEmulator } from './firebaseAuthPolicy';

describe('Firebase auth environment isolation', () => {
  it.each([
    [{ NODE_ENV: 'development' }, true],
    [{ NODE_ENV: 'test' }, true],
    [{ NODE_ENV: 'production', VITEST: 'true' }, true],
    [{ NODE_ENV: 'production', JEST_WORKER_ID: '1' }, true],
    [{ NODE_ENV: 'production', NEXT_PUBLIC_AVERON_RUNTIME_TARGET: 'local' }, true],
    [{ NODE_ENV: 'production' }, false],
  ])('returns %s for the supplied runtime', (environment, expected) => {
    expect(shouldUseFirebaseAuthEmulator(environment)).toBe(expected);
  });
});
