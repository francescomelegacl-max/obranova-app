// ─── hooks/useMagazzino.js ───────────────────────────────────────────────────
// Gestisce giacenze, movimenti e alert scorte del magazzino.

import { useState, useCallback } from "react";
import { doc, setDoc, collection, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../lib/firebase";

export const MOVIMENTO_TYPES = {
  CARICO:   "carico",    // arrivo merce
  SCARICO:  "scarico",   // utilizzo in cantiere
  RETTIFICA:"rettifica", // correzione manuale inventario
  RESO:     "reso",      // restituzione al fornitore
};

export const MOVIMENTO_LABELS = {
  carico:    { label: "📦 Carico",    color: "#276749", bg: "#f0fff4" },
  scarico:   { label: "🔨 Scarico",   color: "#c05621", bg: "#fffaf0" },
  rettifica: { label: "✏️ Rettifica", color: "#2b6cb0", bg: "#ebf8ff" },
  reso:      { label: "↩️ Reso",      color: "#718096", bg: "#f7fafc" },
};

export function useMagazzino({ workspaceId, onToast }) {
  const [items,      setItems]      = useState([]);
  const [movimenti,  setMovimenti]  = useState([]);
  const [loading,    setLoading]    = useState(false);

  const uid    = () => auth.currentUser?.uid;
  const base   = useCallback(() => workspaceId ? `workspaces/${workspaceId}` : null, [workspaceId]);

  // ── Carica tutto il magazzino ─────────────────────────────────────────────
  const loadMagazzino = useCallback(async () => {
    const b = base(); if (!b) return;
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, b, "magazzino"));
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
      setItems(list);
    } catch (e) { console.error("loadMagazzino:", e); }
    setLoading(false);
  }, [workspaceId, base]);

  // ── Carica movimenti ──────────────────────────────────────────────────────
  const loadMovimenti = useCallback(async (itemId = null) => {
    const b = base(); if (!b) return;
    try {
      const snap = await getDocs(collection(db, b, "movimenti"));
      const list = [];
      snap.forEach(d => {
        const data = d.data();
        if (!itemId || data.itemId === itemId) list.push({ id: d.id, ...data });
      });
      list.sort((a, b) => (b.data || "").localeCompare(a.data || ""));
      setMovimenti(list);
    } catch (e) { console.error("loadMovimenti:", e); }
  }, [workspaceId, base]);

  // ── Aggiungi/aggiorna articolo ────────────────────────────────────────────
  const saveItem = useCallback(async (form, existingId = null) => {
    const b = base(); 
    if (!b) { onToast("❌ Workspace non trovato"); return null; }
    try {
      let ref;
      if (existingId) {
        ref = doc(db, b, "magazzino", existingId);
      } else {
        ref = doc(collection(db, b, "magazzino"));
      }
      await setDoc(ref, {
        nome:           form.nome?.trim() || "",
        categoria:      form.categoria    || "",
        unita:          form.unita        || "un",
        giacenza:       parseFloat(form.giacenza)       || 0,
        giacenzaMinima: parseFloat(form.giacenzaMinima) || 0,
        prezzo:         parseFloat(form.prezzo)         || 0,
        fornitore:      form.fornitore    || "",
        note:           form.note         || "",
        updatedAt:      new Date().toISOString(),
        createdBy:      uid() || "",
      }, { merge: true });
      await loadMagazzino();
      onToast(existingId ? "✅ Articolo aggiornato" : "✅ Articolo aggiunto");
      return ref.id;
    } catch (e) {
      onToast("❌ Errore: " + e.message);
      console.error(e);
      return null;
    }
  }, [workspaceId, loadMagazzino, onToast]);

  // ── Elimina articolo ──────────────────────────────────────────────────────
  const deleteItem = useCallback(async (id) => {
    const b = base(); if (!b) return;
    if (!window.confirm("Eliminare questo articolo dal magazzino?")) return;
    await deleteDoc(doc(db, b, "magazzino", id));
    await loadMagazzino();
    onToast("🗑️ Articolo eliminato");
  }, [workspaceId, loadMagazzino, onToast]);

  // ── Registra movimento e aggiorna giacenza ────────────────────────────────
  const registraMovimento = useCallback(async ({ itemId, tipo, quantita, note, proyectoId }) => {
    const b = base(); if (!b) return;
    const qty = parseFloat(quantita) || 0;
    if (qty <= 0) { onToast("❌ Inserisci una quantità valida"); return; }

    const item = items.find(x => x.id === itemId);
    if (!item) { onToast("❌ Articolo non trovato"); return; }

    // Calcola nuova giacenza
    let delta = 0;
    if (tipo === MOVIMENTO_TYPES.CARICO)    delta = +qty;
    if (tipo === MOVIMENTO_TYPES.SCARICO)   delta = -qty;
    if (tipo === MOVIMENTO_TYPES.RETTIFICA) delta = qty - item.giacenza; // imposta esatta
    if (tipo === MOVIMENTO_TYPES.RESO)      delta = -qty;

    const nuovaGiacenza = Math.max(0, item.giacenza + delta);

    try {
      // Salva movimento
      const movRef = doc(collection(db, b, "movimenti"));
      await setDoc(movRef, {
        itemId,
        nomeItem:   item.nome,
        tipo,
        quantita:   tipo === MOVIMENTO_TYPES.RETTIFICA ? qty : qty,
        delta,
        giacenzaPre:  item.giacenza,
        giacenzaPost: nuovaGiacenza,
        note:         note || "",
        proyectoId:   proyectoId || "",
        data:         new Date().toISOString(),
        createdBy:    uid() || "",
      });

      // Aggiorna giacenza articolo
      await updateDoc(doc(db, b, "magazzino", itemId), {
        giacenza:  nuovaGiacenza,
        updatedAt: new Date().toISOString(),
      });

      await loadMagazzino();
      await loadMovimenti();
      onToast(`✅ Movimento registrato — Giacenza: ${nuovaGiacenza} ${item.unita}`);

      // Alert scorta minima
      if (nuovaGiacenza <= item.giacenzaMinima && item.giacenzaMinima > 0) {
        setTimeout(() => onToast(`⚠️ SCORTA MINIMA: ${item.nome} (${nuovaGiacenza} ${item.unita})`), 1200);
      }
    } catch (e) {
      onToast("❌ Errore: " + e.message);
      console.error(e);
    }
  }, [items, workspaceId, loadMagazzino, loadMovimenti, onToast]);

  // ── Scarica automaticamente dal magazzino quando si usa una partida ───────
  const scaricoAutomatico = useCallback(async (nomeMateriale, quantita, proyectoId) => {
    const b = base(); if (!b) return;
    // Cerca per nome simile (case insensitive)
    const found = items.find(x => x.nome.toLowerCase().trim() === nomeMateriale.toLowerCase().trim());
    if (!found) return; // non trovato, nessun scarico automatico
    await registraMovimento({
      itemId: found.id,
      tipo: MOVIMENTO_TYPES.SCARICO,
      quantita,
      note: `Scarico automatico progetto`,
      proyectoId,
    });
  }, [items, registraMovimento]);

  // ── Items sotto scorta minima ─────────────────────────────────────────────
  const itemsInAlert = items.filter(x => x.giacenzaMinima > 0 && x.giacenza <= x.giacenzaMinima);

  return {
    items, movimenti, loading, itemsInAlert,
    loadMagazzino, loadMovimenti,
    saveItem, deleteItem,
    registraMovimento, scaricoAutomatico,
  };
}
