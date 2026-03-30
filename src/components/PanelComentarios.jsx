// ─── components/PanelComentarios.jsx ─────────────────────────────────────────
// Panel de comentarios/chat en tiempo real por proyecto.
// Usado en TabProyecto (owner/miembros) y VistaCliente (clientes).
//
// Props:
//   workspaceId    string
//   proyectoId     string
//   autorNombre    string   — nombre del usuario actual
//   autorEmail     string
//   autorUid       string   — uid Firebase o "cliente"
//   esCliente      bool     — si true, solo puede enviar tipo "cliente"
//   myRole         string   — "owner"|"admin"|"member" para mostrar eliminar
//   clienteNombre  string   — nombre del cliente (para modo cliente)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import { useComentarios } from "../hooks/useComentarios";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const hoy = new Date();
  const esHoy = d.toDateString() === hoy.toDateString();
  if (esHoy) return d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit" }) + " " +
    d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
}

function initiales(nombre) {
  return (nombre || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

const COLORS_BY_UID = {};
const PALETTE = ["#2b6cb0", "#276749", "#c05621", "#553c9a", "#b7791f", "#2c7a7b", "#702459"];
function colorForUid(uid) {
  if (!COLORS_BY_UID[uid]) {
    COLORS_BY_UID[uid] = PALETTE[Object.keys(COLORS_BY_UID).length % PALETTE.length];
  }
  return COLORS_BY_UID[uid];
}

// ── Componente ────────────────────────────────────────────────────────────────
export default function PanelComentarios({
  workspaceId,
  proyectoId,
  autorNombre,
  autorEmail,
  autorUid,
  esCliente = false,
  myRole = "member",
  clienteNombre = "",
  onNewComment,
}) {
  const [texto,    setTexto]    = useState("");
  const [enviando, setEnviando] = useState(false);
  const bottomRef = useRef(null);

  const nombreEfectivo = esCliente ? (clienteNombre || "Cliente") : autorNombre;
  const uidEfectivo    = esCliente ? "cliente" : autorUid;

  const { comentarios, loading, enviar, eliminar } = useComentarios({
    workspaceId,
    proyectoId,
    autorNombre: nombreEfectivo,
    autorEmail:  esCliente ? "" : autorEmail,
    autorUid:    uidEfectivo,
  });

  // Auto-scroll + callback unread per nuovi messaggi
  const prevCountRef = useRef(0);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    // Segnala nuovi commenti di altri (non nostri) al parent
    if (comentarios.length > prevCountRef.current) {
      const newOnes = comentarios.slice(prevCountRef.current);
      const fromOthers = newOnes.filter(c => c.autorUid !== uidEfectivo);
      if (fromOthers.length > 0) onNewComment?.();
    }
    prevCountRef.current = comentarios.length;
  }, [comentarios]);

  const handleEnviar = async () => {
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    try {
      await enviar(texto, esCliente ? "cliente" : "interno");
      setTexto("");
    } catch (e) {
      console.error("enviar comentario:", e);
    } finally {
      setEnviando(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  const puedeEliminar = !esCliente && (myRole === "owner" || myRole === "admin");

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      background: "white", borderRadius: 14,
      boxShadow: "0 1px 6px rgba(0,0,0,.08)",
      overflow: "hidden", height: "100%", minHeight: 320,
    }}>

      {/* Header */}
      <div style={{
        padding: "12px 16px", borderBottom: "1px solid #e2e8f0",
        display: "flex", alignItems: "center", gap: 8,
        background: "#f7fafc",
      }}>
        <span style={{ fontSize: 16 }}>💬</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#1a365d" }}>
            Comentarios del proyecto
          </div>
          <div style={{ fontSize: 11, color: "#718096" }}>
            {comentarios.length} mensaje{comentarios.length !== 1 ? "s" : ""}
            {!esCliente && " · visible para tu equipo"}
          </div>
        </div>
      </div>

      {/* Lista mensajes */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "12px 14px",
        display: "flex", flexDirection: "column", gap: 10,
        background: "#fafafa",
      }}>
        {loading && (
          <div style={{ textAlign: "center", padding: 20, color: "#a0aec0", fontSize: 12 }}>
            Cargando...
          </div>
        )}

        {!loading && comentarios.length === 0 && (
          <div style={{ textAlign: "center", padding: 28, color: "#a0aec0" }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>💬</div>
            <div style={{ fontSize: 12 }}>
              {esCliente
                ? "Escribe un mensaje para comunicarte con el equipo."
                : "Sin comentarios aún. Empieza la conversación."}
            </div>
          </div>
        )}

        {comentarios.map((c) => {
          const esMio = esCliente
            ? c.tipo === "cliente"
            : c.autorUid === autorUid;
          const esDeCliente = c.tipo === "cliente";
          const color = colorForUid(c.autorUid || "?");

          return (
            <div key={c.id} style={{
              display: "flex",
              flexDirection: esMio ? "row-reverse" : "row",
              alignItems: "flex-end", gap: 7,
            }}>
              {/* Avatar */}
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: esDeCliente ? "#276749" : color,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 800, color: "white",
              }}>
                {initiales(c.autorNombre)}
              </div>

              {/* Burbuja */}
              <div style={{ maxWidth: "75%" }}>
                {/* Autore + tipo */}
                <div style={{
                  fontSize: 10, color: "#718096", marginBottom: 2,
                  textAlign: esMio ? "right" : "left",
                  display: "flex", alignItems: "center", gap: 5,
                  flexDirection: esMio ? "row-reverse" : "row",
                }}>
                  <span style={{ fontWeight: 600 }}>{c.autorNombre || "—"}</span>
                  {esDeCliente && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, background: "#f0fff4",
                      color: "#276749", borderRadius: 4, padding: "1px 5px",
                      border: "1px solid #9ae6b4",
                    }}>CLIENTE</span>
                  )}
                </div>

                {/* Texto */}
                <div style={{
                  padding: "8px 12px", borderRadius: esMio ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                  background: esMio
                    ? (esCliente ? "#276749" : "#1a365d")
                    : (esDeCliente ? "#f0fff4" : "white"),
                  color: esMio ? "white" : "#2d3748",
                  fontSize: 13, lineHeight: 1.5,
                  boxShadow: "0 1px 3px rgba(0,0,0,.08)",
                  border: esMio ? "none" : "1px solid #e2e8f0",
                  wordBreak: "break-word", whiteSpace: "pre-wrap",
                }}>
                  {c.texto}
                </div>

                {/* Timestamp + elimina */}
                <div style={{
                  fontSize: 10, color: "#a0aec0", marginTop: 2,
                  textAlign: esMio ? "right" : "left",
                  display: "flex", alignItems: "center", gap: 6,
                  flexDirection: esMio ? "row-reverse" : "row",
                }}>
                  <span>{fmtTime(c.createdAt)}</span>
                  {puedeEliminar && (
                    <button
                      onClick={() => window.confirm("¿Eliminar este comentario?") && eliminar(c.id)}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "#fc8181", fontSize: 10, padding: 0,
                        opacity: 0.6,
                      }}
                      title="Eliminar"
                    >🗑</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "10px 12px", borderTop: "1px solid #e2e8f0",
        display: "flex", gap: 8, alignItems: "flex-end",
        background: "white",
      }}>
        <textarea
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={esCliente ? "Escribe tu mensaje..." : "Comentario interno... (Enter para enviar)"}
          rows={1}
          style={{
            flex: 1, padding: "8px 12px",
            border: "1px solid #e2e8f0", borderRadius: 10,
            fontSize: 13, color: "#1a365d", resize: "none",
            fontFamily: "inherit", lineHeight: 1.4,
            maxHeight: 80, overflowY: "auto",
            boxSizing: "border-box",
          }}
          onInput={e => {
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 80) + "px";
          }}
          maxLength={1000}
        />
        <button
          onClick={handleEnviar}
          disabled={!texto.trim() || enviando}
          style={{
            padding: "8px 14px", borderRadius: 10, border: "none",
            background: !texto.trim() || enviando ? "#e2e8f0" : (esCliente ? "#276749" : "#1a365d"),
            color: !texto.trim() || enviando ? "#a0aec0" : "white",
            fontWeight: 700, fontSize: 13, cursor: !texto.trim() || enviando ? "not-allowed" : "pointer",
            flexShrink: 0, transition: "all .15s",
          }}
        >
          {enviando ? "⏳" : "➤"}
        </button>
      </div>
    </div>
  );
}
