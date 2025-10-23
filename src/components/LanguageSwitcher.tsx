import { Globe } from "lucide-react";
import { useState } from "react";

import { useI18n } from "../i18n/I18nProvider";

const SUPPORTED_LANGUAGES = [
  { code: "de", labelKey: "i18n.language.de" },
  { code: "en", labelKey: "i18n.language.en" },
];

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-brand-divider/60 bg-white px-3 py-1.5 text-sm font-medium text-brand-text shadow-sm transition hover:border-brand-primary/60"
      >
        <Globe className="h-4 w-4 text-brand-primary" />
        {locale.toUpperCase()}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-40 rounded-card border border-brand-divider/60 bg-white p-2 shadow-soft">
          <p className="px-2 text-xs font-semibold uppercase text-brand-text-muted">
            {t("i18n.switcher.label", "Language")}
          </p>
          <ul className="mt-1 space-y-1">
            {SUPPORTED_LANGUAGES.map((language) => {
              const label = t(language.labelKey, language.code.toUpperCase());
              const isActive = locale === language.code;
              return (
                <li key={language.code}>
                  <button
                    type="button"
                    onClick={() => {
                      setLocale(language.code);
                      setOpen(false);
                    }}
                    className={`w-full rounded-[10px] px-2 py-1.5 text-left text-sm transition ${
                      isActive
                        ? "bg-brand-primary text-white"
                        : "text-brand-text hover:bg-brand-light/60"
                    }`}
                  >
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
