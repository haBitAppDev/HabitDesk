import { useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Button } from "../../../components/ui/button";

const APP_STORE_PLACEHOLDER = "/app-store-placeholder.html";

const buildHabitDeepLink = (code?: string) => {
  if (!code) return "habitapp://register";
  return `habitapp://register?therapistCode=${encodeURIComponent(code)}`;
};

const formatCodeLabel = (code?: string) =>
  code ? `Therapist code: ${code}` : "No therapist code provided.";

export function RegisterPage() {
  const [searchParams] = useSearchParams();
  const code = useMemo(
    () =>
      searchParams.get("therapistCode") ??
      searchParams.get("inviteCode") ??
      searchParams.get("code") ??
      undefined,
    [searchParams]
  );
  const deepLink = useMemo(() => buildHabitDeepLink(code), [code]);
  return (
    <div className="min-h-screen bg-brand-surface px-4 py-16">
      <div className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-brand-divider bg-white/80 px-6 py-10 text-center shadow-lg backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary">
          Habit invite
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-brand-text">
          Open the Habit app
        </h1>
        <p className="mt-3 text-sm text-brand-text-muted">{formatCodeLabel(code)}</p>
        <p className="sr-only">
          If the code opens in the Habit app, you can complete the onboarding from there.
          Otherwise, download the app below and try again.
        </p>

        <div className="mt-6 w-full sm:w-auto">
          <Button
            type="button"
            variant="primary"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => {
              if (typeof window === "undefined") return;
              const start = Date.now();
              window.location.href = deepLink;
              window.setTimeout(() => {
                if (
                  typeof document !== "undefined" &&
                  document.visibilityState === "hidden"
                ) {
                  return;
                }
                if (Date.now() - start >= 1200) {
                  window.location.href = APP_STORE_PLACEHOLDER;
                }
              }, 1200);
            }}
            aria-label="Open Habit or fallback to App Store"
          >
            <ExternalLink className="h-5 w-5" />
          </Button>
        </div>
        <p className="mt-4 text-xs uppercase tracking-wide text-brand-text-muted">
          This page works best on mobile devices where Habit is installed.
        </p>
      </div>
    </div>
  );
}
