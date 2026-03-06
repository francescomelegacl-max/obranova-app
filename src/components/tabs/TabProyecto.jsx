// ─── components/tabs/TabProyecto.jsx ────────────────────────────────────────
import { useState, useEffect } from "react";
import { Tip } from "../UI";
import { ESTADOS, ESTADO_COLORS, ESTADO_BG } from "../../utils/constants";
import ModalTemplates from "../ModalTemplates";

export default function TabProyecto({
  info, setInfo,
  pct, setPct,
  estado, setEstado,
  iva, setIva,
  validez, setValidez,
  condPago, setCondPago,
  condPagoPersonalizado, setCondPagoPersonalizado,
  cuotas, setCuotas,
  partidas = [],
  t,
}) {
  const [showTemplates,   setShowTemplates]   = useState(false);
  const [templateApplied, setTemplateApplied] = useState("");
  const [isMobile, setIsMobile] = useState(() => window.matchMedia("(max-width: 767px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  const venceDate = info.fecha
    ? new Date(new Date(info.fecha).getTime() + validez * 86400000).toLocaleDateString("es-CL")
    : "—";

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

      {/* Modal Templates */}
      {showTemplates && (
        <ModalTemplates
          partidas={partidas} pct={pct}
          condPago={condPago} condPagoPersonalizado={condPagoPersonalizado}
          cuotas={cuotas} iva={iva}
          onApplyTemplate={handleApplyTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {/* Barra templates */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "white", borderRadius: 12, padding: "12px 16px",
        boxShadow: "0 1px 4px rgba(0,0,0,.07)", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1a365d" }}>📋 Templates</span>
          <span style={{ fontSize: 12, color: "#718096" }}>Carga configuraciones guardadas o guarda esta como template</span>
        </div>
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
            📋 Gestionar templates
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
          { k: "telefono",   l: t.telefono },
          { k: "email",      l: t.email, type: "email" },
        ].map(f => (
          <div key={f.k} style={{ marginBottom: 10 }}>
            <label style={labelStyle}>
              {f.l}{f.tip && <Tip text={f.tip} />}
            </label>
            <input
              value={info[f.k] || ""}
              onChange={e => setInfo({ [f.k]: e.target.value })}
              type={f.type || "text"}
              placeholder={f.ph || ""}
              style={inputStyle}
            />
          </div>
        ))}
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
          <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{t.validez}</label>
              <input type="number" value={validez} onChange={e => setValidez(parseInt(e.target.value) || 30)} min={1} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
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
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 14 }}>
          {[
            { v: "cuotas",       l: t.cuotas },
            { v: "contado",      l: t.contado },
            { v: "credito",      l: t.credito },
            { v: "personalizado",l: t.personalizado },
          ].map(({ v, l }) => (
            <button
              key={v}
              onClick={() => setCondPago(v)}
              style={{
                padding: "7px 13px", borderRadius: 8, border: "none", cursor: "pointer",
                background: condPago === v ? "#1a365d" : "#f0f4f8",
                color: condPago === v ? "white" : "#4a5568",
                fontWeight: condPago === v ? 700 : 500, fontSize: 12, transition: "all .2s",
              }}
            >{l}</button>
          ))}
        </div>

        {condPago === "personalizado" && (
          <textarea
            value={condPagoPersonalizado}
            onChange={e => setCondPagoPersonalizado(e.target.value)}
            placeholder="Describe las condiciones..."
            rows={3}
            style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#1a365d", resize: "vertical" }}
          />
        )}

        {condPago === "cuotas" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {cuotas.map((c, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6, padding: "10px", background: "#f7fafc", borderRadius: 9, border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input
                    value={c.desc}
                    onChange={e => { const nc = [...cuotas]; nc[i] = { ...nc[i], desc: e.target.value }; setCuotas(nc); }}
                    placeholder={t.cuotaLabel + " " + (i + 1)}
                    style={{ flex: 1, padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12, color: "#1a365d" }}
                  />
                  <button
                    onClick={() => setCuotas(cuotas.filter((_, j) => j !== i))}
                    aria-label="Eliminar cuota"
                    style={{ background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 7, cursor: "pointer", color: "#c53030", padding: "5px 10px", fontSize: 13, fontWeight: 700, flexShrink: 0 }}
                  >✕</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <input
                    type="number"
                    value={c.monto}
                    onChange={e => { const nc = [...cuotas]; nc[i] = { ...nc[i], monto: parseFloat(e.target.value) || 0 }; setCuotas(nc); }}
                    placeholder="Monto"
                    style={{ padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12, color: "#1a365d" }}
                  />
                  <input
                    type="date"
                    value={c.fecha}
                    onChange={e => { const nc = [...cuotas]; nc[i] = { ...nc[i], fecha: e.target.value }; setCuotas(nc); }}
                    style={{ padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 12, color: "#1a365d" }}
                  />
                </div>
              </div>
            ))}
            <button
              onClick={() => setCuotas([...cuotas, { monto: 0, fecha: "", desc: "" }])}
              style={{ padding: "7px", background: "#ebf8ff", border: "1px solid #bee3f8", borderRadius: 8, cursor: "pointer", color: "#2b6cb0", fontSize: 12, fontWeight: 600 }}
            >+ {t.agregar} cuota</button>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
