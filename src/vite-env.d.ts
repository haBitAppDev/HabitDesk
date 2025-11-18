/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly FIREBASE_API_KEY: string
  readonly FIREBASE_AUTH_DOMAIN: string
  readonly FIREBASE_PROJECT_ID: string
  readonly FIREBASE_STORAGE_BUCKET: string
  readonly FIREBASE_MESSAGING_SENDER_ID: string
  readonly FIREBASE_APP_ID: string
  readonly FIREBASE_MEASUREMENT_ID?: string
  readonly VITE_HABIT_WEB_BASE?: string
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv
}
