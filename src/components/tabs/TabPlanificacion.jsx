// ─── components/tabs/TabPlanificacion.jsx ────────────────────────────────────
// Planificación — Piano Empresa only.
// Vista Kanban (Trello-style) + Gantt avanzato con task per proyecto.
// Accessibile da App.jsx solo se workspace.plan === "empresa".
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo, useCallback, useRef } from "react";
import { useTasks, TASK_ESTADOS, TASK_ESTADO_CONFIG, TASK_PRIORIDAD_CONFIG } from "../../hooks/useTasks";

// ── Helpers ───────────────────────────────────────────────────────────────────
const toIso   = (s) => s ? new Date(s + "T00:00:00") : null;
const fmtDate = (s) => s ? new Date(s + "T00:00:00").toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit" }) : "—";
const isoToday = () => new Date().toISOString().slice(0, 10);
const addDays  = (iso, d) => { const dt = new Date(iso + "T00:00:00"); dt.setDate(dt.getDate() + d); return dt.toISOString().slice(0, 10); };
const daysBetween = (a, b) => Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000);

const PRIORIDAD_COLOR = { alta: "#c53030", media: "#b7791f", baja: "#276749" };
const MEMBER_COLORS = ["#2b6cb0","#276749","#c05621","#553c9a","#b7791f","#2c7a7b"];

function memberColor(uid) {
  const hash = (uid || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return MEMBER_COLORS[hash % MEMBER_COLORS.length];
}

function Avatar({ nombre, uid, size = 28 }) {
  const initials = (nombre || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div title={nombre} style={{
      width: size, height: size, borderRadius: "50%",
      background: memberColor(uid),
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 800, color: "white", flexShrink: 0,
    }}>{initials}</div>
  );
}

// ── Modal crea/edita task ─────────────────────────────────────────────────────
function ModalTask({ task, members = [], cats = [], proyectos = [], onSave, onDelete, onClose }) {
  const isNew = !task?.id;
  const [form, setForm] = useState({
    titulo:         task?.titulo         || "",
    descripcion:    task?.descripcion    || "",
    estado:         task?.estado         || "todo",
    prioridad:      task?.prioridad      || "media",
    asignadoA:      task?.asignadoA      || "",
    asignadoNombre: task?.asignadoNombre || "",
    categoria:      task?.categoria      || "",
    fechaInicio:    task?.fechaInicio    || "",
    fechaFin:       task?.fechaFin       || "",
    id:             task?.id             || null,
  });
  const [saving, setSaving] = useState(false);

  const u = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.titulo.trim()) { alert("El título es obligatorio"); return; }
    setSaving(true);
    try { await onSave(form); onClose(); }
    catch (e) { alert("Error: " + e.message); }
    finally { setSaving(false); }
  };

  const inputStyle = { width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#1a365d", boxSizing: "border-box" };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: "#4a5568", display: "block", marginBottom: 4 };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.25)" }}>

        {/* Header */}
        <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: "#1a365d" }}>
            {isNew ? "➕ Nueva tarea" : "✏️ Editar tarea"}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#718096" }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 22px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Título */}
          <div>
            <label style={labelStyle}>Título *</label>
            <input value={form.titulo} onChange={e => u("titulo", e.target.value)}
              placeholder="Ej: Instalar cerámica baño principal"
              style={inputStyle} autoFocus maxLength={100} />
          </div>

          {/* Estado + Prioridad */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={labelStyle}>Estado</label>
              <select value={form.estado} onChange={e => u("estado", e.target.value)} style={inputStyle}>
                {TASK_ESTADOS.map(s => (
                  <option key={s} value={s}>{TASK_ESTADO_CONFIG[s].icon} {TASK_ESTADO_CONFIG[s].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Prioridad</label>
              <select value={form.prioridad} onChange={e => u("prioridad", e.target.value)} style={inputStyle}>
                {Object.entries(TASK_PRIORIDAD_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Asignado + Categoría */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={labelStyle}>Asignado a</label>
              <select value={form.asignadoA} onChange={e => {
                const m = members.find(x => x.uid === e.target.value);
                u("asignadoA", e.target.value);
                u("asignadoNombre", m?.displayName || m?.email || "");
              }} style={inputStyle}>
                <option value="">Sin asignar</option>
                {members.map(m => (
                  <option key={m.uid} value={m.uid}>{m.displayName || m.email}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Categoría</label>
              <select value={form.categoria} onChange={e => u("categoria", e.target.value)} style={inputStyle}>
                <option value="">Sin categoría</option>
                {cats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Fechas */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={labelStyle}>Fecha inicio</label>
              <input type="date" value={form.fechaInicio} onChange={e => u("fechaInicio", e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Fecha fin</label>
              <input type="date" value={form.fechaFin} onChange={e => u("fechaFin", e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label style={labelStyle}>Descripción (opcional)</label>
            <textarea value={form.descripcion} onChange={e => u("descripcion", e.target.value)}
              placeholder="Detalles, materiales necesarios, instrucciones..."
              rows={3} style={{ ...inputStyle, resize: "vertical" }} maxLength={500} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 22px 18px", borderTop: "1px solid #e2e8f0", display: "flex", gap: 8 }}>
          {!isNew && (
            <button onClick={() => { onDelete(form.id); onClose(); }}
              style={{ padding: "8px 14px", borderRadius: 9, border: "1px solid #fed7d7", background: "#fff5f5", color: "#c53030", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
              🗑 Eliminar
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{ padding: "8px 18px", borderRadius: 9, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: 13, color: "#718096" }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving || !form.titulo.trim()}
            style={{ padding: "8px 22px", borderRadius: 9, border: "none", background: saving || !form.titulo.trim() ? "#e2e8f0" : "#1a365d", color: saving || !form.titulo.trim() ? "#a0aec0" : "white", fontWeight: 800, fontSize: 13, cursor: saving || !form.titulo.trim() ? "not-allowed" : "pointer" }}>
            {saving ? "⏳" : isNew ? "➕ Crear tarea" : "💾 Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tarjeta Kanban ────────────────────────────────────────────────────────────
function TaskCard({ task, onEdit, onDragStart, isDragging }) {
  const ec = TASK_ESTADO_CONFIG[task.estado] || TASK_ESTADO_CONFIG.todo;
  const pc = TASK_PRIORIDAD_CONFIG[task.prioridad] || TASK_PRIORIDAD_CONFIG.media;
  const today = isoToday();
  const isOverdue = task.fechaFin && task.fechaFin < today && task.estado !== "listo";

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={() => onEdit(task)}
      style={{
        background: "white", borderRadius: 10, padding: "12px 14px",
        boxShadow: isDragging ? "0 8px 24px rgba(0,0,0,.2)" : "0 1px 4px rgba(0,0,0,.08)",
        border: `1px solid ${isOverdue ? "#fed7d7" : "#e2e8f0"}`,
        borderLeft: `3px solid ${PRIORIDAD_COLOR[task.prioridad] || "#718096"}`,
        cursor: "grab", opacity: isDragging ? 0.5 : 1,
        transition: "box-shadow .15s, transform .15s",
        marginBottom: 8,
      }}
      onMouseEnter={e => { if (!isDragging) e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
    >
      {/* Título + prioridad */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6, marginBottom: 6 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#1a365d", lineHeight: 1.4, flex: 1 }}>
          {task.titulo}
        </div>
        <span title={pc.label} style={{ fontSize: 12, flexShrink: 0 }}>{pc.icon}</span>
      </div>

      {/* Categoria */}
      {task.categoria && (
        <div style={{ fontSize: 10, fontWeight: 700, color: "#2b6cb0", background: "#ebf8ff", borderRadius: 4, padding: "1px 7px", display: "inline-block", marginBottom: 6 }}>
          {task.categoria}
        </div>
      )}

      {/* Descripción preview */}
      {task.descripcion && (
        <div style={{ fontSize: 11, color: "#718096", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {task.descripcion}
        </div>
      )}

      {/* Footer: fecha + avatar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
        <div style={{ fontSize: 10, color: isOverdue ? "#c53030" : "#a0aec0", fontWeight: isOverdue ? 700 : 400 }}>
          {task.fechaFin ? (isOverdue ? `⚠️ Vencida ${fmtDate(task.fechaFin)}` : `📅 ${fmtDate(task.fechaFin)}`) : ""}
        </div>
        {task.asignadoA && (
          <Avatar nombre={task.asignadoNombre} uid={task.asignadoA} size={22} />
        )}
      </div>
    </div>
  );
}

// ── Vista Kanban ──────────────────────────────────────────────────────────────
function VistaKanban({ tasks, members, cats, onNewTask, onEditTask, onDeleteTask, onUpdateEstado }) {
  const [dragTaskId, setDragTaskId] = useState(null);
  const [dragOver,   setDragOver]   = useState(null);

  const byEstado = useMemo(() => {
    const map = {};
    TASK_ESTADOS.forEach(s => { map[s] = []; });
    tasks.forEach(t => { if (map[t.estado]) map[t.estado].push(t); });
    return map;
  }, [tasks]);

  const handleDrop = async (estado) => {
    if (dragTaskId && estado) {
      await onUpdateEstado(dragTaskId, estado);
    }
    setDragTaskId(null);
    setDragOver(null);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, alignItems: "start" }}>
      {TASK_ESTADOS.map(estado => {
        const ec = TASK_ESTADO_CONFIG[estado];
        const col = byEstado[estado] || [];
        const isOver = dragOver === estado;

        return (
          <div key={estado}
            onDragOver={e => { e.preventDefault(); setDragOver(estado); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={() => handleDrop(estado)}
            style={{
              background: isOver ? ec.bg : "#f7fafc",
              borderRadius: 12, padding: 12,
              border: `2px dashed ${isOver ? ec.color : "transparent"}`,
              minHeight: 200, transition: "all .15s",
            }}>

            {/* Column header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14, color: ec.color }}>{ec.icon}</span>
                <span style={{ fontWeight: 800, fontSize: 13, color: ec.color }}>{ec.label}</span>
                <span style={{ fontSize: 11, background: ec.bg, color: ec.color, borderRadius: 99, padding: "1px 7px", border: `1px solid ${ec.color}33`, fontWeight: 700 }}>
                  {col.length}
                </span>
              </div>
              <button onClick={() => onNewTask(estado)}
                style={{ background: "none", border: "none", cursor: "pointer", color: ec.color, fontSize: 18, padding: 2, lineHeight: 1 }}
                title="Nueva tarea">＋</button>
            </div>

            {/* Cards */}
            {col.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: "#a0aec0", fontSize: 11 }}>
                Arrastra tareas aquí
              </div>
            ) : col.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEditTask}
                isDragging={dragTaskId === task.id}
                onDragStart={() => setDragTaskId(task.id)}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ── Vista Gantt Tasks ─────────────────────────────────────────────────────────
function VistaGanttTasks({ tasks, members }) {
  const today = isoToday();
  const [zoom, setZoom] = useState("month");

  const rows = useMemo(() =>
    tasks.filter(t => t.fechaInicio).sort((a, b) => a.fechaInicio > b.fechaInicio ? 1 : -1),
    [tasks]
  );

  const { rangeStart, rangeEnd, totalDays, tickInterval } = useMemo(() => {
    if (!rows.length) {
      const rs = addDays(today, -3);
      const re = addDays(today, zoom === "week" ? 21 : zoom === "month" ? 45 : 90);
      return { rangeStart: rs, rangeEnd: re, totalDays: daysBetween(rs, re) || 1, tickInterval: zoom === "week" ? 1 : 7 };
    }
    const starts = rows.map(r => r.fechaInicio);
    const ends   = rows.filter(r => r.fechaFin).map(r => r.fechaFin);
    const minS   = starts.reduce((a, b) => a < b ? a : b);
    const maxE   = ends.length ? ends.reduce((a, b) => a > b ? a : b) : addDays(minS, 30);
    const pad    = zoom === "week" ? 3 : 7;
    const rs     = addDays(minS, -pad);
    const re     = addDays(maxE, pad);
    return { rangeStart: rs, rangeEnd: re, totalDays: daysBetween(rs, re) || 1, tickInterval: zoom === "week" ? 1 : 7 };
  }, [rows, zoom, today]);

  const ticks = useMemo(() => {
    const t = []; let cur = rangeStart;
    while (cur <= rangeEnd) { t.push(cur); cur = addDays(cur, tickInterval); }
    return t;
  }, [rangeStart, rangeEnd, tickInterval]);

  const pct = (iso) => Math.max(0, Math.min(100, (daysBetween(rangeStart, iso) / totalDays) * 100));
  const todayPct = pct(today);
  const MONTHS_S = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const LABEL_W = 200;

  if (!rows.length) return (
    <div style={{ textAlign: "center", padding: 32, color: "#a0aec0" }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
      <div style={{ fontSize: 13 }}>Agrega fechas a las tareas para verlas en el Gantt.</div>
    </div>
  );

  return (
    <div>
      {/* Zoom */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {[["week","Semana"],["month","Mes"],["quarter","Trimestre"]].map(([k,l]) => (
          <button key={k} onClick={() => setZoom(k)} style={{
            padding: "5px 12px", borderRadius: 7, border: "none", cursor: "pointer",
            fontWeight: 700, fontSize: 11,
            background: zoom === k ? "#1a365d" : "#f0f4f8",
            color: zoom === k ? "white" : "#718096",
          }}>{l}</button>
        ))}
      </div>

      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 600 }}>
          {/* Header */}
          <div style={{ display: "flex", marginBottom: 4 }}>
            <div style={{ width: LABEL_W, flexShrink: 0 }} />
            <div style={{ flex: 1, position: "relative", height: 24, background: "#f7fafc", borderRadius: "6px 6px 0 0" }}>
              {ticks.map((t, i) => {
                const d = new Date(t + "T00:00:00");
                return (
                  <div key={i} style={{ position: "absolute", left: `${pct(t)}%`, fontSize: 9, color: "#718096", fontWeight: 600, transform: "translateX(-50%)", top: "50%", marginTop: -6, whiteSpace: "nowrap" }}>
                    {d.getDate()} {MONTHS_S[d.getMonth()]}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rows */}
          {rows.map((task, ri) => {
            const ec = TASK_ESTADO_CONFIG[task.estado] || TASK_ESTADO_CONFIG.todo;
            const pc = TASK_PRIORIDAD_CONFIG[task.prioridad] || TASK_PRIORIDAD_CONFIG.media;
            const fin = task.fechaFin || addDays(task.fechaInicio, 1);
            const startP = pct(task.fechaInicio);
            const widthP = Math.max(0.5, pct(fin) - startP);
            const isOverdue = fin < today && task.estado !== "listo";

            return (
              <div key={task.id} style={{ display: "flex", alignItems: "center", background: ri % 2 === 0 ? "white" : "#fafafa", borderRadius: 6, marginBottom: 3, minHeight: 36 }}>
                {/* Label */}
                <div style={{ width: LABEL_W, flexShrink: 0, paddingRight: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11 }}>{pc.icon}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#1a365d", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{task.titulo}</div>
                    {task.asignadoA && (
                      <div style={{ fontSize: 9, color: "#718096" }}>{task.asignadoNombre}</div>
                    )}
                  </div>
                </div>

                {/* Barra */}
                <div style={{ flex: 1, position: "relative", height: 28 }}>
                  {ticks.map((t, i) => (
                    <div key={i} style={{ position: "absolute", left: `${pct(t)}%`, top: 0, bottom: 0, width: 1, background: "#f0f4f8" }} />
                  ))}
                  <div style={{ position: "absolute", left: `${todayPct}%`, top: 0, bottom: 0, width: 2, background: "#e53e3e", opacity: 0.6, zIndex: 5 }} />
                  <div style={{
                    position: "absolute", left: `${startP}%`, width: `${widthP}%`,
                    top: "50%", transform: "translateY(-50%)", height: 18, borderRadius: 9,
                    background: task.estado === "listo"
                      ? "linear-gradient(90deg,#276749,#38a169)"
                      : isOverdue
                        ? "linear-gradient(90deg,#c53030,#e53e3e)"
                        : `linear-gradient(90deg,${ec.color}cc,${ec.color}88)`,
                    overflow: "hidden",
                  }}
                    title={`${task.titulo} · ${fmtDate(task.fechaInicio)} → ${fmtDate(fin)}`}
                  >
                    {widthP > 6 && (
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", paddingLeft: 6, fontSize: 9, fontWeight: 700, color: "white", whiteSpace: "nowrap", overflow: "hidden" }}>
                        {task.titulo}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* HOY label */}
          <div style={{ display: "flex", marginTop: 4 }}>
            <div style={{ width: LABEL_W, flexShrink: 0 }} />
            <div style={{ flex: 1, position: "relative", height: 16 }}>
              <div style={{ position: "absolute", left: `${todayPct}%`, transform: "translateX(-50%)", fontSize: 9, fontWeight: 700, color: "#e53e3e" }}>▲ HOY</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPALE
// ══════════════════════════════════════════════════════════════════════════════
export default function TabPlanificacion({
  workspaceId,
  proyectos = [],
  members   = [],
  cats      = [],
  user,
  myRole    = "member",
  onPaywall,
  isEmpresa = false,
  proyState = null,    // dati progetto attivo — per cronograma AI
  onAskNova = null,    // apre Nova con messaggio pre-caricato
}) {
  const [vistaGlobal,   setVistaGlobal]   = useState("kanban"); // "kanban" | "gantt"
  const [proyectoActivo, setProyectoActivo] = useState(null);   // id del proyecto selezionato
  const [modalTask,     setModalTask]     = useState(null);     // null | task object | "new"
  const [newEstado,     setNewEstado]     = useState("todo");
  const [filterMember,  setFilterMember]  = useState("");
  const [filterEstado,  setFilterEstado]  = useState("");
  const [cronogramaLoading, setCronogramaLoading] = useState(false);

  const proyectoSeleccionado = proyectos.find(p => p.id === proyectoActivo) || proyectos[0];
  const proyId = proyectoSeleccionado?.id || null;

  // ── Cronograma automático AI ───────────────────────────────────────────────
  const handleCronograma = () => {
    if (!onAskNova) return;
    const info     = proyState?.info     || proyectoSeleccionado?.info || {};
    const partidas = proyState?.partidas || proyectoSeleccionado?.partidas || [];
    const cats     = [...new Set(partidas.map(p => p.cat).filter(Boolean))];
    const plazo    = proyState?.plazo    || proyectoSeleccionado?.plazo || 30;
    const desc     = info.descripcion || proyectoSeleccionado?.nombre || "este proyecto";

    const msg = `/cronograma ${desc} — ${plazo} días hábiles — categorías: ${cats.join(", ") || "Obra Gruesa, Terminaciones"} — genera un cronograma de obra con fases, fechas de inicio/fin y tareas específicas para cada etapa.`;
    onAskNova(msg);
  };

  const { tasks, loading, saveTask, updateTaskEstado, deleteTask } = useTasks({
    workspaceId,
    proyectoId: proyId,
  });

  // ── Paywall ────────────────────────────────────────────────────────────────
  if (!isEmpresa) {
    return (
      <div style={{ padding: 24, maxWidth: 560, margin: "0 auto" }}>
        <div style={{ background: "linear-gradient(135deg,#553c9a,#2b6cb0)", borderRadius: 16, padding: 32, textAlign: "center", color: "white" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🗂️</div>
          <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>Planificación de equipo</div>
          <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 20, lineHeight: 1.6 }}>
            Kanban + Gantt de tareas con asignación por miembro. Ideal para equipos de 2-5 personas.<br />
            Disponible en el plan <strong>Empresa</strong>.
          </div>
          <button onClick={() => onPaywall?.("multiUsuario")}
            style={{ background: "white", color: "#553c9a", border: "none", borderRadius: 10, padding: "12px 28px", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
            🚀 Activar Plan Empresa
          </button>
        </div>
      </div>
    );
  }

  // ── Filtra tasks ───────────────────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    let t = [...tasks];
    if (filterMember) t = t.filter(x => x.asignadoA === filterMember);
    if (filterEstado)  t = t.filter(x => x.estado === filterEstado);
    return t;
  }, [tasks, filterMember, filterEstado]);

  // ── KPI summary ────────────────────────────────────────────────────────────
  const kpi = useMemo(() => ({
    total:    tasks.length,
    todo:     tasks.filter(t => t.estado === "todo").length,
    en_curso: tasks.filter(t => t.estado === "en_curso").length,
    listo:    tasks.filter(t => t.estado === "listo").length,
    vencidas: tasks.filter(t => t.fechaFin && t.fechaFin < isoToday() && t.estado !== "listo").length,
  }), [tasks]);

  const handleNewTask = (estado = "todo") => {
    setNewEstado(estado);
    setModalTask({ estado });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Modal */}
      {modalTask && (
        <ModalTask
          task={modalTask.id ? modalTask : { estado: newEstado }}
          members={members}
          cats={cats}
          proyectos={proyectos}
          onSave={saveTask}
          onDelete={deleteTask}
          onClose={() => setModalTask(null)}
        />
      )}

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#553c9a,#2b6cb0)", borderRadius: 12, padding: "18px 20px", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 3 }}>🗂️ Planificación del equipo</div>
          <div style={{ color: "rgba(255,255,255,.75)", fontSize: 12 }}>
            {kpi.total} tareas · {kpi.en_curso} en curso · {kpi.vencidas > 0 ? `⚠️ ${kpi.vencidas} vencidas` : "Sin vencimientos"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {/* Cronograma AI */}
          {onAskNova && (
            <button
              onClick={handleCronograma}
              title="Nova genera un cronograma de obra automático"
              style={{
                padding: "9px 14px", background: "rgba(214,158,46,.25)",
                color: "#d69e2e", border: "1px solid rgba(214,158,46,.5)",
                borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 12,
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              🤖 Cronograma AI
            </button>
          )}
          <button onClick={() => handleNewTask()}
            style={{ padding: "9px 18px", background: "rgba(255,255,255,.2)", color: "white", border: "1px solid rgba(255,255,255,.35)", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
            ➕ Nueva tarea
          </button>
        </div>
      </div>

      {/* Selector proyecto */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#4a5568" }}>Proyecto:</span>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {proyectos.filter(p => !["Finalizado","Rechazado"].includes(p.estado)).map(p => (
            <button key={p.id} onClick={() => setProyectoActivo(p.id)}
              style={{
                padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                fontWeight: 700, fontSize: 11, transition: "all .15s",
                background: proyectoActivo === p.id || (!proyectoActivo && p.id === proyectos[0]?.id) ? "#1a365d" : "#f0f4f8",
                color: proyectoActivo === p.id || (!proyectoActivo && p.id === proyectos[0]?.id) ? "white" : "#718096",
              }}>
              {p.info?.cliente || p.info?.descripcion || p.id.slice(-6)}
            </button>
          ))}
        </div>
      </div>

      {/* KPI bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        {[
          { l: "Por hacer",  v: kpi.todo,     c: "#718096", bg: "#f7fafc" },
          { l: "En curso",   v: kpi.en_curso,  c: "#b7791f", bg: "#fffbeb" },
          { l: "Listo",      v: kpi.listo,     c: "#276749", bg: "#f0fff4" },
          { l: "⚠️ Vencidas", v: kpi.vencidas, c: "#c53030", bg: "#fff5f5" },
        ].map((k, i) => (
          <div key={i} style={{ background: k.bg, borderRadius: 10, padding: "10px 14px", border: `1px solid ${k.c}22` }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: k.c }}>{k.v}</div>
            <div style={{ fontSize: 11, color: k.c, fontWeight: 600 }}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* Filtri + vista toggle */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        {/* Vista */}
        <div style={{ display: "flex", background: "#f0f4f8", borderRadius: 9, padding: 3, gap: 2 }}>
          {[["kanban","🗂️ Kanban"],["gantt","📊 Gantt"]].map(([k, l]) => (
            <button key={k} onClick={() => setVistaGlobal(k)} style={{
              padding: "6px 14px", borderRadius: 7, border: "none", cursor: "pointer",
              fontWeight: 700, fontSize: 12, transition: "all .15s",
              background: vistaGlobal === k ? "#1a365d" : "transparent",
              color: vistaGlobal === k ? "white" : "#718096",
            }}>{l}</button>
          ))}
        </div>

        {/* Filtro membro */}
        <select value={filterMember} onChange={e => setFilterMember(e.target.value)}
          style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, color: "#2d3748" }}>
          <option value="">👥 Todos los miembros</option>
          {members.map(m => (
            <option key={m.uid} value={m.uid}>{m.displayName || m.email}</option>
          ))}
        </select>

        {/* Filtro estado */}
        <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)}
          style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, color: "#2d3748" }}>
          <option value="">Todos los estados</option>
          {TASK_ESTADOS.map(s => (
            <option key={s} value={s}>{TASK_ESTADO_CONFIG[s].icon} {TASK_ESTADO_CONFIG[s].label}</option>
          ))}
        </select>

        <div style={{ marginLeft: "auto", fontSize: 12, color: "#718096" }}>
          {filteredTasks.length} tarea{filteredTasks.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Content */}
      <div style={{ background: "white", borderRadius: 12, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,.07)", minHeight: 300 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 32, color: "#a0aec0" }}>Cargando tareas...</div>
        ) : vistaGlobal === "kanban" ? (
          <VistaKanban
            tasks={filteredTasks}
            members={members}
            cats={cats}
            onNewTask={handleNewTask}
            onEditTask={setModalTask}
            onDeleteTask={deleteTask}
            onUpdateEstado={updateTaskEstado}
          />
        ) : (
          <VistaGanttTasks tasks={filteredTasks} members={members} />
        )}
      </div>

      {/* Empty state */}
      {!loading && tasks.length === 0 && (
        <div style={{ textAlign: "center", padding: "20px", color: "#a0aec0", background: "white", borderRadius: 12 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🗂️</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#2d3748", marginBottom: 6 }}>Sin tareas todavía</div>
          <div style={{ fontSize: 12, marginBottom: 14 }}>Crea la primera tarea para este proyecto y asígnala a un miembro del equipo.</div>
          <button onClick={() => handleNewTask()}
            style={{ padding: "10px 22px", background: "#1a365d", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
            ➕ Crear primera tarea
          </button>
        </div>
      )}
    </div>
  );
}
