// ─── components/tabs/TabFatture.jsx ──────────────────────────────────────────
import { useState, useMemo } from "react";
import { EMPRESA, LOGO_URL, CAT_COLORS } from "../../utils/constants";

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

// ─── Modal Nuova Fattura ──────────────────────────────────────────────────────
function ModalNuovaFattura({ proy, prossimoNumero, onSalva, onClose }) {
  const totals = calcTotals(proy.partidas, proy.pct);
  const totale = proy.iva ? totals.totalIva : totals.total;

  const [form, setForm] = useState({
    numero:      prossimoNumero,
    dataFattura: new Date().toISOString().slice(0, 10),
    dataScadenza: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    note:        "",
    importo:     totale,
  });

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "white", borderRadius: 16, padding: 28, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,.35)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#1a365d" }}>🧾 Nuova Fattura</div>
          <button onClick={onClose} style={{ background: "#2d3748", border: "none", borderRadius: 8, cursor: "pointer", padding: "5px 12px", color: "white", fontWeight: 700 }}>✕</button>
        </div>

        {/* Info progetto */}
        <div style={{ background: "#f7fafc", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12 }}>
          <div style={{ fontWeight: 700, color: "#1a365d" }}>{proy.info?.cliente || "—"}</div>
          <div style={{ color: "#718096" }}>{proy.info?.descripcion || "—"}</div>
          <div style={{ color: "#276749", fontWeight: 800, fontSize: 15, marginTop: 4 }}>{fmt(totale)} {proy.iva ? "(IVA incl.)" : "(s/IVA)"}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: "#718096", fontWeight: 600, display: "block", marginBottom: 4 }}>N° Fattura</label>
            <input value={form.numero} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))}
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#718096", fontWeight: 600, display: "block", marginBottom: 4 }}>Importo (€/$)</label>
            <input type="number" value={form.importo} onChange={e => setForm(f => ({ ...f, importo: parseFloat(e.target.value) || 0 }))}
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#718096", fontWeight: 600, display: "block", marginBottom: 4 }}>Data fattura</label>
            <input type="date" value={form.dataFattura} onChange={e => setForm(f => ({ ...f, dataFattura: e.target.value }))}
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "#718096", fontWeight: 600, display: "block", marginBottom: 4 }}>Scadenza pagamento</label>
            <input type="date" value={form.dataScadenza} onChange={e => setForm(f => ({ ...f, dataScadenza: e.target.value }))}
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13 }} />
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: "#718096", fontWeight: 600, display: "block", marginBottom: 4 }}>Note (opzionale)</label>
          <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            rows={2} placeholder="Es. Bonifico IBAN IT..."
            style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, resize: "vertical" }} />
        </div>

        <button onClick={() => onSalva(form)}
          style={{ width: "100%", padding: 12, background: "#1a365d", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: 15 }}>
          ✅ Crea fattura
        </button>
      </div>
    </div>
  );
}

// ─── PDF Fattura (stampa) ─────────────────────────────────────────────────────
function PDFFattura({ fattura, proy, onClose }) {
  const totals = calcTotals(proy.partidas, proy.pct);
  const cats   = [...new Set((proy.partidas || []).map(p => p.cat).filter(Boolean))];

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", zIndex: 4000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: 16, overflowY: "auto" }}>
      <div style={{ background: "white", width: "100%", maxWidth: 800, borderRadius: 12, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,.5)" }}>

        {/* Barra azioni */}
        <div style={{ background: "#1a365d", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ color: "white", fontWeight: 700, fontSize: 14 }}>🧾 Fattura N° {fattura.numero}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => window.print()} style={{ padding: "6px 14px", background: "#276749", color: "white", border: "none", borderRadius: 7, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>🖨️ Stampa PDF</button>
            <button onClick={onClose} style={{ padding: "6px 12px", background: "rgba(255,255,255,.2)", color: "white", border: "none", borderRadius: 7, cursor: "pointer", fontWeight: 700 }}>✕</button>
          </div>
        </div>

        {/* Contenuto fattura */}
        <div id="print-area" style={{ padding: "32px 36px", fontSize: 12 }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, paddingBottom: 16, borderBottom: "3px solid #1a365d" }}>
            <div>
              <img src={LOGO_URL} alt="" style={{ height: 44, marginBottom: 6 }} onError={e => { e.target.style.display = "none"; }} />
              <div style={{ fontWeight: 800, fontSize: 16, color: "#1a365d" }}>{EMPRESA.nombre}</div>
              <div style={{ color: "#718096", fontSize: 11 }}>RUT {EMPRESA.rut} · {EMPRESA.giro}</div>
              <div style={{ color: "#718096", fontSize: 11 }}>{EMPRESA.direccion}, {EMPRESA.ciudad}</div>
              <div style={{ color: "#718096", fontSize: 11 }}>{EMPRESA.telefono} · {EMPRESA.email}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#1a365d", marginBottom: 4 }}>FATTURA</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#2d3748" }}>N° {fattura.numero}</div>
              <div style={{ fontSize: 11, color: "#718096", marginTop: 4 }}>Data: {fattura.dataFattura}</div>
              <div style={{ fontSize: 11, color: "#718096" }}>Scadenza: {fattura.dataScadenza}</div>
              <span style={{ display: "inline-block", marginTop: 6, padding: "3px 12px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                background: fattura.pagata ? "#f0fff4" : "#fffff0",
                color:      fattura.pagata ? "#276749" : "#b7791f",
                border:     `1px solid ${fattura.pagata ? "#9ae6b4" : "#fef08a"}` }}>
                {fattura.pagata ? "✅ PAGATA" : "⏳ IN ATTESA"}
              </span>
            </div>
          </div>

          {/* Cliente */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div style={{ background: "#f7fafc", borderRadius: 9, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: "#a0aec0", fontWeight: 700, marginBottom: 6, letterSpacing: .5 }}>FATTURATO A</div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d" }}>{proy.info?.cliente || "—"}</div>
              {proy.info?.telefono && <div style={{ fontSize: 11, color: "#4a5568", marginTop: 2 }}>📞 {proy.info.telefono}</div>}
              {proy.info?.email    && <div style={{ fontSize: 11, color: "#4a5568" }}>✉ {proy.info.email}</div>}
              {proy.info?.direccion && <div style={{ fontSize: 11, color: "#4a5568" }}>📍 {proy.info.direccion}{proy.info.ciudad ? ", " + proy.info.ciudad : ""}</div>}
            </div>
            <div style={{ background: "#f7fafc", borderRadius: 9, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: "#a0aec0", fontWeight: 700, marginBottom: 6, letterSpacing: .5 }}>OPERA</div>
              <div style={{ fontWeight: 600, fontSize: 13, color: "#2d3748" }}>{proy.info?.descripcion || "—"}</div>
              {proy.info?.fechaInicio && <div style={{ fontSize: 11, color: "#4a5568", marginTop: 2 }}>📅 {proy.info.fechaInicio} → {proy.info.fechaTermino || "?"}</div>}
              <div style={{ fontSize: 11, color: "#718096", marginTop: 2 }}>Rif. preventivo: {proy.currentId?.slice(-8) || "—"}</div>
            </div>
          </div>

          {/* Voci */}
          <div style={{ marginBottom: 20 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ background: "#1a365d", color: "white" }}>
                  {["Descrizione", "Cat.", "U.M.", "Qty", "Prezzo unit.", "Totale"].map((h, i) => (
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

          {/* Totali */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
            <div style={{ width: 280 }}>
              {[
                ["Imponibile", totals.cd],
                proy.pct?.ci > 0 && [`C.Indiretti (${proy.pct.ci}%)`, totals.ci],
                proy.pct?.gf > 0 && [`Spese fisse (${proy.pct.gf}%)`, totals.gf],
                proy.pct?.imprevistos > 0 && [`Imprevisti (${proy.pct.imprevistos}%)`, totals.imprev],
                proy.pct?.utilidad > 0 && [`Utile (${proy.pct.utilidad}%)`, totals.util],
                ["Totale s/IVA", totals.total, true],
                proy.iva && ["IVA 19%", totals.ivaAmt],
                proy.iva && ["TOTALE FATTURA", totals.totalIva, true, true],
                !proy.iva && ["TOTALE FATTURA", totals.total, true, true],
              ].filter(Boolean).map(([label, value, bold, big]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: big ? "10px 12px" : "5px 0",
                  background: big ? "#1a365d" : "transparent", borderRadius: big ? 8 : 0,
                  borderTop: bold && !big ? "1px solid #e2e8f0" : "none", marginBottom: big ? 0 : 2 }}>
                  <span style={{ fontSize: big ? 13 : 11, color: big ? "white" : bold ? "#2d3748" : "#718096", fontWeight: bold ? 700 : 400 }}>{label}</span>
                  <span style={{ fontSize: big ? 15 : 12, color: big ? "white" : bold ? "#1a365d" : "#4a5568", fontWeight: big ? 900 : bold ? 700 : 500 }}>{fmt(value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Note */}
          {fattura.note && (
            <div style={{ background: "#f7fafc", borderRadius: 9, padding: "10px 14px", marginBottom: 16, fontSize: 11, color: "#4a5568" }}>
              <div style={{ fontWeight: 700, color: "#1a365d", marginBottom: 4 }}>Note:</div>
              {fattura.note}
            </div>
          )}

          {/* Footer */}
          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 12, textAlign: "center", fontSize: 10, color: "#a0aec0" }}>
            {EMPRESA.nombre} · RUT {EMPRESA.rut} · {EMPRESA.email} · {EMPRESA.telefono}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab principale ───────────────────────────────────────────────────────────
export function TabFatture({ proyectos, fatture, onCreaFattura, onTogglePagata, onEliminaFattura }) {
  const [showNuova,   setShowNuova]   = useState(false);
  const [proySelected, setProySelected] = useState(null);
  const [viewFattura, setViewFattura] = useState(null);
  const [filterStato, setFilterStato] = useState("Tutti");

  // Progetto corrente (quello aperto nell'app)
  const proyAceptados = proyectos.filter(p => p.estado === "Aceptado");

  const fattureFiltrate = useMemo(() => {
    if (filterStato === "Tutti")   return fatture;
    if (filterStato === "Pagate")  return fatture.filter(f => f.pagata);
    if (filterStato === "Attesa")  return fatture.filter(f => !f.pagata);
    return fatture;
  }, [fatture, filterStato]);

  const totaleIncassato = useMemo(() => fatture.filter(f => f.pagata).reduce((s, f) => s + (f.importo || 0), 0), [fatture]);
  const totaleAttesa    = useMemo(() => fatture.filter(f => !f.pagata).reduce((s, f) => s + (f.importo || 0), 0), [fatture]);
  const prossimoNumero  = useMemo(() => {
    if (!fatture.length) return `F-${new Date().getFullYear()}-001`;
    const nums = fatture.map(f => parseInt((f.numero || "0").replace(/\D/g, "")) || 0);
    const next = Math.max(...nums) + 1;
    return `F-${new Date().getFullYear()}-${String(next).padStart(3, "0")}`;
  }, [fatture]);

  const handleNuovaFattura = (proy) => {
    setProySelected(proy);
    setShowNuova(true);
  };

  const handleSalva = (form) => {
    if (!proySelected) return;
    onCreaFattura({ ...form, proyectoId: proySelected.id, proyInfo: proySelected.info, pagata: false, creadoAt: new Date().toISOString() });
    setShowNuova(false);
    setProySelected(null);
  };

  // Trovare il proyecto per una fattura
  const getProyForFattura = (f) => proyectos.find(p => p.id === f.proyectoId);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Modali */}
      {showNuova && proySelected && (
        <ModalNuovaFattura
          proy={proySelected}
          prossimoNumero={prossimoNumero}
          onSalva={handleSalva}
          onClose={() => { setShowNuova(false); setProySelected(null); }}
        />
      )}
      {viewFattura && getProyForFattura(viewFattura) && (
        <PDFFattura
          fattura={viewFattura}
          proy={getProyForFattura(viewFattura)}
          onClose={() => setViewFattura(null)}
        />
      )}

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1a365d,#2d3748)", borderRadius: 12, padding: "18px 20px", color: "white" }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 3 }}>🧾 Fatturazione</div>
        <div style={{ color: "#a0aec0", fontSize: 12, marginBottom: 12 }}>Converti i preventivi accettati in fatture</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {[
            { label: "Fatture totali",  value: fatture.length,          color: "white" },
            { label: "Incassato",       value: fmt(totaleIncassato),     color: "#68d391" },
            { label: "In attesa",       value: fmt(totaleAttesa),        color: "#fef08a" },
            { label: "Preventivi ok",   value: proyAceptados.length,     color: "#90cdf4" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "rgba(255,255,255,.1)", borderRadius: 9, padding: "8px 16px", textAlign: "center", minWidth: 90 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color }}>{value}</div>
              <div style={{ fontSize: 10, color: "#a0aec0" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Preventivi accettati → converti in fattura */}
      {proyAceptados.length > 0 && (
        <div style={{ background: "white", borderRadius: 12, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#1a365d", marginBottom: 10 }}>
            ✅ Preventivi accettati — pronti per la fattura
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {proyAceptados.map(p => {
              const totals = calcTotals(p.partidas, p.pct);
              const tot    = p.iva ? totals.totalIva : totals.total;
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
                      ? <span style={{ padding: "3px 10px", background: "#ebf8ff", color: "#2b6cb0", borderRadius: 99, fontSize: 11, fontWeight: 700 }}>Fatturato</span>
                      : <button onClick={() => handleNuovaFattura(p)}
                          style={{ padding: "6px 14px", background: "#1a365d", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
                          🧾 Crea fattura
                        </button>
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filtri fatture */}
      <div style={{ background: "white", borderRadius: 12, padding: "10px 14px", boxShadow: "0 1px 4px rgba(0,0,0,.07)", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#1a365d", marginRight: 4 }}>Storico fatture</div>
        <div style={{ display: "flex", gap: 4, background: "#f0f4f8", borderRadius: 8, padding: 3 }}>
          {["Tutti", "Pagate", "Attesa"].map(v => (
            <button key={v} onClick={() => setFilterStato(v)}
              style={{ padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600,
                background: filterStato === v ? "#2b6cb0" : "transparent",
                color:      filterStato === v ? "white"   : "#718096" }}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Lista fatture */}
      {fattureFiltrate.length === 0 ? (
        <div style={{ textAlign: "center", padding: "50px 0", color: "#a0aec0", background: "white", borderRadius: 12 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🧾</div>
          <div>Nessuna fattura ancora</div>
          <div style={{ fontSize: 11, marginTop: 6 }}>Accetta un preventivo e clicca "Crea fattura"</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {fattureFiltrate.map(f => {
            const scaduta = !f.pagata && f.dataScadenza && new Date(f.dataScadenza) < new Date();
            return (
              <div key={f.id} style={{ background: "white", borderRadius: 12, padding: "14px 18px", boxShadow: "0 1px 4px rgba(0,0,0,.07)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10,
                borderLeft: `4px solid ${f.pagata ? "#68d391" : scaduta ? "#fc8181" : "#fef08a"}` }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: "#1a365d" }}>N° {f.numero}</span>
                    <span style={{ padding: "2px 9px", borderRadius: 99, fontSize: 10, fontWeight: 700,
                      background: f.pagata ? "#f0fff4" : scaduta ? "#fff5f5" : "#fffff0",
                      color:      f.pagata ? "#276749" : scaduta ? "#c53030" : "#b7791f",
                      border:     `1px solid ${f.pagata ? "#9ae6b4" : scaduta ? "#fed7d7" : "#fef08a"}` }}>
                      {f.pagata ? "✅ Pagata" : scaduta ? "🔴 Scaduta" : "⏳ In attesa"}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#2d3748", fontWeight: 600 }}>{f.proyInfo?.cliente || "—"}</div>
                  <div style={{ fontSize: 11, color: "#718096" }}>
                    Emessa: {f.dataFattura} · Scadenza: {f.dataScadenza}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 900, fontSize: 16, color: "#276749" }}>{fmt(f.importo)}</div>
                    <div style={{ fontSize: 10, color: "#a0aec0" }}>importo</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setViewFattura(f)}
                      style={{ padding: "5px 10px", background: "#ebf8ff", border: "1px solid #bee3f8", borderRadius: 7, cursor: "pointer", color: "#2b6cb0", fontSize: 11, fontWeight: 600 }}>
                      🖨️ PDF
                    </button>
                    <button onClick={() => onTogglePagata(f.id, !f.pagata)}
                      style={{ padding: "5px 10px", background: f.pagata ? "#fff5f5" : "#f0fff4", border: `1px solid ${f.pagata ? "#fed7d7" : "#9ae6b4"}`, borderRadius: 7, cursor: "pointer", color: f.pagata ? "#c53030" : "#276749", fontSize: 11, fontWeight: 600 }}>
                      {f.pagata ? "↩ Annulla" : "✅ Pagata"}
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
