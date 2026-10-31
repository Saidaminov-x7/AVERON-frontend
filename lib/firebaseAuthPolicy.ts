type FirebaseAuthEnvironment = {
  NODE_ENV?: string;
  VITEST?: string;
  JEST_WORKER_ID?: string;
  NEXT_PUBLIC_AVERON_RUNTIME_TARGET?: string;
};

export function shouldUseFirebaseAuthEmulator(environment: FirebaseAuthEnvironment): boolean {
  return environment.NODE_ENV === 'development'
    || environment.NODE_ENV === 'test'
    || Boolean(environment.VITEST || environment.JEST_WORKER_ID)
    || environment.NEXT_PUBLIC_AVERON_RUNTIME_TARGET === 'local';
}
