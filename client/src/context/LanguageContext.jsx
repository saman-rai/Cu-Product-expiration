import { createContext, useContext, useState, useCallback } from 'react';
import { ko, en } from '../i18n/translations';

const LanguageContext = createContext(null);

function interpolate(str, params) {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, key) => params[key] ?? `{${key}}`);
}

export function LanguageProvider({ children }) {
  const saved = localStorage.getItem('appLanguage') || 'ko';
  const [lang, setLangState] = useState(saved);

  const setLang = useCallback((l) => {
    setLangState(l);
    localStorage.setItem('appLanguage', l);
  }, []);

  const t = useCallback((key, params) => {
    const dict = lang === 'en' ? en : ko;
    const val = dict[key];
    if (!val) return key;
    return interpolate(val, params);
  }, [lang]);

  const toggleLang = useCallback(() => {
    setLang(lang === 'ko' ? 'en' : 'ko');
  }, [lang, setLang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
