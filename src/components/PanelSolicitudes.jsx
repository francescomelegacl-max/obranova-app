// ─── components/PanelSolicitudes.jsx ─────────────────────────────────────────
// Pannello owner — gestione solicitudes de material
// Mostrabile come tab dentro TabMagazzino o come sezione separata
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback } from "react";

const ESTADO_STYLE = {
  pendiente: { bg: "#FAEEDA", color: "#633806", border: "#BA7517", label: "⏳ Pendiente" },
  aprobada:  { bg: "#EAF3DE", color: "#27500A", border: "#3B6D11", label: "✅ Aprobada"  },
  rechazada: { bg: "#FCEBEB", color: "#7B1A1A", border: "#E24B4A", label: "❌ Rechazada" },
};

function fmtDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("es-CL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function ModalRechazo({ onConfirm, onClose }) {
  const [motivo, setMotivo] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)",
      zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "white", borderRadius: 14, padding: 24,
        maxWidth: 380, width: "100%", boxShadow: "0 8px 32px rgba(0,0,0,.2)" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#1a365d", marginBottom: 12 }}>
          ❌ Rechazar solicitud
        </div>
        <textarea
          value={motivo} onChange={e => setMotivo(e.target.value)}
          placeholder="Motivo del rechazo (opcional)..."
          rows={3} autoFocus
          style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0",
            borderRadius: 8, fontSize: 13, resize: "none", boxSizing: "border-box",
            marginBottom: 14 }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 9,
            border: "1px solid #e2e8f0", background: "white", cursor: "pointer",
            fontSize: 13, color: "#718096" }}>Cancelar</button>
          <button onClick={() => onConfirm(motivo)} style={{ flex: 1, padding: "10px",
            borderRadius: 9, border: "none", background: "#e53e3e", color: "white",
            fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
            Rechazar
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalApprova({ solicitud, bodegaItems, onConfirm, onClose }) {
  // Mostra i materiali richiesti con lo stock disponibile
  const [procesando, setProcesando] = useState(false);

  const handleApprova = async () => {
    setProcesando(true);
    await onConfirm();
    setProcesando(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)",
      zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "white", borderRadius: 14, maxWidth: 480,
        width: "100%", boxShadow: "0 8px 32px rgba(0,0,0,.2)", overflow: "hidden" }}>
        <div style={{ background: "linear-gradient(135deg,#276749,#38a169)",
          padding: "16px 20px" }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "white" }}>
            ✅ Aprobar solicitud
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.75)", marginTop: 2 }}>
            {solicitud.proyectoNombre} · {solicitud.creadoPor}
          </div>
        </div>

        <div style={{ padding: "16px 20px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#4a5568", marginBottom: 10 }}>
            Materiales solicitados:
          </div>
          {(solicitud.items || []).map((item, i) => {
            const bodegaMatch = bodegaItems.find(b => b.id === item.itemId || b.nome === item.nombre);
            const stockOk = bodegaMatch ? bodegaMatch.giacenza >= item.cantidad : null;
            return (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 10px", borderRadius: 8, marginBottom: 6,
                background: "#f8fafc", border: "1px solid #e2e8f0",
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#2d3748" }}>{item.nombre}</div>
                  <div style={{ fontSize: 11, color: "#718096" }}>
                    {item.cantidad} {item.unidad}
                    {bodegaMatch && (
                      <span style={{ marginLeft: 8, color: stockOk ? "#276749" : "#c53030", fontWeight: 700 }}>
                        · Stock: {bodegaMatch.giacenza} {bodegaMatch.unita}
                        {!stockOk && " ⚠️ insuficiente"}
                      </span>
                    )}
                    {!bodegaMatch && <span style={{ marginLeft: 8, color: "#718096" }}> · No en bodega</span>}
                  </div>
                </div>
                {item.itemId && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#276749",
                    background: "#EAF3DE", padding: "2px 8px", borderRadius: 99 }}>
                    Se descontará del stock
                  </span>
                )}
              </div>
            );
          })}

          {solicitud.nota && (
            <div style={{ fontSize: 12, color: "#718096", fontStyle: "italic",
              marginTop: 8, padding: "6px 10px", background: "#f8fafc", borderRadius: 8 }}>
              💬 {solicitud.nota}
            </div>
          )}

          <div style={{ fontSize: 11, color: "#a0aec0", marginTop: 12 }}>
            Los items vinculados a la bodega se descontarán automáticamente del stock al aprobar.
          </div>
        </div>

        <div style={{ padding: "12px 20px", borderTop: "1px solid #e2e8f0",
          display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 9,
            border: "1px solid #e2e8f0", background: "white", cursor: "pointer",
            fontSize: 13, color: "#718096" }}>Cancelar</button>
          <button onClick={handleApprova} disabled={procesando} style={{
            flex: 2, padding: "10px", borderRadius: 9, border: "none",
            background: procesando ? "#e2e8f0" : "#276749",
            color: procesando ? "#a0aec0" : "white",
            fontWeight: 700, cursor: procesando ? "not-allowed" : "pointer", fontSize: 13,
          }}>
            {procesando ? "⏳ Aprobando..." : "✅ Confirmar aprobación"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PanelSolicitudes({
  solicitudes = [],
  loading = false,
  bodegaItems = [],
  onAprobar,      // (solicitudId, aprobadoPor) => Promise — approva + scarica stock
  onRechazar,     // (solicitudId, motivo, aprobadoPor) => Promise
  user,
  onMovimento,    // callback bodega per scaricare stock
}) {
  const [filter,          setFilter]          = useState("todas");
  const [modalAprobar,    setModalAprobar]    = useState(null); // solicitud obj
  const [modalRechazar,   setModalRechazar]   = useState(null); // solicitud id

  const filtered = solicitudes.filter(s =>
    filter === "todas" ? true : s.estado === filter
  );

  const pendientes = solicitudes.filter(s => s.estado === "pendiente").length;

  const handleAprobar = useCallback(async (solicitud) => {
    await onAprobar(solicitud.id, user?.email || "");
    // Scarica stock per ogni item con itemId
    if (onMovimento) {
      for (const item of (solicitud.items || [])) {
        if (item.itemId) {
          await onMovimento({
            itemId: item.itemId,
            tipo: "scarico",
            quantita: item.cantidad,
            nota: `Solicitud aprobada · ${solicitud.proyectoNombre}`,
          }).catch(() => {});
        }
      }
    }
    setModalAprobar(null);
  }, [onAprobar, onMovimento, user]);

  const handleRechazar = useCallback(async (solicitudId, motivo) => {
    await onRechazar(solicitudId, motivo, user?.email || "");
    setModalRechazar(null);
  }, [onRechazar, user]);

  if (loading) return (
    <div style={{ textAlign: "center", padding: 40, color: "#718096" }}>
      Cargando solicitudes...
    </div>
  );

  return (
    <div>
      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 16 }}>
        {[
          { l: "Pendientes", v: solicitudes.filter(s=>s.estado==="pendiente").length, c: "#BA7517", bg: "#FAEEDA" },
          { l: "Aprobadas",  v: solicitudes.filter(s=>s.estado==="aprobada").length,  c: "#276749", bg: "#EAF3DE" },
          { l: "Rechazadas", v: solicitudes.filter(s=>s.estado==="rechazada").length, c: "#c53030", bg: "#FCEBEB" },
        ].map(s => (
          <div key={s.l} style={{ background: s.bg, borderRadius: 10, padding: "10px",
            textAlign: "center", cursor: "pointer",
            border: `1px solid ${s.c}44`,
            outline: filter === s.l.toLowerCase() ? `2px solid ${s.c}` : "none",
          }} onClick={() => setFilter(filter === s.l.toLowerCase() ? "todas" : s.l.toLowerCase())}>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 11, color: s.c, fontWeight: 600 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px 0", color: "#a0aec0" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
          <div style={{ fontSize: 13 }}>
            {filter === "todas" ? "No hay solicitudes todavía" : `No hay solicitudes ${filter}s`}
          </div>
          <div style={{ fontSize: 11, marginTop: 4 }}>
            Los miembros del equipo pueden enviar solicitudes desde el proyecto
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(s => {
            const est = ESTADO_STYLE[s.estado] || ESTADO_STYLE.pendiente;
            return (
              <div key={s.id} style={{
                background: "white", borderRadius: 12, overflow: "hidden",
                border: `1px solid ${est.border}44`,
                borderLeft: `4px solid ${est.border}`,
              }}>
                {/* Header */}
                <div style={{ padding: "12px 14px", display: "flex",
                  justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1a365d", marginBottom: 2 }}>
                      {s.proyectoNombre || "Sin proyecto"}
                    </div>
                    <div style={{ fontSize: 11, color: "#718096" }}>
                      {s.creadoPor} · {fmtDate(s.creadoAt)}
                    </div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
                    background: est.bg, color: est.color, border: `1px solid ${est.border}44`,
                  }}>{est.label}</span>
                </div>

                {/* Items */}
                <div style={{ padding: "0 14px 10px" }}>
                  {(s.items || []).map((item, i) => {
                    const bodegaMatch = bodegaItems.find(b => b.id === item.itemId);
                    return (
                      <div key={i} style={{
                        display: "flex", justifyContent: "space-between",
                        padding: "5px 0", fontSize: 12, color: "#2d3748",
                        borderBottom: i < s.items.length-1 ? "1px solid #f0f4f8" : "none",
                      }}>
                        <span style={{ fontWeight: 500 }}>
                          {item.nombre}
                          {bodegaMatch && <span style={{ color: "#276749", marginLeft: 4, fontSize: 10 }}>📦</span>}
                        </span>
                        <span style={{ fontWeight: 700, color: "#1a365d" }}>
                          {item.cantidad} {item.unidad}
                        </span>
                      </div>
                    );
                  })}
                  {s.nota && (
                    <div style={{ fontSize: 11, color: "#718096", marginTop: 6,
                      fontStyle: "italic", background: "#f8fafc", padding: "4px 8px", borderRadius: 6 }}>
                      💬 {s.nota}
                    </div>
                  )}
                  {s.motivoRechazo && (
                    <div style={{ fontSize: 11, color: "#c53030", marginTop: 6,
                      background: "#fff5f5", padding: "4px 8px", borderRadius: 6 }}>
                      Motivo: {s.motivoRechazo}
                    </div>
                  )}
                </div>

                {/* Acciones — solo per pendientes */}
                {s.estado === "pendiente" && (
                  <div style={{ padding: "10px 14px", borderTop: "1px solid #f0f4f8",
                    display: "flex", gap: 8 }}>
                    <button onClick={() => setModalRechazar(s.id)} style={{
                      flex: 1, padding: "8px", borderRadius: 8,
                      border: "1px solid #fed7d7", background: "#fff5f5",
                      color: "#c53030", cursor: "pointer", fontSize: 12, fontWeight: 700,
                    }}>❌ Rechazar</button>
                    <button onClick={() => setModalAprobar(s)} style={{
                      flex: 2, padding: "8px", borderRadius: 8, border: "none",
                      background: "#276749", color: "white",
                      cursor: "pointer", fontSize: 12, fontWeight: 700,
                    }}>✅ Aprobar</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {modalAprobar && (
        <ModalApprova
          solicitud={modalAprobar}
          bodegaItems={bodegaItems}
          onConfirm={() => handleAprobar(modalAprobar)}
          onClose={() => setModalAprobar(null)}
        />
      )}
      {modalRechazar && (
        <ModalRechazo
          onConfirm={(motivo) => handleRechazar(modalRechazar, motivo)}
          onClose={() => setModalRechazar(null)}
        />
      )}
    </div>
  );
}
