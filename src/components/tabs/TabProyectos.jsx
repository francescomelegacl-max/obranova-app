// ─── components/tabs/TabProyectos.jsx ────────────────────────────────────────
import { useState, useEffect, useMemo, useRef } from "react";
import { fmt, calcProjectTotal } from "../../utils/helpers";
import { ESTADO_COLORS, ESTADO_BG } from "../../utils/constants";

// ─── ProyectoCard (helper privato) ───────────────────────────────────────────
function ProyectoCard({ p, isActive, onLoad, onDelete, onPDF, t }) {
  const ptot = calcProjectTotal(p);
  const [swipeX,    setSwipeX]    = useState(0);
  const [swiping,   setSwiping]   = useState(false);
  const [revealed,  setRevealed]  = useState(false);
  const startX = useRef(null);

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    setSwiping(true);
  };
  const handleTouchMove = (e) => {
    if (startX.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    if (dx < 0) setSwipeX(Math.max(dx, -90));
  };
  const handleTouchEnd = () => {
    setSwiping(false);
    startX.current = null;
    if (swipeX < -45) { setRevealed(true); setSwipeX(-90); }
    else              { setRevealed(false); setSwipeX(0); }
  };
  const closeSwipe = () => { setRevealed(false); setSwipeX(0); };

  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 14, marginBottom: 10 }}>

      {/* Azioni rivelate dallo swipe */}
      <div style={{
        position: "absolute", right: 0, top: 0, bottom: 0, width: 90,
        display: "flex", alignItems: "stretch",
      }}>
        <button
          onClick={e => { e.stopPropagation(); onPDF(p); closeSwipe(); }}
          style={{ flex: 1, background: "#2b6cb0", border: "none", cursor: "pointer", color: "white", fontSize: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
          <span>🖨️</span><span style={{ fontSize: 9, fontWeight: 700 }}>PDF</span>
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDelete(p.id); closeSwipe(); }}
          style={{ flex: 1, background: "#c53030", border: "none", cursor: "pointer", color: "white", fontSize: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
          <span>🗑️</span><span style={{ fontSize: 9, fontWeight: 700 }}>Borrar</span>
        </button>
      </div>

      {/* Card principale */}
      <div
        onClick={() => { if (revealed) { closeSwipe(); return; } onLoad(p); }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          background: "white", borderRadius: 14, padding: "14px 16px", cursor: "pointer",
          border: `2px solid ${isActive ? "#2b6cb0" : "transparent"}`,
          boxShadow: `0 2px 8px rgba(0,0,0,${isActive ? .1 : .05})`,
          transform: `translateX(${swipeX}px)`,
          transition: swiping ? "none" : "transform .25s ease",
          position: "relative", zIndex: 1,
          userSelect: "none", WebkitUserSelect: "none",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1a365d", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {p.info?.cliente || t.sinNombre}
            </div>
            <div style={{ fontSize: 12, color: "#718096", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {p.info?.descripcion?.slice(0, 45) || "—"}
            </div>
          </div>
          <span style={{
            padding: "3px 10px", borderRadius: 99, fontSize: 10, fontWeight: 700, flexShrink: 0, marginLeft: 8,
            background: ESTADO_BG[p.estado] || "#f7fafc",
            color: ESTADO_COLORS[p.estado] || "#718096",
          }}>{t[p.estado?.toLowerCase()] || p.estado}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#276749" }}>{fmt(ptot)}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 10, color: "#a0aec0" }}>{(p.updatedAt || "").slice(0, 10)}</div>
            <span style={{ fontSize: 11, color: "#a0aec0" }}>← desliza</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TabProyectos({ proyectos, currentId, onLoad, onDelete, onPDF, t, canPlan, onPaywall }) {
  const [isMobile,     setIsMobile]     = useState(() => window.innerWidth < 768);
  const [search,       setSearch]       = useState("");
  const [filterEstado, setFilterEstado] = useState("Todos");
  const [sortBy,       setSortBy]       = useState("reciente");

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const ESTADOS_FILTRO = ["Todos","Borrador","Enviado","Aceptado","Rechazado","En obra","Finalizado"];

  const filtered = useMemo(() => {
    let list = [...proyectos];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        (p.info?.cliente || "").toLowerCase().includes(q) ||
        (p.info?.descripcion || "").toLowerCase().includes(q) ||
        (p.info?.ciudad || "").toLowerCase().includes(q)
      );
    }
    if (filterEstado !== "Todos") list = list.filter(p => p.estado === filterEstado);
    if (sortBy === "reciente") list.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
    if (sortBy === "monto")    list.sort((a, b) => calcProjectTotal(b) - calcProjectTotal(a));
    if (sortBy === "cliente")  list.sort((a, b) => (a.info?.cliente || "").localeCompare(b.info?.cliente || ""));
    return list;
  }, [proyectos, search, filterEstado, sortBy]);

  const totalMonto = useMemo(() => filtered.reduce((s, p) => s + calcProjectTotal(p), 0), [filtered]);

  // ── Barra ricerca + filtri ──────────────────────────────────────────────────
  const SearchBar = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, background: "white",
      borderRadius: 12, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,.07)", marginBottom: 12 }}>
      {/* Riga 1: ricerca testo + sort */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#a0aec0" }}>🔍</span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por cliente, descripción, ciudad..."
            style={{ width: "100%", padding: "8px 12px 8px 32px", border: "1.5px solid #e2e8f0",
              borderRadius: 8, fontSize: 12, color: "#1a365d", boxSizing: "border-box",
              outline: "none", transition: "border-color .18s" }}
            onFocus={e => e.target.style.borderColor = "#2b6cb0"}
            onBlur={e  => e.target.style.borderColor = "#e2e8f0"}
          />
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ padding: "8px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8,
            fontSize: 12, color: "#4a5568", background: "white", cursor: "pointer" }}>
          <option value="reciente">⏱ Más reciente</option>
          <option value="monto">💰 Mayor monto</option>
          <option value="cliente">🔤 Cliente A→Z</option>
        </select>
      </div>
      {/* Riga 2: filtri estado */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        {ESTADOS_FILTRO.map(e => (
          <button key={e} onClick={() => setFilterEstado(e)}
            style={{ padding: "4px 11px", borderRadius: 99, fontSize: 11, fontWeight: 600,
              cursor: "pointer", border: "none",
              background: filterEstado === e ? (ESTADO_BG[e] || "#1a365d") : "#f0f4f8",
              color: filterEstado === e ? (ESTADO_COLORS[e] || "white") : "#718096",
              outline: filterEstado === e ? `2px solid ${ESTADO_COLORS[e] || "#2b6cb0"}` : "none",
              outlineOffset: 1 }}>
            {e === "Todos" ? `Todos (${proyectos.length})` : (t[e.toLowerCase()] || e)}
          </button>
        ))}
        {(search || filterEstado !== "Todos") && (
          <button onClick={() => { setSearch(""); setFilterEstado("Todos"); }}
            style={{ padding: "4px 10px", borderRadius: 99, fontSize: 11, cursor: "pointer",
              border: "1px solid #fed7d7", background: "#fff5f5", color: "#c53030", fontWeight: 600, marginLeft: "auto" }}>
            ✕ Limpiar
          </button>
        )}
      </div>
      {/* Riga 3: risultati summary */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#a0aec0", fontWeight: 600 }}>
          {filtered.length} de {proyectos.length} proyectos
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#276749" }}>
          Total filtrado: {fmt(totalMonto)}
        </span>
      </div>
    </div>
  );

  // ── Empty state guidato ──
  if (proyectos.length === 0) {
    return (
      <div style={{ background: "white", borderRadius: 16, padding: "60px 24px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
        <div style={{ fontSize: 56, marginBottom: 14 }}>📁</div>
        <div style={{ fontWeight: 800, fontSize: 18, color: "#1a365d", marginBottom: 8 }}>
          Aún no tienes proyectos
        </div>
        <div style={{ fontSize: 14, color: "#718096", maxWidth: 300, margin: "0 auto 28px", lineHeight: 1.6 }}>
          Crea tu primer presupuesto y envíaselo al cliente en menos de 5 minutos
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            {["📋 Datos del cliente", "🏗️ Agrega partidas", "🖨️ Envía el PDF"].map((step, i) => (
              <div key={i} style={{ background: "#f7fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 16px", fontSize: 12, color: "#4a5568", fontWeight: 600 }}>
                {i + 1}. {step}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: "#a0aec0" }}>
            👆 Usa el botón <strong>➕ Nuevo</strong> en la barra superior para empezar
          </div>
        </div>
      </div>
    );
  }

  // ── Mobile: lista con swipe + barra ricerca ──
  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <SearchBar />
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#a0aec0", background: "white", borderRadius: 12 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
            <div style={{ fontWeight: 600 }}>Sin resultados</div>
          </div>
        ) : filtered.map(p => (
          <ProyectoCard
            key={p.id} p={p}
            isActive={p.id === currentId}
            onLoad={onLoad} onDelete={onDelete} onPDF={onPDF} t={t}
          />
        ))}
      </div>
    );
  }

  // ── Desktop: grid card ──
  return (
    <div>
      <SearchBar />
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#a0aec0", background: "white", borderRadius: 12 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Sin resultados para "{search}"</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Prueba con otro término o limpia los filtros</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
          {filtered.map(p => {
            const ptot = calcProjectTotal(p);
            const isActive = p.id === currentId;
            return (
              <div
                key={p.id}
                onClick={() => onLoad(p)}
                role="button" tabIndex={0}
                onKeyDown={e => e.key === "Enter" && onLoad(p)}
                style={{
                  background: "white", borderRadius: 12, padding: 16, cursor: "pointer",
                  border: `2px solid ${isActive ? "#2b6cb0" : "transparent"}`,
                  boxShadow: `0 2px 8px rgba(0,0,0,${isActive ? .1 : .05})`,
                  transition: "all .2s",
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.12)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = `0 2px 8px rgba(0,0,0,${isActive ? .1 : .05})`}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.info?.cliente || t.sinNombre}</div>
                    <div style={{ fontSize: 11, color: "#718096", marginTop: 2 }}>{p.info?.descripcion?.slice(0, 45) || "—"}</div>
                  </div>
                  <span style={{
                    padding: "3px 9px", borderRadius: 99, fontSize: 10, fontWeight: 700, flexShrink: 0, marginLeft: 8,
                    background: ESTADO_BG[p.estado] || "#f7fafc",
                    color: ESTADO_COLORS[p.estado] || "#718096",
                  }}>{t[p.estado?.toLowerCase()] || p.estado}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#276749" }}>{fmt(ptot)}</div>
                  <div style={{ fontSize: 10, color: "#a0aec0" }}>{(p.updatedAt || "").slice(0, 10)}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={e => { e.stopPropagation(); canPlan && !canPlan("firma") ? onPaywall?.("firma") : onPDF(p); }}
                    style={{ flex: 1, padding: "5px", background: "#ebf8ff", border: "1px solid #bee3f8", borderRadius: 7, cursor: "pointer", color: "#2b6cb0", fontSize: 11, fontWeight: 600 }}>
                    🖨️ PDF
                  </button>
                  <button onClick={e => { e.stopPropagation(); onDelete(p.id); }}
                    style={{ padding: "5px 9px", background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 7, cursor: "pointer", color: "#c53030", fontSize: 11 }}>
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
