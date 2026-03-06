// ─── hooks/useKits.js ────────────────────────────────────────────────────────
// Gestisce i kit/combo di materiali: Firebase primario + localStorage fallback
// Collezione: workspaces/{workspaceId}/kits

import { useCallback, useState } from "react";
import {
  doc, setDoc, collection, getDocs, deleteDoc, updateDoc
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const LS_KEY = "obranova_kits";

// ── Kit predefiniti di fabbrica ───────────────────────────────────────────────
export const KIT_PREDEFINITI = [
  {
    id: "kit_piso_ceramico",
    nombre: "Piso cerámico estándar",
    emoji: "🟫",
    categoria: "Pisos",
    descripcion: "Kit completo para instalación de piso cerámico",
    materiales: [
      { nombre: "Cerámica 45x45", unidad: "m²", cantidad: 1, nota: "Incluye 10% de desperdicio" },
      { nombre: "Porcelana / adhesivo", unidad: "kg", cantidad: 5, nota: "5kg por m²" },
      { nombre: "Fragüe / lechada", unidad: "kg", cantidad: 0.5, nota: "0.5kg por m²" },
      { nombre: "Crucetas 3mm", unidad: "pcs", cantidad: 20, nota: "Para juntas uniformes" },
      { nombre: "Perfil de remate", unidad: "ml", cantidad: 0.1, nota: "Perímetro de la zona" },
    ]
  },
  {
    id: "kit_muro_tabique",
    nombre: "Tabique interior",
    emoji: "🧱",
    categoria: "Muros",
    descripcion: "Kit para construcción de tabique de ladrillo fiscal",
    materiales: [
      { nombre: "Ladrillo fiscal", unidad: "pcs", cantidad: 55, nota: "55 ladrillos por m²" },
      { nombre: "Mortero cemento", unidad: "kg", cantidad: 12, nota: "12kg por m²" },
      { nombre: "Arena fina", unidad: "kg", cantidad: 30, nota: "30kg por m²" },
      { nombre: "Agua", unidad: "L", cantidad: 8, nota: "Aprox 8L por m²" },
    ]
  },
  {
    id: "kit_pintura_interior",
    nombre: "Pintura interior",
    emoji: "🎨",
    categoria: "Terminaciones",
    descripcion: "Kit pintura interior 2 manos completo",
    materiales: [
      { nombre: "Sellador / fijador", unidad: "L", cantidad: 0.15, nota: "1 mano, 6-7m²/L" },
      { nombre: "Pintura latex interior", unidad: "L", cantidad: 0.3, nota: "2 manos, 6m²/L cada mano" },
      { nombre: "Lija grano 120", unidad: "pcs", cantidad: 0.5, nota: "1 lija por 2m²" },
      { nombre: "Cinta de enmascarar", unidad: "ml", cantidad: 0.2, nota: "Perímetro + marcos" },
      { nombre: "Felpa rodillo", unidad: "pcs", cantidad: 0.05, nota: "1 felpa por 20m²" },
    ]
  },
  {
    id: "kit_mueble_madera",
    nombre: "Mueble de madera simple",
    emoji: "🪵",
    categoria: "Carpintería",
    descripcion: "Kit para un mueble/cajonera básica en MDF",
    materiales: [
      { nombre: "MDF 18mm", unidad: "m²", cantidad: 3, nota: "Lados, tapa, base, divisiones" },
      { nombre: "Tornillos 4x40", unidad: "pcs", cantidad: 40, nota: "Para ensamble" },
      { nombre: "Pernos con tuerca", unidad: "pcs", cantidad: 8, nota: "Uniones estructurales" },
      { nombre: "Bisagras cazoleta 35mm", unidad: "pcs", cantidad: 4, nota: "2 por puerta" },
      { nombre: "Manillas", unidad: "pcs", cantidad: 2, nota: "Una por puerta/cajón" },
      { nombre: "Canto PVC melamínico", unidad: "ml", cantidad: 6, nota: "Bordes visibles" },
      { nombre: "Cola PVA / Pega madera", unidad: "ml", cantidad: 100, nota: "Para ensamble" },
    ]
  },
  {
    id: "kit_hormigon_losa",
    nombre: "Losa de hormigón",
    emoji: "🏗️",
    categoria: "Estructura",
    descripcion: "Kit hormigón H-20 para losa tipo (por m²)",
    materiales: [
      { nombre: "Cemento", unidad: "kg", cantidad: 40, nota: "Por m² de losa 10cm" },
      { nombre: "Arena gruesa", unidad: "kg", cantidad: 80, nota: "Relación 1:2 cemento:arena" },
      { nombre: "Grava / ripio", unidad: "kg", cantidad: 100, nota: "Relación 1:2.5" },
      { nombre: "Fierro 10mm", unidad: "kg", cantidad: 8, nota: "Malla cada 20cm" },
      { nombre: "Fierro 8mm", unidad: "kg", cantidad: 4, nota: "Estribos y refuerzos" },
      { nombre: "Alambre recocido", unidad: "kg", cantidad: 0.3, nota: "Para amarre de fierro" },
      { nombre: "Agua", unidad: "L", cantidad: 20, nota: "Relación a/c ≈ 0.5" },
    ]
  },
  {
    id: "kit_bano_completo",
    nombre: "Baño completo",
    emoji: "🚿",
    categoria: "Instalaciones",
    descripcion: "Kit instalación sanitaria baño nuevo",
    materiales: [
      { nombre: "Inodoro", unidad: "pcs", cantidad: 1, nota: "Con cisterna y accesorios" },
      { nombre: "Lavamanos", unidad: "pcs", cantidad: 1, nota: "Con grifería" },
      { nombre: "Ducha / tina", unidad: "pcs", cantidad: 1, nota: "Con mezcladora" },
      { nombre: "Tubo PVC 110mm", unidad: "ml", cantidad: 4, nota: "Evacuación inodoro" },
      { nombre: "Tubo PVC 50mm", unidad: "ml", cantidad: 6, nota: "Evacuación lavamanos/ducha" },
      { nombre: "Tubo cobre 15mm", unidad: "ml", cantidad: 8, nota: "Agua fría y caliente" },
      { nombre: "Codos y uniones PVC", unidad: "pcs", cantidad: 10, nota: "Varios diámetros" },
      { nombre: "Llaves de paso", unidad: "pcs", cantidad: 3, nota: "Una por artefacto" },
    ]
  },
];

// ── Helper localStorage ───────────────────────────────────────────────────────
const lsGet = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
  catch { return []; }
};
const lsSet = (data) => {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); }
  catch {}
};

// ── Hook principal ────────────────────────────────────────────────────────────
export function useKits({ onToast, workspaceId }) {
  const [kits, setKits] = useState([]);
  const [cargando, setCargando] = useState(false);

  const uid = () => auth.currentUser?.uid;

  const basePath = useCallback(() => {
    if (workspaceId) return `workspaces/${workspaceId}`;
    const u = uid();
    return u ? `users/${u}` : null;
  }, [workspaceId]);

  // ── Carga: Firebase primero, localStorage como fallback ───────────────────
  const loadKits = useCallback(async () => {
    setCargando(true);
    try {
      const base = basePath();
      if (base) {
        const snap = await getDocs(collection(db, base, "kits"));
        const lista = [];
        snap.forEach(d => lista.push({ id: d.id, ...d.data() }));
        lista.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
        setKits(lista);
        lsSet(lista); // sync a localStorage
        return lista;
      }
    } catch (e) {
      console.warn("Firebase no disponible, usando localStorage:", e);
    }
    // fallback localStorage
    const local = lsGet();
    setKits(local);
    return local;
  }, [basePath]);

  // ── Guardar kit nuevo o actualizar existente ──────────────────────────────
  const saveKit = useCallback(async (kitData) => {
    const base = basePath();
    const ahora = new Date().toISOString();

    // Si tiene id, actualizar; sino crear
    const esNuevo = !kitData.id;
    const kitConMeta = {
      ...kitData,
      updatedAt: ahora,
      creadoPor: uid() || "local",
      ...(esNuevo ? { creadoAt: ahora } : {}),
    };

    try {
      if (base) {
        if (esNuevo) {
          const ref = doc(collection(db, base, "kits"));
          kitConMeta.id = ref.id;
          await setDoc(ref, kitConMeta);
        } else {
          await updateDoc(doc(db, base, "kits", kitData.id), kitConMeta);
        }
      }
    } catch (e) {
      console.warn("Firebase error, guardando solo en localStorage:", e);
    }

    // Siempre actualizar estado + localStorage
    setKits(prev => {
      const sinEste = prev.filter(k => k.id !== kitConMeta.id);
      const nuevo = [...sinEste, kitConMeta].sort((a, b) =>
        (a.nombre || "").localeCompare(b.nombre || "")
      );
      lsSet(nuevo);
      return nuevo;
    });

    onToast(esNuevo ? "✅ Kit guardado" : "✅ Kit actualizado");
    return kitConMeta;
  }, [basePath, onToast]);

  // ── Eliminar kit ──────────────────────────────────────────────────────────
  const deleteKit = useCallback(async (id) => {
    if (!window.confirm("¿Eliminar este kit?")) return false;
    const base = basePath();
    try {
      if (base) await deleteDoc(doc(db, base, "kits", id));
    } catch (e) {
      console.warn("Firebase error al eliminar:", e);
    }
    setKits(prev => {
      const nuevo = prev.filter(k => k.id !== id);
      lsSet(nuevo);
      return nuevo;
    });
    onToast("🗑️ Kit eliminado");
    return true;
  }, [basePath, onToast]);

  // ── Importar kit predefinito ──────────────────────────────────────────────
  const importarKitPredefinito = useCallback(async (kitPred) => {
    const copia = {
      ...kitPred,
      id: undefined, // fuerza creación nueva
      nombre: kitPred.nombre,
      esPersonalizado: true,
      importadoDe: kitPred.id,
    };
    return await saveKit(copia);
  }, [saveKit]);

  return {
    kits,
    cargando,
    loadKits,
    saveKit,
    deleteKit,
    importarKitPredefinito,
    KIT_PREDEFINITI,
  };
}
