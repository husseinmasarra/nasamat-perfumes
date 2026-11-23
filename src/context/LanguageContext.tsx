import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Language } from '../types';
import { t as translate, type TranslationKey } from '../utils/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
  isRtl: boolean;
  dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'nasamat_language_v2';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'ar' || saved === 'en') {
        return saved;
      }
    } catch (e) {
      // ignore
    }
    return 'en'; // Default to English as requested
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      // ignore
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const isRtl = language === 'ar';
  const dir = isRtl ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', language);
    document.title = language === 'ar' 
      ? 'نسمات | مختبر صياغة وتركيب العطور الفاخرة' 
      : 'Nasamat | Luxury Bespoke Perfumery';
  }, [language, dir]);

  const t = (key: TranslationKey) => translate(key, language);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        isRtl,
        dir,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
