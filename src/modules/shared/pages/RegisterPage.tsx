import { useMemo } from "react";
import { ExternalLink, Smartphone } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Button } from "../../../components/ui/button";
import { de } from "zod/v4/locales";

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
  console.log(deepLink)
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

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              if (typeof window !== "undefined") {
  window.location.href = deepLink;
}

            }}
            className="w-full sm:w-auto"
            aria-label="Open Habit deep link"
          >
            <ExternalLink className="h-5 w-5" />
          </Button>
          <a
            className="inline-flex w-full items-center justify-center rounded-[14px] border border-brand-divider px-4 py-3 text-sm font-semibold text-brand-text transition hover:border-brand-primary sm:w-auto"
            href={APP_STORE_PLACEHOLDER}
            aria-label="Visit placeholder app store page"
          >
            <Smartphone className="h-5 w-5" />
          </a>
        </div>
        <p className="mt-4 text-xs uppercase tracking-wide text-brand-text-muted">
          This page works best on mobile devices where Habit is installed.
        </p>
      </div>
    </div>
  );
}
