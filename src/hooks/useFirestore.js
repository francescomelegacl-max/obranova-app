// ─── hooks/useFirestore.js ────────────────────────────────────────────────────
// Versione aggiornata: legge e scrive da workspaces/{workspaceId}/proyectos
// invece di users/{uid}/proyectos.

import { useCallback, useState } from "react";
import { doc, setDoc, collection, getDocs, deleteDoc, updateDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { DEFAULT_CATS } from "../utils/constants";
import { mkVacioState } from "./useProyecto";

// ── Nova Profile: aggiorna profilo costruttore in background ────────────────
// Analizza tutti i presupuestos del workspace e calcola:
// - margine medio, categorie piu' usate, prezzi tipici per categoria
// - numero progetti per stato, stili render preferiti
// Non bloccante — errori silenziosi, non rallenta il salvataggio
async function updateNovaProfile(basePath, proyectos) {
  if (!basePath || !proyectos?.length) return;
  try {
    const withPartidas = proyectos.filter(p => p.partidas?.length > 0);
    if (withPartidas.length < 2) return;

    const allPartidas = withPartidas.flatMap(p => p.partidas || []);
    const cats = {};
    const preciosPorCat = {};
    let totalUtilidad = 0, countUtilidad = 0;

    for (const p of withPartidas) {
      const pct = p.pct || {};
      const util = parseFloat(pct.utilidad ?? 0);
      if (util > 0) { totalUtilidad += util; countUtilidad++; }
    }

    for (const part of allPartidas) {
      const cat = part.cat || "Otros";
      const pu = parseFloat(part.pu ?? 0);
      if (!cats[cat]) cats[cat] = 0;
      cats[cat]++;
      if (pu > 0) {
        if (!preciosPorCat[cat]) preciosPorCat[cat] = [];
        preciosPorCat[cat].push(pu);
      }
    }

    const topCats = Object.entries(cats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, count]) => cat);

    const preciosMedios = {};
    for (const cat of topCats) {
      const precios = preciosPorCat[cat] || [];
      if (precios.length > 0) {
        preciosMedios[cat] = Math.round(precios.reduce((s, p) => s + p, 0) / precios.length);
      }
    }

    const estados = {};
    for (const p of proyectos) {
      const e = p.estado || "Borrador";
      estados[e] = (estados[e] || 0) + 1;
    }

    const aceptados = estados["Aceptado"] || 0;
    const enviados = (estados["Enviado"] || 0) + aceptados + (estados["Rechazado"] || 0);
    const tasaCierre = enviados > 0 ? Math.round((aceptados / enviados) * 100) : 0;

    // ── Livello 2: Learning dalle azioni ──────────────────────────────────
    // Tipo lavoro più frequente (dedotto dalla descrizione)
    const tipoLavoro = {};
    const keywords = {
      "baño": "Remodelación baño", "cocina": "Remodelación cocina",
      "ampliación": "Ampliación", "remodelación": "Remodelación general",
      "pintura": "Pintura", "terraza": "Terraza/Exterior",
      "piso": "Pisos", "techo": "Techumbre", "eléctric": "Electricidad",
      "departamento": "Departamento completo", "casa": "Casa completa",
      "oficina": "Oficina", "local": "Local comercial",
    };
    for (const p of proyectos) {
      const desc = (p.info?.descripcion || "").toLowerCase();
      for (const [kw, tipo] of Object.entries(keywords)) {
        if (desc.includes(kw)) { tipoLavoro[tipo] = (tipoLavoro[tipo] || 0) + 1; break; }
      }
    }
    const tipoFrecuente = Object.entries(tipoLavoro).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t);

    // Presupuesto medio (totale neto)
    const totales = withPartidas.map(p => {
      const sub = (p.partidas || []).reduce((s, pt) => s + (parseFloat(pt.pu || 0) * parseFloat(pt.cant || 1)), 0);
      const pct = p.pct || {};
      return sub * (1 + (parseFloat(pct.ci || 0) + parseFloat(pct.gf || 0) + parseFloat(pct.imprevistos || 0) + parseFloat(pct.utilidad || 0)) / 100);
    }).filter(t => t > 0);
    const presupuestoMedio = totales.length > 0 ? Math.round(totales.reduce((s, t) => s + t, 0) / totales.length) : 0;

    // Tempo medio creazione → invio (giorni)
    const tempiInvio = proyectos.filter(p => p.createdAt && p.updatedAt && ["Enviado","Aceptado","Rechazado"].includes(p.estado))
      .map(p => Math.ceil((new Date(p.updatedAt) - new Date(p.createdAt)) / 86400000))
      .filter(d => d >= 0 && d < 365);
    const tiempoMedioInvio = tempiInvio.length > 0 ? Math.round(tempiInvio.reduce((s, d) => s + d, 0) / tempiInvio.length) : null;

    // Ha usato render?
    const conRender = proyectos.filter(p => p.lastRenderUrl).length;

    // Condición de pago preferita
    const condPagos = {};
    for (const p of proyectos) {
      if (p.condPago) condPagos[p.condPago] = (condPagos[p.condPago] || 0) + 1;
    }
    const condPagoFrecuente = Object.entries(condPagos).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    const profile = {
      // Livello 1: stats base
      totalProyectos:       proyectos.length,
      proyectosConPartidas: withPartidas.length,
      margenMedio:          countUtilidad > 0 ? Math.round(totalUtilidad / countUtilidad * 10) / 10 : 0,
      categoriasFrecuentes: topCats,
      preciosMedios,
      estados,
      tasaCierre,
      totalPartidas:        allPartidas.length,
      // Livello 2: learning
      tipoFrecuente,
      presupuestoMedio,
      tiempoMedioInvio,
      conRender,
      condPagoFrecuente,
      // Meta
      updatedAt:            new Date().toISOString(),
    };

    await setDoc(doc(db, basePath, "novaProfile", "current"), profile, { merge: true });
  } catch (e) {
    console.warn("Nova profile update:", e.message);
  }
}

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
              condPago, condPagoPersonalizado, cuotas, catVis, transferencia,
              descuento, portalConfig } = proyState;
      await setDoc(doc(db, base, "proyectos", id), {
        info, partidas, pct, estado, fotos, validez, iva,
        condPago, condPagoPersonalizado, cuotas, catVis, transferencia,
        descuento: descuento || { tipo: "pct", valor: 0, descripcion: "" },
        portalConfig: portalConfig || {},
        updatedAt: new Date().toISOString(),
        createdBy: uid() || "",
        ...(manual ? { createdAt: new Date().toISOString() } : {}),
      });
      if (manual) { await loadProyectos(); onToast("💾 Guardado ✔"); }
      // ── Nova Profile: aggiorna in background (non bloccante) ──────────
      if (manual && partidas?.length >= 3) {
        const base = basePath();
        loadProyectos().then(list => {
          if (list?.length) updateNovaProfile(base, list);
        }).catch(() => {});
      }
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

  const duplicaProyecto = useCallback(async (original) => {
    const base = basePath(); if (!base) return null;
    try {
      const ref = doc(collection(db, base, "proyectos"));
      const now = new Date().toISOString();
      const copia = {
        info:                  { ...original.info, cliente: `Copia de ${original.info?.cliente || "proyecto"}` },
        partidas:              (original.partidas || []).map(p => ({ ...p, id: Date.now() + Math.random() })),
        pct:                   original.pct                  || mkVacioState().pct,
        estado:                "Borrador",
        fotos:                 [],
        validez:               original.validez              ?? 30,
        iva:                   original.iva                  !== undefined ? original.iva : true,
        condPago:              original.condPago             || "cuotas",
        cuotas:                (original.cuotas || []).map(c => ({ ...c, mpLink: "" })), // reset link MP nelle copie
        condPagoPersonalizado: original.condPagoPersonalizado || "",
        transferencia:         original.transferencia         || { banco: "", cuenta: "", rutTitular: "", nota: "" },
        catVis:                original.catVis               || {},
        createdAt:             now,
        updatedAt:             now,
        createdBy:             uid() || "",
      };
      await setDoc(ref, copia);
      await loadProyectos();
      onToast("📋 Proyecto duplicado");
      return { id: ref.id, ...copia };
    } catch (e) {
      console.error("duplicaProyecto:", e);
      onToast("⚠️ Error al duplicar: " + e.message);
      return null;
    }
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

  // ── Firme — carica le firme di un progetto specifico ────────────────────
  const loadFirme = useCallback(async (proyectoId) => {
    const base = basePath(); if (!base || !proyectoId) return [];
    try {
      const snap = await getDocs(collection(db, base, "firme"));
      const list = [];
      snap.forEach(d => {
        const data = d.data();
        if (data.proyectoId === proyectoId) list.push({ id: d.id, ...data });
      });
      list.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      return list;
    } catch (e) { console.warn("loadFirme:", e.message); return []; }
  }, [basePath]);

  // ── Clientes CRM ─────────────────────────────────────────────────────────
  const [clientes, setClientes] = useState([]);
  const loadClientes = useCallback(async () => {
    const base = basePath(); if (!base) return [];
    try {
      const snap = await getDocs(collection(db, base, "clientes"));
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
      setClientes(list);
      return list;
    } catch (e) { console.warn("loadClientes:", e.message); return []; }
  }, [basePath]);

  // ── Proyectos creados desde el wizard público ─────────────────────────────
  // Filtra los proyectos que llegaron del PresupuestoWizard (sin precios aún)
  const wizardProyectos = proyectos.filter(p => p.fromWizard && p.partidas?.length === 0);

  // ── Nova Profile: carica il profilo costruttore per Nova AI ─────────────
  const [novaProfile, setNovaProfile] = useState(null);
  const loadNovaProfile = useCallback(async () => {
    const base = basePath(); if (!base) return null;
    try {
      const snap = await getDoc(doc(db, base, "novaProfile", "current"));
      if (snap.exists()) {
        setNovaProfile(snap.data());
        return snap.data();
      }
    } catch (e) { console.warn("loadNovaProfile:", e.message); }
    return null;
  }, [basePath]);

  return {
    proyectos, listino, fotosMap, cats, guardando,
    wizardProyectos,
    novaProfile, loadNovaProfile,
    loadProyectos, saveProyecto, newProyecto, deleteProyecto, duplicaProyecto,
    loadListino, saveListinoItem, deleteListinoItem,
    updateGiacenza, updatePrezzoManuale,
    loadCats, addCat, setCats,
    loadFirme,
    clientes, loadClientes,
  };
}
