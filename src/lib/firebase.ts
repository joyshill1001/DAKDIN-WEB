import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// These values are public identifiers (they are visible in every website that uses Firebase).
// What protects the data is the Firestore rules, not hiding these values.
const cfg = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
};

export const firebaseConfigured = Boolean(cfg.apiKey && cfg.projectId && cfg.appId);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (firebaseConfigured) {
  app = getApps().length ? getApp() : initializeApp(cfg);
  auth = getAuth(app);
  db = getFirestore(app);

  // App Check (optional): blocks requests that do not come from this website.
  const site = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (site && typeof window !== 'undefined') {
    import('firebase/app-check')
      .then(({ initializeAppCheck, ReCaptchaV3Provider }) => {
        try {
          initializeAppCheck(app!, { provider: new ReCaptchaV3Provider(site), isTokenAutoRefreshEnabled: true });
        } catch {
          /* already initialised */
        }
      })
      .catch(() => {});
  }
}

export { app, auth, db };
