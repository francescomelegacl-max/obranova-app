// ─── components/tabs/TabCostos.jsx ──────────────────────────────────────────
import { useState, useEffect, useMemo, useCallback } from "react";
import { fmt } from "../../utils/helpers";
import { catColor, CategoryChips, CategoryDivider, CategoryDividerMobile } from "../ui/CategoryFilters";

// ── Modal edit partida ────────────────────────────────────────────────────────
function EditPartidaModal({ p, cats, onSave, onClose }) {
  const [f, setF] = useState({ ...p });
  const u = (k, v) => setF(x => ({ ...x, [k]: v }));

  const inputStyle = {
    width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0",
    borderRadius: 8, fontSize: 13, color: "#1a365d", boxSizing: "border-box",
  };
  const labelStyle = { fontSize: 12, color: "#4a5568", fontWeight: 600, display: "block", marginBottom: 3 };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 2000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "white", borderRadius: 16, padding: 24, width: "100%", maxWidth: 480,
        maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.35)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#1a365d" }}>✏️ Editar partida</div>
          <button onClick={onClose}
            style={{ background: "#2d3748", border: "none", borderRadius: 8, cursor: "pointer", padding: "5px 12px", color: "white", fontWeight: 700 }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Descripción</label>
            <input value={f.nombre} onChange={e => u("nombre", e.target.value)} autoFocus style={inputStyle} placeholder="Descripción de la partida" />
          </div>
          <div>
            <label style={labelStyle}>Categoría</label>
            <select value={f.cat} onChange={e => u("cat", e.target.value)} style={inputStyle}>
              {cats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ ...labelStyle, color: "#1a365d" }}>Cantidad</label>
              <input type="number" value={f.cant} onChange={e => u("cant", +e.target.value)} min={0} style={inputStyle} />
            </div>
            <div>
              <label style={{ ...labelStyle, color: "#2b6cb0" }}>Precio/u</label>
              <input type="number" value={f.pu} onChange={e => u("pu", +e.target.value)} min={0} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Unidad</label>
              <select value={f.unidad} onChange={e => u("unidad", e.target.value)} style={inputStyle}>
                {["m²","m³","ml","gl","un","hr","kg","ton","lts","pza"].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div style={{ background: "#f0fff4", borderRadius: 9, padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: "#276749", fontWeight: 600 }}>Total partida</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#276749" }}>{fmt(f.cant * f.pu)}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={labelStyle}>Proveedor</label>
              <input value={f.proveedor || ""} onChange={e => u("proveedor", e.target.value)} style={inputStyle} placeholder="Ej. Sodimac..." />
            </div>
            <div>
              <label style={labelStyle}>Nota interna</label>
              <input value={f.nota || ""} onChange={e => u("nota", e.target.value)} style={inputStyle} placeholder="Nota..." />
            </div>
          </div>
          <button onClick={() => { onSave(f); onClose(); }}
            style={{ padding: 11, background: "#1a365d", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14, marginTop: 4 }}>
            💾 Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Card mobile per una singola partida ───────────────────────────────────────
function PartidaCard({ p, cats, updP, delP, onEdit, t }) {
  const [expanded, setExpanded] = useState(false);
  const total = p.cant * p.pu;
  const col = catColor(p.cat);

  return (
    <div style={{
      background: "white", borderRadius: 14, overflow: "hidden",
      boxShadow: "0 1px 6px rgba(0,0,0,.08)", border: "1px solid #e2e8f0",
    }}>
      {/* Striscia categoria */}
      <div style={{ height: 4, background: col.pill }} />
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Riga 1: categoria + totale + azioni */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <select value={p.cat} onChange={e => updP(p.id, "cat", e.target.value)}
            style={{ flex: 1, padding: "7px 8px", border: `1px solid ${col.border}`, borderRadius: 8,
              fontSize: 12, color: col.text, background: col.bg, fontWeight: 700 }}>
            {cats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span style={{ fontWeight: 800, fontSize: 15, color: "#276749", minWidth: 80, textAlign: "right" }}>{fmt(total)}</span>
          <button onClick={() => onEdit(p)} title="Editar"
            style={{ padding: "6px 9px", background: "#ebf8ff", border: "1px solid #bee3f8", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>
            ✏️
          </button>
          <button onClick={() => updP(p.id, "visible", !p.visible)}
            style={{ padding: "6px 9px", background: p.visible ? "#f0fff4" : "#f7fafc", border: `1px solid ${p.visible ? "#68d391" : "#e2e8f0"}`, borderRadius: 8, cursor: "pointer", fontSize: 14 }}>
            {p.visible ? "👁️" : "🙈"}
          </button>
          <button onClick={() => delP(p.id)}
            style={{ padding: "6px 10px", background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 8, cursor: "pointer", color: "#c53030", fontSize: 14, fontWeight: 700 }}>
            ✕
          </button>
        </div>

        {/* Riga 2: descrizione */}
        <input value={p.nombre} onChange={e => updP(p.id, "nombre", e.target.value)}
          placeholder={t.descripcion}
          style={{ width: "100%", padding: "10px 12px", border: "2px solid #e2e8f0", borderRadius: 9,
            fontSize: 14, color: "#1a365d", boxSizing: "border-box", fontWeight: 500 }} />

        {/* Riga 3: cant × pu + unidad */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", flex: 1, border: "2px solid #e2e8f0", borderRadius: 9, overflow: "hidden" }}>
            <input type="number" inputMode="decimal" value={p.cant}
              onChange={e => updP(p.id, "cant", e.target.value)} min={0} placeholder="Cant"
              style={{ flex: 1, padding: "10px 8px", border: "none", fontSize: 15, textAlign: "center", color: "#1a365d", fontWeight: 700, minWidth: 0 }} />
            <span style={{ padding: "0 6px", color: "#a0aec0", fontSize: 12 }}>×</span>
            <input type="number" inputMode="decimal" value={p.pu}
              onChange={e => updP(p.id, "pu", e.target.value)} min={0} placeholder="$/u"
              style={{ flex: 2, padding: "10px 8px", border: "none", fontSize: 15, textAlign: "right", color: "#2b6cb0", fontWeight: 700, minWidth: 0 }} />
          </div>
          <select value={p.unidad} onChange={e => updP(p.id, "unidad", e.target.value)}
            style={{ padding: "10px 6px", border: "2px solid #e2e8f0", borderRadius: 9, fontSize: 13, color: "#4a5568", background: "white", fontWeight: 600 }}>
            {["m²","m³","ml","gl","un","hr","kg","ton","lts","pza"].map(u => <option key={u}>{u}</option>)}
          </select>
        </div>

        {/* Extras */}
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
    </div>
  );
}

// ── TabCostos — mobile card + desktop table ────────────────────────────────────
export default function TabCostos({ partidas = [], cats = [], addPartida, updP, delP, addFromListino, listino = [], t = {} }) {
  const [filterCat,  setFilterCat]  = useState(null);
  const [showExtras, setShowExtras] = useState(false);
  const [editingP,   setEditingP]   = useState(null); // partida in edit
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 767px)").matches);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const cd = useMemo(() => partidas.reduce((s, p) => s + p.cant * p.pu, 0), [partidas]);

  const filtered = useMemo(() => {
    const list = filterCat ? partidas.filter(p => p.cat === filterCat) : [...partidas];
    // Ordina per categoria per separatori
    return list.sort((a, b) => (String(a.cat || "")).localeCompare(String(b.cat || "")));
  }, [partidas, filterCat]);

  // Conteggi per categoria
  const counts = useMemo(() => {
    const c = { _total: partidas.length };
    partidas.forEach(p => { c[p.cat] = (c[p.cat] || 0) + 1; });
    return c;
  }, [partidas]);

  // Salva modifica da modal edit
  const handleSaveEdit = useCallback((updated) => {
    Object.keys(updated).forEach(k => {
      if (k !== "id") updP(updated.id, k, updated[k]);
    });
  }, [updP]);

  const headers = [
    t.categoria, t.descripcion, t.unidad, t.cantidad, t.pUnit, t.valorFinal, t.visible,
    ...(showExtras ? [t.proveedor, t.notaInterna] : []),
    "",
  ];

  // ── Righe desktop raggruppate per categoria ─────────────────────────────
  const renderDesktopRows = () => {
    const rows = [];
    let lastCat = null;
    filtered.forEach((p, i) => {
      if (!filterCat && p.cat !== lastCat) {
        lastCat = p.cat;
        rows.push(<CategoryDivider key={`cat-${p.cat}-${i}`} cat={p.cat} />);
      }
      rows.push(
        <tr key={p.id}
          style={{ background: i % 2 === 0 ? "#f7fafc" : "white" }}
          onMouseEnter={e => e.currentTarget.style.background = "#ebf8ff"}
          onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#f7fafc" : "white"}
        >
          <td style={{ padding: "5px 6px" }}>
            {(() => {
              const col = catColor(p.cat);
              return (
                <select value={p.cat} onChange={e => updP(p.id, "cat", e.target.value)}
                  style={{ padding: "4px 6px", border: `1px solid ${col.border}`, borderRadius: 6,
                    fontSize: 11, background: col.bg, color: col.text, fontWeight: 700, maxWidth: 120 }}>
                  {cats.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              );
            })()}
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
          <td style={{ padding: "5px 7px", fontWeight: 700, color: "#276749", textAlign: "right", whiteSpace: "nowrap" }}>
            {fmt(p.cant * p.pu)}
          </td>
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
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => setEditingP(p)} title="Editar"
                style={{ background: "#ebf8ff", border: "1px solid #bee3f8", borderRadius: 6, cursor: "pointer", color: "#2b6cb0", padding: "3px 7px", fontSize: 11 }}>✏️</button>
              <button onClick={() => delP(p.id)}
                style={{ background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 6, cursor: "pointer", color: "#c53030", padding: "3px 7px", fontSize: 11 }}>✕</button>
            </div>
          </td>
        </tr>
      );
    });
    return rows;
  };

  // ── Render mobile raggruppato per categoria ──────────────────────────────
  const renderMobileCards = () => {
    const nodes = [];
    let lastCat = null;
    filtered.forEach((p) => {
      if (!filterCat && p.cat !== lastCat) {
        lastCat = p.cat;
        nodes.push(<CategoryDividerMobile key={`mcat-${p.cat}`} cat={p.cat} />);
      }
      nodes.push(
        <PartidaCard key={p.id} p={p} cats={cats} updP={updP} delP={delP} onEdit={setEditingP} t={t} />
      );
    });
    return nodes;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button
          onClick={() => addPartida(filterCat || cats[0])}
          style={{ padding: isMobile ? "12px 20px" : "8px 14px", background: "#276749", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: isMobile ? 15 : 13, flex: isMobile ? 1 : "none" }}>
          ➕ {t.agregar}
        </button>
        {!isMobile && (
          <button onClick={() => setShowExtras(v => !v)}
            style={{ marginLeft: "auto", padding: "5px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: showExtras ? "#2b6cb0" : "white", color: showExtras ? "white" : "#718096", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
            {showExtras ? "▲ Menos" : "▼ Más"}
          </button>
        )}
      </div>

      {/* Filtri categoria */}
      <CategoryChips
        cats={cats}
        activeCat={filterCat}
        onChange={setFilterCat}
        counts={counts}
      />

      {/* EMPTY STATE */}
      {filtered.length === 0 && (
        <div style={{ background: "white", borderRadius: 14, padding: "40px 24px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>🏗️</div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#1a365d", marginBottom: 6 }}>
            {filterCat ? `Sin partidas en "${filterCat}"` : "Aún no hay partidas"}
          </div>
          <div style={{ fontSize: 13, color: "#718096", marginBottom: 20, maxWidth: 280, margin: "0 auto 20px" }}>
            {filterCat ? "Agrega una partida o cambia el filtro" : "Agrega la primera partida para empezar el presupuesto"}
          </div>
          <button onClick={() => addPartida(filterCat || cats[0])}
            style={{ padding: "12px 28px", background: "#276749", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: 15 }}>
            ➕ Agregar primera partida
          </button>
        </div>
      )}

      {/* MOBILE */}
      {isMobile && filtered.length > 0 && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {renderMobileCards()}
          </div>
          <div style={{ position: "sticky", bottom: 80, zIndex: 50, background: "#1a365d", borderRadius: 14,
            padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center",
            boxShadow: "0 4px 20px rgba(26,54,93,.4)" }}>
            <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>TOTAL {t.costosDirectos}</span>
            <span style={{ color: "#fef08a", fontWeight: 900, fontSize: 18 }}>{fmt(cd)}</span>
          </div>
        </>
      )}

      {/* DESKTOP */}
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
              {renderDesktopRows()}
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

      {/* Modal edit */}
      {editingP && (
        <EditPartidaModal
          p={editingP}
          cats={cats}
          onSave={handleSaveEdit}
          onClose={() => setEditingP(null)}
        />
      )}
    </div>
  );
}
