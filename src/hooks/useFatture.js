// ─── hooks/useFatture.js ──────────────────────────────────────────────────────
import { useState, useCallback } from "react";
import { doc, setDoc, collection, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { handleError } from "../utils/errorHandler";

export function useFatture({ onToast, workspaceId }) {
  const [fatture, setFatture] = useState([]);

  const basePath = useCallback(
    () => workspaceId ? `workspaces/${workspaceId}` : null,
    [workspaceId]
  );

  const loadFatture = useCallback(async () => {
    const base = basePath(); if (!base) return;
    try {
      const snap = await getDocs(collection(db, base, "fatture"));
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.creadoAt || "").localeCompare(a.creadoAt || ""));
      setFatture(list);
    } catch (e) { handleError(e, { context: "loadFatture", onToast }); }
  }, [workspaceId]);

  const creaFattura = useCallback(async (dati) => {
    const base = basePath(); if (!base) return;
    try {
      const ref = doc(collection(db, base, "fatture"));
      await setDoc(ref, { ...dati, creadoAt: new Date().toISOString() });
      setFatture(f => [{ id: ref.id, ...dati }, ...f]);
      onToast("✅ Fattura creata!");
    } catch (e) {
      handleError(e, { context: "creaFattura", onToast });
    }
  }, [workspaceId, onToast]);

  const togglePagata = useCallback(async (id, pagata) => {
    const base = basePath(); if (!base) return;
    try {
      await updateDoc(doc(db, base, "fatture", id), { pagata, pagatoAt: pagata ? new Date().toISOString() : null });
      setFatture(f => f.map(x => x.id === id ? { ...x, pagata, pagatoAt: pagata ? new Date().toISOString() : null } : x));
      onToast(pagata ? "✅ Fattura segnata come pagata" : "↩ Pagamento annullato");
    } catch (e) { handleError(e, { context: "togglePagata", onToast }); }
  }, [workspaceId, onToast]);

  const eliminaFattura = useCallback(async (id) => {
    const base = basePath(); if (!base) return;
    if (!window.confirm("Eliminare questa fattura?")) return;
    try {
      await deleteDoc(doc(db, base, "fatture", id));
      setFatture(f => f.filter(x => x.id !== id));
      onToast("🗑️ Fattura eliminata");
    } catch (e) { handleError(e, { context: "eliminaFattura", onToast }); }
  }, [workspaceId, onToast]);

  return { fatture, loadFatture, creaFattura, togglePagata, eliminaFattura };
}
