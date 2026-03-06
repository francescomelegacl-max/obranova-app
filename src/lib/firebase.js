// ─── lib/firebase.js ─────────────────────────────────────────────────────────
// 🔐 SICUREZZA: Le credenziali Firebase NON devono mai stare nel codice sorgente.
// Crea un file .env nella root del progetto con queste variabili:
//
//   VITE_FIREBASE_API_KEY=AIzaSy...
//   VITE_FIREBASE_AUTH_DOMAIN=obra-nova-spa.firebaseapp.com
//   VITE_FIREBASE_PROJECT_ID=obra-nova-spa
//   VITE_FIREBASE_STORAGE_BUCKET=obra-nova-spa.firebasestorage.app
//   VITE_FIREBASE_MESSAGING_SENDER_ID=836523248614
//   VITE_FIREBASE_APP_ID=1:836523248614:web:f83ef04cfad8be31ece427
//
// Il file .env è già in .gitignore di default nei progetti Vite.
// NON committare mai le credenziali reali in Git.

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
