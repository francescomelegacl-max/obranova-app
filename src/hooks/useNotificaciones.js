// ─── hooks/useNotificaciones.js ───────────────────────────────────────────────
// 3.2 Notifiche browser per scadenze imminenti (vencimientos e fine lavori).
// Chiede il permesso al mount, poi controlla ogni giorno.
// Non usa service worker: solo Notification API (supporto browser nativo).

import { useEffect, useCallback, useRef } from "react";

// Quanti giorni prima inviare la notifica
const DAYS_BEFORE = 3;

// ── Formatta data leggibile ────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-CL", { day: "numeric", month: "long" });
}

// ── Calcola giorni di distanza da oggi ────────────────────────────────────────
function daysFrom(isoDate) {
  if (!isoDate) return Infinity;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(isoDate + "T00:00:00");
  return Math.round((target - today) / 86400000);
}

// ── Invia notifica browser ────────────────────────────────────────────────────
function notify(title, body, tag) {
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      tag,                  // evita duplicati (stesso tag = sovrascrive)
      icon: "/favicon.ico",
      badge: "/favicon.ico",
    });
  } catch {}
}

// ─── Hook principale ──────────────────────────────────────────────────────────
export function useNotificaciones({ proyectos = [], workspace } = {}) {
  const lastCheckRef = useRef(null);

  // ── Chiedi permesso ───────────────────────────────────────────────────────
  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return "unsupported";
    if (Notification.permission === "default") {
      return await Notification.requestPermission();
    }
    return Notification.permission;
  }, []);

  // ── Controlla scadenze e invia notifiche ──────────────────────────────────
  const checkDeadlines = useCallback(() => {
    if (Notification.permission !== "granted") return;
    const wsName = workspace?.name || "Obra Nova";

    proyectos.forEach(p => {
      const cliente = p.info?.cliente || "—";
      const estado  = p.estado || "";
      if (["Finalizado", "Rechazado"].includes(estado)) return;

      // Vencimiento del presupuesto
      if (p.info?.vence) {
        const d = daysFrom(p.info.vence);
        if (d >= 0 && d <= DAYS_BEFORE) {
          const tag = `vence-${p.id}-${p.info.vence}`;
          const label = d === 0 ? "¡HOY vence!" : d === 1 ? "Vence mañana" : `Vence en ${d} días`;
          notify(
            `⚠️ ${label} — ${cliente}`,
            `Presupuesto en ${wsName}. Fecha: ${formatDate(p.info.vence)}`,
            tag,
          );
        }
      }

      // Fin de obra (fecha estimada de término)
      if (p.info?.fechaFin) {
        const d = daysFrom(p.info.fechaFin);
        if (d >= 0 && d <= DAYS_BEFORE) {
          const tag = `fin-${p.id}-${p.info.fechaFin}`;
          const label = d === 0 ? "¡Entrega HOY!" : d === 1 ? "Entrega mañana" : `Entrega en ${d} días`;
          notify(
            `🏗️ ${label} — ${cliente}`,
            `Fin de obra en ${wsName}. Fecha: ${formatDate(p.info.fechaFin)}`,
            tag,
          );
        }
      }
    });
  }, [proyectos, workspace]);

  // ── Al mount: chiedi permesso + prima verifica ────────────────────────────
  useEffect(() => {
    if (!("Notification" in window)) return;

    (async () => {
      const perm = await requestPermission();
      if (perm === "granted") checkDeadlines();
    })();

    // Controlla ogni 4 ore (senza service worker)
    const interval = setInterval(() => {
      const now = Date.now();
      if (!lastCheckRef.current || now - lastCheckRef.current > 4 * 3600 * 1000) {
        lastCheckRef.current = now;
        checkDeadlines();
      }
    }, 60_000); // controlla ogni minuto se serve aggiornare

    return () => clearInterval(interval);
  }, [checkDeadlines, requestPermission]);

  return { requestPermission, checkDeadlines };
}
