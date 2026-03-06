// ─── components/tabs/TabDashboard.jsx ───────────────────────────────────────
import { useMemo } from "react";
import { BarChart, PieChart } from "../UI";
import { fmt } from "../../utils/helpers";
import { ESTADO_COLORS, ESTADO_BG, CAT_COLORS } from "../../utils/constants";
import { calcProjectTotal, calcProjectCostoReal } from "../../utils/helpers";

// Mini progress bar inline
function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ flex: 1, height: 7, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width .4s" }} />
    </div>
  );
}

export default function TabDashboard({ proyectos, partidas, cats, t, onOpenProject, onNewProject }) {

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
      facturacion: totalPrev,
      pendiente:   sent.reduce((s, p) => s + calcProjectTotal(p), 0),
      costoReal:   totalReal,
      margine:     totalPrev - totalReal,
      margineP:    totalPrev > 0 ? Math.round(((totalPrev - totalReal) / totalPrev) * 100) : 0,
    };
  }, [proyectos]);

  const convRate = dashStats.total > 0
    ? Math.round(dashStats.aceptados / dashStats.total * 100)
    : 0;

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

  const barData = [
    { label: t.aceptados,  value: dashStats.aceptados,  color: "#68d391" },
    { label: t.enviados,   value: dashStats.enviados,   color: "#63b3ed" },
    { label: t.borradores, value: dashStats.borradores, color: "#cbd5e0" },
    { label: t.rechazados, value: dashStats.rechazados, color: "#fc8181" },
  ];

  const pieData = useMemo(() => cats
    .map((cat, i) => ({
      label: cat,
      color: CAT_COLORS[i % CAT_COLORS.length],
      value: partidas.filter(p => p.cat === cat).reduce((s, p) => s + p.cant * p.pu, 0),
    }))
    .filter(d => d.value > 0), [cats, partidas]);

  const kpis = [
    { label: t.totalProy || "Total proyectos", value: dashStats.total,              icon: "📁", color: "#2b6cb0", bg: "#ebf8ff" },
    { label: t.aceptados,                       value: dashStats.aceptados,          icon: "✅", color: "#276749", bg: "#f0fff4" },
    { label: t.tasaConv,                         value: convRate + "%",              icon: "📈", color: "#c05621", bg: "#fffaf0" },
    { label: t.facturacion,                      value: fmt(dashStats.facturacion), icon: "💰", color: "#553c9a", bg: "#faf5ff" },
    { label: t.pendiente,                        value: fmt(dashStats.pendiente),   icon: "⏳", color: "#b7791f", bg: "#fffff0" },
  ];

  // Cashflow mensile: raggruppa i progetti accettati per mese di aggiornamento
  const cashflowMesi = useMemo(() => {
    const mappa = {};
    proyectos
      .filter(p => p.estado === "Aceptado" && p.updatedAt)
      .forEach(p => {
        const mese = p.updatedAt.slice(0, 7); // "2026-03"
        if (!mappa[mese]) mappa[mese] = { prev: 0, real: 0 };
        mappa[mese].prev += calcProjectTotal(p);
        mappa[mese].real += calcProjectCostoReal(p);
      });
    return Object.entries(mappa)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([mese, vals]) => ({ mese: mese.slice(5) + "/" + mese.slice(2, 4), ...vals }));
  }, [proyectos]);

  const maxCashflow = useMemo(() =>
    Math.max(...cashflowMesi.flatMap(m => [m.prev, m.real]), 1)
  , [cashflowMesi]);

  // Budget vs Reale per progetti recenti
  const proyBudgetReal = useMemo(() =>
    proyectos
      .filter(p => p.estado === "Aceptado")
      .slice(0, 6)
      .map(p => {
        const prev = calcProjectTotal(p);
        const real = calcProjectCostoReal(p);
        const diff = prev > 0 ? Math.round(((prev - real) / prev) * 100) : 0;
        return { id: p.id, cliente: p.info?.cliente || "—", prev, real, diff };
      })
  , [proyectos]);

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

      {/* ── SEZIONE FINANZIARIA ───────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg,#1a365d,#2d3748)", borderRadius: 12, padding: "18px 20px", color: "white" }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 14 }}>📊 Dashboard Finanziaria</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
          {[
            { label: "Fatturato totale",   value: fmt(dashStats.facturacion), icon: "💰", color: "#68d391" },
            { label: "Costo reale totale", value: fmt(dashStats.costoReal),   icon: "🔧", color: "#fc8181" },
            { label: "Margine netto",      value: fmt(dashStats.margine),     icon: "📈", color: dashStats.margine >= 0 ? "#68d391" : "#fc8181" },
            { label: "Margine %",          value: dashStats.margineP + "%",   icon: "🎯", color: dashStats.margineP >= 10 ? "#68d391" : "#fef08a" },
          ].map(({ label, value, icon, color }) => (
            <div key={label} style={{ background: "rgba(255,255,255,.1)", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 18 }}>{icon}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color, marginTop: 4 }}>{value}</div>
              <div style={{ fontSize: 10, color: "#a0aec0", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts + Lists */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>

        {/* Cashflow mensile */}
        <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#1a365d", marginBottom: 14 }}>📅 Cashflow ultimi 6 mesi</div>
          {cashflowMesi.length === 0
            ? <div style={{ textAlign: "center", color: "#a0aec0", padding: "25px 0", fontSize: 12 }}>Nessun progetto accettato</div>
            : cashflowMesi.map(m => (
              <div key={m.mese} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#2d3748" }}>{m.mese}</span>
                  <span style={{ fontSize: 10, color: "#718096" }}>{fmt(m.prev)}</span>
                </div>
                <div style={{ display: "flex", gap: 3, alignItems: "center", marginBottom: 2 }}>
                  <span style={{ fontSize: 9, color: "#553c9a", width: 48 }}>Prev.</span>
                  <MiniBar value={m.prev} max={maxCashflow} color="#805ad5" />
                </div>
                <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                  <span style={{ fontSize: 9, color: "#c53030", width: 48 }}>Reale</span>
                  <MiniBar value={m.real} max={maxCashflow} color={m.real <= m.prev ? "#68d391" : "#fc8181"} />
                </div>
              </div>
            ))
          }
          <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 10, color: "#718096" }}>
            <span><span style={{ color: "#805ad5" }}>■</span> Preventivato</span>
            <span><span style={{ color: "#48bb78" }}>■</span> Costo reale</span>
          </div>
        </div>

        {/* Budget vs Reale per progetto */}
        <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#1a365d", marginBottom: 14 }}>⚖️ Budget vs Reale per progetto</div>
          {proyBudgetReal.length === 0
            ? <div style={{ textAlign: "center", color: "#a0aec0", padding: "25px 0", fontSize: 12 }}>Nessun progetto accettato</div>
            : proyBudgetReal.map(p => (
              <div key={p.id} style={{ marginBottom: 11 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#2d3748", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.cliente}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: p.diff >= 0 ? "#276749" : "#c53030" }}>
                    {p.diff >= 0 ? "+" : ""}{p.diff}% margine
                  </span>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: "#718096", marginBottom: 2 }}>Preventivato: {fmt(p.prev)}</div>
                    <MiniBar value={p.prev} max={Math.max(p.prev, p.real) * 1.1} color="#805ad5" />
                  </div>
                </div>
                <div style={{ flex: 1, marginTop: 3 }}>
                  <div style={{ fontSize: 9, color: "#718096", marginBottom: 2 }}>Costo reale: {fmt(p.real)}</div>
                  <MiniBar value={p.real} max={Math.max(p.prev, p.real) * 1.1} color={p.real <= p.prev ? "#68d391" : "#fc8181"} />
                </div>
              </div>
            ))
          }
        </div>

        {/* Bar chart stati */}
        <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#1a365d", marginBottom: 12 }}>📊 {t.graficosEstados}</div>
          {proyectos.length === 0
            ? <div style={{ textAlign: "center", color: "#a0aec0", padding: "25px 0", fontSize: 13 }}>{t.noProy}</div>
            : <BarChart data={barData} />}
        </div>

        {/* Pie chart categorie */}
        <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#1a365d", marginBottom: 12 }}>🥧 {t.graficosCategorias}</div>
          {pieData.length === 0
            ? <div style={{ textAlign: "center", color: "#a0aec0", padding: "25px 0", fontSize: 13 }}>Sin datos de costos</div>
            : <PieChart data={pieData} />}
        </div>

        {/* Top clientes */}
        <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#1a365d", marginBottom: 10 }}>🏆 {t.topClientes}</div>
          {topClientes.length === 0
            ? <div style={{ color: "#a0aec0", fontSize: 12 }}>{t.sinProy}</div>
            : topClientes.map((c, i) => (
              <div key={c.nombre} style={{
                display: "flex", justifyContent: "space-between",
                padding: "7px 10px", borderRadius: 8,
                background: i === 0 ? "#f0fff4" : "#f7fafc", marginBottom: 5,
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#2d3748" }}>{i + 1}. {c.nombre}</span>
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
              role="button"
              tabIndex={0}
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
                background: ESTADO_BG[p.estado] || "#f7fafc",
                color: ESTADO_COLORS[p.estado] || "#718096",
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
