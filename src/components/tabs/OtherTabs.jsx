// ─── components/tabs/OtherTabs.jsx ───────────────────────────────────────────
import { useMemo, useState, useEffect, useRef } from "react";
import { PieChart } from "../UI";
import { usePDFSettings } from "./TabSettings";
import { fmt, fmtPct, calcTotals, calcProjectTotal } from "../../utils/helpers";
import { CAT_COLORS, EMPRESA, LOGO_URL, ESTADO_COLORS, ESTADO_BG } from "../../utils/constants";

const CC = CAT_COLORS;

export function TabResumen({ partidas, pct, cats, iva, t }) {
  const totals = useMemo(() => calcTotals(partidas, pct), [partidas, pct]);
  const { cd, ci, gf, imprevistos: imprev, sub, util, total, iva: ivaAmt, totalIva } = totals;
  const margen = total > 0 ? (util / total) * 100 : 0;

  const pieData = useMemo(() => cats
    .map((cat, i) => ({
      label: cat, color: CAT_COLORS[i % CAT_COLORS.length],
      value: partidas.filter(p => p.cat === cat).reduce((s, p) => s + p.cant * p.pu, 0),
    }))
    .filter(d => d.value > 0), [cats, partidas]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
      {/* Desglose */}
      <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d", marginBottom: 12, borderBottom: "2px solid #ebf8ff", paddingBottom: 7 }}>
          📊 {t.desglosePresup}
        </div>
        {[
          { l: t.costosDirectos,                           v: cd,    c: "#2b6cb0" },
          { l: `${t.costosIndirectos} (${pct.ci}%)`,       v: ci,    c: "#276749" },
          { l: `${t.gastosFijos} (${pct.gf}%)`,            v: gf,    c: "#c05621" },
          { l: `${t.imprevistos} (${pct.imprevistos}%)`,   v: imprev,c: "#b7791f" },
          { l: t.subtotal || "Subtotal",                   v: sub,   c: "#2d3748", bold: true },
          { l: `${t.utilidad} (${pct.utilidad}%)`,         v: util,  c: "#553c9a" },
          { l: t.totalProyecto,                            v: total, c: "#1a365d", bold: true, big: true },
        ].map(r => (
          <div key={r.l} style={{
            display: "flex", justifyContent: "space-between",
            padding: r.big ? "11px" : "7px 3px",
            borderTop: r.big ? "2px solid #e2e8f0" : r.bold ? "1px solid #e2e8f0" : "none",
            background: r.big ? "#ebf8ff" : "transparent",
            borderRadius: r.big ? 8 : 0,
          }}>
            <span style={{ fontSize: r.big ? 14 : 12, color: r.c, fontWeight: r.bold || r.big ? 700 : 400 }}>{r.l}</span>
            <span style={{ fontSize: r.big ? 15 : 13, color: r.c, fontWeight: r.bold || r.big ? 800 : 600 }}>{fmt(r.v)}</span>
          </div>
        ))}
        {iva && <>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 3px", borderTop: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: 12, color: "#c05621" }}>IVA 19%</span>
            <span style={{ fontSize: 13, color: "#c05621", fontWeight: 600 }}>{fmt(ivaAmt)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: 11, background: "#1a365d", borderRadius: 8, marginTop: 4 }}>
            <span style={{ fontSize: 14, color: "white", fontWeight: 800 }}>TOTAL {t.conIVA}</span>
            <span style={{ fontSize: 16, color: "white", fontWeight: 900 }}>{fmt(totalIva)}</span>
          </div>
        </>}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Análisis margen */}
        <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d", marginBottom: 12, borderBottom: "2px solid #ebf8ff", paddingBottom: 7 }}>
            📈 {t.analisisMargen}
          </div>
          {[
            { l: t.costoNeto,       v: fmt(cd),                c: "#2b6cb0" },
            { l: t.margenPartidas,  v: fmt(util),              c: "#276749" },
            { l: t.totalCliente,    v: fmt(iva ? totalIva : total), c: "#1a365d" },
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
      </div>
    </div>
  );
}

// ─── TabVistaCliente ──────────────────────────────────────────────────────────

export function TabVistaCliente({ info, partidas, pct, cats, catVis, getCatVis, setCatVisKey, iva, estado, currentId, validez, t, onInviaFirma, firme = [], fotos = [], plan = "free" }) {
  const pdf = usePDFSettings();
  const isPro = plan === "pro" || plan === "team" || plan === "enterprise";
  const logoEffettivo = isPro && pdf.logoUrl ? pdf.logoUrl : LOGO_URL;
  const totals = useMemo(() => calcTotals(partidas, pct), [partidas, pct]);
  const { cd, ci, gf, imprevistos: imprev, sub, util, total, iva: ivaAmt, totalIva } = totals;

  const venceDate = info.fecha
    ? new Date(new Date(info.fecha).getTime() + validez * 86400000).toLocaleDateString("es-CL")
    : "—";

  return (
    <div>
      {/* ── Pannello Compartir ───────────────────────────────────────────────── */}
      <div className="no-print" style={{ background:"white",borderRadius:12,padding:"14px 18px",marginBottom:14,boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
        <div style={{ fontWeight:700,fontSize:13,color:"#1a365d",marginBottom:12 }}>📤 Compartir presupuesto</div>
        <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>

          {/* PDF */}
          <button onClick={() => window.print()}
            style={{ flex:1,minWidth:140,padding:"11px 14px",background:"#2b6cb0",color:"white",border:"none",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
            🖨️ Descargar PDF
          </button>

          {/* WhatsApp + PDF: descarga PDF primero, luego abre WA con link */}
          {info.telefono && (() => {
            const total = iva ? totals.totalIva : totals.total;
            const num = (info.telefono||"").replace(/[\s\-\+\(\)]/g,"");
            const norm = num ? (num.startsWith("56")?num:num.startsWith("9")?`56${num}`:`569${num}`) : "";
            const msgWA = `Hola ${info.cliente||""}👋\n\nTe adjunto el presupuesto para *${info.descripcion||"tu proyecto"}*.\n\n💰 *Total: $${total.toLocaleString("es-CL")} CLP*${iva?" (IVA inc.)":""}\n\n📄 _(Revisa el PDF adjunto con el detalle completo)_\n\n_${info.empresa||"Obra Nova"}_`;
            const waUrl = `https://wa.me/${norm}?text=${encodeURIComponent(msgWA)}`;
            return (
              <button
                onClick={() => { window.print(); setTimeout(() => window.open(waUrl,"_blank","noopener,noreferrer"), 800); }}
                style={{ flex:1,minWidth:140,padding:"11px 14px",background:"#25D366",color:"white",border:"none",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
                💬 WA + PDF
              </button>
            );
          })()}

          {/* Solo WhatsApp testo */}
          {info.telefono && (() => {
            const total = iva ? totals.totalIva : totals.total;
            const num = (info.telefono||"").replace(/[\s\-\+\(\)]/g,"");
            const norm = num ? (num.startsWith("56")?num:num.startsWith("9")?`56${num}`:`569${num}`) : "";
            const msgSimple = `Hola ${info.cliente||""}👋\n\nTe enviamos el presupuesto para *${info.descripcion||"tu proyecto"}* por *$${total.toLocaleString("es-CL")} CLP*${iva?" (IVA inc.)":""}.\n\nConsúltanos cualquier duda.\n\n_${info.empresa||"Obra Nova"}_`;
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
              onClick={() => { const url = `${window.location.origin}/firma/${currentId}`; navigator.clipboard?.writeText(url).then(() => {}).catch(()=>{}); window.open(`https://wa.me/?text=${encodeURIComponent(`Hola! Aquí puedes ver tu presupuesto en línea: ${url}`)}`, "_blank"); }}
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
        <div className="no-print" style={{ background: "linear-gradient(135deg,#276749,#38a169)", borderRadius: 12, padding: "14px 18px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: 14 }}>✍️ Firma digitale</div>
            <div style={{ color: "rgba(255,255,255,.75)", fontSize: 12, marginTop: 2 }}>
              {firme.length > 0
                ? `${firme.filter(f => f.stato === "firmato").length} firmato · ${firme.filter(f => f.stato === "pending").length} in attesa`
                : "Invia il preventivo al cliente per la firma digitale"}
            </div>
          </div>
          <button onClick={onInviaFirma}
            style={{ padding: "9px 18px", background: "white", color: "#276749", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
            📨 Invia per firma
          </button>
        </div>
      )}

      {/* Controles de visibilidad */}
      <div className="no-print" style={{ background: "white", borderRadius: 12, padding: 16, marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#1a365d", marginBottom: 10 }}>⚙️ {t.visTitulo}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {cats.map((cat, i) => {
            const cv = getCatVis(cat);
            return (
              <div key={cat} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", background: "#f7fafc", borderRadius: 9, border: `1px solid ${cv.visible ? CC[i % CC.length] + "44" : "#e2e8f0"}` }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#2d3748" }}>{cat}</span>
                <button
                  onClick={() => setCatVisKey(cat, "visible", !cv.visible)}
                  style={{ padding: "3px 9px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, background: cv.visible ? "#276749" : "#e2e8f0", color: cv.visible ? "white" : "#718096" }}
                  aria-label={cv.visible ? t.visCatOcultar : t.visCatMostrar}
                >{cv.visible ? t.visCatMostrar : t.visCatOcultar}</button>
                {cv.visible && (
                  <button
                    onClick={() => setCatVisKey(cat, "modo", cv.modo === "detalle" ? "macro" : "detalle")}
                    style={{ padding: "3px 9px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, background: "#ebf8ff", color: "#2b6cb0" }}
                  >{cv.modo === "detalle" ? t.visDetalle : t.visMacro}</button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Print area */}
      <div id="print-area" style={{ background: "white", padding: "28px 24px", maxWidth: 800, margin: "0 auto", borderRadius: 12, boxShadow: "0 1px 8px rgba(0,0,0,.08)" }}>
        {/* Header empresa */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, paddingBottom: 14, borderBottom: "3px solid #1a365d" }}>
          <div>
            <img src={logoEffettivo} alt="" style={{ height: 46, marginBottom: 5, maxWidth: 180, objectFit: "contain" }} onError={e => { e.target.style.display = "none"; }} />
            <div style={{ fontWeight: 800, fontSize: 17, color: "#1a365d" }}>{EMPRESA.nombre}</div>
            <div style={{ fontSize: 10, color: "#718096" }}>RUT {EMPRESA.rut} · {EMPRESA.giro}</div>
            <div style={{ fontSize: 10, color: "#718096" }}>{EMPRESA.direccion}, {EMPRESA.ciudad} · 📞 {EMPRESA.telefono}</div>
            <div style={{ fontSize: 10, color: "#718096" }}>✉ {EMPRESA.email}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ background: ESTADO_BG[estado], color: ESTADO_COLORS[estado], padding: "5px 14px", borderRadius: 99, fontWeight: 700, fontSize: 12, marginBottom: 6, display: "inline-block" }}>
              {t[estado?.toLowerCase()] || estado}
            </div>
            <div style={{ fontSize: 11, color: "#718096" }}>N° {currentId?.slice(-6) || "—"}</div>
            <div style={{ fontSize: 11, color: "#718096" }}>{info.fecha}</div>
            <div style={{ fontSize: 10, color: "#a0aec0" }}>{t.vence}: {venceDate}</div>
          </div>
        </div>

        {/* Cliente + Obra */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 18 }}>
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
        <div style={{ marginBottom: 18 }}>
          {cats.map((cat, ci) => {
            const cv = getCatVis(cat);
            if (!cv.visible) return null;
            const vis = partidas.filter(p => p.cat === cat && p.visible && p.cant * p.pu > 0);
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 18 }}>
          <div style={{ background: "#f7fafc", borderRadius: 9, padding: "12px 14px", fontSize: 11 }}>
            <div style={{ fontWeight: 700, marginBottom: 7, color: "#1a365d", fontSize: 12 }}>{t.desgloseFinanciero}</div>
            {[
              [`CI ${pct.ci}%`, ci], [`GF ${pct.gf}%`, gf],
              [`Imprevistos ${pct.imprevistos}%`, imprev],
              [t.subtotal || "Subtotal", sub, true],
              [`${t.utilidad} ${pct.utilidad}%`, util],
              ["TOTAL s/IVA", total, true],
            ].map(([l, v, b]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderTop: b ? "1px solid #e2e8f0" : "none", fontWeight: b ? 700 : 400 }}>
                <span style={{ color: b ? "#1a365d" : "#718096" }}>{l}</span>
                <span style={{ color: b ? "#1a365d" : "#4a5568" }}>{fmt(v)}</span>
              </div>
            ))}
            {iva && <>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
                <span style={{ color: "#c05621" }}>IVA 19%</span>
                <span style={{ color: "#c05621" }}>{fmt(ivaAmt)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: "#1a365d", borderRadius: 7, marginTop: 5 }}>
                <span style={{ color: "white", fontWeight: 800, fontSize: 13 }}>TOTAL {t.conIVA}</span>
                <span style={{ color: "white", fontWeight: 900, fontSize: 13 }}>{fmt(totalIva)}</span>
              </div>
            </>}
          </div>
        </div>

        {/* Condiciones de pago */}
        {pdf.mostraCondPago && info.condPago && (
          <div className="print-block" style={{ marginBottom:16,padding:"12px 16px",background:"#f7fafc",borderRadius:9,border:`1px solid ${pdf.colorPrimario}22` }}>
            <div style={{ fontWeight:700,fontSize:12,color:pdf.colorPrimario,marginBottom:6 }}>💳 Condiciones de pago</div>
            <div style={{ fontSize:12,color:"#4a5568" }}>
              {info.condPago === "personalizado" ? (info.condPagoPersonalizado || "—") : info.condPago}
            </div>
            {info.cuotas && info.cuotas.length > 0 && (
              <div style={{ marginTop:8,display:"flex",flexWrap:"wrap",gap:6 }}>
                {info.cuotas.map((c,i) => (
                  <div key={i} style={{ padding:"4px 10px",background:"white",borderRadius:7,fontSize:11,border:`1px solid ${pdf.colorPrimario}33`,color:"#2d3748" }}>
                    <strong>Cuota {i+1}:</strong> {c.pct}% — {c.desc}
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

        {/* Firma digitale */}
        {pdf.mostraFirma && firme && firme.filter(f => f.stato==="firmato").length > 0 && (
          <div className="print-block" style={{ marginBottom:16,padding:"12px 16px",background:"#f0fff4",borderRadius:9,border:"1px solid #9ae6b4" }}>
            <div style={{ fontWeight:700,fontSize:12,color:"#276749",marginBottom:8 }}>✍️ Firma digital</div>
            {firme.filter(f => f.stato==="firmato").map((f,i) => (
              <div key={i} style={{ fontSize:11,color:"#2d3748",marginBottom:4 }}>
                <strong>{f.nombre||"Cliente"}</strong> firmó el {f.firmadoAt?.slice(0,10)||"—"}
                {f.ip && <span style={{ color:"#718096",marginLeft:6 }}>· IP: {f.ip}</span>}
              </div>
            ))}
          </div>
        )}

        {/* Pie de página */}
        <div style={{ marginTop:24,paddingTop:12,borderTop:`1px solid ${pdf.colorPrimario}22`,display:"flex",justifyContent:"space-between",fontSize:9,color:"#a0aec0" }}>
          <span>{EMPRESA.nombre} · {EMPRESA.email}</span>
          <span>Documento generado el {new Date().toLocaleDateString("es-CL")}</span>
        </div>

      {/* Watermark Free */}
      {!isPro && (
        <div style={{ marginTop:28,paddingTop:14,borderTop:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",gap:10,opacity:.55 }}>
          <img src={LOGO_URL} alt="Obra Nova" style={{ height:22,objectFit:"contain" }} onError={e=>{e.target.style.display="none";}} />
          <span style={{ fontSize:10,color:"#a0aec0",fontWeight:600 }}>Generado con Obra Nova SPA · obranovaspa.cl</span>
        </div>
      )}
      </div>
    </div>
  );
}

// ─── TabProyectos ─────────────────────────────────────────────────────────────

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

export function TabProyectos({ proyectos, currentId, onLoad, onDelete, onPDF, t }) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── Empty state guidato ──
  if (proyectos.length === 0) {
    return (
      <div style={{ background: "white", borderRadius: 16, padding: "60px 24px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
        <div style={{ fontSize: 56, marginBottom: 14 }}>📁</div>
        <div style={{ fontWeight: 800, fontSize: 18, color: "#1a365d", marginBottom: 8 }}>
          Aún no tienes proyectos
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

  // ── Mobile: lista con swipe ──
  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 11, color: "#a0aec0", fontWeight: 600, marginBottom: 10, textAlign: "right" }}>
          {proyectos.length} proyecto{proyectos.length !== 1 ? "s" : ""}
        </div>
        {proyectos.map(p => (
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
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
      {proyectos.map(p => {
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
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d" }}>{p.info?.cliente || t.sinNombre}</div>
                <div style={{ fontSize: 11, color: "#718096", marginTop: 2 }}>{p.info?.descripcion?.slice(0, 45) || "—"}</div>
              </div>
              <span style={{
                padding: "3px 9px", borderRadius: 99, fontSize: 10, fontWeight: 700, flexShrink: 0,
                background: ESTADO_BG[p.estado] || "#f7fafc",
                color: ESTADO_COLORS[p.estado] || "#718096",
              }}>{t[p.estado?.toLowerCase()] || p.estado}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#276749" }}>{fmt(ptot)}</div>
              <div style={{ fontSize: 10, color: "#a0aec0" }}>{(p.updatedAt || "").slice(0, 10)}</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={e => { e.stopPropagation(); onPDF(p); }}
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
  );
}

// ─── TabListino ───────────────────────────────────────────────────────────────
export function TabListino({ listino, cats, catColors, newCatName, setNewCatName, onAddCat, onDeleteItem, onAddFromListino, onOpenAddModal, DEFAULT_CATS, t }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "#1a365d" }}>📦 {t.listino} ({listino.length})</div>
        <button
          onClick={onOpenAddModal}
          style={{ padding: "8px 16px", background: "#276749", color: "white", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 13 }}
        >{t.listinoAgregar}</button>
      </div>

      {/* Categorías personalizadas */}
      <div style={{ background: "white", borderRadius: 12, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#1a365d", marginBottom: 10 }}>🏷️ {t.catPersonalizada}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 12 }}>
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
          <input
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && onAddCat()}
            placeholder={t.catNombrePlaceholder}
            aria-label={t.catAgregar}
            style={{ flex: 1, padding: "8px 11px", border: "2px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#1a365d" }}
          />
          <button onClick={onAddCat} style={{ padding: "8px 14px", background: "#2b6cb0", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}>
            {t.catAgregar}
          </button>
        </div>
      </div>

      {/* Lista materiali */}
      {listino.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 0", color: "#a0aec0", background: "white", borderRadius: 12 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📦</div>
          <div>{t.listinoVacio}</div>
        </div>
      ) : (
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
              {listino.map((item, i) => {
                const mg = item.precioCliente > 0 && item.precioCompra > 0
                  ? ((item.precioCliente - item.precioCompra) / item.precioCliente * 100)
                  : null;
                return (
                  <tr key={item.id} style={{ background: i % 2 === 0 ? "#f7fafc" : "white" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#ebf8ff"}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#f7fafc" : "white"}
                  >
                    <td style={{ padding: "8px 10px", fontSize: 11, color: "#718096" }}>{item.cat}</td>
                    <td style={{ padding: "8px 10px", fontWeight: 600, color: "#1a365d" }}>{item.nombre}</td>
                    <td style={{ padding: "8px 8px", color: "#718096" }}>{item.unidad || "—"}</td>
                    <td style={{ padding: "8px 10px", color: "#c05621", fontWeight: 600 }}>{item.precioCompra > 0 ? fmt(item.precioCompra) : "—"}</td>
                    <td style={{ padding: "8px 10px", color: "#276749", fontWeight: 700 }}>{item.precioCliente > 0 ? fmt(item.precioCliente) : item.precio > 0 ? fmt(item.precio) : "—"}</td>
                    <td style={{ padding: "8px 8px" }}>
                      {mg !== null ? (
                        <span style={{
                          padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                          background: mg > 20 ? "#f0fff4" : mg > 10 ? "#fffff0" : "#fff5f5",
                          color: mg > 20 ? "#276749" : mg > 10 ? "#b7791f" : "#c53030",
                        }}>{fmtPct(mg)}</span>
                      ) : "—"}
                    </td>
                    <td style={{ padding: "8px 10px", color: "#718096", fontSize: 11 }}>{item.proveedor || "—"}</td>
                    <td style={{ padding: "8px 8px" }}>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button onClick={() => onAddFromListino(item)} style={{ padding: "4px 9px", background: "#ebf8ff", border: "1px solid #bee3f8", borderRadius: 7, cursor: "pointer", color: "#2b6cb0", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
                          + {t.costos || "Usar"}
                        </button>
                        <button onClick={() => onDeleteItem(item.id)} aria-label="Eliminar" style={{ padding: "4px 8px", background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 7, cursor: "pointer", color: "#c53030", fontSize: 11 }}>✕</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── TabStorico ───────────────────────────────────────────────────────────────
export function TabStorico({ proyectos, t }) {
  const storicoMat = useMemo(() => Object.values(
    proyectos.reduce((acc, proj) => {
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
   .sort((a, b) => b.cantTotal - a.cantTotal).slice(0, 60), [proyectos, t]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ background: "linear-gradient(135deg,#1a365d,#2d3748)", borderRadius: 12, padding: "18px 20px", color: "white" }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 3 }}>📈 {t.storicoTitulo}</div>
        <div style={{ color: "#a0aec0", fontSize: 12 }}>{t.storicoDesc}</div>
      </div>
      {storicoMat.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 0", color: "#a0aec0", background: "white", borderRadius: 12 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>📊</div><div>{t.storicoVacio}</div>
        </div>
      ) : storicoMat.map((m, i) => (
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
          ["Proyectos", "En cuántos proyectos apareció ese material"],
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
