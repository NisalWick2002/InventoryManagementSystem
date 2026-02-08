import admin from 'firebase-admin';
import { env } from './env.js';

if (!admin.apps.length && env.NODE_ENV !== 'test') {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY,
    }),
  });
}

const testAuth: admin.auth.Auth = {
  verifyIdToken: async () => {
    throw new Error('Firebase auth is disabled in test mode');
  },
} as unknown as admin.auth.Auth;

export const auth: admin.auth.Auth = env.NODE_ENV === 'test' ? testAuth : admin.auth();
