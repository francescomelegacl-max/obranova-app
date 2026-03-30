// ─── hooks/useLogAction.js ────────────────────────────────────────────────────
import { useCallback } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../lib/firebase";

export function useLogAction(workspaceId) {
  const logAction = useCallback(async (azione, collezione, docId, extra = {}) => {
    if (!workspaceId) return;
    try {
      const fn = httpsCallable(functions, "logAttivita");
      await fn({ workspaceId, azione, collezione, docId, extra });
    } catch (_) {
      // Log non bloccante — ignora errori silenziosamente
    }
  }, [workspaceId]);

  return { logAction };
}
