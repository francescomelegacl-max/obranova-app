// ─── src/components/tabs/TabExportContable.jsx ───────────────────────────────
// Export contabile per piano Empresa — formati: Bsale, Defontana, Excel generico
// v2: + filtro date, badge semaforo, grafico KPI, totali per categoria
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useMemo, useRef, useEffect } from "react";
import { calcTotals, fmt } from "../../utils/helpers";

// ── Badge semaforo pagamento ──────────────────────────────────────────────────
function PagoBadge({ cuotas, totale }) {
  if (!cuotas?.length) return <span style={{ fontSize: 10, color: "#a0aec0", background: "#f7fafc", borderRadius: 4, padding: "2px 6px" }}>Sin cuotas</span>;
  const pagado = cuotas.filter(c => c.pagado).reduce((s, c) => s + (c.tipo === "pct" ? totale * (c.monto || 0) / 100 : (c.monto || 0)), 0);
  const pct = totale > 0 ? pagado / totale : 0;
  const [color, bg, label] =
    pct >= 1    ? ["#276749", "#f0fff4", "✅ Pagado"] :
    pct >= 0.5  ? ["#c05621", "#fffbeb", "🟡 Parcial"] :
    pct > 0     ? ["#b7791f", "#fefcbf", "🟠 Inicio"]  :
                  ["#c53030", "#fff5f5", "🔴 Pendiente"];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color, background: bg, borderRadius: 4, padding: "2px 7px", border: `1px solid ${color}33`, whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

// ── Grafico KPI a barre orizzontali ──────────────────────────────────────────
function KpiChart({ aggTotals }) {
  const items = [
    { label: "Costos directos", value: aggTotals.cd,        color: "#e53e3e" },
    { label: "Utilidad",        value: aggTotals.util,       color: "#38a169" },
    { label: "Cobrado",         value: aggTotals.pagado,     color: "#2b6cb0" },
    { label: "Por cobrar",      value: aggTotals.pendiente,  color: "#d69e2e" },
  ];
  const max = Math.max(...items.map(i => i.value), 1);
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.6)", marginBottom: 8, letterSpacing: .4 }}>DISTRIBUCIÓN</div>
      {items.map(item => (
        <div key={item.label} style={{ marginBottom: 7 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "rgba(255,255,255,.75)", marginBottom: 3 }}>
            <span>{item.label}</span>
            <span style={{ fontWeight: 700 }}>{fmt(item.value)}</span>
          </div>
          <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 4, height: 6, overflow: "hidden" }}>
            <div style={{ width: `${(item.value / max) * 100}%`, background: item.color, height: "100%", borderRadius: 4, transition: "width .5s ease" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Totali per categoria aggregati ───────────────────────────────────────────
function CatTotals({ proyectos }) {
  const cats = useMemo(() => {
    const map = {};
    proyectos.forEach(p => {
      (p.partidas || []).forEach(part => {
        const c = part.cat || "Sin categoría";
        if (!map[c]) map[c] = 0;
        map[c] += Math.round((part.cant || 0) * (part.pu || 0));
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [proyectos]);

  if (!cats.length) return null;
  const total = cats.reduce((s, [, v]) => s + v, 0);

  return (
    <div style={{ background: "white", borderRadius: 12, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,.07)", marginBottom: 16 }}>
      <div style={{ fontWeight: 800, fontSize: 13, color: "#1a365d", marginBottom: 12 }}>
        📂 Totales por categoría
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 8 }}>
        {cats.map(([cat, val]) => {
          const pct = total > 0 ? (val / total) * 100 : 0;
          return (
            <div key={cat} style={{ background: "#f7fafc", borderRadius: 8, padding: "9px 12px", borderLeft: "3px solid #2b6cb0" }}>
              <div style={{ fontSize: 11, color: "#718096", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat}</div>
              <div style={{ fontWeight: 800, fontSize: 14, color: "#1a365d" }}>{fmt(val)}</div>
              <div style={{ fontSize: 10, color: "#a0aec0", marginTop: 2 }}>{pct.toFixed(1)}% del total</div>
              <div style={{ background: "#e2e8f0", borderRadius: 3, height: 3, marginTop: 5, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, background: "#2b6cb0", height: "100%", borderRadius: 3 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Helpers export ────────────────────────────────────────────────────────────

function escapeCsv(v) {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

function downloadCsv(rows, filename) {
  const csv = rows.map(r => r.map(escapeCsv).join(";")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function downloadExcel(rows, filename) {
  // Genera un file .xlsx vero usando la libreria SheetJS (via CDN già caricata)
  // Fallback: CSV con estensione xlsx se SheetJS non disponibile
  try {
    const ws = {};
    rows.forEach((row, ri) => {
      row.forEach((cell, ci) => {
        const addr = `${String.fromCharCode(65 + ci)}${ri + 1}`;
        const isNum = typeof cell === "number" && !isNaN(cell);
        ws[addr] = isNum ? { v: cell, t: "n", z: "#,##0" } : { v: String(cell ?? ""), t: "s" };
      });
    });
    ws["!ref"] = `A1:${String.fromCharCode(65 + Math.max(...rows.map(r => r.length)) - 1)}${rows.length}`;
    ws["!cols"] = rows[0]?.map(() => ({ wch: 20 }));
    const wb = { SheetNames: ["Export"], Sheets: { Export: ws } };
    const XLSX = window.XLSX;
    if (XLSX) {
      XLSX.writeFile(wb, filename);
      return;
    }
  } catch {}
  // Fallback CSV
  downloadCsv(rows, filename.replace(".xlsx", ".csv"));
}

// ── Generatori formato ────────────────────────────────────────────────────────

function generaBsale(proyectos, workspace) {
  // Formato Bsale: https://developers.bsale.io
  // Una riga per partida, campi richiesti per importazione documenti
  const rows = [
    ["Tipo Documento","Folio","Fecha","RUT Cliente","Nombre Cliente","Dirección","Ciudad",
     "Código Producto","Nombre Producto","Categoría","Unidad","Cantidad","Precio Unitario","Descuento %","Neto","IVA","Total","Proveedor","Nota"],
  ];
  proyectos.forEach(p => {
    const totals = calcTotals(p.partidas || [], p.pct || {}, p.descuento);
    const fecha  = p.info?.fecha || new Date().toISOString().slice(0,10);
    const folio  = p.id?.slice(-6).toUpperCase() || "000000";
    (p.partidas || []).forEach((part, i) => {
      const neto  = Math.round(part.cant * part.pu);
      const iva   = p.iva !== false ? Math.round(neto * 0.19) : 0;
      const total = neto + iva;
      rows.push([
        "Presupuesto",
        folio,
        fecha,
        p.info?.rut || workspace?.rut || "",
        p.info?.cliente || "",
        p.info?.direccion || "",
        p.info?.ciudad || "Coquimbo",
        `PART-${String(i+1).padStart(3,"0")}`,
        part.nombre || "",
        part.cat || "",
        part.unidad || "gl",
        part.cant || 0,
        part.pu || 0,
        0,
        neto,
        iva,
        total,
        part.proveedor || "",
        part.nota || "",
      ]);
    });
  });
  return rows;
}

function generaDefontana(proyectos, workspace) {
  // Formato Defontana ERP — layout standard para importación de presupuestos
  const rows = [
    ["NumeroDocumento","FechaDocumento","RutCliente","NombreCliente","DireccionCliente","ComunaCliente",
     "CodigoProducto","DescripcionProducto","Categoria","UnidadMedida","Cantidad","PrecioUnitario",
     "MontoNeto","MontoIVA","MontoTotal","Proveedor","Observaciones","CentroCosto"],
  ];
  proyectos.forEach(p => {
    const fecha  = (p.info?.fecha || "").replace(/-/g, "/");
    const folio  = `ON-${p.id?.slice(-6).toUpperCase() || "000000"}`;
    (p.partidas || []).forEach((part, i) => {
      const neto  = Math.round(part.cant * part.pu);
      const iva   = p.iva !== false ? Math.round(neto * 0.19) : 0;
      rows.push([
        folio,
        fecha,
        p.info?.rut || workspace?.rut || "00.000.000-0",
        p.info?.cliente || "",
        p.info?.direccion || "",
        p.info?.ciudad || "Coquimbo",
        part.cat?.replace(/\s/g,"_").toUpperCase().slice(0,10) + String(i+1).padStart(3,"0"),
        part.nombre || "",
        part.cat || "",
        part.unidad || "UN",
        part.cant || 0,
        part.pu || 0,
        neto,
        iva,
        neto + iva,
        part.proveedor || "",
        part.nota || "",
        part.cat || "",
      ]);
    });
  });
  return rows;
}

function generaExcelGenerico(proyectos, workspace) {
  // Excel multi-foglio simulato come CSV strutturato — leggibile da qualsiasi contabile
  const rows = [];

  // Header azienda
  rows.push(["OBRA NOVA SPA", workspace?.name || "", "", "", "", "", ""]);
  rows.push(["RUT:", workspace?.rut || "78.301.823-3", "Exportado:", new Date().toLocaleDateString("es-CL")]);
  rows.push([]);

  proyectos.forEach(p => {
    const totals = calcTotals(p.partidas || [], p.pct || {}, p.descuento);
    const folio  = p.id?.slice(-6).toUpperCase() || "——";

    // Header preventivo
    rows.push(["═══════════════════════════════════════════════════════════"]);
    rows.push(["PRESUPUESTO N°", folio, "", "ESTADO:", p.estado || "Borrador"]);
    rows.push(["Cliente:", p.info?.cliente || "", "Fecha:", p.info?.fecha || ""]);
    rows.push(["Descripción:", p.info?.descripcion || "", "Validez:", `${p.validez || 30} días`]);
    rows.push(["Dirección:", p.info?.direccion || "", "Ciudad:", p.info?.ciudad || ""]);
    rows.push([]);

    // Partidas
    rows.push(["Categoría", "Descripción", "Unidad", "Cantidad", "P.Unit. ($)", "Total ($)", "Proveedor", "Nota"]);

    // Raggruppa per categoria
    const cats = [...new Set((p.partidas||[]).map(x => x.cat))];
    cats.forEach(cat => {
      const items = (p.partidas||[]).filter(x => x.cat === cat);
      const catTotal = items.reduce((s, x) => s + x.cant * x.pu, 0);
      rows.push([`── ${cat} ──`, "", "", "", "", Math.round(catTotal)]);
      items.forEach(part => {
        rows.push([
          "", part.nombre || "", part.unidad || "", part.cant || 0,
          Math.round(part.pu || 0), Math.round((part.cant||0)*(part.pu||0)),
          part.proveedor || "", part.nota || "",
        ]);
      });
    });

    // Totali
    rows.push([]);
    rows.push(["", "", "", "", "Costos Directos:",      Math.round(totals.cd)]);
    rows.push(["", "", "", "", `CI (${p.pct?.ci||10}%):`, Math.round(totals.ci)]);
    rows.push(["", "", "", "", `GF (${p.pct?.gf||5}%):`, Math.round(totals.gf)]);
    rows.push(["", "", "", "", `Imprevistos (${p.pct?.imprevistos||5}%):`, Math.round(totals.imprevistos)]);
    rows.push(["", "", "", "", "Subtotal:",             Math.round(totals.sub)]);
    rows.push(["", "", "", "", `Utilidad (${p.pct?.utilidad||10}%):`, Math.round(totals.util)]);
    if (totals.descuentoAmt > 0) {
      rows.push(["", "", "", "", `Descuento (${p.descuento?.descripcion||""})`, -Math.round(totals.descuentoAmt)]);
    }
    rows.push(["", "", "", "", "Total s/IVA:",          Math.round(totals.totalConDesc)]);
    if (p.iva !== false) {
      rows.push(["", "", "", "", "IVA (19%):",           Math.round(totals.iva)]);
      rows.push(["", "", "", "", "TOTAL c/IVA:",         Math.round(totals.totalIva)]);
    }

    // Cuotas
    if (p.cuotas?.length) {
      rows.push([]);
      rows.push(["CUOTAS", "Descripción", "Monto", "Fecha", "Pagado", "", ""]);
      const baseTotal = p.iva !== false ? totals.totalIva : totals.totalConDesc;
      p.cuotas.forEach((c, i) => {
        const monto = c.tipo === "pct"
          ? Math.round(baseTotal * (c.monto || 0) / 100)
          : Math.round(c.monto || 0);
        rows.push([
          `Cuota ${i+1}`, c.desc || "", monto, c.fecha || "", c.pagado ? "✓ Pagado" : "Pendiente",
        ]);
      });
    }

    rows.push([]);
    rows.push([]);
  });

  return rows;
}

function generaResumenContable(proyectos) {
  // Resumen ejecutivo para el contador — una fila per progetto
  const rows = [
    ["N° Folio","Cliente","Descripción","Fecha","Estado","Costos Directos","CI+GF+Imp","Utilidad","Descuento","Total s/IVA","IVA 19%","Total c/IVA","Cuotas Pendientes","Cuotas Pagadas","Margen %"],
  ];
  proyectos.forEach(p => {
    const totals = calcTotals(p.partidas||[], p.pct||{}, p.descuento);
    const folio  = p.id?.slice(-6).toUpperCase() || "——";
    const baseTotal = p.iva !== false ? totals.totalIva : totals.totalConDesc;
    const cuotasPagadas = (p.cuotas||[]).filter(c=>c.pagado).reduce((s,c) => {
      return s + (c.tipo==="pct" ? baseTotal*(c.monto||0)/100 : (c.monto||0));
    }, 0);
    const cuotasPendientes = baseTotal - cuotasPagadas;
    const margen = totals.cd > 0 ? ((totals.util / totals.cd) * 100).toFixed(1) : "0.0";
    rows.push([
      folio,
      p.info?.cliente || "",
      p.info?.descripcion || "",
      p.info?.fecha || "",
      p.estado || "Borrador",
      Math.round(totals.cd),
      Math.round(totals.ci + totals.gf + totals.imprevistos),
      Math.round(totals.util),
      Math.round(totals.descuentoAmt),
      Math.round(totals.totalConDesc),
      p.iva !== false ? Math.round(totals.iva) : 0,
      Math.round(p.iva !== false ? totals.totalIva : totals.totalConDesc),
      Math.round(cuotasPendientes),
      Math.round(cuotasPagadas),
      margen + "%",
    ]);
  });

  // Totali finali
  const totR = proyectos.reduce((acc, p) => {
    const t = calcTotals(p.partidas||[], p.pct||{}, p.descuento);
    const base = p.iva !== false ? t.totalIva : t.totalConDesc;
    const pagado = (p.cuotas||[]).filter(c=>c.pagado).reduce((s,c) => s+(c.tipo==="pct"?base*(c.monto||0)/100:(c.monto||0)),0);
    return {
      cd: acc.cd + t.cd,
      overhead: acc.overhead + t.ci + t.gf + t.imprevistos,
      util: acc.util + t.util,
      desc: acc.desc + t.descuentoAmt,
      sinIva: acc.sinIva + t.totalConDesc,
      iva: acc.iva + (p.iva!==false ? t.iva : 0),
      conIva: acc.conIva + (p.iva!==false ? t.totalIva : t.totalConDesc),
      pendiente: acc.pendiente + base - pagado,
      pagado: acc.pagado + pagado,
    };
  }, { cd:0, overhead:0, util:0, desc:0, sinIva:0, iva:0, conIva:0, pendiente:0, pagado:0 });

  rows.push([]);
  rows.push([
    "TOTALES", "", "", "", `${proyectos.length} proyectos`,
    Math.round(totR.cd), Math.round(totR.overhead), Math.round(totR.util),
    Math.round(totR.desc), Math.round(totR.sinIva), Math.round(totR.iva),
    Math.round(totR.conIva), Math.round(totR.pendiente), Math.round(totR.pagado), "",
  ]);

  return rows;
}

// ── Componente principale ─────────────────────────────────────────────────────

export default function TabExportContable({ proyectos, workspace, plan, onPaywall }) {

  const isEmpresa = workspace?.plan === "empresa";

  const [selectedIds,   setSelectedIds]   = useState(new Set());
  const [selectAll,     setSelectAll]     = useState(true);
  const [filterEstado,  setFilterEstado]  = useState("Todos");
  const [fechaDesde,    setFechaDesde]    = useState("");
  const [fechaHasta,    setFechaHasta]    = useState("");
  const [previewFormat, setPreviewFormat] = useState(null);
  const [previewRows,   setPreviewRows]   = useState([]);

  const ESTADOS = ["Todos","Borrador","Enviado","Aceptado","Activo","Pausado","Finalizado","Rechazado"];

  const filteredProyectos = useMemo(() => {
    let list = proyectos || [];
    if (filterEstado !== "Todos") list = list.filter(p => p.estado === filterEstado);
    if (fechaDesde) list = list.filter(p => (p.info?.fecha || "") >= fechaDesde);
    if (fechaHasta) list = list.filter(p => (p.info?.fecha || "") <= fechaHasta);
    return list;
  }, [proyectos, filterEstado, fechaDesde, fechaHasta]);

  const selectedProyectos = useMemo(() => {
    if (selectAll) return filteredProyectos;
    return filteredProyectos.filter(p => selectedIds.has(p.id));
  }, [filteredProyectos, selectAll, selectedIds]);

  const toggleId = (id) => {
    setSelectAll(false);
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    setSelectAll(v => !v);
    setSelectedIds(new Set());
  };

  // Totali aggregati dei progetti selezionati
  const aggTotals = useMemo(() => {
    return selectedProyectos.reduce((acc, p) => {
      const t = calcTotals(p.partidas||[], p.pct||{}, p.descuento);
      const base = p.iva !== false ? t.totalIva : t.totalConDesc;
      const pagado = (p.cuotas||[]).filter(c=>c.pagado).reduce((s,c)=>s+(c.tipo==="pct"?base*(c.monto||0)/100:(c.monto||0)),0);
      return {
        cd:        acc.cd + t.cd,
        util:      acc.util + t.util,
        sinIva:    acc.sinIva + t.totalConDesc,
        ivaAmt:    acc.ivaAmt + (p.iva!==false?t.iva:0),
        conIva:    acc.conIva + (p.iva!==false?t.totalIva:t.totalConDesc),
        pagado:    acc.pagado + pagado,
        pendiente: acc.pendiente + base - pagado,
      };
    }, { cd:0, util:0, sinIva:0, ivaAmt:0, conIva:0, pagado:0, pendiente:0 });
  }, [selectedProyectos]);

  const FORMATS = [
    {
      id: "bsale",
      label: "Bsale",
      icon: "🟦",
      desc: "Formato CSV compatible con importación directa en Bsale",
      ext: "csv",
      color: "#2b6cb0",
      bg: "#ebf8ff",
    },
    {
      id: "defontana",
      label: "Defontana",
      icon: "🟩",
      desc: "Formato CSV para importar en Defontana ERP",
      ext: "csv",
      color: "#276749",
      bg: "#f0fff4",
    },
    {
      id: "excel",
      label: "Excel / Google Sheets",
      icon: "📊",
      desc: "Excel detallado por proyecto con totales y cuotas",
      ext: "xlsx",
      color: "#553c9a",
      bg: "#faf5ff",
    },
    {
      id: "resumen",
      label: "Resumen Contable",
      icon: "📋",
      desc: "Una fila por proyecto — ideal para el contador",
      ext: "xlsx",
      color: "#c05621",
      bg: "#fffbeb",
    },
  ];

  const handleExport = (formatId) => {
    if (!isEmpresa) { onPaywall?.("exportContable"); return; }
    if (selectedProyectos.length === 0) return;

    const fecha = new Date().toISOString().slice(0,10);
    const wsName = (workspace?.name || "ObraNova").replace(/\s/g,"_");

    let rows, filename;
    switch (formatId) {
      case "bsale":
        rows = generaBsale(selectedProyectos, workspace);
        filename = `Bsale_${wsName}_${fecha}.csv`;
        downloadCsv(rows, filename);
        break;
      case "defontana":
        rows = generaDefontana(selectedProyectos, workspace);
        filename = `Defontana_${wsName}_${fecha}.csv`;
        downloadCsv(rows, filename);
        break;
      case "excel":
        rows = generaExcelGenerico(selectedProyectos, workspace);
        filename = `ObraNova_Export_${wsName}_${fecha}.xlsx`;
        downloadExcel(rows, filename);
        break;
      case "resumen":
        rows = generaResumenContable(selectedProyectos);
        filename = `Resumen_Contable_${wsName}_${fecha}.xlsx`;
        downloadExcel(rows, filename);
        break;
    }
  };

  const handlePreview = (formatId) => {
    if (selectedProyectos.length === 0) return;
    let rows;
    switch (formatId) {
      case "bsale":     rows = generaBsale(selectedProyectos, workspace); break;
      case "defontana": rows = generaDefontana(selectedProyectos, workspace); break;
      case "excel":     rows = generaExcelGenerico(selectedProyectos, workspace); break;
      case "resumen":   rows = generaResumenContable(selectedProyectos); break;
      default:          rows = [];
    }
    setPreviewFormat(formatId);
    setPreviewRows(rows);
  };

  // ── Paywall per Free/Pro ───────────────────────────────────────────────────
  if (!isEmpresa) {
    return (
      <div style={{ padding: 24, maxWidth: 600, margin: "0 auto" }}>
        <div style={{ background: "linear-gradient(135deg,#553c9a,#2b6cb0)", borderRadius: 16, padding: 32, textAlign: "center", color: "white" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>Export Contable</div>
          <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 20, lineHeight: 1.6 }}>
            Exporta tus presupuestos en formato Bsale, Defontana o Excel para tu contador.
            Disponible en el plan Empresa.
          </div>
          <button
            onClick={() => onPaywall?.("exportContable")}
            style={{ background: "white", color: "#553c9a", border: "none", borderRadius: 10, padding: "12px 28px", fontWeight: 800, fontSize: 14, cursor: "pointer" }}
          >
            🚀 Activar Plan Empresa
          </button>
        </div>
        <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {FORMATS.map(f => (
            <div key={f.id} style={{ background: f.bg, border: `1.5px solid ${f.color}33`, borderRadius: 12, padding: "14px 16px", opacity: 0.7 }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: f.color }}>{f.label}</div>
              <div style={{ fontSize: 11, color: "#718096", marginTop: 2 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── UI principale ─────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "16px 20px", maxWidth: 900, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 900, fontSize: 20, color: "#1a365d", marginBottom: 4 }}>
          📊 Export Contable
        </div>
        <div style={{ fontSize: 13, color: "#718096" }}>
          Exporta presupuestos en formato compatible con tu sistema contable
        </div>
      </div>

      {/* Filtro + selezione */}
      <div style={{ background: "white", borderRadius: 12, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,.07)", marginBottom: 16 }}>
        {/* Riga 1: titolo + estado + seleccionar todos */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#1a365d" }}>
            Seleccionar proyectos
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <select
              value={filterEstado}
              onChange={e => setFilterEstado(e.target.value)}
              style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #e2e8f0", fontSize: 12, color: "#2d3748", background: "white" }}
            >
              {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            <button onClick={toggleAll}
              style={{ padding: "5px 12px", borderRadius: 7, border: "1.5px solid #2b6cb0", background: selectAll ? "#2b6cb0" : "white", color: selectAll ? "white" : "#2b6cb0", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              {selectAll ? "✓ Todos" : "Seleccionar todos"}
            </button>
          </div>
        </div>
        {/* Riga 2: filtri data */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", padding: "8px 10px", background: "#f7fafc", borderRadius: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#718096" }}>📅 Período:</span>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 11, color: "#718096" }}>Desde</span>
            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
              style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12, color: "#2d3748", background: "white" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 11, color: "#718096" }}>Hasta</span>
            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
              style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #e2e8f0", fontSize: 12, color: "#2d3748", background: "white" }} />
          </div>
          {(fechaDesde || fechaHasta || filterEstado !== "Todos") && (
            <button onClick={() => { setFechaDesde(""); setFechaHasta(""); setFilterEstado("Todos"); }}
              style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #fc8181", background: "#fff5f5", color: "#c53030", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              ✕ Limpiar filtros
            </button>
          )}
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#a0aec0" }}>
            {filteredProyectos.length} proyecto{filteredProyectos.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Lista progetti ─────────────────────────────────────────────── */}
        <div style={{ maxHeight: 240, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: 8 }}>
          {filteredProyectos.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "#a0aec0", fontSize: 13 }}>
              Sin proyectos para el filtro seleccionado
            </div>
          ) : filteredProyectos.map(p => {
            const totals = calcTotals(p.partidas||[], p.pct||{}, p.descuento);
            const total = p.iva !== false ? totals.totalIva : totals.totalConDesc;
            const checked = selectAll || selectedIds.has(p.id);
            return (
              <div
                key={p.id}
                onClick={() => toggleId(p.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", cursor: "pointer",
                  borderBottom: "1px solid #f7fafc",
                  background: checked ? "#f0f7ff" : "white",
                  transition: "background .15s",
                }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  border: `2px solid ${checked ? "#2b6cb0" : "#cbd5e0"}`,
                  background: checked ? "#2b6cb0" : "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {checked && <span style={{ color: "white", fontSize: 10, fontWeight: 900 }}>✓</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#2d3748", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.info?.cliente || "Sin nombre"} — {p.info?.descripcion?.slice(0,40) || "—"}
                  </div>
                  <div style={{ fontSize: 11, color: "#718096", display: "flex", gap: 6, alignItems: "center", marginTop: 2, flexWrap: "wrap" }}>
                    <span>{p.info?.fecha || "——"}</span>
                    <span>·</span>
                    <span>{p.estado || "Borrador"}</span>
                    <span>·</span>
                    <span>{(p.partidas||[]).length} partidas</span>
                    <PagoBadge cuotas={p.cuotas} totale={total} />
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#276749", flexShrink: 0 }}>
                  {fmt(total)}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 8, fontSize: 11, color: "#718096" }}>
          {selectedProyectos.length} proyecto{selectedProyectos.length !== 1 ? "s" : ""} seleccionado{selectedProyectos.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Totali aggregati */}
      {selectedProyectos.length > 0 && (
        <div style={{ background: "linear-gradient(135deg,#1a365d,#2b6cb0)", borderRadius: 12, padding: 16, marginBottom: 16, color: "white" }}>
          <div style={{ fontWeight: 800, fontSize: 12, marginBottom: 10, letterSpacing: .5, opacity: .8 }}>
            RESUMEN SELECCIÓN — {selectedProyectos.length} PROYECTO{selectedProyectos.length!==1?"S":""}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 12 }}>
            {[
              { label: "Costos directos", value: aggTotals.cd },
              { label: "Utilidad",        value: aggTotals.util },
              { label: "Total s/IVA",     value: aggTotals.sinIva },
              { label: "IVA (19%)",       value: aggTotals.ivaAmt },
              { label: "Total c/IVA",     value: aggTotals.conIva },
              { label: "Cobrado",         value: aggTotals.pagado },
              { label: "Por cobrar",      value: aggTotals.pendiente },
            ].map(item => (
              <div key={item.label} style={{ background: "rgba(255,255,255,.1)", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, opacity: .7, marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontSize: 14, fontWeight: 800 }}>{fmt(item.value)}</div>
              </div>
            ))}
          </div>
          <KpiChart aggTotals={aggTotals} />
        </div>
      )}

      {/* Totales por categoría */}
      {selectedProyectos.length > 0 && (
        <CatTotals proyectos={selectedProyectos} />
      )}

      {/* Formati export */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12, marginBottom: 16 }}>
        {FORMATS.map(f => (
          <div key={f.id} style={{ background: f.bg, border: `1.5px solid ${f.color}44`, borderRadius: 12, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>{f.icon}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: f.color }}>{f.label}</div>
                <div style={{ fontSize: 10, color: "#718096" }}>.{f.ext}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#4a5568", marginBottom: 12, lineHeight: 1.5 }}>{f.desc}</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => handlePreview(f.id)}
                disabled={selectedProyectos.length === 0}
                style={{
                  flex: 1, padding: "7px 0", borderRadius: 7,
                  border: `1.5px solid ${f.color}`,
                  background: "white", color: f.color,
                  fontSize: 11, fontWeight: 700, cursor: selectedProyectos.length===0 ? "not-allowed" : "pointer",
                  opacity: selectedProyectos.length===0 ? 0.5 : 1,
                }}
              >
                👁️ Preview
              </button>
              <button
                onClick={() => handleExport(f.id)}
                disabled={selectedProyectos.length === 0}
                style={{
                  flex: 1, padding: "7px 0", borderRadius: 7,
                  border: "none", background: f.color, color: "white",
                  fontSize: 11, fontWeight: 700, cursor: selectedProyectos.length===0 ? "not-allowed" : "pointer",
                  opacity: selectedProyectos.length===0 ? 0.5 : 1,
                }}
              >
                ⬇️ Exportar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview tabella ─────────────────────────────────────────────────── */}
      {previewFormat && previewRows.length > 0 && (
        <div style={{ background: "white", borderRadius: 12, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: "#1a365d" }}>
              👁️ Preview — {FORMATS.find(f=>f.id===previewFormat)?.label}
              <span style={{ marginLeft: 8, fontSize: 11, color: "#718096", fontWeight: 400 }}>
                ({previewRows.length} filas)
              </span>
            </div>
            <button onClick={() => setPreviewFormat(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#a0aec0", fontSize: 18 }}>×</button>
          </div>
          <div style={{ overflowX: "auto", maxHeight: 360, overflowY: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 11, width: "100%", minWidth: 600 }}>
              <tbody>
                {previewRows.slice(0, 50).map((row, ri) => (
                  <tr key={ri} style={{ background: ri === 0 ? "#f0f7ff" : ri % 2 === 0 ? "#fafafa" : "white" }}>
                    {row.map((cell, ci) => (
                      <td key={ci} style={{
                        padding: "5px 8px", border: "1px solid #e2e8f0",
                        fontWeight: ri === 0 ? 700 : 400,
                        color: ri === 0 ? "#1a365d" : "#2d3748",
                        whiteSpace: "nowrap", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis",
                      }}>
                        {typeof cell === "number" ? cell.toLocaleString("es-CL") : String(cell ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
                {previewRows.length > 50 && (
                  <tr>
                    <td colSpan={20} style={{ padding: "8px", textAlign: "center", color: "#a0aec0", fontSize: 11 }}>
                      ... y {previewRows.length - 50} filas más (se exportan todas)
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => handleExport(previewFormat)}
              style={{ padding: "9px 20px", background: FORMATS.find(f=>f.id===previewFormat)?.color || "#2b6cb0", color: "white", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer" }}
            >
              ⬇️ Descargar {FORMATS.find(f=>f.id===previewFormat)?.label}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
