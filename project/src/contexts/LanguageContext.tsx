import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { interpolate, translate, type Language } from '../lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'zh';
    const stored = localStorage.getItem('coffee-lab-lang');
    return stored === 'en' || stored === 'zh' ? stored : 'zh';
  });

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    localStorage.setItem('coffee-lab-lang', nextLanguage);
  };

  const toggleLanguage = () => setLanguage(language === 'zh' ? 'en' : 'zh');

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t: (key: string, params?: Record<string, string | number>) =>
        interpolate(translate(language, key), params),
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useTranslation must be used within LanguageProvider');
  return ctx;
}
