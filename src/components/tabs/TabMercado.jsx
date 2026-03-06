// ─── components/tabs/TabMercado.jsx ───────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { useMercadoLibre, ML_CATS } from "../../hooks/useMercadoLibre";

// ── Utilità ────────────────────────────────────────────────────────────────────
const SIM = { CLP: "$", USD: "US$", ARS: "AR$", BRL: "R$" };
function fmt(n, m = "CLP") {
  if (n == null) return "—";
  return `${SIM[m] || "$"} ${Number(n).toLocaleString("es-CL", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ── Skeleton loader ────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ height: 240, borderRadius: 12, background: "#f0f4f8", animation: "shimmer 1.4s infinite" }} />
      ))}
      <style>{`@keyframes shimmer{0%,100%{opacity:.7}50%{opacity:.3}}`}</style>
    </div>
  );
}

// ── Banner statistiche ─────────────────────────────────────────────────────────
function StatsBar({ stats }) {
  if (!stats) return null;
  const items = [
    { label: "Min",     value: fmt(stats.min,     stats.moneda), color: "#68d391" },
    { label: "Mediana", value: fmt(stats.mediana, stats.moneda), color: "#90cdf4" },
    { label: "Media",   value: fmt(stats.media,   stats.moneda), color: "#fef08a" },
    { label: "Max",     value: fmt(stats.max,     stats.moneda), color: "#fc8181" },
  ];
  return (
    <div style={{ background: "linear-gradient(135deg,#1a365d,#2d3748)", borderRadius: 12, padding: "12px 16px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
      <div style={{ fontSize: 11, color: "#a0aec0", fontWeight: 700, marginRight: 4 }}>📊 Analisi prezzi</div>
      {items.map(({ label, value, color }) => (
        <div key={label} style={{ background: "rgba(255,255,255,.08)", borderRadius: 8, padding: "6px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 900, color }}>{value}</div>
          <div style={{ fontSize: 9, color: "#a0aec0" }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Card prodotto ──────────────────────────────────────────────────────────────
function CardProdotto({ item, giaSalvato, onSalva }) {
  return (
    <div style={{
      background: "white", borderRadius: 12, overflow: "hidden",
      border: "1px solid #e2e8f0", display: "flex", flexDirection: "column",
      transition: "box-shadow .18s, transform .18s", cursor: "default",
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,.12)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}
    >
      {/* Immagine */}
      <div style={{ background: "#f7fafc", height: 130, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
        <img
          src={item.thumbnail?.replace("http://", "https://")}
          alt={item.titulo}
          style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
          onError={e => { e.target.style.display = "none"; }}
        />
        {item.envioGratis && (
          <span style={{ position: "absolute", top: 6, left: 6, background: "#276749", color: "white", fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 99 }}>
            🚚 Envío gratis
          </span>
        )}
      </div>

      {/* Dettagli */}
      <div style={{ padding: "10px 12px", flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ fontSize: 11, color: "#2d3748", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {item.titulo}
        </div>
        <div style={{ fontSize: 10, color: "#a0aec0" }}>
          {item.vendedor}{item.disponibili > 0 ? ` · ${item.disponibili} disp.` : ""}
        </div>
        <div style={{ fontSize: 19, fontWeight: 900, color: "#1a365d", marginTop: "auto" }}>
          {fmt(item.precio, item.moneda)}
        </div>

        {/* Azioni */}
        <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
          <button
            onClick={() => onSalva(item)}
            title={giaSalvato ? "Già nel listino" : "Salva nel listino"}
            style={{ flex: 1, padding: "6px 0", background: giaSalvato ? "#f0fff4" : "#1a365d", color: giaSalvato ? "#276749" : "white", border: giaSalvato ? "1px solid #9ae6b4" : "none", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
            {giaSalvato ? "✅ Salvato" : "💾 Salva"}
          </button>
          <a
            href={item.link} target="_blank" rel="noopener noreferrer"
            title="Apri su MercadoLibre"
            style={{ padding: "6px 11px", background: "#fffbeb", border: "1px solid #fef08a", borderRadius: 8, fontSize: 13, textDecoration: "none", display: "flex", alignItems: "center" }}>
            🔗
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Vista listino salvato ──────────────────────────────────────────────────────
function ListinoSalvato({ prezziSalvati, onElimina, fmtP }) {
  if (!prezziSalvati.length) return (
    <div style={{ textAlign: "center", padding: "50px 0", color: "#a0aec0", background: "white", borderRadius: 12 }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
      <div style={{ fontWeight: 600 }}>Listino ML vuoto</div>
      <div style={{ fontSize: 11, marginTop: 4 }}>Cerca un prodotto e clicca 💾 per salvarlo qui</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {prezziSalvati.map(p => (
        <div key={p.id} style={{ background: "white", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12, border: "1px solid #e2e8f0", flexWrap: "wrap" }}>
          {p.thumbnail && (
            <img src={p.thumbnail.replace("http://", "https://")} alt="" style={{ width: 44, height: 44, objectFit: "contain", borderRadius: 6, background: "#f7fafc", flexShrink: 0 }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#2d3748", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.titulo}</div>
            <div style={{ fontSize: 10, color: "#a0aec0" }}>Salvato: {p.aggiornatoAt ? new Date(p.aggiornatoAt).toLocaleDateString("es-CL") : "—"}</div>
          </div>
          <div style={{ fontWeight: 900, fontSize: 16, color: "#276749", flexShrink: 0 }}>{fmtP(p.precio, p.moneda)}</div>
          <a href={p.link} target="_blank" rel="noopener noreferrer"
            style={{ padding: "5px 9px", background: "#fffbeb", border: "1px solid #fef08a", borderRadius: 7, fontSize: 13, textDecoration: "none", flexShrink: 0 }}>
            🔗
          </a>
          <button onClick={() => onElimina(p.id)}
            style={{ padding: "5px 8px", background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 7, cursor: "pointer", fontSize: 12, color: "#c53030", flexShrink: 0 }}>
            🗑️
          </button>
        </div>
      ))}
    </div>
  );
}

// ── TabMercado principale ──────────────────────────────────────────────────────
export default function TabMercado({ workspaceId, lang = "es", onToast }) {
  const [query,   setQuery]   = useState("");
  const [cat,     setCat]     = useState("");
  const [vista,   setVista]   = useState("cerca"); // "cerca" | "listino"

  const { risultati, caricando, errore, prezziSalvati, cerca, getStats, salvaPrezzo, loadPrezziSalvati, eliminaPrezzo, fmtP } = useMercadoLibre({ lang, workspaceId, onToast });

  useEffect(() => { loadPrezziSalvati(); }, []); // eslint-disable-line

  const handleCerca = useCallback((e) => {
    e?.preventDefault();
    if (query.trim()) { cerca(query, cat); setVista("cerca"); }
  }, [query, cat, cerca]);

  const stats = getStats(risultati);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Header ML */}
      <div style={{ background: "linear-gradient(135deg,#ffe000,#ff6b00)", borderRadius: 14, padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 24 }}>🛒</span>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#1a1a1a", letterSpacing: -.3 }}>MercadoLibre</div>
          <span style={{ background: "rgba(0,0,0,.12)", padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700, color: "#1a1a1a" }}>
            Prezzi in tempo reale
          </span>
        </div>
        <div style={{ fontSize: 12, color: "rgba(0,0,0,.6)" }}>
          Cerca materiali e confronta i prezzi di mercato — aggiornati in tempo reale
        </div>
      </div>

      {/* Barra ricerca */}
      <div style={{ background: "white", borderRadius: 12, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
        <form onSubmit={handleCerca} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Es: cemento portland, fierro corrugado 10mm, pintura látex..."
            style={{ flex: 1, padding: "10px 14px", border: "2px solid #e2e8f0", borderRadius: 10, fontSize: 13, color: "#1a365d", outline: "none", transition: "border-color .18s" }}
            onFocus={e => { e.target.style.borderColor = "#ffe000"; }}
            onBlur={e  => { e.target.style.borderColor = "#e2e8f0"; }}
          />
          <button type="submit" disabled={caricando}
            style={{ padding: "10px 20px", background: caricando ? "#e2e8f0" : "#ffe000", color: "#1a1a1a", border: "none", borderRadius: 10, cursor: caricando ? "not-allowed" : "pointer", fontWeight: 800, fontSize: 13, whiteSpace: "nowrap" }}>
            {caricando ? "⏳ Cercando..." : "🔍 Cerca"}
          </button>
        </form>

        {/* Filtri categoria */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {ML_CATS.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)}
              style={{ padding: "4px 12px", borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `1.5px solid ${cat === c.id ? "#ff6b00" : "#e2e8f0"}`, background: cat === c.id ? "#fff3e0" : "white", color: cat === c.id ? "#c05621" : "#718096" }}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toggle Ricerca / Listino */}
      <div style={{ display: "flex", background: "white", borderRadius: 10, padding: 4, gap: 4, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
        {[["cerca", "🔍 Risultati", risultati.length], ["listino", "💾 Listino salvato", prezziSalvati.length]].map(([v, lbl, cnt]) => (
          <button key={v} onClick={() => setVista(v)}
            style={{ flex: 1, padding: "8px 0", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, background: vista === v ? "#1a365d" : "transparent", color: vista === v ? "white" : "#718096" }}>
            {lbl}
            {cnt > 0 && <span style={{ marginLeft: 6, background: vista === v ? "rgba(255,255,255,.25)" : "#e2e8f0", color: vista === v ? "white" : "#718096", borderRadius: 99, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>{cnt}</span>}
          </button>
        ))}
      </div>

      {/* Errore */}
      {errore && (
        <div style={{ background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 10, padding: "12px 16px", color: "#c53030", fontSize: 12 }}>
          ⚠️ {errore} — Verifica la connessione e riprova.
        </div>
      )}

      {/* Contenuto */}
      {vista === "cerca" ? (
        <>
          {risultati.length > 0 && <StatsBar stats={stats} />}

          {caricando && <Skeleton />}

          {!caricando && risultati.length === 0 && !errore && (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#a0aec0", background: "white", borderRadius: 12 }}>
              <div style={{ fontSize: 44, marginBottom: 10 }}>🛒</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Cerca un materiale</div>
              <div style={{ fontSize: 12 }}>Esempi: "cemento portland 25kg" · "fierro 10mm" · "tubo PVC 4 pulgadas"</div>
            </div>
          )}

          {!caricando && risultati.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
              {risultati.map(item => (
                <CardProdotto
                  key={item.id}
                  item={item}
                  giaSalvato={prezziSalvati.some(p => p.mlId === item.id)}
                  onSalva={salvaPrezzo}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <ListinoSalvato prezziSalvati={prezziSalvati} onElimina={eliminaPrezzo} fmtP={fmtP} />
      )}
    </div>
  );
}
