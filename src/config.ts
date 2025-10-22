import { z } from "zod";

const firebaseEnvSchema = z.object({
  FIREBASE_API_KEY: z.string().min(1, "FIREBASE_API_KEY is required"),
  FIREBASE_AUTH_DOMAIN: z.string().min(1, "FIREBASE_AUTH_DOMAIN is required"),
  FIREBASE_PROJECT_ID: z.string().min(1, "FIREBASE_PROJECT_ID is required"),
  FIREBASE_STORAGE_BUCKET: z.string().min(1, "FIREBASE_STORAGE_BUCKET is required"),
  FIREBASE_MESSAGING_SENDER_ID: z
    .string()
    .min(1, "FIREBASE_MESSAGING_SENDER_ID is required"),
  FIREBASE_APP_ID: z.string().min(1, "FIREBASE_APP_ID is required"),
  FIREBASE_MEASUREMENT_ID: z.string().optional(),
});

const firebaseEnv = firebaseEnvSchema.parse(import.meta.env);

export const firebaseConfig = {
  apiKey: firebaseEnv.FIREBASE_API_KEY,
  authDomain: firebaseEnv.FIREBASE_AUTH_DOMAIN,
  projectId: firebaseEnv.FIREBASE_PROJECT_ID,
  storageBucket: firebaseEnv.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseEnv.FIREBASE_MESSAGING_SENDER_ID,
  appId: firebaseEnv.FIREBASE_APP_ID,
  measurementId: firebaseEnv.FIREBASE_MEASUREMENT_ID,
};
