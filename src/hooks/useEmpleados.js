// ─── hooks/useEmpleados.js ────────────────────────────────────────────────────
// Gestión de personal — subcollection workspaces/{id}/empleados
// v1 — Marzo 2026

import { useState, useCallback } from "react";
import { doc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { db, auth } from "../lib/firebase";

export const TIPOS_CONTRATO = [
  { value: "indefinido",   label: "Indefinido" },
  { value: "plazo_fijo",   label: "Plazo fijo" },
  { value: "por_obra",     label: "Por obra" },
  { value: "subcontrato",  label: "Subcontrato" },
];

export const ESTADOS_EMPLEADO = [
  { value: "Activo",    label: "Activo",    color: "#276749", bg: "#f0fff4" },
  { value: "Inactivo",  label: "Inactivo",  color: "#718096", bg: "#f7fafc" },
  { value: "Licencia",  label: "Licencia",  color: "#b7791f", bg: "#fffff0" },
];

export const CARGOS_SUGERIDOS = [
  "Maestro mayor", "Albañil", "Gasfiter", "Electricista",
  "Pintor", "Yesero", "Carpintero", "Ayudante", "Capataz",
  "Bodeguero", "Chofer", "Administrativo",
];

// UF 4.75 tope gratificación legal Chile (Art. 50 Código del Trabajo)
const UF_TOPE_GRATIFICACION = 4.75;
const UF_VALOR = 38000; // valor aproximado — se puede hacer dinámico en el futuro

export function calcularSueldoLiquido(sueldoBruto, tipoContrato) {
  if (!sueldoBruto || sueldoBruto <= 0) return null;
  if (tipoContrato === "subcontrato") return null; // no aplica

  const bruto = parseFloat(sueldoBruto);

  // Gratificación legal: 25% del bruto mensual, tope UF 4.75/12 mensual
  const topeMensual = (UF_TOPE_GRATIFICACION * UF_VALOR) / 12;
  const gratificacion = Math.min(bruto * 0.25, topeMensual);

  // Descuentos previsionales (estimados — AFP ~10%, Salud ~7%)
  const baseDescuentos = bruto + gratificacion;
  const afp  = baseDescuentos * 0.1;
  const salud = baseDescuentos * 0.07;

  const liquido = Math.round(bruto + gratificacion - afp - salud);
  return { bruto, gratificacion: Math.round(gratificacion), afp: Math.round(afp), salud: Math.round(salud), liquido };
}

export function diasHastaVencimiento(fechaVencimiento) {
  if (!fechaVencimiento) return null;
  const hoy  = new Date(); hoy.setHours(0,0,0,0);
  const venc = new Date(fechaVencimiento); venc.setHours(0,0,0,0);
  return Math.ceil((venc - hoy) / 86400000);
}

export function useEmpleados({ workspaceId, onToast }) {
  const [empleados, setEmpleados] = useState([]);
  const [loading,   setLoading]   = useState(false);

  const uid  = () => auth.currentUser?.uid;
  const base = useCallback(() => workspaceId ? `workspaces/${workspaceId}` : null, [workspaceId]);

  // ── Carica empleados ───────────────────────────────────────────────────────
  const loadEmpleados = useCallback(async () => {
    const b = base(); if (!b) return;
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, b, "empleados"));
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      list.sort((a, z) => (a.nombre || "").localeCompare(z.nombre || ""));
      setEmpleados(list);
    } catch (e) { console.error("loadEmpleados:", e); }
    setLoading(false);
  }, [workspaceId, base]);

  // ── Salva empleado (nuovo o modifica) ─────────────────────────────────────
  const saveEmpleado = useCallback(async (form, existingId = null) => {
    const b = base();
    if (!b) { onToast("❌ Workspace no encontrado"); return null; }
    try {
      const ref = existingId
        ? doc(db, b, "empleados", existingId)
        : doc(collection(db, b, "empleados"));

      await setDoc(ref, {
        nombre:           form.nombre?.trim()       || "",
        rut:              form.rut?.trim()           || "",
        telefono:         form.telefono?.trim()      || "",
        cargo:            form.cargo?.trim()         || "",
        fechaInicio:      form.fechaInicio           || "",
        tipoContrato:     form.tipoContrato          || "indefinido",
        fechaVencimiento: form.fechaVencimiento      || "",   // solo para plazo_fijo / por_obra
        estado:           form.estado                || "Activo",
        sueldoBruto:      parseFloat(form.sueldoBruto) || 0,
        nota:             form.nota?.trim()          || "",
        updatedAt:        new Date().toISOString(),
        createdBy:        uid() || "",
      }, { merge: true });

      await loadEmpleados();
      onToast(existingId ? "✅ Empleado actualizado" : "✅ Empleado agregado");
      return ref.id;
    } catch (e) {
      onToast("❌ Error: " + e.message);
      console.error(e);
      return null;
    }
  }, [workspaceId, loadEmpleados, onToast, base]);

  // ── Elimina empleado ───────────────────────────────────────────────────────
  const deleteEmpleado = useCallback(async (id) => {
    const b = base(); if (!b) return;
    if (!window.confirm("¿Eliminar este empleado? Esta acción no se puede deshacer.")) return;
    await deleteDoc(doc(db, b, "empleados", id));
    await loadEmpleados();
    onToast("🗑️ Empleado eliminado");
  }, [workspaceId, loadEmpleados, onToast, base]);

  // ── Empleados con contratos próximos a vencer (≤30 días) ──────────────────
  const alertasVencimiento = empleados.filter(e => {
    if (!e.fechaVencimiento) return false;
    if (e.estado === "Inactivo") return false;
    const dias = diasHastaVencimiento(e.fechaVencimiento);
    return dias !== null && dias <= 30;
  }).sort((a, b) => {
    return new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento);
  });

  return {
    empleados, loading, alertasVencimiento,
    loadEmpleados, saveEmpleado, deleteEmpleado,
  };
}
