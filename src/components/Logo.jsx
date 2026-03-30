// Salva come: src/components/Logo.jsx
export default function Logo({ width = "100%", maxWidth = "320px", className = "" }) {
  return (
    <div style={{ width, maxWidth }} className={className}>
      <svg 
        viewBox="0 0 450 100" 
        xmlns="http://www.w3.org/2000/svg" 
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        {/* ICONA "ON" - BLOCCHI E TRAVI */}
        <g>
          {/* 'O' - Struttura base rigida (Navy) */}
          <path d="M 10 20 H 62 V 80 H 10 Z M 26 36 V 64 H 46 V 36 Z" fill="#1a365d" />
          {/* 'N' - Trave diagonale e pilastro (Giallo Cantiere) */}
          <polygon points="46,20 62,20 98,80 82,80" fill="#f5a623" />
          <rect x="82" y="20" width="16" height="60" fill="#f5a623" />
        </g>
        
        {/* NOME OBRA NOVA */}
        <text 
          x="125" y="60" 
          fontFamily="'Barlow Condensed', 'Segoe UI', system-ui, sans-serif" 
          fontWeight="900" 
          fontSize="48" 
          fill="#1a365d" 
          letterSpacing="-1"
        >
          OBRA<tspan fill="#f5a623">NOVA</tspan>
        </text>
        
        {/* SLOGAN COMMERCIALE */}
        <text 
          x="128" y="82" 
          fontFamily="system-ui, sans-serif" 
          fontWeight="700" 
          fontSize="14.5" 
          fill="#718096" 
          letterSpacing="0.5"
        >
          Presupuestos que cierran contratos
        </text>
      </svg>
    </div>
  );
}