// ─── components/tabs/OtherTabs.jsx ───────────────────────────────────────────
import { useMemo } from "react";
import { PieChart } from "../UI";
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

export function TabVistaCliente({ info, partidas, pct, cats, catVis, getCatVis, setCatVisKey, iva, estado, currentId, validez, t, onInviaFirma, firme = [] }) {
  const totals = useMemo(() => calcTotals(partidas, pct), [partidas, pct]);
  const { cd, ci, gf, imprevistos: imprev, sub, util, total, iva: ivaAmt, totalIva } = totals;

  const venceDate = info.fecha
    ? new Date(new Date(info.fecha).getTime() + validez * 86400000).toLocaleDateString("es-CL")
    : "—";

  return (
    <div>
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
            <img src={LOGO_URL} alt="" style={{ height: 46, marginBottom: 5 }} onError={e => { e.target.style.display = "none"; }} />
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: catColor, color: "white", padding: "6px 12px", borderRadius: "8px 8px 0 0" }}>
                  <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: .5 }}>{cat.toUpperCase()}</span>
                  <span style={{ fontWeight: 800, fontSize: 12 }}>{fmt(catTotal)}</span>
                </div>
                {cv.modo === "detalle" && (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, border: "1px solid #e2e8f0", borderTop: "none" }}>
                    <tbody>
                      {vis.map((p, j) => (
                        <tr key={p.id} style={{ background: j % 2 === 0 ? "#f7fafc" : "white" }}>
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
      </div>
    </div>
  );
}

// ─── TabProyectos ─────────────────────────────────────────────────────────────

export function TabProyectos({ proyectos, currentId, onLoad, onDelete, onPDF, t }) {
  if (proyectos.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "50px 0", color: "#a0aec0", background: "white", borderRadius: 12 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>📁</div>
        <div>{t.noProy}</div>
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
      {proyectos.map(p => {
        const ptot = calcProjectTotal(p);
        const isActive = p.id === currentId;
        return (
          <div
            key={p.id}
            onClick={() => onLoad(p)}
            role="button"
            tabIndex={0}
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
              <button
                onClick={e => { e.stopPropagation(); onPDF(p); }}
                style={{ flex: 1, padding: "5px", background: "#ebf8ff", border: "1px solid #bee3f8", borderRadius: 7, cursor: "pointer", color: "#2b6cb0", fontSize: 11, fontWeight: 600 }}
              >🖨️ PDF</button>
              <button
                onClick={e => { e.stopPropagation(); onDelete(p.id); }}
                aria-label="Eliminar proyecto"
                style={{ padding: "5px 9px", background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 7, cursor: "pointer", color: "#c53030", fontSize: 11 }}
              >🗑️</button>
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
  const steps = [
    { s: t.step1, d: "Haz clic en '+ Nuevo' para iniciar un presupuesto en blanco.", ic: "📁" },
    { s: t.step2, d: "Ve a 'Costos' y llena las partidas con cantidades y precios.", ic: "🏗️" },
    { s: t.step3, d: "Ajusta CI, GF, Imprevistos y Utilidad según el tipo de obra.", ic: "⚙️" },
    { s: t.step4, d: "En 'Resumen' verifica el margen y el total con/sin IVA.", ic: "📊" },
    { s: t.step5, d: "En 'Vista Cliente' configura la visibilidad por categoría antes de imprimir.", ic: "🖨️" },
  ];
  const features = [
    ["👁️ Visibilidad por categoría", "ON/OFF + modo detalle o solo total, separado por categoría"],
    ["🏷️ Categorías personalizables", "Agrega tus propias categorías desde el Listino — se guardan y reutilizan"],
    ["📦 Listino mejorado", "Precio compra + precio cliente + margen automático"],
    ["📈 Storico Materiali", "Historial de precios y tendencia por cada material"],
    ["🖼️ Galería global", "Accede a fotos de todos los proyectos desde el modal fotos"],
    ["📱 Responsive", "Funciona en móvil y tablet — tabs con scroll horizontal"],
  ];
  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ background: "linear-gradient(135deg,#1a365d,#2d3748)", borderRadius: 14, padding: "24px 28px", color: "white", marginBottom: 18 }}>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 5 }}>❓ {t.helpTitulo}</div>
        <div style={{ color: "#a0aec0", fontSize: 13 }}>{t.helpBienvenida}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ background: "white", borderRadius: 10, padding: "14px 16px", display: "flex", gap: 14, alignItems: "flex-start", boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
            <div style={{ fontSize: 26, flexShrink: 0 }}>{s.ic}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1a365d", marginBottom: 3 }}>{s.s}</div>
              <div style={{ fontSize: 12, color: "#718096", lineHeight: 1.5 }}>{s.d}</div>
            </div>
          </div>
        ))}
        <div style={{ background: "#ebf8ff", borderRadius: 10, padding: "14px 16px", border: "1px solid #bee3f8", marginTop: 4 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#2b6cb0", marginBottom: 8 }}>💡 Funciones clave de esta versión</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 7 }}>
            {features.map(([ti, de]) => (
              <div key={ti} style={{ background: "white", borderRadius: 8, padding: "9px 11px" }}>
                <div style={{ fontWeight: 700, fontSize: 11, color: "#2b6cb0", marginBottom: 2 }}>{ti}</div>
                <div style={{ fontSize: 10, color: "#718096" }}>{de}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
