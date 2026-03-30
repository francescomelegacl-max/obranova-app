// ─── components/tabs/TabClientes.jsx v2 ──────────────────────────────────────
// CRM integrato ObraNova — versione migliorata.
// Novità v2:
//   • Drag & drop Kanban con highlight visivo colonna target
//   • Modal cliente completo: tabs Datos/Proyectos/Notas + fuente + tags
//   • Nova integrata: "Pregunta a Nova" con contesto cliente pre-caricato
//   • Auto-sync valorTotal dai proyectos reali
//   • Grafici pipeline: barra distribuzione + funnel valore
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback, useMemo } from "react";
import { useClientes, ESTADOS_CRM, ESTADO_LABELS, ESTADO_COLORS } from "../../hooks/useClientes";

const fmtCLP = (n) => n ? "$" + Math.round(n).toLocaleString("es-CL") : "—";

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ nombre, size = 36 }) {
  const initials = (nombre || "?").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const palettes = [
    ["#E6F1FB","#0C447C"],["#EAF3DE","#27500A"],
    ["#FAEEDA","#633806"],["#EEEDFE","#3C3489"],["#E1F5EE","#085041"],
  ];
  const [bg, fg] = palettes[(nombre?.charCodeAt(0) || 0) % palettes.length];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: bg, color: fg, display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: size * 0.33, fontWeight: 600 }}>
      {initials}
    </div>
  );
}

// ── Badge stato ───────────────────────────────────────────────────────────────
function EstadoBadge({ estado }) {
  const c = ESTADO_COLORS[estado] || { bg: "#f1f5f9", color: "#64748b" };
  return (
    <span style={{ display: "inline-block", fontSize: 11, fontWeight: 600,
      padding: "2px 8px", borderRadius: 20, background: c.bg, color: c.color }}>
      {ESTADO_LABELS[estado] || estado}
    </span>
  );
}

// ── Grafici pipeline ──────────────────────────────────────────────────────────
function PipelineCharts({ clientes }) {
  const byEstado = ESTADOS_CRM.map(e => ({
    estado: e,
    count:  clientes.filter(c => c.estado === e).length,
    valor:  clientes.filter(c => c.estado === e).reduce((s,c) => s + (parseFloat(c.valorTotal)||0), 0),
  }));
  const maxCount = Math.max(...byEstado.map(b => b.count), 1);
  const maxValor = Math.max(...byEstado.map(b => b.valor), 1);
  const total    = clientes.length;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
      <div style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#718096", marginBottom: 12 }}>
          Distribución por estado
        </div>
        {byEstado.map(b => {
          const c = ESTADO_COLORS[b.estado] || {};
          const pct = total > 0 ? Math.round((b.count / total) * 100) : 0;
          return (
            <div key={b.estado} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: "#4a5568" }}>{ESTADO_LABELS[b.estado]}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#1a365d" }}>
                  {b.count} · {pct}%
                </span>
              </div>
              <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 3, background: c.color || "#718096",
                  width: `${(b.count / maxCount) * 100}%`, transition: "width .4s ease" }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#718096", marginBottom: 12 }}>
          Valor por etapa (CLP)
        </div>
        {byEstado.filter(b => b.valor > 0).sort((a,b) => b.valor - a.valor).map(b => {
          const c = ESTADO_COLORS[b.estado] || {};
          return (
            <div key={b.estado} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: "#4a5568" }}>{ESTADO_LABELS[b.estado]}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#1a365d" }}>{fmtCLP(b.valor)}</span>
              </div>
              <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 3, background: c.color || "#718096",
                  width: `${(b.valor / maxValor) * 100}%`, transition: "width .4s ease" }} />
              </div>
            </div>
          );
        })}
        {byEstado.every(b => b.valor === 0) && (
          <div style={{ fontSize: 12, color: "#a0aec0", fontStyle: "italic" }}>
            Agrega valor estimado para ver el funnel.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Card Kanban ───────────────────────────────────────────────────────────────
function KanbanCard({ cliente, onClick, proyectos }) {
  const proyRelated = proyectos.filter(p =>
    (p.info?.cliente || p.cliente || "").toLowerCase().trim() ===
    (cliente.nombre || "").toLowerCase().trim()
  );
  const valorReal = proyRelated.reduce((s, p) => {
    const parts = Array.isArray(p.partidas) ? p.partidas : [];
    return s + parts.reduce((ss, x) => ss + (parseFloat(x.pu||0) * parseFloat(x.cant||1)), 0);
  }, 0);

  return (
    <div
      onClick={() => onClick(cliente)}
      draggable
      onDragStart={e => { e.stopPropagation(); e.dataTransfer.setData("clienteId", cliente.id); }}
      style={{ background: "white", border: "0.5px solid #e2e8f0",
        borderRadius: 10, padding: "10px 12px", marginBottom: 8,
        cursor: "grab", userSelect: "none" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,.08)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <Avatar nombre={cliente.nombre} size={28} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#1a202c",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {cliente.nombre}
          </div>
          {cliente.empresa && (
            <div style={{ fontSize: 11, color: "#718096",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {cliente.empresa}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#718096" }}>{cliente.ciudad || "—"}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#1a365d" }}>
          {fmtCLP(valorReal || cliente.valorTotal)}
        </span>
      </div>
      {proyRelated.length > 0 && (
        <div style={{ marginTop: 5, fontSize: 10, color: "#718096" }}>
          {proyRelated.length} proyecto{proyRelated.length > 1 ? "s" : ""}
        </div>
      )}
      {cliente.proximoContacto && new Date(cliente.proximoContacto) <= new Date() && (
        <div style={{ marginTop: 5, fontSize: 10, color: "#BA7517", fontWeight: 600 }}>
          ⚠ Follow-up pendiente
        </div>
      )}
    </div>
  );
}

// ── Colonna Kanban con highlight drag ─────────────────────────────────────────
function KanbanCol({ estado, clientes, onCardClick, onDrop, proyectos }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const c     = ESTADO_COLORS[estado] || {};
  const total = clientes.reduce((s, c) => s + (parseFloat(c.valorTotal)||0), 0);

  return (
    <div
      onDrop={e => { e.preventDefault(); setIsDragOver(false); onDrop(e, estado); }}
      onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      style={{
        background: isDragOver ? "#EBF5FB" : "#f8fafc",
        border: isDragOver ? "1.5px dashed #378ADD" : "1.5px solid transparent",
        borderRadius: 12, padding: 10, minWidth: 180, flex: 1, minHeight: 200,
        transition: "all .15s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px",
          borderRadius: 20, background: c.bg, color: c.color }}>
          {ESTADO_LABELS[estado]}
        </span>
        <span style={{ fontSize: 11, color: "#a0aec0" }}>{clientes.length}</span>
      </div>
      {total > 0 && (
        <div style={{ fontSize: 10, color: "#718096", marginBottom: 8, textAlign: "right" }}>
          {fmtCLP(total)}
        </div>
      )}
      {clientes.map(c => (
        <KanbanCard key={c.id} cliente={c} onClick={onCardClick} proyectos={proyectos} />
      ))}
    </div>
  );
}

// ── Modal cliente completo ─────────────────────────────────────────────────────
function ModalCliente({ cliente, onClose, onSave, onDelete, onAddNota,
  onNovaPregunta, isEmpresa, isPro, user, proyectos }) {
  const isNew = !cliente?.id || cliente?.derived;
  const [form, setForm] = useState({
    nombre:          cliente?.nombre          || "",
    empresa:         cliente?.empresa         || "",
    email:           cliente?.email           || "",
    telefono:        cliente?.telefono        || "",
    ciudad:          cliente?.ciudad          || "",
    estado:          cliente?.estado          || "lead",
    valorTotal:      cliente?.valorTotal      || "",
    proximoContacto: cliente?.proximoContacto || "",
    fuente:          cliente?.fuente          || "",
    tags:            cliente?.tags            || "",
    descripcion:     cliente?.descripcion     || "",
  });
  const [nota, setNota] = useState("");
  const [tab,  setTab]  = useState("datos");

  const proyRelated = proyectos.filter(p =>
    (p.info?.cliente || p.cliente || "").toLowerCase().trim() ===
    (form.nombre || "").toLowerCase().trim()
  );

  const handleSave = () => {
    if (!form.nombre.trim()) return;
    onSave({ ...form, valorTotal: parseFloat(form.valorTotal) || 0 });
    onClose();
  };

  const TABS = [
    { id: "datos",     label: "Datos" },
    { id: "proyectos", label: `Proyectos (${proyRelated.length})` },
    ...(isEmpresa && !isNew ? [{ id: "notas", label: `Notas (${(cliente?.notas||[]).length})` }] : []),
  ];

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.5)",
      zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{ background: "white", borderRadius: 16, width: "100%",
        maxWidth: 500, maxHeight: "88vh", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ padding: "18px 20px 0", display: "flex",
          justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar nombre={form.nombre || "?"} size={40} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#1a365d" }}>
                {isNew ? "Nuevo cliente" : cliente.nombre}
              </div>
              {!isNew && <EstadoBadge estado={cliente.estado} />}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {isPro && !isNew && (
              <button onClick={() => { onNovaPregunta(cliente); onClose(); }}
                title="Pregunta a Nova sobre este cliente"
                style={{ padding: "6px 10px", background: "#1a365d", color: "white",
                  border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4 }}>
                🤖 Nova
              </button>
            )}
            <button onClick={onClose} style={{ background: "none", border: "none",
              fontSize: 20, cursor: "pointer", color: "#a0aec0" }}>✕</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, padding: "12px 20px 0",
          borderBottom: "0.5px solid #e2e8f0", flexShrink: 0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "6px 12px", fontSize: 12, border: "none", background: "none",
              cursor: "pointer", fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? "#1a365d" : "#718096",
              borderBottom: tab === t.id ? "2px solid #1a365d" : "2px solid transparent",
              marginBottom: -1 }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>

          {/* Datos */}
          {tab === "datos" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                {[["nombre","Nombre *"],["empresa","Empresa"],["email","Email"],
                  ["telefono","Teléfono"],["ciudad","Ciudad"]].map(([f,l]) => (
                  <div key={f} style={{ gridColumn: f === "nombre" ? "1/-1" : undefined }}>
                    <div style={{ fontSize: 11, color: "#718096", marginBottom: 3 }}>{l}</div>
                    <input value={form[f]} onChange={e => setForm(p => ({...p,[f]:e.target.value}))}
                      readOnly={!isEmpresa && !isNew}
                      style={{ width: "100%", padding: "7px 10px", border: "1px solid #e2e8f0",
                        borderRadius: 8, fontSize: 13, boxSizing: "border-box",
                        background: isEmpresa || isNew ? "white" : "#f7fafc" }} />
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#718096", marginBottom: 3 }}>Estado</div>
                  <select value={form.estado} onChange={e => setForm(p => ({...p,estado:e.target.value}))}
                    style={{ width: "100%", padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13 }}>
                    {ESTADOS_CRM.map(s => <option key={s} value={s}>{ESTADO_LABELS[s]}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#718096", marginBottom: 3 }}>Valor estimado (CLP)</div>
                  <input type="number" value={form.valorTotal}
                    onChange={e => setForm(p => ({...p,valorTotal:e.target.value}))}
                    style={{ width: "100%", padding: "7px 10px", border: "1px solid #e2e8f0",
                      borderRadius: 8, fontSize: 13, boxSizing: "border-box" }} />
                </div>
              </div>
              {isEmpresa && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "#718096", marginBottom: 3 }}>Próximo contacto</div>
                      <input type="date" value={form.proximoContacto}
                        onChange={e => setForm(p => ({...p,proximoContacto:e.target.value}))}
                        style={{ width: "100%", padding: "7px 10px", border: "1px solid #e2e8f0",
                          borderRadius: 8, fontSize: 13, boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#718096", marginBottom: 3 }}>Fuente</div>
                      <select value={form.fuente} onChange={e => setForm(p => ({...p,fuente:e.target.value}))}
                        style={{ width: "100%", padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13 }}>
                        <option value="">— Sin especificar</option>
                        <option value="referido">Referido</option>
                        <option value="web">Web / Google</option>
                        <option value="instagram">Instagram</option>
                        <option value="whatsapp">WhatsApp directo</option>
                        <option value="obra">Vista en obra</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: "#718096", marginBottom: 3 }}>Tags (separados por coma)</div>
                    <input value={form.tags} onChange={e => setForm(p => ({...p,tags:e.target.value}))}
                      placeholder="ej: vip, zona norte, remodelación"
                      style={{ width: "100%", padding: "7px 10px", border: "1px solid #e2e8f0",
                        borderRadius: 8, fontSize: 13, boxSizing: "border-box" }} />
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: "#718096", marginBottom: 3 }}>Descripción / contexto</div>
                    <textarea value={form.descripcion} onChange={e => setForm(p => ({...p,descripcion:e.target.value}))}
                      rows={2} placeholder="Notas generales sobre el cliente..."
                      style={{ width: "100%", padding: "7px 10px", border: "1px solid #e2e8f0",
                        borderRadius: 8, fontSize: 13, resize: "none", boxSizing: "border-box" }} />
                  </div>
                </>
              )}
            </>
          )}

          {/* Proyectos */}
          {tab === "proyectos" && (
            <div>
              {proyRelated.length === 0 ? (
                <div style={{ padding: "20px 0", textAlign: "center", color: "#a0aec0", fontSize: 13 }}>
                  Sin proyectos asociados a este cliente.
                </div>
              ) : proyRelated.map((p, i) => {
                const parts = Array.isArray(p.partidas) ? p.partidas : [];
                const total = parts.reduce((s, x) => s + (parseFloat(x.pu||0) * parseFloat(x.cant||1)), 0);
                const estadoColors = { borrador:"#718096", enviado:"#378ADD",
                  aceptado:"#10b981", rechazado:"#E24B4A", pagado:"#8b5cf6" };
                return (
                  <div key={p.id || i} style={{ padding: "10px 0", borderBottom: "0.5px solid #f0f4f8" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a202c" }}>
                          {p.info?.descripcion || p.nombre || "Sin nombre"}
                        </div>
                        <div style={{ fontSize: 11, color: "#718096", marginTop: 2 }}>
                          {parts.length} partidas · {p.info?.ciudad || "—"}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#1a365d" }}>{fmtCLP(total)}</div>
                        <span style={{ fontSize: 10, fontWeight: 600, color: estadoColors[p.estado] || "#718096" }}>
                          {p.estado || "borrador"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {proyRelated.length > 0 && (
                <div style={{ marginTop: 12, padding: "10px 12px", background: "#f8fafc",
                  borderRadius: 8, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: "#718096" }}>Total acumulado</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1a365d" }}>
                    {fmtCLP(proyRelated.reduce((s,p) => {
                      const parts = Array.isArray(p.partidas) ? p.partidas : [];
                      return s + parts.reduce((ss,x) => ss + (parseFloat(x.pu||0)*parseFloat(x.cant||1)), 0);
                    }, 0))}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Notas */}
          {tab === "notas" && isEmpresa && !isNew && (
            <div>
              <div style={{ maxHeight: 220, overflowY: "auto", marginBottom: 12 }}>
                {(cliente.notas || []).length === 0 ? (
                  <div style={{ fontSize: 12, color: "#a0aec0", fontStyle: "italic", padding: "8px 0" }}>
                    Sin notas aún
                  </div>
                ) : [...(cliente.notas || [])].reverse().map((n, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#4a5568",
                    padding: "8px 0", borderBottom: "0.5px solid #f0f4f8" }}>
                    <span style={{ color: "#a0aec0", marginRight: 8, fontSize: 11 }}>{n.fecha?.slice(0,10)}</span>
                    {n.texto}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={nota} onChange={e => setNota(e.target.value)}
                  placeholder="Nueva nota de seguimiento..."
                  style={{ flex: 1, padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }}
                  onKeyDown={e => { if (e.key === "Enter" && nota.trim()) {
                    onAddNota(cliente.id, nota.trim(), user?.uid); setNota("");
                  }}} />
                <button onClick={() => { if (nota.trim()) { onAddNota(cliente.id, nota.trim(), user?.uid); setNota(""); } }}
                  style={{ padding: "7px 12px", background: "#1a365d", color: "white",
                    border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer" }}>+</button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px 16px", borderTop: "0.5px solid #e2e8f0",
          display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={handleSave} style={{ flex: 1, padding: "10px", background: "#1a365d",
            color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            {isNew ? "Guardar cliente" : "Actualizar"}
          </button>
          {!isNew && isEmpresa && (
            <button onClick={() => { onDelete(cliente.id); onClose(); }}
              style={{ padding: "10px 14px", background: "#fff5f5", color: "#c53030",
                border: "1px solid #fed7d7", borderRadius: 10, fontSize: 13, cursor: "pointer" }}>
              Eliminar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Componente principale ─────────────────────────────────────────────────────
export default function TabClientes({
  workspace, proyectos, plan, user,
  onPaywall, onToast, onAskNova,
}) {
  const isEmpresa = plan?.plan === "empresa";
  const isPro     = plan?.isPro;

  const {
    clientes, cargando, metriche,
    addCliente, updateCliente, deleteCliente, addNota, updateEstado, exportCSV,
  } = useClientes({ workspaceId: workspace?.id, proyectos, plan });

  const [vista,        setVista]        = useState(isEmpresa ? "kanban" : "lista");
  const [modalCliente, setModalCliente] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [busqueda,     setBusqueda]     = useState("");
  const [showCharts,   setShowCharts]   = useState(false);

  // Auto-sync valorTotal dai proyectos reali
  const clientesConValor = useMemo(() => clientes.map(c => {
    const rel = proyectos.filter(p =>
      (p.info?.cliente || p.cliente || "").toLowerCase().trim() ===
      (c.nombre || "").toLowerCase().trim()
    );
    if (!rel.length) return c;
    const valorReal = rel.reduce((s, p) => {
      const parts = Array.isArray(p.partidas) ? p.partidas : [];
      return s + parts.reduce((ss, x) => ss + (parseFloat(x.pu||0) * parseFloat(x.cant||1)), 0);
    }, 0);
    return valorReal > 0 ? { ...c, valorTotal: valorReal } : c;
  }), [clientes, proyectos]);

  const clientesFiltrati = clientesConValor.filter(c => {
    const matchEstado   = filtroEstado === "todos" || c.estado === filtroEstado;
    const matchBusqueda = !busqueda || [c.nombre, c.empresa, c.ciudad, c.tags].some(
      v => v?.toLowerCase().includes(busqueda.toLowerCase())
    );
    return matchEstado && matchBusqueda;
  });

  const canAddCliente = isEmpresa || (isPro && clientes.filter(c => !c.derived).length < 10);

  const handleSaveCliente = useCallback(async (data) => {
    if (!isPro) { onPaywall("crmEmpresa"); return; }
    if (modalCliente === "new" || modalCliente?.derived) {
      await addCliente(data); onToast?.("✅ Cliente guardado");
    } else {
      await updateCliente(modalCliente.id, data); onToast?.("✅ Cliente actualizado");
    }
  }, [modalCliente, addCliente, updateCliente, isPro, onPaywall, onToast]);

  const handleDeleteCliente = useCallback(async (id) => {
    await deleteCliente(id); onToast?.("🗑️ Cliente eliminado");
  }, [deleteCliente, onToast]);

  const handleDrop = useCallback(async (e, nuevoEstado) => {
    if (!isEmpresa) { onPaywall("crmEmpresa"); return; }
    const clienteId = e.dataTransfer.getData("clienteId");
    if (!clienteId) return;
    await updateEstado(clienteId, nuevoEstado);
    onToast?.(`Estado → ${ESTADO_LABELS[nuevoEstado]}`);
  }, [isEmpresa, updateEstado, onPaywall, onToast]);

  // Nova: invia messaggio con contesto cliente
  const handleNovaPregunta = useCallback((cliente) => {
    const rel = proyectos.filter(p =>
      (p.info?.cliente || p.cliente || "").toLowerCase().trim() ===
      (cliente.nombre || "").toLowerCase().trim()
    );
    const msg = `Analiza este cliente: ${cliente.nombre}${cliente.empresa ? ` (${cliente.empresa})` : ""}, ciudad ${cliente.ciudad || "—"}, estado ${ESTADO_LABELS[cliente.estado]}, valor ${fmtCLP(cliente.valorTotal)}. Tiene ${rel.length} proyecto(s). ¿Qué estrategia recomiendas para cerrar?`;
    onAskNova?.(msg);
  }, [proyectos, onAskNova]);

  if (cargando) return (
    <div style={{ display: "flex", justifyContent: "center", padding: 60, color: "#a0aec0" }}>
      Cargando clientes...
    </div>
  );

  return (
    <div style={{ padding: "20px 24px", maxWidth: 1100, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1a365d" }}>Clientes</div>
          {isEmpresa && <span style={{ fontSize: 10, background: "#EEEDFE", color: "#3C3489",
            padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>Empresa</span>}
          {isPro && !isEmpresa && <span style={{ fontSize: 10, background: "#E6F1FB", color: "#0C447C",
            padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>Pro · lista</span>}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {isEmpresa && (
            <>
              <button onClick={() => setShowCharts(s => !s)} style={{
                padding: "6px 12px", fontSize: 12, border: "0.5px solid #e2e8f0",
                borderRadius: 8, background: showCharts ? "#EBF5FB" : "white",
                color: showCharts ? "#185FA5" : "#718096", cursor: "pointer" }}>
                📊 Gráficos
              </button>
              <div style={{ display: "flex", border: "0.5px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
                {["kanban","lista"].map(v => (
                  <button key={v} onClick={() => setVista(v)} style={{
                    padding: "6px 14px", fontSize: 12, cursor: "pointer", border: "none",
                    background: vista === v ? "#1a365d" : "white",
                    color: vista === v ? "white" : "#718096",
                    fontWeight: vista === v ? 600 : 400 }}>
                    {v === "kanban" ? "Pipeline" : "Lista"}
                  </button>
                ))}
              </div>
              <button onClick={exportCSV} style={{ padding: "6px 12px", fontSize: 12,
                border: "0.5px solid #e2e8f0", borderRadius: 8, background: "white",
                color: "#718096", cursor: "pointer" }}>↓ CSV</button>
            </>
          )}
          {!isEmpresa && (
            <button onClick={() => onPaywall("crmEmpresa")} style={{ padding: "6px 12px",
              fontSize: 12, border: "0.5px solid #e2e8f0", borderRadius: 8,
              background: "white", color: "#a0aec0", cursor: "pointer" }}>↓ CSV 🔒</button>
          )}
          <button onClick={() => {
            if (!isPro) { onPaywall("crmEmpresa"); return; }
            if (!canAddCliente) { onPaywall("crmEmpresa"); return; }
            setModalCliente("new");
          }} style={{ padding: "6px 16px", fontSize: 13, fontWeight: 600,
            background: "#1a365d", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
            + Cliente
          </button>
        </div>
      </div>

      {/* Paywall Free */}
      {!isPro && (
        <div style={{ background: "linear-gradient(135deg,#ebf8ff,#bee3f8)",
          border: "1px solid #90cdf4", borderRadius: 12, padding: "14px 18px", marginBottom: 20,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#2a4365" }}>
              🏢 CRM completo — plan Empresa
            </div>
            <div style={{ fontSize: 12, color: "#2c5282", marginTop: 2 }}>
              Pipeline Kanban, seguimiento, notas, gráficos y export CSV.
            </div>
          </div>
          <button onClick={() => onPaywall("crmEmpresa")} style={{ padding: "8px 16px",
            background: "#1a365d", color: "white", border: "none", borderRadius: 8,
            fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
            Ver planes →
          </button>
        </div>
      )}

      {/* Metriche */}
      {isEmpresa && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))",
          gap: 10, marginBottom: 16 }}>
          {[
            { label: "Pipeline total",      value: fmtCLP(metriche.pipeline),    sub: `${metriche.total} clientes` },
            { label: "Tasa conversión",      value: metriche.conversion + "%",    sub: `${metriche.cerrados} cerrados` },
            { label: "Ticket medio",         value: fmtCLP(metriche.ticketMedio), sub: "clientes cerrados" },
            { label: "Follow-up pendientes", value: metriche.followUpPendientes,
              sub: metriche.followUpPendientes > 0 ? "⚠ atención" : "Al día ✓",
              subColor: metriche.followUpPendientes > 0 ? "#BA7517" : "#27500A" },
          ].map((m, i) => (
            <div key={i} style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 11, color: "#718096", marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 20, fontWeight: 600, color: "#1a365d" }}>{m.value}</div>
              <div style={{ fontSize: 11, color: m.subColor || "#a0aec0", marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Grafici */}
      {isEmpresa && showCharts && <PipelineCharts clientes={clientesConValor} />}

      {/* Filtri */}
      {(vista === "lista" || !isEmpresa) && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar cliente, empresa, ciudad, tag..."
            style={{ flex: 1, minWidth: 160, padding: "7px 12px",
              border: "0.5px solid #e2e8f0", borderRadius: 8, fontSize: 13 }} />
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
            style={{ padding: "7px 10px", border: "0.5px solid #e2e8f0", borderRadius: 8, fontSize: 13 }}>
            <option value="todos">Todos los estados</option>
            {ESTADOS_CRM.map(s => <option key={s} value={s}>{ESTADO_LABELS[s]}</option>)}
          </select>
        </div>
      )}

      {/* Kanban */}
      {vista === "kanban" && isEmpresa && (
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 8 }}>
          {ESTADOS_CRM.map(estado => (
            <KanbanCol key={estado} estado={estado}
              clientes={clientesConValor.filter(c => c.estado === estado)}
              onCardClick={setModalCliente}
              onDrop={handleDrop}
              proyectos={proyectos} />
          ))}
        </div>
      )}

      {/* Lista */}
      {(vista === "lista" || !isEmpresa) && (
        <div style={{ background: "white", border: "0.5px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
          {clientesFiltrati.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#a0aec0", fontSize: 13 }}>
              {clientes.length === 0
                ? "Sin clientes aún — los proyectos con cliente aparecen automáticamente."
                : "Sin resultados para este filtro."}
            </div>
          ) : clientesFiltrati.map((c, i) => (
            <div key={c.id || i} onClick={() => setModalCliente(c)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                cursor: "pointer", borderBottom: i < clientesFiltrati.length - 1 ? "0.5px solid #f0f4f8" : "none" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
              onMouseLeave={e => e.currentTarget.style.background = "white"}>
              <Avatar nombre={c.nombre} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1a202c" }}>{c.nombre}</div>
                <div style={{ fontSize: 11, color: "#718096" }}>
                  {[c.empresa, c.ciudad].filter(Boolean).join(" · ") || "Sin datos adicionales"}
                  {c.tags && <span style={{ marginLeft: 6, color: "#a0aec0" }}>· {c.tags}</span>}
                </div>
              </div>
              {c.proximoContacto && new Date(c.proximoContacto) <= new Date() && (
                <span style={{ fontSize: 10, color: "#BA7517", fontWeight: 600 }}>⚠ Follow-up</span>
              )}
              <EstadoBadge estado={c.estado} />
              <div style={{ fontSize: 12, fontWeight: 600, color: "#1a365d", minWidth: 70, textAlign: "right" }}>
                {fmtCLP(c.valorTotal)}
              </div>
              {!isPro && <span style={{ fontSize: 14, color: "#cbd5e0" }}>🔒</span>}
            </div>
          ))}
        </div>
      )}

      {/* Pro limit */}
      {isPro && !isEmpresa && clientes.filter(c => !c.derived).length >= 10 && (
        <div style={{ marginTop: 12, fontSize: 12, color: "#718096", textAlign: "center" }}>
          Límite de 10 clientes Pro.{" "}
          <span style={{ color: "#553c9a", cursor: "pointer", fontWeight: 600 }}
            onClick={() => onPaywall("crmEmpresa")}>Pasa a Empresa →</span>
        </div>
      )}

      {/* Modal */}
      {modalCliente && (
        <ModalCliente
          cliente={modalCliente === "new" ? null : modalCliente}
          onClose={() => setModalCliente(null)}
          onSave={handleSaveCliente}
          onDelete={handleDeleteCliente}
          onAddNota={addNota}
          onNovaPregunta={handleNovaPregunta}
          isEmpresa={isEmpresa}
          isPro={isPro}
          user={user}
          proyectos={proyectos}
        />
      )}
    </div>
  );
}
