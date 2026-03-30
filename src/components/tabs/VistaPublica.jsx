// ─── components/VistaPublica.jsx v2 ───────────────────────────────────────────
// Portal cliente espanso — accessibile senza login via /cliente/{wsId}/{proyId}
// Sezioni controllate da portalConfig (impostato dall'owner in TabProyecto)
// Tabs: Resumen · Avance · Galería · Pagos · Timeline · Documentos · Mensajes
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import {
  doc, getDoc, collection, getDocs, addDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { calcTotals, fmt } from "../utils/helpers";
import { EMPRESA, ESTADO_COLORS, ESTADO_BG } from "../utils/constants";
import { LOGO_URL } from "../utils/logo";
import PanelComentarios from "./PanelComentarios";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (d) => d
  ? new Date(d + "T12:00:00").toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })
  : "—";

const ESTADOS_ORDEN = ["Borrador","Enviado","Aceptado","En obra","Finalizado"];
const ESTADO_IDX    = Object.fromEntries(ESTADOS_ORDEN.map((e,i) => [e, i]));

function Card({ children, style }) {
  return (
    <div style={{ background: "white", borderRadius: 14, padding: "18px 16px",
      boxShadow: "0 1px 6px rgba(0,0,0,.06)", marginBottom: 14, ...style }}>
      {children}
    </div>
  );
}

function STitle({ children, icon }) {
  return (
    <div style={{ fontWeight: 700, fontSize: 13, color: "#1a365d", marginBottom: 12 }}>
      {icon && <span style={{ marginRight: 6 }}>{icon}</span>}{children}
    </div>
  );
}

// ── Tab: Resumen (presupuesto) ────────────────────────────────────────────────
function TabResumen({ proyecto, totals, renders, activeImg, setActiveImg, cfg,
  showFirma, setShowFirma, firmaNome, setFirmaNome, firmaRut, setFirmaRut,
  firmando, firmado, handleFirma }) {
  const { info = {}, condPago = "", cuotas = [], iva, catVis = {},
    descuento = {}, pct = {} } = proyecto;
  const partidas = proyecto.partidas || [];
  const { cd, ci, gf, imprevistos: imprev, sub, util, total,
    descuentoAmt, totalConDesc, iva: ivaAmt, totalIva } = totals;

  const cats         = [...new Set(partidas.map(p => p.cat))];
  const visibleCats  = cats.filter(c => catVis[c] !== false);
  const visibleParts = partidas.filter(p => visibleCats.includes(p.cat));

  return (
    <>
      {/* Render AI */}
      {cfg.showRenders !== false && renders.length > 0 && (
        <Card>
          <STitle icon="🎨">Visualización del proyecto</STitle>
          <img src={renders[activeImg]?.imageUrl} alt="Render"
            style={{ width: "100%", borderRadius: 10, marginBottom: 8, display: "block" }} />
          {renders.length > 1 && (
            <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
              {renders.map((r, i) => (
                <button key={i} onClick={() => setActiveImg(i)} style={{
                  width: 60, padding: 0, borderRadius: 8, overflow: "hidden",
                  border: i === activeImg ? "2.5px solid #2b6cb0" : "1px solid #e2e8f0",
                  cursor: "pointer", background: "none",
                }}>
                  <img src={r.imageUrl} alt="" style={{ width: "100%", height: 40, objectFit: "cover", display: "block" }} />
                </button>
              ))}
            </div>
          )}
          <div style={{ fontSize: 10, color: "#a0aec0", textAlign: "center", marginTop: 6, fontStyle: "italic" }}>
            Visualización generada por IA — el resultado final puede variar
          </div>
        </Card>
      )}

      {/* Partidas */}
      {cfg.showPresupuesto !== false && visibleCats.map(cat => {
        const catParts = visibleParts.filter(p => p.cat === cat);
        if (!catParts.length) return null;
        const catTotal = catParts.reduce((s, p) => s + p.cant * p.pu, 0);
        return (
          <Card key={cat}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
              marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #f0f4f8" }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: "#1a365d" }}>{cat}</span>
              <span style={{ fontWeight: 700, fontSize: 13, color: "#276749" }}>{fmt(catTotal)}</span>
            </div>
            {catParts.map((p, i) => (
              <div key={p.id || i} style={{ display: "flex", justifyContent: "space-between",
                padding: "6px 0", borderBottom: i < catParts.length-1 ? "1px solid #f7fafc" : "none" }}>
                <div>
                  <div style={{ fontSize: 13, color: "#2d3748", fontWeight: 500 }}>{p.nombre}</div>
                  <div style={{ fontSize: 11, color: "#a0aec0" }}>{p.cant} {p.unidad}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#2d3748" }}>{fmt(p.cant * p.pu)}</div>
                  <div style={{ fontSize: 10, color: "#a0aec0" }}>@ {fmt(p.pu)}/{p.unidad}</div>
                </div>
              </div>
            ))}
          </Card>
        );
      })}

      {/* Resumen financiero */}
      {cfg.showPresupuesto !== false && (
        <Card>
          <STitle icon="📊">Resumen financiero</STitle>
          {[
            { l: "Costos directos", v: cd },
            { l: `Costos indirectos (${pct.ci||0}%)`, v: ci },
            { l: `Gastos fijos (${pct.gf||0}%)`, v: gf },
            { l: `Imprevistos (${pct.imprevistos||0}%)`, v: imprev },
          ].map(r => (
            <div key={r.l} style={{ display: "flex", justifyContent: "space-between",
              padding: "5px 0", fontSize: 12, color: "#718096" }}>
              <span>{r.l}</span><span>{fmt(r.v)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0",
            borderTop: "1px solid #e2e8f0", fontWeight: 700, fontSize: 13, color: "#1a365d" }}>
            <span>Subtotal</span><span>{fmt(sub)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0",
            fontSize: 12, color: "#553c9a" }}>
            <span>Utilidad ({pct.utilidad||0}%)</span><span>{fmt(util)}</span>
          </div>
          {(descuentoAmt||0) > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0",
              fontSize: 12, color: "#e53e3e" }}>
              <span>Descuento{descuento.tipo==="pct" ? ` (${descuento.valor}%)` : ""}</span>
              <span>−{fmt(descuentoAmt)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0",
            borderTop: "1px solid #e2e8f0", fontWeight: 800, fontSize: 14, color: "#1a365d" }}>
            <span>Total neto</span><span>{fmt(totalConDesc)}</span>
          </div>
          {iva && <>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0",
              fontSize: 12, color: "#c05621" }}>
              <span>IVA 19%</span><span>{fmt(ivaAmt)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px",
              background: "#1a365d", borderRadius: 10, marginTop: 6 }}>
              <span style={{ color: "white", fontWeight: 800, fontSize: 15 }}>TOTAL</span>
              <span style={{ color: "white", fontWeight: 900, fontSize: 17 }}>{fmt(totalIva)}</span>
            </div>
          </>}
        </Card>
      )}

      {/* Firma */}
      <Card className="no-print">
        {firmado ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#276749", marginBottom: 4 }}>
              Presupuesto firmado
            </div>
            <div style={{ fontSize: 13, color: "#4a5568" }}>
              Gracias, {firmaNome}. La empresa ha sido notificada.
            </div>
          </div>
        ) : !showFirma ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1a365d", marginBottom: 6 }}>
              ¿Deseas aceptar este presupuesto?
            </div>
            <div style={{ fontSize: 12, color: "#718096", marginBottom: 14 }}>
              Al firmar, aceptas las condiciones y montos detallados.
            </div>
            <button onClick={() => setShowFirma(true)} style={{
              padding: "14px 32px", background: "linear-gradient(135deg,#276749,#38a169)",
              color: "white", border: "none", borderRadius: 10, cursor: "pointer",
              fontWeight: 800, fontSize: 15,
            }}>✍️ Firmar y aceptar</button>
          </div>
        ) : (
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d", marginBottom: 12 }}>
              ✍️ Firma digital
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#4a5568", display: "block", marginBottom: 3 }}>
                Nombre completo *
              </label>
              <input value={firmaNome} onChange={e => setFirmaNome(e.target.value)}
                placeholder="Ej: Juan Pérez López" autoFocus
                style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0",
                  borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#4a5568", display: "block", marginBottom: 3 }}>
                RUT (opcional)
              </label>
              <input value={firmaRut} onChange={e => setFirmaRut(e.target.value)}
                placeholder="12.345.678-9"
                style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0",
                  borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />
            </div>
            <button onClick={handleFirma} disabled={firmando || !firmaNome.trim()} style={{
              width: "100%", padding: "14px",
              background: firmaNome.trim() ? "linear-gradient(135deg,#276749,#38a169)" : "#e2e8f0",
              color: firmaNome.trim() ? "white" : "#a0aec0",
              border: "none", borderRadius: 10, fontWeight: 800, fontSize: 15,
              cursor: firmaNome.trim() ? "pointer" : "default",
            }}>{firmando ? "⏳ Firmando..." : "✅ Confirmar firma"}</button>
            <button onClick={() => setShowFirma(false)} style={{
              width: "100%", padding: "10px", marginTop: 8, background: "none",
              border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer",
              color: "#718096", fontSize: 13,
            }}>Cancelar</button>
          </div>
        )}
      </Card>
    </>
  );
}

// ── Tab: Avance ───────────────────────────────────────────────────────────────
function TabAvance({ proyecto }) {
  const estado    = proyecto.estado || "Borrador";
  const estadoIdx = ESTADOS_ORDEN.indexOf(estado);
  const avancePct = proyecto.avancePct || Math.round((estadoIdx / (ESTADOS_ORDEN.length - 1)) * 100);
  const fases     = proyecto.fases || [];

  return (
    <>
      <Card>
        <STitle icon="📊">Estado del proyecto</STitle>
        {/* Progress bar */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1a365d" }}>Avance general</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#276749" }}>{avancePct}%</span>
          </div>
          <div style={{ height: 12, background: "#e2e8f0", borderRadius: 6, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 6, transition: "width 1s ease",
              background: avancePct >= 100 ? "#276749" : "linear-gradient(90deg,#2b6cb0,#276749)",
              width: `${avancePct}%`,
            }} />
          </div>
        </div>

        {/* Fases */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {ESTADOS_ORDEN.map((e, i) => {
            const done    = i < estadoIdx;
            const current = i === estadoIdx;
            const future  = i > estadoIdx;
            return (
              <div key={e} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                {/* Linea verticale */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 24 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                    background: done ? "#276749" : current ? "#2b6cb0" : "#e2e8f0",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, color: "white", fontWeight: 700,
                    border: current ? "3px solid #bee3f8" : "none",
                  }}>
                    {done ? "✓" : i + 1}
                  </div>
                  {i < ESTADOS_ORDEN.length - 1 && (
                    <div style={{ width: 2, height: 28, background: done ? "#276749" : "#e2e8f0" }} />
                  )}
                </div>
                <div style={{ paddingBottom: 16, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: current ? 700 : 500,
                    color: future ? "#a0aec0" : "#1a365d" }}>
                    {e}
                    {current && <span style={{ marginLeft: 8, fontSize: 10, background: "#EBF5FB",
                      color: "#2b6cb0", padding: "2px 7px", borderRadius: 99, fontWeight: 700 }}>
                      Actual
                    </span>}
                  </div>
                  {current && (
                    <div style={{ fontSize: 11, color: "#718096", marginTop: 2 }}>
                      En este estado actualmente
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Fases personalizzate (se presenti) */}
      {fases.length > 0 && (
        <Card>
          <STitle icon="🏗️">Fases del proyecto</STitle>
          {fases.map((f, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#2d3748" }}>{f.nombre}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#276749" }}>{f.pct || 0}%</span>
              </div>
              <div style={{ height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 4, background: "#276749", width: `${f.pct || 0}%` }} />
              </div>
              {f.nota && <div style={{ fontSize: 11, color: "#718096", marginTop: 3 }}>{f.nota}</div>}
            </div>
          ))}
        </Card>
      )}
    </>
  );
}

// ── Tab: Galería ──────────────────────────────────────────────────────────────
function TabGaleria({ fotos, renders }) {
  const [selected, setSelected] = useState(null);
  const allMedia = [
    ...fotos.map(f => ({ ...f, tipo: "foto" })),
    ...renders.filter(r => r.imageUrl).map(r => ({ ...r, tipo: "render", url: r.imageUrl })),
  ];

  if (allMedia.length === 0) return (
    <Card>
      <div style={{ textAlign: "center", padding: "30px 0", color: "#a0aec0" }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>📷</div>
        <div style={{ fontSize: 13 }}>Sin fotos disponibles aún</div>
        <div style={{ fontSize: 11, marginTop: 4 }}>La empresa subirá fotos del avance de la obra</div>
      </div>
    </Card>
  );

  return (
    <>
      <Card>
        <STitle icon="📷">Galería ({allMedia.length})</STitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {allMedia.map((m, i) => (
            <div key={i} onClick={() => setSelected(m)} style={{ cursor: "pointer", position: "relative" }}>
              <img src={m.url || m.imageUrl} alt={m.titulo || `Foto ${i+1}`}
                style={{ width: "100%", aspectRatio: "1", objectFit: "cover",
                  borderRadius: 8, display: "block", border: "1px solid #e2e8f0" }} />
              {m.tipo === "render" && (
                <span style={{ position: "absolute", top: 4, right: 4,
                  background: "rgba(0,0,0,.6)", color: "white",
                  fontSize: 9, padding: "1px 5px", borderRadius: 4 }}>AI</span>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Lightbox */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.9)",
          zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16,
        }}>
          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 600, width: "100%", position: "relative" }}>
            <img src={selected.url || selected.imageUrl} alt=""
              style={{ width: "100%", borderRadius: 12, display: "block" }} />
            {selected.titulo && (
              <div style={{ color: "white", fontSize: 13, textAlign: "center", marginTop: 10 }}>
                {selected.titulo}
              </div>
            )}
            {selected.fecha && (
              <div style={{ color: "rgba(255,255,255,.6)", fontSize: 11, textAlign: "center", marginTop: 4 }}>
                {fmtDate(selected.fecha)}
              </div>
            )}
            <button onClick={() => setSelected(null)} style={{
              position: "absolute", top: -12, right: -12, width: 32, height: 32,
              borderRadius: "50%", background: "white", border: "none",
              cursor: "pointer", fontSize: 16, fontWeight: 700, color: "#1a365d",
            }}>✕</button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Tab: Pagos ────────────────────────────────────────────────────────────────
function TabPagos({ proyecto, totals }) {
  const { condPago = "", cuotas = [], iva } = proyecto;
  const { totalConDesc, totalIva } = totals;
  const totalFinal = iva ? totalIva : totalConDesc;

  const totalPagado   = cuotas.filter(c => c.pagado).reduce((s,c) => {
    const m = c.tipo === "pct" ? totalFinal * (c.monto/100) : (c.monto||0);
    return s + m;
  }, 0);
  const totalPendiente = totalFinal - totalPagado;

  return (
    <>
      {/* Resumen pagos */}
      <Card>
        <STitle icon="💳">Estado de pagos</STitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
          {[
            { l: "Total", v: fmt(totalFinal), c: "#1a365d" },
            { l: "Pagado", v: fmt(totalPagado), c: "#276749" },
            { l: "Pendiente", v: fmt(totalPendiente), c: totalPendiente > 0 ? "#c05621" : "#276749" },
          ].map(s => (
            <div key={s.l} style={{ background: "#f8fafc", borderRadius: 10, padding: "10px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "#718096", marginBottom: 4 }}>{s.l}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: s.c }}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* Barra pagato */}
        <div style={{ height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden", marginBottom: 14 }}>
          <div style={{
            height: "100%", background: "#276749", borderRadius: 4,
            width: totalFinal > 0 ? `${Math.min(100, (totalPagado/totalFinal)*100)}%` : "0%",
          }} />
        </div>
      </Card>

      {/* Lista cuotas */}
      {cuotas.length > 0 && (
        <Card>
          <STitle icon="📋">Cuotas</STitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {cuotas.map((c, i) => {
              const montoCalc = c.tipo === "pct" ? totalFinal * (c.monto/100) : (c.monto||0);
              return (
                <div key={i} style={{
                  padding: "12px", borderRadius: 10, border: "1px solid #e2e8f0",
                  background: c.pagado ? "#f0fff4" : "#fff",
                  borderLeft: `4px solid ${c.pagado ? "#276749" : "#e2e8f0"}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#2d3748" }}>
                        {c.desc || `Cuota ${i+1}`}
                        {c.pagado && <span style={{ marginLeft: 8, fontSize: 10, color: "#276749",
                          background: "#EAF3DE", padding: "1px 7px", borderRadius: 99 }}>✓ Pagada</span>}
                      </div>
                      <div style={{ fontSize: 11, color: "#718096", marginTop: 2 }}>
                        {c.tipo === "pct" ? `${c.monto}% del total` : fmt(c.monto)}
                        {c.fecha ? ` · Vence ${fmtDate(c.fecha)}` : ""}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: c.pagado ? "#276749" : "#1a365d" }}>
                        {fmt(montoCalc)}
                      </div>
                      {c.mpLink && !c.pagado && (
                        <a href={c.mpLink} target="_blank" rel="noopener noreferrer"
                          style={{ display: "inline-block", marginTop: 6, padding: "6px 14px",
                            background: "#009ee3", color: "white", borderRadius: 8,
                            fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                          💳 Pagar online
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </>
  );
}

// ── Tab: Timeline ─────────────────────────────────────────────────────────────
function TabTimeline({ proyecto }) {
  const info   = proyecto.info || {};
  const tasks  = proyecto.tasks || [];
  const estado = proyecto.estado || "Borrador";

  const eventos = [
    info.fecha         && { fecha: info.fecha,   label: "Presupuesto elaborado", icon: "📋", done: true },
    proyecto.fechaEnvio && { fecha: proyecto.fechaEnvio, label: "Enviado al cliente", icon: "📤", done: true },
    proyecto.fechaFirma && { fecha: proyecto.fechaFirma, label: "Firmado por cliente", icon: "✅", done: true },
    info.fechaInicio   && { fecha: info.fechaInicio, label: "Inicio de obra", icon: "🏗️",
      done: ["En obra","Finalizado"].includes(estado) },
    info.fechaTermino  && { fecha: info.fechaTermino, label: "Término estimado", icon: "🎯",
      done: estado === "Finalizado" },
    estado === "Finalizado" && { fecha: proyecto.fechaFin || "", label: "Obra finalizada", icon: "🎉", done: true },
  ].filter(Boolean);

  if (eventos.length === 0) return (
    <Card>
      <div style={{ textAlign: "center", padding: "30px 0", color: "#a0aec0" }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>📅</div>
        <div style={{ fontSize: 13 }}>Sin fechas disponibles</div>
        <div style={{ fontSize: 11, marginTop: 4 }}>La empresa completará las fechas del proyecto</div>
      </div>
    </Card>
  );

  return (
    <Card>
      <STitle icon="📅">Línea de tiempo</STitle>
      <div style={{ position: "relative", paddingLeft: 28 }}>
        <div style={{ position: "absolute", left: 11, top: 0, bottom: 0, width: 2, background: "#e2e8f0" }} />
        {eventos.map((e, i) => (
          <div key={i} style={{ position: "relative", marginBottom: 20 }}>
            <div style={{
              position: "absolute", left: -28, top: 2,
              width: 22, height: 22, borderRadius: "50%",
              background: e.done ? "#276749" : "#e2e8f0",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, zIndex: 1,
            }}>
              {e.done ? "✓" : <span style={{ fontSize: 10 }}>{e.icon}</span>}
            </div>
            <div style={{ paddingLeft: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: e.done ? "#1a365d" : "#a0aec0" }}>
                {e.label}
              </div>
              <div style={{ fontSize: 11, color: "#718096" }}>{fmtDate(e.fecha)}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Tab: Documentos ───────────────────────────────────────────────────────────
function TabDocumentos({ proyecto, wsId, proyId }) {
  const docs = proyecto.documentos || [];

  return (
    <Card>
      <STitle icon="📄">Documentos</STitle>
      {docs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px 0", color: "#a0aec0" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
          <div style={{ fontSize: 13 }}>Sin documentos disponibles</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>La empresa adjuntará contratos y otros documentos aquí</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {docs.map((d, i) => (
            <a key={i} href={d.url} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 10,
                textDecoration: "none", color: "#2d3748", background: "#f8fafc" }}>
              <span style={{ fontSize: 20 }}>
                {d.tipo === "pdf" ? "📄" : d.tipo === "imagen" ? "🖼️" : "📎"}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {d.nombre || "Documento"}
                </div>
                <div style={{ fontSize: 11, color: "#718096" }}>
                  {d.fecha ? fmtDate(d.fecha) : ""} {d.size ? `· ${d.size}` : ""}
                </div>
              </div>
              <span style={{ fontSize: 12, color: "#2b6cb0" }}>↓</span>
            </a>
          ))}
        </div>
      )}
    </Card>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPALE
// ══════════════════════════════════════════════════════════════════════════════
export default function VistaPublica() {
  const [proyecto,   setProyecto]   = useState(null);
  const [workspace,  setWorkspace]  = useState(null);
  const [fotos,      setFotos]      = useState([]);
  const [renders,    setRenders]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [activeImg,  setActiveImg]  = useState(0);
  const [activeTab,  setActiveTab]  = useState("resumen");
  const [showFirma,  setShowFirma]  = useState(false);
  const [firmaNome,  setFirmaNome]  = useState("");
  const [firmaRut,   setFirmaRut]   = useState("");
  const [firmando,   setFirmando]   = useState(false);
  const [firmado,    setFirmado]    = useState(false);
  const [clienteNombreChat, setClienteNombreChat] = useState("");

  const parts  = window.location.pathname.split("/").filter(Boolean);
  const wsId   = parts[1] || null;
  const proyId = parts[2] || null;

  useEffect(() => {
    if (!wsId || !proyId) { setError("Link no válido"); setLoading(false); return; }
    const load = async () => {
      try {
        const [wsSnap, pSnap] = await Promise.all([
          getDoc(doc(db, "workspaces", wsId)),
          getDoc(doc(db, "workspaces", wsId, "proyectos", proyId)),
        ]);
        if (!wsSnap.exists()) { setError("Empresa no encontrada"); setLoading(false); return; }
        if (!pSnap.exists())  { setError("Presupuesto no encontrado"); setLoading(false); return; }
        setWorkspace({ id: wsSnap.id, ...wsSnap.data() });
        setProyecto({ id: pSnap.id, ...pSnap.data() });
        setLoading(false);

        // Background loads
        getDocs(collection(db, "workspaces", wsId, "proyectos", proyId, "renders"))
          .then(s => setRenders(s.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => x.imageUrl)))
          .catch(() => {});
        getDocs(collection(db, "workspaces", wsId, "proyectos", proyId, "fotos"))
          .then(s => setFotos(s.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => x.url)))
          .catch(() => {});
        addDoc(collection(db, "workspaces", wsId, "proyectos", proyId, "vistas"), {
          timestamp: serverTimestamp(), userAgent: navigator.userAgent?.slice(0,200) || "",
          source: new URLSearchParams(window.location.search).get("src") || "link",
        }).catch(() => {});
        // Aggiorna contatore visite nel doc progetto per trigger Nova proattivo
        import("firebase/firestore").then(({ doc: fbDoc, updateDoc, increment }) => {
          import("../lib/firebase").then(({ db: fbDb }) => {
            updateDoc(fbDoc(fbDb, "workspaces", wsId, "proyectos", proyId), {
              visitCount: increment(1),
              lastVisitAt: new Date().toISOString(),
            }).catch(() => {});
          });
        });
      } catch(e) { setError("Error al cargar: " + e.message); setLoading(false); }
    };
    load();
  }, [wsId, proyId]);

  const handleFirma = async () => {
    if (!firmaNome.trim() || !wsId || !proyId) return;
    setFirmando(true);
    try {
      const { httpsCallable, getFunctions } = await import("firebase/functions");
      const token = `${wsId}_${proyId}_${Date.now()}`;
      await addDoc(collection(db, "workspaces", wsId, "firme"), {
        proyectoId: proyId, nombre: firmaNome.trim(), rut: firmaRut.trim(),
        tipo: "firma", timestamp: serverTimestamp(), token,
      });
      setFirmado(true);
    } catch(e) {
      alert("Error al firmar: " + e.message);
    } finally { setFirmando(false); }
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#f7fafc" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12, animation: "spin 1s linear infinite" }}>⚙️</div>
        <div style={{ color: "#718096" }}>Cargando portal...</div>
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#f7fafc" }}>
      <div style={{ textAlign: "center", padding: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#1a365d", marginBottom: 8 }}>{error}</div>
        <div style={{ fontSize: 13, color: "#718096" }}>Verifica el link o contacta a la empresa</div>
      </div>
    </div>
  );

  const info      = proyecto.info || {};
  const partidas  = proyecto.partidas || [];
  const pct       = proyecto.pct || {};
  const descuento = proyecto.descuento || {};
  const iva       = proyecto.iva !== false;
  const estado    = proyecto.estado || "Borrador";
  const wsName    = workspace?.name || EMPRESA.nombre;
  const cfg       = proyecto.portalConfig || {};

  const totals = calcTotals(
    partidas.map(p => ({ cant: parseFloat(p.cant||1), pu: parseFloat(p.pu||0) })),
    { ci: parseFloat(pct.ci||0), gf: parseFloat(pct.gf||0),
      imprevistos: parseFloat(pct.imprevistos||0), utilidad: parseFloat(pct.utilidad||0) },
    descuento
  );

  const totalFinal = iva ? totals.totalIva : totals.totalConDesc;
  const validez    = proyecto.validez ?? 30;
  const venceDate  = info.fecha
    ? new Date(new Date(info.fecha).getTime() + validez * 86400000).toLocaleDateString("es-CL")
    : "—";

  // Tabs disponibili in base a portalConfig
  const TABS_DEF = [
    { id: "resumen",    label: "Resumen",    emoji: "📋", show: true },
    { id: "avance",     label: "Avance",     emoji: "📊", show: cfg.showAvance !== false },
    { id: "galeria",    label: "Galería",    emoji: "📷", show: cfg.showFotos !== false && (fotos.length > 0 || renders.length > 0) },
    { id: "pagos",      label: "Pagos",      emoji: "💳", show: cfg.showPagos !== false && (proyecto.cuotas||[]).length > 0 },
    { id: "timeline",   label: "Timeline",   emoji: "📅", show: cfg.showTimeline !== false },
    { id: "documentos", label: "Docs",       emoji: "📄", show: cfg.showDocumentos !== false },
    { id: "mensajes",   label: "Mensajes",   emoji: "💬", show: cfg.showMensajes !== false },
  ].filter(t => t.show);

  return (
    <div style={{ minHeight: "100vh", background: "#f7fafc",
      fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          header, nav { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 1.5cm; size: A4; }
        }
      `}</style>

      {/* Header */}
      <header style={{ background: "#1a365d", padding: "14px 20px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex",
          justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={LOGO_URL} alt="ON" style={{ height: 28 }}
              onError={e => e.target.style.display = "none"} />
            <span style={{ color: "white", fontWeight: 800, fontSize: 15 }}>{wsName}</span>
          </div>
          <span style={{
            padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
            background: ESTADO_BG[estado] || "#edf2f7",
            color: ESTADO_COLORS[estado] || "#718096",
          }}>{estado}</span>
        </div>
      </header>

      {/* Hero card */}
      <div style={{ background: "#1a365d", paddingBottom: 20 }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 16px" }}>
          <div style={{ background: "white", borderRadius: 14, padding: "20px 18px",
            boxShadow: "0 4px 20px rgba(0,0,0,.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between",
              alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: "#a0aec0", fontWeight: 600,
                  letterSpacing: 0.5, marginBottom: 4 }}>PRESUPUESTO</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#1a365d", marginBottom: 4 }}>
                  {info.descripcion || "Sin descripción"}
                </div>
                <div style={{ fontSize: 14, color: "#4a5568" }}>
                  Para: <strong>{info.cliente || "—"}</strong>
                </div>
                {info.direccion && (
                  <div style={{ fontSize: 12, color: "#718096", marginTop: 2 }}>
                    📍 {info.direccion}{info.ciudad ? `, ${info.ciudad}` : ""}
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: "#276749" }}>
                  {fmt(totalFinal)}
                </div>
                <div style={{ fontSize: 11, color: "#718096" }}>{iva ? "IVA incluido" : "Neto"}</div>
                <div style={{ fontSize: 11, color: "#a0aec0", marginTop: 4 }}>
                  Válido hasta: {venceDate}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="no-print" style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "white", borderBottom: "1px solid #e2e8f0",
        overflowX: "auto",
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex" }}>
          {TABS_DEF.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: "12px 14px", border: "none", background: "none",
              cursor: "pointer", fontSize: 12, fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? "#1a365d" : "#718096",
              borderBottom: activeTab === tab.id ? "2px solid #1a365d" : "2px solid transparent",
              whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 5,
            }}>
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "16px 16px 40px" }}>

        {activeTab === "resumen" && (
          <TabResumen proyecto={proyecto} totals={totals} renders={renders}
            activeImg={activeImg} setActiveImg={setActiveImg} cfg={cfg}
            showFirma={showFirma} setShowFirma={setShowFirma}
            firmaNome={firmaNome} setFirmaNome={setFirmaNome}
            firmaRut={firmaRut} setFirmaRut={setFirmaRut}
            firmando={firmando} firmado={firmado} handleFirma={handleFirma} />
        )}

        {activeTab === "avance" && <TabAvance proyecto={proyecto} />}

        {activeTab === "galeria" && <TabGaleria fotos={fotos} renders={renders} />}

        {activeTab === "pagos" && <TabPagos proyecto={proyecto} totals={totals} />}

        {activeTab === "timeline" && <TabTimeline proyecto={proyecto} />}

        {activeTab === "documentos" && (
          <TabDocumentos proyecto={proyecto} wsId={wsId} proyId={proyId} />
        )}

        {activeTab === "mensajes" && (
          <Card>
            <STitle icon="💬">Mensajes</STitle>
            <input value={clienteNombreChat} onChange={e => setClienteNombreChat(e.target.value)}
              placeholder="Tu nombre (para que sepamos quién escribe)"
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0",
                borderRadius: 9, fontSize: 13, color: "#1a365d", boxSizing: "border-box",
                marginBottom: 12 }}
              maxLength={60} />
            <div style={{ height: 380 }}>
              <PanelComentarios
                workspaceId={wsId} proyectoId={proyId}
                autorNombre={clienteNombreChat || "Cliente"}
                autorEmail="" autorUid="cliente"
                esCliente={true} clienteNombre={clienteNombreChat}
              />
            </div>
          </Card>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "24px 0 16px",
          color: "#a0aec0", fontSize: 11, lineHeight: 1.7, borderTop: "1px solid #e2e8f0",
          marginTop: 8 }}>
          <img src={LOGO_URL} alt="Obra Nova" style={{ height: 22, marginBottom: 6 }}
            onError={e => e.target.style.display = "none"} />
          <div style={{ fontWeight: 700, color: "#718096" }}>{wsName}</div>
          <div>RUT {EMPRESA.rut} · {EMPRESA.giro}</div>
          <div>{EMPRESA.direccion}, {EMPRESA.ciudad}</div>
          <div>📞 {EMPRESA.telefono} · ✉ {EMPRESA.email}</div>
          <div style={{ marginTop: 6 }}>
            Documento N° {proyId?.slice(-6)?.toUpperCase() || "——"} · Generado con <strong>Obra Nova</strong>
          </div>
        </div>
      </main>
    </div>
  );
}
