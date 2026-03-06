// ─── components/RicercaGlobale.jsx ──────────────────────────────────────────
// Ricerca globale su progetti, partidas e clienti.
// Aperto dall'App con Ctrl+K o bottone 🔍 nell'header.

import { useState, useMemo, useEffect, useRef } from "react";
import { fmt, calcProjectTotal } from "../utils/helpers";
import { ESTADO_COLORS, ESTADO_BG } from "../utils/constants";

const RicercaGlobale = ({ proyectos, t, onOpenProject, onClose }) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const risultati = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    const hits = [];

    proyectos.forEach(p => {
      const inCliente    = p.info?.cliente?.toLowerCase().includes(q);
      const inDesc       = p.info?.descripcion?.toLowerCase().includes(q);
      const inDir        = p.info?.direccion?.toLowerCase().includes(q);
      const partidaHits  = (p.partidas || []).filter(pt =>
        pt.nombre?.toLowerCase().includes(q) || pt.proveedor?.toLowerCase().includes(q)
      );

      if (inCliente || inDesc || inDir || partidaHits.length > 0) {
        hits.push({
          proyecto: p,
          tipo: inCliente || inDesc || inDir ? "proyecto" : "partida",
          partidas: partidaHits,
          total: calcProjectTotal(p),
        });
      }
    });

    return hits.slice(0, 20);
  }, [query, proyectos]);

  const highlight = (text, q) => {
    if (!text || !q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ background: "#fef08a", borderRadius: 2, padding: "0 1px" }}>{text.slice(idx, idx + q.length)}</mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  const q = query.trim().toLowerCase();

  return (
    <div role="dialog" aria-modal="true" aria-label="Ricerca globale"
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:4000,
        display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"60px 16px 16px" }}>
      <div style={{ background:"white",borderRadius:16,width:"100%",maxWidth:600,
        maxHeight:"80vh",overflow:"hidden",boxShadow:"0 30px 80px rgba(0,0,0,.4)",
        display:"flex",flexDirection:"column" }}>

        {/* Search input */}
        <div style={{ padding:"16px 18px",borderBottom:"1px solid #e2e8f0",display:"flex",alignItems:"center",gap:10 }}>
          <span style={{ fontSize:18 }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t.buscarPlaceholder || "Buscar proyectos, clientes, materiales..."}
            style={{ flex:1,border:"none",outline:"none",fontSize:16,color:"#1a365d",background:"transparent" }}
          />
          {query && (
            <button onClick={() => setQuery("")}
              style={{ background:"none",border:"none",cursor:"pointer",color:"#a0aec0",fontSize:16 }}>✕</button>
          )}
          <kbd style={{ fontSize:10,color:"#a0aec0",border:"1px solid #e2e8f0",borderRadius:4,padding:"2px 6px" }}>ESC</kbd>
        </div>

        {/* Risultati */}
        <div style={{ overflowY:"auto",flex:1 }}>
          {query.length < 2 ? (
            <div style={{ padding:"40px 20px",textAlign:"center",color:"#a0aec0" }}>
              <div style={{ fontSize:32,marginBottom:8 }}>🔍</div>
              <div style={{ fontSize:13 }}>{t.buscarMinChar || "Escribe al menos 2 caracteres"}</div>
            </div>
          ) : risultati.length === 0 ? (
            <div style={{ padding:"40px 20px",textAlign:"center",color:"#a0aec0" }}>
              <div style={{ fontSize:32,marginBottom:8 }}>😶</div>
              <div style={{ fontSize:13 }}>{t.buscarSinResultados || "Sin resultados para"} <strong>"{query}"</strong></div>
            </div>
          ) : (
            risultati.map(({ proyecto: p, partidas: pts }) => (
              <div key={p.id}
                onClick={() => { onOpenProject(p); onClose(); }}
                role="button" tabIndex={0}
                onKeyDown={e => e.key === "Enter" && (onOpenProject(p), onClose())}
                style={{ padding:"12px 18px",borderBottom:"1px solid #f7fafc",cursor:"pointer",transition:"background .1s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#f7fafc"}
                onMouseLeave={e => e.currentTarget.style.background = "white"}>

                {/* Riga progetto */}
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                    <span style={{ fontSize:15,fontWeight:700,color:"#1a365d" }}>
                      {highlight(p.info?.cliente || t.sinNombre, q)}
                    </span>
                    <span style={{ fontSize:10,padding:"2px 8px",borderRadius:99,fontWeight:700,
                      background: ESTADO_BG[p.estado] || "#f7fafc",
                      color:      ESTADO_COLORS[p.estado] || "#718096" }}>
                      {t[p.estado?.toLowerCase()] || p.estado}
                    </span>
                  </div>
                  <span style={{ fontSize:12,fontWeight:700,color:"#276749" }}>{fmt(calcProjectTotal(p))}</span>
                </div>

                {/* Descrizione */}
                {p.info?.descripcion && (
                  <div style={{ fontSize:11,color:"#718096",marginBottom:pts.length?4:0 }}>
                    {highlight(p.info.descripcion, q)}
                  </div>
                )}

                {/* Partidas matchate */}
                {pts.length > 0 && (
                  <div style={{ display:"flex",flexWrap:"wrap",gap:4,marginTop:4 }}>
                    {pts.slice(0,4).map(pt => (
                      <span key={pt.id} style={{ fontSize:10,padding:"2px 8px",background:"#ebf8ff",
                        borderRadius:99,color:"#2b6cb0",fontWeight:600 }}>
                        {highlight(pt.nombre, q)}
                      </span>
                    ))}
                    {pts.length > 4 && (
                      <span style={{ fontSize:10,color:"#a0aec0" }}>+{pts.length - 4}</span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {risultati.length > 0 && (
          <div style={{ padding:"8px 18px",borderTop:"1px solid #f0f4f8",fontSize:11,color:"#a0aec0",display:"flex",gap:16 }}>
            <span>↑↓ navegar</span>
            <span>↵ abrir</span>
            <span>ESC cerrar</span>
            <span style={{ marginLeft:"auto" }}>{risultati.length} {t.buscarResultados || "resultados"}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RicercaGlobale;
