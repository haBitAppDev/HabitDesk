const DEFAULT_WEB_BASE = "https://habit-app.de/register";
const APP_STORE_PLACEHOLDER_PATH = "/app-store-placeholder.html";

const buildQuery = (code: string) =>
  code ? `?therapistCode=${encodeURIComponent(code)}` : "";

const resolveWebBase = () => {
  const envBase = import.meta.env.VITE_HABIT_WEB_BASE?.trim();
  if (envBase && envBase.length > 0) {
    return envBase.endsWith("/register") ? envBase : `${envBase.replace(/\/+$/, "")}/register`;
  }

  if (typeof window !== "undefined") {
    return new URL("/register", window.location.origin).toString();
  }

  return DEFAULT_WEB_BASE;
};

export const buildHabitWebLink = (inviteCode: string) =>
  `${resolveWebBase()}${buildQuery(inviteCode)}`;

export const resolveAppStorePlaceholderUrl = () => {
  if (typeof window === "undefined") {
    return APP_STORE_PLACEHOLDER_PATH;
  }
  return new URL(APP_STORE_PLACEHOLDER_PATH, window.location.origin).toString();
};
