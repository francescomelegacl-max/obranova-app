// ─── components/tabs/TabResumen.jsx ──────────────────────────────────────────
import { useMemo } from "react";
import { PieChart } from "../UI";
import { fmt, fmtPct, calcTotals } from "../../utils/helpers";
import { CAT_COLORS } from "../../utils/constants";

export default function TabResumen({ partidas, pct, cats, iva, t }) {
  const totals = useMemo(() => calcTotals(partidas, pct), [partidas, pct]);
  const { cd, ci, gf, imprevistos: imprev, sub, util, total, iva: ivaAmt, totalIva } = totals;
  const margen = total > 0 ? (util / total) * 100 : 0;

  const pieData = useMemo(() => cats
    .map((cat, i) => ({
      label: cat, color: CAT_COLORS[i % CAT_COLORS.length],
      value: partidas.filter(p => p.cat === cat).reduce((s, p) => s + p.cant * p.pu, 0),
    }))
    .filter(d => d.value > 0), [cats, partidas]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
      {/* Desglose */}
      <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d", marginBottom: 12, borderBottom: "2px solid #ebf8ff", paddingBottom: 7 }}>
          📊 {t.desglosePresup}
        </div>
        {[
          { l: t.costosDirectos,                           v: cd,    c: "#2b6cb0" },
          { l: `${t.costosIndirectos} (${pct.ci}%)`,       v: ci,    c: "#276749" },
          { l: `${t.gastosFijos} (${pct.gf}%)`,            v: gf,    c: "#c05621" },
          { l: `${t.imprevistos} (${pct.imprevistos}%)`,   v: imprev,c: "#b7791f" },
          { l: t.subtotal || "Subtotal",                   v: sub,   c: "#2d3748", bold: true },
          { l: `${t.utilidad} (${pct.utilidad}%)`,         v: util,  c: "#553c9a" },
          { l: t.totalProyecto,                            v: total, c: "#1a365d", bold: true, big: true },
        ].map(r => (
          <div key={r.l} style={{
            display: "flex", justifyContent: "space-between",
            padding: r.big ? "11px" : "7px 3px",
            borderTop: r.big ? "2px solid #e2e8f0" : r.bold ? "1px solid #e2e8f0" : "none",
            background: r.big ? "#ebf8ff" : "transparent",
            borderRadius: r.big ? 8 : 0,
          }}>
            <span style={{ fontSize: r.big ? 14 : 12, color: r.c, fontWeight: r.bold || r.big ? 700 : 400 }}>{r.l}</span>
            <span style={{ fontSize: r.big ? 15 : 13, color: r.c, fontWeight: r.bold || r.big ? 800 : 600 }}>{fmt(r.v)}</span>
          </div>
        ))}
        {iva && <>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 3px", borderTop: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: 12, color: "#c05621" }}>IVA 19%</span>
            <span style={{ fontSize: 13, color: "#c05621", fontWeight: 600 }}>{fmt(ivaAmt)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: 11, background: "#1a365d", borderRadius: 8, marginTop: 4 }}>
            <span style={{ fontSize: 14, color: "white", fontWeight: 800 }}>TOTAL {t.conIVA}</span>
            <span style={{ fontSize: 16, color: "white", fontWeight: 900 }}>{fmt(totalIva)}</span>
          </div>
        </>}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Análisis margen */}
        <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d", marginBottom: 12, borderBottom: "2px solid #ebf8ff", paddingBottom: 7 }}>
            📈 {t.analisisMargen}
          </div>
          {[
            { l: t.costoNeto,       v: fmt(cd),                c: "#2b6cb0" },
            { l: t.margenPartidas,  v: fmt(util),              c: "#276749" },
            { l: t.totalCliente,    v: fmt(iva ? totalIva : total), c: "#1a365d" },
            { l: t.margenTotal,     v: fmtPct(margen),         c: margen > 15 ? "#276749" : margen > 8 ? "#c05621" : "#c53030", big: true },
          ].map(r => (
            <div key={r.l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f7fafc" }}>
              <span style={{ fontSize: 12, color: "#718096" }}>{r.l}</span>
              <span style={{ fontSize: r.big ? 18 : 13, color: r.c, fontWeight: r.big ? 900 : 700 }}>{r.v}</span>
            </div>
          ))}
        </div>

        {/* Pie */}
        {pieData.length > 0 && (
          <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d", marginBottom: 12, borderBottom: "2px solid #ebf8ff", paddingBottom: 7 }}>
              🥧 {t.distribucion}
            </div>
            <PieChart data={pieData} size={130} />
          </div>
        )}
      </div>
    </div>
  );
}
