// ─── components/tabs/TabAgenda.jsx ───────────────────────────────────────────
// Agenda: Vista Mensile · Lista Cronológica · Gantt
// Muestra proyectos (inicio/fin/vencimiento), facturas y recordatorios manuales.

import { useState, useMemo, useCallback } from "react";

// ── Helpers de fecha ──────────────────────────────────────────────────────────
const toDate   = (s) => s ? new Date(s + "T00:00:00") : null;
const fmtDate  = (s) => s ? new Date(s + "T00:00:00").toLocaleDateString("es-CL") : "—";
const isoToday = () => new Date().toISOString().slice(0, 10);
const addDays  = (iso, d) => {
  const dt = new Date(iso + "T00:00:00");
  dt.setDate(dt.getDate() + d);
  return dt.toISOString().slice(0, 10);
};
const daysBetween = (a, b) => {
  const da = new Date(a + "T00:00:00"), db = new Date(b + "T00:00:00");
  return Math.round((db - da) / 86400000);
};
const monthKey = (y, m) => `${y}-${String(m + 1).padStart(2, "0")}`;

// ── Colores por tipo de evento ────────────────────────────────────────────────
const TIPO_COLOR = {
  proyecto:    { bg: "#ebf8ff", border: "#2b6cb0", text: "#1a365d", dot: "#2b6cb0" },
  vencimiento: { bg: "#fff5f5", border: "#c53030", text: "#742a2a", dot: "#e53e3e" },
  factura:     { bg: "#f0fff4", border: "#276749", text: "#1c4532", dot: "#38a169" },
  recordatorio:{ bg: "#fefcbf", border: "#b7791f", text: "#744210", dot: "#d69e2e" },
  fin:         { bg: "#faf5ff", border: "#553c9a", text: "#322659", dot: "#805ad5" },
};

const ESTADO_COLOR = {
  Activo:    "#276749",
  Pendiente: "#b7791f",
  Pausado:   "#718096",
  Finalizado:"#553c9a",
  Cancelado: "#c53030",
};

// ── Generador de eventos desde proyectos + facturas + recordatorios ───────────
function buildEvents(proyectos = [], fatture = [], recordatorios = []) {
  const events = [];

  proyectos.forEach((p) => {
    const info  = p.info || {};
    const id    = p.id || p.currentId;
    const label = info.cliente || info.descripcion || "Proyecto sin nombre";

    if (info.fechaInicio) {
      events.push({
        id:    `proy-start-${id}`,
        tipo:  "proyecto",
        fecha: info.fechaInicio,
        label: `🏗️ Inicio: ${label}`,
        sub:   info.descripcion || "",
        estado: p.estado,
        proyId: id,
        raw:    p,
      });
    }
    if (info.fechaTermino) {
      events.push({
        id:    `proy-end-${id}`,
        tipo:  "fin",
        fecha: info.fechaTermino,
        label: `🏁 Fin: ${label}`,
        sub:   info.descripcion || "",
        estado: p.estado,
        proyId: id,
        raw:    p,
      });
    }
    // Vencimiento preventivo
    if (info.fecha && p.validez) {
      const venc = addDays(info.fecha, p.validez || 30);
      events.push({
        id:    `proy-venc-${id}`,
        tipo:  "vencimiento",
        fecha: venc,
        label: `⏰ Vence preventivo: ${label}`,
        sub:   `Válido ${p.validez} días desde ${fmtDate(info.fecha)}`,
        estado: p.estado,
        proyId: id,
        raw:    p,
      });
    }
  });

  fatture.forEach((f) => {
    if (f.fechaVencimiento || f.fechaEmision) {
      const fecha = f.fechaVencimiento || addDays(f.fechaEmision, 30);
      events.push({
        id:    `fatt-${f.id}`,
        tipo:  "factura",
        fecha,
        label: `🧾 Factura: ${f.clienteNombre || f.proyectoId || "—"}`,
        sub:   `$${(f.total || 0).toLocaleString("es-CL")} · ${f.pagata ? "✅ Pagada" : "⏳ Pendiente"}`,
        pagata: f.pagata,
        raw:    f,
      });
    }
  });

  recordatorios.forEach((r) => {
    events.push({
      id:    `rec-${r.id}`,
      tipo:  "recordatorio",
      fecha: r.fecha,
      label: `📌 ${r.texto}`,
      sub:   r.nota || "",
      raw:    r,
      isRec: true,
    });
  });

  return events.sort((a, b) => (a.fecha > b.fecha ? 1 : -1));
}

// ── Dot de evento ─────────────────────────────────────────────────────────────
function EventDot({ event, onClick, compact = false }) {
  const c = TIPO_COLOR[event.tipo] || TIPO_COLOR.recordatorio;
  const today = isoToday();
  const isUrgent = event.fecha <= addDays(today, 3) && event.fecha >= today;
  const isPast   = event.fecha < today;

  return (
    <div
      onClick={() => onClick && onClick(event)}
      title={event.label}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: compact ? "2px 6px" : "5px 9px",
        background: isPast ? "#f7fafc" : c.bg,
        border: `1px solid ${isPast ? "#e2e8f0" : c.border}`,
        borderLeft: `3px solid ${isPast ? "#cbd5e0" : c.dot}`,
        borderRadius: 6, cursor: "pointer", marginBottom: 3,
        opacity: isPast ? 0.6 : 1,
        animation: isUrgent ? "pulse-urgent 2s infinite" : "none",
        transition: "transform .15s",
      }}
      onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"}
      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
    >
      <span style={{ fontSize: compact ? 9 : 10, fontWeight: 700, color: isPast ? "#a0aec0" : c.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: compact ? 110 : 200 }}>
        {event.label}
      </span>
      {isUrgent && <span style={{ fontSize: 8, background: "#e53e3e", color: "white", borderRadius: 99, padding: "1px 4px", flexShrink: 0 }}>HOY</span>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VISTA MENSILE
// ══════════════════════════════════════════════════════════════════════════════
function VistaMensile({ events, onEventClick, onDayClick }) {
  const today = isoToday();
  const [cur, setCur] = useState(() => {
    const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() };
  });

  const { y, m } = cur;
  const firstDay  = new Date(y, m, 1).getDay(); // 0=dom
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const startOffset = (firstDay + 6) % 7; // lun=0

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach(e => {
      if (!map[e.fecha]) map[e.fecha] = [];
      map[e.fecha].push(e);
    });
    return map;
  }, [events]);

  const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      {/* Nav mes */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <button onClick={() => setCur(c => { const nm = c.m === 0 ? 11 : c.m - 1; return { y: c.m === 0 ? c.y - 1 : c.y, m: nm }; })}
          style={{ padding: "7px 14px", background: "white", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 16 }}>‹</button>
        <div style={{ fontWeight: 800, fontSize: 16, color: "#1a365d" }}>{MONTHS[m]} {y}</div>
        <button onClick={() => setCur(c => { const nm = c.m === 11 ? 0 : c.m + 1; return { y: c.m === 11 ? c.y + 1 : c.y, m: nm }; })}
          style={{ padding: "7px 14px", background: "white", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 16 }}>›</button>
      </div>

      {/* Griglia */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#718096", padding: "6px 0" }}>{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const iso = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayEvents = eventsByDate[iso] || [];
          const isToday = iso === today;
          const hasPast = dayEvents.some(e => e.fecha < today);
          const hasUrgent = dayEvents.some(e => e.tipo === "vencimiento" && e.fecha <= addDays(today, 3) && e.fecha >= today);

          return (
            <div key={iso}
              onClick={() => onDayClick && onDayClick(iso, dayEvents)}
              style={{
                minHeight: 90, padding: 6, borderRadius: 9, cursor: dayEvents.length ? "pointer" : "default",
                background: isToday ? "#ebf8ff" : "white",
                border: `2px solid ${isToday ? "#2b6cb0" : hasUrgent ? "#e53e3e" : "#f0f4f8"}`,
                transition: "all .15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = isToday ? "#dbeafe" : "#f7fafc"}
              onMouseLeave={e => e.currentTarget.style.background = isToday ? "#ebf8ff" : "white"}
            >
              <div style={{ fontWeight: isToday ? 800 : 600, fontSize: 12, color: isToday ? "#2b6cb0" : "#2d3748", marginBottom: 4,
                background: isToday ? "#2b6cb0" : "transparent", color: isToday ? "white" : "#2d3748",
                borderRadius: isToday ? 99 : 0, width: isToday ? 22 : "auto", height: isToday ? 22 : "auto",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                {day}
              </div>
              {dayEvents.slice(0, 2).map(e => (
                <EventDot key={e.id} event={e} onClick={onEventClick} compact />
              ))}
              {dayEvents.length > 2 && (
                <div style={{ fontSize: 9, color: "#718096", fontWeight: 600 }}>+{dayEvents.length - 2} más</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VISTA LISTA
// ══════════════════════════════════════════════════════════════════════════════
function VistaLista({ events, onEventClick }) {
  const today = isoToday();
  const [filter, setFilter] = useState("todos");

  const filtered = useMemo(() => {
    let ev = [...events];
    if (filter === "proximos") ev = ev.filter(e => e.fecha >= today);
    if (filter === "pasados")  ev = ev.filter(e => e.fecha < today);
    if (filter === "urgentes") ev = ev.filter(e => e.fecha >= today && e.fecha <= addDays(today, 7));
    return ev;
  }, [events, filter, today]);

  // Agrupar por mes
  const byMonth = useMemo(() => {
    const map = {};
    filtered.forEach(e => {
      const mk = e.fecha.slice(0, 7);
      if (!map[mk]) map[mk] = [];
      map[mk].push(e);
    });
    return Object.entries(map).sort(([a], [b]) => a > b ? 1 : -1);
  }, [filtered]);

  const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const mLabel = (mk) => { const [y, m] = mk.split("-"); return `${MONTHS[parseInt(m) - 1]} ${y}`; };

  return (
    <div>
      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[["todos","Todos"],["proximos","Próximos"],["urgentes","Esta semana ⚡"],["pasados","Pasados"]].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            style={{ padding: "6px 14px", borderRadius: 99, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, transition: "all .15s",
              background: filter === k ? "#1a365d" : "white", color: filter === k ? "white" : "#718096",
              boxShadow: filter === k ? "0 2px 8px rgba(26,54,93,.3)" : "0 1px 3px rgba(0,0,0,.08)" }}>
            {l}
          </button>
        ))}
        <div style={{ marginLeft: "auto", fontSize: 12, color: "#718096", alignSelf: "center" }}>{filtered.length} eventos</div>
      </div>

      {byMonth.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 0", color: "#a0aec0" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📅</div>
          <div>Sin eventos en este rango</div>
        </div>
      ) : byMonth.map(([mk, evs]) => (
        <div key={mk} style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: "#1a365d", marginBottom: 8, paddingBottom: 5,
            borderBottom: "2px solid #ebf8ff", display: "flex", alignItems: "center", gap: 8 }}>
            📆 {mLabel(mk)}
            <span style={{ fontWeight: 400, fontSize: 11, color: "#a0aec0" }}>{evs.length} eventos</span>
          </div>
          {evs.map(e => {
            const c = TIPO_COLOR[e.tipo] || TIPO_COLOR.recordatorio;
            const isPast = e.fecha < today;
            const isToday2 = e.fecha === today;
            return (
              <div key={e.id} onClick={() => onEventClick(e)}
                style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 14px",
                  background: isPast ? "#f7fafc" : c.bg, borderRadius: 10, marginBottom: 6,
                  border: `1px solid ${isPast ? "#e2e8f0" : c.border}`,
                  borderLeft: `4px solid ${isPast ? "#cbd5e0" : c.dot}`,
                  cursor: "pointer", opacity: isPast ? 0.7 : 1, transition: "all .15s" }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateX(3px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "translateX(0)"}
              >
                <div style={{ textAlign: "center", minWidth: 40 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: isPast ? "#a0aec0" : c.dot, lineHeight: 1 }}>
                    {parseInt(e.fecha.slice(8))}
                  </div>
                  <div style={{ fontSize: 9, color: "#718096", textTransform: "uppercase" }}>
                    {["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"][new Date(e.fecha + "T00:00:00").getDay()]}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: isPast ? "#718096" : c.text }}>
                    {e.label}
                    {isToday2 && <span style={{ marginLeft: 6, fontSize: 9, background: "#e53e3e", color: "white", borderRadius: 99, padding: "1px 6px" }}>HOY</span>}
                  </div>
                  {e.sub && <div style={{ fontSize: 11, color: "#718096", marginTop: 2 }}>{e.sub}</div>}
                  {e.estado && <div style={{ marginTop: 3 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
                      background: (ESTADO_COLOR[e.estado] || "#718096") + "20",
                      color: ESTADO_COLOR[e.estado] || "#718096" }}>{e.estado}</span>
                  </div>}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VISTA GANTT
// ══════════════════════════════════════════════════════════════════════════════
function VistaGantt({ proyectos = [], onEventClick }) {
  const today = isoToday();

  // Proyectos con fechaInicio
  const rows = useMemo(() => {
    return proyectos
      .filter(p => p.info?.fechaInicio)
      .map(p => ({
        id:     p.id,
        label:  p.info?.cliente || p.info?.descripcion || "Sin nombre",
        desc:   p.info?.descripcion || "",
        inicio: p.info.fechaInicio,
        fin:    p.info?.fechaTermino || addDays(p.info.fechaInicio, 30),
        estado: p.estado || "Activo",
        raw:    p,
      }))
      .sort((a, b) => a.inicio > b.inicio ? 1 : -1);
  }, [proyectos]);

  // Rango del Gantt: min inicio → max fin (+ padding)
  const { rangeStart, rangeEnd, totalDays } = useMemo(() => {
    if (!rows.length) return { rangeStart: today, rangeEnd: addDays(today, 60), totalDays: 60 };
    const starts = rows.map(r => r.inicio);
    const ends   = rows.map(r => r.fin);
    const minS = starts.reduce((a, b) => a < b ? a : b);
    const maxE = ends.reduce((a, b) => a > b ? a : b);
    const rs = addDays(minS, -3);
    const re = addDays(maxE, 7);
    return { rangeStart: rs, rangeEnd: re, totalDays: daysBetween(rs, re) || 60 };
  }, [rows, today]);

  // Genera ticks per il header (ogni 7 giorni)
  const ticks = useMemo(() => {
    const t = [];
    let cur = rangeStart;
    while (cur <= rangeEnd) {
      t.push(cur);
      cur = addDays(cur, 7);
    }
    return t;
  }, [rangeStart, rangeEnd]);

  const pct = (iso) => Math.max(0, Math.min(100, (daysBetween(rangeStart, iso) / totalDays) * 100));
  const todayPct = pct(today);

  const MONTHS_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  if (!rows.length) return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: "#a0aec0", background: "white", borderRadius: 12 }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#2d3748", marginBottom: 6 }}>Sin proyectos con fechas</div>
      <div style={{ fontSize: 13 }}>Agrega <strong>Fecha inicio</strong> y <strong>Fecha término</strong> en la pestaña Proyecto para verlos aquí.</div>
    </div>
  );

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: 700 }}>
        {/* Header fechas */}
        <div style={{ display: "flex", marginBottom: 2 }}>
          <div style={{ width: 200, flexShrink: 0 }} />
          <div style={{ flex: 1, position: "relative", height: 28 }}>
            {ticks.map((t, i) => {
              const d = new Date(t + "T00:00:00");
              return (
                <div key={i} style={{ position: "absolute", left: `${pct(t)}%`, fontSize: 9, color: "#718096",
                  fontWeight: 600, transform: "translateX(-50%)", whiteSpace: "nowrap" }}>
                  {d.getDate()} {MONTHS_SHORT[d.getMonth()]}
                </div>
              );
            })}
          </div>
        </div>

        {/* Linea oggi */}
        <div style={{ display: "flex", position: "relative" }}>
          <div style={{ width: 200, flexShrink: 0 }} />
          <div style={{ flex: 1, position: "relative" }}>
            <div style={{ position: "absolute", left: `${todayPct}%`, top: 0, bottom: 0, width: 2,
              background: "#e53e3e", zIndex: 10, pointerEvents: "none" }}>
              <div style={{ position: "absolute", top: -16, left: "50%", transform: "translateX(-50%)",
                background: "#e53e3e", color: "white", fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 4, whiteSpace: "nowrap" }}>
                HOY
              </div>
            </div>
          </div>
        </div>

        {/* Righe progetti */}
        {rows.map((row, ri) => {
          const startPct = pct(row.inicio);
          const endPct   = pct(row.fin);
          const widthPct = Math.max(1, endPct - startPct);
          const color    = ESTADO_COLOR[row.estado] || "#2b6cb0";
          const isPast   = row.fin < today;
          const isActive = row.inicio <= today && row.fin >= today;

          // Calcola % avanzamento (giorni passati / durata totale)
          const durata   = daysBetween(row.inicio, row.fin) || 1;
          const passati  = Math.min(durata, Math.max(0, daysBetween(row.inicio, today)));
          const progPct  = Math.round((passati / durata) * 100);

          return (
            <div key={row.id} style={{ display: "flex", alignItems: "center", marginBottom: 8,
              background: ri % 2 === 0 ? "white" : "#f7fafc", borderRadius: 8, padding: "6px 0" }}>
              {/* Label */}
              <div style={{ width: 200, flexShrink: 0, paddingRight: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: "#1a365d", whiteSpace: "nowrap",
                  overflow: "hidden", textOverflow: "ellipsis" }} title={row.label}>{row.label}</div>
                <div style={{ fontSize: 10, color: "#718096" }}>{fmtDate(row.inicio)} → {fmtDate(row.fin)}</div>
                <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 99,
                  background: color + "20", color }}>{row.estado}</span>
              </div>

              {/* Barra Gantt */}
              <div style={{ flex: 1, position: "relative", height: 32 }}>
                {/* Background grid */}
                {ticks.map((t, i) => (
                  <div key={i} style={{ position: "absolute", left: `${pct(t)}%`, top: 0, bottom: 0,
                    width: 1, background: "#f0f4f8" }} />
                ))}
                {/* Barra principale */}
                <div
                  onClick={() => onEventClick && onEventClick({ tipo: "proyecto", label: row.label, fecha: row.inicio, raw: row.raw })}
                  style={{
                    position: "absolute",
                    left: `${startPct}%`,
                    width: `${widthPct}%`,
                    top: "50%",
                    transform: "translateY(-50%)",
                    height: 22,
                    borderRadius: 11,
                    background: isPast
                      ? "linear-gradient(90deg,#a0aec0,#718096)"
                      : `linear-gradient(90deg,${color},${color}cc)`,
                    boxShadow: isActive ? `0 2px 8px ${color}44` : "none",
                    cursor: "pointer",
                    overflow: "hidden",
                    border: isActive ? `2px solid ${color}` : "none",
                    transition: "transform .15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateY(-50%) scaleY(1.15)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "translateY(-50%) scaleY(1)"}
                  title={`${row.label}: ${fmtDate(row.inicio)} → ${fmtDate(row.fin)}`}
                >
                  {/* Barra progresso interna */}
                  <div style={{
                    position: "absolute", left: 0, top: 0, bottom: 0,
                    width: `${progPct}%`,
                    background: "rgba(255,255,255,0.25)",
                    borderRadius: "inherit",
                  }} />
                  {widthPct > 8 && (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center",
                      paddingLeft: 8, fontSize: 9, fontWeight: 700, color: "white",
                      whiteSpace: "nowrap", overflow: "hidden" }}>
                      {row.label}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Legenda */}
        <div style={{ display: "flex", gap: 14, marginTop: 16, flexWrap: "wrap" }}>
          {Object.entries(ESTADO_COLOR).map(([estado, color]) => (
            <div key={estado} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
              <span style={{ fontSize: 10, color: "#718096" }}>{estado}</span>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: "#a0aec0" }} />
            <span style={{ fontSize: 10, color: "#718096" }}>Finalizado/Pasado</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MODAL detalle evento + recordatorios
// ══════════════════════════════════════════════════════════════════════════════
function ModalEvento({ event, onClose, onOpenProject, onDelete }) {
  if (!event) return null;
  const c = TIPO_COLOR[event.tipo] || TIPO_COLOR.recordatorio;

  const handleGCal = () => {
    const dt = event.fecha.replace(/-/g, "");
    const title = encodeURIComponent(event.label);
    const detail = encodeURIComponent(event.sub || "");
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dt}/${dt}&details=${detail}`, "_blank");
  };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 3000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "white", borderRadius: 16, padding: 24, width: "100%", maxWidth: 420,
        boxShadow: "0 20px 60px rgba(0,0,0,.3)", borderTop: `4px solid ${c.dot}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1a365d", marginBottom: 4 }}>{event.label}</div>
            <div style={{ fontSize: 12, color: "#718096" }}>📅 {fmtDate(event.fecha)}</div>
          </div>
          <button onClick={onClose} style={{ background: "#f0f4f8", border: "none", borderRadius: 8,
            padding: "5px 10px", cursor: "pointer", fontWeight: 700, fontSize: 14, color: "#4a5568" }}>✕</button>
        </div>

        {event.sub && (
          <div style={{ padding: "10px 12px", background: c.bg, borderRadius: 9, marginBottom: 14,
            fontSize: 13, color: c.text, border: `1px solid ${c.border}` }}>
            {event.sub}
          </div>
        )}
        {event.estado && (
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
              background: (ESTADO_COLOR[event.estado] || "#718096") + "20",
              color: ESTADO_COLOR[event.estado] || "#718096" }}>{event.estado}</span>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {event.proyId && (
            <button onClick={() => { onOpenProject && onOpenProject(event.raw); onClose(); }}
              style={{ padding: "8px 14px", background: "#1a365d", color: "white", border: "none",
                borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
              📋 Abrir proyecto
            </button>
          )}
          <button onClick={handleGCal}
            style={{ padding: "8px 14px", background: "#4285F4", color: "white", border: "none",
              borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
            📅 Google Calendar
          </button>
          {event.isRec && (
            <button onClick={() => { onDelete && onDelete(event.raw.id); onClose(); }}
              style={{ padding: "8px 14px", background: "#fff5f5", color: "#c53030", border: "1px solid #fed7d7",
                borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
              🗑️ Eliminar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MODAL recordatorio nuevo
// ══════════════════════════════════════════════════════════════════════════════
function ModalRecordatorio({ onSave, onClose }) {
  const [texto, setTexto] = useState("");
  const [fecha, setFecha] = useState(isoToday());
  const [nota,  setNota]  = useState("");

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 3000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "white", borderRadius: 16, padding: 24, width: "100%", maxWidth: 400,
        boxShadow: "0 20px 60px rgba(0,0,0,.3)", borderTop: "4px solid #d69e2e" }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "#1a365d", marginBottom: 16 }}>📌 Nuevo recordatorio</div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#4a5568", display: "block", marginBottom: 5 }}>Descripción *</label>
          <input value={texto} onChange={e => setTexto(e.target.value)} placeholder="Ej: Llamar al cliente..."
            autoFocus
            style={{ width: "100%", padding: "9px 12px", border: "2px solid #e2e8f0", borderRadius: 8,
              fontSize: 13, boxSizing: "border-box", color: "#1a365d" }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#4a5568", display: "block", marginBottom: 5 }}>Fecha *</label>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
            style={{ width: "100%", padding: "9px 12px", border: "2px solid #e2e8f0", borderRadius: 8,
              fontSize: 13, boxSizing: "border-box", color: "#1a365d" }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: "#4a5568", display: "block", marginBottom: 5 }}>Nota (opcional)</label>
          <textarea value={nota} onChange={e => setNota(e.target.value)} placeholder="Detalles adicionales..."
            rows={2}
            style={{ width: "100%", padding: "9px 12px", border: "2px solid #e2e8f0", borderRadius: 8,
              fontSize: 13, boxSizing: "border-box", color: "#1a365d", resize: "vertical" }} />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose}
            style={{ flex: 1, padding: 10, background: "#f7fafc", border: "1px solid #e2e8f0",
              borderRadius: 9, cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#718096" }}>
            Cancelar
          </button>
          <button onClick={() => { if (!texto.trim() || !fecha) return; onSave({ texto: texto.trim(), fecha, nota, id: Date.now().toString() }); onClose(); }}
            disabled={!texto.trim() || !fecha}
            style={{ flex: 2, padding: 10, background: !texto.trim() ? "#f0f4f8" : "#1a365d",
              color: !texto.trim() ? "#a0aec0" : "white", border: "none",
              borderRadius: 9, cursor: texto.trim() ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 13 }}>
            💾 Guardar recordatorio
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MODAL día (click en celdilla)
// ══════════════════════════════════════════════════════════════════════════════
function ModalDia({ iso, events, onClose, onEventClick, onNewRec }) {
  if (!iso) return null;
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 3000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "white", borderRadius: 16, padding: 24, width: "100%", maxWidth: 380,
        boxShadow: "0 20px 60px rgba(0,0,0,.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#1a365d" }}>📅 {fmtDate(iso)}</div>
          <button onClick={onClose} style={{ background: "#f0f4f8", border: "none", borderRadius: 8,
            padding: "5px 10px", cursor: "pointer", fontWeight: 700, color: "#4a5568" }}>✕</button>
        </div>
        {events.length === 0 ? (
          <div style={{ color: "#a0aec0", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Sin eventos este día</div>
        ) : events.map(e => (
          <EventDot key={e.id} event={e} onClick={(ev) => { onClose(); onEventClick(ev); }} />
        ))}
        <button onClick={() => { onClose(); onNewRec(iso); }}
          style={{ width: "100%", marginTop: 12, padding: 9, background: "#fefcbf", border: "1px solid #d69e2e",
            borderRadius: 9, cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#744210" }}>
          📌 + Recordatorio este día
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPALE
// ══════════════════════════════════════════════════════════════════════════════
export default function TabAgenda({ proyectos = [], fatture = [], onOpenProject }) {
  const [vista, setVista] = useState("mensile");
  const [recordatorios, setRecordatorios] = useState(() => {
    try { return JSON.parse(localStorage.getItem("agenda_recordatorios") || "[]"); } catch { return []; }
  });
  const [modalEvent, setModalEvent]   = useState(null);
  const [showNewRec, setShowNewRec]   = useState(false);
  const [newRecDate, setNewRecDate]   = useState(null);
  const [modalDia, setModalDia]       = useState(null); // { iso, events }

  const events = useMemo(() => buildEvents(proyectos, fatture, recordatorios), [proyectos, fatture, recordatorios]);

  const today = isoToday();
  const urgentes = events.filter(e => e.fecha >= today && e.fecha <= addDays(today, 7));
  const proximos = events.filter(e => e.fecha >= today).slice(0, 3);

  const saveRec = useCallback((rec) => {
    const nuovi = [...recordatorios, rec];
    setRecordatorios(nuovi);
    localStorage.setItem("agenda_recordatorios", JSON.stringify(nuovi));
  }, [recordatorios]);

  const deleteRec = useCallback((id) => {
    const nuovi = recordatorios.filter(r => r.id !== id);
    setRecordatorios(nuovi);
    localStorage.setItem("agenda_recordatorios", JSON.stringify(nuovi));
  }, [recordatorios]);

  const handleDayClick = (iso, dayEvents) => {
    setModalDia({ iso, events: dayEvents });
  };

  const handleNewRecWithDate = (iso) => {
    setNewRecDate(iso);
    setShowNewRec(true);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <style>{`
        @keyframes pulse-urgent {
          0%, 100% { box-shadow: 0 0 0 0 rgba(229,62,62,.4); }
          50%       { box-shadow: 0 0 0 6px rgba(229,62,62,0); }
        }
      `}</style>

      {/* Modali */}
      {modalEvent && (
        <ModalEvento event={modalEvent} onClose={() => setModalEvent(null)}
          onOpenProject={onOpenProject} onDelete={deleteRec} />
      )}
      {showNewRec && (
        <ModalRecordatorio
          onSave={(rec) => { if (newRecDate) rec.fecha = newRecDate; saveRec(rec); setNewRecDate(null); }}
          onClose={() => { setShowNewRec(false); setNewRecDate(null); }}
        />
      )}
      {modalDia && (
        <ModalDia iso={modalDia.iso} events={modalDia.events}
          onClose={() => setModalDia(null)}
          onEventClick={setModalEvent}
          onNewRec={handleNewRecWithDate} />
      )}

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1a365d,#2b6cb0)", borderRadius: 12, padding: "18px 20px", color: "white",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 3 }}>📅 Agenda & Planificación</div>
          <div style={{ color: "rgba(255,255,255,.75)", fontSize: 12 }}>
            {events.length} eventos · {urgentes.length > 0 ? `⚡ ${urgentes.length} esta semana` : "Sin urgencias esta semana"}
          </div>
        </div>
        <button onClick={() => setShowNewRec(true)}
          style={{ padding: "9px 16px", background: "rgba(255,255,255,.15)", color: "white",
            border: "1px solid rgba(255,255,255,.3)", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
          📌 + Recordatorio
        </button>
      </div>

      {/* Alertas urgentes */}
      {urgentes.length > 0 && (
        <div style={{ background: "#fff5f5", borderRadius: 12, padding: "12px 16px",
          border: "1px solid #fed7d7", display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#c53030", marginBottom: 6 }}>
              Eventos esta semana ({urgentes.length})
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {urgentes.map(e => (
                <div key={e.id} onClick={() => setModalEvent(e)}
                  style={{ padding: "4px 10px", background: "white", border: "1px solid #fed7d7",
                    borderRadius: 7, fontSize: 11, cursor: "pointer", fontWeight: 600, color: "#c53030" }}>
                  {e.label} · {fmtDate(e.fecha)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Próximos eventos (sidebar rápida) */}
      {proximos.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 8 }}>
          {proximos.map(e => {
            const c = TIPO_COLOR[e.tipo] || TIPO_COLOR.recordatorio;
            return (
              <div key={e.id} onClick={() => setModalEvent(e)}
                style={{ padding: "10px 14px", background: c.bg, border: `1px solid ${c.border}`,
                  borderLeft: `4px solid ${c.dot}`, borderRadius: 10, cursor: "pointer" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: c.text, marginBottom: 2 }}>{e.label}</div>
                <div style={{ fontSize: 10, color: "#718096" }}>{fmtDate(e.fecha)}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab selector */}
      <div style={{ background: "white", borderRadius: 12, padding: "4px", display: "flex", gap: 4,
        boxShadow: "0 1px 4px rgba(0,0,0,.07)", width: "fit-content" }}>
        {[["mensile","📆 Mensual"],["lista","📋 Lista"],["gantt","📊 Gantt"]].map(([k, l]) => (
          <button key={k} onClick={() => setVista(k)}
            style={{ padding: "8px 16px", borderRadius: 9, border: "none", cursor: "pointer",
              fontWeight: 700, fontSize: 12, transition: "all .2s",
              background: vista === k ? "#1a365d" : "transparent",
              color: vista === k ? "white" : "#718096" }}>
            {l}
          </button>
        ))}
      </div>

      {/* Contenuto vista */}
      <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
        {vista === "mensile" && (
          <VistaMensile events={events} onEventClick={setModalEvent} onDayClick={handleDayClick} />
        )}
        {vista === "lista" && (
          <VistaLista events={events} onEventClick={setModalEvent} />
        )}
        {vista === "gantt" && (
          <VistaGantt proyectos={proyectos} onEventClick={setModalEvent} />
        )}
      </div>

      {/* Empty state generale */}
      {events.length === 0 && (
        <div style={{ textAlign: "center", padding: "30px 20px", color: "#a0aec0", background: "white",
          borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🗓️</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#2d3748", marginBottom: 6 }}>Sin eventos todavía</div>
          <div style={{ fontSize: 12 }}>Los eventos aparecen automáticamente desde tus proyectos y facturas. También puedes agregar recordatorios manuales.</div>
        </div>
      )}
    </div>
  );
}
