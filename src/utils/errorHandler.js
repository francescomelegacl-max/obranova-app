// ─── utils/errorHandler.js ───────────────────────────────────────────────────
// Gestione errori centralizzata per tutti gli hook e componenti.
//
// USO:
//   import { handleError } from "../utils/errorHandler";
//
//   } catch (e) {
//     return handleError(e, { context: "loadProyectos", fallback: [] });
//   }
//
//   // Con toast all'utente:
//   } catch (e) {
//     return handleError(e, { context: "saveItem", onToast, fallback: null });
//   }
// ─────────────────────────────────────────────────────────────────────────────

import * as Sentry from "@sentry/react";

// ── Messaggi user-friendly per errori Firebase ────────────────────────────────
const FIREBASE_MESSAGES = {
  "permission-denied":       "Permessi insufficienti. Ricarica la pagina.",
  "unauthenticated":         "Sessione scaduta. Effettua il login.",
  "unavailable":             "Servizio non disponibile. Controlla la connessione.",
  "network-request-failed":  "Errore di rete. Controlla la connessione.",
  "not-found":               "Elemento non trovato.",
  "already-exists":          "Elemento già esistente.",
  "resource-exhausted":      "Quota Firebase esaurita. Riprova tra poco.",
  "cancelled":               "Operazione annullata.",
  "deadline-exceeded":       "Operazione scaduta. Riprova.",
};

// ── Estrae messaggio leggibile dall'errore ────────────────────────────────────
function getErrorMessage(error) {
  if (!error) return "Errore sconosciuto";

  // Errori Firebase: code nel formato "auth/..." o "firestore/..."
  const code = error.code?.split("/").pop();
  if (code && FIREBASE_MESSAGES[code]) return FIREBASE_MESSAGES[code];

  // Errori di rete generici
  if (error.message?.includes("Failed to fetch") || error.message?.includes("NetworkError")) {
    return "Errore di rete. Controlla la connessione.";
  }

  // Fallback al messaggio originale (troncato)
  return error.message?.slice(0, 120) || "Errore sconosciuto";
}

// ── Handler principale ────────────────────────────────────────────────────────
//
// @param {Error}  error           - L'errore catturato
// @param {object} options
//   @param {string}   context     - Dove è avvenuto l'errore (per log/Sentry)
//   @param {function} onToast     - Callback per mostrare toast all'utente
//   @param {boolean}  silent      - Se true, non logga in console
//   @param {boolean}  rethrow     - Se true, rilancia l'errore dopo logging
//   @param {*}        fallback    - Valore da ritornare (default: null)
//
// @returns {*} fallback
//
export function handleError(error, {
  context  = "",
  onToast  = null,
  silent   = false,
  rethrow  = false,
  fallback = null,
} = {}) {
  const label = context ? `[${context}]` : "[error]";

  // 1. Log in console (a meno che silent)
  if (!silent) {
    console.error(label, error);
  }

  // 2. Invia a Sentry (se inizializzato)
  try {
    Sentry.captureException(error, {
      extra: { context },
      tags:  { errorCode: error?.code || "unknown" },
    });
  } catch { /* Sentry non disponibile — ignora */ }

  // 3. Toast all'utente (se callback fornita)
  if (typeof onToast === "function") {
    const msg = getErrorMessage(error);
    onToast(`⚠️ ${msg}`);
  }

  // 4. Rilancia se richiesto
  if (rethrow) throw error;

  return fallback;
}
