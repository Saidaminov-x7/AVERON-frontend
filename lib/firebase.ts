// lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { shouldUseFirebaseAuthEmulator } from './firebaseAuthPolicy';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const requiredFirebaseConfig = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.storageBucket,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId,
];

// Avoid re-initializing on hot reload
const app = requiredFirebaseConfig.every(Boolean)
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

const auth = app ? getAuth(app) : null;
const useAuthEmulator = shouldUseFirebaseAuthEmulator({
  NODE_ENV: process.env.NODE_ENV,
  VITEST: process.env.VITEST,
  JEST_WORKER_ID: process.env.JEST_WORKER_ID,
  NEXT_PUBLIC_AVERON_RUNTIME_TARGET: process.env.NEXT_PUBLIC_AVERON_RUNTIME_TARGET,
});

if (auth && useAuthEmulator) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
}

export const firebaseAuth = auth;
