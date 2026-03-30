// ─── hooks/useComentarios.js ──────────────────────────────────────────────────
// Comentarios en tiempo real por proyecto.
// Subcollection: workspaces/{wsId}/proyectos/{proyId}/comentarios
//
// USO:
//   const { comentarios, loading, enviar, eliminar } = useComentarios({
//     workspaceId, proyectoId, autorNombre, autorEmail, autorUid,
//   });
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import {
  collection, query, orderBy, onSnapshot,
  addDoc, deleteDoc, doc,
} from "firebase/firestore";
import { db } from "../lib/firebase";

export function useComentarios({ workspaceId, proyectoId, autorNombre, autorEmail, autorUid }) {
  const [comentarios, setComentarios] = useState([]);
  const [loading,     setLoading]     = useState(true);

  const basePath = workspaceId && proyectoId
    ? `workspaces/${workspaceId}/proyectos/${proyectoId}/comentarios`
    : null;

  // ── Listener realtime ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!basePath) { setLoading(false); return; }

    const q = query(collection(db, basePath), orderBy("createdAt", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      setComentarios(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.warn("useComentarios:", err.message);
      setComentarios([]);
      setLoading(false);
    });

    return () => unsub();
  }, [basePath]);

  // ── Enviar comentario ──────────────────────────────────────────────────────
  const enviar = useCallback(async (texto, tipo = "interno") => {
    if (!basePath || !texto?.trim()) return;
    await addDoc(collection(db, basePath), {
      texto:       texto.trim(),
      autorNombre: autorNombre || "Usuario",
      autorEmail:  autorEmail  || "",
      autorUid:    autorUid    || "anonimo",
      tipo,                          // "interno" | "cliente"
      createdAt:   new Date().toISOString(),
    });
  }, [basePath, autorNombre, autorEmail, autorUid]);

  // ── Eliminar comentario (solo owner/admin) ─────────────────────────────────
  const eliminar = useCallback(async (comentarioId) => {
    if (!basePath) return;
    await deleteDoc(doc(db, basePath, comentarioId));
  }, [basePath]);

  return { comentarios, loading, enviar, eliminar };
}
