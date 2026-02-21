import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { env } from "../config/env.js";

const getPrivateKey = (): string => env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");

const hasExplicitServiceAccount =
  env.FIREBASE_PROJECT_ID.length > 0 && env.FIREBASE_CLIENT_EMAIL.length > 0 && env.FIREBASE_PRIVATE_KEY.length > 0;

export const isFirebaseConfigured = (): boolean => hasExplicitServiceAccount || Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);

const ensureFirebaseApp = () => {
  if (getApps().length > 0) return getApps()[0];

  if (hasExplicitServiceAccount) {
    return initializeApp({
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: getPrivateKey(),
      }),
    });
  }

  return initializeApp();
};

export const verifyFirebaseIdToken = async (idToken: string) => {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase admin credentials are not configured");
  }
  const app = ensureFirebaseApp();
  return getAuth(app).verifyIdToken(idToken);
};
