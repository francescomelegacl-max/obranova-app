// ─── components/AgenteIA.jsx ──────────────────────────────────────────────────
// Agente AI ObraNova — bubble flottante + pannello chat laterale.
// Livello 1: Supporto app    Livello 2: Analisi progetto    Livello 3: /genera partidas
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect, useCallback } from "react";

// ── Renderer markdown ─────────────────────────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return "";
  return text
    // Rimuovi blocchi ```json ... ``` dalla visualizzazione (li mostriamo come card)
    .replace(/```json[\s\S]*?```/gi, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/#{1,3}\s(.+)/g, "<strong style='font-size:14px;color:#1a365d'>$1</strong>")
    .replace(/`(.*?)`/g, "<code style='background:#f0f4f8;padding:1px 5px;border-radius:4px;font-size:12px;font-family:monospace'>$1</code>")
    .replace(/^[-•]\s(.+)/gm, "<span style='display:block;padding-left:12px'>• $1</span>")
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>")
    .trim();
}

// ── Suggerimenti contestuali ──────────────────────────────────────────────────
function getSuggestions(activeTab, hasProject) {
  if (activeTab === "proyecto" && hasProject) return [
    "Analiza este presupuesto completo",
    "¿El margen es competitivo para Chile?",
    "¿Qué partidas me faltan?",
    "/genera baño completo 8m²",
  ];
  if (activeTab === "costos" && hasProject) return [
    "/genera terminaciones living 25m²",
    "¿Cómo mejoro el margen sin perder al cliente?",
    "¿Hay partidas con precios fuera de mercado?",
    "/cotiza ampliación dormitorio 15m²",
  ];
  if (activeTab === "diseno") return [
    "Dame un prompt para un render de baño mediterráneo",
    "¿Cómo subo una foto para transformarla con IA?",
    "¿Cuántos renders me quedan este mes?",
    "Sugiere 3 prompts para cocina moderna",
  ];
  if (activeTab === "planificacion") return [
    "/cronograma remodelación completa 3 meses",
    "¿Cómo organizo las tareas de obra?",
    "¿Cómo asigno tareas al equipo?",
  ];
  if (activeTab === "resumen" && hasProject) return [
    "¿Este presupuesto está listo para enviar?",
    "¿Qué debería mejorar antes de enviarlo?",
    "Genera un render para impresionar al cliente",
  ];
  if (activeTab === "dashboard") return [
    "/cotiza remodelación baño 6m²",
    "¿Cómo creo un presupuesto profesional?",
    "/genera remodelación cocina 12m²",
    "¿Qué puedo hacer con el Render AI?",
  ];
  return [
    "/cotiza baño completo 6m²",
    "¿Cómo funciona ObraNova?",
    "¿Cómo agrego una partida?",
    "/genera baño completo 8m²",
  ];
}

// ── Card partidas generate ────────────────────────────────────────────────────
function PartidasCard({ partidas, onInsert, onDismiss }) {
  if (!partidas?.length) return null;

  const subtotal = partidas.reduce((s, p) => s + (p.pu * p.cant), 0);
  const fmt = (n) => "$" + Math.round(n).toLocaleString("es-CL");

  return (
    <div style={{
      margin:       "10px 0",
      background:   "linear-gradient(135deg, #f0fff4, #c6f6d5)",
      border:       "1.5px solid #68d391",
      borderRadius: 14,
      overflow:     "hidden",
    }}>
      {/* Header */}
      <div style={{
        background:  "linear-gradient(135deg, #276749, #38a169)",
        padding:     "10px 14px",
        display:     "flex",
        alignItems:  "center",
        gap:         8,
      }}>
        <span style={{ fontSize: 16 }}>🏗️</span>
        <div style={{ flex: 1 }}>
          <div style={{ color: "white", fontWeight: 700, fontSize: 13 }}>
            {partidas.length} partidas generadas
          </div>
          <div style={{ color: "rgba(255,255,255,.8)", fontSize: 11 }}>
            Subtotal estimado: {fmt(subtotal)} CLP
          </div>
        </div>
      </div>

      {/* Lista partidas (max 6 visibili) */}
      <div style={{ padding: "8px 12px", maxHeight: 200, overflowY: "auto" }}>
        {partidas.slice(0, 8).map((p, i) => (
          <div key={i} style={{
            display:       "flex",
            justifyContent: "space-between",
            alignItems:    "center",
            padding:       "5px 0",
            borderBottom:  i < Math.min(partidas.length, 8) - 1 ? "1px solid #c6f6d5" : "none",
            gap:           8,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#22543d", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {p.nombre}
              </div>
              <div style={{ fontSize: 11, color: "#276749" }}>
                {p.cant} {p.unidad} · {p.cat}
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#276749", whiteSpace: "nowrap" }}>
              {fmt(p.pu * p.cant)}
            </div>
          </div>
        ))}
        {partidas.length > 8 && (
          <div style={{ fontSize: 11, color: "#276749", textAlign: "center", padding: "4px 0" }}>
            + {partidas.length - 8} partidas más...
          </div>
        )}
      </div>

      {/* Azioni */}
      <div style={{
        display:    "flex",
        gap:        8,
        padding:    "10px 12px",
        background: "rgba(255,255,255,.5)",
      }}>
        <button
          onClick={onInsert}
          style={{
            flex:         1,
            background:   "linear-gradient(135deg, #276749, #38a169)",
            color:        "white",
            border:       "none",
            borderRadius: 10,
            padding:      "9px 12px",
            fontSize:     13,
            fontWeight:   700,
            cursor:       "pointer",
            display:      "flex",
            alignItems:   "center",
            justifyContent: "center",
            gap:          6,
          }}
        >
          ✅ Insertar en presupuesto
        </button>
        <button
          onClick={onDismiss}
          style={{
            background:   "rgba(255,255,255,.8)",
            color:        "#276749",
            border:       "1px solid #68d391",
            borderRadius: 10,
            padding:      "9px 12px",
            fontSize:     13,
            cursor:       "pointer",
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

// ── Card cronograma generato ─────────────────────────────────────────────────
function CronogramaCard({ tasks, onInsert, onDismiss }) {
  if (!tasks?.length) return null;
  return (
    <div style={{
      margin: "10px 0",
      background: "linear-gradient(135deg, #ebf8ff, #bee3f8)",
      border: "1.5px solid #63b3ed",
      borderRadius: 14,
      overflow: "hidden",
    }}>
      <div style={{
        background: "linear-gradient(135deg, #1a365d, #2b6cb0)",
        padding: "10px 14px",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ fontSize: 16 }}>📋</span>
        <div style={{ flex: 1 }}>
          <div style={{ color: "white", fontWeight: 700, fontSize: 13 }}>
            {tasks.length} tareas generadas
          </div>
          <div style={{ color: "rgba(255,255,255,.8)", fontSize: 11 }}>
            Listas para insertar en Planificación
          </div>
        </div>
      </div>
      <div style={{ padding: "8px 12px", maxHeight: 180, overflowY: "auto" }}>
        {tasks.slice(0, 6).map((t, i) => (
          <div key={i} style={{
            padding: "5px 0",
            borderBottom: i < Math.min(tasks.length, 6) - 1 ? "1px solid #bee3f8" : "none",
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#1a365d" }}>
              {t.titulo || "Tarea"}
            </div>
            <div style={{ fontSize: 11, color: "#4a5568" }}>
              {t.categoria || ""}{t.fechaInicio ? ` · ${t.fechaInicio}` : ""}{t.fechaFin ? ` → ${t.fechaFin}` : ""}
            </div>
          </div>
        ))}
        {tasks.length > 6 && (
          <div style={{ fontSize: 11, color: "#2b6cb0", textAlign: "center", padding: "4px 0" }}>
            + {tasks.length - 6} tareas más...
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, padding: "10px 12px", background: "rgba(255,255,255,.5)" }}>
        <button onClick={onInsert} style={{
          flex: 1, background: "linear-gradient(135deg, #1a365d, #2b6cb0)",
          color: "white", border: "none", borderRadius: 10, padding: "9px 12px",
          fontSize: 13, fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          ✅ Insertar en Planificación
        </button>
        <button onClick={onDismiss} style={{
          background: "rgba(255,255,255,.8)", color: "#2b6cb0",
          border: "1px solid #63b3ed", borderRadius: 10,
          padding: "9px 12px", fontSize: 13, cursor: "pointer",
        }}>✕</button>
      </div>
    </div>
  );
}

// ── Componente messaggio ──────────────────────────────────────────────────────
function Mensaje({ msg, pendingPartidas, onInsert, onDismiss }) {
  const isUser = msg.role === "user";
  const html   = isUser ? null : renderMarkdown(msg.content);
  const isEmpty = !isUser && html && html.replace(/<[^>]+>/g, "").trim() === "";

  return (
    <div style={{
      display:        "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom:   10,
      gap:            8,
      alignItems:     "flex-start",
    }}>
      {!isUser && (
        <div style={{
          width: 28, height: 28, borderRadius: "50%", flexShrink: 0, marginTop: 2,
          background: "linear-gradient(135deg,#1a365d,#2d6a9f)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
        }}>🤖</div>
      )}
      <div style={{ maxWidth: "85%", display: "flex", flexDirection: "column", gap: 6 }}>
        {/* Bubble testo — nasconde se vuota dopo aver rimosso il JSON */}
        {!isEmpty && (
          <div style={{
            background:   isUser ? "#1a365d" : "white",
            color:        isUser ? "white" : "#1a202c",
            padding:      "10px 14px",
            borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
            fontSize:     13,
            lineHeight:   1.55,
            boxShadow:    "0 1px 4px rgba(0,0,0,.08)",
            border:       isUser ? "none" : "1px solid #e2e8f0",
            ...(msg.error ? { background: "#fff5f5", color: "#c53030", border: "1px solid #fed7d7" } : {}),
          }}>
            {isUser
              ? msg.content
              : <span dangerouslySetInnerHTML={{ __html: html }} />
            }
            <div style={{ fontSize: 10, opacity: .5, marginTop: 4, textAlign: isUser ? "left" : "right" }}>
              {new Date(msg.ts).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        )}

        {/* Card partidas — appare solo sull'ultimo messaggio /genera con partidas */}
        {msg.hasPartidas && pendingPartidas?.length > 0 && (
          <PartidasCard
            partidas={pendingPartidas}
            onInsert={onInsert}
            onDismiss={onDismiss}
          />
        )}
        {msg.isCronograma && msg.cronogramaTasks?.length > 0 && (
          <CronogramaCard
            tasks={msg.cronogramaTasks}
            onInsert={() => onInsertCronograma?.(msg.cronogramaTasks)}
            onDismiss={onDismiss}
          />
        )}
      </div>
    </div>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 10 }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
        background: "linear-gradient(135deg,#1a365d,#2d6a9f)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
      }}>🤖</div>
      <div style={{
        background: "white", border: "1px solid #e2e8f0",
        borderRadius: "18px 18px 18px 4px",
        padding: "10px 16px", display: "flex", gap: 4, alignItems: "center",
      }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: "50%", background: "#1a365d",
            animation: `bounce 1.2s ease-in-out ${i*.2}s infinite`,
          }} />
        ))}
        <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}`}</style>
      </div>
    </div>
  );
}

// ── Componente principale ─────────────────────────────────────────────────────
export default function AgenteIA({
  messages, loading, open, setOpen,
  sendMessage, clearMessages,
  pendingPartidas, setPendingPartidas, dismissPartidas,
  novaLimitReached, setNovaLimitReached, novaLimitInfo,
  novaCredits,
  activeTab, hasProject, plan,
  onInsertPartidas,
  onInsertCronograma,
  suggerimento, onDismissSuggerimento, onUpgrade,
}) {
  const confirmInsert = useCallback(() => {
    if (!pendingPartidas?.length || !onInsertPartidas) return;
    onInsertPartidas(pendingPartidas);
    setPendingPartidas(null);
  }, [pendingPartidas, onInsertPartidas, setPendingPartidas]);
  const [input,        setInput]        = useState("");
  const [buyingPack,   setBuyingPack]   = useState(null); // "starter"|"medio"|"grande"|null
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const isPro = plan === "pro" || plan === "empresa";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const handleSend = useCallback(() => {
    if (!input.trim() || loading) return;
    sendMessage(input.trim());
    setInput("");
  }, [input, loading, sendMessage]);

  const handleKey = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  // Acquista crediti Nova tramite CF → apre link MP
  const handleBuyPack = useCallback(async (pack) => {
    if (buyingPack) return;
    setBuyingPack(pack);
    try {
      const { httpsCallable } = await import("firebase/functions");
      const { functions } = await import("../lib/firebase");
      const acquista = httpsCallable(functions, "acquistaCreditsNova");
      const result = await acquista({ pack, workspaceId: null }); // workspaceId gestito lato CF via auth
      if (result.data?.mpLink) {
        window.open(result.data.mpLink, "_blank", "noopener");
      }
    } catch (e) {
      console.error("acquistaCreditsNova:", e);
    } finally {
      setBuyingPack(null);
    }
  }, [buyingPack]);

  const handleSuggestion = useCallback((s) => {
    sendMessage(s);
  }, [sendMessage]);

  // Indice dell'ultimo messaggio hasPartidas (per mostrare la card solo lì)
  const lastGeneraIdx = messages.reduce((acc, m, i) => m.hasPartidas ? i : acc, -1);

  const suggestions = getSuggestions(activeTab, hasProject);

  return (
    <>
      {/* ── Badge proattivo Nova ─────────────────────────────────────────── */}
      {!open && suggerimento && (
        <div style={{
          position: "fixed", bottom: 88, right: 24,
          maxWidth: 280, background: "white",
          borderRadius: 14, boxShadow: "0 4px 20px rgba(0,0,0,.15)",
          border: suggerimento.urgenza === "warn" ? "1.5px solid #ed8936" : "1.5px solid #63b3ed",
          zIndex: 9998, overflow: "hidden",
          animation: "fadeInUp .3s ease-out",
        }}>
          <div style={{
            padding: "10px 14px", display: "flex", gap: 10, alignItems: "flex-start",
          }}>
            <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>{suggerimento.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: "#2d3748", lineHeight: 1.4, marginBottom: 8 }}>
                {suggerimento.testo}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => {
                    if (suggerimento.msg) {
                      setOpen(true);
                      setTimeout(() => sendMessage(suggerimento.msg), 300);
                    }
                    onDismissSuggerimento?.();
                  }}
                  style={{
                    padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                    background: "linear-gradient(135deg,#1a365d,#2b6cb0)",
                    color: "white", fontSize: 11, fontWeight: 700,
                  }}
                >
                  {suggerimento.cta}
                </button>
                <button
                  onClick={() => onDismissSuggerimento?.()}
                  style={{
                    padding: "5px 8px", borderRadius: 8, border: "1px solid #e2e8f0",
                    background: "white", color: "#a0aec0", fontSize: 11, cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
          <style>{`@keyframes fadeInUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
      )}

      {/* ── Bubble ───────────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        title={open ? "Cerrar Nova" : "Abrir Nova — Asistente IA"}
        style={{
          position:     "fixed",
          bottom:       24,
          right:        24,
          width:        56,
          height:       56,
          borderRadius: "50%",
          background:   open
            ? "linear-gradient(135deg,#c53030,#9b2c2c)"
            : "linear-gradient(135deg,#1a365d,#2d6a9f)",
          color:        "white",
          border:       "none",
          cursor:       "pointer",
          fontSize:     24,
          display:      "flex",
          alignItems:   "center",
          justifyContent: "center",
          boxShadow:    "0 4px 20px rgba(0,0,0,.3)",
          zIndex:       9999,
          transition:   "all .25s",
        }}
      >
        {open ? "✕" : "🤖"}
        {!open && messages.length > 0 && (
          <div style={{
            position: "absolute", top: 0, right: 0,
            width: 18, height: 18, borderRadius: "50%",
            background: "#e53e3e", fontSize: 10, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid white",
          }}>
            {messages.filter(m => m.role === "assistant").length}
          </div>
        )}
      </button>

      {/* ── Pannello ─────────────────────────────────────────────────────── */}
      {open && (
        <div style={{
          position:      "fixed",
          bottom:        92,
          right:         24,
          width:         370,
          height:        540,
          background:    "white",
          borderRadius:  16,
          boxShadow:     "0 8px 40px rgba(0,0,0,.2)",
          display:       "flex",
          flexDirection: "column",
          zIndex:        9998,
          overflow:      "hidden",
          border:        "1px solid #e2e8f0",
          ...(window.innerWidth < 480 ? {
            bottom: 0, right: 0, width: "100vw",
            height: "75vh", borderRadius: "16px 16px 0 0",
          } : {}),
        }}>

          {/* Header */}
          <div style={{
            background:   "linear-gradient(135deg,#1a365d,#2d6a9f)",
            padding:      "14px 16px",
            display:      "flex",
            alignItems:   "center",
            gap:          10,
            flexShrink:   0,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              background: "rgba(255,255,255,.15)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
            }}>🤖</div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "white", fontWeight: 700, fontSize: 14 }}>
                Nova — Asistente IA
              </div>
              <div style={{ color: "rgba(255,255,255,.75)", fontSize: 11 }}>
                {loading ? "⏳ Generando..." : "En línea · Responde al instante"}
              </div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => clearMessages()}
                title="Limpiar conversación"
                style={{
                  background: "rgba(255,255,255,.1)", border: "none",
                  color: "white", borderRadius: 8, padding: "4px 8px",
                  cursor: "pointer", fontSize: 11,
                }}
              >🗑️</button>
            )}
          </div>

          {/* Banner piano Free */}
          {!isPro && (
            <div style={{
              background: "#faf5ff", borderBottom: "1px solid #e9d8fd",
              padding: "7px 14px", fontSize: 11, color: "#553c9a",
              display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
            }}>
              <span>⚡</span>
              <span>Asistente IA disponible en plan <strong>Pro</strong>. Acceso de prueba activo.</span>
            </div>
          )}

          {/* Messaggi */}
          <div style={{
            flex:      1,
            overflowY: "auto",
            padding:   "14px 12px 4px",
            background: "#f8fafc",
          }}>
            {/* Benvenuto */}
            {messages.length === 0 && (
              <div style={{ textAlign: "center", padding: "16px 8px" }}>
                <div style={{ fontSize: 30, marginBottom: 8 }}>👋</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d", marginBottom: 4 }}>
                  Hola, soy Nova
                </div>
                <div style={{ fontSize: 12, color: "#718096", lineHeight: 1.5, marginBottom: 14 }}>
                  Tu asistente de obra con IA. Analizo presupuestos, doy sugerencias y genero partidas completas con un comando.
                </div>
                {/* Hint /genera */}
                <div style={{
                  background: "linear-gradient(135deg,#ebf8ff,#bee3f8)",
                  border: "1px solid #90cdf4", borderRadius: 10, padding: "8px 12px",
                  marginBottom: 8, textAlign: "left",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#2a4365", marginBottom: 2 }}>
                    🏗️ /genera — presupuesto desde cero
                  </div>
                  <div style={{ fontSize: 11, color: "#2c5282" }}>
                    Escribe <strong>/genera baño completo 8m²</strong> y Nova crea las partidas listas para insertar.
                  </div>
                </div>
                {/* Hint /cotiza */}
                <div style={{
                  background: "linear-gradient(135deg,#fefcbf,#faf089)",
                  border: "1px solid #ecc94b", borderRadius: 10, padding: "8px 12px",
                  marginBottom: 12, textAlign: "left",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#744210", marginBottom: 2 }}>
                    ⚡ /cotiza — respuesta express
                  </div>
                  <div style={{ fontSize: 11, color: "#975a16" }}>
                    Escribe <strong>/cotiza remodelación cocina 12m²</strong> para cotizar en 30 segundos y enviar al cliente.
                  </div>
                </div>
                {/* Suggerimenti */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {suggestions.map((s, i) => {
                    const isCmd = s.startsWith("/genera") || s.startsWith("/cotiza") || s.startsWith("/cronograma");
                    const isCotiza = s.startsWith("/cotiza");
                    return (
                    <button key={i} onClick={() => handleSuggestion(s)}
                      style={{
                        background: isCotiza ? "linear-gradient(135deg,#fefcbf,#faf089)" : isCmd ? "linear-gradient(135deg,#f0fff4,#c6f6d5)" : "white",
                        border: isCotiza ? "1px solid #ecc94b" : isCmd ? "1px solid #68d391" : "1px solid #e2e8f0",
                        borderRadius: 20, padding: "7px 14px",
                        fontSize: 12,
                        color: isCotiza ? "#744210" : isCmd ? "#276749" : "#1a365d",
                        fontWeight: isCmd ? 700 : 400,
                        cursor: "pointer", textAlign: "left", transition: "all .15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = ".8"}
                      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                    >
                      {isCotiza ? "⚡ " : isCmd ? "🏗️ " : ""}{s}
                    </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lista messaggi */}
            {messages.map((msg, i) => (
              <Mensaje
                key={i}
                msg={msg}
                pendingPartidas={i === lastGeneraIdx ? pendingPartidas : null}
                onInsert={confirmInsert}
                onDismiss={dismissPartidas}
              />
            ))}

            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Banner limite Nova ───────────────────────────────────────── */}
          {novaLimitReached && novaLimitInfo && (
            <div style={{
              margin: "8px 12px",
              borderRadius: 12,
              overflow: "hidden",
              flexShrink: 0,
              border: novaLimitInfo.upsellType === "empresa"
                ? "1.5px solid #553c9a"
                : "1.5px solid #2b6cb0",
            }}>
              {/* Header */}
              <div style={{
                background: novaLimitInfo.upsellType === "empresa"
                  ? "linear-gradient(135deg,#553c9a,#6b46c1)"
                  : "linear-gradient(135deg,#1a365d,#2b6cb0)",
                padding: "10px 14px",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ fontSize: 18 }}>
                  {novaLimitInfo.upsellType === "empresa" ? "🚀" : "⚡"}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "white", fontWeight: 800, fontSize: 13 }}>
                    {novaLimitInfo.upsellType === "empresa"
                      ? "Límite Pro alcanzado"
                      : "Límite Free alcanzado"}
                  </div>
                  <div style={{ color: "rgba(255,255,255,.8)", fontSize: 11 }}>
                    {novaLimitInfo.used}/{novaLimitInfo.limit} mensajes este mes
                    {novaCredits > 0 && ` · ${novaCredits} créditos extra disponibles`}
                  </div>
                </div>
                <button
                  onClick={() => setNovaLimitReached(false)}
                  style={{
                    background: "rgba(255,255,255,.15)", border: "none",
                    color: "white", borderRadius: 6, width: 22, height: 22,
                    cursor: "pointer", fontSize: 12, display: "flex",
                    alignItems: "center", justifyContent: "center",
                  }}
                >✕</button>
              </div>

              {/* Body */}
              <div style={{
                background: novaLimitInfo.upsellType === "empresa" ? "#faf5ff" : "#ebf8ff",
                padding: "12px 14px",
              }}>

                {/* ── Opzione 1: pacchetti crediti ── */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#4a5568", marginBottom: 8 }}>
                    🪙 Compra créditos extra — sin cambiar de plan
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[
                      { id: "starter", label: "Starter",  msg: "20 msg",  price: "$2.990" },
                      { id: "medio",   label: "Medio",    msg: "50 msg",  price: "$5.990" },
                      { id: "grande",  label: "Grande",   msg: "150 msg", price: "$12.990" },
                    ].map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleBuyPack(p.id)}
                        disabled={!!buyingPack}
                        style={{
                          flex: 1,
                          padding: "8px 4px",
                          border: "1.5px solid #bee3f8",
                          borderRadius: 8,
                          background: buyingPack === p.id ? "#bee3f8" : "white",
                          cursor: buyingPack ? "wait" : "pointer",
                          textAlign: "center",
                          transition: "all .15s",
                        }}
                      >
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#1a365d" }}>
                          {buyingPack === p.id ? "⏳" : p.msg}
                        </div>
                        <div style={{ fontSize: 10, color: "#718096", marginTop: 2 }}>
                          {p.price}
                        </div>
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: "#a0aec0", marginTop: 6, textAlign: "center" }}>
                    Los créditos no vencen · Se acumulan mes a mes
                  </div>
                </div>

                {/* Divisore */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
                  <span style={{ fontSize: 10, color: "#a0aec0", fontWeight: 600 }}>O MEJOR AÚN</span>
                  <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
                </div>

                {/* ── Opzione 2: upgrade piano ── */}
                {novaLimitInfo.upsellType === "empresa" ? (
                  <>
                    <div style={{ fontSize: 11, color: "#44337a", marginBottom: 8, lineHeight: 1.5 }}>
                      Con <strong>Empresa</strong> Nova no tiene límite — más renders ilimitados, multi-usuario y export contable.
                    </div>
                    <a
                      href="https://app.obranova.cl/app?tab=planes"
                      target="_blank" rel="noreferrer"
                      style={{
                        display: "block", textAlign: "center",
                        background: "linear-gradient(135deg,#553c9a,#6b46c1)",
                        color: "white", borderRadius: 8, padding: "9px 0",
                        fontWeight: 800, fontSize: 13, textDecoration: "none",
                      }}
                    >
                      Ver plan Empresa →
                    </a>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 11, color: "#1a365d", marginBottom: 8, lineHeight: 1.5 }}>
                      Con <strong>Pro</strong> tienes 50 mensajes/mes + renders AI + firma digital — todo incluido.
                    </div>
                    <a
                      href="https://app.obranova.cl/app?tab=planes"
                      target="_blank" rel="noreferrer"
                      style={{
                        display: "block", textAlign: "center",
                        background: "linear-gradient(135deg,#1a365d,#2b6cb0)",
                        color: "white", borderRadius: 8, padding: "9px 0",
                        fontWeight: 800, fontSize: 13, textDecoration: "none",
                      }}
                    >
                      Actualizar a Pro — $29.900/mes →
                    </a>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Input */}
          <div style={{
            padding:    "10px 12px",
            background: "white",
            borderTop:  "1px solid #e2e8f0",
            display:    "flex",
            gap:        8,
            alignItems: "flex-end",
            flexShrink: 0,
            opacity: novaLimitReached ? 0.45 : 1,
            pointerEvents: novaLimitReached ? "none" : "auto",
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={hasProject ? "Pregunta, /genera o /cotiza [descripción]..." : "Escribe tu pregunta o /cotiza baño 6m²..."}
              rows={1}
              style={{
                flex:        1,
                padding:     "9px 12px",
                border:      input.startsWith("/genera") ? "1.5px solid #38a169"
                           : input.startsWith("/cotiza") ? "1.5px solid #d69e2e"
                           : "1.5px solid #e2e8f0",
                borderRadius: 12,
                fontSize:    13,
                resize:      "none",
                outline:     "none",
                fontFamily:  "inherit",
                lineHeight:  1.4,
                maxHeight:   100,
                overflowY:   "auto",
                transition:  "border-color .15s",
                background:  input.startsWith("/genera") ? "#f0fff4"
                           : input.startsWith("/cotiza") ? "#fefcbf"
                           : "white",
              }}
              onFocus={e => {
                if (!input.startsWith("/genera") && !input.startsWith("/cotiza")) e.target.style.borderColor = "#2d6a9f";
              }}
              onBlur={e => {
                if (!input.startsWith("/genera") && !input.startsWith("/cotiza")) e.target.style.borderColor = "#e2e8f0";
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              style={{
                width:        38,
                height:       38,
                borderRadius: "50%",
                background:   !input.trim() || loading
                  ? "#e2e8f0"
                  : input.startsWith("/genera")
                    ? "linear-gradient(135deg,#276749,#38a169)"
                    : input.startsWith("/cotiza")
                      ? "linear-gradient(135deg,#b7791f,#d69e2e)"
                      : "linear-gradient(135deg,#1a365d,#2d6a9f)",
                color:        !input.trim() || loading ? "#a0aec0" : "white",
                border:       "none",
                cursor:       !input.trim() || loading ? "not-allowed" : "pointer",
                fontSize:     16,
                display:      "flex",
                alignItems:   "center",
                justifyContent: "center",
                flexShrink:   0,
                transition:   "all .15s",
              }}
            >
              {loading ? "⏳" : input.startsWith("/genera") ? "🏗️" : input.startsWith("/cotiza") ? "⚡" : "➤"}
            </button>
          </div>

          {/* Footer */}
          <div style={{
            padding:    "4px 12px 8px",
            textAlign:  "center",
            fontSize:   10,
            color:      "#a0aec0",
            background: "white",
            flexShrink: 0,
          }}>
            Powered by Claude AI · ObraNova
          </div>
        </div>
      )}
    </>
  );
}
