// ─── components/tabs/TabDashboard.jsx ───────────────────────────────────────
import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid,
} from "recharts";
import { fmt } from "../../utils/helpers";
import { ESTADO_COLORS, ESTADO_BG, CAT_COLORS } from "../../utils/constants";
import { calcProjectTotal, calcProjectCostoReal } from "../../utils/helpers";

// ── Mini progress bar ────────────────────────────────────────────────────────
function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ flex: 1, height: 7, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width .4s" }} />
    </div>
  );
}

// ── Tooltip revenue personalizzato ──────────────────────────────────────────
function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#1a365d", borderRadius: 10, padding: "10px 14px",
      boxShadow: "0 8px 24px rgba(0,0,0,.25)", border: "1px solid rgba(255,255,255,.1)",
    }}>
      <div style={{ color: "rgba(255,255,255,.7)", fontSize: 11, marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
          <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>{fmt(p.value)}</span>
          <span style={{ color: "rgba(255,255,255,.5)", fontSize: 10 }}>{p.name}</span>
        </div>
      ))}
    </div>
  );
}

// ── Tooltip pie personalizzato ───────────────────────────────────────────────
function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{
      background: "white", borderRadius: 10, padding: "9px 13px",
      boxShadow: "0 6px 20px rgba(0,0,0,.15)", border: `2px solid ${d.payload.color}`,
    }}>
      <div style={{ fontWeight: 800, fontSize: 13, color: "#1a365d" }}>{d.name}</div>
      <div style={{ fontSize: 12, color: d.payload.color, fontWeight: 700 }}>{d.value} proyectos</div>
      <div style={{ fontSize: 11, color: "#718096" }}>{d.payload.pct}% del total</div>
    </div>
  );
}

// ── Label personalizzata per pie ─────────────────────────────────────────────
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, value, name }) {
  if (value === 0) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      style={{ fontSize: 13, fontWeight: 800 }}>
      {value}
    </text>
  );
}

export default function TabDashboard({ proyectos, partidas, cats, t, onOpenProject, onNewProject }) {

  const [activeSlice, setActiveSlice] = useState(null);

  // ── Stats base ────────────────────────────────────────────────────────────
  const dashStats = useMemo(() => {
    const accepted = proyectos.filter(p => p.estado === "Aceptado");
    const sent     = proyectos.filter(p => p.estado === "Enviado");
    const totalPrev = accepted.reduce((s, p) => s + calcProjectTotal(p), 0);
    const totalReal = accepted.reduce((s, p) => s + calcProjectCostoReal(p), 0);
    return {
      total:       proyectos.length,
      aceptados:   accepted.length,
      enviados:    sent.length,
      borradores:  proyectos.filter(p => p.estado === "Borrador").length,
      rechazados:  proyectos.filter(p => p.estado === "Rechazado").length,
      activos:     proyectos.filter(p => p.estado === "Activo").length,
      facturacion: totalPrev,
      pendiente:   sent.reduce((s, p) => s + calcProjectTotal(p), 0),
      costoReal:   totalReal,
      margine:     totalPrev - totalReal,
      margineP:    totalPrev > 0 ? Math.round(((totalPrev - totalReal) / totalPrev) * 100) : 0,
    };
  }, [proyectos]);

  const convRate = dashStats.total > 0
    ? Math.round(dashStats.aceptados / dashStats.total * 100) : 0;

  // ── Revenue mensile (recharts) ────────────────────────────────────────────
  const revenueData = useMemo(() => {
    const mappa = {};
    proyectos
      .filter(p => p.estado === "Aceptado" && p.updatedAt)
      .forEach(p => {
        const mese = p.updatedAt.slice(0, 7);
        if (!mappa[mese]) mappa[mese] = { prev: 0, real: 0 };
        mappa[mese].prev += calcProjectTotal(p);
        mappa[mese].real += calcProjectCostoReal(p);
      });
    return Object.entries(mappa)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([mese, vals]) => ({
        mes: mese.slice(5) + "/" + mese.slice(2, 4),
        Presupuestado: Math.round(vals.prev),
        "Costo real": Math.round(vals.real),
        Margen: Math.round(vals.prev - vals.real),
      }));
  }, [proyectos]);

  // ── Pie chart stati ───────────────────────────────────────────────────────
  const STATI_CONFIG = [
    { key: "Aceptado",  color: "#48bb78", label: t.aceptados  || "Aceptado" },
    { key: "Enviado",   color: "#63b3ed", label: t.enviados   || "Enviado" },
    { key: "Borrador",  color: "#cbd5e0", label: t.borradores || "Borrador" },
    { key: "Rechazado", color: "#fc8181", label: t.rechazados || "Rechazado" },
    { key: "Activo",    color: "#f6ad55", label: t.activo     || "Activo" },
    { key: "Pausado",   color: "#b794f4", label: t.pausado    || "Pausado" },
    { key: "Finalizado",color: "#68d391", label: t.finalizado || "Finalizado" },
  ];

  const pieData = useMemo(() => {
    const total = proyectos.length || 1;
    return STATI_CONFIG
      .map(s => ({
        name:  s.label,
        value: proyectos.filter(p => p.estado === s.key).length,
        color: s.color,
        pct:   Math.round(proyectos.filter(p => p.estado === s.key).length / total * 100),
      }))
      .filter(d => d.value > 0);
  }, [proyectos]);

  // ── Top clientes ──────────────────────────────────────────────────────────
  const topClientes = useMemo(() => Object.values(
    proyectos
      .filter(p => p.estado === "Aceptado")
      .reduce((acc, p) => {
        const n = p.info?.cliente || t.sinNombre;
        if (!acc[n]) acc[n] = { nombre: n, total: 0 };
        acc[n].total += calcProjectTotal(p);
        return acc;
      }, {})
  ).sort((a, b) => b.total - a.total).slice(0, 4), [proyectos, t]);

  // ── Budget vs Reale ───────────────────────────────────────────────────────
  const proyBudgetReal = useMemo(() =>
    proyectos
      .filter(p => p.estado === "Aceptado")
      .slice(0, 5)
      .map(p => {
        const prev = calcProjectTotal(p);
        const real = calcProjectCostoReal(p);
        const diff = prev > 0 ? Math.round(((prev - real) / prev) * 100) : 0;
        return { id: p.id, cliente: p.info?.cliente || "—", prev, real, diff };
      })
  , [proyectos]);

  // ── KPI ───────────────────────────────────────────────────────────────────
  const kpis = [
    { label: t.totalProy || "Total proyectos", value: dashStats.total,              icon: "📁", color: "#2b6cb0", bg: "#ebf8ff" },
    { label: t.aceptados || "Aceptados",        value: dashStats.aceptados,          icon: "✅", color: "#276749", bg: "#f0fff4" },
    { label: t.tasaConv  || "Tasa conv.",        value: convRate + "%",              icon: "📈", color: "#c05621", bg: "#fffaf0" },
    { label: t.facturacion || "Facturación",     value: fmt(dashStats.facturacion), icon: "💰", color: "#553c9a", bg: "#faf5ff" },
    { label: t.pendiente || "Pendiente",         value: fmt(dashStats.pendiente),   icon: "⏳", color: "#b7791f", bg: "#fffff0" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
        {kpis.map(k => (
          <div key={k.label} style={{
            background: k.bg, border: `1px solid ${k.color}22`,
            borderRadius: 12, padding: "14px 16px",
          }}>
            <div style={{ fontSize: 20, marginBottom: 3 }}>{k.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 11, color: "#718096" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Dashboard Finanziaria */}
      <div style={{ background: "linear-gradient(135deg,#1a365d,#2d3748)", borderRadius: 12, padding: "18px 20px", color: "white" }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 14 }}>📊 Dashboard Financiero</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
          {[
            { label: "Facturación aceptada",   value: fmt(dashStats.facturacion), icon: "💰", color: "#68d391" },
            { label: "Costo real total", value: fmt(dashStats.costoReal),   icon: "🔧", color: "#fc8181" },
            { label: "Margen neto",      value: fmt(dashStats.margine),     icon: "📈", color: dashStats.margine >= 0 ? "#68d391" : "#fc8181" },
            { label: "Margen %",          value: dashStats.margineP + "%",   icon: "🎯", color: dashStats.margineP >= 10 ? "#68d391" : "#fef08a" },
          ].map(({ label, value, icon, color }) => (
            <div key={label} style={{ background: "rgba(255,255,255,.1)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 18 }}>{icon}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color, marginTop: 4 }}>{value}</div>
              <div style={{ fontSize: 10, color: "#a0aec0", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── GRAFICI RECHARTS ────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14 }}>

        {/* Revenue mensile — LineChart + BarChart */}
        <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.07)", gridColumn: "1 / -1" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#1a365d", marginBottom: 16 }}>
            📅 Ingresos mensuales — Presupuestado vs Costo real
          </div>
          {revenueData.length === 0 ? (
            <div style={{ textAlign: "center", color: "#a0aec0", padding: "30px 0", fontSize: 13 }}>
              Sin proyectos aceptados con fecha
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#718096" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#a0aec0" }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000000 ? (v / 1000000).toFixed(1) + "M" : v >= 1000 ? (v / 1000).toFixed(0) + "k" : v} />
                <Tooltip content={<RevenueTooltip />} cursor={{ fill: "rgba(26,54,93,.04)" }} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#718096", paddingTop: 8 }} />
                <Bar dataKey="Presupuestado" fill="#805ad5" radius={[5, 5, 0, 0]} maxBarSize={36} />
                <Bar dataKey="Costo real"  fill="#68d391" radius={[5, 5, 0, 0]} maxBarSize={36} />
                <Bar dataKey="Margen"      fill="#63b3ed" radius={[5, 5, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart stati — interattivo */}
        <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#1a365d", marginBottom: 4 }}>
            🥧 Proyectos por estado
          </div>
          <div style={{ fontSize: 11, color: "#a0aec0", marginBottom: 12 }}>Haz clic en un sector para ver detalles</div>
          {pieData.length === 0 ? (
            <div style={{ textAlign: "center", color: "#a0aec0", padding: "30px 0", fontSize: 13 }}>Sin proyectos</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    labelLine={false}
                    label={<PieLabel />}
                    onMouseEnter={(_, i) => setActiveSlice(i)}
                    onMouseLeave={() => setActiveSlice(null)}
                    onClick={(d) => setActiveSlice(activeSlice === pieData.indexOf(d) ? null : pieData.indexOf(d))}
                  >
                    {pieData.map((entry, i) => (
                      <Cell
                        key={entry.name}
                        fill={entry.color}
                        opacity={activeSlice === null || activeSlice === i ? 1 : 0.45}
                        stroke={activeSlice === i ? "white" : "none"}
                        strokeWidth={activeSlice === i ? 3 : 0}
                        style={{ cursor: "pointer", transition: "opacity .2s" }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Legenda custom */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {pieData.map((d, i) => (
                  <div
                    key={d.name}
                    onClick={() => setActiveSlice(activeSlice === i ? null : i)}
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "4px 10px", borderRadius: 99, cursor: "pointer",
                      background: activeSlice === i ? d.color + "22" : "#f7fafc",
                      border: `1.5px solid ${activeSlice === i ? d.color : "#e2e8f0"}`,
                      transition: "all .15s",
                    }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: activeSlice === i ? d.color : "#4a5568" }}>
                      {d.name}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: d.color }}>{d.value}</span>
                  </div>
                ))}
              </div>

              {/* Dettaglio slice attiva */}
              {activeSlice !== null && pieData[activeSlice] && (
                <div style={{
                  marginTop: 12, padding: "10px 14px",
                  background: pieData[activeSlice].color + "18",
                  borderRadius: 10, border: `1.5px solid ${pieData[activeSlice].color}44`,
                }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: pieData[activeSlice].color }}>
                    {pieData[activeSlice].name}
                  </div>
                  <div style={{ fontSize: 12, color: "#4a5568", marginTop: 3 }}>
                    <strong>{pieData[activeSlice].value}</strong> proyectos · <strong>{pieData[activeSlice].pct}%</strong> del total
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Budget vs Reale per progetto */}
        <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#1a365d", marginBottom: 14 }}>⚖️ Presupuesto vs Real por proyecto</div>
          {proyBudgetReal.length === 0
            ? <div style={{ textAlign: "center", color: "#a0aec0", padding: "25px 0", fontSize: 12 }}>Sin proyectos aceptados</div>
            : proyBudgetReal.map(p => (
              <div key={p.id} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#2d3748", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.cliente}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                    background: p.diff >= 0 ? "#f0fff4" : "#fff5f5",
                    color: p.diff >= 0 ? "#276749" : "#c53030" }}>
                    {p.diff >= 0 ? "+" : ""}{p.diff}%
                  </span>
                </div>
                <div style={{ fontSize: 9, color: "#718096", marginBottom: 2 }}>Presup. {fmt(p.prev)}</div>
                <MiniBar value={p.prev} max={Math.max(p.prev, p.real) * 1.1} color="#805ad5" />
                <div style={{ fontSize: 9, color: "#718096", margin: "4px 0 2px" }}>Real {fmt(p.real)}</div>
                <MiniBar value={p.real} max={Math.max(p.prev, p.real) * 1.1} color={p.real <= p.prev ? "#68d391" : "#fc8181"} />
              </div>
            ))
          }
        </div>

        {/* Top clientes */}
        <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#1a365d", marginBottom: 10 }}>🏆 {t.topClientes}</div>
          {topClientes.length === 0
            ? <div style={{ color: "#a0aec0", fontSize: 12 }}>{t.sinProy}</div>
            : topClientes.map((c, i) => (
              <div key={c.nombre} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 12px", borderRadius: 9,
                background: i === 0 ? "#f0fff4" : "#f7fafc",
                border: i === 0 ? "1px solid #9ae6b4" : "1px solid transparent",
                marginBottom: 6,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>{["🥇","🥈","🥉","4️⃣"][i] || (i+1)+"."}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#2d3748" }}>{c.nombre}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#276749" }}>{fmt(c.total)}</span>
              </div>
            ))
          }
        </div>

        {/* Attività recente */}
        <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#1a365d", marginBottom: 10 }}>🕐 {t.activReciente}</div>
          {proyectos.slice(0, 5).map(p => (
            <div
              key={p.id}
              onClick={() => onOpenProject(p)}
              role="button" tabIndex={0}
              onKeyDown={e => e.key === "Enter" && onOpenProject(p)}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "7px 10px", background: "#f7fafc", borderRadius: 8,
                cursor: "pointer", marginBottom: 5, transition: "background .15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#ebf8ff"}
              onMouseLeave={e => e.currentTarget.style.background = "#f7fafc"}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#2d3748" }}>{p.info?.cliente || t.sinNombre}</div>
                <div style={{ fontSize: 10, color: "#a0aec0" }}>{(p.updatedAt || "").slice(0, 10)}</div>
              </div>
              <span style={{
                padding: "2px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                background: ESTADO_BG[p.estado]    || "#f7fafc",
                color:      ESTADO_COLORS[p.estado] || "#718096",
              }}>
                {t[p.estado?.toLowerCase()] || p.estado}
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
