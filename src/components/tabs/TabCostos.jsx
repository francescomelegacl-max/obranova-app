// ─── components/tabs/TabCostos.jsx ──────────────────────────────────────────
import { useState, useMemo } from "react";
import { fmt } from "../../utils/helpers";
import { useMercadoLibre } from "../../hooks/useMercadoLibre";

// ── Pannello ML inline ────────────────────────────────────────────────────────
function PanelML({ queryIniziale, workspaceId, lang, onApplica, onClose }) {
  const [query, setQuery] = useState(queryIniziale || "");
  const {
    risultati, caricando, errore, prezziSalvati,
    cerca, salvaPrezzo, loadPrezziSalvati, fmtP,
  } = useMercadoLibre({ lang, workspaceId });

  // Carica listino e pre-cerca al mount
  useState(() => {
    loadPrezziSalvati();
    if (queryIniziale?.trim()) cerca(queryIniziale);
  }, []);

  const prezzi  = risultati.map(r => r.precio).filter(Boolean).sort((a, b) => a - b);
  const mediana = prezzi.length ? prezzi[Math.floor(prezzi.length / 2)] : null;
  const moneda  = risultati[0]?.moneda || "CLP";

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 5000, display: "flex", alignItems: "flex-start", justifyContent: "flex-end", padding: 12 }}
    >
      <div style={{ background: "white", borderRadius: 16, width: "100%", maxWidth: 440, maxHeight: "92vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.35)", marginTop: 8, display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#ffe000,#ff6b00)", padding: "13px 16px", borderRadius: "16px 16px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 15, color: "#1a1a1a" }}>🛒 Cerca prezzo ML</div>
            <div style={{ fontSize: 10, color: "rgba(0,0,0,.5)", marginTop: 1 }}>MercadoLibre Chile — prezzi in tempo reale</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(0,0,0,.15)", border: "none", borderRadius: 8, cursor: "pointer", padding: "5px 11px", fontWeight: 800, fontSize: 14, color: "#1a1a1a" }}>✕</button>
        </div>

        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Campo ricerca */}
          <form onSubmit={e => { e.preventDefault(); cerca(query); }} style={{ display: "flex", gap: 7 }}>
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              placeholder="cemento, fierro, pintura..." autoFocus
              style={{ flex: 1, padding: "9px 12px", border: "2px solid #e2e8f0", borderRadius: 9, fontSize: 12, color: "#1a365d" }}
            />
            <button type="submit" disabled={caricando}
              style={{ padding: "9px 14px", background: "#ffe000", color: "#1a1a1a", border: "none", borderRadius: 9, cursor: caricando ? "not-allowed" : "pointer", fontWeight: 800, fontSize: 12 }}>
              {caricando ? "⏳" : "🔍"}
            </button>
          </form>

          {/* Stats + applica mediana */}
          {mediana && (
            <div style={{ background: "#f7fafc", borderRadius: 9, padding: "8px 12px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 10, color: "#718096", fontWeight: 700 }}>📊 {risultati.length} prodotti</span>
              {[["Min", prezzi[0]], ["Mediana", mediana], ["Max", prezzi[prezzi.length - 1]]].map(([lbl, val]) => (
                <div key={lbl} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#1a365d" }}>{fmtP(val, moneda)}</div>
                  <div style={{ fontSize: 9, color: "#a0aec0" }}>{lbl}</div>
                </div>
              ))}
              <button
                onClick={() => { onApplica(mediana); onClose(); }}
                style={{ marginLeft: "auto", padding: "5px 12px", background: "#2b6cb0", color: "white", border: "none", borderRadius: 7, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
                Usa mediana
              </button>
            </div>
          )}

          {/* Errore */}
          {errore && (
            <div style={{ background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 8, padding: "8px 12px", color: "#c53030", fontSize: 11 }}>⚠️ {errore}</div>
          )}

          {/* Skeleton */}
          {caricando && (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ height: 58, borderRadius: 9, background: "#f0f4f8", animation: "shimmer 1.4s infinite" }} />
              ))}
              <style>{`@keyframes shimmer{0%,100%{opacity:.7}50%{opacity:.3}}`}</style>
            </div>
          )}

          {/* Risultati */}
          {!caricando && risultati.map(item => {
            const giaSalvato = prezziSalvati.some(p => p.mlId === item.id);
            return (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 9, background: "#f7fafc", borderRadius: 9, padding: "7px 10px", border: "1px solid #e2e8f0" }}>
                <img
                  src={item.thumbnail?.replace("http://", "https://")} alt=""
                  style={{ width: 42, height: 42, objectFit: "contain", borderRadius: 6, background: "white", flexShrink: 0 }}
                  onError={e => { e.target.style.display = "none"; }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: "#2d3748", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.titulo}</div>
                  <div style={{ fontSize: 9, color: "#a0aec0" }}>{item.vendedor}{item.envioGratis ? " · 🚚 gratis" : ""}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontWeight: 900, fontSize: 14, color: "#1a365d" }}>{fmtP(item.precio, item.moneda)}</div>
                  <div style={{ display: "flex", gap: 4, marginTop: 3, justifyContent: "flex-end" }}>
                    <button
                      onClick={() => salvaPrezzo(item)}
                      title={giaSalvato ? "Già salvato" : "Salva nel listino"}
                      style={{ padding: "2px 7px", background: giaSalvato ? "#f0fff4" : "#ebf8ff", border: `1px solid ${giaSalvato ? "#9ae6b4" : "#bee3f8"}`, borderRadius: 5, cursor: "pointer", fontSize: 10 }}>
                      {giaSalvato ? "✅" : "💾"}
                    </button>
                    <a href={item.link} target="_blank" rel="noopener noreferrer"
                      style={{ padding: "2px 7px", background: "#fffbeb", border: "1px solid #fef08a", borderRadius: 5, fontSize: 10, textDecoration: "none" }}>
                      🔗
                    </a>
                    <button
                      onClick={() => { onApplica(item.precio); onClose(); }}
                      style={{ padding: "2px 9px", background: "#1a365d", color: "white", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 10, fontWeight: 700 }}>
                      ✚ Usa
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Listino salvato se nessun risultato */}
          {!caricando && risultati.length === 0 && prezziSalvati.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#718096", marginBottom: 6 }}>💾 Dal tuo listino salvato</div>
              {prezziSalvati.slice(0, 5).map(p => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: "#fffff0", borderRadius: 7, border: "1px solid #fef08a", gap: 8, marginBottom: 4 }}>
                  <div style={{ fontSize: 11, color: "#2d3748", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.titulo}</div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: "#276749", flexShrink: 0 }}>{fmtP(p.precio, p.moneda)}</div>
                  <button
                    onClick={() => { onApplica(p.precio); onClose(); }}
                    style={{ padding: "3px 9px", background: "#276749", color: "white", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                    Usa
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!caricando && risultati.length === 0 && prezziSalvati.length === 0 && (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#a0aec0" }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🛒</div>
              <div style={{ fontSize: 12 }}>Inserisci un materiale per vedere i prezzi</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── TabCostos ──────────────────────────────────────────────────────────────────
export default function TabCostos({ partidas, cats, addPartida, updP, delP, addFromListino, listino, t, workspaceId, lang }) {
  const [filterCat,  setFilterCat]  = useState(null);
  const [showExtras, setShowExtras] = useState(false);
  const [mlPanel,    setMlPanel]    = useState(null); // { partidaId, query } | null

  const cd = useMemo(() => partidas.reduce((s, p) => s + p.cant * p.pu, 0), [partidas]);

  const filtered = filterCat ? partidas.filter(p => p.cat === filterCat) : partidas;

  const headers = [
    t.categoria, t.descripcion, t.unidad, t.cantidad, t.pUnit, "", t.valorFinal, t.visible,
    ...(showExtras ? [t.proveedor, t.notaInterna] : []),
    "",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Pannello ML (si apre sopra tutto) */}
      {mlPanel && (
        <PanelML
          queryIniziale={mlPanel.query}
          workspaceId={workspaceId}
          lang={lang}
          onApplica={(precio) => updP(mlPanel.partidaId, "pu", precio)}
          onClose={() => setMlPanel(null)}
        />
      )}

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <button
          onClick={() => addPartida(filterCat || cats[0])}
          style={{ padding: "8px 14px", background: "#276749", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}
        >{t.agregar}</button>

        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          <button
            onClick={() => setFilterCat(null)}
            style={{ padding: "5px 12px", borderRadius: 99, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, background: filterCat === null ? "#1a365d" : "#f0f4f8", color: filterCat === null ? "white" : "#718096" }}
          >{t.filtroTodos}</button>
          {cats.map(c => (
            <button key={c} onClick={() => setFilterCat(c === filterCat ? null : c)}
              style={{ padding: "5px 12px", borderRadius: 99, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, background: filterCat === c ? "#2b6cb0" : "#f0f4f8", color: filterCat === c ? "white" : "#718096" }}
            >{c}</button>
          ))}
        </div>

        <button
          onClick={() => setShowExtras(v => !v)}
          style={{ marginLeft: "auto", padding: "5px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: showExtras ? "#2b6cb0" : "white", color: showExtras ? "white" : "#718096", cursor: "pointer", fontSize: 11, fontWeight: 600 }}
        >{showExtras ? "▲ Menos" : "▼ Más"}</button>
      </div>

      {/* Tabella */}
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
              <tr
                key={p.id}
                style={{ background: i % 2 === 0 ? "#f7fafc" : "white" }}
                onMouseEnter={e => e.currentTarget.style.background = "#ebf8ff"}
                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#f7fafc" : "white"}
              >
                {/* Categoria */}
                <td style={{ padding: "5px 6px" }}>
                  <select value={p.cat} onChange={e => updP(p.id, "cat", e.target.value)} aria-label={t.categoria}
                    style={{ padding: "4px 6px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 11, background: "white", color: "#1a365d", maxWidth: 120 }}>
                    {cats.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </td>

                {/* Descrizione */}
                <td style={{ padding: "5px 5px", minWidth: 140 }}>
                  <input value={p.nombre} onChange={e => updP(p.id, "nombre", e.target.value)} aria-label={t.descripcion}
                    style={{ width: "100%", padding: "5px 7px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, color: "#1a365d" }} />
                </td>

                {/* Unidad */}
                <td style={{ padding: "5px 4px" }}>
                  <select value={p.unidad} onChange={e => updP(p.id, "unidad", e.target.value)} aria-label={t.unidad}
                    style={{ padding: "4px 5px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 11, background: "white", color: "#1a365d" }}>
                    {["m²","m³","ml","gl","un","hr","kg","ton","lts","pza"].map(u => <option key={u}>{u}</option>)}
                  </select>
                </td>

                {/* Cantidad */}
                <td style={{ padding: "5px 3px" }}>
                  <input type="number" value={p.cant} onChange={e => updP(p.id, "cant", e.target.value)} min={0} aria-label={t.cantidad}
                    style={{ width: 65, padding: "5px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, textAlign: "right", color: "#1a365d" }} />
                </td>

                {/* Precio unitario */}
                <td style={{ padding: "5px 3px" }}>
                  <input type="number" value={p.pu} onChange={e => updP(p.id, "pu", e.target.value)} min={0} aria-label={t.pUnit}
                    style={{ width: 85, padding: "5px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, textAlign: "right", color: "#1a365d" }} />
                </td>

                {/* 🛒 Bottone ML — NOVITÀ */}
                <td style={{ padding: "5px 3px" }}>
                  <button
                    onClick={() => setMlPanel({ partidaId: p.id, query: p.nombre || "" })}
                    title="Cerca prezzo su MercadoLibre"
                    style={{ padding: "4px 7px", background: "#fffbeb", border: "1px solid #fef08a", borderRadius: 6, cursor: "pointer", fontSize: 13, lineHeight: 1 }}>
                    🛒
                  </button>
                </td>

                {/* Valor final */}
                <td style={{ padding: "5px 7px", fontWeight: 700, color: "#1a365d", textAlign: "right", whiteSpace: "nowrap" }}>
                  {fmt(p.cant * p.pu)}
                </td>

                {/* Visibilità */}
                <td style={{ padding: "5px 4px", textAlign: "center" }}>
                  <button onClick={() => updP(p.id, "visible", !p.visible)} aria-label={p.visible ? "Ocultar al cliente" : "Mostrar al cliente"}
                    style={{ background: p.visible ? "#f0fff4" : "#f7fafc", border: `1px solid ${p.visible ? "#68d391" : "#e2e8f0"}`, borderRadius: 6, cursor: "pointer", padding: "3px 7px", fontSize: 12 }}>
                    {p.visible ? "👁️" : "🙈"}
                  </button>
                </td>

                {/* Extras */}
                {showExtras && <>
                  <td style={{ padding: "5px 3px" }}>
                    <input value={p.proveedor || ""} onChange={e => updP(p.id, "proveedor", e.target.value)} placeholder={t.proveedor} aria-label={t.proveedor}
                      style={{ width: 90, padding: "4px 6px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 11, color: "#1a365d" }} />
                  </td>
                  <td style={{ padding: "5px 3px" }}>
                    <input value={p.nota || ""} onChange={e => updP(p.id, "nota", e.target.value)} placeholder={t.notaInterna} aria-label={t.notaInterna}
                      style={{ width: 100, padding: "4px 6px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 11, color: "#1a365d" }} />
                  </td>
                </>}

                {/* Elimina */}
                <td style={{ padding: "5px 3px" }}>
                  <button onClick={() => delP(p.id)} aria-label="Eliminar partida"
                    style={{ background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 6, cursor: "pointer", color: "#c53030", padding: "3px 7px", fontSize: 11 }}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: "#1a365d", color: "white" }}>
              <td colSpan={6} style={{ padding: "9px 10px", fontWeight: 700, fontSize: 12 }}>TOTAL {t.costosDirectos}</td>
              <td style={{ padding: "9px 7px", fontWeight: 800, fontSize: 13, textAlign: "right" }}>{fmt(cd)}</td>
              <td colSpan={showExtras ? 4 : 2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
