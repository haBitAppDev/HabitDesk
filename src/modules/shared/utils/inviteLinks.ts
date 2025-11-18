const HABIT_APP_SCHEME = "habitapp";
const HABIT_APP_REGISTER_HOST = "register";
const HABIT_APP_WEB_BASE = "https://habit-app.de/register";
const APP_STORE_PLACEHOLDER_PATH = "/app-store-placeholder.html";

const buildQuery = (code: string) =>
  code ? `?therapistCode=${encodeURIComponent(code)}` : "";

export const buildHabitSchemeLink = (inviteCode: string) =>
  `${HABIT_APP_SCHEME}://${HABIT_APP_REGISTER_HOST}${buildQuery(inviteCode)}`;

export const buildHabitWebLink = (inviteCode: string) =>
  `${HABIT_APP_WEB_BASE}${buildQuery(inviteCode)}`;

export const resolveAppStorePlaceholderUrl = () => {
  if (typeof window === "undefined") {
    return APP_STORE_PLACEHOLDER_PATH;
  }
  return new URL(APP_STORE_PLACEHOLDER_PATH, window.location.origin).toString();
};
