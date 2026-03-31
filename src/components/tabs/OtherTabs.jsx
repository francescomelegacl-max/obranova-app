// ─── components/tabs/OtherTabs.jsx ───────────────────────────────────────────
import { useMemo, useState, useEffect, useRef } from "react";
import { PieChart } from "../UI";
import { usePDFSettings } from "./TabSettings";
import { fmt, fmtPct, calcTotals, calcProjectTotal } from "../../utils/helpers";
import { CAT_COLORS, EMPRESA, ESTADO_COLORS, ESTADO_BG } from "../../utils/constants";
import { LOGO_URL } from "../../utils/logo";

const CC = CAT_COLORS;

export function TabResumen({ partidas, pct, cats, iva, t, descuento = { tipo: "pct", valor: 0, descripcion: "" }, setDescuento, aiRenders = [], plan = "free", onShowBenchmark }) {
  const totals = useMemo(() => calcTotals(partidas, pct, descuento), [partidas, pct, descuento]);
  const { cd, ci, gf, imprevistos: imprev, sub, util, total, descuentoAmt, totalConDesc, iva: ivaAmt, totalIva } = totals;
  const margen = totalConDesc > 0 ? (util / totalConDesc) * 100 : 0;

  // Visibilità righe desglose — persistita in localStorage
  const [hidden, setHidden] = useState(() => {
    try { return JSON.parse(localStorage.getItem("on_desglose_hidden") || "{}"); } catch { return {}; }
  });
  const toggleRow = (key) => setHidden(prev => {
    const next = { ...prev, [key]: !prev[key] };
    localStorage.setItem("on_desglose_hidden", JSON.stringify(next));
    return next;
  });

  const pieData = useMemo(() => cats
    .map((cat, i) => ({
      label: cat, color: CAT_COLORS[i % CAT_COLORS.length],
      value: partidas.filter(p => p.cat === cat).reduce((s, p) => s + p.cant * p.pu, 0),
    }))
    .filter(d => d.value > 0), [cats, partidas]);

  const hasDesc = descuentoAmt > 0;

  const rows = [
    { key: "cd",     l: t.costosDirectos,                           v: cd,    c: "#2b6cb0" },
    { key: "ci",     l: `${t.costosIndirectos} (${pct.ci}%)`,       v: ci,    c: "#276749" },
    { key: "gf",     l: `${t.gastosFijos} (${pct.gf}%)`,            v: gf,    c: "#c05621" },
    { key: "imprev", l: `${t.imprevistos} (${pct.imprevistos}%)`,   v: imprev,c: "#b7791f" },
    { key: "sub",    l: t.subtotal || "Subtotal",                   v: sub,   c: "#2d3748", bold: true },
    { key: "util",   l: `${t.utilidad} (${pct.utilidad}%)`,         v: util,  c: "#553c9a" },
    { key: "total",  l: "Total s/descuento",                        v: total, c: "#1a365d", bold: true },
    ...(hasDesc ? [
      { key: "desc",   l: `Descuento${descuento.tipo === "pct" ? ` (${descuento.valor}% s/neto)` : ""}`, v: -descuentoAmt, c: "#e53e3e" },
      { key: "totalcd",l: "Total c/descuento",                      v: totalConDesc, c: "#1a365d", bold: true, big: true },
    ] : [
      { key: "totalcd",l: t.totalProyecto,                          v: total, c: "#1a365d", bold: true, big: true },
    ]),
  ];

  // Checkbox style
  const cbStyle = (checked) => ({
    width: 14, height: 14, accentColor: "#2b6cb0", cursor: "pointer", margin: 0, flexShrink: 0,
  });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
      {/* Desglose */}
      <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, borderBottom: "2px solid #ebf8ff", paddingBottom: 7 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#1a365d" }}>📊 {t.desglosePresup}</span>
          <button
            onClick={() => {
              const toggleable = rows.filter(r => !r.big);
              const allHidden = toggleable.every(r => hidden[r.key]);
              const next = {};
              if (!allHidden) toggleable.forEach(r => { next[r.key] = true; });
              setHidden(next);
              localStorage.setItem("on_desglose_hidden", JSON.stringify(next));
            }}
            style={{ fontSize: 11, color: "#718096", background: "#f7fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "3px 8px", cursor: "pointer" }}
          >
            {rows.filter(r => !r.big).every(r => hidden[r.key]) ? "Mostrar todo" : "Ocultar detalles"}
          </button>
        </div>
        {rows.map(r => {
          const isHidden = hidden[r.key];
          // TOTAL finale — sempre visibile
          if (r.big) return (
            <div key={r.key} style={{ display: "flex", justifyContent: "space-between", padding: "11px", borderTop: "2px solid #e2e8f0", background: "#ebf8ff", borderRadius: 8, marginTop: 4 }}>
              <span style={{ fontSize: 14, color: r.c, fontWeight: 700 }}>{r.l}</span>
              <span style={{ fontSize: 15, color: r.c, fontWeight: 800 }}>{fmt(r.v)}</span>
            </div>
          );
          // Tutte le altre righe — checkbox toggle
          return (
            <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 6, padding: r.bold ? "7px 3px" : "5px 3px", borderTop: r.bold ? "1px solid #e2e8f0" : "none" }}>
              <input type="checkbox" checked={!isHidden} onChange={() => toggleRow(r.key)} style={cbStyle(!isHidden)} title={isHidden ? "Mostrar" : "Ocultar"} />
              {isHidden
                ? <span style={{ fontSize: 11, color: "#a0aec0", flex: 1 }}>{r.l}</span>
                : <>
                    <span style={{ fontSize: 12, color: r.c, fontWeight: r.bold ? 700 : 400, flex: 1 }}>{r.l}</span>
                    <span style={{ fontSize: 13, color: r.c, fontWeight: r.bold ? 800 : 600 }}>{fmt(r.v)}</span>
                  </>
              }
            </div>
          );
        })}
        {/* IVA — con checkbox */}
        {iva && <>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 3px", borderTop: "1px solid #e2e8f0" }}>
            <input type="checkbox" checked={!hidden.iva} onChange={() => toggleRow("iva")} style={cbStyle(!hidden.iva)} />
            {hidden.iva
              ? <span style={{ fontSize: 11, color: "#a0aec0", flex: 1 }}>IVA 19%</span>
              : <>
                  <span style={{ fontSize: 12, color: "#c05621", flex: 1 }}>IVA 19%</span>
                  <span style={{ fontSize: 13, color: "#c05621", fontWeight: 600 }}>{fmt(ivaAmt)}</span>
                </>
            }
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: 11, background: "#1a365d", borderRadius: 8, marginTop: 4 }}>
            <span style={{ fontSize: 14, color: "white", fontWeight: 800 }}>TOTAL {t.conIVA}</span>
            <span style={{ fontSize: 16, color: "white", fontWeight: 900 }}>{fmt(totalIva)}</span>
          </div>
        </>}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Descuento */}
        {setDescuento && (
          <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d", marginBottom: 12, borderBottom: "2px solid #ebf8ff", paddingBottom: 7 }}>
              🏷️ Descuento
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
              <select value={descuento.tipo} onChange={e => setDescuento({ tipo: e.target.value })}
                style={{ padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#1a365d" }}>
                <option value="pct">Porcentaje (%)</option>
                <option value="fijo">Monto fijo ($)</option>
              </select>
              <input type="number" min="0" step={descuento.tipo === "pct" ? "0.5" : "1000"}
                value={descuento.valor || ""} placeholder={descuento.tipo === "pct" ? "0%" : "$0"}
                onChange={e => setDescuento({ valor: parseFloat(e.target.value) || 0 })}
                style={{ width: 90, padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, textAlign: "right" }} />
              {descuentoAmt > 0 && (
                <span style={{ fontSize: 12, fontWeight: 700, color: "#e53e3e" }}>−{fmt(descuentoAmt)}</span>
              )}
            </div>
            <input type="text" value={descuento.descripcion || ""} placeholder="Descripción del descuento (opcional)"
              onChange={e => setDescuento({ descripcion: e.target.value })}
              style={{ width: "100%", padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, boxSizing: "border-box" }} />
          </div>
        )}

        {/* Análisis margen */}
        <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d", marginBottom: 12, borderBottom: "2px solid #ebf8ff", paddingBottom: 7 }}>
            📈 {t.analisisMargen}
          </div>
          {[
            { l: t.costoNeto,       v: fmt(cd),                c: "#2b6cb0" },
            { l: t.margenPartidas,  v: fmt(util),              c: "#276749" },
            ...(hasDesc ? [{ l: "Descuento",  v: `−${fmt(descuentoAmt)}`, c: "#e53e3e" }] : []),
            { l: t.totalCliente,    v: fmt(iva ? totalIva : totalConDesc), c: "#1a365d" },
            { l: t.margenTotal,     v: fmtPct(margen),         c: margen > 15 ? "#276749" : margen > 8 ? "#c05621" : "#c53030", big: true },
          ].map(r => (
            <div key={r.l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f7fafc" }}>
              <span style={{ fontSize: 12, color: "#718096" }}>{r.l}</span>
              <span style={{ fontSize: r.big ? 18 : 13, color: r.c, fontWeight: r.big ? 900 : 700 }}>{r.v}</span>
            </div>
          ))}
        </div>

        {/* Pie */}
        {pieData.length > 0 && (
          <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d", marginBottom: 12, borderBottom: "2px solid #ebf8ff", paddingBottom: 7 }}>
              🥧 {t.distribucion}
            </div>
            <PieChart data={pieData} size={130} />
          </div>
        )}

        {/* Renders AI del proyecto */}
        {aiRenders && aiRenders.length > 0 && (
          <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d", marginBottom: 12, borderBottom: "2px solid #ebf8ff", paddingBottom: 7 }}>
              🎨 Visualización AI del proyecto
            </div>
            <div style={{ display: "grid", gridTemplateColumns: aiRenders.length === 1 ? "1fr" : "1fr 1fr", gap: 10 }}>
              {aiRenders.filter(r => r.ok !== false && r.imageUrl).slice(0, 4).map((r, i) => (
                <div key={i} style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #e2e8f0" }}>
                  <img src={r.imageUrl} alt={r.label || `Render ${i+1}`} style={{ width: "100%", height: aiRenders.length === 1 ? 220 : 140, objectFit: "cover", display: "block" }} />
                  <div style={{ padding: "5px 8px", background: "#f7fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#1a365d" }}>{r.label || r.roomType || `Render ${i+1}`}</span>
                    <span style={{ fontSize: 9, color: "#a0aec0" }}>Render AI</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 9, color: "#a0aec0", marginTop: 6, textAlign: "center", fontStyle: "italic" }}>
              Visualización generada por inteligencia artificial — el resultado final puede variar
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TabVistaCliente ──────────────────────────────────────────────────────────

export function TabVistaCliente({ info, partidas, pct, cats, catVis = {}, getCatVis, setCatVisKey, iva, estado, currentId, validez, t, onInviaFirma, firme = [], fotos = [], plan = "free", trialEndsAt = null, onTrackPdf, descuento = { tipo: "pct", valor: 0, descripcion: "" }, setDescuento, aiRenders = [], workspaceId, onShowBenchmark }) {
  const pdf = usePDFSettings();
  const isTrialActive = trialEndsAt && new Date(trialEndsAt) > new Date();
  const isPro = plan === "pro" || plan === "empresa" || isTrialActive;
  // Free: sempre logo Obra Nova. Pro/Empresa: logo personalizzato se configurato, altrimenti logo ON
  const logoEffettivo = isPro && pdf.logoUrl ? pdf.logoUrl : LOGO_URL;
  // Header label Free — mostrato nell'intestazione del PDF Free
  const showFreeBranding = !isPro;
  // Filtra solo partidas visibili al cliente (visible !== false + categoria visible)
  const clientPartidas = useMemo(() => {
    return partidas.filter(p => {
      if (p.visible === false) return false;
      if (p.cant * p.pu <= 0) return false;
      const cv = getCatVis(p.cat);
      return cv.visible;
    });
  }, [partidas, catVis]); // eslint-disable-line
  const totals = useMemo(() => calcTotals(clientPartidas, pct, descuento), [clientPartidas, pct, descuento]);
  const { cd, ci, gf, imprevistos: imprev, sub, util, total, descuentoAmt, totalConDesc, iva: ivaAmt, totalIva } = totals;

  const venceDate = info.fecha
    ? new Date(new Date(info.fecha).getTime() + validez * 86400000).toLocaleDateString("es-CL")
    : "—";

  // Visibilità righe desglose financiero
  const [hidVC, setHidVC] = useState(() => {
    try { return JSON.parse(localStorage.getItem("on_desglose_vc_hidden") || "{}"); } catch { return {}; }
  });
  const toggleVC = (key) => setHidVC(prev => {
    const n = { ...prev, [key]: !prev[key] };
    localStorage.setItem("on_desglose_vc_hidden", JSON.stringify(n));
    return n;
  });

  return (
    <div>
      {/* ── Banner scadenza preventivo ───────────────────────────────────────── */}
      {(() => {
        if (!info.fecha || !["Enviado","Borrador"].includes(estado)) return null;
        const vence = new Date(new Date(info.fecha).getTime() + validez * 86400000);
        const oggi  = new Date();
        const diff  = Math.ceil((vence - oggi) / 86400000);
        if (diff > 5) return null;
        const scaduto = diff <= 0;
        const num  = (info.telefono||"").replace(/[\s\-\+\(\)]/g,"");
        const norm = num ? (num.startsWith("56")?num:num.startsWith("9")?`56${num}`:`569${num}`) : "";
        const msg  = scaduto
          ? `Hola ${info.cliente||""}👋\n\n⚠️ El presupuesto para *${info.descripcion||"tu proyecto"}* venció el ${vence.toLocaleDateString("es-CL")}.\n\n¿Quieres que lo renovemos? Estamos disponibles.\n\n_${info.empresa||"Obra Nova"}_`
          : `Hola ${info.cliente||""}👋\n\n⏰ El presupuesto para *${info.descripcion||"tu proyecto"}* vence el *${vence.toLocaleDateString("es-CL")}* (en ${diff} día${diff===1?"":"s"}).\n\n¿Tienes alguna consulta antes de decidir?\n\n_${info.empresa||"Obra Nova"}_`;
        const waUrl = norm ? `https://wa.me/${norm}?text=${encodeURIComponent(msg)}` : null;
        return (
          <div className="no-print" style={{
            display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8,
            background: scaduto ? "#fff5f5" : diff <= 2 ? "#fffbeb" : "#ebf8ff",
            border: `1px solid ${scaduto ? "#feb2b2" : diff <= 2 ? "#fbd38d" : "#bee3f8"}`,
            borderRadius:10, padding:"10px 14px", marginBottom:14,
          }}>
            <div style={{ fontSize:13, fontWeight:700, color: scaduto ? "#c53030" : diff <= 2 ? "#c05621" : "#2b6cb0" }}>
              {scaduto ? "⚠️ Presupuesto vencido" : diff === 0 ? "🔴 Vence hoy" : `⏰ Vence en ${diff} día${diff===1?"":"s"} — ${vence.toLocaleDateString("es-CL")}`}
            </div>
            {waUrl && (
              <button onClick={() => window.open(waUrl,"_blank","noopener,noreferrer")}
                style={{ padding:"6px 14px",background:"#25D366",color:"white",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12,display:"flex",alignItems:"center",gap:6 }}>
                💬 Recordar al cliente
              </button>
            )}
          </div>
        );
      })()}
      <div className="no-print" style={{ background:"white",borderRadius:12,padding:"14px 18px",marginBottom:14,boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
        <div style={{ fontWeight:700,fontSize:13,color:"#1a365d",marginBottom:12 }}>📤 Compartir presupuesto</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>

          {/* PDF */}
          <button onClick={() => { const sb = document.getElementById("app-sidebar"); const prev = sb?.style.display; if (sb) sb.style.display = "none"; window.print(); if (sb) sb.style.display = prev ?? ""; onTrackPdf?.("download"); }}
            style={{ padding:"11px 14px",background:"#2b6cb0",color:"white",border:"none",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
            🖨️ PDF
          </button>

          {/* Benchmark Report */}
          {partidas.length >= 3 && onShowBenchmark && (
            <button onClick={onShowBenchmark}
              style={{ padding:"11px 14px",background:"linear-gradient(135deg,#1a365d,#553c9a)",color:"white",border:"none",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
              📊 Benchmark
            </button>
          )}

          {/* WhatsApp + PDF: descarga PDF primero, luego abre WA con link */}
          {info.telefono && (() => {
            const total = iva ? totals.totalIva : totals.totalConDesc;
            const num = (info.telefono||"").replace(/[\s\-\+\(\)]/g,"");
            const norm = num ? (num.startsWith("56")?num:num.startsWith("9")?`56${num}`:`569${num}`) : "";
            const venceWA = info.fecha ? new Date(new Date(info.fecha).getTime() + (validez||30)*86400000).toLocaleDateString("es-CL") : null;
            const linkWA = workspaceId && currentId ? `${window.location.origin}/cliente/${workspaceId}/${currentId}` : null;
            const msgWA = `Hola ${info.cliente||""}👋

Te enviamos el presupuesto para:
📋 *${info.descripcion||"tu proyecto"}*

💰 *Total: $${total.toLocaleString("es-CL")} CLP*${iva?" (IVA inc.)":""}
${venceWA?`📅 Válido hasta: *${venceWA}*
`:""}
📄 _(Revisa el PDF adjunto con el detalle completo)_${linkWA?`

🔗 También puedes verlo en línea:
${linkWA}`:""}

_${info.empresa||"Obra Nova"}_`;
            const waUrl = `https://wa.me/${norm}?text=${encodeURIComponent(msgWA)}`;
            return (
              <button
                onClick={() => { const sb = document.getElementById("app-sidebar"); const prev = sb?.style.display; if (sb) sb.style.display = "none"; window.print(); if (sb) sb.style.display = prev ?? ""; onTrackPdf?.("whatsapp"); setTimeout(() => window.open(waUrl,"_blank","noopener,noreferrer"), 1200); }}
                style={{ padding:"11px 14px",background:"#25D366",color:"white",border:"none",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
                💬 WA + PDF
              </button>
            );
          })()}

          {/* Solo WhatsApp testo */}
          {info.telefono && (() => {
            const total = iva ? totals.totalIva : totals.totalConDesc;
            const num = (info.telefono||"").replace(/[\s\-\+\(\)]/g,"");
            const norm = num ? (num.startsWith("56")?num:num.startsWith("9")?`56${num}`:`569${num}`) : "";
            const venceSimple = info.fecha ? new Date(new Date(info.fecha).getTime() + (validez||30)*86400000).toLocaleDateString("es-CL") : null;
            const linkSimple = workspaceId && currentId ? `${window.location.origin}/cliente/${workspaceId}/${currentId}` : null;
            const msgSimple = `Hola ${info.cliente||""}👋

Te comparto el presupuesto para *${info.descripcion||"tu proyecto"}*:

💰 *Total: $${total.toLocaleString("es-CL")} CLP*${iva?" (IVA incluido)":""}
${venceSimple?`📅 *Válido hasta: ${venceSimple}*
`:""}
${linkSimple?`👉 Revísalo en línea aquí:
${linkSimple}

`:""}
¿Tienes alguna consulta? Con gusto te atiendo.

_${info.empresa||"Obra Nova"}_`;
            return (
              <button
                onClick={() => window.open(`https://wa.me/${norm}?text=${encodeURIComponent(msgSimple)}`,"_blank","noopener,noreferrer")}
                style={{ padding:"11px 14px",background:"#1ead57",color:"white",border:"none",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}
                title="Solo mensaje de texto (sin PDF)">
                💬 Solo WA
              </button>
            );
          })()}

          {/* Link vista cliente (para copiar) */}
          {currentId && (
            <button
              onClick={() => {
                const url = workspaceId ? `${window.location.origin}/cliente/${workspaceId}/${currentId}` : `${window.location.origin}/firma/${currentId}`;
                navigator.clipboard?.writeText(url).then(() => {}).catch(()=>{});
                const totalLink = (iva ? totals?.totalIva : totals?.totalConDesc) || 0;
                const msgLink = `Hola ${info?.cliente||""}👋

Te enviamos el presupuesto para:
📋 *${info?.descripcion||"tu proyecto"}*

💰 *Total: $${totalLink.toLocaleString("es-CL")} CLP*${iva?" (IVA inc.)":""}

👉 Ver en línea:
${url}

_${info?.empresa||"Obra Nova"}_`;
                window.open(`https://wa.me/?text=${encodeURIComponent(msgLink)}`, "_blank");
              }}
              style={{ padding:"11px 14px",background:"#553c9a",color:"white",border:"none",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}
              title="Comparte el link de vista cliente">
              🔗 Link online
            </button>
          )}

        </div>
        {!info.telefono && (
          <div style={{ marginTop:8,fontSize:11,color:"#a0aec0" }}>
            💡 Agrega el teléfono del cliente en la pestaña Proyecto para activar WhatsApp
          </div>
        )}
      </div>

      {/* Pannello firma digitale */}
      {onInviaFirma && (
        <div className="no-print" style={{ background: "linear-gradient(135deg,#276749,#38a169)", borderRadius: 12, padding: "14px 18px", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "white", fontWeight: 700, fontSize: 14 }}>✍️ Firma digital del cliente</div>
              <div style={{ color: "rgba(255,255,255,.75)", fontSize: 12, marginTop: 2 }}>
                {firme.length > 0
                  ? `${firme.filter(f => f.stato === "firmato").length} firmado · ${firme.filter(f => f.stato === "pending").length} en espera`
                  : "Envía el presupuesto al cliente para firma digital"}
              </div>
            </div>
            <button onClick={onInviaFirma}
              style={{ padding: "10px 20px", background: "white", color: "#276749", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 800, fontSize: 13, whiteSpace: "nowrap", flexShrink: 0 }}>
              📨 Enviar para firma
            </button>
          </div>
          {firme.length > 0 && (
            <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {firme.slice(0, 3).map((f, i) => (
                <span key={i} style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
                  background: f.stato === "firmato" ? "rgba(255,255,255,.9)" : "rgba(255,255,255,.3)",
                  color: f.stato === "firmato" ? "#276749" : "white" }}>
                  {f.stato === "firmato" ? "✅" : "⏳"} {f.firmaNome || "—"}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Controles de visibilidad */}
      <div className="no-print" style={{ background: "white", borderRadius: 12, padding: 16, marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#1a365d", marginBottom: 10 }}>⚙️ {t.visTitulo}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {cats.map((cat, i) => {
            const cv = getCatVis(cat);
            return (
              <div key={cat} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", background: cv.visible ? "#f7fafc" : "#fafafa", borderRadius: 9, border: `1px solid ${cv.visible ? CC[i % CC.length] + "44" : "#e2e8f0"}`, opacity: cv.visible ? 1 : 0.6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: cv.visible ? "#2d3748" : "#a0aec0" }}>{cat}</span>
                <button
                  onClick={() => setCatVisKey(cat, "visible", !cv.visible)}
                  style={{ padding: "3px 9px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, background: cv.visible ? "#276749" : "#e53e3e", color: "white" }}
                >{cv.visible ? "👁 Visible" : "🚫 Oculto"}</button>
                {cv.visible && (
                  <button
                    onClick={() => setCatVisKey(cat, "modo", cv.modo === "detalle" ? "macro" : "detalle")}
                    style={{ padding: "3px 9px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, background: cv.modo === "detalle" ? "#2b6cb0" : "#d69e2e", color: "white" }}
                  >{cv.modo === "detalle" ? "📋 Detalle" : "📊 Solo total"}</button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Print area */}
      <div id="print-area" style={{ background: "white", padding: "28px 24px", maxWidth: 800, margin: "0 auto", borderRadius: 12, boxShadow: "0 1px 8px rgba(0,0,0,.08)", position: "relative", overflow: "hidden" }}>

        {/* ── Watermark OBRA NOVA per piano Free — visibile in anteprima e stampa ── */}
        {!isPro && (
          <div aria-hidden="true" style={{
            position: "absolute", inset: 0,
            pointerEvents: "none", zIndex: 1, overflow: "hidden",
            WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
          }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                position: "absolute",
                top: `${15 + i * 28}%`,
                left: "-15%", right: "-15%",
                transform: "rotate(-32deg)",
                fontSize: 38, fontWeight: 900,
                color: "rgba(43,108,176,0.13)",
                whiteSpace: "nowrap", userSelect: "none",
                letterSpacing: "0.15em", textTransform: "uppercase",
                WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
              }}>
                OBRA NOVA &nbsp;&nbsp;&nbsp; OBRA NOVA &nbsp;&nbsp;&nbsp; OBRA NOVA &nbsp;&nbsp;&nbsp; OBRA NOVA &nbsp;&nbsp;&nbsp; OBRA NOVA
              </div>
            ))}
          </div>
        )}

        {/* ── Watermark dinamico stato ── */}
        <div style={{
          position: "absolute", top: "42%", left: "50%",
          transform: "translate(-50%,-50%) rotate(-35deg)",
          fontSize: 80, fontWeight: 900, letterSpacing: 8,
          color: ESTADO_COLORS[estado] || "#718096",
          opacity: estado === "Borrador" ? 0.07 : 0.09,
          pointerEvents: "none", userSelect: "none",
          whiteSpace: "nowrap", zIndex: 0,
          WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
        }}>
          {(t[estado?.toLowerCase()] || estado || "").toUpperCase()}
        </div>

        {/* ── Banda accent superiore ── */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 7, background: `linear-gradient(90deg, ${pdf.colorPrimario}, ${ESTADO_COLORS[estado] || pdf.colorPrimario})`, borderRadius: "12px 12px 0 0", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }} />

        {/* ── Header empresa ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, paddingBottom: 14, borderBottom: `2px solid ${pdf.colorPrimario}22`, marginTop: 8, position: "relative", zIndex: 1 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <img src={logoEffettivo} alt="" style={{ height: 46, maxWidth: 180, objectFit: "contain" }} onError={e => { e.target.style.display = "none"; }} />
              {showFreeBranding && (
                <span style={{
                  fontSize: 8, fontWeight: 800, color: "#2b6cb0",
                  background: "#ebf8ff", border: "1px solid #bee3f8",
                  borderRadius: 4, padding: "2px 6px", letterSpacing: .5,
                  alignSelf: "flex-start", marginTop: 4,
                  WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
                }}>OBRA NOVA FREE</span>
              )}
            </div>
            <div style={{ fontWeight: 800, fontSize: 17, color: pdf.colorPrimario }}>{EMPRESA.nombre}</div>
            <div style={{ fontSize: 10, color: "#718096", marginTop: 2 }}>RUT {EMPRESA.rut} · {EMPRESA.giro}</div>
            <div style={{ fontSize: 10, color: "#718096" }}>{EMPRESA.direccion}, {EMPRESA.ciudad} · 📞 {EMPRESA.telefono}</div>
            <div style={{ fontSize: 10, color: "#718096" }}>✉ {EMPRESA.email}</div>
          </div>
          <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            {/* Badge stato */}
            <div style={{ background: ESTADO_BG[estado], color: ESTADO_COLORS[estado], padding: "5px 16px", borderRadius: 99, fontWeight: 800, fontSize: 12, border: `1.5px solid ${ESTADO_COLORS[estado]}44`, letterSpacing: 0.5 }}>
              {(t[estado?.toLowerCase()] || estado || "").toUpperCase()}
            </div>
            {/* Numero preventivo prominente */}
            <div style={{ background: pdf.colorPrimario, color: "white", padding: "4px 14px", borderRadius: 7, fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>
              N° {currentId?.slice(-6)?.toUpperCase() || "——"}
            </div>
            <div style={{ fontSize: 11, color: "#4a5568" }}>📅 {info.fecha || new Date().toLocaleDateString("es-CL")}</div>
            <div style={{ fontSize: 10, color: "#718096" }}>Vence: <strong>{venceDate}</strong></div>
            {/* QR code — visibile in stampa, porta alla VistaCliente firmabile */}
            {currentId && workspaceId && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, marginTop: 4 }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`${window.location.origin}/cliente/${workspaceId}/${currentId}`)}&bgcolor=ffffff&color=1a365d&qzone=1`}
                  alt="QR presupuesto"
                  width={80}
                  height={80}
                  style={{ borderRadius: 6, border: "1px solid #e2e8f0", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
                />
                <span style={{ fontSize: 8, color: "#a0aec0", letterSpacing: 0.3 }}>Escanea para firmar</span>
              </div>
            )}
            {/* Bottone link cliente */}
            {currentId && (
              <button
                onClick={() => {
                  const url = workspaceId ? `${window.location.origin}/cliente/${workspaceId}/${currentId}` : `${window.location.origin}/firma/${currentId}`;
                  navigator.clipboard?.writeText(url).then(() => {}).catch(() => {});
                  const totalEnviar = (iva ? totals?.totalIva : totals?.totalConDesc) || 0;
                  const clienteEnviar = info?.cliente || "";
                  const descEnviar = info?.descripcion || "tu proyecto";
                  const empresaEnviar = info?.empresa || "Obra Nova";
                  const venceEnviar = info?.fecha ? new Date(new Date(info.fecha).getTime() + (validez||30)*86400000).toLocaleDateString("es-CL") : null;
                  const msgEnviar = `Hola ${clienteEnviar}👋

Te enviamos el presupuesto para:
📋 *${descEnviar}*

💰 *Total: $${totalEnviar.toLocaleString("es-CL")} CLP*${iva?" (IVA inc.)":""}
${venceEnviar?`📅 Válido hasta: *${venceEnviar}*
`:""}
👉 Ver, revisar y firmar en línea:
${url}

_${empresaEnviar}_`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(msgEnviar)}`, "_blank");
                }}
                className="no-print"
                style={{ marginTop: 6, padding: "7px 14px", background: "#25D366", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}
              >
                💬 Enviar al cliente
              </button>
            )}
          </div>
        </div>

        {/* Cliente + Obra */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 18, position: "relative", zIndex: 1 }}>
          <div style={{ background: "#f7fafc", borderRadius: 9, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, color: "#718096", fontWeight: 700, marginBottom: 5, letterSpacing: .5 }}>CLIENTE / PROPIETARIO</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d" }}>{info.cliente || "—"}</div>
            {info.telefono && <div style={{ fontSize: 11, color: "#4a5568", marginTop: 2 }}>📞 {info.telefono}</div>}
            {info.email    && <div style={{ fontSize: 11, color: "#4a5568" }}>✉ {info.email}</div>}
          </div>
          <div style={{ background: "#f7fafc", borderRadius: 9, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, color: "#718096", fontWeight: 700, marginBottom: 5, letterSpacing: .5 }}>OBRA</div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "#2d3748" }}>{info.descripcion || "—"}</div>
            {info.direccion && <div style={{ fontSize: 11, color: "#4a5568", marginTop: 2 }}>📍 {info.direccion}{info.ciudad ? ", " + info.ciudad : ""}</div>}
            {info.fechaInicio && <div style={{ fontSize: 11, color: "#4a5568" }}>📅 {info.fechaInicio} → {info.fechaTermino || "?"}</div>}
          </div>
        </div>

        {/* Partidas por categoría */}
        <div style={{ marginBottom: 18, position: "relative", zIndex: 1 }}>
          {cats.map((cat, ci) => {
            const cv = getCatVis(cat);
            if (!cv.visible) return null;
            const vis = clientPartidas.filter(p => p.cat === cat);
            if (!vis.length) return null;
            const catTotal = vis.reduce((s, p) => s + p.cant * p.pu, 0);
            const catColor = CC[ci % CC.length];
            return (
              <div key={cat} style={{ marginBottom: 14 }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",background:pdf.colorPrimario,color:"white",padding:"6px 12px",borderRadius:"8px 8px 0 0" }}>
                  <span style={{ fontWeight:700,fontSize:12,letterSpacing:.5 }}>{cat.toUpperCase()}</span>
                  <span style={{ fontWeight:800,fontSize:12,color:"#fff" }}>{fmt(catTotal)}</span>
                </div>
                {cv.modo === "detalle" && (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, border: "1px solid #e2e8f0", borderTop: "none" }}>
                    <tbody>
                      {vis.map((p, j) => (
                        <tr key={p.id} style={{ background: j % 2 === 0 ? pdf.colorTabella : "white" }}>
                          <td style={{ padding: "6px 10px", color: "#2d3748" }}>{p.nombre}</td>
                          <td style={{ padding: "6px 6px", textAlign: "center", color: "#718096", width: 40 }}>{p.unidad}</td>
                          <td style={{ padding: "6px 6px", textAlign: "right", color: "#718096", width: 50 }}>{p.cant}</td>
                          <td style={{ padding: "6px 8px", textAlign: "right", color: "#718096", width: 80 }}>{fmt(p.pu)}</td>
                          <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: 700, color: "#1a365d", width: 90 }}>{fmt(p.cant * p.pu)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {cv.modo === "macro" && (
                  <div style={{ padding: "8px 12px", background: "#f7fafc", borderRadius: "0 0 8px 8px", border: "1px solid #e2e8f0", borderTop: "none", fontSize: 12, color: "#718096" }}>
                    Total {cat}: <strong style={{ color: "#1a365d" }}>{fmt(catTotal)}</strong>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Resumen financiero */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 18, position: "relative", zIndex: 1 }}>
          <div style={{ background: "#f7fafc", borderRadius: 9, padding: "12px 14px", fontSize: 11 }}>
            {(() => {
              const hasDesc = (descuentoAmt || 0) > 0;
              const vcRows = [
                { key:"ci",     l:`CI ${pct.ci}%`,                    v:ci,      b:false },
                { key:"gf",     l:`GF ${pct.gf}%`,                    v:gf,      b:false },
                { key:"imprev", l:`Imprevistos ${pct.imprevistos}%`,   v:imprev,  b:false },
                { key:"sub",    l:t.subtotal || "Subtotal",            v:sub,     b:true  },
                { key:"util",   l:`${t.utilidad} ${pct.utilidad}%`,    v:util,    b:false },
                { key:"total",  l:hasDesc ? "Total s/desc." : "TOTAL s/IVA", v:total, b:true },
                ...(hasDesc ? [
                  { key:"desc",  l:`Descuento${descuento.tipo==="pct"?` (${descuento.valor}% s/neto)`:""}`, v:-descuentoAmt, b:false, red:true },
                  { key:"totalcd",l:"TOTAL c/desc.",                    v:totalConDesc, b:true },
                ] : []),
              ];
              const toggleable = vcRows.filter(r=>!r.b);
              const allHid = toggleable.every(r=>hidVC[r.key]);
              return <>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:7 }}>
                  <span style={{ fontWeight:700, color:"#1a365d", fontSize:12 }}>{t.desgloseFinanciero || "Desglose financiero"}</span>
                  <button className="no-print" onClick={()=>{ const n={}; if(!allHid) toggleable.forEach(r=>{n[r.key]=true;}); setHidVC(n); localStorage.setItem("on_desglose_vc_hidden",JSON.stringify(n)); }} style={{ fontSize:10, color:"#718096", background:"white", border:"1px solid #e2e8f0", borderRadius:5, padding:"2px 6px", cursor:"pointer" }}>{allHid?"Mostrar":"Ocultar"}</button>
                </div>
                {vcRows.map(({key,l,v,b,red}) => {
                  const isHid = hidVC[key] && !b;
                  // Hidden rows: don't render at all (clean PDF)
                  if (isHid) return null;
                  return (
                    <div key={key} style={{ display:"flex", alignItems:"center", gap:5, padding:"3px 0", borderTop: b ? "1px solid #e2e8f0" : "none" }}>
                      <input type="checkbox" className="no-print" checked={!hidVC[key]} onChange={()=>toggleVC(key)}
                        style={{ width:12, height:12, accentColor:"#2b6cb0", cursor:"pointer", margin:0, flexShrink:0 }}
                        disabled={b} />
                      <span style={{ flex:1, color: red ? "#e53e3e" : b ? "#1a365d" : "#718096", fontWeight: b ? 700 : 400 }}>{l}</span>
                      <span style={{ color: red ? "#e53e3e" : b ? "#1a365d" : "#4a5568", fontWeight: b ? 700 : 400 }}>{fmt(v)}</span>
                    </div>
                  );
                })}
                {/* IVA row — toggleable */}
                {iva && (() => {
                  const ivaHid = hidVC["iva_vc"];
                  if (ivaHid) return null;
                  return (
                    <div style={{ display:"flex", alignItems:"center", gap:5, padding:"3px 0", borderTop:"1px solid #e2e8f0" }}>
                      <input type="checkbox" className="no-print" checked={!ivaHid} onChange={()=>toggleVC("iva_vc")}
                        style={{ width:12, height:12, accentColor:"#2b6cb0", cursor:"pointer", margin:0, flexShrink:0 }} />
                      <span style={{ flex:1, color:"#c05621" }}>IVA 19%</span>
                      <span style={{ color:"#c05621" }}>{fmt(ivaAmt)}</span>
                    </div>
                  );
                })()}
                {/* Descuento descripción */}
                {hasDesc && descuento.descripcion && !hidVC["desc"] && (
                  <div style={{ fontSize:10, color:"#718096", fontStyle:"italic", padding:"2px 0 0 17px" }}>{descuento.descripcion}</div>
                )}
              </>;
            })()}
            {/* TOTAL finale — sempre visibile */}
            {iva && !hidVC["iva_vc"] ? (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: "#1a365d", borderRadius: 7, marginTop: 5 }}>
                <span style={{ color: "white", fontWeight: 800, fontSize: 13 }}>TOTAL {t.conIVA}</span>
                <span style={{ color: "white", fontWeight: 900, fontSize: 13 }}>{fmt(totalIva)}</span>
              </div>
            ) : !iva ? (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: "#1a365d", borderRadius: 7, marginTop: 5 }}>
                <span style={{ color: "white", fontWeight: 800, fontSize: 13 }}>TOTAL</span>
                <span style={{ color: "white", fontWeight: 900, fontSize: 13 }}>{fmt(totalConDesc)}</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Condiciones de pago */}
        {pdf.mostraCondPago && info.condPago && (
          <div className="print-block" style={{ marginBottom:16,padding:"12px 16px",background:"#f7fafc",borderRadius:9,border:`1px solid ${pdf.colorPrimario}22` }}>
            <div style={{ fontWeight:700,fontSize:12,color:pdf.colorPrimario,marginBottom:6 }}>💳 Condiciones de pago</div>

            {info.condPago === "contado" && (
              <div style={{ fontSize:12,color:"#4a5568" }}>💵 Pago al contado</div>
            )}

            {(info.condPago === "credito" || info.condPago === "personalizado") && (
              <div style={{ fontSize:12,color:"#4a5568" }}>{info.condPagoPersonalizado || "—"}</div>
            )}

            {info.condPago === "transferencia" && info.transferencia && (
              <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
                <div style={{ fontSize:12,color:"#4a5568",fontWeight:700,marginBottom:4 }}>🏧 Datos para transferencia</div>
                {info.transferencia.banco      && <div style={{ fontSize:12,color:"#4a5568" }}><strong>Banco:</strong> {info.transferencia.banco}</div>}
                {info.transferencia.cuenta     && <div style={{ fontSize:12,color:"#4a5568" }}><strong>N° Cuenta:</strong> {info.transferencia.cuenta}</div>}
                {info.transferencia.rutTitular && <div style={{ fontSize:12,color:"#4a5568" }}><strong>RUT Titular:</strong> {info.transferencia.rutTitular}</div>}
                {info.transferencia.nota       && <div style={{ fontSize:12,color:"#718096",marginTop:4,fontStyle:"italic" }}>{info.transferencia.nota}</div>}
              </div>
            )}

            {info.condPago === "cuotas" && info.cuotas && info.cuotas.length > 0 && (
              <div style={{ marginTop:8,display:"flex",flexDirection:"column",gap:6 }}>
                {info.cuotas.map((c,i) => (
                  <div key={i} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 10px",background:"white",borderRadius:7,border:`1px solid ${pdf.colorPrimario}33` }}>
                    <div style={{ display:"flex",flexDirection:"column",gap:1 }}>
                      <span style={{ fontSize:12,fontWeight:700,color:"#2d3748" }}>
                        {c.desc || `Cuota ${i+1}`}
                      </span>
                      <span style={{ fontSize:11,color:"#718096" }}>
                        {(c.tipo || "pct") === "pct"
                          ? `${c.monto || 0}% del total`
                          : `$${(c.monto || 0).toLocaleString("es-CL")}`
                        }
                        {c.fecha ? ` · Vence ${new Date(c.fecha + "T12:00:00").toLocaleDateString("es-CL")}` : ""}
                      </span>
                    </div>
                    {c.mpLink && (
                      <div style={{ display:"flex",alignItems:"center",gap:8,flexShrink:0,marginLeft:10 }}>
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=52x52&data=${encodeURIComponent(c.mpLink)}&bgcolor=ffffff&color=009ee3&qzone=1`}
                          alt="QR pago"
                          style={{ width:52,height:52,borderRadius:4,border:"1px solid #e2e8f0" }}
                        />
                        <a href={c.mpLink} target="_blank" rel="noopener noreferrer"
                          style={{ padding:"5px 12px",background:"#009ee3",color:"white",borderRadius:7,fontSize:11,fontWeight:700,textDecoration:"none" }}>
                          💳 Pagar online
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Fotos del proyecto */}
        {pdf.mostraFoto && fotos && fotos.filter(f => f.enPDF !== false).length > 0 && (
          <div className="print-block" style={{ marginBottom:16 }}>
            <div style={{ fontWeight:700,fontSize:12,color:pdf.colorPrimario,marginBottom:8,borderBottom:`1px solid ${pdf.colorPrimario}22`,paddingBottom:5 }}>📸 Fotos del proyecto</div>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:8 }}>
              {fotos.filter(f => f.enPDF !== false).slice(0,6).map((foto,i) => (
                <div key={i} style={{ borderRadius:7,overflow:"hidden",border:"1px solid #e2e8f0" }}>
                  <img src={foto.url||foto} alt={`Foto ${i+1}`} style={{ width:"100%",height:110,objectFit:"cover",display:"block" }} />
                  {foto.descripcion && <div style={{ fontSize:9,color:"#718096",padding:"3px 6px",background:"#f7fafc" }}>{foto.descripcion}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Renders AI del proyecto */}
        {aiRenders && aiRenders.length > 0 && (
          <div className="print-block" style={{ marginBottom:16 }}>
            <div style={{ fontWeight:700,fontSize:12,color:pdf.colorPrimario,marginBottom:8,borderBottom:`1px solid ${pdf.colorPrimario}22`,paddingBottom:5 }}>🎨 Visualización AI del proyecto</div>
            <div style={{ display:"grid",gridTemplateColumns: aiRenders.length === 1 ? "1fr" : "repeat(auto-fill,minmax(220px,1fr))",gap:10 }}>
              {aiRenders.slice(0,4).map((r,i) => (
                <div key={i} style={{ borderRadius:8,overflow:"hidden",border:"1px solid #e2e8f0",boxShadow:"0 1px 4px rgba(0,0,0,.06)" }}>
                  <img src={r.imageUrl} alt={r.label || `Render ${i+1}`} style={{ width:"100%",height: aiRenders.length === 1 ? 280 : 160,objectFit:"cover",display:"block" }} />
                  <div style={{ padding:"5px 8px",background:"#f7fafc",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                    <span style={{ fontSize:10,fontWeight:700,color:"#1a365d" }}>{r.label || r.roomType || `Render ${i+1}`}</span>
                    <span style={{ fontSize:9,color:"#a0aec0" }}>Render AI</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontSize:9,color:"#a0aec0",marginTop:6,textAlign:"center",fontStyle:"italic" }}>
              Visualización generada por inteligencia artificial — el resultado final puede variar
            </div>
          </div>
        )}

        {/* Firma digitale — 2.9: mostra immagine firma + campi corretti */}
        {pdf.mostraFirma && firme && firme.filter(f => f.stato==="firmato").length > 0 && (
          <div className="print-block" style={{ marginBottom:16,padding:"14px 16px",background:"#f0fff4",borderRadius:9,border:"1px solid #9ae6b4" }}>
            <div style={{ fontWeight:700,fontSize:12,color:"#276749",marginBottom:10 }}>✍️ Firma digital del cliente</div>
            {firme.filter(f => f.stato==="firmato").map((f,i) => (
              <div key={i} style={{ display:"flex",alignItems:"flex-start",gap:16,flexWrap:"wrap" }}>
                {/* Immagine firma */}
                {f.firmaImmagine && (
                  <div style={{ border:"1px solid #9ae6b4",borderRadius:8,padding:"6px 12px",background:"white",flexShrink:0 }}>
                    <img
                      src={f.firmaImmagine}
                      alt="Firma cliente"
                      style={{ height:64,maxWidth:220,objectFit:"contain",display:"block" }}
                    />
                  </div>
                )}
                {/* Dati firma */}
                <div style={{ fontSize:11,color:"#2d3748",display:"flex",flexDirection:"column",gap:3,justifyContent:"center" }}>
                  <div><strong style={{ color:"#276749" }}>{f.firmaNome || f.nombre || "Cliente"}</strong></div>
                  <div style={{ color:"#718096" }}>
                    Firmado el {f.firmaData
                      ? new Date(f.firmaData).toLocaleDateString("es-CL",{day:"2-digit",month:"long",year:"numeric"})
                      : f.firmadoAt?.slice(0,10) || "—"}
                  </div>
                  {f.firmaIP && <div style={{ color:"#a0aec0",fontSize:10 }}>IP: {f.firmaIP}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Pie de página professionale ── */}
        <div style={{ marginTop: 24, paddingTop: 12, borderTop: `2px solid ${pdf.colorPrimario}22`, position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: 9, color: "#a0aec0", lineHeight: 1.6 }}>
              <div style={{ fontWeight: 700, color: "#718096", fontSize: 10 }}>{EMPRESA.nombre}</div>
              <div>RUT {EMPRESA.rut} · {EMPRESA.giro}</div>
              <div>{EMPRESA.direccion}, {EMPRESA.ciudad}</div>
              <div>📞 {EMPRESA.telefono} · ✉ {EMPRESA.email}</div>
            </div>
            <div style={{ textAlign: "right", fontSize: 9, color: "#a0aec0", lineHeight: 1.6 }}>
              <div>Documento N° {currentId?.slice(-6)?.toUpperCase() || "——"}</div>
              <div>Generado el {new Date().toLocaleDateString("es-CL")}</div>
              <div>Válido hasta: {venceDate}</div>
              {isPro && <div style={{ color: pdf.colorPrimario, fontWeight: 600, marginTop: 2 }}>✓ Documento verificado</div>}
            </div>
          </div>

          {/* Watermark Free / branding Pro */}
          {!isPro ? (
            <div className="print-footer" style={{
              marginTop: 14, paddingTop: 10,
              borderTop: "2px solid #bee3f8",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: 8,
              background: "#f0f8ff", borderRadius: 8, padding: "10px 14px",
              WebkitPrintColorAdjust: "exact", printColorAdjust: "exact",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <img src={LOGO_URL} alt="Obra Nova" style={{ height: 22, objectFit: "contain" }} onError={e => { e.target.style.display = "none"; }} />
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#2b6cb0" }}>Generado con Obra Nova Free</div>
                  <div style={{ fontSize: 8, color: "#718096" }}>app.obranova.cl — Sistema de presupuestos para construcción</div>
                </div>
              </div>
              <div style={{ fontSize: 8, color: "#2b6cb0", fontWeight: 700, textAlign: "right" }}>
                Mejora a Pro para PDF<br/>con tu logo y sin branding
              </div>
            </div>
          ) : (
            <div className="print-footer" style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 5, opacity: .3 }}>
              <img src={LOGO_URL} alt="" style={{ height: 14, objectFit: "contain" }} onError={e => { e.target.style.display = "none"; }} />
              <span style={{ fontSize: 8, color: "#a0aec0" }}>Obra Nova</span>
            </div>
          )}
        </div>

        {/* ── Nova para el cliente — preguntas frecuentes ─────────────────── */}
        <div className="no-print" style={{ marginTop: 16, background: "linear-gradient(135deg,#ebf8ff,#bee3f8)", borderRadius: 12, padding: "14px 16px", border: "1px solid #90cdf4" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 18 }}>🤖</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1a365d" }}>Nova — Asistente del presupuesto</div>
              <div style={{ fontSize: 11, color: "#4a5568" }}>Preguntas frecuentes sobre este presupuesto</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { q: "¿Este precio es justo?", a: `Este presupuesto de ${totals.totalConDesc > 0 ? "$" + Math.round(iva ? totals.totalIva : totals.totalConDesc).toLocaleString("es-CL") : "—"} CLP está dentro del rango de mercado para este tipo de trabajo en Chile. Los precios unitarios reflejan valores actualizados 2026.` },
              { q: "¿Qué incluye exactamente?", a: `Incluye ${partidas.length} partidas organizadas en ${[...new Set(partidas.map(p => p.cat).filter(Boolean))].length} categorías: ${[...new Set(partidas.map(p => p.cat).filter(Boolean))].slice(0, 4).join(", ")}${[...new Set(partidas.map(p => p.cat).filter(Boolean))].length > 4 ? " y más" : ""}.` },
              { q: "¿Cuánto tiempo toma?", a: "El plazo depende del alcance del proyecto. Consulta directamente con el constructor para un cronograma detallado." },
            ].map((item, i) => (
              <details key={i} style={{ background: "white", borderRadius: 8, border: "1px solid #bee3f8", overflow: "hidden" }}>
                <summary style={{ padding: "8px 12px", fontSize: 12, fontWeight: 600, color: "#2a4365", cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14 }}>💬</span> {item.q}
                </summary>
                <div style={{ padding: "8px 12px", fontSize: 12, color: "#4a5568", lineHeight: 1.5, borderTop: "1px solid #bee3f8", background: "#f7fafc" }}>
                  {item.a}
                </div>
              </details>
            ))}
          </div>
          <div style={{ fontSize: 9, color: "#718096", marginTop: 8, textAlign: "center" }}>
            Respuestas generadas por Nova AI — para más detalles contacta al constructor
          </div>
        </div>
      </div>
    </div>
  );
}

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
        {/* Immagine portada render AI */}
        {p.coverImageUrl && (
          <div style={{ margin:"-14px -16px 12px -16px", borderRadius:"14px 14px 0 0", overflow:"hidden", height:100 }}>
            <img src={p.coverImageUrl} alt="Portada" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
          </div>
        )}
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

// ─── TabProyectos ─────────────────────────────────────────────────────────────

export function TabProyectos({ proyectos, currentId, onLoad, onDelete, onPDF, t, canPlan, onPaywall }) {
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
          {filtered.length} de {proyectos.length} cotizaciones
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
          Aún no tienes cotizaciones
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

// ─── TabListino ───────────────────────────────────────────────────────────────
// ─── 3.4 Comparativo Proveedores ─────────────────────────────────────────────
function ComparativoProveedores({ listino, cats, catColors, t }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("nombre"); // nombre | precioCompra | margen

  // Raggruppa articoli per nome e mostra tutti i provider con prezzi
  const grouped = useMemo(() => {
    const map = {};
    listino.forEach(item => {
      const key = (item.nombre || "").toLowerCase().trim();
      if (!key) return;
      if (!map[key]) map[key] = { nombre: item.nombre, cat: item.cat, unidad: item.unidad, items: [] };
      map[key].items.push(item);
    });
    // Calcola stats per gruppo
    return Object.values(map).map(g => {
      const precios = g.items.map(x => x.precioCompra || 0).filter(p => p > 0);
      const min     = precios.length ? Math.min(...precios) : 0;
      const max     = precios.length ? Math.max(...precios) : 0;
      const avg     = precios.length ? precios.reduce((a,b)=>a+b,0)/precios.length : 0;
      const spread  = min > 0 ? Math.round((max - min) / min * 100) : 0;
      return { ...g, min, max, avg, spread, nProveedores: new Set(g.items.map(x=>x.proveedor||"—")).size };
    });
  }, [listino]);

  const filtered = useMemo(() => {
    let list = [...grouped];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(g => g.nombre.toLowerCase().includes(q) || g.cat?.toLowerCase().includes(q));
    }
    if (sortBy === "nombre")       list.sort((a,b) => a.nombre.localeCompare(b.nombre));
    if (sortBy === "precioCompra") list.sort((a,b) => b.avg - a.avg);
    if (sortBy === "margen")       list.sort((a,b) => b.spread - a.spread);
    return list;
  }, [grouped, search, sortBy]);

  const fmtCLP = n => n > 0 ? "$ " + Math.round(n).toLocaleString("es-CL") : "—";

  if (listino.length === 0) return (
    <div style={{ background:"white", borderRadius:12, padding:"40px 20px", textAlign:"center", color:"#a0aec0" }}>
      <div style={{ fontSize:36, marginBottom:10 }}>📊</div>
      <div style={{ fontWeight:700, fontSize:14 }}>Sin datos para comparar</div>
      <div style={{ fontSize:12, marginTop:4 }}>Agrega artículos al listino con sus precios y proveedores</div>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {/* Info */}
      <div style={{ background:"#ebf8ff", border:"1px solid #bee3f8", borderRadius:10, padding:"10px 16px", fontSize:12, color:"#2b6cb0" }}>
        📊 Compara precios de compra entre proveedores para el mismo material. Los artículos con mayor diferencia de precio están arriba.
      </div>

      {/* Toolbar */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:200, position:"relative" }}>
          <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", fontSize:13, color:"#a0aec0" }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar material..."
            style={{ width:"100%", padding:"8px 10px 8px 30px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:12, color:"#1a365d", boxSizing:"border-box" }}
          />
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ padding:"8px 10px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:12, color:"#1a365d" }}>
          <option value="nombre">Nombre A-Z</option>
          <option value="precioCompra">Mayor precio promedio</option>
          <option value="margen">Mayor diferencia %</option>
        </select>
      </div>

      {/* Tabla */}
      <div style={{ background:"white", borderRadius:12, overflow:"hidden", boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr style={{ background:"#1a365d", color:"white" }}>
              {["Material","Cat","Mín","Máx","Promedio","Diferencia","Proveedores"].map(h => (
                <th key={h} style={{ padding:"9px 10px", textAlign:"left", fontWeight:600, fontSize:11, whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding:"24px", textAlign:"center", color:"#a0aec0" }}>Sin resultados</td></tr>
            )}
            {filtered.map((g, i) => (
              <tr key={g.nombre} style={{ background: i%2===0?"#f7fafc":"white", borderBottom:"1px solid #f0f4f8" }}>
                <td style={{ padding:"8px 10px", fontWeight:700, color:"#1a365d" }}>{g.nombre}</td>
                <td style={{ padding:"8px 8px" }}>
                  <span style={{ fontSize:10, padding:"2px 7px", borderRadius:99, fontWeight:700,
                    background:"#ebf8ff", color:"#2b6cb0" }}>{g.cat||"—"}</span>
                </td>
                <td style={{ padding:"8px 10px", color:"#276749", fontWeight:700 }}>{fmtCLP(g.min)}</td>
                <td style={{ padding:"8px 10px", color:"#c53030", fontWeight:700 }}>{fmtCLP(g.max)}</td>
                <td style={{ padding:"8px 10px", color:"#4a5568" }}>{fmtCLP(g.avg)}</td>
                <td style={{ padding:"8px 10px" }}>
                  {g.spread > 0 ? (
                    <span style={{ padding:"2px 9px", borderRadius:99, fontSize:11, fontWeight:800,
                      background: g.spread > 30 ? "#fff5f5" : g.spread > 10 ? "#fffff0" : "#f0fff4",
                      color:      g.spread > 30 ? "#c53030" : g.spread > 10 ? "#b7791f" : "#276749" }}>
                      +{g.spread}%
                    </span>
                  ) : <span style={{ color:"#a0aec0" }}>—</span>}
                </td>
                <td style={{ padding:"8px 10px", color:"#718096" }}>
                  <button
                    style={{ background:"none", border:"none", cursor:"pointer", color:"#2b6cb0", fontSize:11, fontWeight:600, padding:0 }}
                    onClick={() => {
                      const provs = [...new Set(g.items.map(x=>x.proveedor||"—"))];
                      alert(`Proveedores para ${g.nombre}:\n\n${g.items.map(x=>`${x.proveedor||"—"}: ${fmtCLP(x.precioCompra||0)} / ${x.unidad||"un"}`).join("\n")}`);
                    }}>
                    {g.nProveedores} {g.nProveedores === 1 ? "proveedor" : "proveedores"} →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TabListino({ listino, cats, catColors, newCatName, setNewCatName, onAddCat, onDeleteItem, onAddFromListino, onOpenAddModal, onSaveListinoItem, DEFAULT_CATS, t, onUpdatePrecio, listinoRestanti = Infinity, onPaywall = () => {}, isPro = false }) {
  const [filterCat,    setFilterCat]    = useState(null);
  const [search,       setSearch]       = useState("");
  const [isMobile,     setIsMobile]     = useState(() => window.innerWidth < 768);
  const [vistaTab,     setVistaTab]     = useState("listino"); // "listino" | "comparativo"
  // 2.10 Edit inline prezzi
  const [editingPrice, setEditingPrice] = useState(null); // { id, field, value }
  // Modal agregar/editar listino
  const [showModal, setShowModal] = useState(false); // "add" | item.id | false
  const [modalForm, setModalForm] = useState({ nombre: "", cat: cats[0] || "", unidad: "un", precioCompra: 0, precioCliente: 0, proveedor: "" });
  const [showProvSugg, setShowProvSugg] = useState(false);

  // Proveedores aggregati da tutti gli items del listino
  const proveedores = useMemo(() => {
    const set = new Set();
    listino.forEach(x => { if (x.proveedor?.trim()) set.add(x.proveedor.trim()); });
    return [...set].sort();
  }, [listino]);

  const provSuggFiltered = useMemo(() => {
    if (!modalForm.proveedor?.trim()) return proveedores;
    const q = modalForm.proveedor.toLowerCase();
    return proveedores.filter(p => p.toLowerCase().includes(q));
  }, [proveedores, modalForm.proveedor]);

  const isEditing = showModal && showModal !== "add";

  const handleModalSave = async () => {
    if (!modalForm.nombre.trim()) return;
    if (onSaveListinoItem) {
      const payload = {
        nombre: modalForm.nombre.trim(),
        cat: modalForm.cat,
        unidad: modalForm.unidad,
        precioCompra: parseFloat(modalForm.precioCompra) || 0,
        precio: parseFloat(modalForm.precioCompra) || 0,
        precioVenta: parseFloat(modalForm.precioCliente) || 0,
        precioCliente: parseFloat(modalForm.precioCliente) || 0,
        proveedor: modalForm.proveedor.trim(),
      };
      if (isEditing) {
        // Edit: update via onUpdatePrecio for each field
        const item = listino.find(x => x.id === showModal);
        if (item && onUpdatePrecio) {
          for (const [k, v] of Object.entries(payload)) {
            if (item[k] !== v) await onUpdatePrecio(item.id, k, v);
          }
        }
      } else {
        await onSaveListinoItem(payload);
      }
    }
    setModalForm({ nombre: "", cat: cats[0] || "", unidad: "un", precioCompra: 0, precioCliente: 0, proveedor: "" });
    setShowModal(false);
  };

  const openAddModal = () => {
    if (listinoRestanti === 0) { onPaywall("maxListino"); return; }
    setModalForm({ nombre: "", cat: cats[0] || "", unidad: "un", precioCompra: 0, precioCliente: 0, proveedor: "" });
    setShowModal("add");
  };

  const openEditModal = (item) => {
    setModalForm({
      nombre: item.nombre || "",
      cat: item.cat || cats[0] || "",
      unidad: item.unidad || "un",
      precioCompra: item.precioCompra || 0,
      precioCliente: item.precioCliente || item.precio || 0,
      proveedor: item.proveedor || "",
    });
    setShowModal(item.id);
  };
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const catColorMap = useMemo(() => {
    const map = {};
    cats.forEach((c, i) => { map[c] = catColors[i % catColors.length]; });
    return map;
  }, [cats, catColors]);

  const listinoFiltrato = useMemo(() => {
    let list = [...listino];
    if (filterCat) list = list.filter(x => x.cat === filterCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(x =>
        (x.nombre || "").toLowerCase().includes(q) ||
        (x.proveedor || "").toLowerCase().includes(q) ||
        (x.cat || "").toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const ca = (a.cat || "").localeCompare(b.cat || "");
      return ca !== 0 ? ca : (a.nombre || "").localeCompare(b.nombre || "");
    });
    return list;
  }, [listino, filterCat, search]);

  const counts = useMemo(() => {
    const c = {};
    listino.forEach(x => { c[x.cat] = (c[x.cat] || 0) + 1; });
    return c;
  }, [listino]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Header con tab switcher */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 4, background: "#f0f4f8", borderRadius: 10, padding: 4 }}>
          {[["listino","📦 Listino"],["comparativo","📊 Comparativo"]].map(([v,label]) => (
            <button key={v} onClick={() => setVistaTab(v)}
              style={{ padding: "6px 14px", borderRadius: 7, border: "none", cursor: "pointer",
                fontWeight: 700, fontSize: 12,
                background: vistaTab === v ? "#1a365d" : "transparent",
                color:      vistaTab === v ? "white" : "#718096" }}>
              {label}
            </button>
          ))}
        </div>
        <button onClick={openAddModal}
          style={{ padding: "8px 16px", background: "#276749", color: "white", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
          {t.listinoAgregar}
        </button>
        {isPro ? (
          <span style={{
            fontSize: 11, fontWeight: 700, borderRadius: 99, padding: "3px 10px",
            color: "#2b6cb0", background: "#ebf8ff", border: "1px solid #bee3f8",
          }}>
            ⚡ {listino.length} ítems · Pro ilimitado
          </span>
        ) : (
          <span style={{
            fontSize: 11, fontWeight: 700, borderRadius: 99, padding: "3px 10px",
            color:      listinoRestanti === 0 ? "#c53030" : "#276749",
            background: listinoRestanti === 0 ? "#fff5f5" : "#f0fff4",
            border:     `1px solid ${listinoRestanti === 0 ? "#fed7d7" : "#9ae6b4"}`,
          }}>
            {listinoRestanti === 0 ? "⚠️ Límite 20 ítems alcanzado" : `${listino.length}/20 ítems (Free)`}
          </span>
        )}
      </div>

      {/* ── Vista Comparativo Proveedores ─────────────────────────────────── */}
      {vistaTab === "comparativo" && (
        <ComparativoProveedores listino={listino} cats={cats} catColors={catColors} t={t} />
      )}

      {/* ── Vista Listino (originale) ─────────────────────────────────────── */}
      {vistaTab === "listino" && (<>

      {/* Barra filtri + ricerca */}
      <div style={{ background: "white", borderRadius: 12, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,.07)", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Ricerca */}
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#a0aec0" }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, proveedor, categoría..."
            style={{ width: "100%", padding: "9px 12px 9px 32px", border: "1.5px solid #e2e8f0",
              borderRadius: 9, fontSize: 12, color: "#1a365d", boxSizing: "border-box", outline: "none" }}
            onFocus={e => e.target.style.borderColor = "#2b6cb0"}
            onBlur={e  => e.target.style.borderColor = "#e2e8f0"}
          />
          {search && (
            <button onClick={() => setSearch("")}
              style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#a0aec0" }}>✕</button>
          )}
        </div>

        {/* Filtri categoria */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, alignItems: "center" }}>
          <button onClick={() => setFilterCat(null)}
            style={{ padding: "5px 13px", borderRadius: 99, fontSize: 11, fontWeight: 700,
              cursor: "pointer", border: "none",
              background: !filterCat ? "#1a365d" : "#f0f4f8",
              color: !filterCat ? "white" : "#718096" }}>
            Todos ({listino.length})
          </button>
          {cats.map((cat, i) => {
            const col = catColors[i % catColors.length];
            const active = filterCat === cat;
            return (
              <button key={cat} onClick={() => setFilterCat(active ? null : cat)}
                style={{ padding: "5px 13px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                  cursor: "pointer",
                  border: `1.5px solid ${active ? col : col + "55"}`,
                  background: active ? col + "22" : "white",
                  color: active ? col : "#718096",
                  outline: active ? `2px solid ${col}` : "none",
                  outlineOffset: 1 }}>
                {cat} {counts[cat] ? `(${counts[cat]})` : ""}
              </button>
            );
          })}
          {(filterCat || search) && (
            <button onClick={() => { setFilterCat(null); setSearch(""); }}
              style={{ marginLeft: "auto", padding: "5px 11px", borderRadius: 99, fontSize: 11,
                cursor: "pointer", border: "1px solid #fed7d7", background: "#fff5f5", color: "#c53030", fontWeight: 600 }}>
              ✕ Limpiar
            </button>
          )}
        </div>

        {/* Gestione categorie — collassabile */}
        <details style={{ borderTop: "1px solid #f0f4f8", paddingTop: 10 }}>
          <summary style={{ fontSize: 12, color: "#718096", cursor: "pointer", fontWeight: 600, userSelect: "none" }}>
            🏷️ {t.catPersonalizada} — {cats.length} categorías
          </summary>
          <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 10 }}>
            {cats.map((cat, i) => (
              <span key={cat} style={{
                padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                background: catColors[i % catColors.length] + "18",
                color: catColors[i % catColors.length],
                border: `1px solid ${catColors[i % catColors.length]}44`,
              }}>
                {cat}{i >= DEFAULT_CATS.length && " ✏️"}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input value={newCatName} onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && newCatName.trim()) { onAddCat(newCatName.trim()); setNewCatName(""); } }}
              placeholder={t.catNombrePlaceholder} aria-label={t.catAgregar}
              style={{ flex: 1, padding: "8px 11px", border: "2px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#1a365d" }}
            />
            <button onClick={() => { if (newCatName.trim()) { onAddCat(newCatName.trim()); setNewCatName(""); } }}
              style={{ padding: "8px 14px", background: "#2b6cb0", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}>
              {t.catAgregar}
            </button>
          </div>
        </details>
      </div>

      {/* Lista */}
      {listino.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 24px", color: "#a0aec0", background: "white", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <div style={{ fontWeight: 800, fontSize: 16, color: "#1a365d", marginBottom: 8 }}>Tu lista de precios está vacía</div>
          <div style={{ fontSize: 13, color: "#718096", maxWidth: 280, margin: "0 auto 20px", lineHeight: 1.6 }}>
            Agrega materiales con sus precios y proveedores para usarlos en cualquier presupuesto con un clic
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
            {["💰 Precio por unidad", "🏭 Proveedor", "📋 Insertar en partida"].map((s, i) => (
              <div key={i} style={{ background: "#ebf8ff", border: "1px solid #bee3f8", borderRadius: 8, padding: "6px 12px", fontSize: 11, color: "#2b6cb0", fontWeight: 600 }}>
                {i + 1}. {s}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: "#a0aec0" }}>👆 Usa <strong>+ Agregar ítem</strong> para empezar</div>
        </div>
      ) : listinoFiltrato.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#a0aec0", background: "white", borderRadius: 12 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
          <div style={{ fontWeight: 600 }}>Sin resultados</div>
        </div>
      ) : isMobile ? (
        /* Mobile: card con separatori categoria */
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {(() => {
            const rows = [];
            let lastCat = null;
            listinoFiltrato.forEach((item, i) => {
              if (!filterCat && item.cat !== lastCat) {
                lastCat = item.cat;
                const col = catColorMap[item.cat] || "#718096";
                rows.push(
                  <div key={`div-${item.cat}-${i}`}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0 2px" }}>
                    <div style={{ width: 4, height: 16, borderRadius: 2, background: col, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 800, color: col, textTransform: "uppercase", letterSpacing: .5 }}>{item.cat}</span>
                    <span style={{ fontSize: 10, color: "#a0aec0" }}>({counts[item.cat] || 0})</span>
                  </div>
                );
              }
              const mg = item.precioCliente > 0 && item.precioCompra > 0
                ? ((item.precioCliente - item.precioCompra) / item.precioCliente * 100) : null;
              rows.push(
                <div key={item.id}
                  style={{ background: "white", borderRadius: 10, padding: "10px 12px",
                    boxShadow: "0 1px 3px rgba(0,0,0,.06)", border: "1px solid #f0f4f8",
                    display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#1a365d", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.nombre}</div>
                    <div style={{ fontSize: 10, color: "#a0aec0", marginTop: 2 }}>
                      {item.unidad || "un"}{item.proveedor ? ` · ${item.proveedor}` : ""}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#276749" }}>{fmt(item.precioCliente || item.precio || 0)}</div>
                    {mg !== null && <span style={{ fontSize: 10, fontWeight: 700, color: mg > 20 ? "#276749" : mg > 10 ? "#b7791f" : "#c53030" }}>{fmtPct(mg)} mg</span>}
                  </div>
                  <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                    <button onClick={() => onAddFromListino(item)}
                      style={{ padding: "6px 10px", background: "#ebf8ff", border: "1px solid #bee3f8", borderRadius: 7, cursor: "pointer", color: "#2b6cb0", fontSize: 12, fontWeight: 700 }}>+</button>
                    <button onClick={() => openEditModal(item)}
                      style={{ padding: "6px 8px", background: "#fffff0", border: "1px solid #fefcbf", borderRadius: 7, cursor: "pointer", color: "#b7791f", fontSize: 11 }}>✏️</button>
                    <button onClick={() => onDeleteItem(item.id)}
                      style={{ padding: "6px 8px", background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 7, cursor: "pointer", color: "#c53030", fontSize: 11 }}>✕</button>
                  </div>
                </div>
              );
            });
            return rows;
          })()}
        </div>
      ) : (
        /* Desktop: tabella con separatori categoria */
        <div style={{ background: "white", borderRadius: 12, overflow: "auto", boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 580 }}>
            <thead>
              <tr style={{ background: "#1a365d", color: "white" }}>
                {[t.categoria, t.listinoNombre, t.unidad, "💸 " + t.precioCompra, "💰 " + t.precioCliente, "📈 Margen", "🏭 " + t.proveedor, ""].map((h, i) => (
                  <th key={i} style={{ padding: "9px 10px", textAlign: "left", fontWeight: 600, fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const rows = [];
                let lastCat = null;
                listinoFiltrato.forEach((item, i) => {
                  if (!filterCat && item.cat !== lastCat) {
                    lastCat = item.cat;
                    const col = catColorMap[item.cat] || "#718096";
                    rows.push(
                      <tr key={`sep-${item.cat}-${i}`}>
                        <td colSpan={8} style={{ padding: "10px 12px 4px", background: "#f7fafc", borderTop: i > 0 ? "2px solid #e2e8f0" : "none" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 4, height: 16, borderRadius: 2, background: col }} />
                            <span style={{ fontSize: 11, fontWeight: 800, color: col, textTransform: "uppercase", letterSpacing: .5 }}>{item.cat}</span>
                            <span style={{ fontSize: 10, color: "#a0aec0", background: col + "18", padding: "1px 8px", borderRadius: 99, border: `1px solid ${col}33` }}>
                              {counts[item.cat] || 0} voci
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                  const mg = item.precioCliente > 0 && item.precioCompra > 0
                    ? ((item.precioCliente - item.precioCompra) / item.precioCliente * 100) : null;
                  rows.push(
                    <tr key={item.id} style={{ background: i % 2 === 0 ? "#f7fafc" : "white" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#ebf8ff"}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#f7fafc" : "white"}>
                      <td style={{ padding: "7px 10px" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99,
                          background: (catColorMap[item.cat] || "#718096") + "18",
                          color: catColorMap[item.cat] || "#718096",
                          border: `1px solid ${(catColorMap[item.cat] || "#718096")}33` }}>
                          {item.cat}
                        </span>
                      </td>
                      <td style={{ padding: "7px 10px", fontWeight: 600, color: "#1a365d" }}>{item.nombre}</td>
                      <td style={{ padding: "7px 8px", color: "#718096" }}>{item.unidad || "—"}</td>
                      <td style={{ padding: "7px 10px", color: "#c05621", fontWeight: 600 }}>
                        {/* 2.10 Edit inline doppio click — precioCompra */}
                        {onUpdatePrecio && editingPrice?.id === item.id && editingPrice?.field === "precioCompra" ? (
                          <input autoFocus type="number" min={0}
                            value={editingPrice.value}
                            onChange={e => setEditingPrice(ep => ({ ...ep, value: e.target.value }))}
                            onBlur={() => { onUpdatePrecio(item.id, "precioCompra", +editingPrice.value); setEditingPrice(null); }}
                            onKeyDown={e => { if (e.key === "Enter") { onUpdatePrecio(item.id, "precioCompra", +editingPrice.value); setEditingPrice(null); } if (e.key === "Escape") setEditingPrice(null); }}
                            style={{ width: 90, padding: "3px 6px", border: "2px solid #c05621", borderRadius: 6, fontSize: 12, color: "#c05621", fontWeight: 700, textAlign: "right" }} />
                        ) : (
                          <span
                            onDoubleClick={() => onUpdatePrecio && setEditingPrice({ id: item.id, field: "precioCompra", value: item.precioCompra || 0 })}
                            title={onUpdatePrecio ? "Doble click para editar" : ""}
                            style={{ cursor: onUpdatePrecio ? "pointer" : "default", borderBottom: onUpdatePrecio ? "1px dashed #c05621" : "none" }}>
                            {item.precioCompra > 0 ? fmt(item.precioCompra) : "—"}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "7px 10px", color: "#276749", fontWeight: 700 }}>
                        {/* 2.10 Edit inline doppio click — precioCliente */}
                        {onUpdatePrecio && editingPrice?.id === item.id && editingPrice?.field === "precioCliente" ? (
                          <input autoFocus type="number" min={0}
                            value={editingPrice.value}
                            onChange={e => setEditingPrice(ep => ({ ...ep, value: e.target.value }))}
                            onBlur={() => { onUpdatePrecio(item.id, "precioCliente", +editingPrice.value); setEditingPrice(null); }}
                            onKeyDown={e => { if (e.key === "Enter") { onUpdatePrecio(item.id, "precioCliente", +editingPrice.value); setEditingPrice(null); } if (e.key === "Escape") setEditingPrice(null); }}
                            style={{ width: 90, padding: "3px 6px", border: "2px solid #276749", borderRadius: 6, fontSize: 12, color: "#276749", fontWeight: 700, textAlign: "right" }} />
                        ) : (
                          <span
                            onDoubleClick={() => onUpdatePrecio && setEditingPrice({ id: item.id, field: "precioCliente", value: item.precioCliente || item.precio || 0 })}
                            title={onUpdatePrecio ? "Doble click para editar" : ""}
                            style={{ cursor: onUpdatePrecio ? "pointer" : "default", borderBottom: onUpdatePrecio ? "1px dashed #276749" : "none" }}>
                            {item.precioCliente > 0 ? fmt(item.precioCliente) : item.precio > 0 ? fmt(item.precio) : "—"}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "7px 8px" }}>
                        {mg !== null ? (
                          <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                            background: mg > 20 ? "#f0fff4" : mg > 10 ? "#fffff0" : "#fff5f5",
                            color: mg > 20 ? "#276749" : mg > 10 ? "#b7791f" : "#c53030" }}>
                            {fmtPct(mg)}
                          </span>
                        ) : "—"}
                      </td>
                      <td style={{ padding: "7px 10px", color: "#718096", fontSize: 11 }}>{item.proveedor || "—"}</td>
                      <td style={{ padding: "7px 8px" }}>
                        <div style={{ display: "flex", gap: 5 }}>
                          <button onClick={() => onAddFromListino(item)}
                            style={{ padding: "4px 9px", background: "#ebf8ff", border: "1px solid #bee3f8",
                              borderRadius: 7, cursor: "pointer", color: "#2b6cb0", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                            + {t.costos || "Usar"}
                          </button>
                          <button onClick={() => openEditModal(item)} aria-label="Editar"
                            style={{ padding: "4px 8px", background: "#fffff0", border: "1px solid #fefcbf",
                              borderRadius: 7, cursor: "pointer", color: "#b7791f", fontSize: 11 }}>✏️</button>
                          <button onClick={() => onDeleteItem(item.id)} aria-label="Eliminar"
                            style={{ padding: "4px 8px", background: "#fff5f5", border: "1px solid #fed7d7",
                              borderRadius: 7, cursor: "pointer", color: "#c53030", fontSize: 11 }}>✕</button>
                        </div>
                      </td>
                    </tr>
                  );
                });
                return rows;
              })()}
            </tbody>
          </table>
        </div>
      )}
      </>)}{/* fine vistaTab === listino */}

      {/* ── Modal Agregar / Editar Listino ────────────────────────────────── */}
      {showModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ background:"white", borderRadius:14, padding:24, width:"100%", maxWidth:440, boxShadow:"0 8px 32px rgba(0,0,0,.2)" }}>
            <div style={{ fontWeight:800, fontSize:16, color:"#1a365d", marginBottom:16 }}>
              {isEditing ? "✏️ Editar item" : "➕ Agregar al listino"}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:"#4a5568", display:"block", marginBottom:3 }}>Nombre *</label>
                <input value={modalForm.nombre} onChange={e => setModalForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej: Cemento 25kg" autoFocus
                  style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:13, boxSizing:"border-box" }} />
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:11, fontWeight:600, color:"#4a5568", display:"block", marginBottom:3 }}>Categoría</label>
                  <select value={modalForm.cat} onChange={e => setModalForm(f => ({ ...f, cat: e.target.value }))}
                    style={{ width:"100%", padding:"9px 10px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:12 }}>
                    {cats.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ width:90 }}>
                  <label style={{ fontSize:11, fontWeight:600, color:"#4a5568", display:"block", marginBottom:3 }}>Unidad</label>
                  <select value={modalForm.unidad} onChange={e => setModalForm(f => ({ ...f, unidad: e.target.value }))}
                    style={{ width:"100%", padding:"9px 10px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:12 }}>
                    {["un","m²","m³","ml","kg","gl","hr","saco","bolsa","rollo","lt"].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:11, fontWeight:600, color:"#4a5568", display:"block", marginBottom:3 }}>Precio compra</label>
                  <input type="number" min="0" value={modalForm.precioCompra || ""} placeholder="$0"
                    onChange={e => setModalForm(f => ({ ...f, precioCompra: e.target.value }))}
                    style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:13, boxSizing:"border-box", textAlign:"right" }} />
                </div>
                <div style={{ flex:1 }}>
                  <label style={{ fontSize:11, fontWeight:600, color:"#4a5568", display:"block", marginBottom:3 }}>Precio cliente</label>
                  <input type="number" min="0" value={modalForm.precioCliente || ""} placeholder="$0"
                    onChange={e => setModalForm(f => ({ ...f, precioCliente: e.target.value }))}
                    style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:13, boxSizing:"border-box", textAlign:"right" }} />
                </div>
              </div>
              {/* Proveedor con autocomplete */}
              <div style={{ position:"relative" }}>
                <label style={{ fontSize:11, fontWeight:600, color:"#4a5568", display:"block", marginBottom:3 }}>
                  Proveedor {proveedores.length > 0 && <span style={{ color:"#a0aec0", fontWeight:400 }}>({proveedores.length} guardados)</span>}
                </label>
                <input value={modalForm.proveedor}
                  onChange={e => { setModalForm(f => ({ ...f, proveedor: e.target.value })); setShowProvSugg(true); }}
                  onFocus={() => setShowProvSugg(true)}
                  onBlur={() => setTimeout(() => setShowProvSugg(false), 150)}
                  placeholder="Escribe o selecciona un proveedor"
                  style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:13, boxSizing:"border-box" }} />
                {showProvSugg && provSuggFiltered.length > 0 && (
                  <div style={{ position:"absolute", top:"100%", left:0, right:0, background:"white", border:"1.5px solid #e2e8f0", borderTop:"none", borderRadius:"0 0 8px 8px", maxHeight:150, overflowY:"auto", zIndex:10, boxShadow:"0 4px 12px rgba(0,0,0,.1)" }}>
                    {provSuggFiltered.map(p => (
                      <div key={p}
                        onMouseDown={() => { setModalForm(f => ({ ...f, proveedor: p })); setShowProvSugg(false); }}
                        style={{ padding:"8px 12px", cursor:"pointer", fontSize:12, color:"#2d3748", borderBottom:"1px solid #f7fafc" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#ebf8ff"}
                        onMouseLeave={e => e.currentTarget.style.background = "white"}>
                        🏭 {p}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display:"flex", gap:8, marginTop:18, justifyContent:"flex-end" }}>
              <button onClick={() => setShowModal(false)}
                style={{ padding:"9px 18px", border:"1px solid #e2e8f0", borderRadius:8, background:"white", color:"#718096", cursor:"pointer", fontWeight:600, fontSize:13 }}>
                Cancelar
              </button>
              <button onClick={handleModalSave} disabled={!modalForm.nombre.trim()}
                style={{ padding:"9px 22px", border:"none", borderRadius:8, background: modalForm.nombre.trim() ? "#276749" : "#e2e8f0", color: modalForm.nombre.trim() ? "white" : "#a0aec0", cursor: modalForm.nombre.trim() ? "pointer" : "default", fontWeight:700, fontSize:13 }}>
                {isEditing ? "Guardar cambios" : "Agregar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── TabStorico ───────────────────────────────────────────────────────────────
export function TabStorico({ proyectos, t, isPro = false, filterByHistorial, onPaywall }) {
  const [search, setSearch] = useState("");

  // Filtra storico per piano: Free = ultimi 30gg (da usePlan), Pro = illimitato
  const proyectosFiltrati = useMemo(() => {
    if (isPro || !filterByHistorial) return proyectos;
    return filterByHistorial(proyectos, p => p.info?.fecha || p.updatedAt || "");
  }, [proyectos, isPro, filterByHistorial]);

  const storicoMat = useMemo(() => Object.values(
    proyectosFiltrati.reduce((acc, proj) => {
      (proj.partidas || []).forEach(p => {
        if (!p.nombre?.trim()) return;
        const k = p.nombre.toLowerCase().trim();
        if (!acc[k]) acc[k] = { nombre: p.nombre, cantTotal: 0, ultimoPrecio: 0, proveedor: "", projs: new Set(), compras: [] };
        acc[k].cantTotal += p.cant || 0;
        if ((p.pu || 0) > 0) {
          acc[k].ultimoPrecio = p.pu;
          acc[k].compras.push({ pu: p.pu, proveedor: p.proveedor || "", fecha: proj.info?.fecha || "", proj: proj.info?.cliente || t.sinNombre });
        }
        if (p.proveedor) acc[k].proveedor = p.proveedor;
        acc[k].projs.add(proj.info?.cliente || t.sinNombre);
      });
      return acc;
    }, {})
  ).map(m => ({ ...m, projs: Array.from(m.projs), compras: m.compras.slice(-5).reverse() }))
   .sort((a, b) => b.cantTotal - a.cantTotal).slice(0, 60), [proyectosFiltrati, t]);

  const filtered = useMemo(() => {
    if (!search.trim()) return storicoMat;
    const q = search.toLowerCase();
    return storicoMat.filter(m =>
      m.nombre.toLowerCase().includes(q) ||
      (m.proveedor || "").toLowerCase().includes(q)
    );
  }, [storicoMat, search]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: "linear-gradient(135deg,#1a365d,#2d3748)", borderRadius: 12, padding: "18px 20px", color: "white" }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 3 }}>📈 {t.storicoTitulo}</div>
        <div style={{ color: "#a0aec0", fontSize: 12 }}>{t.storicoDesc}</div>
      </div>
      {/* 4.1 Banner storico limitato nel Free */}
      {!isPro && (
        <div style={{ background: "#fffff0", border: "1px solid #f6e05e", borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>⏳</span>
            <span style={{ fontSize: 12, color: "#744210", fontWeight: 700 }}>
              Plan Free — histórico limitado a los últimos 30 días
            </span>
          </div>
          <button onClick={() => onPaywall?.("maxProyectos")}
            style={{ padding: "5px 14px", background: "#b7791f", color: "white", border: "none", borderRadius: 7, cursor: "pointer", fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
            Ver Pro →
          </button>
        </div>
      )}
      {/* Barra ricerca */}
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#a0aec0" }}>🔍</span>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar material o proveedor..."
          style={{ width: "100%", padding: "10px 12px 10px 34px", border: "1.5px solid #e2e8f0",
            borderRadius: 10, fontSize: 12, color: "#1a365d", boxSizing: "border-box",
            background: "white", outline: "none" }}
        />
        {search && (
          <button onClick={() => setSearch("")}
            style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#a0aec0" }}>✕</button>
        )}
      </div>
      {storicoMat.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 24px", color: "#a0aec0", background: "white", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📈</div>
          <div style={{ fontWeight: 800, fontSize: 16, color: "#1a365d", marginBottom: 8 }}>Sin historial aún</div>
          <div style={{ fontSize: 13, color: "#718096", maxWidth: 300, margin: "0 auto 16px", lineHeight: 1.6 }}>
            El historial se genera automáticamente a medida que creas presupuestos. Aquí verás precios históricos y proveedores de cada material.
          </div>
          <div style={{ fontSize: 12, color: "#a0aec0" }}>Crea tu primer proyecto para empezar a construir el historial</div>
        </div>
      ) : filtered.map((m, i) => (
        <div key={i} style={{ background: "white", borderRadius: 11, padding: "14px 18px", boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1a365d" }}>{m.nombre}</div>
              <div style={{ fontSize: 11, color: "#718096", marginTop: 2 }}>
                {m.proveedor && <span style={{ marginRight: 10 }}>🏭 {m.proveedor}</span>}
                <span>📁 {m.projs.length} {t.storicoProyectos}</span>
              </div>
            </div>
            {m.ultimoPrecio > 0 && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#276749" }}>{fmt(m.ultimoPrecio)}</div>
                <div style={{ fontSize: 10, color: "#a0aec0" }}>{t.ultimoPrecio}</div>
              </div>
            )}
          </div>
          {m.compras.length > 1 && (
            <div style={{ borderTop: "1px solid #f7fafc", paddingTop: 7, marginTop: 4 }}>
              <div style={{ fontSize: 10, color: "#718096", fontWeight: 600, marginBottom: 5 }}>{t.storicoCompras}:</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {m.compras.map((c, j) => (
                  <div key={j} style={{ padding: "4px 9px", background: "#f7fafc", borderRadius: 7, fontSize: 10 }}>
                    <span style={{ fontWeight: 700, color: "#2d3748" }}>{fmt(c.pu)}</span>
                    {c.proveedor && <span style={{ color: "#718096", marginLeft: 4 }}>· {c.proveedor}</span>}
                    {c.fecha && <span style={{ color: "#a0aec0", marginLeft: 4 }}>· {c.fecha}</span>}
                  </div>
                ))}
              </div>
              {(() => {
                const prices = m.compras.map(x => x.pu).filter(x => x > 0);
                if (prices.length < 2) return null;
                const trend = prices[0] - prices[prices.length - 1];
                return trend !== 0 && (
                  <div style={{ marginTop: 5, fontSize: 10, fontWeight: 700, color: trend < 0 ? "#276749" : "#c53030" }}>
                    {trend < 0 ? t.bajoPrice : t.subioPrice} {fmt(Math.abs(trend))} {t.vsPrimeraCompra}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── TabHelp ──────────────────────────────────────────────────────────────────
export function TabHelp({ t }) {

  // ── Componente separatore sezione ────────────────────────────────────────
  const Divider = ({ label }) => (
    <div style={{ display:"flex",alignItems:"center",gap:12,margin:"8px 0 4px" }}>
      <div style={{ flex:1,height:2,background:"linear-gradient(90deg,#1a365d,#e2e8f0)",borderRadius:99 }} />
      <span style={{ fontSize:11,fontWeight:800,color:"#1a365d",letterSpacing:1,whiteSpace:"nowrap",textTransform:"uppercase" }}>{label}</span>
      <div style={{ flex:1,height:2,background:"linear-gradient(270deg,#1a365d,#e2e8f0)",borderRadius:99 }} />
    </div>
  );

  // ── Componente card aiuto ─────────────────────────────────────────────────
  const HelpCard = ({ icon, title, desc, items, tip }) => (
    <div style={{ background:"white",borderRadius:12,padding:"16px 18px",boxShadow:"0 1px 4px rgba(0,0,0,.07)",display:"flex",flexDirection:"column",gap:8 }}>
      <div style={{ display:"flex",alignItems:"center",gap:10 }}>
        <span style={{ fontSize:26,flexShrink:0 }}>{icon}</span>
        <div style={{ fontWeight:800,fontSize:14,color:"#1a365d" }}>{title}</div>
      </div>
      {desc && <div style={{ fontSize:12,color:"#4a5568",lineHeight:1.6 }}>{desc}</div>}
      {items && (
        <div style={{ display:"flex",flexDirection:"column",gap:5,marginTop:2 }}>
          {items.map(([label, detail], i) => (
            <div key={i} style={{ display:"flex",gap:8,alignItems:"flex-start",padding:"6px 10px",background:"#f7fafc",borderRadius:8 }}>
              <span style={{ fontSize:11,fontWeight:700,color:"#2b6cb0",flexShrink:0,minWidth:24 }}>→</span>
              <div>
                <span style={{ fontSize:12,fontWeight:700,color:"#2d3748" }}>{label}: </span>
                <span style={{ fontSize:12,color:"#718096" }}>{detail}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {tip && (
        <div style={{ background:"#fffaf0",border:"1px solid #fbd38d",borderRadius:8,padding:"7px 11px",fontSize:11,color:"#b7791f",display:"flex",gap:6 }}>
          <span>💡</span><span>{tip}</span>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ maxWidth:760,margin:"0 auto",display:"flex",flexDirection:"column",gap:10 }}>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#1a365d,#2d3748)",borderRadius:14,padding:"24px 28px",color:"white" }}>
        <div style={{ fontSize:22,fontWeight:800,marginBottom:5 }}>❓ {t.helpTitulo}</div>
        <div style={{ color:"#a0aec0",fontSize:13 }}>{t.helpBienvenida}</div>
        <div style={{ color:"#90cdf4",fontSize:12,marginTop:6 }}>
          Guía completa de todas las secciones — léela una vez y tendrás todo claro.
        </div>
      </div>

      {/* ─── FLUJO BÁSICO ─────────────────────────────────────────────── */}
      <Divider label="Flujo básico" />

      <HelpCard icon="📋" title="1. Proyecto — datos generales"
        desc="Aquí defines toda la información del proyecto: cliente, descripción, dirección, fechas y condiciones de pago."
        items={[
          ["Cliente / Propietario", "Nombre completo del cliente o empresa"],
          ["Fechas estimadas", "Inicio y término ayudan a calcular plazos en el PDF"],
          ["Validez", "Días que tiene vigencia el presupuesto antes de vencer"],
          ["Condición de pago", "Contado, cuotas, crédito o personalizado — aparece en el PDF"],
          ["Estado", "Cambia el estado (Borrador → Enviado → Aceptado) desde la barra superior"],
        ]}
        tip="Guarda automáticamente cada vez que modificas un campo — el indicador 'Guardado ✓' lo confirma."
      />

      <HelpCard icon="🏗️" title="2. Costos directos — partidas"
        desc="Ingresa todas las partidas de la obra. Cada fila es un ítem de costo con categoría, descripción, unidad, cantidad y precio."
        items={[
          ["Categoría", "Agrupa los ítems (Materiales, Mano de obra, Subcontratos...) — puedes crear categorías propias"],
          ["Unidad", "m², m³, ml, kg, un, hr, etc."],
          ["Precio unitario", "Puedes buscar el precio en MercadoLibre directamente con el botón 🛒"],
          ["👁️ Visibilidad", "Oculta partidas que no quieres mostrar al cliente en el PDF"],
          ["Proveedor / Nota interna", "Campos opcionales visibles con el botón '▼ Más'"],
        ]}
        tip="Filtra por categoría para trabajar más rápido en obras grandes. El total se calcula automáticamente en tiempo real."
      />

      <HelpCard icon="📊" title="3. Resumen — márgenes y porcentajes"
        desc="Configura los porcentajes de overhead y utilidad. El sistema calcula todo automáticamente sobre los costos directos."
        items={[
          ["CI — Costos Indirectos", "Gastos de administración, herramientas, transporte (ej. 10%)"],
          ["GF — Gastos Fijos", "Arriendos, sueldos fijos, seguros de la empresa (ej. 5%)"],
          ["Imprevistos", "Margen de seguridad para imprevistos en obra (ej. 5%)"],
          ["Utilidad", "Tu margen de ganancia sobre el subtotal (ej. 20%)"],
          ["IVA 19%", "Actívalo con el toggle — aparece desglosado en el PDF"],
        ]}
        tip="Un margen total sobre el 15% es saludable. Si está en rojo, revisa tus costos directos o sube la utilidad."
      />

      <HelpCard icon="🖨️" title="4. Vista Cliente — PDF y firma"
        desc="Configura qué ve el cliente en el presupuesto antes de imprimir o enviar para firma digital."
        items={[
          ["Visibilidad por categoría", "Activa/desactiva cada categoría — el cliente solo ve las activas"],
          ["Detalle vs Solo total", "Elige si el cliente ve el desglose de ítems o solo el total por categoría"],
          ["Firma digital", "Genera un enlace que el cliente puede abrir desde su celular para firmar"],
          ["Imprimir PDF", "Usa el botón 🖨️ del header — se imprime solo la vista cliente, sin controles"],
        ]}
        tip="Oculta los costos de materiales y muestra solo el total por categoría para presupuestos más 'limpios'."
      />

      {/* ─── SECCIONES CORE ───────────────────────────────────────────── */}
      <Divider label="Secciones principales" />

      <HelpCard icon="📦" title="Lista de Precios — tu catálogo de materiales"
        desc="Guarda materiales con precio de compra, precio al cliente y margen calculado automáticamente. Reutilízalos en cualquier proyecto."
        items={[
          ["Agregar material", "Botón '+ Agregar' — ingresa nombre, categoría, unidad y precios"],
          ["Precio compra vs cliente", "El margen % se calcula solo: (cliente - compra) / cliente"],
          ["Buscar precio ML", "Botón 🛒 dentro del formulario — busca en MercadoLibre y usa el precio"],
          ["Usar en proyecto", "Botón '+ Costos' en cada fila — agrega el material directo a las partidas"],
          ["Categorías", "Comparte las mismas categorías que los costos directos"],
        ]}
        tip="Mantén el listino actualizado con los precios reales — así los presupuestos futuros serán más precisos."
      />

      <HelpCard icon="🏭" title="Bodega — gestión de stock"
        desc="Controla el inventario de materiales en obra: stock actual, stock mínimo y alertas automáticas cuando hay que reponer."
        items={[
          ["Nuevo artículo", "Define nombre, categoría, unidad, stock actual y stock mínimo"],
          ["Stock mínimo", "Cuando el stock baja de este valor aparece ⚠️ y una alerta roja en el panel"],
          ["Registrar movimiento 🔄", "Carga (entrada), Descarga (salida), Transferencia o Rectificación"],
          ["Valor bodega", "Stock × precio/unidad — visible en el KPI superior"],
          ["Filtros", "Filtra por categoría o usa '⚠️ Solo alertas' para ver solo lo que falta"],
        ]}
        tip="Vincula los movimientos de descarga a un proyecto específico para tener trazabilidad completa."
      />

      <HelpCard icon="📈" title="Histórico de Materiales"
        desc="Registro automático de todos los materiales usados en todos los proyectos, con evolución de precios."
        items={[
          ["Última compra", "Precio más reciente pagado por ese material"],
          ["Tendencia", "📈 Subió / 📉 Bajó vs primera compra registrada"],
          ["Cotizaciones", "En cuántas cotizaciones apareció ese material"],
          ["Últimas compras", "Historial de las últimas 5 compras con fecha y proveedor"],
        ]}
        tip="Útil para detectar inflación en materiales específicos y ajustar presupuestos futuros."
      />

      <HelpCard icon="🧾" title="Facturas — facturación a clientes"
        desc="Convierte presupuestos aceptados en facturas. Gestiona cobros, fechas de vencimiento y estado de pago."
        items={[
          ["Crear factura", "Solo desde presupuestos con estado Aceptado"],
          ["Estados", "⏳ Pendiente → ✅ Pagada — cambia con un clic"],
          ["Vencimiento", "Si pasa la fecha sin marcar como pagada aparece 🔴 Vencida"],
          ["PDF factura", "Botón 🖨️ en cada fila — genera PDF listo para enviar al cliente"],
        ]}
        tip="Revisa el panel superior para ver el total cobrado vs pendiente en tiempo real."
      />

      <HelpCard icon="🇨🇱" title="SII — Documentos Tributarios Electrónicos"
        desc="Genera el XML del DTE a partir de los presupuestos aceptados para cargar directamente en el portal del SII."
        items={[
          ["Tipos de DTE", "33 Factura, 39 Boleta, 61 Nota de Crédito, 56 Nota de Débito"],
          ["Folio", "Número correlativo del documento — debes llevar el control tú mismo"],
          ["RUT receptor", "RUT del cliente en formato 12345678-9"],
          ["Descargar XML", "Descarga el archivo y súbelo manualmente en mipyme.sii.cl"],
          ["Historial", "Todos los DTE generados quedan guardados con fecha y cliente"],
        ]}
        tip="El XML generado es un borrador — debes completar RUT emisor y CAF real antes de enviar al SII."
      />

      {/* ─── HERRAMIENTAS ─────────────────────────────────────────────── */}
      <Divider label="Herramientas" />

      <HelpCard icon="🔍" title="Búsqueda global — Ctrl+K"
        desc="Busca en todos los proyectos, clientes y materiales al mismo tiempo. Abre con Ctrl+K o el botón 🔍 del header."
        items={[
          ["Buscar cliente", "Encuentra proyectos por nombre de cliente"],
          ["Buscar material", "Encuentra proyectos que contienen una partida específica"],
          ["Clic en resultado", "Abre directamente el proyecto seleccionado"],
        ]}
      />

      <HelpCard icon="📸" title="Fotos con GPS"
        desc="Agrega fotos a cada proyecto. Al agregar una foto se guarda automáticamente la ubicación GPS."
        items={[
          ["Badge 📍", "Aparece en cada foto con GPS — clic para abrir en Google Maps"],
          ["Galería global", "Ve todas las fotos de todos los proyectos desde la tab Galería"],
          ["PDF", "Controla qué fotos aparecen en el PDF con el toggle 📄 ON/OFF"],
        ]}
      />

      <HelpCard icon="👥" title="Multi-usuario — workspace"
        desc="Invita a colaboradores a tu workspace. Cada uno tiene su rol con permisos diferentes."
        items={[
          ["Admin", "Acceso total — puede invitar, editar y eliminar"],
          ["Editor", "Puede crear y editar proyectos"],
          ["Viewer", "Solo lectura — ve los proyectos pero no puede modificar"],
          ["Invitar", "Desde ⚙️ Ajustes → ingresa el email del colaborador"],
        ]}
      />

    </div>
  );
}
