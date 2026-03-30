// ─── lib/firebase.js ─────────────────────────────────────────────────────────
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// App Check — usa debug token in development
if (import.meta.env.DEV) {
  // In dev mode, usa debug token (devi registrarlo nella console Firebase)
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}
export const appCheck = import.meta.env.VITE_RECAPTCHA_ENTERPRISE_KEY
  ? initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(import.meta.env.VITE_RECAPTCHA_ENTERPRISE_KEY),
      isTokenAutoRefreshEnabled: true,
    })
  : null;

// Analytics — lazy, evita circular dependency nel bundle
let _analytics = null;
isSupported().then((ok) => {
  if (ok) _analytics = getAnalytics(app);
}).catch(() => {});

export function getAnalyticsInstance() {
  return _analytics;
}
