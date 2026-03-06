// ─── components/tabs/TabSII.jsx ──────────────────────────────────────────────
// Integración con el SII (Servicio de Impuestos Internos) de Chile.
// Genera XML para Documento Tributario Electrónico (DTE) a partir de
// los presupuestos aceptados, muestra instrucciones y guarda historial.

import { useState, useEffect } from "react";
import { calcTotals } from "../../utils/helpers";

// ── Generador XML DTE básico (borrador) ───────────────────────────────────────
function generarXMLDTE({ tipo, folio, rutReceptor, giroReceptor, proyecto, totals, iva }) {
  const fecha = new Date().toISOString().slice(0, 10);
  const montoNeto = Math.round(totals.total);
  const montoIVA  = iva ? Math.round(totals.iva) : 0;
  const montoTotal = iva ? Math.round(totals.totalIva) : montoNeto;

  const partidas = (proyecto.partidas || [])
    .filter(p => p.cant > 0 && p.pu > 0)
    .map((p, i) => `
    <Detalle>
      <NroLinDet>${i + 1}</NroLinDet>
      <NmbItem>${p.nombre || "Item"}</NmbItem>
      <QtyItem>${p.cant}</QtyItem>
      <UnmdItem>${p.unidad || "un"}</UnmdItem>
      <PrcItem>${Math.round(p.pu)}</PrcItem>
      <MontoItem>${Math.round(p.cant * p.pu)}</MontoItem>
    </Detalle>`).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<DTE version="1.0">
  <Documento ID="DTE-${tipo}-${folio}">
    <Encabezado>
      <IdDoc>
        <TipoDTE>${tipo}</TipoDTE>
        <Folio>${folio}</Folio>
        <FchEmis>${fecha}</FchEmis>
        <IndMntNeto>2</IndMntNeto>
        <FmaPago>1</FmaPago>
      </IdDoc>
      <Emisor>
        <RUTEmisor>00000000-0</RUTEmisor>
        <RznSoc>Tu Empresa SpA</RznSoc>
        <GiroEmis>Construcción</GiroEmis>
        <Acteco>452010</Acteco>
      </Emisor>
      <Receptor>
        <RUTRecep>${rutReceptor || "00000000-0"}</RUTRecep>
        <RznSocRecep>${proyecto.info?.cliente || "Cliente"}</RznSocRecep>
        <GiroRecep>${giroReceptor || "Particular"}</GiroRecep>
        <DirRecep>${proyecto.info?.direccion || ""}</DirRecep>
        <CiudadRecep>${proyecto.info?.ciudad || ""}</CiudadRecep>
      </Receptor>
      <Totales>
        <MntNeto>${montoNeto}</MntNeto>
        <TasaIVA>19</TasaIVA>
        <IVA>${montoIVA}</IVA>
        <MntTotal>${montoTotal}</MntTotal>
      </Totales>
    </Encabezado>
    <Detalle>
${partidas}
    </Detalle>
  </Documento>
</DTE>`;
}

// ── Tipos de documento SII ─────────────────────────────────────────────────────
const TIPOS_DTE = [
  { codigo: "33", nombre: "Factura Electrónica" },
  { codigo: "39", nombre: "Boleta Electrónica" },
  { codigo: "61", nombre: "Nota de Crédito" },
  { codigo: "56", nombre: "Nota de Débito" },
];

// ── Componente principal ───────────────────────────────────────────────────────
export default function TabSII({ proyectos, workspaceId, t, onToast }) {
  const [historial,     setHistorial]     = useState([]);
  const [loadingHist,   setLoadingHist]   = useState(true);
  const [modal,         setModal]         = useState(null); // { proyecto }
  const [tipo,          setTipo]          = useState("33");
  const [folio,         setFolio]         = useState("1");
  const [rutReceptor,   setRutReceptor]   = useState("");
  const [giroReceptor,  setGiroReceptor]  = useState("");
  const [xmlGenerado,   setXmlGenerado]   = useState("");
  const [guardando,     setGuardando]     = useState(false);

  const aceptados = proyectos.filter(p => p.estado === "Aceptado");

  // ── Carica storico DTE da Firestore ──────────────────────────────────────
  useEffect(() => {
    if (!workspaceId) return;
    (async () => {
      try {
        const { collection, query, where, orderBy, getDocs } = await import("firebase/firestore");
        const { db } = await import("../../lib/firebase");
        const q = query(
          collection(db, "dte"),
          where("workspaceId", "==", workspaceId),
          orderBy("creadoAt", "desc")
        );
        const snap = await getDocs(q);
        setHistorial(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Error cargando historial DTE:", e);
      } finally {
        setLoadingHist(false);
      }
    })();
  }, [workspaceId]);

  // ── Genera XML ────────────────────────────────────────────────────────────
  const handleGenerar = () => {
    if (!modal) return;
    const totals = calcTotals(modal.partidas || [], modal.pct || {});
    const xml = generarXMLDTE({ tipo, folio, rutReceptor, giroReceptor, proyecto: modal, totals, iva: modal.iva });
    setXmlGenerado(xml);
  };

  // ── Descarga XML ──────────────────────────────────────────────────────────
  const handleDescargar = () => {
    const blob = new Blob([xmlGenerado], { type: "application/xml" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `DTE-${tipo}-${folio}-${modal?.info?.cliente?.replace(/\s+/g, "_") || "cliente"}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Guarda DTE en Firestore ───────────────────────────────────────────────
  const handleGuardar = async () => {
    if (!modal || !xmlGenerado || !workspaceId) return;
    setGuardando(true);
    try {
      const { collection, addDoc } = await import("firebase/firestore");
      const { db } = await import("../../lib/firebase");
      const nuevo = {
        workspaceId,
        proyectoId:  modal.id,
        cliente:     modal.info?.cliente || "—",
        tipo,
        folio,
        rutReceptor,
        creadoAt:    new Date().toISOString(),
        xml:         xmlGenerado,
      };
      const ref = await addDoc(collection(db, "dte"), nuevo);
      setHistorial(h => [{ id: ref.id, ...nuevo }, ...h]);
      onToast(t.siiDTEGuardado || "✅ DTE guardado");
      setModal(null);
      setXmlGenerado("");
    } catch (e) {
      onToast("❌ Error guardando DTE");
    } finally {
      setGuardando(false);
    }
  };

  const fmt = (n) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n || 0);

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:14 }}>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#1a365d,#2d3748)",borderRadius:12,padding:"18px 20px",color:"white" }}>
        <div style={{ fontSize:18,fontWeight:800,marginBottom:3 }}>🇨🇱 {t.siiTitulo || "Documentos Tributarios Electrónicos (DTE)"}</div>
        <div style={{ color:"#a0aec0",fontSize:12 }}>{t.siiDesc || "Genera XML para el SII a partir de tus presupuestos aceptados."}</div>
      </div>

      {/* Lista presupuestos aceptados */}
      <div style={{ background:"white",borderRadius:12,padding:18,boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
        <div style={{ fontWeight:700,fontSize:14,color:"#1a365d",marginBottom:12 }}>
          📋 {t.aceptados || "Presupuestos Aceptados"} ({aceptados.length})
        </div>

        {aceptados.length === 0 ? (
          <div style={{ textAlign:"center",padding:"40px 0",color:"#a0aec0" }}>
            <div style={{ fontSize:36,marginBottom:8 }}>📄</div>
            <div>{t.siiSinAceptados || "No hay presupuestos aceptados para generar DTE."}</div>
          </div>
        ) : (
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {aceptados.map(p => {
              const totals = calcTotals(p.partidas || [], p.pct || {});
              const total  = p.iva ? totals.totalIva : totals.total;
              return (
                <div key={p.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
                  padding:"12px 16px",background:"#f7fafc",borderRadius:10,border:"1px solid #e2e8f0",flexWrap:"wrap",gap:8 }}>
                  <div>
                    <div style={{ fontWeight:700,fontSize:14,color:"#1a365d" }}>{p.info?.cliente || "—"}</div>
                    <div style={{ fontSize:11,color:"#718096",marginTop:2 }}>{p.info?.descripcion?.slice(0,50) || "—"}</div>
                  </div>
                  <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                    <div style={{ fontWeight:800,fontSize:15,color:"#276749" }}>{fmt(total)}</div>
                    <button onClick={() => { setModal(p); setXmlGenerado(""); }}
                      style={{ padding:"7px 14px",background:"#1a365d",color:"white",border:"none",
                        borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12 }}>
                      🇨🇱 {t.siiGenerarDTE || "Generar DTE"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Istruzioni */}
      <div style={{ background:"#ebf8ff",borderRadius:12,padding:18,border:"1px solid #bee3f8" }}>
        <div style={{ fontWeight:700,fontSize:14,color:"#2b6cb0",marginBottom:10 }}>
          📋 {t.siiInstrucciones || "Pasos para cargar en el SII"}
        </div>
        {[t.siiPaso1, t.siiPaso2, t.siiPaso3, t.siiPaso4].filter(Boolean).map((paso, i) => (
          <div key={i} style={{ fontSize:13,color:"#2d3748",marginBottom:6,display:"flex",gap:8 }}>
            <span style={{ color:"#2b6cb0",fontWeight:700,flexShrink:0 }}>{i+1}.</span>
            <span>{paso.replace(/^\d+\.\s*/, "")}</span>
          </div>
        ))}
        <a href="https://mipyme.sii.cl" target="_blank" rel="noreferrer"
          style={{ display:"inline-block",marginTop:10,padding:"8px 16px",background:"#2b6cb0",
            color:"white",borderRadius:8,fontWeight:700,fontSize:13,textDecoration:"none" }}>
          🔗 {t.siiPortal || "Ir al portal SII"}
        </a>
      </div>

      {/* Historial DTE */}
      <div style={{ background:"white",borderRadius:12,padding:18,boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
        <div style={{ fontWeight:700,fontSize:14,color:"#1a365d",marginBottom:12 }}>
          🗂️ {t.siiStorico || "Historial de DTE"}
        </div>
        {loadingHist ? (
          <div style={{ color:"#a0aec0",fontSize:12,textAlign:"center",padding:"20px 0" }}>Cargando...</div>
        ) : historial.length === 0 ? (
          <div style={{ color:"#a0aec0",fontSize:12,textAlign:"center",padding:"20px 0" }}>Sin DTE generados aún.</div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12 }}>
              <thead>
                <tr style={{ background:"#1a365d",color:"white" }}>
                  {["Tipo","Folio","Cliente","RUT","Fecha","XML"].map(h => (
                    <th key={h} style={{ padding:"8px 10px",textAlign:"left",fontWeight:600,whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historial.map((d, i) => (
                  <tr key={d.id} style={{ background: i%2===0?"#f7fafc":"white" }}>
                    <td style={{ padding:"8px 10px",color:"#553c9a",fontWeight:700 }}>DTE-{d.tipo}</td>
                    <td style={{ padding:"8px 10px" }}>{d.folio}</td>
                    <td style={{ padding:"8px 10px",color:"#1a365d",fontWeight:600 }}>{d.cliente}</td>
                    <td style={{ padding:"8px 10px",color:"#718096" }}>{d.rutReceptor || "—"}</td>
                    <td style={{ padding:"8px 10px",color:"#718096" }}>{d.creadoAt?.slice(0,10)}</td>
                    <td style={{ padding:"8px 10px" }}>
                      {d.xml && (
                        <button onClick={() => {
                          const blob = new Blob([d.xml], { type:"application/xml" });
                          const a = document.createElement("a");
                          a.href = URL.createObjectURL(blob);
                          a.download = `DTE-${d.tipo}-${d.folio}.xml`;
                          a.click();
                        }}
                          style={{ padding:"3px 9px",background:"#ebf8ff",border:"1px solid #bee3f8",
                            borderRadius:6,cursor:"pointer",color:"#2b6cb0",fontSize:11,fontWeight:600 }}>
                          ⬇ XML
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal genera DTE */}
      {modal && (
        <div role="dialog" aria-modal="true"
          onClick={e => e.target===e.currentTarget && setModal(null)}
          style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.65)",zIndex:3000,
            display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
          <div style={{ background:"white",borderRadius:16,padding:28,width:"100%",maxWidth:520,
            maxHeight:"92vh",overflow:"auto",boxShadow:"0 30px 80px rgba(0,0,0,.4)" }}>

            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
              <div style={{ fontSize:17,fontWeight:800,color:"#1a365d" }}>
                🇨🇱 {t.siiGenerarDTE} — {modal.info?.cliente}
              </div>
              <button onClick={() => setModal(null)}
                style={{ background:"#2d3748",border:"none",borderRadius:8,cursor:"pointer",
                  padding:"5px 12px",color:"white",fontWeight:700 }}>✕</button>
            </div>

            <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
              {/* Tipo DTE */}
              <div>
                <label style={{ fontSize:12,fontWeight:700,color:"#4a5568",display:"block",marginBottom:4 }}>
                  {t.siiTipoDoc || "Tipo documento"}
                </label>
                <select value={tipo} onChange={e => setTipo(e.target.value)}
                  style={{ width:"100%",padding:"9px 12px",border:"2px solid #e2e8f0",borderRadius:8,fontSize:13,color:"#1a365d",background:"white" }}>
                  {TIPOS_DTE.map(td => (
                    <option key={td.codigo} value={td.codigo}>{td.codigo} — {td.nombre}</option>
                  ))}
                </select>
              </div>

              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                {/* Folio */}
                <div>
                  <label style={{ fontSize:12,fontWeight:700,color:"#4a5568",display:"block",marginBottom:4 }}>
                    {t.siiFolio || "Folio"}
                  </label>
                  <input type="number" value={folio} onChange={e => setFolio(e.target.value)} min={1}
                    style={{ width:"100%",padding:"9px 12px",border:"2px solid #e2e8f0",borderRadius:8,fontSize:13,color:"#1a365d" }} />
                </div>
                {/* RUT Receptor */}
                <div>
                  <label style={{ fontSize:12,fontWeight:700,color:"#4a5568",display:"block",marginBottom:4 }}>
                    {t.siiRutReceptor || "RUT receptor"}
                  </label>
                  <input value={rutReceptor} onChange={e => setRutReceptor(e.target.value)}
                    placeholder="12345678-9"
                    style={{ width:"100%",padding:"9px 12px",border:"2px solid #e2e8f0",borderRadius:8,fontSize:13,color:"#1a365d" }} />
                </div>
              </div>

              {/* Giro */}
              <div>
                <label style={{ fontSize:12,fontWeight:700,color:"#4a5568",display:"block",marginBottom:4 }}>
                  {t.siiGiro || "Giro receptor"}
                </label>
                <input value={giroReceptor} onChange={e => setGiroReceptor(e.target.value)}
                  placeholder="Particular / Construcción..."
                  style={{ width:"100%",padding:"9px 12px",border:"2px solid #e2e8f0",borderRadius:8,fontSize:13,color:"#1a365d" }} />
              </div>

              {/* Bottoni */}
              <div style={{ display:"flex",gap:8,marginTop:4 }}>
                <button onClick={handleGenerar}
                  style={{ flex:1,padding:"11px",background:"#1a365d",color:"white",border:"none",
                    borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:14 }}>
                  ⚙️ {t.siiGenerarDTE || "Generar XML"}
                </button>
              </div>

              {/* XML generato */}
              {xmlGenerado && (
                <div style={{ background:"#f0fff4",borderRadius:10,padding:14,border:"1px solid #9ae6b4" }}>
                  <div style={{ fontSize:13,fontWeight:700,color:"#276749",marginBottom:10 }}>
                    ✅ {t.siiXMLGenerado || "XML generado"}
                  </div>
                  <pre style={{ fontSize:9,color:"#2d3748",overflow:"auto",maxHeight:180,
                    background:"#f7fafc",borderRadius:6,padding:8,margin:"0 0 10px" }}>
                    {xmlGenerado.slice(0, 600)}...
                  </pre>
                  <div style={{ display:"flex",gap:8 }}>
                    <button onClick={handleDescargar}
                      style={{ flex:1,padding:"9px",background:"#276749",color:"white",border:"none",
                        borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:13 }}>
                      ⬇ {t.siiDescargarXML || "Descargar XML"}
                    </button>
                    <button onClick={handleGuardar} disabled={guardando}
                      style={{ flex:1,padding:"9px",background:"#2b6cb0",color:"white",border:"none",
                        borderRadius:9,cursor:guardando?"wait":"pointer",fontWeight:700,fontSize:13 }}>
                      💾 {guardando ? "..." : (t.siiGuardar || "Guardar DTE")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
