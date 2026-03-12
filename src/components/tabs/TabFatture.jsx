// ─── components/tabs/TabFatture.jsx ──────────────────────────────────────────
import { useState, useMemo } from "react";
import { EMPRESA, CAT_COLORS } from "../../utils/constants";
import { LOGO_URL } from "../../utils/logo";

const fmt = (n) => n == null ? "—" : Number(n).toLocaleString("es-CL", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function calcTotals(partidas, pct) {
  const cd = (partidas || []).filter(p => p.visible !== false).reduce((s, p) => s + (p.cant || 0) * (p.pu || 0), 0);
  const ci = cd * (pct.ci || 0) / 100;
  const gf = cd * (pct.gf || 0) / 100;
  const imprev = cd * (pct.imprevistos || 0) / 100;
  const sub = cd + ci + gf + imprev;
  const util = sub * (pct.utilidad || 0) / 100;
  const total = sub + util;
  const ivaAmt = total * 0.19;
  const totalIva = total + ivaAmt;
  return { cd, ci, gf, imprev, sub, util, total, ivaAmt, totalIva };
}

// Lee configuración tributaria
function getEmpresaSettings() {
  const saved = localStorage.getItem("empresa_settings");
  return saved ? JSON.parse(saved) : {
    rut: "", razonSocial: "", giro: "", direccion: "", ciudad: "",
    telefono: "", email: "", tipoContribuyente: "empresa",
  };
}

// ─── Modal Nueva Factura ──────────────────────────────────────────────────────
function ModalNuovaFattura({ proy, prossimoNumero, onSalva, onClose }) {
  const empresa       = getEmpresaSettings();
  const esHonorarios  = empresa.tipoContribuyente === "persona_natural";
  const totals        = calcTotals(proy.partidas, proy.pct);
  const neto          = totals.total;
  const retencion     = esHonorarios ? Math.round(neto * 0.10) : 0;
  const totale        = esHonorarios ? neto - retencion : (proy.iva ? totals.totalIva : neto);

  const [form, setForm] = useState({
    numero:          prossimoNumero,
    dataFattura:     new Date().toISOString().slice(0, 10),
    dataVencimiento: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    note:            "",
    importe:         totale,
    retencion:       retencion,
    iva:             esHonorarios ? 0 : (proy.iva ? Math.round(totals.ivaAmt) : 0),
  });

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "white", borderRadius: 16, padding: 28, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,.35)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#1a365d" }}>🧾 Nueva Factura</div>
          <button onClick={onClose} style={{ background: "#2d3748", border: "none", borderRadius: 8, cursor: "pointer", padding: "5px 12px", color: "white", fontWeight: 700 }}>✕</button>
        </div>

        {/* Info progetto */}
        <div style={{ background: "#f7fafc", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12 }}>
          <div style={{ fontWeight: 700, color: "#1a365d" }}>{proy.info?.cliente || "—"}</div>
          <div style={{ color: "#718096" }}>{proy.info?.descripcion || "—"}</div>
          <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
            <div>
              <div style={{ fontSize: 10, color: "#a0aec0" }}>Monto neto</div>
              <div style={{ fontWeight: 700, color: "#2d3748" }}>{fmt(neto)}</div>
            </div>
            {esHonorarios && (
              <div>
                <div style={{ fontSize: 10, color: "#a0aec0" }}>Retención 10%</div>
                <div style={{ fontWeight: 700, color: "#553c9a" }}>- {fmt(retencion)}</div>
              </div>
            )}
            {!esHonorarios && proy.iva && (
              <div>
                <div style={{ fontSize: 10, color: "#a0aec0" }}>IVA 19%</div>
                <div style={{ fontWeight: 700, color: "#c05621" }}>{fmt(Math.round(totals.ivaAmt))}</div>
              </div>
            )}
            <div>
              <div style={{ fontSize: 10, color: "#a0aec0" }}>Total a cobrar</div>
              <div style={{ fontWeight: 800, color: "#276749", fontSize: 15 }}>{fmt(totale)}</div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: "#718096", fontWeight: 600, display: "block", marginBottom: 4 }}>N° Factura</label>
            <input value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))}
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#718096", fontWeight: 600, display: "block", marginBottom: 4 }}>Importe a cobrar (CLP)</label>
            <input type="number" value={form.importe} onChange={e => setForm(f => ({ ...f, importe: parseFloat(e.target.value) || 0 }))}
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#718096", fontWeight: 600, display: "block", marginBottom: 4 }}>Fecha factura</label>
            <input type="date" value={form.dataFattura} onChange={e => setForm(f => ({ ...f, dataFattura: e.target.value }))}
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#718096", fontWeight: 600, display: "block", marginBottom: 4 }}>Vencimiento pago</label>
            <input type="date" value={form.dataVencimiento} onChange={e => setForm(f => ({ ...f, dataVencimiento: e.target.value }))}
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13 }} />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: "#718096", fontWeight: 600, display: "block", marginBottom: 4 }}>Notas (opcional)</label>
          <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            rows={2} placeholder="Ej. Transferencia bancaria..."
            style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, resize: "vertical" }} />
        </div>

        <button onClick={() => onSalva({ ...form, esHonorarios, tipoContribuyente: empresa.tipoContribuyente })}
          style={{ width: "100%", padding: 12, background: "#1a365d", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: 15 }}>
          ✅ Crear factura
        </button>
      </div>
    </div>
  );
}

// ─── PDF Factura ──────────────────────────────────────────────────────────────
function PDFFattura({ fattura, proy, onClose }) {
  const empresa      = getEmpresaSettings();
  const esHonorarios = fattura.tipoContribuyente === "persona_natural" || fattura.esHonorarios;
  const totals       = calcTotals(proy.partidas, proy.pct);

  // Datos emisor: usa empresa_settings si disponible, fallback a constantes
  const emisor = {
    nombre:    empresa.razonSocial || EMPRESA.nombre,
    rut:       empresa.rut        || EMPRESA.rut,
    giro:      empresa.giro       || EMPRESA.giro,
    direccion: empresa.direccion  || EMPRESA.direccion,
    ciudad:    empresa.ciudad     || EMPRESA.ciudad,
    telefono:  empresa.telefono   || EMPRESA.telefono,
    email:     empresa.email      || EMPRESA.email,
  };

  const neto      = Math.round(totals.total);
  const retencion = esHonorarios ? Math.round(neto * 0.10) : 0;
  const iva       = (!esHonorarios && proy.iva) ? Math.round(totals.ivaAmt) : 0;
  const totalDoc  = esHonorarios ? neto - retencion : (proy.iva ? Math.round(totals.totalIva) : neto);

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", zIndex: 4000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 16, overflowY: "auto" }}>
      <div style={{ background: "white", width: "100%", maxWidth: 800, borderRadius: 12, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,.5)" }}>

        {/* Barra azioni */}
        <div style={{ background: "#1a365d", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: "white", fontWeight: 700, fontSize: 14 }}>🧾 Factura N° {fattura.numero}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => window.print()} style={{ padding: "6px 14px", background: "#276749", color: "white", border: "none", borderRadius: 7, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>🖨️ Imprimir PDF</button>
            <button onClick={onClose} style={{ padding: "6px 12px", background: "rgba(255,255,255,.2)", color: "white", border: "none", borderRadius: 7, cursor: "pointer", fontWeight: 700 }}>✕</button>
          </div>
        </div>

        {/* Contenido factura */}
        <div id="print-area" style={{ padding: "32px 36px", fontSize: 12 }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, paddingBottom: 16, borderBottom: "3px solid #1a365d" }}>
            <div>
              <img src={LOGO_URL} alt="" style={{ height: 44, marginBottom: 6 }} onError={e => { e.target.style.display = "none"; }} />
              <div style={{ fontWeight: 800, fontSize: 16, color: "#1a365d" }}>{emisor.nombre}</div>
              <div style={{ color: "#718096", fontSize: 11 }}>RUT {emisor.rut} · {emisor.giro}</div>
              <div style={{ color: "#718096", fontSize: 11 }}>{emisor.direccion}{emisor.ciudad ? `, ${emisor.ciudad}` : ""}</div>
              <div style={{ color: "#718096", fontSize: 11 }}>{emisor.telefono} · {emisor.email}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#1a365d", marginBottom: 4 }}>
                {esHonorarios ? "BOLETA HONORARIOS" : "FACTURA"}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#2d3748" }}>N° {fattura.numero}</div>
              <div style={{ fontSize: 11, color: "#718096", marginTop: 4 }}>Fecha: {fattura.dataFattura}</div>
              <div style={{ fontSize: 11, color: "#718096" }}>Vencimiento: {fattura.dataVencimiento}</div>
              <span style={{ display: "inline-block", marginTop: 6, padding: "3px 12px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                background: fattura.pagata ? "#f0fff4" : "#fffff0",
                color:      fattura.pagata ? "#276749" : "#b7791f",
                border:     `1px solid ${fattura.pagata ? "#9ae6b4" : "#fef08a"}` }}>
                {fattura.pagata ? "✅ PAGADA" : "⏳ PENDIENTE"}
              </span>
            </div>
          </div>

          {/* Cliente */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div style={{ background: "#f7fafc", borderRadius: 9, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: "#a0aec0", fontWeight: 700, marginBottom: 6, letterSpacing: .5 }}>FACTURADO A</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d" }}>{proy.info?.cliente || "—"}</div>
              {proy.info?.telefono && <div style={{ fontSize: 11, color: "#4a5568", marginTop: 2 }}>📞 {proy.info.telefono}</div>}
              {proy.info?.email    && <div style={{ fontSize: 11, color: "#4a5568" }}>✉ {proy.info.email}</div>}
              {proy.info?.direccion && <div style={{ fontSize: 11, color: "#4a5568" }}>📍 {proy.info.direccion}{proy.info.ciudad ? ", " + proy.info.ciudad : ""}</div>}
            </div>
            <div style={{ background: "#f7fafc", borderRadius: 9, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: "#a0aec0", fontWeight: 700, marginBottom: 6, letterSpacing: .5 }}>OBRA</div>
              <div style={{ fontWeight: 600, fontSize: 13, color: "#2d3748" }}>{proy.info?.descripcion || "—"}</div>
              {proy.info?.fechaInicio && <div style={{ fontSize: 11, color: "#4a5568", marginTop: 2 }}>📅 {proy.info.fechaInicio} → {proy.info.fechaTermino || "?"}</div>}
              <div style={{ fontSize: 11, color: "#718096", marginTop: 2 }}>Ref. presupuesto: {proy.currentId?.slice(-8) || "—"}</div>
            </div>
          </div>

          {/* Voci */}
          <div style={{ marginBottom: 20 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ background: "#1a365d", color: "white" }}>
                  {["Descripción", "Cat.", "U.M.", "Qty", "Precio unit.", "Total"].map((h, i) => (
                    <th key={i} style={{ padding: "8px 10px", textAlign: i > 2 ? "right" : "left", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(proy.partidas || []).filter(p => p.visible !== false && p.cant * p.pu > 0).map((p, i) => (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? "#f7fafc" : "white" }}>
                    <td style={{ padding: "7px 10px", color: "#2d3748" }}>{p.nombre}</td>
                    <td style={{ padding: "7px 8px", color: "#718096" }}>{p.cat}</td>
                    <td style={{ padding: "7px 8px", textAlign: "right", color: "#718096" }}>{p.unidad}</td>
                    <td style={{ padding: "7px 8px", textAlign: "right", color: "#718096" }}>{p.cant}</td>
                    <td style={{ padding: "7px 10px", textAlign: "right", color: "#718096" }}>{fmt(p.pu)}</td>
                    <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: 700, color: "#1a365d" }}>{fmt(p.cant * p.pu)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totali con IVA / Retención */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
            <div style={{ width: 300 }}>
              {[
                ["Base imponible", totals.cd],
                proy.pct?.ci > 0        && [`C.Indirectos (${proy.pct.ci}%)`,        totals.ci],
                proy.pct?.gf > 0        && [`Gastos fijos (${proy.pct.gf}%)`,         totals.gf],
                proy.pct?.imprevistos>0 && [`Imprevistos (${proy.pct.imprevistos}%)`, totals.imprev],
                proy.pct?.utilidad > 0  && [`Utilidad (${proy.pct.utilidad}%)`,        totals.util],
                ["Monto Neto", neto, true],
                esHonorarios && ["Retención 10% (SII)", -retencion, false, false, "#553c9a"],
                !esHonorarios && proy.iva && ["IVA 19%", iva, false, false, "#c05621"],
                ["TOTAL DOCUMENTO", esHonorarios ? neto - retencion : (proy.iva ? neto + iva : neto), true, true],
              ].filter(Boolean).map(([label, value, bold, big, color]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: big ? "10px 12px" : "5px 0",
                  background: big ? "#1a365d" : "transparent", borderRadius: big ? 8 : 0,
                  borderTop: bold && !big ? "1px solid #e2e8f0" : "none", marginBottom: big ? 0 : 2 }}>
                  <span style={{ fontSize: big ? 13 : 11, color: big ? "white" : color || (bold ? "#2d3748" : "#718096"), fontWeight: bold ? 700 : 400 }}>{label}</span>
                  <span style={{ fontSize: big ? 15 : 12, color: big ? "white" : color || (bold ? "#1a365d" : "#4a5568"), fontWeight: big ? 900 : bold ? 700 : 500 }}>
                    {value < 0 ? `- ${fmt(Math.abs(value))}` : fmt(value)}
                  </span>
                </div>
              ))}

              {/* Box retención / IVA */}
              {esHonorarios && (
                <div style={{ marginTop: 10, background: "#faf5ff", border: "1px solid #d6bcfa", borderRadius: 8, padding: "8px 12px", fontSize: 11 }}>
                  <div style={{ fontWeight: 700, color: "#553c9a", marginBottom: 3 }}>📋 Retención de Honorarios</div>
                  <div style={{ color: "#4a5568" }}>El cliente retiene <strong>{fmt(retencion)}</strong> (10%) y lo declara directamente al SII mediante Formulario 29.</div>
                </div>
              )}
              {!esHonorarios && proy.iva && (
                <div style={{ marginTop: 10, background: "#fffaf0", border: "1px solid #fbd38d", borderRadius: 8, padding: "8px 12px", fontSize: 11 }}>
                  <div style={{ fontWeight: 700, color: "#c05621", marginBottom: 3 }}>📋 IVA incluido</div>
                  <div style={{ color: "#4a5568" }}>IVA <strong>{fmt(iva)}</strong> a declarar en Formulario 29 del mes siguiente.</div>
                </div>
              )}
            </div>
          </div>

          {/* Note */}
          {fattura.note && (
            <div style={{ background: "#f7fafc", borderRadius: 9, padding: "10px 14px", marginBottom: 16, fontSize: 11, color: "#4a5568" }}>
              <div style={{ fontWeight: 700, color: "#1a365d", marginBottom: 4 }}>Notas:</div>
              {fattura.note}
            </div>
          )}

          {/* Footer */}
          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 12, textAlign: "center", fontSize: 10, color: "#a0aec0" }}>
            {emisor.nombre} · RUT {emisor.rut} · {emisor.email} · {emisor.telefono}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab principale ───────────────────────────────────────────────────────────
export function TabFatture({ proyectos, fatture, onCreaFattura, onTogglePagata, onEliminaFattura }) {
  const [showNuova,    setShowNuova]    = useState(false);
  const [proySelected, setProySelected] = useState(null);
  const [viewFattura,  setViewFattura]  = useState(null);
  const [filterStato,  setFilterStato]  = useState("Todos");
  const [search,       setSearch]       = useState("");

  const proyAceptados = proyectos.filter(p => p.estado === "Aceptado");

  const fattureFiltrate = useMemo(() => {
    let list = [...fatture];
    if (filterStato === "Pagadas")    list = list.filter(f => f.pagata);
    if (filterStato === "Pendientes") list = list.filter(f => !f.pagata);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(f =>
        (f.clienteNombre || "").toLowerCase().includes(q) ||
        String(f.numero || "").includes(q) ||
        (f.descripcionProy || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [fatture, filterStato, search]);

  const totaleCobrado  = useMemo(() => fatture.filter(f => f.pagata).reduce((s, f) => s + (f.importe || 0), 0), [fatture]);
  const totaleAttesa   = useMemo(() => fatture.filter(f => !f.pagata).reduce((s, f) => s + (f.importe || 0), 0), [fatture]);
  const prossimoNumero = useMemo(() => {
    if (!fatture.length) return `F-${new Date().getFullYear()}-001`;
    const nums = fatture.map(f => parseInt((f.numero || "0").replace(/\D/g, "")) || 0);
    const next = Math.max(...nums) + 1;
    return `F-${new Date().getFullYear()}-${String(next).padStart(3, "0")}`;
  }, [fatture]);

  // Resumen tributario mensile
  const mesActual      = new Date().toISOString().slice(0, 7);
  const fattureMes     = fatture.filter(f => f.creadoAt?.slice(0, 7) === mesActual);
  const totalIvaMes    = fattureMes.filter(f => !f.esHonorarios).reduce((s, f) => s + (f.iva || 0), 0);
  const totalRetMes    = fattureMes.filter(f => f.esHonorarios).reduce((s, f) => s + (f.retencion || 0), 0);

  const handleNuovaFattura = (proy) => { setProySelected(proy); setShowNuova(true); };
  const handleSalva = (form) => {
    if (!proySelected) return;
    onCreaFattura({ ...form, proyectoId: proySelected.id, proyInfo: proySelected.info, pagata: false, creadoAt: new Date().toISOString() });
    setShowNuova(false);
    setProySelected(null);
  };
  const getProyForFattura = (f) => proyectos.find(p => p.id === f.proyectoId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Modali */}
      {showNuova && proySelected && (
        <ModalNuovaFattura proy={proySelected} prossimoNumero={prossimoNumero} onSalva={handleSalva}
          onClose={() => { setShowNuova(false); setProySelected(null); }} />
      )}
      {viewFattura && getProyForFattura(viewFattura) && (
        <PDFFattura fattura={viewFattura} proy={getProyForFattura(viewFattura)} onClose={() => setViewFattura(null)} />
      )}

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1a365d,#2d3748)", borderRadius: 12, padding: "18px 20px", color: "white" }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 3 }}>🧾 Facturación</div>
        <div style={{ color: "#a0aec0", fontSize: 12, marginBottom: 12 }}>Convierte los presupuestos aceptados en facturas</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[
            { label: "Facturas totales", value: fatture.length,      color: "white" },
            { label: "Cobrado",          value: fmt(totaleCobrado),  color: "#68d391" },
            { label: "Pendiente",        value: fmt(totaleAttesa),   color: "#fef08a" },
            { label: "Presupuestos ok",  value: proyAceptados.length, color: "#90cdf4" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "rgba(255,255,255,.1)", borderRadius: 9, padding: "8px 16px", textAlign: "center", minWidth: 90 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color }}>{value}</div>
              <div style={{ fontSize: 10, color: "#a0aec0" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Resumen tributario mensile */}
      {(totalIvaMes > 0 || totalRetMes > 0) && (
        <div style={{ background: "white", borderRadius: 12, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,.07)", border: "1px solid #fbd38d" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#c05621", marginBottom: 10 }}>
            📊 Obligaciones tributarias — {new Date().toLocaleDateString("es-CL", { month: "long", year: "numeric" })}
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {totalIvaMes > 0 && (
              <div style={{ background: "#fffaf0", border: "1px solid #fbd38d", borderRadius: 9, padding: "10px 16px" }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#c05621" }}>{fmt(totalIvaMes)}</div>
                <div style={{ fontSize: 10, color: "#718096" }}>IVA 19% a declarar (F29)</div>
              </div>
            )}
            {totalRetMes > 0 && (
              <div style={{ background: "#faf5ff", border: "1px solid #d6bcfa", borderRadius: 9, padding: "10px 16px" }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#553c9a" }}>{fmt(totalRetMes)}</div>
                <div style={{ fontSize: 10, color: "#718096" }}>Retención honorarios (F29)</div>
              </div>
            )}
            <div style={{ fontSize: 11, color: "#718096", alignSelf: "center", maxWidth: 220 }}>
              Declara antes del <strong>12 del mes siguiente</strong> en mipyme.sii.cl
            </div>
          </div>
        </div>
      )}

      {/* Presupuestos aceptados */}
      {proyAceptados.length > 0 && (
        <div style={{ background: "white", borderRadius: 12, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#1a365d", marginBottom: 10 }}>
            ✅ Presupuestos aceptados — listos para facturar
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {proyAceptados.map(p => {
              const totals   = calcTotals(p.partidas, p.pct);
              const tot      = p.iva ? totals.totalIva : totals.total;
              const hasFattura = fatture.some(f => f.proyectoId === p.id);
              return (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f7fafc", borderRadius: 9, flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#1a365d" }}>{p.info?.cliente || "—"}</div>
                    <div style={{ fontSize: 11, color: "#718096" }}>{p.info?.descripcion || "—"}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "#276749" }}>{fmt(tot)}</div>
                    {hasFattura
                      ? <span style={{ padding: "3px 10px", background: "#ebf8ff", color: "#2b6cb0", borderRadius: 99, fontSize: 11, fontWeight: 700 }}>Facturado</span>
                      : <button onClick={() => handleNuovaFattura(p)}
                          style={{ padding: "6px 14px", background: "#1a365d", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
                          🧾 Crear factura
                        </button>
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filtri + ricerca */}
      <div style={{ background: "white", borderRadius: 12, padding: "12px 14px", boxShadow: "0 1px 4px rgba(0,0,0,.07)", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#1a365d", marginRight: 4 }}>Historial facturas</div>
          <div style={{ display: "flex", gap: 4, background: "#f0f4f8", borderRadius: 8, padding: 3 }}>
            {["Todos", "Pagadas", "Pendientes"].map(v => (
              <button key={v} onClick={() => setFilterStato(v)}
                style={{ padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600,
                  background: filterStato === v ? "#2b6cb0" : "transparent",
                  color:      filterStato === v ? "white"   : "#718096" }}>
                {v}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: "auto", fontSize: 11, color: "#a0aec0", fontWeight: 600 }}>
            {fattureFiltrate.length} de {fatture.length}
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#a0aec0" }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por cliente, descripción, número..."
            style={{ width: "100%", padding: "8px 12px 8px 30px", border: "1.5px solid #e2e8f0",
              borderRadius: 8, fontSize: 12, color: "#1a365d", boxSizing: "border-box", outline: "none" }} />
          {search && (
            <button onClick={() => setSearch("")}
              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#a0aec0" }}>✕</button>
          )}
        </div>
      </div>

      {/* Lista fatture */}
      {fattureFiltrate.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 0", color: "#a0aec0", background: "white", borderRadius: 12 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🧾</div>
          <div>Sin facturas aún</div>
          <div style={{ fontSize: 11, marginTop: 6 }}>Acepta un presupuesto y haz clic en "Crear factura"</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {fattureFiltrate.map(f => {
            const scaduta = !f.pagata && f.dataVencimiento && new Date(f.dataVencimiento) < new Date();
            return (
              <div key={f.id} style={{ background: "white", borderRadius: 12, padding: "14px 18px", boxShadow: "0 1px 4px rgba(0,0,0,.07)",
                display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10,
                borderLeft: `4px solid ${f.pagata ? "#68d391" : scaduta ? "#fc8181" : "#fef08a"}` }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: "#1a365d" }}>N° {f.numero}</span>
                    <span style={{ padding: "2px 9px", borderRadius: 99, fontSize: 10, fontWeight: 700,
                      background: f.pagata ? "#f0fff4" : scaduta ? "#fff5f5" : "#fffff0",
                      color:      f.pagata ? "#276749" : scaduta ? "#c53030" : "#b7791f",
                      border:     `1px solid ${f.pagata ? "#9ae6b4" : scaduta ? "#fed7d7" : "#fef08a"}` }}>
                      {f.pagata ? "✅ Pagada" : scaduta ? "🔴 Vencida" : "⏳ Pendiente"}
                    </span>
                    {f.esHonorarios && (
                      <span style={{ padding: "2px 7px", borderRadius: 99, fontSize: 10, fontWeight: 700, background: "#faf5ff", color: "#553c9a", border: "1px solid #d6bcfa" }}>
                        Honorarios
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "#2d3748", fontWeight: 600 }}>{f.proyInfo?.cliente || "—"}</div>
                  <div style={{ fontSize: 11, color: "#718096" }}>
                    Emitida: {f.dataFattura} · Vencimiento: {f.dataVencimiento}
                    {f.retencion > 0 && <span style={{ color: "#553c9a", marginLeft: 8 }}>· Ret. {fmt(f.retencion)}</span>}
                    {f.iva > 0      && <span style={{ color: "#c05621", marginLeft: 8 }}>· IVA {fmt(f.iva)}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 900, fontSize: 16, color: "#276749" }}>{fmt(f.importe)}</div>
                    <div style={{ fontSize: 10, color: "#a0aec0" }}>importe neto</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setViewFattura(f)}
                      style={{ padding: "5px 10px", background: "#ebf8ff", border: "1px solid #bee3f8", borderRadius: 7, cursor: "pointer", color: "#2b6cb0", fontSize: 11, fontWeight: 600 }}>
                      🖨️ PDF
                    </button>
                    <button onClick={() => onTogglePagata(f.id, !f.pagata)}
                      style={{ padding: "5px 10px", background: f.pagata ? "#fff5f5" : "#f0fff4", border: `1px solid ${f.pagata ? "#fed7d7" : "#9ae6b4"}`, borderRadius: 7, cursor: "pointer", color: f.pagata ? "#c53030" : "#276749", fontSize: 11, fontWeight: 600 }}>
                      {f.pagata ? "↩ Revertir" : "✅ Pagada"}
                    </button>
                    <button onClick={() => onEliminaFattura(f.id)}
                      style={{ padding: "5px 8px", background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 7, cursor: "pointer", color: "#c53030", fontSize: 11 }}>
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
