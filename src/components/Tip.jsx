// ─── components/Tip.jsx ──────────────────────────────────────────────────────
// Componente Tip isolato — evita dipendenza da UI.jsx (e da utils/logo, helpers)
// nel chunk tab-proyecto, eliminando il TDZ in prod con Vite/Rollup.
import { useState } from "react";

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

export default Tip;
