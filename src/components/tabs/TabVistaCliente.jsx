// ─── components/tabs/TabVistaCliente.jsx ─────────────────────────────────────
import { useMemo, useState } from "react";
import { usePDFSettings } from "./TabSettings";
import { fmt, calcTotals } from "../../utils/helpers";
import { CAT_COLORS, EMPRESA, ESTADO_COLORS, ESTADO_BG } from "../../utils/constants";
import { LOGO_URL } from "../../utils/logo";

const CC = CAT_COLORS;

export default function TabVistaCliente({ info, partidas, pct, cats, catVis = {}, setCatVisKey, iva, estado, currentId, validez, t, onInviaFirma, firme = [], fotos = [], plan = "free", trialEndsAt = null, onTrackPdf, descuento = { tipo: "pct", valor: 0, descripcion: "" }, setDescuento, aiRenders = [], workspaceId, onShowBenchmark }) {
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
      const stored = catVis?.[p.cat];
      if (!stored || typeof stored !== "object") return stored !== false;
      return stored.visible !== false;
    });
  }, [partidas, catVis]);
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
            const stored = catVis?.[cat];
            const cv = (!stored || typeof stored !== "object")
              ? { visible: stored !== false, modo: "detalle" }
              : { visible: stored.visible !== false, modo: stored.modo || "detalle" };
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
            {/* QR code */}
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
            const stored = catVis?.[cat];
            const cv = (!stored || typeof stored !== "object")
              ? { visible: stored !== false, modo: "detalle" }
              : { visible: stored.visible !== false, modo: stored.modo || "detalle" };
            if (!cv.visible) return null;
            const vis = clientPartidas.filter(p => p.cat === cat);
            if (!vis.length) return null;
            const catTotal = vis.reduce((s, p) => s + p.cant * p.pu, 0);
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

        {/* Firma digitale */}
        {pdf.mostraFirma && firme && firme.filter(f => f.stato==="firmato").length > 0 && (
          <div className="print-block" style={{ marginBottom:16,padding:"14px 16px",background:"#f0fff4",borderRadius:9,border:"1px solid #9ae6b4" }}>
            <div style={{ fontWeight:700,fontSize:12,color:"#276749",marginBottom:10 }}>✍️ Firma digital del cliente</div>
            {firme.filter(f => f.stato==="firmato").map((f,i) => (
              <div key={i} style={{ display:"flex",alignItems:"flex-start",gap:16,flexWrap:"wrap" }}>
                {f.firmaImmagine && (
                  <div style={{ border:"1px solid #9ae6b4",borderRadius:8,padding:"6px 12px",background:"white",flexShrink:0 }}>
                    <img src={f.firmaImmagine} alt="Firma cliente" style={{ height:64,maxWidth:220,objectFit:"contain",display:"block" }} />
                  </div>
                )}
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
