// ─── components/tabs/TabCostos.jsx ──────────────────────────────────────────
import { useState, useEffect, useMemo } from "react";
import { fmt } from "../../utils/helpers";

// ── Card mobile per una singola partida ───────────────────────────────────────
function PartidaCard({ p, cats, updP, delP, t }) {
  const [expanded, setExpanded] = useState(false);
  const total = p.cant * p.pu;

  return (
    <div style={{
      background: "white", borderRadius: 14, padding: "12px 14px",
      boxShadow: "0 1px 6px rgba(0,0,0,.08)", border: "1px solid #e2e8f0",
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      {/* Riga 1: categoria + totale + elimina */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <select
          value={p.cat}
          onChange={e => updP(p.id, "cat", e.target.value)}
          style={{ flex: 1, padding: "7px 8px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#1a365d", background: "#f7fafc", fontWeight: 600 }}
        >
          {cats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span style={{ fontWeight: 800, fontSize: 15, color: "#276749", minWidth: 80, textAlign: "right" }}>{fmt(total)}</span>
        <button onClick={() => updP(p.id, "visible", !p.visible)}
          style={{ padding: "6px 9px", background: p.visible ? "#f0fff4" : "#f7fafc", border: `1px solid ${p.visible ? "#68d391" : "#e2e8f0"}`, borderRadius: 8, cursor: "pointer", fontSize: 14 }}>
          {p.visible ? "👁️" : "🙈"}
        </button>
        <button onClick={() => delP(p.id)}
          style={{ padding: "6px 10px", background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 8, cursor: "pointer", color: "#c53030", fontSize: 14, fontWeight: 700 }}>
          ✕
        </button>
      </div>

      {/* Riga 2: descrizione full-width */}
      <input
        value={p.nombre}
        onChange={e => updP(p.id, "nombre", e.target.value)}
        placeholder={t.descripcion}
        style={{ width: "100%", padding: "10px 12px", border: "2px solid #e2e8f0", borderRadius: 9, fontSize: 14, color: "#1a365d", boxSizing: "border-box", fontWeight: 500 }}
      />

      {/* Riga 3: cant × pu + unidad */}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", flex: 1, border: "2px solid #e2e8f0", borderRadius: 9, overflow: "hidden" }}>
          <input
            type="number" inputMode="decimal" value={p.cant}
            onChange={e => updP(p.id, "cant", e.target.value)} min={0}
            placeholder="Cant"
            style={{ flex: 1, padding: "10px 8px", border: "none", fontSize: 15, textAlign: "center", color: "#1a365d", fontWeight: 700, minWidth: 0 }}
          />
          <span style={{ padding: "0 6px", color: "#a0aec0", fontSize: 12 }}>×</span>
          <input
            type="number" inputMode="decimal" value={p.pu}
            onChange={e => updP(p.id, "pu", e.target.value)} min={0}
            placeholder="$/u"
            style={{ flex: 2, padding: "10px 8px", border: "none", fontSize: 15, textAlign: "right", color: "#2b6cb0", fontWeight: 700, minWidth: 0 }}
          />
        </div>
        <select
          value={p.unidad}
          onChange={e => updP(p.id, "unidad", e.target.value)}
          style={{ padding: "10px 6px", border: "2px solid #e2e8f0", borderRadius: 9, fontSize: 13, color: "#4a5568", background: "white", fontWeight: 600 }}
        >
          {["m²","m³","ml","gl","un","hr","kg","ton","lts","pza"].map(u => <option key={u}>{u}</option>)}
        </select>

      </div>

      {/* Extras collassabili */}
      <button onClick={() => setExpanded(v => !v)}
        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#a0aec0", fontWeight: 600, textAlign: "left", padding: 0 }}>
        {expanded ? "▲ Menos" : "▼ Proveedor / Nota interna"}
      </button>
      {expanded && (
        <div style={{ display: "flex", gap: 8 }}>
          <input value={p.proveedor || ""} onChange={e => updP(p.id, "proveedor", e.target.value)}
            placeholder={t.proveedor}
            style={{ flex: 1, padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#1a365d" }} />
          <input value={p.nota || ""} onChange={e => updP(p.id, "nota", e.target.value)}
            placeholder={t.notaInterna}
            style={{ flex: 1, padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#1a365d" }} />
        </div>
      )}
    </div>
  );
}

// ── TabCostos — mobile card + desktop table ────────────────────────────────────
export default function TabCostos({ partidas, cats, addPartida, updP, delP, addFromListino, listino, t }) {
  const [filterCat,  setFilterCat]  = useState(null);
  const [showExtras, setShowExtras] = useState(false);
  const [isMobile,   setIsMobile]   = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const cd       = useMemo(() => partidas.reduce((s, p) => s + p.cant * p.pu, 0), [partidas]);
  const filtered = filterCat ? partidas.filter(p => p.cat === filterCat) : partidas;
  const headers  = [
    t.categoria, t.descripcion, t.unidad, t.cantidad, t.pUnit, t.valorFinal, t.visible,
    ...(showExtras ? [t.proveedor, t.notaInterna] : []),
    "",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button
          onClick={() => addPartida(filterCat || cats[0])}
          style={{ padding: isMobile ? "12px 20px" : "8px 14px", background: "#276749", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: isMobile ? 15 : 13, flex: isMobile ? 1 : "none" }}
        >➕ {t.agregar}</button>

        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", flex: isMobile ? "none" : 1 }}>
          <button onClick={() => setFilterCat(null)}
            style={{ padding: "5px 12px", borderRadius: 99, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, background: filterCat === null ? "#1a365d" : "#f0f4f8", color: filterCat === null ? "white" : "#718096" }}
          >{t.filtroTodos}</button>
          {cats.map(c => (
            <button key={c} onClick={() => setFilterCat(c === filterCat ? null : c)}
              style={{ padding: "5px 12px", borderRadius: 99, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, background: filterCat === c ? "#2b6cb0" : "#f0f4f8", color: filterCat === c ? "white" : "#718096" }}
            >{c}</button>
          ))}
        </div>

        {!isMobile && (
          <button onClick={() => setShowExtras(v => !v)}
            style={{ marginLeft: "auto", padding: "5px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: showExtras ? "#2b6cb0" : "white", color: showExtras ? "white" : "#718096", cursor: "pointer", fontSize: 11, fontWeight: 600 }}
          >{showExtras ? "▲ Menos" : "▼ Más"}</button>
        )}
      </div>

      {/* ── EMPTY STATE guidato ── */}
      {filtered.length === 0 && (
        <div style={{ background: "white", borderRadius: 14, padding: "40px 24px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>🏗️</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#1a365d", marginBottom: 6 }}>
            {filterCat ? `Sin partidas en "${filterCat}"` : "Aún no hay partidas"}
          </div>
          <div style={{ fontSize: 13, color: "#718096", marginBottom: 20, maxWidth: 280, margin: "0 auto 20px" }}>
            {filterCat
              ? "Agrega una partida o cambia el filtro de categoría"
              : "Agrega la primera partida para empezar el presupuesto"}
          </div>
          <button
            onClick={() => addPartida(filterCat || cats[0])}
            style={{ padding: "12px 28px", background: "#276749", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: 15 }}>
            ➕ Agregar primera partida
          </button>
        </div>
      )}

      {/* ── MOBILE: card list ── */}
      {isMobile && filtered.length > 0 && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(p => (
              <PartidaCard key={p.id} p={p} cats={cats} updP={updP} delP={delP} t={t} />
            ))}
          </div>
          {/* FAB totale fisso in basso */}
          <div style={{
            position: "sticky", bottom: 80, zIndex: 50,
            background: "#1a365d", borderRadius: 14, padding: "12px 18px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            boxShadow: "0 4px 20px rgba(26,54,93,.4)",
          }}>
            <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>TOTAL {t.costosDirectos}</span>
            <span style={{ color: "#fef08a", fontWeight: 900, fontSize: 18 }}>{fmt(cd)}</span>
          </div>
        </>
      )}

      {/* ── DESKTOP: tabella ── */}
      {!isMobile && filtered.length > 0 && (
        <div style={{ background: "white", borderRadius: 12, overflow: "auto", boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 600 }}>
            <thead>
              <tr style={{ background: "#1a365d", color: "white" }}>
                {headers.map((h, i) => (
                  <th key={i} style={{ padding: "9px 8px", textAlign: "left", fontWeight: 600, fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.id} style={{ background: i % 2 === 0 ? "#f7fafc" : "white" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#ebf8ff"}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#f7fafc" : "white"}
                >
                  <td style={{ padding: "5px 6px" }}>
                    <select value={p.cat} onChange={e => updP(p.id, "cat", e.target.value)}
                      style={{ padding: "4px 6px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 11, background: "white", color: "#1a365d", maxWidth: 120 }}>
                      {cats.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "5px 5px", minWidth: 140 }}>
                    <input value={p.nombre} onChange={e => updP(p.id, "nombre", e.target.value)}
                      style={{ width: "100%", padding: "5px 7px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, color: "#1a365d" }} />
                  </td>
                  <td style={{ padding: "5px 4px" }}>
                    <select value={p.unidad} onChange={e => updP(p.id, "unidad", e.target.value)}
                      style={{ padding: "4px 5px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 11, background: "white", color: "#1a365d" }}>
                      {["m²","m³","ml","gl","un","hr","kg","ton","lts","pza"].map(u => <option key={u}>{u}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "5px 3px" }}>
                    <input type="number" value={p.cant} onChange={e => updP(p.id, "cant", e.target.value)} min={0}
                      style={{ width: 65, padding: "5px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, textAlign: "right", color: "#1a365d" }} />
                  </td>
                  <td style={{ padding: "5px 3px" }}>
                    <input type="number" value={p.pu} onChange={e => updP(p.id, "pu", e.target.value)} min={0}
                      style={{ width: 85, padding: "5px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, textAlign: "right", color: "#1a365d" }} />
                  </td>
                  <td style={{ padding: "5px 7px", fontWeight: 700, color: "#1a365d", textAlign: "right", whiteSpace: "nowrap" }}>{fmt(p.cant * p.pu)}</td>
                  <td style={{ padding: "5px 4px", textAlign: "center" }}>
                    <button onClick={() => updP(p.id, "visible", !p.visible)}
                      style={{ background: p.visible ? "#f0fff4" : "#f7fafc", border: `1px solid ${p.visible ? "#68d391" : "#e2e8f0"}`, borderRadius: 6, cursor: "pointer", padding: "3px 7px", fontSize: 12 }}>
                      {p.visible ? "👁️" : "🙈"}
                    </button>
                  </td>
                  {showExtras && <>
                    <td style={{ padding: "5px 3px" }}>
                      <input value={p.proveedor || ""} onChange={e => updP(p.id, "proveedor", e.target.value)} placeholder={t.proveedor}
                        style={{ width: 90, padding: "4px 6px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 11, color: "#1a365d" }} />
                    </td>
                    <td style={{ padding: "5px 3px" }}>
                      <input value={p.nota || ""} onChange={e => updP(p.id, "nota", e.target.value)} placeholder={t.notaInterna}
                        style={{ width: 100, padding: "4px 6px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 11, color: "#1a365d" }} />
                    </td>
                  </>}
                  <td style={{ padding: "5px 3px" }}>
                    <button onClick={() => delP(p.id)}
                      style={{ background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 6, cursor: "pointer", color: "#c53030", padding: "3px 7px", fontSize: 11 }}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: "#1a365d", color: "white" }}>
                <td colSpan={5} style={{ padding: "9px 10px", fontWeight: 700, fontSize: 12 }}>TOTAL {t.costosDirectos}</td>
                <td style={{ padding: "9px 7px", fontWeight: 800, fontSize: 13, textAlign: "right" }}>{fmt(cd)}</td>
                <td colSpan={showExtras ? 4 : 2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
