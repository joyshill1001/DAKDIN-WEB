'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { areaFrom, type AreaSel } from './types';
import { useAuth } from './auth';

type Ctx = { area: AreaSel | null; setArea: (a: AreaSel | null) => void };
const AreaCtx = createContext<Ctx>({ area: null, setArea: () => {} });

/** The area the visitor browses in. Starts from the saved profile area, can be changed any time. */
export function AreaProvider({ children }: { children: ReactNode }) {
  const { me } = useAuth();
  const [area, setAreaState] = useState<AreaSel | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem('browseArea');
      if (s) {
        const a = areaFrom(JSON.parse(s));
        if (a) {
          setAreaState(a);
          setTouched(true);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!touched && me?.area) setAreaState(me.area);
  }, [me, touched]);

  const setArea = useCallback((a: AreaSel | null) => {
    setAreaState(a);
    setTouched(true);
    try {
      if (a) localStorage.setItem('browseArea', JSON.stringify(a));
      else localStorage.removeItem('browseArea');
    } catch {
      /* ignore */
    }
  }, []);

  const v = useMemo(() => ({ area, setArea }), [area, setArea]);
  return <AreaCtx.Provider value={v}>{children}</AreaCtx.Provider>;
}

export const useArea = () => useContext(AreaCtx);
