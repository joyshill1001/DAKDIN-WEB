'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, firebaseConfigured } from './firebase';
import { userFrom, type AppUser } from './types';

type Ctx = {
  configured: boolean;
  /** true until Firebase told us whether someone is signed in */
  loading: boolean;
  fbUser: User | null;
  /** users/{uid}; null while loading or if the document does not exist yet */
  me: AppUser | null;
  /** true once the users/{uid} document has been read (exists or not) */
  meReady: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(firebaseConfigured);
  const [fbUser, setFbUser] = useState<User | null>(null);
  const [me, setMe] = useState<AppUser | null>(null);
  const [meReady, setMeReady] = useState(false);

  useEffect(() => {
    if (!auth) return;
    getRedirectResult(auth).catch(() => {});
    return onAuthStateChanged(auth, (u) => {
      setFbUser(u);
      setLoading(false);
      if (!u) {
        setMe(null);
        setMeReady(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!fbUser || !db) return;
    setMeReady(false);
    return onSnapshot(
      doc(db, 'users', fbUser.uid),
      (s) => {
        setMe(s.exists() ? userFrom(s.id, s.data()) : null);
        setMeReady(true);
      },
      () => {
        setMe(null);
        setMeReady(true);
      },
    );
  }, [fbUser]);

  const signIn = useCallback(async () => {
    if (!auth) throw new Error('not configured');
    const p = new GoogleAuthProvider();
    p.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, p);
    } catch (e) {
      const code = typeof e === 'object' && e && 'code' in e ? String((e as { code: unknown }).code) : '';
      // Some phones block pop-ups: use the full-page sign-in instead.
      if (code.includes('popup-blocked') || code.includes('operation-not-supported')) {
        await signInWithRedirect(auth, p);
        return;
      }
      throw e;
    }
  }, []);

  const signOut = useCallback(async () => {
    if (auth) await fbSignOut(auth);
  }, []);

  const value = useMemo<Ctx>(
    () => ({ configured: firebaseConfigured, loading, fbUser, me, meReady, signIn, signOut }),
    [loading, fbUser, me, meReady, signIn, signOut],
  );
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): Ctx {
  const c = useContext(AuthCtx);
  if (!c) throw new Error('useAuth outside AuthProvider');
  return c;
}
