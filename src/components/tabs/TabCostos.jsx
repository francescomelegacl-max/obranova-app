// ─── components/tabs/TabCostos.jsx ──────────────────────────────────────────
import { useState, useEffect, useMemo, useCallback } from "react";
import { fmt } from "../../utils/helpers";
import { catColor, CategoryChips, CategoryDivider, CategoryDividerMobile } from "../ui/CategoryFilters";
import * as XLSX from "xlsx";
import { useTemplates, CATEGORIAS } from "../../hooks/useTemplates";

// ── Export Excel partidas per categoria ───────────────────────────────────────
function exportExcelCostos(partidas, cats, info = {}) {
  const wb = XLSX.utils.book_new();

  // ── Foglio 1: Dettaglio partidas raggruppate per categoria ────────────────
  const rows = [];
  // Intestazione progetto
  rows.push(["PRESUPUESTO", info.descripcion || "", "", "", "", "", ""]);
  rows.push(["Cliente:", info.cliente || "", "", "Fecha:", new Date().toLocaleDateString("es-CL"), "", ""]);
  rows.push([]);

  // Header colonne
  rows.push(["Categoría", "Descripción", "Unidad", "Cantidad", "Precio/u", "Total", "Proveedor"]);

  // Partidas raggruppate per categoria
  const byCat = {};
  cats.forEach(c => { byCat[c] = []; });
  partidas.forEach(p => {
    if (!byCat[p.cat]) byCat[p.cat] = [];
    byCat[p.cat].push(p);
  });

  let grandTotal = 0;
  Object.entries(byCat).forEach(([cat, ps]) => {
    if (!ps.length) return;
    const catTotal = ps.reduce((s, p) => s + p.cant * p.pu, 0);
    grandTotal += catTotal;
    // Riga categoria
    rows.push([`── ${cat} ──`, "", "", "", "", "", ""]);
    ps.forEach(p => {
      rows.push([cat, p.nombre, p.unidad, p.cant, p.pu, p.cant * p.pu, p.proveedor || ""]);
    });
    // Subtotale categoria
    rows.push(["", `SUBTOTAL ${cat}`, "", "", "", catTotal, ""]);
    rows.push([]);
  });

  // Totali finali
  rows.push(["", "COSTO DIRECTO TOTAL", "", "", "", grandTotal, ""]);

  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Larghezze colonne
  ws["!cols"] = [
    { wch: 18 }, { wch: 38 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 18 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Costos");

  // ── Foglio 2: Riepilogo per categoria ─────────────────────────────────────
  const resumen = [["Categoría", "N° Partidas", "Total CLP", "% del total"]];
  Object.entries(byCat).forEach(([cat, ps]) => {
    if (!ps.length) return;
    const catTotal = ps.reduce((s, p) => s + p.cant * p.pu, 0);
    resumen.push([cat, ps.length, catTotal, grandTotal ? +(catTotal / grandTotal * 100).toFixed(1) : 0]);
  });
  resumen.push(["TOTAL", partidas.length, grandTotal, 100]);
  const ws2 = XLSX.utils.aoa_to_sheet(resumen);
  ws2["!cols"] = [{ wch: 20 }, { wch: 12 }, { wch: 16 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws2, "Resumen");

  // Genera file
  const fecha = new Date().toISOString().slice(0, 10);
  const nombre = info.cliente ? `Costos_${info.cliente}_${fecha}` : `Costos_${fecha}`;
  XLSX.writeFile(wb, `${nombre}.xlsx`);
}

// ── 3.3 Modal — Salva come template ──────────────────────────────────────────
function ModalSalvaTemplate({ partidas, pct, condPago, condPagoPersonalizado, cuotas, iva, onSave, onClose }) {
  const [nombre,    setNombre]    = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [nota,      setNota]      = useState("");

  const inputStyle = { width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#1a365d", boxSizing: "border-box" };
  const labelStyle = { fontSize: 12, color: "#4a5568", fontWeight: 600, display: "block", marginBottom: 3 };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 2500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "white", borderRadius: 16, padding: 24, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,.35)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#1a365d" }}>💾 Guardar como template</div>
          <button onClick={onClose} style={{ background: "#2d3748", border: "none", borderRadius: 8, cursor: "pointer", padding: "5px 12px", color: "white", fontWeight: 700 }}>✕</button>
        </div>
        <div style={{ background: "#f7fafc", borderRadius: 9, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#718096" }}>
          Se guardarán <strong style={{ color: "#1a365d" }}>{partidas.length} partidas</strong> con sus categorías, porcentajes y condición de pago.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Nombre del template *</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)} autoFocus style={inputStyle}
              placeholder="Ej. Baño completo, Pintura interior..." />
          </div>
          <div>
            <label style={labelStyle}>Categoría</label>
            <select value={categoria} onChange={e => setCategoria(e.target.value)} style={inputStyle}>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Nota (opcional)</label>
            <input value={nota} onChange={e => setNota(e.target.value)} style={inputStyle}
              placeholder="Descripción breve del template..." />
          </div>
          <button
            onClick={() => {
              if (!nombre.trim()) { alert("Ingresa un nombre para el template"); return; }
              onSave({ nombre: nombre.trim(), categoria, nota, partidas, pct, condPago, condPagoPersonalizado, cuotas, iva });
              onClose();
            }}
            style={{ padding: 11, background: "#1a365d", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14, marginTop: 4 }}>
            💾 Guardar template
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 3.3 Modal — Aplicar template ─────────────────────────────────────────────
function ModalAplicarTemplate({ templates, onApply, onDelete, onClose }) {
  const [filterCat, setFilterCat] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const cats = [...new Set(templates.map(t => t.categoria))];
  const filtered = filterCat ? templates.filter(t => t.categoria === filterCat) : templates;

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 2500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 560, maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,.35)" }}>
        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#1a365d" }}>📂 Aplicar template</div>
          <button onClick={onClose} style={{ background: "#2d3748", border: "none", borderRadius: 8, cursor: "pointer", padding: "5px 12px", color: "white", fontWeight: 700 }}>✕</button>
        </div>
        {/* Filtri categoria */}
        {cats.length > 1 && (
          <div style={{ padding: "10px 16px", borderBottom: "1px solid #f0f4f8", display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button onClick={() => setFilterCat(null)}
              style={{ padding: "4px 12px", borderRadius: 99, fontSize: 11, fontWeight: 600, border: "1px solid", cursor: "pointer",
                background: !filterCat ? "#1a365d" : "white", color: !filterCat ? "white" : "#718096", borderColor: !filterCat ? "#1a365d" : "#e2e8f0" }}>
              Todos
            </button>
            {cats.map(c => (
              <button key={c} onClick={() => setFilterCat(c === filterCat ? null : c)}
                style={{ padding: "4px 12px", borderRadius: 99, fontSize: 11, fontWeight: 600, border: "1px solid", cursor: "pointer",
                  background: filterCat === c ? "#2b6cb0" : "white", color: filterCat === c ? "white" : "#718096", borderColor: filterCat === c ? "#2b6cb0" : "#e2e8f0" }}>
                {c}
              </button>
            ))}
          </div>
        )}
        {/* Lista templates */}
        <div style={{ overflow: "auto", flex: 1, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#a0aec0" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
              No hay templates guardados aún.
            </div>
          )}
          {filtered.map(tpl => (
            <div key={tpl.id} style={{ background: "#f7fafc", borderRadius: 12, padding: "12px 16px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d" }}>{tpl.nombre}</div>
                  <div style={{ fontSize: 11, color: "#718096", marginTop: 2, display: "flex", gap: 10 }}>
                    <span>📦 {tpl.partidas?.length || 0} partidas</span>
                    <span>🗓 {tpl.creadoAt}</span>
                    {tpl.usadoVeces > 0 && <span>✅ Usado {tpl.usadoVeces}x</span>}
                  </div>
                  {tpl.nota && <div style={{ fontSize: 11, color: "#4a5568", marginTop: 3, fontStyle: "italic" }}>{tpl.nota}</div>}
                </div>
                <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                  {confirmId === tpl.id ? (
                    <>
                      <button onClick={() => { onDelete(tpl.id); setConfirmId(null); }}
                        style={{ padding: "5px 10px", background: "#c53030", color: "white", border: "none", borderRadius: 7, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
                        Eliminar
                      </button>
                      <button onClick={() => setConfirmId(null)}
                        style={{ padding: "5px 10px", background: "#f7fafc", border: "1px solid #e2e8f0", borderRadius: 7, cursor: "pointer", fontSize: 11, color: "#718096" }}>
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setConfirmId(tpl.id)}
                        style={{ padding: "5px 9px", background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 7, cursor: "pointer", color: "#c53030", fontSize: 12 }}>
                        🗑️
                      </button>
                      <button onClick={() => { onApply(tpl); onClose(); }}
                        style={{ padding: "6px 14px", background: "#1a365d", color: "white", border: "none", borderRadius: 7, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
                        Aplicar →
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
export default function TabCostos({ partidas = [], cats = [], addPartida, updP, delP, dupP, addFromListino, listino = [], t = {}, info = {}, pct = {}, condPago = "", condPagoPersonalizado = "", cuotas = [], iva = false, onApplyTemplate, canExcel = true, canTemplates = true, canPlan, onPaywall }) {
  const [filterCat,       setFilterCat]       = useState(null);
  const [showExtras,      setShowExtras]      = useState(false);
  const [editingP,        setEditingP]        = useState(null);
  const [showSalvaTPL,    setShowSalvaTPL]    = useState(false);  // 3.3
  const [showAplicaTPL,   setShowAplicaTPL]   = useState(false);  // 3.3
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 767px)").matches);
  // 2.2 Drag & drop state
  const [dragId,   setDragId]   = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const { getAll, saveTemplate, deleteTemplate, markUsed } = useTemplates();

  // 2.2 Handlers drag & drop (reordina partidas via updP)
  const handleDragStart = useCallback((id) => setDragId(id), []);
  const handleDragEnd   = useCallback(() => { setDragId(null); setDragOver(null); }, []);
  const handleDrop      = useCallback((targetId) => {
    if (!dragId || dragId === targetId) return;
    const from = partidas.findIndex(p => p.id === dragId);
    const to   = partidas.findIndex(p => p.id === targetId);
    if (from === -1 || to === -1) return;
    const reordered = [...partidas];
    const [moved]   = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    // Aggiorna campo "order" su ciascuna partida spostata
    reordered.forEach((p, i) => { if (p.order !== i) updP(p.id, { order: i }); });
    setDragId(null); setDragOver(null);
  }, [dragId, partidas, updP]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const cd = useMemo(() => partidas.reduce((s, p) => s + p.cant * p.pu, 0), [partidas]);

  const filtered = useMemo(() => {
    const list = filterCat ? partidas.filter(p => p.cat === filterCat) : [...partidas];
    // 2.2 Se hanno campo order, usa quello; altrimenti ordina per categoria
    const hasOrder = list.some(p => p.order !== undefined);
    if (hasOrder) return list.sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
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
          draggable
          onDragStart={() => handleDragStart(p.id)}
          onDragEnd={handleDragEnd}
          onDragOver={e => { e.preventDefault(); setDragOver(p.id); }}
          onDrop={() => handleDrop(p.id)}
          style={{
            background: dragOver === p.id && dragId !== p.id ? "#ebf8ff" : i % 2 === 0 ? "#f7fafc" : "white",
            opacity: dragId === p.id ? 0.4 : 1,
            cursor: "grab",
            outline: dragOver === p.id && dragId !== p.id ? "2px dashed #2b6cb0" : "none",
          }}
          onMouseEnter={e => { if (dragId !== p.id) e.currentTarget.style.background = "#ebf8ff"; }}
          onMouseLeave={e => { if (dragId !== p.id) e.currentTarget.style.background = i % 2 === 0 ? "#f7fafc" : "white"; }}
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
        // 2.2 Drag & drop wrapper
        <div key={p.id}
          draggable
          onDragStart={() => handleDragStart(p.id)}
          onDragEnd={handleDragEnd}
          onDragOver={e => { e.preventDefault(); setDragOver(p.id); }}
          onDrop={() => handleDrop(p.id)}
          style={{ opacity: dragId === p.id ? 0.4 : 1, outline: dragOver === p.id && dragId !== p.id ? "2px dashed #2b6cb0" : "none", borderRadius: 12, transition: "opacity .15s" }}>
          <PartidaCard p={p} cats={cats} updP={updP} delP={delP} dupP={dupP} onEdit={setEditingP} t={t} />
        </div>
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
        {/* 2.1 Export Excel */}
        {partidas.length > 0 && (
          <button
            onClick={() => canExcel ? exportExcelCostos(partidas, cats, info) : onPaywall?.("exportExcel")}
            title={canExcel ? "Exportar a Excel (.xlsx)" : "Disponible en Plan Pro"}
            style={{ padding: isMobile ? "12px 14px" : "8px 14px", background: canExcel ? "#276749" : "#e2e8f0", color: canExcel ? "white" : "#a0aec0", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: isMobile ? 15 : 12, display: "flex", alignItems: "center", gap: 5 }}>
            📊 {!isMobile && (canExcel ? "Excel" : "Excel 🔒")}
          </button>
        )}
        {/* 3.3 Templates */}
        <button
          onClick={() => canTemplates ? setShowAplicaTPL(true) : onPaywall?.("templates")}
          title={canTemplates ? "Aplicar un template guardado" : "Disponible en Plan Pro"}
          style={{ padding: isMobile ? "12px 14px" : "8px 14px", background: canTemplates ? "#ebf8ff" : "#f7fafc", border: `1px solid ${canTemplates ? "#bee3f8" : "#e2e8f0"}`, borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: isMobile ? 15 : 12, color: canTemplates ? "#2b6cb0" : "#a0aec0", display: "flex", alignItems: "center", gap: 5 }}>
          📂 {!isMobile && (canTemplates ? "Templates" : "Templates 🔒")}
        </button>
        {partidas.length > 0 && canTemplates && (
          <button
            onClick={() => setShowSalvaTPL(true)}
            title="Guardar partidas como template reutilizable"
            style={{ padding: isMobile ? "12px 14px" : "8px 14px", background: "white", border: "1px solid #e2e8f0", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: isMobile ? 15 : 12, color: "#718096", display: "flex", alignItems: "center", gap: 5 }}>
            💾 {!isMobile && "Guardar como template"}
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

      {/* 3.3 Modal Salva Template */}
      {showSalvaTPL && (
        <ModalSalvaTemplate
          partidas={partidas} pct={pct}
          condPago={condPago} condPagoPersonalizado={condPagoPersonalizado}
          cuotas={cuotas} iva={iva}
          onSave={(data) => { saveTemplate(data); }}
          onClose={() => setShowSalvaTPL(false)}
        />
      )}

      {/* 3.3 Modal Applica Template */}
      {showAplicaTPL && (
        <ModalAplicarTemplate
          templates={getAll()}
          onApply={(tpl) => {
            markUsed(tpl.id);
            onApplyTemplate?.(tpl);
          }}
          onDelete={deleteTemplate}
          onClose={() => setShowAplicaTPL(false)}
        />
      )}
    </div>
  );
}
