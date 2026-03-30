// ─── components/tabs/TabReporteMensual.jsx ───────────────────────────────────
// Sprint 4 — #11 Reporte mensual PDF
// Sprint A — QR Code sul PDF: ogni progetto accettato mostra il QR del link firma
//            generato via api.qrserver.com (no dipendenze npm aggiuntive)
// Genera un informe ejecutivo mensual con todos los KPIs del workspace.
// El PDF se genera via window.print() — sin dependencias externas.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useMemo, useRef } from "react";
import { calcProjectTotal, calcProjectCostoReal } from "../../utils/helpers";
import { ESTADO_COLORS, ESTADO_BG, EMPRESA } from "../../utils/constants";
import { LOGO_URL } from "../../utils/logo";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt  = (n) => "$ " + Math.round(n || 0).toLocaleString("es-CL");
const fmtN = (n) => Math.round(n || 0).toLocaleString("es-CL");
const fmtDate = (d) => d ? new Date(d + "T12:00:00").toLocaleDateString("es-CL") : "—";
const fmtMes  = (yyyy, mm) => {
  const d = new Date(yyyy, mm - 1, 1);
  return d.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
};

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

// ── CSS de impresión inyectado en <head> ──────────────────────────────────────
const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #reporte-print, #reporte-print * { visibility: visible !important; }
  #reporte-print {
    position: fixed; top: 0; left: 0;
    width: 100%; background: white !important;
    padding: 0; margin: 0; box-sizing: border-box;
    font-family: 'Segoe UI', system-ui, sans-serif;
  }
  .no-print { display: none !important; }
  @page { margin: 1.2cm; size: A4; }
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .page-break { page-break-before: always; }
}
`;

// ── QR Code helper ────────────────────────────────────────────────────────────
// Genera URL immagine QR tramite api.qrserver.com (gratuito, no npm)
// Il cliente scansiona e apre direttamente la pagina di firma
function qrUrl(text, size = 80) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&format=png&margin=2`;
}

// ── Componente QR inline (usato nella tabella progetti) ───────────────────────
function QrCode({ url, size = 56, label }) {
  if (!url) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <img
        src={qrUrl(url, size * 2)}
        alt="QR firma"
        width={size}
        height={size}
        style={{ display: "block", borderRadius: 4, border: "1px solid #e2e8f0" }}
        onError={e => { e.target.style.display = "none"; }}
      />
      {label && (
        <div style={{ fontSize: 8, color: "#a0aec0", textAlign: "center", maxWidth: size, lineHeight: 1.2 }}>
          {label}
        </div>
      )}
    </div>
  );
}

// ── Componente KPI Card ───────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color = "#1a365d", bg = "#ebf8ff", icon }) {
  return (
    <div style={{
      background: bg, borderRadius: 12, padding: "14px 16px",
      border: `1px solid ${color}22`, flex: 1, minWidth: 120,
    }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 11, color: "#718096", fontWeight: 600, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 900, color }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "#a0aec0", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ── Barra progresso inline ────────────────────────────────────────────────────
function Bar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ flex: 1, height: 6, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99 }} />
    </div>
  );
}

// ── Stato badge ───────────────────────────────────────────────────────────────
function EstadoBadge({ estado }) {
  return (
    <span style={{
      background: ESTADO_BG[estado]  || "#f7fafc",
      color:      ESTADO_COLORS[estado] || "#718096",
      fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
    }}>{estado}</span>
  );
}

// ── Componente principale ─────────────────────────────────────────────────────
// firme: array di oggetti { token, proyectoId, stato } da useFirma/loadFirme
// Usato per mostrare il QR del link firma nella tabella progetti
export default function TabReporteMensual({ proyectos = [], fatture = [], workspace, firme = [] }) {
  const now = new Date();
  const [anno, setAnno] = useState(now.getFullYear());
  const [mese, setMese] = useState(now.getMonth() + 1); // 1-12
  const printRef = useRef();

  // ── Filtro periodo ────────────────────────────────────────────────────────
  const mesStr = `${anno}-${String(mese).padStart(2, "0")}`;

  const proyMese = useMemo(() =>
    proyectos.filter(p => (p.updatedAt || p.createdAt || "").startsWith(mesStr)),
    [proyectos, mesStr]
  );

  const proyAceptadosMese = useMemo(() =>
    proyMese.filter(p => p.estado === "Aceptado"),
    [proyMese]
  );

  const fattMese = useMemo(() =>
    fatture.filter(f => (f.creadoAt || "").startsWith(mesStr)),
    [fatture, mesStr]
  );

  // ── KPI periodo ───────────────────────────────────────────────────────────
  const kpi = useMemo(() => {
    const totalPrev    = proyAceptadosMese.reduce((s, p) => s + calcProjectTotal(p), 0);
    const totalCosto   = proyAceptadosMese.reduce((s, p) => s + calcProjectCostoReal(p), 0);
    const margen       = totalPrev - totalCosto;
    const margenPct    = totalPrev > 0 ? (margen / totalPrev) * 100 : 0;
    const enviados     = proyMese.filter(p => p.estado === "Enviado").length;
    const rechazados   = proyMese.filter(p => p.estado === "Rechazado").length;
    const enObra       = proyMese.filter(p => p.estado === "En obra").length;
    const convRate     = (enviados + proyAceptadosMese.length + rechazados) > 0
      ? Math.round(proyAceptadosMese.length / (enviados + proyAceptadosMese.length + rechazados) * 100) : 0;
    const fattTotale   = fattMese.reduce((s, f) => s + (f.importe || 0), 0);
    const fattPagata   = fattMese.filter(f => f.pagata).reduce((s, f) => s + (f.importe || 0), 0);
    const fattPendente = fattTotale - fattPagata;

    return {
      totalPrev, totalCosto, margen, margenPct,
      aceptados: proyAceptadosMese.length,
      enviados, rechazados, enObra,
      convRate, fattTotale, fattPagata, fattPendente,
      totalProyMese: proyMese.length,
    };
  }, [proyAceptadosMese, proyMese, fattMese]);

  // ── Top clientes del mese ─────────────────────────────────────────────────
  const topClientes = useMemo(() => {
    const map = {};
    proyAceptadosMese.forEach(p => {
      const k = p.info?.cliente || "Sin nombre";
      if (!map[k]) map[k] = { nombre: k, total: 0, proyectos: 0 };
      map[k].total     += calcProjectTotal(p);
      map[k].proyectos += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [proyAceptadosMese]);

  // ── Desglose por categoría ────────────────────────────────────────────────
  const porCategoria = useMemo(() => {
    const map = {};
    proyAceptadosMese.forEach(p => {
      (p.partidas || []).forEach(part => {
        const cat = part.cat || "Sin categoría";
        if (!map[cat]) map[cat] = 0;
        map[cat] += (part.cant || 0) * (part.pu || 0);
      });
    });
    const total = Object.values(map).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(map)
      .map(([cat, val]) => ({ cat, val, pct: Math.round(val / total * 100) }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 6);
  }, [proyAceptadosMese]);

  // ── Comparativa mese precedente ───────────────────────────────────────────
  const mesePrecStr = mese === 1
    ? `${anno - 1}-12`
    : `${anno}-${String(mese - 1).padStart(2, "0")}`;

  const proyPrec = useMemo(() =>
    proyectos
      .filter(p => (p.updatedAt || p.createdAt || "").startsWith(mesePrecStr) && p.estado === "Aceptado")
      .reduce((s, p) => s + calcProjectTotal(p), 0),
    [proyectos, mesePrecStr]
  );

  const varPct = proyPrec > 0
    ? Math.round(((kpi.totalPrev - proyPrec) / proyPrec) * 100) : null;

  // ── Map firma per proyectoId → token più recente (stato pending o firmato) ──
  const firmaMap = useMemo(() => {
    const map = {};
    [...firme]
      .sort((a, b) => (b.creadoAt || "").localeCompare(a.creadoAt || ""))
      .forEach(f => {
        if (!map[f.proyectoId]) map[f.proyectoId] = f;
      });
    return map;
  }, [firme]);

  // ── Fatture scadute ───────────────────────────────────────────────────────
  const fattScadute = useMemo(() =>
    fatture.filter(f =>
      !f.pagata &&
      f.dataVencimiento &&
      new Date(f.dataVencimiento) < now
    ),
    [fatture]
  );

  // ── Proyectos del mese (lista) ────────────────────────────────────────────
  const proyListaMese = useMemo(() =>
    [...proyMese].sort((a, b) => calcProjectTotal(b) - calcProjectTotal(a)).slice(0, 10),
    [proyMese]
  );

  // ── Stampa PDF ────────────────────────────────────────────────────────────
  const handlePrint = () => {
    const style = document.createElement("style");
    style.innerHTML = PRINT_CSS;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.head.removeChild(style), 1000);
  };

  const COLORS = ["#2b6cb0","#276749","#c05621","#553c9a","#b7791f","#2c7a7b"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 960, margin: "0 auto" }}>

      {/* ── Barra controlli (no print) ────────────────────────────────────── */}
      <div className="no-print" style={{
        background: "white", borderRadius: 14, padding: "16px 20px",
        boxShadow: "0 1px 4px rgba(0,0,0,.07)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#1a365d" }}>📊 Reporte mensual</div>
          <div style={{ fontSize: 12, color: "#718096", marginTop: 2 }}>
            Informe ejecutivo · {workspace?.name || EMPRESA.nombre}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <select
            value={mese}
            onChange={e => setMese(Number(e.target.value))}
            style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#1a365d", fontWeight: 600 }}
          >
            {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select
            value={anno}
            onChange={e => setAnno(Number(e.target.value))}
            style={{ padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#1a365d", fontWeight: 600 }}
          >
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={handlePrint}
            style={{
              padding: "9px 20px", background: "#1a365d", color: "white",
              border: "none", borderRadius: 9, cursor: "pointer",
              fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6,
            }}
          >
            🖨️ Descargar PDF
          </button>
        </div>
      </div>

      {/* ── AREA STAMPA ───────────────────────────────────────────────────── */}
      <div id="reporte-print" ref={printRef} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg,#1a365d 0%,#2d3748 60%,#553c9a 100%)",
          borderRadius: 16, padding: "24px 28px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: 12,
        }}>
          <div>
            <div style={{ color: "rgba(255,255,255,.6)", fontSize: 11, fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>
              INFORME EJECUTIVO MENSUAL
            </div>
            <div style={{ color: "white", fontSize: 24, fontWeight: 900, marginBottom: 4 }}>
              {MESES[mese - 1]} {anno}
            </div>
            <div style={{ color: "rgba(255,255,255,.7)", fontSize: 13 }}>
              {workspace?.name || EMPRESA.nombre}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <img
              src={LOGO_URL}
              alt="Logo"
              style={{ height: 44, marginBottom: 6, filter: "brightness(0) invert(1)", opacity: .9 }}
              onError={e => { e.target.style.display = "none"; }}
            />
            <div style={{ color: "rgba(255,255,255,.5)", fontSize: 10 }}>
              Generado el {new Date().toLocaleDateString("es-CL")}
            </div>
          </div>
        </div>

        {/* ── ALERTA FACTURAS VENCIDAS ─────────────────────────────────────── */}
        {fattScadute.length > 0 && (
          <div style={{
            background: "#fff5f5", border: "1px solid #fed7d7",
            borderRadius: 12, padding: "12px 16px",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#c53030" }}>
                {fattScadute.length} factura{fattScadute.length > 1 ? "s" : ""} vencida{fattScadute.length > 1 ? "s" : ""} sin pagar
              </div>
              <div style={{ fontSize: 11, color: "#e53e3e", marginTop: 1 }}>
                Total pendiente vencido: {fmt(fattScadute.reduce((s, f) => s + (f.importe || 0), 0))} CLP
              </div>
            </div>
          </div>
        )}

        {/* ── KPIs PRINCIPALES ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <KpiCard
            icon="💰" label="Facturación aceptada"
            value={fmt(kpi.totalPrev)}
            sub={varPct !== null ? `${varPct >= 0 ? "▲" : "▼"} ${Math.abs(varPct)}% vs mes anterior` : "Sin comparativa"}
            color={varPct !== null && varPct >= 0 ? "#276749" : "#c53030"}
            bg={varPct !== null && varPct >= 0 ? "#f0fff4" : "#fff5f5"}
          />
          <KpiCard
            icon="📈" label="Margen bruto"
            value={`${Math.round(kpi.margenPct)}%`}
            sub={fmt(kpi.margen) + " CLP"}
            color={kpi.margenPct >= 20 ? "#276749" : kpi.margenPct >= 10 ? "#c05621" : "#c53030"}
            bg={kpi.margenPct >= 20 ? "#f0fff4" : kpi.margenPct >= 10 ? "#fffbeb" : "#fff5f5"}
          />
          <KpiCard
            icon="✅" label="Proyectos aceptados"
            value={kpi.aceptados}
            sub={`de ${kpi.totalProyMese} en el período`}
            color="#2b6cb0" bg="#ebf8ff"
          />
          <KpiCard
            icon="🎯" label="Tasa conversión"
            value={`${kpi.convRate}%`}
            sub="Aceptados / (Env + Acep + Rech)"
            color="#553c9a" bg="#faf5ff"
          />
        </div>

        {/* ── FILA SECUNDARIA KPI ───────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <KpiCard
            icon="🧾" label="Facturas emitidas"
            value={fattMese.length}
            sub={fmt(kpi.fattTotale) + " total"}
            color="#276749" bg="#f0fff4"
          />
          <KpiCard
            icon="✔️" label="Facturas cobradas"
            value={fmt(kpi.fattPagata)}
            sub={`${fattMese.filter(f => f.pagata).length} de ${fattMese.length}`}
            color="#276749" bg="#f0fff4"
          />
          <KpiCard
            icon="⏳" label="Por cobrar"
            value={fmt(kpi.fattPendente)}
            sub={`${fattMese.filter(f => !f.pagata).length} facturas pendientes`}
            color={kpi.fattPendente > 0 ? "#c05621" : "#718096"}
            bg={kpi.fattPendente > 0 ? "#fffbeb" : "#f7fafc"}
          />
          <KpiCard
            icon="🏗️" label="En ejecución"
            value={kpi.enObra}
            sub="proyectos activos este mes"
            color="#b7791f" bg="#fffaf0"
          />
        </div>

        {/* ── FILA: TOP CLIENTES + DESGLOSE CATEGORÍAS ─────────────────────── */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>

          {/* Top clientes */}
          <div style={{
            flex: 1, minWidth: 260, background: "white",
            borderRadius: 14, padding: "18px 20px",
            boxShadow: "0 1px 4px rgba(0,0,0,.07)",
          }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: "#1a365d", marginBottom: 14 }}>
              🏆 Top clientes — {MESES[mese - 1]}
            </div>
            {topClientes.length === 0 ? (
              <div style={{ color: "#a0aec0", fontSize: 12, textAlign: "center", padding: "20px 0" }}>
                Sin proyectos aceptados este mes
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {topClientes.map((c, i) => (
                  <div key={c.nombre}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#2d3748" }}>
                        <span style={{ color: "#a0aec0", marginRight: 6 }}>#{i + 1}</span>
                        {c.nombre}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#276749" }}>
                        {fmt(c.total)}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Bar value={c.total} max={topClientes[0]?.total || 1} color={COLORS[i % COLORS.length]} />
                      <span style={{ fontSize: 10, color: "#a0aec0", whiteSpace: "nowrap" }}>
                        {c.proyectos} proy.
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desglose categorías */}
          <div style={{
            flex: 1, minWidth: 260, background: "white",
            borderRadius: 14, padding: "18px 20px",
            boxShadow: "0 1px 4px rgba(0,0,0,.07)",
          }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: "#1a365d", marginBottom: 14 }}>
              📦 Desglose por categoría
            </div>
            {porCategoria.length === 0 ? (
              <div style={{ color: "#a0aec0", fontSize: 12, textAlign: "center", padding: "20px 0" }}>
                Sin datos
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {porCategoria.map((c, i) => (
                  <div key={c.cat}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#2d3748" }}>{c.cat}</span>
                      <span style={{ fontSize: 11, color: "#718096" }}>{c.pct}% · {fmt(c.val)}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Bar value={c.val} max={porCategoria[0]?.val || 1} color={COLORS[i % COLORS.length]} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── TABLA PROYECTOS DEL PERIODO ───────────────────────────────────── */}
        <div style={{
          background: "white", borderRadius: 14, padding: "18px 20px",
          boxShadow: "0 1px 4px rgba(0,0,0,.07)",
        }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: "#1a365d", marginBottom: 14 }}>
            📋 Proyectos del período ({proyListaMese.length})
          </div>

          {proyListaMese.length === 0 ? (
            <div style={{ color: "#a0aec0", fontSize: 12, textAlign: "center", padding: "24px 0" }}>
              No hay proyectos registrados en {MESES[mese - 1]} {anno}
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#f7fafc" }}>
                    {["N°", "Cliente", "Descripción", "Estado", "Total", "Costo real", "Margen", "QR Firma"].map(h => (
                      <th key={h} style={{
                        padding: "8px 10px", textAlign: "left",
                        fontWeight: 700, color: "#718096", fontSize: 10,
                        borderBottom: "2px solid #e2e8f0", whiteSpace: "nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {proyListaMese.map((p, i) => {
                    const total  = calcProjectTotal(p);
                    const costo  = calcProjectCostoReal(p);
                    const margen = total - costo;
                    const mPct   = total > 0 ? Math.round((margen / total) * 100) : 0;
                    return (
                      <tr key={p.id || i} style={{ borderBottom: "1px solid #f0f4f8" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f7fafc"}
                        onMouseLeave={e => e.currentTarget.style.background = "white"}
                      >
                        <td style={{ padding: "8px 10px", color: "#a0aec0", fontWeight: 600 }}>
                          {p.info?.numero || `#${i + 1}`}
                        </td>
                        <td style={{ padding: "8px 10px", fontWeight: 600, color: "#2d3748", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.info?.cliente || "—"}
                        </td>
                        <td style={{ padding: "8px 10px", color: "#718096", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.info?.descripcion || "—"}
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          <EstadoBadge estado={p.estado} />
                        </td>
                        <td style={{ padding: "8px 10px", fontWeight: 700, color: "#1a365d", whiteSpace: "nowrap" }}>
                          {fmt(total)}
                        </td>
                        <td style={{ padding: "8px 10px", color: "#718096", whiteSpace: "nowrap" }}>
                          {costo > 0 ? fmt(costo) : "—"}
                        </td>
                        <td style={{ padding: "8px 10px", whiteSpace: "nowrap" }}>
                          {costo > 0 ? (
                            <span style={{
                              fontWeight: 700,
                              color: mPct >= 20 ? "#276749" : mPct >= 10 ? "#c05621" : "#c53030",
                            }}>
                              {mPct}%
                            </span>
                          ) : "—"}
                        </td>
                        {/* ── QR Code firma ── */}
                        <td style={{ padding: "6px 10px", textAlign: "center", verticalAlign: "middle" }}>
                          {(() => {
                            const firma = firmaMap[p.id];
                            if (!firma) return <span style={{ fontSize: 9, color: "#cbd5e0" }}>Sin link</span>;
                            const firmaUrl = `${window.location.origin}/firma/${firma.token}`;
                            const estadoColor = firma.stato === "firmato" ? "#276749" : firma.stato === "rifiutato" ? "#c53030" : "#c05621";
                            const estadoLabel = firma.stato === "firmato" ? "✓ Firmado" : firma.stato === "rifiutato" ? "✗ Rechazado" : "Pendiente";
                            return (
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                                <QrCode url={firmaUrl} size={52} />
                                <span style={{ fontSize: 8, fontWeight: 700, color: estadoColor }}>{estadoLabel}</span>
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Totali */}
                {proyAceptadosMese.length > 0 && (
                  <tfoot>
                    <tr style={{ background: "#f0f4f8", fontWeight: 700 }}>
                      <td colSpan={5} style={{ padding: "9px 10px", fontSize: 11, color: "#4a5568" }}>
                        TOTAL ACEPTADOS ({kpi.aceptados} proyectos)
                      </td>
                      <td style={{ padding: "9px 10px", color: "#1a365d", whiteSpace: "nowrap" }}>
                        {fmt(kpi.totalPrev)}
                      </td>
                      <td style={{ padding: "9px 10px", color: "#718096", whiteSpace: "nowrap" }}>
                        {fmt(kpi.totalCosto)}
                      </td>
                      <td style={{ padding: "9px 10px", color: kpi.margenPct >= 15 ? "#276749" : "#c05621", whiteSpace: "nowrap" }}>
                        {Math.round(kpi.margenPct)}%
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>

        {/* ── FACTURAS DEL PERIODO ──────────────────────────────────────────── */}
        {fattMese.length > 0 && (
          <div style={{
            background: "white", borderRadius: 14, padding: "18px 20px",
            boxShadow: "0 1px 4px rgba(0,0,0,.07)",
          }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: "#1a365d", marginBottom: 14 }}>
              🧾 Facturas — {MESES[mese - 1]} {anno}
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f7fafc" }}>
                  {["N°", "Proyecto / Cliente", "Emitida", "Vence", "Importe", "Estado"].map(h => (
                    <th key={h} style={{
                      padding: "8px 10px", textAlign: "left",
                      fontWeight: 700, color: "#718096", fontSize: 10,
                      borderBottom: "2px solid #e2e8f0",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fattMese.map((f, i) => {
                  const vencida = !f.pagata && f.dataVencimiento && new Date(f.dataVencimiento) < now;
                  return (
                    <tr key={f.id || i} style={{ borderBottom: "1px solid #f0f4f8" }}>
                      <td style={{ padding: "8px 10px", fontWeight: 600, color: "#718096" }}>
                        #{f.numero || i + 1}
                      </td>
                      <td style={{ padding: "8px 10px", color: "#2d3748", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {f.clienteNombre || f.proyectoNombre || "—"}
                      </td>
                      <td style={{ padding: "8px 10px", color: "#718096", whiteSpace: "nowrap" }}>
                        {fmtDate(f.dataFattura?.slice(0, 10))}
                      </td>
                      <td style={{ padding: "8px 10px", whiteSpace: "nowrap", color: vencida ? "#c53030" : "#718096", fontWeight: vencida ? 700 : 400 }}>
                        {fmtDate(f.dataVencimiento?.slice(0, 10))}
                        {vencida && " ⚠️"}
                      </td>
                      <td style={{ padding: "8px 10px", fontWeight: 700, color: "#1a365d", whiteSpace: "nowrap" }}>
                        {fmt(f.importe)}
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                          background: f.pagata ? "#f0fff4" : vencida ? "#fff5f5" : "#fffbeb",
                          color:      f.pagata ? "#276749" : vencida ? "#c53030" : "#c05621",
                        }}>
                          {f.pagata ? "✓ Pagada" : vencida ? "Vencida" : "Pendiente"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── RESUMEN COMPARATIVO ───────────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg,#f7fafc,#edf2f7)",
          borderRadius: 14, padding: "18px 20px",
          border: "1px solid #e2e8f0",
        }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: "#1a365d", marginBottom: 14 }}>
            📊 Resumen ejecutivo — {MESES[mese - 1]} {anno}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {[
              { label: "Proyectos en el período",    value: fmtN(kpi.totalProyMese),       unit: "proyectos" },
              { label: "Proyectos aceptados",         value: fmtN(kpi.aceptados),           unit: `conv. ${kpi.convRate}%` },
              { label: "Proyectos enviados",          value: fmtN(kpi.enviados),            unit: "en evaluación" },
              { label: "Facturación aceptada",        value: fmt(kpi.totalPrev),            unit: "CLP" },
              { label: "Costo directo estimado",      value: fmt(kpi.totalCosto),           unit: "CLP" },
              { label: "Margen bruto estimado",       value: `${Math.round(kpi.margenPct)}%`, unit: fmt(kpi.margen) },
              { label: "Facturas emitidas",           value: fmt(kpi.fattTotale),           unit: `${fattMese.length} documentos` },
              { label: "Cobrado en el período",       value: fmt(kpi.fattPagata),           unit: "efectivo" },
              { label: "Pendiente de cobro",          value: fmt(kpi.fattPendente),         unit: fattScadute.length > 0 ? `⚠️ ${fattScadute.length} vencidas` : "al día" },
            ].map(({ label, value, unit }) => (
              <div key={label} style={{
                background: "white", borderRadius: 10, padding: "12px 14px",
                border: "1px solid #e2e8f0",
              }}>
                <div style={{ fontSize: 10, color: "#a0aec0", fontWeight: 600, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: "#1a365d" }}>{value}</div>
                <div style={{ fontSize: 10, color: "#718096", marginTop: 2 }}>{unit}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FOOTER ───────────────────────────────────────────────────────── */}
        <div style={{
          textAlign: "center", padding: "12px 0 4px",
          borderTop: "1px solid #e2e8f0", fontSize: 10, color: "#a0aec0",
        }}>
          {workspace?.name || EMPRESA.nombre} · Reporte {MESES[mese - 1]} {anno} · Generado con Obra Nova ·{" "}
          {new Date().toLocaleDateString("es-CL")}
        </div>

      </div>{/* fin #reporte-print */}
    </div>
  );
}
