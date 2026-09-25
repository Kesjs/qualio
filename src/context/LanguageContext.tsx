"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Language, translations, Translations } from "@/i18n/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "reachly_lang_preference";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (saved === "en" || saved === "fr") {
        setLanguageState(saved);
      } else {
        // Detect browser language
        const browserLang = navigator.language.toLowerCase();
        if (browserLang.startsWith("fr")) {
          setLanguageState("fr");
        }
      }
    } catch {
      // Ignore localStorage errors
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    // Impeccable Animate: Utilisation de l'API View Transitions pour une continuité fluide
    if (typeof document !== "undefined" && "startViewTransition" in document) {
      // Import dynamique de flushSync pour forcer le rendu synchrone requis par l'API
      import("react-dom").then(({ flushSync }) => {
        (document as any).startViewTransition(() => {
          flushSync(() => {
            setLanguageState(lang);
          });
        });
      });
    } else {
      setLanguageState(lang);
    }

    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch {
      // Ignore localStorage errors
    }
  };

  const t = translations[language] as Translations;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
