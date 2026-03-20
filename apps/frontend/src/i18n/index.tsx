import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import en from "./en.json";
import fr from "./fr.json";

export type Lang = "en" | "fr";
export type TranslationKey = keyof typeof en;

type Translations = Record<TranslationKey, string>;

const translations: Record<Lang, Translations> = { en, fr };

interface I18nContextValue {
  lang: Lang;
  toggleLang: () => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === "en" ? "fr" : "en"));
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      let text: string = translations[lang][key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(`{${k}}`, String(v));
        }
      }
      return text;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
