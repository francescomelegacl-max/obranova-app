// ─── hooks/useFirma.js ───────────────────────────────────────────────────────
// Gestisce la creazione di link di firma e il salvataggio delle firme.

import { useState, useCallback } from "react";
import { doc, setDoc, getDoc, collection, collectionGroup, getDocs, updateDoc, query, where } from "firebase/firestore";
import { db, auth } from "../lib/firebase";

export const FIRMA_STATI = {
  PENDING:   "pending",
  FIRMATO:   "firmato",
  RIFIUTATO: "rifiutato",
  SCADUTO:   "scaduto",
};

export function useFirma({ workspaceId, onToast }) {
  const [firme,   setFirme]   = useState([]);
  const [loading, setLoading] = useState(false);

  const uid  = () => auth.currentUser?.uid;
  const base = useCallback(() => workspaceId ? `workspaces/${workspaceId}` : null, [workspaceId]);

  // ── Genera token univoco ──────────────────────────────────────────────────
  const generaToken = () => {
    const arr = new Uint8Array(24);
    crypto.getRandomValues(arr);
    return Array.from(arr, b => b.toString(16).padStart(2, "0")).join("");
  };

  // ── Crea link di firma per un progetto ───────────────────────────────────
  const creaLinkFirma = useCallback(async (proyectoId, proyectoInfo, giorniValidita = 7, proyectoSnapshot = null) => {
    const b = base();
    if (!b) { onToast("❌ Workspace non trovato"); return null; }
    try {
      setLoading(true);
      const token     = generaToken();
      const scadenza  = new Date();
      scadenza.setDate(scadenza.getDate() + giorniValidita);

      const ref = doc(db, b, "firme", token);
      await setDoc(ref, {
        token,
        workspaceId,
        proyectoId,
        cliente:     proyectoInfo?.cliente     || "",
        descripcion: proyectoInfo?.descripcion || "",
        stato:       FIRMA_STATI.PENDING,
        creadoAt:    new Date().toISOString(),
        scadenzaAt:  scadenza.toISOString(),
        creadoBy:    uid() || "",
        firmaNome:       null,
        firmaImmagine:   null,
        firmaData:       null,
        firmaIP:         null,
        rifiutoMotivo:   null,
        // ── Snapshot progetto: permette lettura pubblica senza auth ──────
        // Il cliente legge solo firme/{token} (allow read: if true)
        // senza accedere a proyectos/ che richiede isMember
        proyectoSnapshot: proyectoSnapshot ? {
          info:     proyectoSnapshot.info     || {},
          partidas: (proyectoSnapshot.partidas || []).filter(p => p.visible !== false),
          pct:      proyectoSnapshot.pct      || {},
          iva:      proyectoSnapshot.iva      || false,
          condPago: proyectoSnapshot.condPago || "",
          condPagoPersonalizado: proyectoSnapshot.condPagoPersonalizado || "",
        } : null,
      });

      // URL della pagina pubblica di firma
      const url = `${window.location.origin}/firma/${token}`;
      onToast("✅ Link di firma creato!");
      return { token, url };
    } catch (e) {
      onToast("❌ Errore: " + e.message);
      console.error(e);
      return null;
    } finally {
      setLoading(false);
    }
  }, [workspaceId, base, onToast]);

  // ── Carica firme di un progetto ───────────────────────────────────────────
  const loadFirme = useCallback(async (proyectoId = null) => {
    const b = base(); if (!b) return [];
    try {
      const snap = await getDocs(collection(db, b, "firme"));
      const list = [];
      snap.forEach(d => {
        const data = d.data();
        if (!proyectoId || data.proyectoId === proyectoId) list.push({ id: d.id, ...data });
      });
      list.sort((a, b) => (b.creadoAt || "").localeCompare(a.creadoAt || ""));
      setFirme(list);
      return list;
    } catch (e) { console.error("loadFirme:", e); return []; }
  }, [workspaceId, base]);

  // ── Carica dati firma pubblica (senza auth) ───────────────────────────────
  // FIX 1.5: cerca il token direttamente con collectionGroup('firme')
  // eliminando la dipendenza dalla collection tokens_firma/ che non esiste in produzione
  const loadFirmaPubblica = useCallback(async (token) => {
    try {
      const q = query(collectionGroup(db, "firme"), where("token", "==", token));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const firmaDoc = snap.docs[0];
      const firmaData = firmaDoc.data();
      // Leggi il progetto dallo stesso workspace
      const proyRef = doc(db, `workspaces/${firmaData.workspaceId}/proyectos/${firmaData.proyectoId}`);
      const proySnap = await getDoc(proyRef);
      return {
        firma:    { id: firmaDoc.id, ...firmaData },
        proyecto: proySnap.exists() ? { id: proySnap.id, ...proySnap.data() } : null,
      };
    } catch (e) { console.error("loadFirmaPubblica:", e); return null; }
  }, []);

  // ── Salva firma del cliente ───────────────────────────────────────────────
  const salvaFirma = useCallback(async (token, workspaceIdTarget, proyectoId, { nome, immagine }) => {
    try {
      setLoading(true);
      const firmaRef = doc(db, `workspaces/${workspaceIdTarget}/firme/${token}`);
      await updateDoc(firmaRef, {
        stato:         FIRMA_STATI.FIRMATO,
        firmaNome:     nome,
        firmaImmagine: immagine,
        firmaData:     new Date().toISOString(),
      });
      // Aggiorna stato progetto ad Aceptado
      const proyRef = doc(db, `workspaces/${workspaceIdTarget}/proyectos/${proyectoId}`);
      await updateDoc(proyRef, {
        estado:    "Aceptado",
        updatedAt: new Date().toISOString(),
      });
      return true;
    } catch (e) { console.error("salvaFirma:", e); return false; }
    finally { setLoading(false); }
  }, []);

  // ── Rifiuta preventivo ────────────────────────────────────────────────────
  const rifiutaFirma = useCallback(async (token, workspaceIdTarget, proyectoId, motivo) => {
    try {
      const firmaRef = doc(db, `workspaces/${workspaceIdTarget}/firme/${token}`);
      await updateDoc(firmaRef, {
        stato:         FIRMA_STATI.RIFIUTATO,
        rifiutoMotivo: motivo || "",
        firmaData:     new Date().toISOString(),
      });
      const proyRef = doc(db, `workspaces/${workspaceIdTarget}/proyectos/${proyectoId}`);
      await updateDoc(proyRef, {
        estado:    "Rechazado",
        updatedAt: new Date().toISOString(),
      });
      return true;
    } catch (e) { console.error("rifiutaFirma:", e); return false; }
  }, []);

  // ── Copia link negli appunti ──────────────────────────────────────────────
  const copiaLink = useCallback((url) => {
    navigator.clipboard.writeText(url).then(() => {
      onToast("📋 Link copiato negli appunti!");
    }).catch(() => {
      onToast("Link: " + url);
    });
  }, [onToast]);

  return {
    firme, loading,
    creaLinkFirma, loadFirme,
    loadFirmaPubblica, salvaFirma, rifiutaFirma,
    copiaLink,
  };
}
