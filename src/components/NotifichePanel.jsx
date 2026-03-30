// ─── src/components/NotifichePanel.jsx ───────────────────────────────────────
// Dropdown notifiche — supporta tutti i tipi del sistema notifiche v2.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef } from "react";

const ICONE = {
  // Lato cliente
  firma_completada:      "✍️",
  firma_rechazada:       "❌",
  vista_abierta:         "👁️",
  cliente_revisito:      "🔥",
  // Scadenze commerciali
  presupuesto_por_vencer:"⚠️",
  presupuesto_vencido:   "⏰",
  sin_respuesta_7d:      "📭",
  cuota_vencida:         "💸",
  // Stock
  stock_bajo:            "📦",
  stock_agotado:         "🚫",
  // Contratti/team
  contrato_por_vencer:   "👷",
  membro_aceptado:       "👤",
  // Engagement
  trial_por_vencer:      "⚡",
  cuota_pagada:          "💰",
  piano_attivato:        "⚡",
  render_completado:     "🎨",
  // Legacy
  firma_inviata:         "📨",
  stato_cambiato:        "🔄",
  progetto_creato:       "📄",
  membro_invitato:       "👤",
};

const SOURCE_COLORS = {
  cliente: "#ebf8ff",
  interno: "#faf5ff",
  sistema: "#fffbeb",
};

const SOURCE_LABELS = {
  cliente: "Cliente",
  interno: "Equipo",
  sistema: "Sistema",
};

function formatTs(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts.seconds ? ts.seconds * 1000 : ts);
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60)    return "Ahora";
  if (diff < 3600)  return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)}h`;
  if (diff < 172800) return "Ayer";
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit" });
}

export default function NotifichePanel({ notifiche, unreadCount, lastSeenAt, onClose, onMarkRead, onNavigate }) {
  const ref = useRef();

  // Chiudi cliccando fuori
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Marca letto dopo 1.5s di apertura
  useEffect(() => {
    const t = setTimeout(onMarkRead, 1500);
    return () => clearTimeout(t);
  }, [onMarkRead]);

  const isUnread = (l) => {
    const ms = l.ts?.toMillis?.() ?? (l.ts?.seconds ? l.ts.seconds * 1000 : 0);
    return ms > lastSeenAt;
  };

  // Raggruppa per data
  const today = new Date();
  const todayStr = today.toLocaleDateString("es-CL");
  const yesterdayStr = new Date(today.getTime() - 86400000).toLocaleDateString("es-CL");

  return (
    <div ref={ref} style={{
      width: "100%", maxHeight: "inherit", overflowY: "auto",
      background: "white", borderRadius: "inherit",
    }}>
      {/* Header */}
      <div style={{
        padding: "13px 16px 10px", borderBottom: "1px solid #f0f4f8",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, background: "white", borderRadius: "14px 14px 0 0", zIndex: 1,
      }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: "#1a365d" }}>
          🔔 Notificaciones
          {unreadCount > 0 && (
            <span style={{
              marginLeft: 8, background: "#e53e3e", color: "white",
              fontSize: 10, fontWeight: 800, padding: "2px 7px",
              borderRadius: 99, verticalAlign: "middle",
            }}>{unreadCount}</span>
          )}
        </div>
        <button onClick={onClose} style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#a0aec0", fontSize: 18, lineHeight: 1, padding: 2,
        }}>×</button>
      </div>

      {/* Lista */}
      {notifiche.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 16px", color: "#a0aec0" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
          <div style={{ fontSize: 13 }}>Sin notificaciones</div>
        </div>
      ) : (
        <div>
          {notifiche.map(l => {
            const unread = isUnread(l);
            const icon = l.icon || ICONE[l.tipo] || ICONE[l.azione] || "📝";
            const titulo = l.titulo || l.tipo || l.azione || "Notificación";
            const desc = l.descripcion || l.dettagli?.label || "";
            const source = l.source || "sistema";
            const sourceBg = SOURCE_COLORS[source] || "#f7fafc";
            const sourceLabel = SOURCE_LABELS[source] || "";

            return (
              <div
                key={l.id}
                onClick={() => {
                  if (l.proyectoId && onNavigate) onNavigate(l.proyectoId);
                }}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "11px 16px",
                  background: unread ? "#f0f7ff" : "white",
                  borderBottom: "1px solid #f7fafc",
                  transition: "background .3s",
                  cursor: l.proyectoId ? "pointer" : "default",
                }}
                onMouseEnter={e => { if (l.proyectoId) e.currentTarget.style.background = "#e8f4fd"; }}
                onMouseLeave={e => { e.currentTarget.style.background = unread ? "#f0f7ff" : "white"; }}
              >
                <div style={{
                  fontSize: 18, flexShrink: 0, marginTop: 2,
                  width: 34, height: 34, borderRadius: 8,
                  background: sourceBg, display: "flex",
                  alignItems: "center", justifyContent: "center",
                }}>{icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13, fontWeight: unread ? 700 : 500,
                    color: "#2d3748", marginBottom: 2, lineHeight: 1.3,
                  }}>{titulo}</div>
                  {desc && (
                    <div style={{ fontSize: 11, color: "#718096", marginBottom: 2, lineHeight: 1.4 }}>{desc}</div>
                  )}
                  <div style={{ fontSize: 10, color: "#a0aec0", display: "flex", gap: 6, alignItems: "center" }}>
                    {sourceLabel && (
                      <span style={{
                        background: sourceBg, padding: "1px 6px", borderRadius: 4,
                        fontSize: 9, fontWeight: 600, color: "#718096",
                      }}>{sourceLabel}</span>
                    )}
                    <span>{formatTs(l.ts)}</span>
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, flexShrink:0 }}>
                  {unread && (
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: "#e53e3e", marginTop: 5,
                    }} />
                  )}
                  {l.proyectoId && (
                    <span style={{ fontSize:12, color:"#a0aec0", marginTop: unread ? 2 : 5 }}>›</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
