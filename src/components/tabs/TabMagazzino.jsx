// ─── components/tabs/TabMagazzino.jsx ───────────────────────────────────────
import { useState, useMemo } from "react";
import { MOVIMENTO_TYPES, MOVIMENTO_LABELS } from "../../hooks/useMagazzino";
import { fmt } from "../../utils/helpers";
import { DEFAULT_CATS } from "../../utils/constants";

const UNITA = ["un", "m²", "m³", "ml", "kg", "ton", "lt", "sacco", "pza", "gl", "hr"];

// ─── Form articolo ────────────────────────────────────────────────────────────
const FormArticolo = ({ cats, initial, onSave, onClose }) => {
  const [f, setF] = useState(initial || {
    nome: "", categoria: cats[0] || "", unita: "un",
    giacenza: 0, giacenzaMinima: 0, prezzo: 0, fornitore: "", note: "",
  });
  const u = (k, v) => setF(x => ({ ...x, [k]: v }));
  const ok = () => { if (!f.nome.trim()) { alert("Inserisci un nome"); return; } onSave(f); };

  const inputStyle = { width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#1a365d", boxSizing: "border-box" };
  const labelStyle = { fontSize: 12, color: "#4a5568", fontWeight: 600, display: "block", marginBottom: 3 };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "white", borderRadius: 16, padding: 24, width: "100%", maxWidth: 500, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.35)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#1a365d" }}>📦 {initial ? "Editar artículo" : "Nuevo artículo"}</div>
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
              <select value={f.categoria} onChange={e => u("categoria", e.target.value)} style={{ ...inputStyle }}>
                {cats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Unità di misura</label>
              <select value={f.unita} onChange={e => u("unita", e.target.value)} style={{ ...inputStyle }}>
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
          <button onClick={ok} style={{ padding: 11, background: "#1a365d", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14, marginTop: 4 }}>
            💾 {initial ? "Actualizar" : "Agregar a bodega"}
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

        {/* Articolo info */}
        <div style={{ background: "#f7fafc", borderRadius: 9, padding: "10px 14px", marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d" }}>{item.nome}</div>
          <div style={{ fontSize: 12, color: "#718096", marginTop: 2 }}>
            Stock actual: <strong style={{ color: "#276749" }}>{item.giacenza} {item.unita}</strong>
          </div>
        </div>

        {/* Tipo movimento */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginBottom: 14 }}>
          {Object.entries(MOVIMENTO_LABELS).map(([tipo_key, data]) => (
            <button key={tipo_key} onClick={() => setTipo(tipo_key)}
              style={{ padding: "9px 10px", borderRadius: 9, border: `2px solid ${tipo === tipo_key ? data.color : "#e2e8f0"}`, background: tipo === tipo_key ? data.bg : "white", color: tipo === tipo_key ? data.color : "#718096", cursor: "pointer", fontWeight: tipo === tipo_key ? 700 : 500, fontSize: 13, transition: "all .2s" }}>
              {data.label}
            </button>
          ))}
        </div>

        {/* Quantità */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: "#4a5568", fontWeight: 600, display: "block", marginBottom: 3 }}>
            {tipo === MOVIMENTO_TYPES.RETTIFICA ? "Nueva cantidad exacta" : "Cantidad"} ({item.unita})
          </label>
          <input type="number" value={quantita} onChange={e => setQuantita(e.target.value)} min={0} autoFocus
            style={{ width: "100%", padding: "10px 12px", border: "2px solid #e2e8f0", borderRadius: 8, fontSize: 15, color: "#1a365d", boxSizing: "border-box", fontWeight: 700 }} />
        </div>

        {/* Progetto collegato (solo per scarico) */}
        {tipo === MOVIMENTO_TYPES.SCARICO && proyectos.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "#4a5568", fontWeight: 600, display: "block", marginBottom: 3 }}>Progetto collegato (opzionale)</label>
            <select value={proyectoId} onChange={e => setProyectoId(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#1a365d", background: "white" }}>
              <option value="">— Nessun progetto —</option>
              {proyectos.map(p => <option key={p.id} value={p.id}>{p.info?.cliente || "Senza nome"} — {p.info?.descripcion?.slice(0, 30) || ""}</option>)}
            </select>
          </div>
        )}

        {/* Note */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: "#4a5568", fontWeight: 600, display: "block", marginBottom: 3 }}>Note</label>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Ej. Entrega proveedor, Obra calle..."
            style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#1a365d", boxSizing: "border-box" }} />
        </div>

        <button onClick={() => onSave({ itemId: item.id, tipo, quantita, note, proyectoId })} disabled={!quantita}
          style={{ width: "100%", padding: 11, background: ml.color, color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14, opacity: !quantita ? .5 : 1 }}>
          {ml.label} — {quantita || "0"} {item.unita}
        </button>
      </div>
    </div>
  );
};

// ─── TabMagazzino ─────────────────────────────────────────────────────────────
export default function TabMagazzino({ items, movimenti, itemsInAlert, loading, cats, proyectos, onSaveItem, onDeleteItem, onMovimento }) {
  const [showForm,      setShowForm]      = useState(false);
  const [editItem,      setEditItem]      = useState(null);
  const [movItem,       setMovItem]       = useState(null);
  const [search,        setSearch]        = useState("");
  const [filterCat,     setFilterCat]     = useState(null);
  const [showMovimenti, setShowMovimenti] = useState(false);
  const [filterAlert,   setFilterAlert]   = useState(false);

  const allCats = useMemo(() => {
    const fromItems = [...new Set(items.map(x => x.categoria).filter(Boolean))];
    return [...new Set([...DEFAULT_CATS, ...fromItems])];
  }, [items]);

  const filtered = useMemo(() => items
    .filter(x => !filterCat || x.categoria === filterCat)
    .filter(x => !filterAlert || (x.giacenzaMinima > 0 && x.giacenza <= x.giacenzaMinima))
    .filter(x => !search || x.nome.toLowerCase().includes(search.toLowerCase()) || x.fornitore?.toLowerCase().includes(search.toLowerCase()))
  , [items, filterCat, filterAlert, search]);

  const valoreTotale = useMemo(() => items.reduce((s, x) => s + (x.giacenza * x.prezzo), 0), [items]);

  const handleSave = async (form) => {
    await onSaveItem(form, editItem?.id || null);
    setShowForm(false);
    setEditItem(null);
  };

  const handleMovimento = async (data) => {
    await onMovimento(data);
    setMovItem(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Modali */}
      {(showForm || editItem) && (
        <FormArticolo cats={allCats} initial={editItem} onSave={handleSave} onClose={() => { setShowForm(false); setEditItem(null); }} />
      )}
      {movItem && (
        <ModalMovimento item={movItem} proyectos={proyectos} onSave={handleMovimento} onClose={() => setMovItem(null)} />
      )}

      {/* Header + KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10 }}>
        <div style={{ background: "linear-gradient(135deg,#1a365d,#2d3748)", borderRadius: 12, padding: "14px 16px", color: "white", gridColumn: "span 2" }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 2 }}>🏭 Magazzino</div>
          <div style={{ color: "#a0aec0", fontSize: 12 }}>{items.length} artículos · Valor total: <strong style={{ color: "white" }}>{fmt(valoreTotale)}</strong></div>
        </div>
        {[
          { label: "Artículos totales",   value: items.length,            icon: "📦", color: "#2b6cb0", bg: "#ebf8ff" },
          { label: "Bajo stock mín.", value: itemsInAlert.length,     icon: "⚠️", color: itemsInAlert.length > 0 ? "#c53030" : "#276749", bg: itemsInAlert.length > 0 ? "#fff5f5" : "#f0fff4" },
          { label: "Valor bodega",  value: fmt(valoreTotale),       icon: "💰", color: "#276749", bg: "#f0fff4" },
          { label: "Movimientos hoy",    value: movimenti.filter(m => m.data?.slice(0,10) === new Date().toISOString().slice(0,10)).length, icon: "🔄", color: "#553c9a", bg: "#faf5ff" },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.color}22`, borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ fontSize: 18, marginBottom: 2 }}>{k.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 11, color: "#718096" }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Alert scorte */}
      {itemsInAlert.length > 0 && (
        <div style={{ background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 12, padding: "12px 16px" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#c53030", marginBottom: 8 }}>⚠️ Articoli sotto scorta minima</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {itemsInAlert.map(x => (
              <div key={x.id} style={{ padding: "5px 12px", background: "white", borderRadius: 99, fontSize: 12, fontWeight: 600, color: "#c53030", border: "1px solid #fed7d7" }}>
                {x.nome}: <strong>{x.giacenza}</strong>/{x.giacenzaMinima} {x.unita}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={() => setShowForm(true)} style={{ padding: "8px 16px", background: "#276749", color: "white", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
          + Nuovo articolo
        </button>
        <button onClick={() => setShowMovimenti(v => !v)}
          style={{ padding: "8px 14px", background: showMovimenti ? "#1a365d" : "#f0f4f8", color: showMovimenti ? "white" : "#4a5568", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
          🔄 Movimenti
        </button>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Buscar artículo..."
          style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 9, fontSize: 13, color: "#1a365d", minWidth: 180 }} />

        {/* Filtri categoria */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          <button onClick={() => setFilterCat(null)}
            style={{ padding: "5px 11px", borderRadius: 99, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, background: filterCat === null ? "#1a365d" : "#f0f4f8", color: filterCat === null ? "white" : "#718096" }}>
            Tutti
          </button>
          {allCats.filter(c => items.some(x => x.categoria === c)).map(c => (
            <button key={c} onClick={() => setFilterCat(c === filterCat ? null : c)}
              style={{ padding: "5px 11px", borderRadius: 99, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, background: filterCat === c ? "#2b6cb0" : "#f0f4f8", color: filterCat === c ? "white" : "#718096" }}>
              {c}
            </button>
          ))}
        </div>

        <button onClick={() => setFilterAlert(v => !v)}
          style={{ padding: "5px 11px", borderRadius: 99, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, background: filterAlert ? "#c53030" : "#f0f4f8", color: filterAlert ? "white" : "#718096", marginLeft: "auto" }}>
          ⚠️ Solo alert
        </button>
      </div>

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

      {/* Tabella articoli */}
      {loading
        ? <div style={{ textAlign: "center", padding: "50px 0", color: "#a0aec0" }}>Caricamento...</div>
        : filtered.length === 0
          ? <div style={{ textAlign: "center", padding: "50px 0", color: "#a0aec0", background: "white", borderRadius: 12 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📦</div>
              <div>{items.length === 0 ? "Bodega vacía. ¡Agrega el primer artículo!" : "Ningún artículo encontrado."}</div>
            </div>
          : <div style={{ background: "white", borderRadius: 12, overflow: "auto", boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 640 }}>
                <thead>
                  <tr style={{ background: "#1a365d", color: "white" }}>
                    {["Artículo", "Categoría", "Stock", "Stock mín.", "Precio/u", "Valor", "Proveedor", ""].map((h, i) => (
                      <th key={i} style={{ padding: "9px 10px", textAlign: "left", fontWeight: 600, fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, i) => {
                    const inAlert = item.giacenzaMinima > 0 && item.giacenza <= item.giacenzaMinima;
                    const valore  = item.giacenza * item.prezzo;
                    return (
                      <tr key={item.id} style={{ background: inAlert ? "#fff5f5" : i % 2 === 0 ? "#f7fafc" : "white" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#ebf8ff"}
                        onMouseLeave={e => e.currentTarget.style.background = inAlert ? "#fff5f5" : i % 2 === 0 ? "#f7fafc" : "white"}>
                        <td style={{ padding: "10px 10px" }}>
                          <div style={{ fontWeight: 700, color: "#1a365d", fontSize: 13 }}>{item.nome}</div>
                          {item.note && <div style={{ fontSize: 10, color: "#a0aec0", marginTop: 1 }}>{item.note}</div>}
                        </td>
                        <td style={{ padding: "10px 8px", color: "#718096", fontSize: 11 }}>{item.categoria}</td>
                        <td style={{ padding: "10px 8px" }}>
                          <span style={{ fontWeight: 800, fontSize: 14, color: inAlert ? "#c53030" : "#276749" }}>{item.giacenza}</span>
                          <span style={{ color: "#718096", fontSize: 11, marginLeft: 4 }}>{item.unita}</span>
                          {inAlert && <span style={{ marginLeft: 6, fontSize: 10, color: "#c53030", fontWeight: 700 }}>⚠️</span>}
                        </td>
                        <td style={{ padding: "10px 8px", color: "#718096", fontSize: 12 }}>{item.giacenzaMinima > 0 ? `${item.giacenzaMinima} ${item.unita}` : "—"}</td>
                        <td style={{ padding: "10px 8px", color: "#2b6cb0", fontWeight: 600 }}>{item.prezzo > 0 ? fmt(item.prezzo) : "—"}</td>
                        <td style={{ padding: "10px 8px", color: "#276749", fontWeight: 700 }}>{valore > 0 ? fmt(valore) : "—"}</td>
                        <td style={{ padding: "10px 8px", color: "#718096", fontSize: 11 }}>{item.fornitore || "—"}</td>
                        <td style={{ padding: "10px 8px" }}>
                          <div style={{ display: "flex", gap: 5 }}>
                            <button onClick={() => setMovItem(item)} title="Registrar movimiento"
                              style={{ padding: "5px 9px", background: "#ebf8ff", border: "1px solid #bee3f8", borderRadius: 7, cursor: "pointer", color: "#2b6cb0", fontSize: 12, fontWeight: 600 }}>
                              🔄
                            </button>
                            <button onClick={() => setEditItem(item)} title="Editar"
                              style={{ padding: "5px 9px", background: "#f7fafc", border: "1px solid #e2e8f0", borderRadius: 7, cursor: "pointer", color: "#4a5568", fontSize: 12 }}>
                              ✏️
                            </button>
                            <button onClick={() => onDeleteItem(item.id)} title="Eliminar"
                              style={{ padding: "5px 9px", background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 7, cursor: "pointer", color: "#c53030", fontSize: 12 }}>
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
      }
    </div>
  );
}
