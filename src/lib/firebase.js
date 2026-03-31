// ─── lib/firebase.js ──────────────────────────────────────────────────────────
// Firebase core — auth, firestore, app-check, analytics.
// NOTA: firebase/functions NON è importato qui per evitare TDZ Rollup in prod.
//       I consumer importano direttamente: import { getFunctions } from "firebase/functions"
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp, getApps }     from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAnalytics, isSupported }  from "firebase/analytics";
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
} from "firebase/app-check";

// ── Config Firebase ────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// ── Inizializza Firebase (singleton) ──────────────────────────────────────────
export const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

// ── Firebase App Check ────────────────────────────────────────────────────────
const USE_EMULATOR   = import.meta.env.VITE_USE_EMULATOR === "true";
const IS_BROWSER     = typeof window !== "undefined";
const RECAPTCHA_KEY  = import.meta.env.VITE_RECAPTCHA_ENTERPRISE_KEY;

export let appCheck = null;

if (IS_BROWSER && !USE_EMULATOR) {
  try {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(RECAPTCHA_KEY),
      isTokenAutoRefreshEnabled: true,
    });
    console.log("[AppCheck] ✅ Inizializzato con reCAPTCHA Enterprise");
  } catch (err) {
    console.warn("[AppCheck] ⚠️ Inizializzazione fallita:", err.message);
  }
} else if (IS_BROWSER && USE_EMULATOR) {
  if (typeof window !== "undefined") {
    window.self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  try {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(RECAPTCHA_KEY),
      isTokenAutoRefreshEnabled: true,
    });
    console.log("[AppCheck] 🔧 Modalità debug (emulatori)");
  } catch (err) {
    console.warn("[AppCheck] ⚠️ Debug init fallita:", err.message);
  }
}

// ── Servizi Firebase ──────────────────────────────────────────────────────────
export const auth = getAuth(app);
export const db   = getFirestore(app);

// ── Analytics (lazy — non disponibile in SSR/Node) ────────────────────────────
let _analyticsInstance = null;

export async function getAnalyticsInstance() {
  if (!IS_BROWSER) return null;
  if (_analyticsInstance) return _analyticsInstance;
  try {
    const supported = await isSupported();
    if (supported) {
      _analyticsInstance = getAnalytics(app);
    }
  } catch (err) {
    console.warn("[Analytics] ⚠️ Non disponibile:", err.message);
  }
  return _analyticsInstance;
}

// ── Emulatori (solo sviluppo locale) ─────────────────────────────────────────
if (USE_EMULATOR && IS_BROWSER) {
  try {
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "localhost", 8080);
    // functions emulator connesso in useLogAction/altri consumer al primo uso
    console.log("[Firebase] 🔧 Connesso agli emulatori locali");
  } catch {
    // Già connesso — ignora (HMR Vite richiama questo modulo più volte)
  }
}
