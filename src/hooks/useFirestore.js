// ─── hooks/useFirestore.js ────────────────────────────────────────────────────
// Versione aggiornata: legge e scrive da workspaces/{workspaceId}/proyectos
// invece di users/{uid}/proyectos.

import { useCallback, useState } from "react";
import { doc, setDoc, collection, getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { DEFAULT_CATS } from "../utils/constants";
import { mkVacioState } from "./useProyecto";

export function useFirestore({ onToast, workspaceId }) {
  const [proyectos, setProyectos] = useState([]);
  const [listino,   setListino]   = useState([]);
  const [fotosMap,  setFotosMap]  = useState({});
  const [cats,      setCats]      = useState(DEFAULT_CATS);
  const [guardando, setGuardando] = useState(false);

  const uid = () => auth.currentUser?.uid;

  const basePath = useCallback(() => {
    if (workspaceId) return `workspaces/${workspaceId}`;
    const u = uid();
    return u ? `users/${u}` : null;
  }, [workspaceId]);

  const loadProyectos = useCallback(async () => {
    const base = basePath(); if (!base) return [];
    try {
      const snap = await getDocs(collection(db, base, "proyectos"));
      const list = []; const fm = {};
      snap.forEach(d => {
        const dat = d.data();
        list.push({ id: d.id, ...dat });
        fm[d.id] = dat.fotos || [];
      });
      list.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
      setProyectos(list);
      setFotosMap(fm);
      return list;
    } catch (e) { console.error("loadProyectos:", e); return []; }
  }, [basePath]);

  const saveProyecto = useCallback(async (currentId, proyState, manual = false) => {
    const base = basePath(); if (!base) return null;
    setGuardando(true);
    let id = currentId;
    if (!id) {
      const ref = doc(collection(db, base, "proyectos"));
      id = ref.id;
    }
    try {
      const { info, partidas, pct, estado, fotos, validez, iva,
              condPago, condPagoPersonalizado, cuotas, catVis } = proyState;
      await setDoc(doc(db, base, "proyectos", id), {
        info, partidas, pct, estado, fotos, validez, iva,
        condPago, condPagoPersonalizado, cuotas, catVis,
        updatedAt: new Date().toISOString(),
        createdBy: uid() || "",
        ...(manual ? { createdAt: new Date().toISOString() } : {}),
      });
      if (manual) { await loadProyectos(); onToast("💾 Guardado ✔"); }
      return id;
    } catch (e) {
      console.error("saveProyecto:", e);
      if (manual) onToast("⚠️ Error al guardar: " + e.message);
      return null;
    } finally { setGuardando(false); }
  }, [basePath, loadProyectos, onToast]);

  const newProyecto = useCallback(async () => {
    const base = basePath(); if (!base) return null;
    const np = mkVacioState();
    const ref = doc(collection(db, base, "proyectos"));
    await setDoc(ref, { ...np, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), createdBy: uid() || "" });
    await loadProyectos();
    onToast("✅ Nuevo proyecto creado");
    return ref.id;
  }, [basePath, loadProyectos, onToast]);

  const deleteProyecto = useCallback(async (id) => {
    const base = basePath(); if (!base) return false;
    if (!window.confirm("¿Eliminar proyecto?")) return false;
    await deleteDoc(doc(db, base, "proyectos", id));
    await loadProyectos();
    onToast("🗑️ Proyecto eliminado");
    return true;
  }, [basePath, loadProyectos, onToast]);

  const loadListino = useCallback(async () => {
    const base = basePath(); if (!base) return;
    try {
      const snap = await getDocs(collection(db, base, "listino"));
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
      setListino(list);
    } catch (e) { console.error("loadListino:", e); }
  }, [basePath]);

  const saveListinoItem = useCallback(async (form) => {
    const base = basePath();
    if (!base) { onToast("⚠️ No autenticado"); return; }
    try {
      const ref = doc(collection(db, base, "listino"));
      await setDoc(ref, { ...form, updatedAt: new Date().toISOString() });
      await loadListino();
      onToast("✅ Guardado en listino");
    } catch (e) { onToast("⚠️ Error: " + e.message); console.error(e); }
  }, [basePath, loadListino, onToast]);

  const deleteListinoItem = useCallback(async (id) => {
    const base = basePath(); if (!base) return;
    await deleteDoc(doc(db, base, "listino", id));
    await loadListino();
  }, [basePath, loadListino]);

  // ── Aggiorna giacenza e soglia di un articolo del listino ──────────────────
  const updateGiacenza = useCallback(async (id, { giacenza, soglia }) => {
    const base = basePath(); if (!base) return;
    try {
      const updates = {};
      if (giacenza !== undefined) updates.giacenza = giacenza;
      if (soglia   !== undefined) updates.soglia   = soglia;
      await updateDoc(doc(db, base, "listino", id), updates);
      setListino(l => l.map(x => x.id === id ? { ...x, ...updates } : x));
      onToast("✅ Giacenza aggiornata");
    } catch (e) {
      console.error("updateGiacenza:", e);
      onToast("⚠️ Errore: " + e.message);
    }
  }, [basePath, onToast]);

  // FIX 1.6: rinominata da updatePrezzoCompra (dead code MercadoLibre) a updatePrezzoManuale
  // Usare per aggiornamento manuale del prezzo di acquisto da TabListino
  const updatePrezzoManuale = useCallback(async (id, prezzo) => {
    const base = basePath(); if (!base) return;
    try {
      await updateDoc(doc(db, base, "listino", id), { precioCompra: prezzo, updatedAt: new Date().toISOString() });
      setListino(l => l.map(x => x.id === id ? { ...x, precioCompra: prezzo } : x));
      onToast("✅ Prezzo aggiornato");
    } catch (e) {
      onToast("⚠️ Errore: " + e.message);
    }
  }, [basePath, onToast]);

  const loadCats = useCallback(async () => {
    const base = basePath(); if (!base) return;
    try {
      const snap = await getDocs(collection(db, base, "cats"));
      const extra = [];
      snap.forEach(d => extra.push(d.data().nombre));
      const merged = [...DEFAULT_CATS, ...extra.filter(c => !DEFAULT_CATS.includes(c))];
      setCats(merged);
    } catch (e) { console.error("loadCats:", e); }
  }, [basePath]);

  const addCat = useCallback(async (name, t) => {
    const base = basePath();
    if (!name || cats.includes(name)) return;
    try {
      const ref = doc(collection(db, base, "cats"));
      await setDoc(ref, { nombre: name, createdAt: new Date().toISOString() });
      setCats(c => [...c, name]);
      onToast(t?.catGuardada || "✅ Categoría guardada");
    } catch (e) { onToast("⚠️ Error"); console.error(e); }
  }, [basePath, cats, onToast]);

  return {
    proyectos, listino, fotosMap, cats, guardando,
    loadProyectos, saveProyecto, newProyecto, deleteProyecto,
    loadListino, saveListinoItem, deleteListinoItem,
    updateGiacenza, updatePrezzoManuale,
    loadCats, addCat, setCats,
  };
}
