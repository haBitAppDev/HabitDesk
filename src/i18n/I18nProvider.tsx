import { createContext, useContext, useEffect, useMemo, useState } from "react";

import enTranslations from "./translations/en.json";
import deTranslations from "./translations/de.json";

type TranslationMap = Record<string, unknown>;

const TRANSLATIONS: Record<string, TranslationMap> = {
  en: enTranslations,
  de: deTranslations,
};

type Translator = (
  key: string,
  fallback?: string,
  params?: Record<string, string | number>
) => string;

interface I18nContextValue {
  locale: string;
  t: Translator;
  setLocale: (locale: string) => void;
}

const I18N_STORAGE_KEY = "habitdesk_locale";

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function getNestedValue(map: TranslationMap, path: string[]): unknown {
  return path.reduce<unknown>((acc, segment) => {
    if (acc && typeof acc === "object" && segment in acc) {
      return (acc as TranslationMap)[segment];
    }
    return undefined;
  }, map);
}

function formatMessage(template: string, params?: Record<string, string | number>) {
  if (!params) return template;
  return template.replace(/\{([^}]+)\}/g, (match, token) => {
    const trimmed = token.trim();
    if (trimmed in params) {
      return String(params[trimmed]);
    }
    return match;
  });
}

function createTranslator(locale: string): Translator {
  const dictionary = TRANSLATIONS[locale] ?? TRANSLATIONS.en;

  return (key: string, fallback?: string, params?: Record<string, string | number>) => {
    const segments = key.split(".");
    const value = getNestedValue(dictionary, segments);
    if (typeof value === "string") {
      return formatMessage(value, params);
    }
    const alt = fallback ?? key.split(".").pop() ?? key;
    return formatMessage(String(alt), params);
  };
}

interface I18nProviderProps {
  children: React.ReactNode;
  defaultLocale?: string;
}

export function I18nProvider({
  children,
  defaultLocale = "de",
}: I18nProviderProps) {
  const [locale, setLocale] = useState(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem(I18N_STORAGE_KEY) ?? defaultLocale;
    }
    return defaultLocale;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(I18N_STORAGE_KEY, locale);
    }
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    return {
      locale,
      setLocale,
      t: createTranslator(locale),
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
