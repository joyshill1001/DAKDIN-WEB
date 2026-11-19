'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { toBnDigits } from './util';

type Lang = 'bn' | 'en';
type Ctx = {
  lang: Lang;
  en: boolean;
  setLang: (l: Lang) => void;
  /** t('বাংলা', 'English') */
  t: (bn: string, en: string) => string;
  /** number in the chosen language */
  n: (v: number | string) => string;
  money: (v: number) => string;
};

const LangCtx = createContext<Ctx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('bn');

  useEffect(() => {
    try {
      const s = localStorage.getItem('lang');
      if (s === 'en' || s === 'bn') setLangState(s);
    } catch {
      /* private mode */
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem('lang', l);
    } catch {
      /* ignore */
    }
    if (typeof document !== 'undefined') document.documentElement.lang = l;
  }, []);

  const value = useMemo<Ctx>(() => {
    const en = lang === 'en';
    const n = (v: number | string) => (en ? String(v) : toBnDigits(v));
    return {
      lang,
      en,
      setLang,
      t: (bn, e) => (en ? e : bn),
      n,
      money: (v) => (en ? `৳${v}` : `৳${toBnDigits(v)}`),
    };
  }, [lang, setLang]);

  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export function useLang(): Ctx {
  const c = useContext(LangCtx);
  if (!c) throw new Error('useLang outside LangProvider');
  return c;
}
