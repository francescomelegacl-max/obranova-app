// ─── utils/helpers.js ────────────────────────────────────────────────────────

/** Formatta un numero come valuta cilena: $ 1.234.567 */
export const fmt = (n) =>
  "$ " + Math.round(n || 0).toLocaleString("es-CL");

// 3.9 Multi-moneda: formatta in base alla moneda del progetto
const MONEDA_CONFIG = {
  CLP: { locale: "es-CL", currency: "CLP", symbol: "$", decimals: 0 },
  USD: { locale: "en-US", currency: "USD", symbol: "US$", decimals: 2 },
  UF:  { locale: "es-CL", currency: null,  symbol: "UF", decimals: 4 },
  EUR: { locale: "es-ES", currency: "EUR", symbol: "€", decimals: 2 },
};
export const fmtMoneda = (n, moneda = "CLP") => {
  const cfg = MONEDA_CONFIG[moneda] || MONEDA_CONFIG.CLP;
  const num = Number(n || 0);
  if (cfg.currency) {
    return num.toLocaleString(cfg.locale, { style: "currency", currency: cfg.currency, maximumFractionDigits: cfg.decimals, minimumFractionDigits: cfg.decimals });
  }
  // UF: no simbolo ISO, usa prefisso
  return `${cfg.symbol} ${num.toFixed(cfg.decimals).replace(".", ",")}`;
};

/** Formatta una percentuale con segno: +12.3% / -5.0% */
export const fmtPct = (n) =>
  (n >= 0 ? "+" : "") + n.toFixed(1) + "%";

/** Restituisce la data odierna in formato ISO YYYY-MM-DD */
export const todayStr = () => new Date().toISOString().slice(0, 10);

/**
 * Calcola tutti i totali finanziari a partire da partidas e pct.
 * Restituisce un oggetto con cd, ci, gf, imprevistos, sub, util, total, iva, totalIva.
 */
export const calcTotals = (partidas, pct) => {
  const cd      = partidas.reduce((s, p) => s + p.cant * p.pu, 0);
  const ci      = cd * (pct.ci / 100);
  const gf      = cd * (pct.gf / 100);
  const imprev  = cd * (pct.imprevistos / 100);
  const sub     = cd + ci + gf + imprev;
  const util    = sub * (pct.utilidad / 100);
  const total   = sub + util;
  const ivaAmt  = total * 0.19;
  const totalIva = total + ivaAmt;
  return { cd, ci, gf, imprevistos: imprev, sub, util, total, iva: ivaAmt, totalIva };
};

/**
 * Calcola il totale finale di un progetto (con o senza IVA).
 * Usato nel Dashboard e nella lista Proyectos.
 */
export const calcProjectTotal = (proyecto) => {
  const cd = (proyecto.partidas || []).reduce((a, x) => a + x.cant * x.pu, 0);
  const pc = proyecto.pct || { ci: 10, gf: 5, imprevistos: 5, utilidad: 10 };
  const sub = cd * (1 + (pc.ci + pc.gf + pc.imprevistos) / 100);
  const total = sub * (1 + pc.utilidad / 100);
  return total * (proyecto.iva !== false ? 1.19 : 1);
};

/**
 * Genera il CSV per l'export Excel.
 */
export const exportCSV = (info, partidas, pct, totals) => {
  const rows = [
    ["OBRA NOVA SPA — " + (info.cliente || "Sin nombre")],
    ["Proyecto:", info.descripcion || "", "Fecha:", info.fecha || ""],
    ["Dirección:", info.direccion || "", "Ciudad:", info.ciudad || ""],
    [],
    ["Categoría","Descripción","Unidad","Cantidad","P.Unit.","Total","Proveedor","Nota"],
  ];
  partidas.forEach((p) =>
    rows.push([p.cat, p.nombre, p.unidad, p.cant, p.pu, p.cant * p.pu, p.proveedor || "", p.nota || ""])
  );
  rows.push(
    [],
    ["Costos Directos",   totals.cd],
    ["CI " + pct.ci + "%", totals.ci],
    ["GF " + pct.gf + "%", totals.gf],
    ["Imprevistos " + pct.imprevistos + "%", totals.imprevistos],
    ["Subtotal", totals.sub],
    ["Utilidad " + pct.utilidad + "%", totals.util],
    ["Total s/IVA", totals.total],
    ["IVA 19%", totals.iva],
    ["TOTAL c/IVA", totals.totalIva]
  );
  const csv = rows
    .map((r) => r.map((c) => `"${String(c || "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `ObraNova_${(info.cliente || "pres").replace(/\s/g, "_")}_${info.fecha || "export"}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Calcola il costo reale di un progetto: somma delle sole partidas
 * con cant > 0 e pu > 0, senza margini/pct/utilità.
 * Rappresenta quanto è costato effettivamente il progetto.
 */
export const calcProjectCostoReal = (proyecto) => {
  return (proyecto.partidas || []).reduce((a, x) => a + (x.cant || 0) * (x.pu || 0), 0);
};
