// ─── components/tabs/TabVistaCliente.jsx ─────────────────────────────────────
import { useMemo } from "react";
import { usePDFSettings } from "./TabSettings";
import { fmt, calcTotals } from "../../utils/helpers";
import { CAT_COLORS, EMPRESA, ESTADO_COLORS, ESTADO_BG } from "../../utils/constants";
import { LOGO_URL } from "../../utils/logo";

const CC = CAT_COLORS;

export default function TabVistaCliente({ info, partidas, pct, cats, catVis, getCatVis, setCatVisKey, iva, estado, currentId, validez, t, onInviaFirma, firme = [], fotos = [], plan = "free", onTrackPdf }) {
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
          <button onClick={() => { window.print(); onTrackPdf?.("download"); }}
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
                onClick={() => { window.print(); onTrackPdf?.("whatsapp"); setTimeout(() => window.open(waUrl,"_blank","noopener,noreferrer"), 800); }}
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
      <div id="print-area" style={{ background: "white", padding: "28px 24px", maxWidth: 800, margin: "0 auto", borderRadius: 12, boxShadow: "0 1px 8px rgba(0,0,0,.08)", position: "relative", overflow: "hidden" }}>

        {/* ── Watermark OBRA NOVA per piano Free (visibile nell'anteprima app) ── */}
        {!isPro && (
          <div aria-hidden="true" style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            pointerEvents: "none", zIndex: 1, overflow: "hidden",
          }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                position: "absolute",
                top: `${20 + i * 30}%`,
                left: "-10%", right: "-10%",
                transform: "rotate(-35deg)",
                fontSize: 28, fontWeight: 900,
                color: "rgba(43,108,176,0.13)",
                whiteSpace: "nowrap", userSelect: "none",
                letterSpacing: "0.12em", textTransform: "uppercase",
              }}>
                OBRA NOVA &nbsp;&nbsp; OBRA NOVA &nbsp;&nbsp; OBRA NOVA &nbsp;&nbsp; OBRA NOVA
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
            <img src={logoEffettivo} alt="" style={{ height: 46, marginBottom: 6, maxWidth: 180, objectFit: "contain" }} onError={e => { e.target.style.display = "none"; }} />
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
            {/* QR link firma/vista */}
            {currentId && (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=64x64&data=${encodeURIComponent(window.location.origin + "/firma/" + currentId)}`}
                alt="QR"
                style={{ width: 60, height: 60, borderRadius: 6, border: "1px solid #e2e8f0", marginTop: 4 }}
              />
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 18, position: "relative", zIndex: 1 }}>
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
            <div style={{ marginTop: 16, paddingTop: 10, borderTop: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, opacity: .5 }}>
              <img src={LOGO_URL} alt="Obra Nova" style={{ height: 20, objectFit: "contain" }} onError={e => { e.target.style.display = "none"; }} />
              <span style={{ fontSize: 10, color: "#a0aec0", fontWeight: 600 }}>Generado con Obra Nova SPA · obranovaspa.cl</span>
            </div>
          ) : (
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6, opacity: .4 }}>
              <img src={LOGO_URL} alt="" style={{ height: 16, objectFit: "contain" }} onError={e => { e.target.style.display = "none"; }} />
              <span style={{ fontSize: 9, color: "#a0aec0" }}>Obra Nova Pro</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
