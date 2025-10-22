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

type EnvSource = Record<string, string | undefined>;

const resolveEnvSource = (): EnvSource => {
  if (typeof import.meta !== "undefined" && (import.meta as any).env) {
    return import.meta.env as EnvSource;
  }

  if (typeof globalThis !== "undefined") {
    const maybeProcess = (globalThis as Record<string, unknown>).process as
      | { env?: EnvSource }
      | undefined;

    if (maybeProcess?.env) {
      return maybeProcess.env;
    }
  }

  return {};
};

const rawEnv = resolveEnvSource();

const firebaseEnv = firebaseEnvSchema.parse({
  FIREBASE_API_KEY: rawEnv.FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN: rawEnv.FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID: rawEnv.FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET: rawEnv.FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID: rawEnv.FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID: rawEnv.FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID: rawEnv.FIREBASE_MEASUREMENT_ID,
});

export const firebaseConfig = {
  apiKey: firebaseEnv.FIREBASE_API_KEY,
  authDomain: firebaseEnv.FIREBASE_AUTH_DOMAIN,
  projectId: firebaseEnv.FIREBASE_PROJECT_ID,
  storageBucket: firebaseEnv.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseEnv.FIREBASE_MESSAGING_SENDER_ID,
  appId: firebaseEnv.FIREBASE_APP_ID,
  measurementId: firebaseEnv.FIREBASE_MEASUREMENT_ID,
};
