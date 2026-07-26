import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'fr';

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (en: string, fr?: string | null) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    const stored = localStorage.getItem('songtai_lang');
    if (stored === 'fr' || stored === 'en') {
      setLangState(stored);
    }
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem('songtai_lang', l);
  };

  const t = (en: string, fr?: string | null) => {
    if (lang === 'fr' && fr) return fr;
    return en;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}
