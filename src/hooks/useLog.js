// ─── src/hooks/useLog.js ──────────────────────────────────────────────────────
// Sprint 4 — #9 Log attività workspace
//
// Legge la sub-collezione /workspaces/{wsId}/log_actividad (read-only dal client)
// La scrittura avviene SOLO via Cloud Function logAttivita (Admin SDK)
//
// USO:
//   const { logs, loading } = useLog(workspaceId, { limit: 50 });
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import {
  collection, query, orderBy, limit as fsLimit, onSnapshot,
} from "firebase/firestore";
import { db } from "../lib/firebase";

/**
 * @param {string} workspaceId
 * @param {{ limit?: number }} options
 * @returns {{ logs: LogEntry[], loading: boolean, error: string|null }}
 */
export function useLog(workspaceId, { limit = 100 } = {}) {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!workspaceId) { setLoading(false); return; }

    const q = query(
      collection(db, "workspaces", workspaceId, "log_actividad"),
      orderBy("ts", "desc"),
      fsLimit(limit),
    );

    const unsub = onSnapshot(q,
      (snap) => {
        setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error("[useLog]", err);
        setError(err.message);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [workspaceId, limit]);

  return { logs, loading, error };
}
