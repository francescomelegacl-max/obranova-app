// ─── components/tabs/TabMagazzino.jsx ───────────────────────────────────────
import { useState, useMemo, useRef } from "react";
import { MOVIMENTO_TYPES, MOVIMENTO_LABELS } from "../../hooks/useMagazzino";
import { fmt } from "../../utils/helpers";
import { DEFAULT_CATS } from "../../utils/constants";
import { CAT_COLORS, catColor, CategoryChips, CategoryDivider, CategoryDividerMobile } from "../ui/CategoryFilters";
import * as XLSX from "xlsx";

// ── Parsing CSV/Excel → array di oggetti normalizzati ─────────────────────────
function parseImportFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { defval: "" });
        // Normalizza nomi colonne (case insensitive, alias comuni)
        const MAP = {
          nombre: ["nombre", "nome", "name", "articulo", "artículo", "descripcion", "descripción", "item"],
          categoria: ["categoria", "categoría", "category", "cat"],
          unita: ["unita", "unidad", "unit", "unità", "ud"],
          giacenza: ["giacenza", "stock", "cantidad", "qty", "quantity", "existencia"],
          giacenzaMinima: ["giacenzaminima", "stockminimo", "mínimo", "minimo", "min"],
          prezzo: ["prezzo", "precio", "price", "costo", "cost", "valor"],
          fornitore: ["fornitore", "proveedor", "supplier"],
          note: ["note", "notas", "notes", "nota", "observaciones"],
        };
        const colMap = {};
        if (raw.length > 0) {
          Object.keys(raw[0]).forEach(col => {
            const colLow = col.toLowerCase().replace(/[\s_\-]/g, "");
            Object.entries(MAP).forEach(([field, aliases]) => {
              if (aliases.some(a => colLow.includes(a))) colMap[field] = col;
            });
          });
        }
        const items = raw
          .filter(r => r[colMap.nombre])
          .map(r => ({
            nome:           String(r[colMap.nombre] || "").trim(),
            categoria:      String(r[colMap.categoria] || DEFAULT_CATS[0]).trim() || DEFAULT_CATS[0],
            unita:          String(r[colMap.unita] || "un").trim() || "un",
            giacenza:       Number(r[colMap.giacenza]) || 0,
            giacenzaMinima: Number(r[colMap.giacenzaMinima]) || 0,
            prezzo:         Number(r[colMap.prezzo]) || 0,
            fornitore:      String(r[colMap.fornitore] || "").trim(),
            note:           String(r[colMap.note] || "").trim(),
          }));
        resolve(items);
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsBinaryString(file);
  });
}

// ── Modal preview import ──────────────────────────────────────────────────────
function ModalImport({ items, cats, onConfirm, onClose }) {
  const [selected, setSelected] = useState(() => new Set(items.map((_, i) => i)));
  const toggleAll = () => setSelected(s => s.size === items.length ? new Set() : new Set(items.map((_, i) => i)));

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 700, maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,.35)" }}>
        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#1a365d" }}>📥 Vista previa — {items.length} artículos</div>
            <div style={{ fontSize: 12, color: "#718096", marginTop: 2 }}>Selecciona los artículos a importar</div>
          </div>
          <button onClick={onClose} style={{ background: "#2d3748", border: "none", borderRadius: 8, cursor: "pointer", padding: "5px 12px", color: "white", fontWeight: 700 }}>✕</button>
        </div>
        {/* Tabella preview */}
        <div style={{ overflow: "auto", flex: 1 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#f7fafc", position: "sticky", top: 0 }}>
                <th style={{ padding: "8px 10px" }}>
                  <input type="checkbox" checked={selected.size === items.length} onChange={toggleAll} />
                </th>
                {["Nombre", "Categoría", "Ud.", "Stock", "Precio/u", "Proveedor"].map(h => (
                  <th key={h} style={{ padding: "8px 8px", textAlign: "left", fontWeight: 600, color: "#4a5568" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} style={{ background: selected.has(i) ? "#f0fff4" : "white", borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "7px 10px", textAlign: "center" }}>
                    <input type="checkbox" checked={selected.has(i)}
                      onChange={() => setSelected(s => { const ns = new Set(s); ns.has(i) ? ns.delete(i) : ns.add(i); return ns; })} />
                  </td>
                  <td style={{ padding: "7px 8px", fontWeight: 600, color: "#1a365d" }}>{item.nome}</td>
                  <td style={{ padding: "7px 8px" }}>
                    <span style={{ padding: "1px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700,
                      background: catColor(item.categoria).bg, color: catColor(item.categoria).text }}>
                      {item.categoria}
                    </span>
                  </td>
                  <td style={{ padding: "7px 8px", color: "#718096" }}>{item.unita}</td>
                  <td style={{ padding: "7px 8px", fontWeight: 700, color: "#276749" }}>{item.giacenza}</td>
                  <td style={{ padding: "7px 8px", color: "#2b6cb0" }}>{item.prezzo > 0 ? fmt(item.prezzo) : "—"}</td>
                  <td style={{ padding: "7px 8px", color: "#718096" }}>{item.fornitore || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: "#718096" }}>{selected.size} de {items.length} seleccionados</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose}
              style={{ padding: "9px 18px", background: "#f7fafc", border: "1px solid #e2e8f0", borderRadius: 9, cursor: "pointer", fontWeight: 600, color: "#4a5568" }}>
              Cancelar
            </button>
            <button
              onClick={() => { onConfirm(items.filter((_, i) => selected.has(i))); onClose(); }}
              disabled={!selected.size}
              style={{ padding: "9px 22px", background: selected.size ? "#1a365d" : "#a0aec0", color: "white", border: "none", borderRadius: 9, cursor: selected.size ? "pointer" : "default", fontWeight: 700, fontSize: 13 }}>
              📥 Importar {selected.size > 0 ? `(${selected.size})` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const UNITA = ["un", "m²", "m³", "ml", "kg", "ton", "lt", "sacco", "pza", "gl", "hr"];

// ─── Form articolo ────────────────────────────────────────────────────────────
const FormArticolo = ({ cats, initial, onSave, onClose }) => {
  const [f, setF] = useState(initial ? { ...initial } : {
    nome: "", categoria: cats[0] || "", unita: "un",
    giacenza: 0, giacenzaMinima: 0, prezzo: 0, fornitore: "", note: "",
  });
  const u = (k, v) => setF(x => ({ ...x, [k]: v }));
  const ok = () => { if (!f.nome.trim()) { alert("Inserisci un nome"); return; } onSave(f); };

  const inputStyle = {
    width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0",
    borderRadius: 8, fontSize: 13, color: "#1a365d", boxSizing: "border-box",
  };
  const labelStyle = { fontSize: 12, color: "#4a5568", fontWeight: 600, display: "block", marginBottom: 3 };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "white", borderRadius: 16, padding: 24, width: "100%", maxWidth: 500, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.35)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#1a365d" }}>
            {initial ? "✏️ Editar artículo" : "📦 Nuevo artículo"}
          </div>
          <button onClick={onClose} style={{ background: "#2d3748", border: "none", borderRadius: 8, cursor: "pointer", padding: "5px 12px", color: "white", fontWeight: 700 }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Nome articolo *</label>
            <input value={f.nome} onChange={e => u("nome", e.target.value)} autoFocus style={inputStyle} placeholder="Ej. Cemento Portland 42.5" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={labelStyle}>Categoria</label>
              <select value={f.categoria} onChange={e => u("categoria", e.target.value)} style={inputStyle}>
                {cats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Unità di misura</label>
              <select value={f.unita} onChange={e => u("unita", e.target.value)} style={inputStyle}>
                {UNITA.map(x => <option key={x} value={x}>{x}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ ...labelStyle, color: "#276749" }}>📦 Giacenza attuale</label>
              <input type="number" value={f.giacenza} onChange={e => u("giacenza", e.target.value)} min={0} style={inputStyle} />
            </div>
            <div>
              <label style={{ ...labelStyle, color: "#c05621" }}>⚠️ Scorta minima</label>
              <input type="number" value={f.giacenzaMinima} onChange={e => u("giacenzaMinima", e.target.value)} min={0} style={inputStyle} />
            </div>
            <div>
              <label style={{ ...labelStyle, color: "#2b6cb0" }}>💰 Prezzo/unità</label>
              <input type="number" value={f.prezzo} onChange={e => u("prezzo", e.target.value)} min={0} style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Fornitore</label>
            <input value={f.fornitore} onChange={e => u("fornitore", e.target.value)} style={inputStyle} placeholder="Ej. Sodimac, Easy..." />
          </div>
          <div>
            <label style={labelStyle}>Note</label>
            <textarea value={f.note} onChange={e => u("note", e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} placeholder="Notas internas..." />
          </div>
          <button onClick={ok}
            style={{ padding: 11, background: "#1a365d", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14, marginTop: 4 }}>
            💾 {initial ? "Guardar cambios" : "Agregar a bodega"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Modal movimento ──────────────────────────────────────────────────────────
const ModalMovimento = ({ item, proyectos, onSave, onClose }) => {
  const [tipo,       setTipo]       = useState(MOVIMENTO_TYPES.CARICO);
  const [quantita,   setQuantita]   = useState("");
  const [note,       setNote]       = useState("");
  const [proyectoId, setProyectoId] = useState("");
  const ml = MOVIMENTO_LABELS[tipo];

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 2100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "white", borderRadius: 16, padding: 24, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,.35)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1a365d" }}>Registra movimento</div>
          <button onClick={onClose} style={{ background: "#2d3748", border: "none", borderRadius: 8, cursor: "pointer", padding: "5px 12px", color: "white", fontWeight: 700 }}>✕</button>
        </div>
        <div style={{ background: "#f7fafc", borderRadius: 9, padding: "10px 14px", marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d" }}>{item.nome}</div>
          <div style={{ fontSize: 12, color: "#718096", marginTop: 2 }}>
            Stock actual: <strong style={{ color: "#276749" }}>{item.giacenza} {item.unita}</strong>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 14 }}>
          {Object.entries(MOVIMENTO_LABELS).map(([tipo_key, data]) => (
            <button key={tipo_key} onClick={() => setTipo(tipo_key)}
              style={{ padding: "9px 10px", borderRadius: 9, border: `2px solid ${tipo === tipo_key ? data.color : "#e2e8f0"}`, background: tipo === tipo_key ? data.bg : "white", color: tipo === tipo_key ? data.color : "#718096", cursor: "pointer", fontWeight: tipo === tipo_key ? 700 : 500, fontSize: 13, transition: "all .2s" }}>
              {data.label}
            </button>
          ))}
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: "#4a5568", fontWeight: 600, display: "block", marginBottom: 3 }}>
            {tipo === MOVIMENTO_TYPES.RETTIFICA ? "Nueva cantidad exacta" : "Cantidad"} ({item.unita})
          </label>
          <input type="number" value={quantita} onChange={e => setQuantita(e.target.value)} min={0} autoFocus
            style={{ width: "100%", padding: "10px 12px", border: "2px solid #e2e8f0", borderRadius: 8, fontSize: 15, color: "#1a365d", boxSizing: "border-box", fontWeight: 700 }} />
        </div>
        {proyectos?.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "#4a5568", fontWeight: 600, display: "block", marginBottom: 3 }}>Proyecto (opcional)</label>
            <select value={proyectoId} onChange={e => setProyectoId(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#1a365d", boxSizing: "border-box" }}>
              <option value="">— Sin proyecto —</option>
              {proyectos.map(p => <option key={p.id} value={p.id}>{p.info?.nombre || p.id}</option>)}
            </select>
          </div>
        )}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: "#4a5568", fontWeight: 600, display: "block", marginBottom: 3 }}>Note</label>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note opzionali..."
            style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#1a365d", boxSizing: "border-box" }} />
        </div>
        <button
          onClick={() => { if (!quantita) return; onSave({ tipo, quantita: +quantita, note, proyectoId }); onClose(); }}
          style={{ width: "100%", padding: 12, background: ml?.color || "#276749", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
          {ml?.label || "Confirmar"} {quantita ? `— ${quantita} ${item.unita}` : ""}
        </button>
      </div>
    </div>
  );
};

// ─── TabMagazzino principale ───────────────────────────────────────────────────
export default function TabMagazzino({
  items = [], movimenti = [], proyectos = [],
  onSaveItem, onDeleteItem, onMovimento,
  loading = false, cats: propCats,
}) {
  const [filterCat,     setFilterCat]     = useState(null);
  const [filterAlert,   setFilterAlert]   = useState(false);
  const [search,        setSearch]        = useState("");
  const [showMovimenti, setShowMovimenti] = useState(false);
  const [showForm,      setShowForm]      = useState(false);
  const [editItem,      setEditItem]      = useState(null);
  const [movItem,       setMovItem]       = useState(null);
  // 2.7 Import
  const [importPreview, setImportPreview] = useState(null); // array items da preview
  const [importing,     setImporting]     = useState(false);
  const fileInputRef = useRef(null);

  const allCats = propCats || DEFAULT_CATS;

  // ── Filtro + ricerca ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...items];
    if (filterCat)   list = list.filter(x => x.categoria === filterCat);
    if (filterAlert) list = list.filter(x => x.giacenzaMinima > 0 && x.giacenza <= x.giacenzaMinima);
    if (search)      list = list.filter(x =>
      x.nome?.toLowerCase().includes(search.toLowerCase()) ||
      x.fornitore?.toLowerCase().includes(search.toLowerCase())
    );
    // Ordina per categoria per i separatori
    list.sort((a, b) => (a.categoria || "").localeCompare(b.categoria || "") || (a.nome || "").localeCompare(b.nome || ""));
    return list;
  }, [items, filterCat, filterAlert, search]);

  const valoreTotale = useMemo(() => items.reduce((s, x) => s + (x.giacenza * x.prezzo || 0), 0), [items]);

  // Conteggi per categoria
  const counts = useMemo(() => {
    const c = { _total: items.length };
    items.forEach(x => { c[x.categoria] = (c[x.categoria] || 0) + 1; });
    return c;
  }, [items]);

  const handleSaveForm = async (formData) => {
    // FIX: App.jsx passa onSaveItem (useMagazzino.saveItem) che gestisce sia add che update
    if (editItem) {
      await onSaveItem?.({ ...formData, id: editItem.id });
    } else {
      await onSaveItem?.(formData);
    }
    setShowForm(false);
    setEditItem(null);
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditItem(null);
  };

  // ── 2.7 Import CSV/Excel ──────────────────────────────────────────────────
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // reset per permettere ricaricamento stesso file
    try {
      const parsed = await parseImportFile(file);
      if (!parsed.length) { alert("Nessun articolo trovato nel file. Verifica le intestazioni delle colonne."); return; }
      setImportPreview(parsed);
    } catch (err) {
      alert("Errore nel parsing del file: " + err.message);
    }
  };

  const handleImportConfirm = async (selectedItems) => {
    setImporting(true);
    try {
      for (const item of selectedItems) {
        await onSaveItem?.(item);
      }
    } finally {
      setImporting(false);
    }
  };

  // ── Render righe raggruppate per categoria ────────────────────────────────
  const renderRows = () => {
    const rows = [];
    let lastCat = null;
    filtered.forEach((item, i) => {
      const inAlert = item.giacenzaMinima > 0 && item.giacenza <= item.giacenzaMinima;
      const valore  = item.giacenza * item.prezzo;

      // Separatore categoria
      if (!filterCat && item.categoria !== lastCat) {
        lastCat = item.categoria;
        rows.push(<CategoryDivider key={`cat-${item.categoria}`} cat={item.categoria} />);
      }

      rows.push(
        <tr key={item.id}
          style={{ background: inAlert ? "#fff5f5" : i % 2 === 0 ? "#f7fafc" : "white" }}
          onMouseEnter={e => e.currentTarget.style.background = "#ebf8ff"}
          onMouseLeave={e => e.currentTarget.style.background = inAlert ? "#fff5f5" : i % 2 === 0 ? "#f7fafc" : "white"}
        >
          <td style={{ padding: "10px 10px" }}>
            <div style={{ fontWeight: 700, color: "#1a365d", fontSize: 13 }}>{item.nome}</div>
            {item.note && <div style={{ fontSize: 10, color: "#a0aec0", marginTop: 1 }}>{item.note}</div>}
          </td>
          <td style={{ padding: "10px 8px" }}>
            {(() => { const col = catColor(item.categoria); return (
              <span style={{ padding: "2px 10px", borderRadius: 99, fontSize: 10, fontWeight: 700,
                background: col.bg, color: col.text, border: `1px solid ${col.border}` }}>
                {item.categoria}
              </span>
            ); })()}
          </td>
          <td style={{ padding: "10px 8px" }}>
            <span style={{ fontWeight: 800, fontSize: 14, color: inAlert ? "#c53030" : "#276749" }}>{item.giacenza}</span>
            <span style={{ color: "#718096", fontSize: 11, marginLeft: 4 }}>{item.unita}</span>
            {inAlert && <span style={{ marginLeft: 6, fontSize: 10, color: "#c53030", fontWeight: 700 }}>⚠️</span>}
          </td>
          <td style={{ padding: "10px 8px", color: "#718096", fontSize: 12 }}>
            {item.giacenzaMinima > 0 ? `${item.giacenzaMinima} ${item.unita}` : "—"}
          </td>
          <td style={{ padding: "10px 8px", color: "#2b6cb0", fontWeight: 600 }}>
            {item.prezzo > 0 ? fmt(item.prezzo) : "—"}
          </td>
          <td style={{ padding: "10px 8px", color: "#276749", fontWeight: 700 }}>
            {valore > 0 ? fmt(valore) : "—"}
          </td>
          <td style={{ padding: "10px 8px", color: "#718096", fontSize: 11 }}>{item.fornitore || "—"}</td>
          <td style={{ padding: "10px 8px" }}>
            <div style={{ display: "flex", gap: 5 }}>
              <button onClick={() => setMovItem(item)} title="Registrar movimiento"
                style={{ padding: "5px 9px", background: "#ebf8ff", border: "1px solid #bee3f8", borderRadius: 7, cursor: "pointer", color: "#2b6cb0", fontSize: 12, fontWeight: 600 }}>
                🔄
              </button>
              <button onClick={() => handleEdit(item)} title="Editar artículo"
                style={{ padding: "5px 9px", background: "#f7fafc", border: "1px solid #e2e8f0", borderRadius: 7, cursor: "pointer", color: "#4a5568", fontSize: 12 }}>
                ✏️
              </button>
              <button onClick={() => onDeleteItem?.(item.id)} title="Eliminar"
                style={{ padding: "5px 9px", background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 7, cursor: "pointer", color: "#c53030", fontSize: 12 }}>
                🗑️
              </button>
            </div>
          </td>
        </tr>
      );
    });
    return rows;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={() => { setEditItem(null); setShowForm(true); }}
          style={{ padding: "9px 18px", background: "#1a365d", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
          ➕ Nuevo artículo
        </button>
        {/* 2.7 Import CSV/Excel */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          title="Importar inventario desde CSV o Excel"
          style={{ padding: "9px 14px", background: importing ? "#a0aec0" : "#2b6cb0", color: "white", border: "none", borderRadius: 10, cursor: importing ? "default" : "pointer", fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
          📥 {importing ? "Importando..." : "Importar CSV/Excel"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />
        <button onClick={() => setShowMovimenti(v => !v)}
          style={{ padding: "9px 14px", background: showMovimenti ? "#2b6cb0" : "#f0f4f8", color: showMovimenti ? "white" : "#718096", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
          🔄 Movimientos
        </button>
        <button onClick={() => setFilterAlert(v => !v)}
          style={{ padding: "9px 14px", background: filterAlert ? "#c53030" : "#f0f4f8", color: filterAlert ? "white" : "#718096", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
          ⚠️ Solo alertas
        </button>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Buscar artículo..."
          style={{ flex: 1, minWidth: 140, padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 12, color: "#1a365d" }} />
      </div>

      {/* Filtri categoria */}
      <CategoryChips
        cats={allCats.filter(c => items.some(x => x.categoria === c))}
        activeCat={filterCat}
        onChange={setFilterCat}
        counts={counts}
      />

      {/* Movimenti panel */}
      {showMovimenti && (
        <div style={{ background: "white", borderRadius: 12, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d", marginBottom: 12 }}>🔄 Ultimi movimenti</div>
          {movimenti.length === 0
            ? <div style={{ textAlign: "center", color: "#a0aec0", padding: "20px 0" }}>Nessun movimento registrato</div>
            : <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {movimenti.slice(0, 20).map(m => {
                  const ml = MOVIMENTO_LABELS[m.tipo] || MOVIMENTO_LABELS.carico;
                  return (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "#f7fafc", borderRadius: 9 }}>
                      <span style={{ padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: ml.bg, color: ml.color, whiteSpace: "nowrap" }}>{ml.label}</span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: "#1a365d" }}>{m.nomeItem}</span>
                        {m.note && <span style={{ fontSize: 11, color: "#718096", marginLeft: 8 }}>{m.note}</span>}
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: m.delta >= 0 ? "#276749" : "#c53030" }}>
                          {m.delta >= 0 ? "+" : ""}{m.delta} → <strong>{m.giacenzaPost}</strong>
                        </div>
                        <div style={{ fontSize: 10, color: "#a0aec0" }}>{m.data?.slice(0, 10)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
          }
        </div>
      )}

      {/* Tabella */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "50px 0", color: "#a0aec0" }}>Caricamento...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 0", color: "#a0aec0", background: "white", borderRadius: 12 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📦</div>
          <div>{items.length === 0 ? "Bodega vacía. ¡Agrega el primer artículo!" : "Ningún artículo encontrado."}</div>
        </div>
      ) : (
        <div style={{ background: "white", borderRadius: 12, overflow: "auto", boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 640 }}>
            <thead>
              <tr style={{ background: "#1a365d", color: "white" }}>
                {["Artículo", "Categoría", "Stock", "Stock mín.", "Precio/u", "Valor", "Proveedor", ""].map((h, i) => (
                  <th key={i} style={{ padding: "9px 10px", textAlign: "left", fontWeight: 600, fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {renderRows()}
            </tbody>
            <tfoot>
              <tr style={{ background: "#f0f4f8" }}>
                <td colSpan={5} style={{ padding: "9px 10px", fontWeight: 700, fontSize: 12, color: "#1a365d" }}>VALOR TOTAL BODEGA</td>
                <td style={{ padding: "9px 8px", fontWeight: 800, fontSize: 14, color: "#276749" }}>{fmt(valoreTotale)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Modali */}
      {showForm && (
        <FormArticolo
          cats={allCats}
          initial={editItem}
          onSave={handleSaveForm}
          onClose={handleCloseForm}
        />
      )}
      {movItem && (
        <ModalMovimento
          item={movItem}
          proyectos={proyectos}
          onSave={(data) => onMovimento?.(movItem, data)}
          onClose={() => setMovItem(null)}
        />
      )}
      {/* 2.7 Modal preview import */}
      {importPreview && (
        <ModalImport
          items={importPreview}
          cats={allCats}
          onConfirm={handleImportConfirm}
          onClose={() => setImportPreview(null)}
        />
      )}
    </div>
  );
}
