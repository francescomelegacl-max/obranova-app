// ─── components/UI.jsx ──────────────────────────────────────────────────────
// Componenti UI riutilizzabili estratti dall'App monolite.
// Ogni componente è piccolo, testabile e senza side-effects.

import { useState } from "react";
// NOTA: auth e signInWithEmailAndPassword NON sono importati qui — passati come prop
// per evitare TDZ/circular dep nel bundle statico (Vite 5 + esbuild).
import { LOGO_URL } from "../utils/logo";
import { fmtPct, fmt } from "../utils/helpers";

// ─── Tooltip ─────────────────────────────────────────────────────────────────
export const Tip = ({ text }) => {
  const [v, setV] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center", marginLeft: 4 }}>
      <span
        role="button"
        aria-label="Más información"
        tabIndex={0}
        onMouseEnter={() => setV(true)}
        onMouseLeave={() => setV(false)}
        onClick={() => setV(x => !x)}
        onKeyDown={e => e.key === "Enter" && setV(x => !x)}
        style={{
          cursor: "pointer", background: "#bee3f8", color: "#2b6cb0",
          borderRadius: "50%", width: 15, height: 15,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, fontWeight: 700, userSelect: "none", flexShrink: 0,
        }}
      >?</span>
      {v && (
        <span style={{
          position: "absolute", left: 20, top: -4,
          background: "#1a365d", color: "white", padding: "6px 10px",
          borderRadius: 8, fontSize: 11, zIndex: 9999,
          boxShadow: "0 4px 12px rgba(0,0,0,.3)",
          maxWidth: 200, lineHeight: 1.4, whiteSpace: "normal", minWidth: 140,
        }}>{text}</span>
      )}
    </span>
  );
};

// ─── BarChart ─────────────────────────────────────────────────────────────────
export const BarChart = ({ data, height = 110 }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height, padding: "0 2px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div style={{ fontSize: 9, color: "#4a5568", fontWeight: 700 }}>{d.value}</div>
          <div style={{
            width: "100%", background: d.color || "#2b6cb0",
            borderRadius: "3px 3px 0 0",
            height: Math.max((d.value / max) * (height - 28), 2),
            transition: "height .4s",
          }} />
          <div style={{ fontSize: 8, color: "#718096", textAlign: "center", lineHeight: 1.2 }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
};

// ─── PieChart ─────────────────────────────────────────────────────────────────
export const PieChart = ({ data, size = 110 }) => {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let ang = -Math.PI / 2;
  const cx = size / 2, cy = size / 2, r = size / 2 - 6;
  const slices = data.map(d => {
    const a = (d.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(ang), y1 = cy + r * Math.sin(ang);
    ang += a;
    const x2 = cx + r * Math.cos(ang), y2 = cy + r * Math.sin(ang);
    return {
      path: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${a > Math.PI ? 1 : 0},1 ${x2},${y2} Z`,
      color: d.color, label: d.label, pct: Math.round(d.value / total * 100),
    };
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <svg width={size} height={size} style={{ flexShrink: 0 }} aria-hidden="true">
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth={1.5} />)}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10 }}>
            <div style={{ width: 9, height: 9, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ color: "#4a5568" }}>{s.label}</span>
            <span style={{ color: "#2d3748", fontWeight: 700 }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Toast ────────────────────────────────────────────────────────────────────
export const Toast = ({ msg }) => {
  if (!msg) return null;
  return (
    <div role="status" aria-live="polite" style={{
      position: "fixed", top: 16, right: 16,
      background: "#1a365d", color: "white",
      padding: "10px 18px", borderRadius: 12,
      zIndex: 9999, fontWeight: 600,
      boxShadow: "0 8px 24px rgba(0,0,0,.3)", fontSize: 14,
    }}>{msg}</div>
  );
};

// ─── LoginScreen ──────────────────────────────────────────────────────────────
export const LoginScreen = ({ onLogin, auth, signIn }) => {
  const [email,   setEmail]   = useState("");
  const [pwd,     setPwd]     = useState("");
  const [err,     setErr]     = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true); setErr("");
    try {
      const uc = await signIn(auth, email, pwd);
      onLogin(uc.user);
    } catch {
      setErr("Credenciales inválidas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg,#1a365d,#2d3748)", padding: 16,
    }}>
      <div style={{
        background: "white", borderRadius: 20, padding: "36px 32px",
        width: "100%", maxWidth: 380, boxShadow: "0 25px 60px rgba(0,0,0,.4)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img src={LOGO_URL} alt="Obra Nova" style={{ height: 56, marginBottom: 10 }}
            onError={e => { e.target.style.display = "none"; }} />
          <div style={{ fontSize: 22, fontWeight: 800, color: "#1a365d" }}>Obra Nova SPA</div>
          <div style={{ fontSize: 13, color: "#718096", marginTop: 3 }}>Sistema de Presupuestos</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            value={email} onChange={e => setEmail(e.target.value)}
            type="email" placeholder="Email"
            aria-label="Email"
            style={{ padding: "11px 14px", border: "2px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none" }}
          />
          <input
            value={pwd} onChange={e => setPwd(e.target.value)}
            type="password" placeholder="Contraseña"
            aria-label="Contraseña"
            onKeyDown={e => e.key === "Enter" && handle()}
            style={{ padding: "11px 14px", border: "2px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none" }}
          />
          {err && (
            <div role="alert" style={{
              background: "#fff5f5", border: "1px solid #fed7d7",
              color: "#c53030", borderRadius: 8, padding: "8px 12px", fontSize: 13,
            }}>{err}</div>
          )}
          <button
            onClick={handle}
            disabled={loading}
            style={{
              padding: 12, background: "#1a365d", color: "white",
              border: "none", borderRadius: 10, cursor: "pointer",
              fontWeight: 700, fontSize: 15, marginTop: 4,
            }}
          >{loading ? "Entrando..." : "Entrar"}</button>
        </div>
      </div>
    </div>
  );
};

// ─── ModalListino ─────────────────────────────────────────────────────────────
export const ModalListino = ({ onSave, onClose, t, cats }) => {
  const [f, setF] = useState({
    nombre: "", cat: cats[0] || "", unidad: "m²",
    precioCompra: 0, precioCliente: 0, proveedor: "",
  });
  const [showML, setShowML] = useState(false);
  const u = (k, v) => setF(x => ({ ...x, [k]: v }));
  const ok = () => {
    if (!f.nombre.trim()) { alert("Ingresa un nombre"); return; }
    onSave({ ...f });
  };
  const handleImportML = ({ price, title }) => {
    u("precioCompra", price);
    if (!f.nombre.trim()) u("nombre", title.slice(0, 60));
    setShowML(false);
  };
  const mg = f.precioCliente > 0 && f.precioCompra > 0
    ? ((f.precioCliente - f.precioCompra) / f.precioCliente * 100)
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.listinoAgregar}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.65)",
        zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "white", borderRadius: 16, padding: 28,
        width: "100%", maxWidth: 480,
        boxShadow: "0 20px 60px rgba(0,0,0,.35)",
        maxHeight: "90vh", overflow: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#1a365d" }}>📦 {t.listinoAgregar}</div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{ background: "#2d3748", border: "none", borderRadius: 8, cursor: "pointer", padding: "5px 12px", color: "white", fontWeight: 700, fontSize: 13 }}
          >✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "#4a5568", fontWeight: 600, display: "block", marginBottom: 3 }}>
              {t.listinoNombre} *
            </label>
            <input value={f.nombre} onChange={e => u("nombre", e.target.value)} autoFocus
              style={{ width: "100%", padding: "9px 12px", border: "2px solid #e2e8f0", borderRadius: 8, fontSize: 14, boxSizing: "border-box", color: "#1a365d" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, color: "#4a5568", fontWeight: 600, display: "block", marginBottom: 3 }}>{t.categoria}</label>
              <select value={f.cat} onChange={e => u("cat", e.target.value)}
                style={{ width: "100%", padding: "9px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#1a365d", background: "white" }}>
                {cats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#4a5568", fontWeight: 600, display: "block", marginBottom: 3 }}>{t.unidad}</label>
              <select value={f.unidad} onChange={e => u("unidad", e.target.value)}
                style={{ width: "100%", padding: "9px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#1a365d", background: "white" }}>
                {["m²","m³","ml","gl","un","hr","kg","ton","lts","pza"].map(x => <option key={x}>{x}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, color: "#c05621", fontWeight: 600, display: "block", marginBottom: 3 }}>💸 {t.precioCompra}</label>
              <input type="number" value={f.precioCompra} onChange={e => u("precioCompra", parseFloat(e.target.value) || 0)} min={0}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: "#1a365d", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#276749", fontWeight: 600, display: "block", marginBottom: 3 }}>💰 {t.precioCliente}</label>
              <input type="number" value={f.precioCliente} onChange={e => u("precioCliente", parseFloat(e.target.value) || 0)} min={0}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: "#1a365d", boxSizing: "border-box" }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#4a5568", fontWeight: 600, display: "block", marginBottom: 3 }}>🏭 {t.proveedor}</label>
            <input value={f.proveedor} onChange={e => u("proveedor", e.target.value)}
              style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: "#1a365d", boxSizing: "border-box" }} />
          </div>
          <button onClick={() => setShowML(true)}
            style={{ padding: "9px 12px", background: "#f0f4f8", border: "1px solid #e2e8f0", borderRadius: 9, cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#2b6cb0", textAlign: "left" }}>
            🛒 Cerca prezzo su MercadoLibre
          </button>
          {showML && (
            <ModalMercadoLibre
              query={f.nombre}
              onImportPrice={handleImportML}
              onClose={() => setShowML(false)}
            />
          )}
          {mg !== null && (
            <div style={{
              padding: "10px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600,
              background: mg > 0 ? "#f0fff4" : "#fff5f5",
              color: mg > 0 ? "#276749" : "#c53030",
            }}>
              Margen: {fmtPct(mg)} — Compra: {fmt(f.precioCompra)} → Cliente: {fmt(f.precioCliente)}
            </div>
          )}
          <button onClick={ok} style={{
            padding: 11, background: "#1a365d", color: "white",
            border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 14, marginTop: 4,
          }}>
            💾 {t.listinoAgregar}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── ModalMercadoLibre ────────────────────────────────────────────────────────
// Cerca prodotti su MercadoLibre e permette di importare il prezzo nel listino.
// siteId: MLA=Argentina, MLC=Cile, MLM=Messico, MLB=Brasile, MLI=Italia
const ML_SITES = [
  { id: "MLC", label: "🇨🇱 Chile" },
  { id: "MLA", label: "🇦🇷 Argentina" },
  { id: "MLM", label: "🇲🇽 México" },
  { id: "MLB", label: "🇧🇷 Brasil" },
  { id: "MLI", label: "🇮🇹 Italia" },
  { id: "MCO", label: "🇨🇴 Colombia" },
];

export const ModalMercadoLibre = ({ query: initialQuery = "", onImportPrice, onClose }) => {
  const [site,    setSite]    = useState("MLC");
  const [query,   setQuery]   = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [imported, setImported] = useState(null);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(""); setResults([]);
    try {
      const url = `https://api.mercadolibre.com/sites/${site}/search?q=${encodeURIComponent(query)}&limit=8`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Errore API MercadoLibre");
      const data = await res.json();
      setResults(data.results || []);
      if ((data.results || []).length === 0) setError("Nessun risultato trovato.");
    } catch (e) {
      setError("Errore di connessione. Controlla la rete.");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = (item) => {
    onImportPrice({ price: item.price, currency: item.currency_id, title: item.title, url: item.permalink, site });
    setImported(item.id);
  };

  const currencySymbol = (cur) => ({ ARS: "$", CLP: "$", MXN: "$", BRL: "R$", EUR: "€", COP: "$" }[cur] || "$");

  return (
    <div role="dialog" aria-modal="true"
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
      <div style={{ background: "white", borderRadius: 16, padding: 24, width: "100%", maxWidth: 600, maxHeight: "90vh", overflow: "auto", boxShadow: "0 24px 64px rgba(0,0,0,.4)" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1a365d" }}>🛒 Confronta prezzi — MercadoLibre</div>
            <div style={{ fontSize: 11, color: "#718096", marginTop: 2 }}>Cerca il materiale e importa il prezzo di riferimento</div>
          </div>
          <button onClick={onClose} style={{ background: "#2d3748", border: "none", borderRadius: 8, cursor: "pointer", padding: "5px 12px", color: "white", fontWeight: 700 }}>✕</button>
        </div>

        {/* Selettore paese */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
          {ML_SITES.map(s => (
            <button key={s.id} onClick={() => setSite(s.id)}
              style={{ padding: "5px 10px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600,
                background: site === s.id ? "#2b6cb0" : "#f0f4f8",
                color:      site === s.id ? "white"   : "#718096" }}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Ricerca */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search()}
            placeholder="Es: cemento portland 25kg, cerámico 60x60..."
            autoFocus
            style={{ flex: 1, padding: "9px 12px", border: "2px solid #e2e8f0", borderRadius: 9, fontSize: 13, color: "#1a365d" }}
          />
          <button onClick={search} disabled={loading}
            style={{ padding: "9px 18px", background: "#2b6cb0", color: "white", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}>
            {loading ? "..." : "🔍 Cerca"}
          </button>
        </div>

        {/* Errore */}
        {error && <div style={{ background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 8, padding: "9px 12px", color: "#c53030", fontSize: 12, marginBottom: 12 }}>{error}</div>}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "30px 0", color: "#718096" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
            <div style={{ fontSize: 12 }}>Ricerca in corso...</div>
          </div>
        )}

        {/* Risultati */}
        {!loading && results.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 11, color: "#718096", marginBottom: 4 }}>{results.length} risultati trovati</div>
            {results.map(item => {
              const isImported = imported === item.id;
              return (
                <div key={item.id} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                  background: isImported ? "#f0fff4" : "#f7fafc",
                  border: `1px solid ${isImported ? "#9ae6b4" : "#e2e8f0"}`,
                  borderRadius: 10, transition: "all .2s",
                }}>
                  {item.thumbnail && (
                    <img src={item.thumbnail} alt="" style={{ width: 48, height: 48, objectFit: "contain", borderRadius: 6, background: "white", border: "1px solid #e2e8f0", flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#2d3748", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 3, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#276749" }}>
                        {currencySymbol(item.currency_id)} {item.price?.toLocaleString()}
                      </span>
                      {item.condition && (
                        <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 99, background: item.condition === "new" ? "#ebf8ff" : "#fffff0", color: item.condition === "new" ? "#2b6cb0" : "#b7791f", fontWeight: 600 }}>
                          {item.condition === "new" ? "Nuevo" : "Usado"}
                        </span>
                      )}
                      {item.seller?.nickname && (
                        <span style={{ fontSize: 10, color: "#a0aec0" }}>🏪 {item.seller.nickname}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                    <button onClick={() => handleImport(item)}
                      disabled={isImported}
                      style={{ padding: "6px 12px", background: isImported ? "#276749" : "#1a365d", color: "white", border: "none", borderRadius: 8, cursor: isImported ? "default" : "pointer", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                      {isImported ? "✓ Importato" : "⬇ Usa prezzo"}
                    </button>
                    <a href={item.permalink} target="_blank" rel="noreferrer"
                      style={{ textAlign: "center", fontSize: 10, color: "#2b6cb0", textDecoration: "none" }}>
                      🔗 Vedi annuncio
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && results.length === 0 && !error && (
          <div style={{ textAlign: "center", padding: "30px 0", color: "#a0aec0" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🛒</div>
            <div style={{ fontSize: 12 }}>Cerca un materiale per vedere i prezzi di mercato</div>
          </div>
        )}
      </div>
    </div>
  );
};
