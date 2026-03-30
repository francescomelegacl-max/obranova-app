// ─── hooks/useTasks.js ────────────────────────────────────────────────────────
// Gestione task per piano Empresa.
// Subcollection: workspaces/{wsId}/proyectos/{proyId}/tasks/{taskId}
//
// USO:
//   const { tasks, loading, saveTask, deleteTask, updateTaskEstado } =
//     useTasks({ workspaceId, proyectoId });
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, setDoc,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";

export const TASK_ESTADOS = ["todo", "en_curso", "listo"];
export const TASK_PRIORIDADES = ["alta", "media", "baja"];

export const TASK_ESTADO_CONFIG = {
  todo:     { label: "Por hacer",  color: "#718096", bg: "#f7fafc", icon: "○" },
  en_curso: { label: "En curso",   color: "#b7791f", bg: "#fffbeb", icon: "◑" },
  listo:    { label: "Listo",      color: "#276749", bg: "#f0fff4", icon: "●" },
};

export const TASK_PRIORIDAD_CONFIG = {
  alta:  { label: "Alta",  color: "#c53030", icon: "🔴" },
  media: { label: "Media", color: "#b7791f", icon: "🟡" },
  baja:  { label: "Baja",  color: "#276749", icon: "🟢" },
};

export function useTasks({ workspaceId, proyectoId } = {}) {
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);

  const basePath = workspaceId && proyectoId
    ? `workspaces/${workspaceId}/proyectos/${proyectoId}/tasks`
    : null;

  // ── Listener realtime ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!basePath) { setLoading(false); return; }

    const q = query(collection(db, basePath), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, snap => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, err => {
      console.warn("useTasks:", err.message);
      setTasks([]);
      setLoading(false);
    });

    return () => unsub();
  }, [basePath]);

  // ── Salva task (crea o aggiorna) ───────────────────────────────────────────
  const saveTask = useCallback(async (taskData) => {
    if (!basePath) return null;
    const now = new Date().toISOString();
    const uid = auth.currentUser?.uid || "";
    const email = auth.currentUser?.email || "";

    if (taskData.id) {
      // Aggiorna
      const { id, ...data } = taskData;
      await updateDoc(doc(db, basePath, id), { ...data, updatedAt: now });
      return id;
    } else {
      // Crea
      const ref = await addDoc(collection(db, basePath), {
        titulo:           taskData.titulo     || "",
        descripcion:      taskData.descripcion || "",
        estado:           taskData.estado      || "todo",
        prioridad:        taskData.prioridad   || "media",
        asignadoA:        taskData.asignadoA   || "",
        asignadoNombre:   taskData.asignadoNombre || "",
        categoria:        taskData.categoria   || "",
        fechaInicio:      taskData.fechaInicio || "",
        fechaFin:         taskData.fechaFin    || "",
        creadoPor:        uid,
        creadoPorEmail:   email,
        createdAt:        now,
        updatedAt:        now,
      });
      return ref.id;
    }
  }, [basePath]);

  // ── Aggiorna solo lo stato (drag & drop Kanban) ────────────────────────────
  const updateTaskEstado = useCallback(async (taskId, newEstado) => {
    if (!basePath) return;
    await updateDoc(doc(db, basePath, taskId), {
      estado: newEstado,
      updatedAt: new Date().toISOString(),
    });
  }, [basePath]);

  // ── Elimina task ───────────────────────────────────────────────────────────
  const deleteTask = useCallback(async (taskId) => {
    if (!basePath) return;
    await deleteDoc(doc(db, basePath, taskId));
  }, [basePath]);

  return { tasks, loading, saveTask, updateTaskEstado, deleteTask };
}
