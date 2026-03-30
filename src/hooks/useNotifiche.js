// ─── src/hooks/useNotifiche.js ────────────────────────────────────────────────
// Sistema notifiche in-app — legge da /workspaces/{wsId}/notifiche in real-time.
// FIX: retry con backoff su permission denied (race condition al primo login)
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from "react";
import { collection, query, orderBy, limit as fsLimit, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

const LS_KEY = (wsId) => `notif_seen_${wsId}`;
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2000; // 2s tra ogni tentativo

export function useNotifiche(workspaceId, currentUserUid) {
  const [notifiche,   setNotifiche]   = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSeenAt,  setLastSeenAt]  = useState(0);

  const unsubRef   = useRef(null);
  const retryRef   = useRef(0);
  const timerRef   = useRef(null);

  // Carica lastSeenAt da localStorage
  useEffect(() => {
    if (!workspaceId) return;
    const saved = Number(localStorage.getItem(LS_KEY(workspaceId)) || 0);
    setLastSeenAt(saved);
  }, [workspaceId]);

  // Ascolta notifiche in real-time, con retry su permission denied
  useEffect(() => {
    if (!workspaceId) return;

    retryRef.current = 0;

    const subscribe = () => {
      // Pulisci subscription precedente
      if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }

      const q = query(
        collection(db, "workspaces", workspaceId, "notifiche"),
        orderBy("ts", "desc"),
        fsLimit(50),
      );

      unsubRef.current = onSnapshot(q, (snap) => {
        // Successo — reset retry counter
        retryRef.current = 0;

        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setNotifiche(items);

        const seen = Number(localStorage.getItem(LS_KEY(workspaceId)) || 0);
        const unread = items.filter(l => {
          const ms = l.ts?.toMillis?.() ?? (l.ts?.seconds ? l.ts.seconds * 1000 : 0);
          return ms > seen;
        });
        setUnreadCount(unread.length);
      }, (err) => {
        console.warn("useNotifiche:", err.message);
        setNotifiche([]);
        setUnreadCount(0);

        // Se è un errore di permessi e non abbiamo esaurito i retry → riprova
        if (
          (err.code === "permission-denied" || err.message?.includes("Missing or insufficient")) &&
          retryRef.current < MAX_RETRIES
        ) {
          retryRef.current += 1;
          const delay = RETRY_DELAY_MS * retryRef.current;
          console.info(`useNotifiche: retry ${retryRef.current}/${MAX_RETRIES} tra ${delay}ms`);
          timerRef.current = setTimeout(subscribe, delay);
        }
      });
    };

    subscribe();

    return () => {
      if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      retryRef.current = 0;
    };
  }, [workspaceId, currentUserUid]);

  // Marca tutto come letto
  const markAllRead = useCallback(() => {
    if (!workspaceId) return;
    const now = Date.now();
    localStorage.setItem(LS_KEY(workspaceId), String(now));
    setLastSeenAt(now);
    setUnreadCount(0);
  }, [workspaceId]);

  return { notifiche, unreadCount, lastSeenAt, markAllRead };
}
