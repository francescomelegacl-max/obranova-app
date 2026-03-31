// ─── components/tabs/TabResumen.jsx ──────────────────────────────────────────
import { useMemo, useState } from "react";
import { PieChart } from "../UI";
import { fmt, fmtPct, calcTotals } from "../../utils/helpers";
import { CAT_COLORS } from "../../utils/constants";

export default function TabResumen({ partidas, pct, cats, iva, t, descuento = { tipo: "pct", valor: 0, descripcion: "" }, setDescuento, aiRenders = [], plan = "free", onShowBenchmark }) {
  const totals = useMemo(() => calcTotals(partidas, pct, descuento), [partidas, pct, descuento]);
  const { cd, ci, gf, imprevistos: imprev, sub, util, total, descuentoAmt, totalConDesc, iva: ivaAmt, totalIva } = totals;
  const margen = totalConDesc > 0 ? (util / totalConDesc) * 100 : 0;

  // Visibilità righe desglose — persistita in localStorage
  const [hidden, setHidden] = useState(() => {
    try { return JSON.parse(localStorage.getItem("on_desglose_hidden") || "{}"); } catch { return {}; }
  });
  const toggleRow = (key) => setHidden(prev => {
    const next = { ...prev, [key]: !prev[key] };
    localStorage.setItem("on_desglose_hidden", JSON.stringify(next));
    return next;
  });

  const pieData = useMemo(() => cats
    .map((cat, i) => ({
      label: cat, color: CAT_COLORS[i % CAT_COLORS.length],
      value: partidas.filter(p => p.cat === cat).reduce((s, p) => s + p.cant * p.pu, 0),
    }))
    .filter(d => d.value > 0), [cats, partidas]);

  const hasDesc = descuentoAmt > 0;

  const rows = [
    { key: "cd",     l: t.costosDirectos,                           v: cd,    c: "#2b6cb0" },
    { key: "ci",     l: `${t.costosIndirectos} (${pct.ci}%)`,       v: ci,    c: "#276749" },
    { key: "gf",     l: `${t.gastosFijos} (${pct.gf}%)`,            v: gf,    c: "#c05621" },
    { key: "imprev", l: `${t.imprevistos} (${pct.imprevistos}%)`,   v: imprev,c: "#b7791f" },
    { key: "sub",    l: t.subtotal || "Subtotal",                   v: sub,   c: "#2d3748", bold: true },
    { key: "util",   l: `${t.utilidad} (${pct.utilidad}%)`,         v: util,  c: "#553c9a" },
    { key: "total",  l: "Total s/descuento",                        v: total, c: "#1a365d", bold: true },
    ...(hasDesc ? [
      { key: "desc",   l: `Descuento${descuento.tipo === "pct" ? ` (${descuento.valor}% s/neto)` : ""}`, v: -descuentoAmt, c: "#e53e3e" },
      { key: "totalcd",l: "Total c/descuento",                      v: totalConDesc, c: "#1a365d", bold: true, big: true },
    ] : [
      { key: "totalcd",l: t.totalProyecto,                          v: total, c: "#1a365d", bold: true, big: true },
    ]),
  ];

  // Checkbox style
  const cbStyle = (checked) => ({
    width: 14, height: 14, accentColor: "#2b6cb0", cursor: "pointer", margin: 0, flexShrink: 0,
  });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
      {/* Desglose */}
      <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, borderBottom: "2px solid #ebf8ff", paddingBottom: 7 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#1a365d" }}>📊 {t.desglosePresup}</span>
          <button
            onClick={() => {
              const toggleable = rows.filter(r => !r.big);
              const allHidden = toggleable.every(r => hidden[r.key]);
              const next = {};
              if (!allHidden) toggleable.forEach(r => { next[r.key] = true; });
              setHidden(next);
              localStorage.setItem("on_desglose_hidden", JSON.stringify(next));
            }}
            style={{ fontSize: 11, color: "#718096", background: "#f7fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "3px 8px", cursor: "pointer" }}
          >
            {rows.filter(r => !r.big).every(r => hidden[r.key]) ? "Mostrar todo" : "Ocultar detalles"}
          </button>
        </div>
        {rows.map(r => {
          const isHidden = hidden[r.key];
          // TOTAL finale — sempre visibile
          if (r.big) return (
            <div key={r.key} style={{ display: "flex", justifyContent: "space-between", padding: "11px", borderTop: "2px solid #e2e8f0", background: "#ebf8ff", borderRadius: 8, marginTop: 4 }}>
              <span style={{ fontSize: 14, color: r.c, fontWeight: 700 }}>{r.l}</span>
              <span style={{ fontSize: 15, color: r.c, fontWeight: 800 }}>{fmt(r.v)}</span>
            </div>
          );
          // Tutte le altre righe — checkbox toggle
          return (
            <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 6, padding: r.bold ? "7px 3px" : "5px 3px", borderTop: r.bold ? "1px solid #e2e8f0" : "none" }}>
              <input type="checkbox" checked={!isHidden} onChange={() => toggleRow(r.key)} style={cbStyle(!isHidden)} title={isHidden ? "Mostrar" : "Ocultar"} />
              {isHidden
                ? <span style={{ fontSize: 11, color: "#a0aec0", flex: 1 }}>{r.l}</span>
                : <>
                    <span style={{ fontSize: 12, color: r.c, fontWeight: r.bold ? 700 : 400, flex: 1 }}>{r.l}</span>
                    <span style={{ fontSize: 13, color: r.c, fontWeight: r.bold ? 800 : 600 }}>{fmt(r.v)}</span>
                  </>
              }
            </div>
          );
        })}
        {/* IVA — con checkbox */}
        {iva && <>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 3px", borderTop: "1px solid #e2e8f0" }}>
            <input type="checkbox" checked={!hidden.iva} onChange={() => toggleRow("iva")} style={cbStyle(!hidden.iva)} />
            {hidden.iva
              ? <span style={{ fontSize: 11, color: "#a0aec0", flex: 1 }}>IVA 19%</span>
              : <>
                  <span style={{ fontSize: 12, color: "#c05621", flex: 1 }}>IVA 19%</span>
                  <span style={{ fontSize: 13, color: "#c05621", fontWeight: 600 }}>{fmt(ivaAmt)}</span>
                </>
            }
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: 11, background: "#1a365d", borderRadius: 8, marginTop: 4 }}>
            <span style={{ fontSize: 14, color: "white", fontWeight: 800 }}>TOTAL {t.conIVA}</span>
            <span style={{ fontSize: 16, color: "white", fontWeight: 900 }}>{fmt(totalIva)}</span>
          </div>
        </>}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Descuento */}
        {setDescuento && (
          <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d", marginBottom: 12, borderBottom: "2px solid #ebf8ff", paddingBottom: 7 }}>
              🏷️ Descuento
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
              <select value={descuento.tipo} onChange={e => setDescuento({ tipo: e.target.value })}
                style={{ padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#1a365d" }}>
                <option value="pct">Porcentaje (%)</option>
                <option value="fijo">Monto fijo ($)</option>
              </select>
              <input type="number" min="0" step={descuento.tipo === "pct" ? "0.5" : "1000"}
                value={descuento.valor || ""} placeholder={descuento.tipo === "pct" ? "0%" : "$0"}
                onChange={e => setDescuento({ valor: parseFloat(e.target.value) || 0 })}
                style={{ width: 90, padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, textAlign: "right" }} />
              {descuentoAmt > 0 && (
                <span style={{ fontSize: 12, fontWeight: 700, color: "#e53e3e" }}>−{fmt(descuentoAmt)}</span>
              )}
            </div>
            <input type="text" value={descuento.descripcion || ""} placeholder="Descripción del descuento (opcional)"
              onChange={e => setDescuento({ descripcion: e.target.value })}
              style={{ width: "100%", padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, boxSizing: "border-box" }} />
          </div>
        )}

        {/* Análisis margen */}
        <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d", marginBottom: 12, borderBottom: "2px solid #ebf8ff", paddingBottom: 7 }}>
            📈 {t.analisisMargen}
          </div>
          {[
            { l: t.costoNeto,       v: fmt(cd),                c: "#2b6cb0" },
            { l: t.margenPartidas,  v: fmt(util),              c: "#276749" },
            ...(hasDesc ? [{ l: "Descuento",  v: `−${fmt(descuentoAmt)}`, c: "#e53e3e" }] : []),
            { l: t.totalCliente,    v: fmt(iva ? totalIva : totalConDesc), c: "#1a365d" },
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

        {/* Renders AI del proyecto */}
        {aiRenders && aiRenders.length > 0 && (
          <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d", marginBottom: 12, borderBottom: "2px solid #ebf8ff", paddingBottom: 7 }}>
              🎨 Visualización AI del proyecto
            </div>
            <div style={{ display: "grid", gridTemplateColumns: aiRenders.length === 1 ? "1fr" : "1fr 1fr", gap: 10 }}>
              {aiRenders.filter(r => r.ok !== false && r.imageUrl).slice(0, 4).map((r, i) => (
                <div key={i} style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #e2e8f0" }}>
                  <img src={r.imageUrl} alt={r.label || `Render ${i+1}`} style={{ width: "100%", height: aiRenders.length === 1 ? 220 : 140, objectFit: "cover", display: "block" }} />
                  <div style={{ padding: "5px 8px", background: "#f7fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#1a365d" }}>{r.label || r.roomType || `Render ${i+1}`}</span>
                    <span style={{ fontSize: 9, color: "#a0aec0" }}>Render AI</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 9, color: "#a0aec0", marginTop: 6, textAlign: "center", fontStyle: "italic" }}>
              Visualización generada por inteligencia artificial — el resultado final puede variar
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
