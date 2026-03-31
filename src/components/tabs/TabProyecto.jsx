// ─── components/tabs/TabProyecto.jsx ────────────────────────────────────────
import { useState, useEffect, lazy, Suspense } from "react";
import { Tip } from "../Tip";
import { ESTADOS, ESTADO_COLORS, ESTADO_BG } from "../../utils/constants";
const ModalTemplates = lazy(() => import("../ModalTemplates"));

// Dichiarata qui (prima di export default) per evitare TDZ in prod con Vite/Rollup
const PORTAL_SECTIONS = [
  { key: "showPresupuesto", label: "Detalle del presupuesto",  emoji: "📋", desc: "Partidas y desglose financiero" },
  { key: "showAvance",      label: "Avance de obra",           emoji: "📊", desc: "Porcentaje y fases del proyecto" },
  { key: "showFotos",       label: "Galería de fotos",         emoji: "📷", desc: "Fotos del cantiere subidas por ti" },
  { key: "showPagos",       label: "Estado de pagos",          emoji: "💳", desc: "Cuotas y pagos realizados" },
  { key: "showTimeline",    label: "Timeline del proyecto",    emoji: "📅", desc: "Fechas de inicio y término" },
  { key: "showRenders",     label: "Renders AI",               emoji: "🎨", desc: "Visualizaciones generadas por IA" },
  { key: "showDocumentos",  label: "Documentos",               emoji: "📄", desc: "Contratos y PDFs adjuntos" },
  { key: "showMensajes",    label: "Mensajes del cliente",     emoji: "💬", desc: "Chat con el cliente" },
];

export default function TabProyecto({
  info, setInfo,
  pct, setPct,
  estado, setEstado,
  iva, setIva,
  validez, setValidez,
  condPago, setCondPago,
  condPagoPersonalizado, setCondPagoPersonalizado,
  cuotas, setCuotas,
  transferencia, setTransferencia,
  workspaceId,
  proyectoId,
  partidas = [],
  t,
  portalConfig, setPortalConfig,  // configurazione visibilità portal cliente
}) {
  const [showTemplates,   setShowTemplates]   = useState(false);
  const [templateApplied, setTemplateApplied] = useState("");
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 767px)").matches);
  const [mpLoading, setMpLoading] = useState({}); // { [cuotaIndex]: true/false }
  const [mpToast,   setMpToast]   = useState(null); // { msg, type: 'error'|'ok' }

  const showToast = (msg, type = "error") => {
    setMpToast({ msg, type });
    setTimeout(() => setMpToast(null), 3500);
  };
  // 2.4 Validazione
  const [touched, setTouched] = useState({});
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // 2.4 Regole di validazione
  const validators = {
    cliente:    v => !v?.trim() ? "El nombre del cliente es obligatorio" : null,
    email:      v => v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "Email no válido" : null,
    telefono:   v => v && !/^(\+?56)?[ -]?(9\d{8})$/.test(v.replace(/\s/g,"")) ? "Formato esperado: +569XXXXXXXX" : null,
  };
  const getError = (field) => touched[field] ? validators[field]?.(info[field]) : null;
  const handleBlur = (field) => setTouched(t => ({ ...t, [field]: true }));
  const venceDate = info.fecha
    ? new Date(new Date(info.fecha).getTime() + validez * 86400000).toLocaleDateString("es-CL")
    : "—";

  // ── Calcola totale progetto per suggerire monto cuota ──────────────────────
  const totalPct = (pct.ci || 0) + (pct.gf || 0) + (pct.imprevistos || 0) + (pct.utilidad || 0);
  const subtotal = partidas.reduce((s, p) => s + ((p.cant || 0) * (p.pu || 0)), 0);
  const totalNeto = subtotal * (1 + totalPct / 100);
  const totalConIva = iva ? totalNeto * 1.19 : totalNeto;
  const montoEfectivo = (c) => c.tipo === "pct" ? Math.round(totalConIva * (c.monto || 0) / 100) : (c.monto || 0);
  const totalPctAsignado = cuotas.filter(c => c.tipo === "pct").reduce((s, c) => s + (c.monto || 0), 0);

  // ── Genera link MercadoPago per una cuota ───────────────────────────────────
  const crearLinkMP = async (i) => {
    const c = cuotas[i];
    const monto = montoEfectivo(c);
    if (!monto || monto <= 0) return;
    setMpLoading(prev => ({ ...prev, [i]: true }));
    try {
      const { getFunctions, httpsCallable } = await import("firebase/functions");
      const fns = getFunctions(undefined, "southamerica-west1");
      const crearLink = httpsCallable(fns, "crearLinkPago");
      const res = await crearLink({
        monto,
        descripcion: `${c.desc || ("Cuota " + (i + 1))} — ${info.cliente || info.descripcion || "Proyecto"}`,
        proyectoId: proyectoId || "",
        workspaceId: workspaceId || "",
        cuotaIndex: i,
      });
      const link = res.data?.mpLink;
      if (link) {
        const nc = [...cuotas];
        nc[i] = { ...nc[i], mpLink: link };
        setCuotas(nc);
      }
    } catch (e) {
      console.error("crearLinkMP:", e);
      showToast("Error al generar link MP: " + (e.message || "intenta de nuevo"));
    } finally {
      setMpLoading(prev => ({ ...prev, [i]: false }));
    }
  };

  // Applica template al progetto corrente
  const handleApplyTemplate = (tpl) => {
    if (tpl.pct)      Object.entries(tpl.pct).forEach(([k, v]) => setPct({ [k]: v }));
    if (tpl.condPago) setCondPago(tpl.condPago);
    if (tpl.condPagoPersonalizado) setCondPagoPersonalizado(tpl.condPagoPersonalizado);
    if (tpl.cuotas)   setCuotas(tpl.cuotas);
    if (typeof tpl.iva === "boolean") setIva(tpl.iva);
    setTemplateApplied(tpl.nombre);
    setTimeout(() => setTemplateApplied(""), 3000);
  };

  const inputStyle = {
    width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0",
    borderRadius: 8, fontSize: 13, color: "#1a365d", boxSizing: "border-box",
  };
  const labelStyle = {
    fontSize: 12, color: "#4a5568", fontWeight: 600,
    display: "flex", alignItems: "center", gap: 3, marginBottom: 3,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Toast notifiche inline */}
      {mpToast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          zIndex: 9999, padding: "10px 20px", borderRadius: 10,
          background: mpToast.type === "error" ? "#FED7D7" : "#C6F6D5",
          color: mpToast.type === "error" ? "#822727" : "#22543D",
          fontSize: 13, fontWeight: 500, boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
          pointerEvents: "none", whiteSpace: "nowrap",
        }}>
          {mpToast.type === "error" ? "⚠️ " : "✓ "}{mpToast.msg}
        </div>
      )}

      {/* Modal Templates */}
      {showTemplates && (
        <Suspense fallback={null}>
          <ModalTemplates
            partidas={partidas} pct={pct}
            condPago={condPago} condPagoPersonalizado={condPagoPersonalizado}
            cuotas={cuotas} iva={iva}
            onApplyTemplate={handleApplyTemplate}
            onClose={() => setShowTemplates(false)}
          />
        </Suspense>
      )}

      {/* Barra templates */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "white", borderRadius: 12, padding: "12px 16px",
        boxShadow: "0 1px 4px rgba(0,0,0,.07)", flexWrap: "wrap", gap: 10 }}>
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1a365d" }}>📋 Templates</span>
            <span style={{ fontSize: 12, color: "#718096" }}>Carga configuraciones guardadas o guarda esta como template</span>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {templateApplied && (
            <span style={{ fontSize: 12, color: "#276749", fontWeight: 700,
              background: "#f0fff4", padding: "4px 10px", borderRadius: 7, border: "1px solid #9ae6b4" }}>
              ✅ Aplicado: {templateApplied}
            </span>
          )}
          <button onClick={() => setShowTemplates(true)}
            style={{ padding: "8px 16px", background: "#1a365d", color: "white", border: "none",
              borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 13,
              display: "flex", alignItems: "center", gap: 6 }}>
            📋 {isMobile ? "Templates" : "Gestionar templates"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>

      {/* Datos del cliente */}
      <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d", marginBottom: 12, borderBottom: "2px solid #ebf8ff", paddingBottom: 7 }}>
          👤 {t.datosCliente}
        </div>
        {[
          { k: "cliente",    l: t.clientePropietario, tip: t.tooltipCliente },
          { k: "descripcion",l: t.descripProy,         tip: t.tooltipDesc },
          { k: "referencia", l: t.referencia,           ph: t.referenciaPlaceholder },
          { k: "rut",        l: "RUT cliente",          ph: "Ej: 12.345.678-9" },
          { k: "telefono",   l: t.telefono },
          { k: "email",      l: t.email, type: "email" },
        ].map(f => {
          const err = getError(f.k);
          return (
            <div key={f.k} style={{ marginBottom: 10 }}>
              <label style={labelStyle}>
                {f.l}{f.tip && <Tip text={f.tip} />}
                {f.k === "cliente" && <span style={{ color: "#c53030", marginLeft: 2 }}>*</span>}
              </label>
              <input
                value={info[f.k] || ""}
                onChange={e => setInfo({ [f.k]: e.target.value })}
                onBlur={() => handleBlur(f.k)}
                type={f.type || "text"}
                placeholder={f.ph || (f.k === "telefono" ? "+569XXXXXXXX" : "")}
                style={{
                  ...inputStyle,
                  border: err ? "1px solid #fc8181" : "1px solid #e2e8f0",
                  background: err ? "#fff5f5" : "white",
                }}
              />
              {err && (
                <div style={{ fontSize: 11, color: "#c53030", marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                  ⚠️ {err}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Obra + Fechas */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d", marginBottom: 12, borderBottom: "2px solid #ebf8ff", paddingBottom: 7 }}>
            📍 Obra
          </div>
          {[
            { k: "direccion", l: t.direccionObra, tip: t.tooltipDir },
            { k: "ciudad",    l: t.ciudad },
          ].map(f => (
            <div key={f.k} style={{ marginBottom: 10 }}>
              <label style={labelStyle}>{f.l}{f.tip && <Tip text={f.tip} />}</label>
              <input value={info[f.k] || ""} onChange={e => setInfo({ [f.k]: e.target.value })} style={inputStyle} />
            </div>
          ))}

          {/* Campi strutturati CRM — dati di valore per benchmark e AI */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8, marginBottom: 10 }}>
            <div>
              <label style={labelStyle}>Comuna / Sector</label>
              <input value={info.comuna || ""} onChange={e => setInfo({ comuna: e.target.value })} placeholder="Ej: Providencia, Ñuñoa, Viña del Mar" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>m² estimados</label>
              <input type="number" value={info.m2 || ""} onChange={e => setInfo({ m2: e.target.value })} placeholder="Superficie total" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8, marginBottom: 10 }}>
            <div>
              <label style={labelStyle}>Tipo de obra</label>
              <select value={info.tipoObra || ""} onChange={e => setInfo({ tipoObra: e.target.value })} style={inputStyle}>
                <option value="">— Seleccionar —</option>
                <option value="remodelacion_bano">Remodelación baño</option>
                <option value="remodelacion_cocina">Remodelación cocina</option>
                <option value="remodelacion_general">Remodelación general</option>
                <option value="ampliacion">Ampliación</option>
                <option value="obra_nueva">Obra nueva</option>
                <option value="pintura">Pintura</option>
                <option value="terraza">Terraza / Exterior</option>
                <option value="departamento">Departamento completo</option>
                <option value="oficina">Oficina / Local</option>
                <option value="techumbre">Techumbre</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>¿Cómo llegó el cliente?</label>
              <select value={info.fuenteLead || ""} onChange={e => setInfo({ fuenteLead: e.target.value })} style={inputStyle}>
                <option value="">— Seleccionar —</option>
                <option value="whatsapp">WhatsApp directo</option>
                <option value="referido">Referido / Boca a boca</option>
                <option value="web">Web / Google</option>
                <option value="instagram">Instagram / RRSS</option>
                <option value="feria">Feria / Evento</option>
                <option value="portal">Portal ObraNova</option>
                <option value="repetido">Cliente repetido</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 8 }}>
            {[
              { k: "fecha",         l: t.fecha,       tip: t.tooltipFecha },
              { k: "fechaInicio",   l: t.fechaInicio },
              { k: "fechaTermino",  l: t.fechaTerm },
            ].map(f => (
              <div key={f.k}>
                <label style={labelStyle}>{f.l}{f.tip && <Tip text={f.tip} />}</label>
                <input type="date" value={info[f.k] || ""} onChange={e => setInfo({ [f.k]: e.target.value })} style={inputStyle} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 10 }}>
            <div>
              <label style={labelStyle}>{t.validez}</label>
              <input type="number" value={validez} onChange={e => setValidez(parseInt(e.target.value) || 30)} min={1} style={inputStyle} />
            </div>
            {/* 3.9 Multi-moneda */}
            <div>
              <label style={labelStyle}>Moneda</label>
              <select value={info.moneda || "CLP"} onChange={e => setInfo({ moneda: e.target.value })} style={inputStyle}>
                <option value="CLP">🇨🇱 CLP — Peso chileno</option>
                <option value="USD">🇺🇸 USD — Dólar</option>
                <option value="UF">📈 UF — Unidad de Fomento</option>
                <option value="EUR">🇪🇺 EUR — Euro</option>
              </select>
            </div>
            <div>
              <label style={{ ...labelStyle, color: "#718096" }}>{t.vence}</label>
              <div style={{ padding: "9px 12px", background: "#f7fafc", borderRadius: 8, fontSize: 13, color: "#4a5568" }}>{venceDate}</div>
            </div>
          </div>
        </div>

        {/* Estado */}
        <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d", marginBottom: 12, borderBottom: "2px solid #ebf8ff", paddingBottom: 7 }}>
            🏷️ {t.estado}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {ESTADOS.map(e => (
              <button
                key={e}
                onClick={() => setEstado(e)}
                style={{
                  padding: "7px 16px", borderRadius: 99, cursor: "pointer", fontWeight: 700, fontSize: 13,
                  border: `2px solid ${estado === e ? ESTADO_COLORS[e] : "#e2e8f0"}`,
                  background: estado === e ? ESTADO_BG[e] : "white",
                  color: estado === e ? ESTADO_COLORS[e] : "#718096",
                  transition: "all .2s",
                }}
              >
                {t[e.toLowerCase()] || e}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Porcentajes */}
      <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d", marginBottom: 12, borderBottom: "2px solid #ebf8ff", paddingBottom: 7 }}>
          ⚙️ {t.porcentajes}
        </div>
        {[
          { k: "ci",          l: t.costosIndirectos,  c: "#276749" },
          { k: "gf",          l: t.gastosFijos,        c: "#c05621" },
          { k: "imprevistos", l: t.imprevistos,        c: "#b7791f" },
          { k: "utilidad",    l: t.utilidad,           c: "#553c9a" },
        ].map(f => (
          <div key={f.k} style={{ marginBottom: 12 }}>
            <label style={{ ...labelStyle, color: f.c }}>{f.l} (%)</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="range" min={0} max={50} step={0.5}
                value={pct[f.k]}
                onChange={e => setPct({ [f.k]: parseFloat(e.target.value) })}
                style={{ flex: 1, accentColor: f.c }}
              />
              <input
                type="number" min={0} max={50} step={0.5}
                value={pct[f.k]}
                onChange={e => setPct({ [f.k]: parseFloat(e.target.value) || 0 })}
                style={{ width: 60, padding: "5px 8px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13, textAlign: "right", color: f.c, fontWeight: 700 }}
              />
              <span style={{ color: f.c, fontWeight: 700, fontSize: 13, width: 14 }}>%</span>
            </div>
          </div>
        ))}

        {/* IVA toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, padding: "10px 12px", background: "#f7fafc", borderRadius: 9 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#2d3748" }}>IVA 19%</span>
          <button
            onClick={() => setIva(!iva)}
            style={{
              padding: "5px 16px", borderRadius: 99, border: "none", cursor: "pointer",
              background: iva ? "#276749" : "#e2e8f0",
              color: iva ? "white" : "#718096",
              fontWeight: 700, fontSize: 12, transition: "all .2s",
            }}
          >{iva ? "ON" : "OFF"}</button>
        </div>
      </div>

      {/* Condiciones de pago */}
      <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d", marginBottom: 12, borderBottom: "2px solid #ebf8ff", paddingBottom: 7 }}>
          💳 {t.condPago}
        </div>

        {/* Tabs modalità */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
          {[
            { v: "cuotas",        l: t.cuotas },
            { v: "contado",       l: t.contado },
            { v: "transferencia", l: t.transferencia || "🏧 Transferencia" },
            { v: "credito",       l: t.credito },
            { v: "personalizado", l: t.personalizado },
          ].map(({ v, l }) => (
            <button key={v} onClick={() => setCondPago(v)} style={{
              padding: "7px 13px", borderRadius: 8, border: "none", cursor: "pointer",
              background: condPago === v ? "#1a365d" : "#f0f4f8",
              color: condPago === v ? "white" : "#4a5568",
              fontWeight: condPago === v ? 700 : 500, fontSize: 12, transition: "all .2s",
            }}>{l}</button>
          ))}
        </div>

        {/* Contado — solo descrizione */}
        {condPago === "contado" && (
          <div style={{ padding: "12px 14px", background: "#f0fff4", borderRadius: 9, border: "1px solid #9ae6b4", fontSize: 13, color: "#276749", fontWeight: 600 }}>
            💵 Pago total al momento de la firma o entrega. No requiere configuración adicional.
          </div>
        )}

        {/* Crédito — textarea libera */}
        {condPago === "credito" && (
          <textarea
            value={condPagoPersonalizado}
            onChange={e => setCondPagoPersonalizado(e.target.value)}
            placeholder="Ej: 30 días neto, 60/90 días, etc."
            rows={3}
            style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#1a365d", resize: "vertical", boxSizing: "border-box" }}
          />
        )}

        {/* Personalizado — textarea libera */}
        {condPago === "personalizado" && (
          <textarea
            value={condPagoPersonalizado}
            onChange={e => setCondPagoPersonalizado(e.target.value)}
            placeholder="Describe las condiciones de pago..."
            rows={3}
            style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#1a365d", resize: "vertical", boxSizing: "border-box" }}
          />
        )}

        {/* Transferencia — dati bancari */}
        {condPago === "transferencia" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#2b6cb0", marginBottom: 2 }}>
              🏧 {t.bancoDatos || "Datos bancarios"}
            </div>
            {[
              { k: "banco",       l: t.banco || "Banco",         ph: "Ej: Banco Estado, Santander..." },
              { k: "cuenta",      l: t.numeroCuenta || "N° Cuenta", ph: "Ej: 00-123456-7" },
              { k: "rutTitular",  l: t.rutTitular || "RUT Titular", ph: "Ej: 12.345.678-9" },
            ].map(f => (
              <div key={f.k}>
                <label style={{ ...labelStyle, marginBottom: 4 }}>{f.l} <span style={{ color: "#c53030" }}>*</span></label>
                <input
                  value={(transferencia || {})[f.k] || ""}
                  onChange={e => setTransferencia({ [f.k]: e.target.value })}
                  placeholder={f.ph}
                  style={{
                    ...inputStyle,
                    border: condPago === "transferencia" && !(transferencia || {})[f.k]?.trim()
                      ? "1px solid #fc8181" : "1px solid #e2e8f0",
                  }}
                />
              </div>
            ))}
            <div>
              <label style={labelStyle}>{t.notaTransferencia || "Nota (opcional)"}</label>
              <textarea
                value={(transferencia || {}).nota || ""}
                onChange={e => setTransferencia({ nota: e.target.value })}
                placeholder="Ej: Pagar antes del vencimiento del presupuesto"
                rows={2}
                style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#1a365d", resize: "vertical", boxSizing: "border-box" }}
              />
            </div>
            {/* Validazione visiva */}
            {["banco","cuenta","rutTitular"].some(k => !(transferencia || {})[k]?.trim()) && (
              <div style={{ fontSize: 11, color: "#c53030", display: "flex", alignItems: "center", gap: 5 }}>
                ⚠️ Completa los datos bancarios para que aparezcan en el PDF
              </div>
            )}
          </div>
        )}

        {/* Cuotas — con toggle % / $ e link MP */}
        {condPago === "cuotas" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

            {/* Indicatore % totale assegnato */}
            {cuotas.some(c => c.tipo === "pct") && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "6px 12px", borderRadius: 8,
                background: Math.abs(totalPctAsignado - 100) < 0.01 ? "#f0fff4" : totalPctAsignado > 100 ? "#fff5f5" : "#fffbeb",
                border: `1px solid ${Math.abs(totalPctAsignado - 100) < 0.01 ? "#9ae6b4" : totalPctAsignado > 100 ? "#feb2b2" : "#fbd38d"}`,
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#4a5568" }}>% total asignado</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: Math.abs(totalPctAsignado - 100) < 0.01 ? "#276749" : totalPctAsignado > 100 ? "#c53030" : "#c05621" }}>
                  {totalPctAsignado}% {Math.abs(totalPctAsignado - 100) < 0.01 ? "✅" : totalPctAsignado > 100 ? "⚠️ excede 100%" : `(faltan ${(100 - totalPctAsignado).toFixed(0)}%)`}
                </span>
              </div>
            )}

            {cuotas.map((c, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6, padding: "10px 12px", background: "#f7fafc", borderRadius: 9, border: "1px solid #e2e8f0" }}>

                {/* Riga 1: etichetta + elimina */}
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    value={c.desc}
                    onChange={e => { const nc = [...cuotas]; nc[i] = { ...nc[i], desc: e.target.value }; setCuotas(nc); }}
                    placeholder={`${t.cuotaLabel || "Cuota"} ${i + 1}`}
                    style={{ flex: 1, padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12, color: "#1a365d", minWidth: 0 }}
                  />
                  <button
                    onClick={() => setCuotas(cuotas.filter((_, j) => j !== i))}
                    aria-label="Eliminar cuota"
                    style={{ background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 7, cursor: "pointer", color: "#c53030", padding: "5px 10px", fontSize: 13, fontWeight: 700, flexShrink: 0 }}
                  >✕</button>
                </div>

                {/* Riga 2: toggle % / $ + input monto */}
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  {/* Toggle tipo */}
                  <div style={{ display: "flex", borderRadius: 7, overflow: "hidden", border: "1px solid #e2e8f0", flexShrink: 0 }}>
                    {[{ v: "pct", l: "%" }, { v: "fijo", l: "$" }].map(opt => (
                      <button key={opt.v} onClick={() => { const nc = [...cuotas]; nc[i] = { ...nc[i], tipo: opt.v }; setCuotas(nc); }}
                        style={{
                          padding: "7px 14px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
                          background: (c.tipo || "pct") === opt.v ? "#1a365d" : "white",
                          color: (c.tipo || "pct") === opt.v ? "white" : "#718096",
                          transition: "all .15s",
                        }}>{opt.l}</button>
                    ))}
                  </div>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={c.monto === 0 ? "" : c.monto}
                    onChange={e => { const nc = [...cuotas]; nc[i] = { ...nc[i], monto: parseFloat(e.target.value) || 0 }; setCuotas(nc); }}
                    placeholder={(c.tipo || "pct") === "pct" ? "%" : "Monto $"}
                    min={0}
                    style={{ flex: 1, padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 14, color: "#1a365d", minWidth: 80, fontWeight: 700 }}
                  />
                  {/* Monto calcolato se % — inline su desktop, sotto su mobile */}
                  {(c.tipo || "pct") === "pct" && totalConIva > 0 && (c.monto || 0) > 0 && (
                    <span style={{ fontSize: 12, color: "#276749", flexShrink: 0, fontWeight: 700,
                      background: "#f0fff4", padding: "4px 8px", borderRadius: 6, border: "1px solid #9ae6b4" }}>
                      ≈ ${Math.round(totalConIva * (c.monto || 0) / 100).toLocaleString("es-CL")}
                    </span>
                  )}
                </div>

                {/* Riga 3: data */}
                <div>
                  <input
                    type="date"
                    value={c.fecha}
                    onChange={e => { const nc = [...cuotas]; nc[i] = { ...nc[i], fecha: e.target.value }; setCuotas(nc); }}
                    style={{ width: "100%", padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12, color: "#1a365d", boxSizing: "border-box" }}
                  />
                </div>

                {/* Riga 4: toggle pagado */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: c.pagado ? "#f0fff4" : "#f7fafc", borderRadius: 8, border: `1px solid ${c.pagado ? "#9ae6b4" : "#e2e8f0"}` }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: c.pagado ? "#276749" : "#718096" }}>
                    {c.pagado ? "✅ Pagada" : "⏳ Pendiente"}
                  </span>
                  <button
                    onClick={() => { const nc = [...cuotas]; nc[i] = { ...nc[i], pagado: !c.pagado }; setCuotas(nc); }}
                    style={{
                      padding: "4px 12px", borderRadius: 99, border: "none", cursor: "pointer",
                      background: c.pagado ? "#276749" : "#e2e8f0",
                      color: c.pagado ? "white" : "#718096",
                      fontWeight: 700, fontSize: 11, transition: "all .2s",
                    }}
                  >{c.pagado ? "Marcar pendiente" : "Marcar pagada"}</button>
                </div>

                {/* Riga 5: link MP */}
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {c.mpLink ? (
                    <>
                      <a href={c.mpLink} target="_blank" rel="noopener noreferrer"
                        style={{ flex: 1, padding: "6px 10px", background: "#009ee3", color: "white", borderRadius: 7, fontSize: 11, fontWeight: 700, textAlign: "center", textDecoration: "none", display: "block" }}>
                        💳 {t.pagarOnline || "Pagar online"}
                      </a>
                      <button
                        onClick={() => { navigator.clipboard.writeText(c.mpLink); }}
                        title="Copiar link"
                        style={{ padding: "6px 10px", background: "#ebf8ff", border: "1px solid #bee3f8", borderRadius: 7, cursor: "pointer", fontSize: 11, color: "#2b6cb0", fontWeight: 600, flexShrink: 0 }}>
                        📋
                      </button>
                      <button
                        onClick={() => { const nc = [...cuotas]; nc[i] = { ...nc[i], mpLink: "" }; setCuotas(nc); }}
                        title="Eliminar link"
                        style={{ padding: "6px 8px", background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 7, cursor: "pointer", fontSize: 11, color: "#c53030", flexShrink: 0 }}>
                        ✕
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => crearLinkMP(i)}
                      disabled={mpLoading[i] || montoEfectivo(c) <= 0}
                      style={{
                        flex: 1, padding: "6px 10px", borderRadius: 7, border: "none", cursor: montoEfectivo(c) > 0 ? "pointer" : "not-allowed",
                        background: montoEfectivo(c) > 0 ? "#009ee3" : "#e2e8f0",
                        color: montoEfectivo(c) > 0 ? "white" : "#a0aec0",
                        fontSize: 11, fontWeight: 700, transition: "all .2s",
                        opacity: mpLoading[i] ? 0.7 : 1,
                      }}>
                      {mpLoading[i] ? "⏳ Generando..." : (t.generarLinkMP || "🔗 Generar link MP")}
                    </button>
                  )}
                </div>

              </div>
            ))}

            <button
              onClick={() => setCuotas([...cuotas, { monto: 0, tipo: "pct", fecha: "", desc: "", mpLink: "" }])}
              style={{ padding: "8px", background: "#ebf8ff", border: "1px solid #bee3f8", borderRadius: 8, cursor: "pointer", color: "#2b6cb0", fontSize: 12, fontWeight: 600 }}
            >+ {t.agregar || "Agregar"} cuota</button>
          </div>
        )}

      </div>

      {/* ── Portal del cliente ───────────────────────────────────────────── */}
      {portalConfig && setPortalConfig && (
        <PortalConfigPanel portalConfig={portalConfig} setPortalConfig={setPortalConfig}
          workspaceId={workspaceId} proyectoId={proyectoId} />
      )}

    </div>
    </div>
  );
}

// ── Panel configurazione portal cliente ───────────────────────────────────────

function PortalConfigPanel({ portalConfig, setPortalConfig, workspaceId, proyectoId }) {
  const [open, setOpen] = useState(false);
  const [copiedPortal, setCopiedPortal] = useState(false);
  const cfg = portalConfig || {};

  const toggle = (key) => {
    setPortalConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const portalUrl = workspaceId && proyectoId
    ? `${window.location.origin}/cliente/${workspaceId}/${proyectoId}`
    : null;

  return (
    <div style={{ margin: "16px 0", border: "1px solid #e2e8f0", borderRadius: 12 }}>
      {/* Header collassabile */}
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", background: open ? "#EBF5FB" : "#f8fafc",
        border: "none", cursor: "pointer", borderBottom: open ? "1px solid #e2e8f0" : "none",
        borderRadius: open ? "12px 12px 0 0" : 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>🌐</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1a365d" }}>Portal del cliente</span>
          <span style={{ fontSize: 11, color: "#718096" }}>
            — {PORTAL_SECTIONS.filter(s => cfg[s.key] !== false).length} secciones visibles
          </span>
        </div>
        <span style={{ color: "#718096", fontSize: 12 }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div style={{ padding: "14px 16px", background: "white" }}>
          {/* Link portal */}
          {portalUrl && (
            <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center",
              background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px" }}>
              <span style={{ fontSize: 11, color: "#718096", flex: 1,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {portalUrl}
              </span>
              <button onClick={() => { navigator.clipboard.writeText(portalUrl); setCopiedPortal(true); setTimeout(() => setCopiedPortal(false), 2000); }} style={{
                padding: "4px 10px", background: copiedPortal ? "#276749" : "#1a365d", color: "white",
                border: "none", borderRadius: 6, fontSize: 11, cursor: "pointer", flexShrink: 0,
                transition: "background 0.2s",
              }}>{copiedPortal ? "✓ Copiado" : "Copiar"}</button>
            </div>
          )}

          {/* Toggle sezioni */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {PORTAL_SECTIONS.map(s => {
              const active = cfg[s.key] !== false; // default true
              return (
                <div key={s.key} onClick={() => toggle(s.key)} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
                  borderRadius: 8, cursor: "pointer",
                  border: `1px solid ${active ? "#90cdf4" : "#e2e8f0"}`,
                  background: active ? "#EBF5FB" : "#f8fafc",
                  transition: "all .15s",
                }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{s.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700,
                      color: active ? "#1a365d" : "#718096",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {s.label}
                    </div>
                    <div style={{ fontSize: 10, color: "#a0aec0",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {s.desc}
                    </div>
                  </div>
                  <div style={{
                    width: 32, height: 18, borderRadius: 9, flexShrink: 0,
                    background: active ? "#2b6cb0" : "#e2e8f0",
                    position: "relative", transition: "background .2s",
                  }}>
                    <div style={{
                      position: "absolute", top: 2,
                      left: active ? 16 : 2,
                      width: 14, height: 14, borderRadius: "50%",
                      background: "white", transition: "left .2s",
                    }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: 10, color: "#a0aec0", marginTop: 10, textAlign: "center" }}>
            Los cambios se aplican en tiempo real al portal del cliente
          </div>
        </div>
      )}
    </div>
  );
}
