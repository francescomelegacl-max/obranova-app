// ─── hooks/useSolicitudes.js ──────────────────────────────────────────────────
// Hook Firestore per le solicitudes de material (capocantiere → titolare)
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, doc, serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";

export function useSolicitudes({ workspaceId } = {}) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    if (!workspaceId) { setLoading(false); return; }
    const q = query(
      collection(db, "workspaces", workspaceId, "solicitudes"),
      orderBy("creadoAt", "desc")
    );
    const unsub = onSnapshot(q, snap => {
      setSolicitudes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [workspaceId]);

  const crearSolicitud = useCallback(async ({ proyectoId, proyectoNombre, items, nota, creadoPor }) => {
    if (!workspaceId) throw new Error("workspaceId requerido");
    await addDoc(collection(db, "workspaces", workspaceId, "solicitudes"), {
      proyectoId:      proyectoId || "",
      proyectoNombre:  proyectoNombre || "",
      items,          // [{ nombre, cantidad, unidad, itemId? }]
      nota:           nota || "",
      estado:         "pendiente",
      creadoPor:      creadoPor || "",
      creadoAt:       serverTimestamp(),
      aprobadoPor:    null,
      aprobadoAt:     null,
    });
  }, [workspaceId]);

  const aprobarSolicitud = useCallback(async (solicitudId, aprobadoPor) => {
    if (!workspaceId) return;
    await updateDoc(doc(db, "workspaces", workspaceId, "solicitudes", solicitudId), {
      estado:      "aprobada",
      aprobadoPor: aprobadoPor || "",
      aprobadoAt:  serverTimestamp(),
    });
  }, [workspaceId]);

  const rechazarSolicitud = useCallback(async (solicitudId, motivo, aprobadoPor) => {
    if (!workspaceId) return;
    await updateDoc(doc(db, "workspaces", workspaceId, "solicitudes", solicitudId), {
      estado:      "rechazada",
      motivoRechazo: motivo || "",
      aprobadoPor: aprobadoPor || "",
      aprobadoAt:  serverTimestamp(),
    });
  }, [workspaceId]);

  const pendientes = solicitudes.filter(s => s.estado === "pendiente").length;

  return {
    solicitudes, loading, pendientes,
    crearSolicitud, aprobarSolicitud, rechazarSolicitud,
  };
}
