// ─── components/tabs/TabStorico.jsx ──────────────────────────────────────────
import { useState, useMemo } from "react";
import { fmt } from "../../utils/helpers";

export default function TabStorico({ proyectos, t, canPlan, onPaywall }) {
  const [search, setSearch] = useState("");

  // 4.1 Filtra storico per piano: Free = ultimi 60gg, Pro = illimitato
  const proyectosFiltrati = useMemo(() => {
    if (!canPlan || canPlan("historialDays") !== false) return proyectos;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 60);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return proyectos.filter(p => (p.info?.fecha || p.updatedAt || "") >= cutoffStr);
  }, [proyectos, canPlan]);

  const storicoMat = useMemo(() => Object.values(
    proyectosFiltrati.reduce((acc, proj) => {
      (proj.partidas || []).forEach(p => {
        if (!p.nombre?.trim()) return;
        const k = p.nombre.toLowerCase().trim();
        if (!acc[k]) acc[k] = { nombre: p.nombre, cantTotal: 0, ultimoPrecio: 0, proveedor: "", projs: new Set(), compras: [] };
        acc[k].cantTotal += p.cant || 0;
        if ((p.pu || 0) > 0) {
          acc[k].ultimoPrecio = p.pu;
          acc[k].compras.push({ pu: p.pu, proveedor: p.proveedor || "", fecha: proj.info?.fecha || "", proj: proj.info?.cliente || t.sinNombre });
        }
        if (p.proveedor) acc[k].proveedor = p.proveedor;
        acc[k].projs.add(proj.info?.cliente || t.sinNombre);
      });
      return acc;
    }, {})
  ).map(m => ({ ...m, projs: Array.from(m.projs), compras: m.compras.slice(-5).reverse() }))
   .sort((a, b) => b.cantTotal - a.cantTotal).slice(0, 60), [proyectos, t]);

  const filtered = useMemo(() => {
    if (!search.trim()) return storicoMat;
    const q = search.toLowerCase();
    return storicoMat.filter(m =>
      m.nombre.toLowerCase().includes(q) ||
      (m.proveedor || "").toLowerCase().includes(q)
    );
  }, [storicoMat, search]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: "linear-gradient(135deg,#1a365d,#2d3748)", borderRadius: 12, padding: "18px 20px", color: "white" }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 3 }}>📈 {t.storicoTitulo}</div>
        <div style={{ color: "#a0aec0", fontSize: 12 }}>{t.storicoDesc}</div>
      </div>
      {/* 4.1 Banner storico limitato nel Free */}
      {canPlan && !canPlan("historialDays") && (
        <div style={{ background: "#fffff0", border: "1px solid #f6e05e", borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>⏳</span>
            <span style={{ fontSize: 12, color: "#744210", fontWeight: 700 }}>
              Plan Free — histórico limitado a los últimos 60 días
            </span>
          </div>
          <button onClick={() => onPaywall?.("historialDays")}
            style={{ padding: "5px 14px", background: "#b7791f", color: "white", border: "none", borderRadius: 7, cursor: "pointer", fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
            Ver Pro →
          </button>
        </div>
      )}
      {/* Barra ricerca */}
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#a0aec0" }}>🔍</span>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar material o proveedor..."
          style={{ width: "100%", padding: "10px 12px 10px 34px", border: "1.5px solid #e2e8f0",
            borderRadius: 10, fontSize: 12, color: "#1a365d", boxSizing: "border-box",
            background: "white", outline: "none" }}
        />
        {search && (
          <button onClick={() => setSearch("")}
            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#a0aec0" }}>✕</button>
        )}
      </div>
      {storicoMat.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 0", color: "#a0aec0", background: "white", borderRadius: 12 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📊</div><div>{t.storicoVacio}</div>
        </div>
      ) : filtered.map((m, i) => (
        <div key={i} style={{ background: "white", borderRadius: 11, padding: "14px 18px", boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1a365d" }}>{m.nombre}</div>
              <div style={{ fontSize: 11, color: "#718096", marginTop: 2 }}>
                {m.proveedor && <span style={{ marginRight: 10 }}>🏭 {m.proveedor}</span>}
                <span>📁 {m.projs.length} {t.storicoProyectos}</span>
              </div>
            </div>
            {m.ultimoPrecio > 0 && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#276749" }}>{fmt(m.ultimoPrecio)}</div>
                <div style={{ fontSize: 10, color: "#a0aec0" }}>{t.ultimoPrecio}</div>
              </div>
            )}
          </div>
          {m.compras.length > 1 && (
            <div style={{ borderTop: "1px solid #f7fafc", paddingTop: 7, marginTop: 4 }}>
              <div style={{ fontSize: 10, color: "#718096", fontWeight: 600, marginBottom: 5 }}>{t.storicoCompras}:</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {m.compras.map((c, j) => (
                  <div key={j} style={{ padding: "4px 9px", background: "#f7fafc", borderRadius: 7, fontSize: 10 }}>
                    <span style={{ fontWeight: 700, color: "#2d3748" }}>{fmt(c.pu)}</span>
                    {c.proveedor && <span style={{ color: "#718096", marginLeft: 4 }}>· {c.proveedor}</span>}
                    {c.fecha && <span style={{ color: "#a0aec0", marginLeft: 4 }}>· {c.fecha}</span>}
                  </div>
                ))}
              </div>
              {(() => {
                const prices = m.compras.map(x => x.pu).filter(x => x > 0);
                if (prices.length < 2) return null;
                const trend = prices[0] - prices[prices.length - 1];
                return trend !== 0 && (
                  <div style={{ marginTop: 5, fontSize: 10, fontWeight: 700, color: trend < 0 ? "#276749" : "#c53030" }}>
                    {trend < 0 ? t.bajoPrice : t.subioPrice} {fmt(Math.abs(trend))} {t.vsPrimeraCompra}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
