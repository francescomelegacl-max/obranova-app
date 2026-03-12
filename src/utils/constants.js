// ─── utils/constants.js ──────────────────────────────────────────────────────


export const EMPRESA = {
  nombre:    "Obra Nova SPA",
  rut:       "78.301.823-3",
  direccion: "Humedal los Panules 2209",
  ciudad:    "Coquimbo",
  giro:      "Construcción en Obras Menores",
  telefono:  "9-42981608",
  email:     "obranovaspa@gmail.com",
};

export const DEFAULT_CATS = [
  "Obra Gruesa", "Instalaciones", "Terminaciones", "Muebles", "Materiales",
];

export const ESTADOS = ["Borrador", "Enviado", "Aceptado", "Rechazado", "En obra", "Finalizado"];

export const ESTADO_COLORS = {
  Borrador:   "#718096",
  Enviado:    "#2b6cb0",
  Aceptado:   "#276749",
  Rechazado:  "#c53030",
  "En obra":  "#b7791f",
  Finalizado: "#553c9a",
};

export const ESTADO_BG = {
  Borrador:   "#edf2f7",
  Enviado:    "#ebf8ff",
  Aceptado:   "#f0fff4",
  Rechazado:  "#fff5f5",
  "En obra":  "#fffaf0",
  Finalizado: "#faf5ff",
};

export const CAT_COLORS = [
  "#2b6cb0","#276749","#c05621","#553c9a","#b7791f",
  "#2c7a7b","#702459","#285e61","#744210","#1a365d",
];

export const UNITS = ["m²","m³","ml","gl","un","hr","kg","ton","lts","pza"];

export const PRINT_STYLE = `
@media print {
  body * { visibility:hidden!important; }
  #print-area, #print-area * { visibility:visible!important; }
  #print-area { position:fixed;top:0;left:0;width:100%;background:white;padding:20px;box-sizing:border-box; }
  .no-print { display:none!important; }
  @page { margin:1.5cm; size:A4; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  #print-area { position:fixed;top:0;left:0;width:100%;background:white !important;padding:20px;box-sizing:border-box;overflow:visible; }
}
`;
