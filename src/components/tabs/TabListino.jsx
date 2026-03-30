// ─── components/tabs/TabListino.jsx ──────────────────────────────────────────
import { useState, useMemo, useEffect } from "react";
import { fmt, fmtPct } from "../../utils/helpers";

// ─── 3.4 Comparativo Proveedores (helper privato) ────────────────────────────
function ComparativoProveedores({ listino, cats, catColors, t }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("nombre"); // nombre | precioCompra | margen

  // Raggruppa articoli per nome e mostra tutti i provider con prezzi
  const grouped = useMemo(() => {
    const map = {};
    listino.forEach(item => {
      const key = (item.nombre || "").toLowerCase().trim();
      if (!key) return;
      if (!map[key]) map[key] = { nombre: item.nombre, cat: item.cat, unidad: item.unidad, items: [] };
      map[key].items.push(item);
    });
    // Calcola stats per gruppo
    return Object.values(map).map(g => {
      const precios = g.items.map(x => x.precioCompra || 0).filter(p => p > 0);
      const min     = precios.length ? Math.min(...precios) : 0;
      const max     = precios.length ? Math.max(...precios) : 0;
      const avg     = precios.length ? precios.reduce((a,b)=>a+b,0)/precios.length : 0;
      const spread  = min > 0 ? Math.round((max - min) / min * 100) : 0;
      return { ...g, min, max, avg, spread, nProveedores: new Set(g.items.map(x=>x.proveedor||"—")).size };
    });
  }, [listino]);

  const filtered = useMemo(() => {
    let list = [...grouped];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(g => g.nombre.toLowerCase().includes(q) || g.cat?.toLowerCase().includes(q));
    }
    if (sortBy === "nombre")       list.sort((a,b) => a.nombre.localeCompare(b.nombre));
    if (sortBy === "precioCompra") list.sort((a,b) => b.avg - a.avg);
    if (sortBy === "margen")       list.sort((a,b) => b.spread - a.spread);
    return list;
  }, [grouped, search, sortBy]);

  const fmtCLP = n => n > 0 ? "$ " + Math.round(n).toLocaleString("es-CL") : "—";

  if (listino.length === 0) return (
    <div style={{ background:"white", borderRadius:12, padding:"40px 20px", textAlign:"center", color:"#a0aec0" }}>
      <div style={{ fontSize:36, marginBottom:10 }}>📊</div>
      <div style={{ fontWeight:700, fontSize:14 }}>Sin datos para comparar</div>
      <div style={{ fontSize:12, marginTop:4 }}>Agrega artículos al listino con sus precios y proveedores</div>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {/* Info */}
      <div style={{ background:"#ebf8ff", border:"1px solid #bee3f8", borderRadius:10, padding:"10px 16px", fontSize:12, color:"#2b6cb0" }}>
        📊 Compara precios de compra entre proveedores para el mismo material. Los artículos con mayor diferencia de precio están arriba.
      </div>

      {/* Toolbar */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:200, position:"relative" }}>
          <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:13, color:"#a0aec0" }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar material..."
            style={{ width:"100%", padding:"8px 10px 8px 30px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:12, color:"#1a365d", boxSizing:"border-box" }}
          />
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ padding:"8px 10px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:12, color:"#1a365d" }}>
          <option value="nombre">Nombre A-Z</option>
          <option value="precioCompra">Mayor precio promedio</option>
          <option value="margen">Mayor diferencia %</option>
        </select>
      </div>

      {/* Tabla */}
      <div style={{ background:"white", borderRadius:12, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr style={{ background:"#1a365d", color:"white" }}>
              {["Material","Cat","Mín","Máx","Promedio","Diferencia","Proveedores"].map(h => (
                <th key={h} style={{ padding:"9px 10px", textAlign:"left", fontWeight:600, fontSize:11, whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding:"24px", textAlign:"center", color:"#a0aec0" }}>Sin resultados</td></tr>
            )}
            {filtered.map((g, i) => (
              <tr key={g.nombre} style={{ background: i%2===0?"#f7fafc":"white", borderBottom:"1px solid #f0f4f8" }}>
                <td style={{ padding:"8px 10px", fontWeight:700, color:"#1a365d" }}>{g.nombre}</td>
                <td style={{ padding:"8px 8px" }}>
                  <span style={{ fontSize:10, padding:"2px 7px", borderRadius:99, fontWeight:700,
                    background:"#ebf8ff", color:"#2b6cb0" }}>{g.cat||"—"}</span>
                </td>
                <td style={{ padding:"8px 10px", color:"#276749", fontWeight:700 }}>{fmtCLP(g.min)}</td>
                <td style={{ padding:"8px 10px", color:"#c53030", fontWeight:700 }}>{fmtCLP(g.max)}</td>
                <td style={{ padding:"8px 10px", color:"#4a5568" }}>{fmtCLP(g.avg)}</td>
                <td style={{ padding:"8px 10px" }}>
                  {g.spread > 0 ? (
                    <span style={{ padding:"2px 9px", borderRadius:99, fontSize:11, fontWeight:800,
                      background: g.spread > 30 ? "#fff5f5" : g.spread > 10 ? "#fffff0" : "#f0fff4",
                      color:      g.spread > 30 ? "#c53030" : g.spread > 10 ? "#b7791f" : "#276749" }}>
                      +{g.spread}%
                    </span>
                  ) : <span style={{ color:"#a0aec0" }}>—</span>}
                </td>
                <td style={{ padding:"8px 10px", color:"#718096" }}>
                  <button
                    style={{ background:"none", border:"none", cursor:"pointer", color:"#2b6cb0", fontSize:11, fontWeight:600, padding:0 }}
                    onClick={() => {
                      const provs = [...new Set(g.items.map(x=>x.proveedor||"—"))];
                      alert(`Proveedores para ${g.nombre}:\n\n${g.items.map(x=>`${x.proveedor||"—"}: ${fmtCLP(x.precioCompra||0)} / ${x.unidad||"un"}`).join("\n")}`);
                    }}>
                    {g.nProveedores} {g.nProveedores === 1 ? "proveedor" : "proveedores"} →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function TabListino({ listino, cats, catColors, newCatName, setNewCatName, onAddCat, onDeleteItem, onAddFromListino, onOpenAddModal, DEFAULT_CATS, t, onUpdatePrecio, listinoRestanti = Infinity, onPaywall = () => {}, isPro = false }) {
  const [filterCat,    setFilterCat]    = useState(null);
  const [search,       setSearch]       = useState("");
  const [isMobile,     setIsMobile]     = useState(() => window.innerWidth < 768);
  const [vistaTab,     setVistaTab]     = useState("listino"); // "listino" | "comparativo"
  // 2.10 Edit inline prezzi
  const [editingPrice, setEditingPrice] = useState(null); // { id, field, value }
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const catColorMap = useMemo(() => {
    const map = {};
    cats.forEach((c, i) => { map[c] = catColors[i % catColors.length]; });
    return map;
  }, [cats, catColors]);

  const listinoFiltrato = useMemo(() => {
    let list = [...listino];
    if (filterCat) list = list.filter(x => x.cat === filterCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(x =>
        (x.nombre || "").toLowerCase().includes(q) ||
        (x.proveedor || "").toLowerCase().includes(q) ||
        (x.cat || "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const ca = (a.cat || "").localeCompare(b.cat || "");
      return ca !== 0 ? ca : (a.nombre || "").localeCompare(b.nombre || "");
    });
    return list;
  }, [listino, filterCat, search]);

  const counts = useMemo(() => {
    const c = {};
    listino.forEach(x => { c[x.cat] = (c[x.cat] || 0) + 1; });
    return c;
  }, [listino]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Header con tab switcher */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 4, background: "#f0f4f8", borderRadius: 10, padding: 4 }}>
          {[["listino","📦 Listino"],["comparativo","📊 Comparativo"]].map(([v,label]) => (
            <button key={v} onClick={() => setVistaTab(v)}
              style={{ padding: "6px 14px", borderRadius: 7, border: "none", cursor: "pointer",
                fontWeight: 700, fontSize: 12,
                background: vistaTab === v ? "#1a365d" : "transparent",
                color:      vistaTab === v ? "white" : "#718096" }}>
              {label}
            </button>
          ))}
        </div>
        <button onClick={() => listinoRestanti === 0 ? onPaywall("maxListino") : onOpenAddModal()}
          style={{ padding: "8px 16px", background: "#276749", color: "white", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
          {t.listinoAgregar}
        </button>
        {isPro ? (
          <span style={{
            fontSize: 11, fontWeight: 700, borderRadius: 99, padding: "3px 10px",
            color: "#2b6cb0", background: "#ebf8ff", border: "1px solid #bee3f8",
          }}>
            ⚡ {listino.length} ítems · Pro ilimitado
          </span>
        ) : (
          <span style={{
            fontSize: 11, fontWeight: 700, borderRadius: 99, padding: "3px 10px",
            color:      listinoRestanti === 0 ? "#c53030" : "#276749",
            background: listinoRestanti === 0 ? "#fff5f5" : "#f0fff4",
            border:     `1px solid ${listinoRestanti === 0 ? "#fed7d7" : "#9ae6b4"}`,
          }}>
            {listinoRestanti === 0 ? "⚠️ Límite 20 ítems alcanzado" : `${listino.length}/20 ítems (Free)`}
          </span>
        )}
      </div>

      {/* ── Vista Comparativo Proveedores ─────────────────────────────────── */}
      {vistaTab === "comparativo" && (
        <ComparativoProveedores listino={listino} cats={cats} catColors={catColors} t={t} />
      )}

      {/* ── Vista Listino (originale) ─────────────────────────────────────── */}
      {vistaTab === "listino" && (<>

      {/* Barra filtri + ricerca */}
      <div style={{ background: "white", borderRadius: 12, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,.07)", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Ricerca */}
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#a0aec0" }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, proveedor, categoría..."
            style={{ width: "100%", padding: "9px 12px 9px 32px", border: "1.5px solid #e2e8f0",
              borderRadius: 9, fontSize: 12, color: "#1a365d", boxSizing: "border-box", outline: "none" }}
            onFocus={e => e.target.style.borderColor = "#2b6cb0"}
            onBlur={e  => e.target.style.borderColor = "#e2e8f0"}
          />
          {search && (
            <button onClick={() => setSearch("")}
              style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#a0aec0" }}>✕</button>
          )}
        </div>

        {/* Filtri categoria */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, alignItems: "center" }}>
          <button onClick={() => setFilterCat(null)}
            style={{ padding: "5px 13px", borderRadius: 99, fontSize: 11, fontWeight: 700,
              cursor: "pointer", border: "none",
              background: !filterCat ? "#1a365d" : "#f0f4f8",
              color: !filterCat ? "white" : "#718096" }}>
            Todos ({listino.length})
          </button>
          {cats.map((cat, i) => {
            const col = catColors[i % catColors.length];
            const active = filterCat === cat;
            return (
              <button key={cat} onClick={() => setFilterCat(active ? null : cat)}
                style={{ padding: "5px 13px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                  cursor: "pointer",
                  border: `1.5px solid ${active ? col : col + "55"}`,
                  background: active ? col + "22" : "white",
                  color: active ? col : "#718096",
                  outline: active ? `2px solid ${col}` : "none",
                  outlineOffset: 1 }}>
                {cat} {counts[cat] ? `(${counts[cat]})` : ""}
              </button>
            );
          })}
          {(filterCat || search) && (
            <button onClick={() => { setFilterCat(null); setSearch(""); }}
              style={{ marginLeft: "auto", padding: "5px 11px", borderRadius: 99, fontSize: 11,
                cursor: "pointer", border: "1px solid #fed7d7", background: "#fff5f5", color: "#c53030", fontWeight: 600 }}>
              ✕ Limpiar
            </button>
          )}
        </div>

        {/* Gestione categorie — collassabile */}
        <details style={{ borderTop: "1px solid #f0f4f8", paddingTop: 10 }}>
          <summary style={{ fontSize: 12, color: "#718096", cursor: "pointer", fontWeight: 600, userSelect: "none" }}>
            🏷️ {t.catPersonalizada} — {cats.length} categorías
          </summary>
          <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 10 }}>
            {cats.map((cat, i) => (
              <span key={cat} style={{
                padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                background: catColors[i % catColors.length] + "18",
                color: catColors[i % catColors.length],
                border: `1px solid ${catColors[i % catColors.length]}44`,
              }}>
                {cat}{i >= DEFAULT_CATS.length && " ✏️"}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input value={newCatName} onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && onAddCat()}
              placeholder={t.catNombrePlaceholder} aria-label={t.catAgregar}
              style={{ flex: 1, padding: "8px 11px", border: "2px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#1a365d" }}
            />
            <button onClick={onAddCat}
              style={{ padding: "8px 14px", background: "#2b6cb0", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}>
              {t.catAgregar}
            </button>
          </div>
        </details>
      </div>

      {/* Lista */}
      {listino.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 0", color: "#a0aec0", background: "white", borderRadius: 12 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📦</div>
          <div>{t.listinoVacio}</div>
        </div>
      ) : listinoFiltrato.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#a0aec0", background: "white", borderRadius: 12 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
          <div style={{ fontWeight: 600 }}>Sin resultados</div>
        </div>
      ) : isMobile ? (
        /* Mobile: card con separatori categoria */
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {(() => {
            const rows = [];
            let lastCat = null;
            listinoFiltrato.forEach((item, i) => {
              if (!filterCat && item.cat !== lastCat) {
                lastCat = item.cat;
                const col = catColorMap[item.cat] || "#718096";
                rows.push(
                  <div key={`div-${item.cat}-${i}`}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0 2px" }}>
                    <div style={{ width: 4, height: 16, borderRadius: 2, background: col, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 800, color: col, textTransform: "uppercase", letterSpacing: .5 }}>{item.cat}</span>
                    <span style={{ fontSize: 10, color: "#a0aec0" }}>({counts[item.cat] || 0})</span>
                  </div>
                );
              }
              const mg = item.precioCliente > 0 && item.precioCompra > 0
                ? ((item.precioCliente - item.precioCompra) / item.precioCliente * 100) : null;
              rows.push(
                <div key={item.id}
                  style={{ background: "white", borderRadius: 10, padding: "10px 12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,.06)", border: "1px solid #f0f4f8",
                    display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#1a365d", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.nombre}</div>
                    <div style={{ fontSize: 10, color: "#a0aec0", marginTop: 2 }}>
                      {item.unidad || "un"}{item.proveedor ? ` · ${item.proveedor}` : ""}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#276749" }}>{fmt(item.precioCliente || item.precio || 0)}</div>
                    {mg !== null && <span style={{ fontSize: 10, fontWeight: 700, color: mg > 20 ? "#276749" : mg > 10 ? "#b7791f" : "#c53030" }}>{fmtPct(mg)} mg</span>}
                  </div>
                  <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                    <button onClick={() => onAddFromListino(item)}
                      style={{ padding: "6px 10px", background: "#ebf8ff", border: "1px solid #bee3f8", borderRadius: 7, cursor: "pointer", color: "#2b6cb0", fontSize: 12, fontWeight: 700 }}>+</button>
                    <button onClick={() => onDeleteItem(item.id)}
                      style={{ padding: "6px 8px", background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 7, cursor: "pointer", color: "#c53030", fontSize: 11 }}>✕</button>
                  </div>
                </div>
              );
            });
            return rows;
          })()}
        </div>
      ) : (
        /* Desktop: tabella con separatori categoria */
        <div style={{ background: "white", borderRadius: 12, overflow: "auto", boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 580 }}>
            <thead>
              <tr style={{ background: "#1a365d", color: "white" }}>
                {[t.categoria, t.listinoNombre, t.unidad, "💸 " + t.precioCompra, "💰 " + t.precioCliente, "📈 Margen", "🏭 " + t.proveedor, ""].map((h, i) => (
                  <th key={i} style={{ padding: "9px 10px", textAlign: "left", fontWeight: 600, fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const rows = [];
                let lastCat = null;
                listinoFiltrato.forEach((item, i) => {
                  if (!filterCat && item.cat !== lastCat) {
                    lastCat = item.cat;
                    const col = catColorMap[item.cat] || "#718096";
                    rows.push(
                      <tr key={`sep-${item.cat}-${i}`}>
                        <td colSpan={8} style={{ padding: "10px 12px 4px", background: "#f7fafc", borderTop: i > 0 ? "2px solid #e2e8f0" : "none" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 4, height: 16, borderRadius: 2, background: col }} />
                            <span style={{ fontSize: 11, fontWeight: 800, color: col, textTransform: "uppercase", letterSpacing: .5 }}>{item.cat}</span>
                            <span style={{ fontSize: 10, color: "#a0aec0", background: col + "18", padding: "1px 8px", borderRadius: 99, border: `1px solid ${col}33` }}>
                              {counts[item.cat] || 0} voci
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                  const mg = item.precioCliente > 0 && item.precioCompra > 0
                    ? ((item.precioCliente - item.precioCompra) / item.precioCliente * 100) : null;
                  rows.push(
                    <tr key={item.id} style={{ background: i % 2 === 0 ? "#f7fafc" : "white" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#ebf8ff"}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#f7fafc" : "white"}>
                      <td style={{ padding: "7px 10px" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
                          background: (catColorMap[item.cat] || "#718096") + "18",
                          color: catColorMap[item.cat] || "#718096",
                          border: `1px solid ${(catColorMap[item.cat] || "#718096")}33` }}>
                          {item.cat}
                        </span>
                      </td>
                      <td style={{ padding: "7px 10px", fontWeight: 600, color: "#1a365d" }}>{item.nombre}</td>
                      <td style={{ padding: "7px 8px", color: "#718096" }}>{item.unidad || "—"}</td>
                      <td style={{ padding: "7px 10px", color: "#c05621", fontWeight: 600 }}>
                        {/* 2.10 Edit inline doppio click — precioCompra */}
                        {onUpdatePrecio && editingPrice?.id === item.id && editingPrice?.field === "precioCompra" ? (
                          <input autoFocus type="number" min={0}
                            value={editingPrice.value}
                            onChange={e => setEditingPrice(ep => ({ ...ep, value: e.target.value }))}
                            onBlur={() => { onUpdatePrecio(item.id, "precioCompra", +editingPrice.value); setEditingPrice(null); }}
                            onKeyDown={e => { if (e.key === "Enter") { onUpdatePrecio(item.id, "precioCompra", +editingPrice.value); setEditingPrice(null); } if (e.key === "Escape") setEditingPrice(null); }}
                            style={{ width: 90, padding: "3px 6px", border: "2px solid #c05621", borderRadius: 6, fontSize: 12, color: "#c05621", fontWeight: 700, textAlign: "right" }} />
                        ) : (
                          <span
                            onDoubleClick={() => onUpdatePrecio && setEditingPrice({ id: item.id, field: "precioCompra", value: item.precioCompra || 0 })}
                            title={onUpdatePrecio ? "Doble click para editar" : ""}
                            style={{ cursor: onUpdatePrecio ? "pointer" : "default", borderBottom: onUpdatePrecio ? "1px dashed #c05621" : "none" }}>
                            {item.precioCompra > 0 ? fmt(item.precioCompra) : "—"}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "7px 10px", color: "#276749", fontWeight: 700 }}>
                        {/* 2.10 Edit inline doppio click — precioCliente */}
                        {onUpdatePrecio && editingPrice?.id === item.id && editingPrice?.field === "precioCliente" ? (
                          <input autoFocus type="number" min={0}
                            value={editingPrice.value}
                            onChange={e => setEditingPrice(ep => ({ ...ep, value: e.target.value }))}
                            onBlur={() => { onUpdatePrecio(item.id, "precioCliente", +editingPrice.value); setEditingPrice(null); }}
                            onKeyDown={e => { if (e.key === "Enter") { onUpdatePrecio(item.id, "precioCliente", +editingPrice.value); setEditingPrice(null); } if (e.key === "Escape") setEditingPrice(null); }}
                            style={{ width: 90, padding: "3px 6px", border: "2px solid #276749", borderRadius: 6, fontSize: 12, color: "#276749", fontWeight: 700, textAlign: "right" }} />
                        ) : (
                          <span
                            onDoubleClick={() => onUpdatePrecio && setEditingPrice({ id: item.id, field: "precioCliente", value: item.precioCliente || item.precio || 0 })}
                            title={onUpdatePrecio ? "Doble click para editar" : ""}
                            style={{ cursor: onUpdatePrecio ? "pointer" : "default", borderBottom: onUpdatePrecio ? "1px dashed #276749" : "none" }}>
                            {item.precioCliente > 0 ? fmt(item.precioCliente) : item.precio > 0 ? fmt(item.precio) : "—"}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "7px 8px" }}>
                        {mg !== null ? (
                          <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                            background: mg > 20 ? "#f0fff4" : mg > 10 ? "#fffff0" : "#fff5f5",
                            color: mg > 20 ? "#276749" : mg > 10 ? "#b7791f" : "#c53030" }}>
                            {fmtPct(mg)}
                          </span>
                        ) : "—"}
                      </td>
                      <td style={{ padding: "7px 10px", color: "#718096", fontSize: 11 }}>{item.proveedor || "—"}</td>
                      <td style={{ padding: "7px 8px" }}>
                        <div style={{ display: "flex", gap: 5 }}>
                          <button onClick={() => onAddFromListino(item)}
                            style={{ padding: "4px 9px", background: "#ebf8ff", border: "1px solid #bee3f8",
                              borderRadius: 7, cursor: "pointer", color: "#2b6cb0", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                            + {t.costos || "Usar"}
                          </button>
                          <button onClick={() => onDeleteItem(item.id)} aria-label="Eliminar"
                            style={{ padding: "4px 8px", background: "#fff5f5", border: "1px solid #fed7d7",
                              borderRadius: 7, cursor: "pointer", color: "#c53030", fontSize: 11 }}>✕</button>
                        </div>
                      </td>
                    </tr>
                  );
                });
                return rows;
              })()}
            </tbody>
          </table>
        </div>
      )}
      </>)}{/* fine vistaTab === listino */}
    </div>
  );
}
