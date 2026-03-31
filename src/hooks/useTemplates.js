// ─── hooks/useTemplates.js ────────────────────────────────────────────────────
// v2 — Templates su Firestore (persistente, condiviso tra dispositivi)
// Migrazione automatica da localStorage v1 al primo caricamento.
//
// Struttura Firestore:
//   workspaces/{wsId}/templates/{templateId}
//     → nombre, categoria, nota
//     → partidas[], pct{}, condPago, condPagoPersonalizado, cuotas[], iva
//     → creadoAt, usadoVeces, updatedAt
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useEffect } from "react";
import {
  collection, doc, getDocs, setDoc, deleteDoc, updateDoc,
  orderBy, query,
} from "firebase/firestore";
import { db } from "../lib/firebase";

export const CATEGORIAS = [
  "Baño", "Cocina", "Habitación", "Fachada", "Techado",
  "Instalaciones", "Pintura", "Demolición", "General",
];

const LS_KEY_V1 = "obra_templates_v1";

// ── Migrazione localStorage → Firestore (una tantum) ─────────────────────────
async function migrateFromLocalStorage(basePath) {
  try {
    const raw = localStorage.getItem(LS_KEY_V1);
    if (!raw) return 0;
    const list = JSON.parse(raw);
    if (!Array.isArray(list) || list.length === 0) return 0;

    const snap = await getDocs(collection(db, basePath, "templates"));
    if (!snap.empty) {
      localStorage.removeItem(LS_KEY_V1);
      return 0;
    }

    let migrated = 0;
    for (const tpl of list) {
      const ref = doc(collection(db, basePath, "templates"));
      await setDoc(ref, {
        nombre:                tpl.nombre               || "Template sin nombre",
        categoria:             tpl.categoria            || "General",
        nota:                  tpl.nota                 || "",
        partidas:              tpl.partidas             || [],
        pct:                   tpl.pct                  || { ci: 0, gf: 0, imprevistos: 0, utilidad: 0 },
        condPago:              tpl.condPago             || "contado",
        condPagoPersonalizado: tpl.condPagoPersonalizado || "",
        cuotas:                tpl.cuotas               || [],
        iva:                   tpl.iva                  ?? false,
        creadoAt:              tpl.creadoAt             || new Date().toISOString().slice(0, 10),
        usadoVeces:            tpl.usadoVeces           || 0,
        updatedAt:             new Date().toISOString(),
        migratedFromLS:        true,
      });
      migrated++;
    }
    localStorage.removeItem(LS_KEY_V1);
    return migrated;
  } catch (e) {
    console.warn("useTemplates: migrazione localStorage fallita:", e.message);
    return 0;
  }
}

// ── Hook principale ───────────────────────────────────────────────────────────
export function useTemplates({ workspaceId, onToast } = {}) {
  const [templates, setTemplates] = useState([]);
  const [loading,   setLoading]   = useState(false);

  const basePath = workspaceId ? `workspaces/${workspaceId}` : null;

  const loadTemplates = useCallback(async () => {
    if (!basePath) return;
    setLoading(true);
    try {
      await migrateFromLocalStorage(basePath);
      const q    = query(collection(db, basePath, "templates"), orderBy("creadoAt", "desc"));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setTemplates(list);
      return list;
    } catch (e) {
      console.error("loadTemplates:", e);
      return [];
    } finally {
      setLoading(false);
    }
  }, [basePath]);

  useEffect(() => {
    if (workspaceId) loadTemplates();
  }, [workspaceId]); // eslint-disable-line

  const saveTemplate = useCallback(async ({
    nombre, categoria, partidas, pct,
    condPago, condPagoPersonalizado, cuotas, iva, nota,
  }) => {
    if (!basePath) { onToast?.("⚠️ No hay workspace activo"); return null; }
    try {
      const ref = doc(collection(db, basePath, "templates"));
      const tpl = {
        nombre:                nombre?.trim()           || "Template sin nombre",
        categoria:             categoria                || "General",
        nota:                  nota                    || "",
        partidas:              (partidas || []).map(p => ({
          nombre:    p.nombre    || "",
          cat:       p.cat       || "",
          unidad:    p.unidad    || "gl",
          cant:      p.cant      || 0,
          pu:        p.pu        || 0,
          proveedor: p.proveedor || "",
          nota:      p.nota      || "",
        })),
        pct:                   pct                     || { ci: 10, gf: 5, imprevistos: 5, utilidad: 10 },
        condPago:              condPago                || "contado",
        condPagoPersonalizado: condPagoPersonalizado   || "",
        cuotas:                (cuotas || []).map(c => ({ ...c, mpLink: "", preferenceId: "" })),
        iva:                   iva                     ?? false,
        creadoAt:              new Date().toISOString().slice(0, 10),
        usadoVeces:            0,
        updatedAt:             new Date().toISOString(),
      };
      await setDoc(ref, tpl);
      const saved = { id: ref.id, ...tpl };
      setTemplates(prev => [saved, ...prev]);
      onToast?.("✅ Template guardado");
      return saved;
    } catch (e) {
      console.error("saveTemplate:", e);
      onToast?.("⚠️ Error al guardar template: " + e.message);
      return null;
    }
  }, [basePath, onToast]);

  const deleteTemplate = useCallback(async (id) => {
    if (!basePath) return;
    try {
      await deleteDoc(doc(db, basePath, "templates", id));
      setTemplates(prev => prev.filter(t => t.id !== id));
      onToast?.("🗑️ Template eliminado");
    } catch (e) {
      console.error("deleteTemplate:", e);
      onToast?.("⚠️ Error al eliminar: " + e.message);
    }
  }, [basePath, onToast]);

  const markUsed = useCallback(async (id) => {
    if (!basePath) return;
    try {
      const tpl = templates.find(t => t.id === id);
      const newCount = (tpl?.usadoVeces || 0) + 1;
      await updateDoc(doc(db, basePath, "templates", id), {
        usadoVeces: newCount,
        updatedAt:  new Date().toISOString(),
      });
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, usadoVeces: newCount } : t));
    } catch (e) {
      console.warn("markUsed:", e.message);
    }
  }, [basePath, templates]);

  const updateTemplate = useCallback(async (id, changes) => {
    if (!basePath) return;
    try {
      await updateDoc(doc(db, basePath, "templates", id), {
        ...changes,
        updatedAt: new Date().toISOString(),
      });
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...changes } : t));
    } catch (e) {
      console.error("updateTemplate:", e);
    }
  }, [basePath]);

  // compatibilità con TabCostos che chiama getAll()
  const getAll = useCallback(() => templates, [templates]);

  return {
    templates,
    loading,
    loadTemplates,
    getAll,
    saveTemplate,
    deleteTemplate,
    markUsed,
    updateTemplate,
    CATEGORIAS,
  };
}
