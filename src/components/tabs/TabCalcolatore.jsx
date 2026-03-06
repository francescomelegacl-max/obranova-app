// ─── components/tabs/TabCalcolatore.jsx ─────────────────────────────────────
// Calcolatore rapido: l'artigiano seleziona materiali dal listino,
// aggiunge mano d'obra e ottiene un totale in secondi — senza creare un progetto.
// Può salvare il calcolo, esportare PDF e condividere su WhatsApp.

import { useState, useMemo, useCallback } from "react";

const fmt = (n) => new Intl.NumberFormat("es-CL", {
  style: "currency", currency: "CLP", maximumFractionDigits: 0,
}).format(n || 0);

const ID = () => Math.random().toString(36).slice(2, 8);

// ── Colori categoria ──────────────────────────────────────────────────────────
const CAT_COLOR = ["#2b6cb0","#276749","#c05621","#553c9a","#b7791f","#2c7a7b"];

// ── Fila riga calcolatore ─────────────────────────────────────────────────────
function RigaCalc({ riga, onUpdate, onDelete, catColor }) {
  return (
    <tr style={{ background: "white" }}
      onMouseEnter={e => e.currentTarget.style.background="#f0f4f8"}
      onMouseLeave={e => e.currentTarget.style.background="white"}>

      {/* Descrizione */}
      <td style={{ padding:"6px 8px",minWidth:160 }}>
        <input value={riga.desc} onChange={e => onUpdate(riga.id,"desc",e.target.value)}
          placeholder="Descripción..."
          style={{ width:"100%",padding:"5px 8px",border:"1px solid #e2e8f0",borderRadius:6,fontSize:12,color:"#1a365d" }} />
      </td>

      {/* Tipo badge */}
      <td style={{ padding:"6px 5px",whiteSpace:"nowrap" }}>
        <span style={{ padding:"3px 8px",borderRadius:99,fontSize:10,fontWeight:700,
          background: riga.tipo==="material" ? "#ebf8ff" : "#f0fff4",
          color:      riga.tipo==="material" ? "#2b6cb0"  : "#276749" }}>
          {riga.tipo==="material" ? "🧱 Material" : "🔧 Mano obra"}
        </span>
      </td>

      {/* Unidad */}
      <td style={{ padding:"6px 5px" }}>
        <select value={riga.unidad} onChange={e => onUpdate(riga.id,"unidad",e.target.value)}
          style={{ padding:"5px 6px",border:"1px solid #e2e8f0",borderRadius:6,fontSize:11,color:"#1a365d",background:"white" }}>
          {["un","m²","m³","ml","kg","hr","gl","pza","lt","saco"].map(u => <option key={u}>{u}</option>)}
        </select>
      </td>

      {/* Cantidad */}
      <td style={{ padding:"6px 4px" }}>
        <input type="number" value={riga.cant} min={0}
          onChange={e => onUpdate(riga.id,"cant",parseFloat(e.target.value)||0)}
          style={{ width:65,padding:"5px",border:"1px solid #e2e8f0",borderRadius:6,fontSize:12,textAlign:"right",color:"#1a365d" }} />
      </td>

      {/* Precio unit */}
      <td style={{ padding:"6px 4px" }}>
        <input type="number" value={riga.pu} min={0}
          onChange={e => onUpdate(riga.id,"pu",parseFloat(e.target.value)||0)}
          style={{ width:90,padding:"5px",border:"1px solid #e2e8f0",borderRadius:6,fontSize:12,textAlign:"right",color:"#1a365d" }} />
      </td>

      {/* Subtotal */}
      <td style={{ padding:"6px 10px",fontWeight:700,color:"#1a365d",textAlign:"right",whiteSpace:"nowrap",fontSize:13 }}>
        {fmt(riga.cant * riga.pu)}
      </td>

      {/* Elimina */}
      <td style={{ padding:"6px 5px" }}>
        <button onClick={() => onDelete(riga.id)}
          style={{ padding:"4px 8px",background:"#fff5f5",border:"1px solid #fed7d7",borderRadius:6,cursor:"pointer",color:"#c53030",fontSize:11 }}>✕</button>
      </td>
    </tr>
  );
}

// ── Componente principale ─────────────────────────────────────────────────────
export default function TabCalcolatore({ listino = [], standalone = false }) {

  const [righe,      setRighe]      = useState([]);
  const [nome,       setNome]       = useState("");
  const [margine,    setMargine]    = useState(20);
  const [iva,        setIva]        = useState(false);
  const [calcSalvati,setCalcSalvati]= useState(() => {
    try { return JSON.parse(localStorage.getItem("calc_salvati") || "[]"); } catch { return []; }
  });
  const [showListino, setShowListino] = useState(false);
  const [searchMat,   setSearchMat]   = useState("");
  const [saved,       setSaved]       = useState(false);

  // ── Calcoli ─────────────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const cd      = righe.reduce((s, r) => s + r.cant * r.pu, 0);
    const util    = cd * margine / 100;
    const total   = cd + util;
    const ivaAmt  = total * 0.19;
    const totIva  = total + ivaAmt;
    return { cd, util, total, ivaAmt, totIva };
  }, [righe, margine]);

  // ── CRUD righe ───────────────────────────────────────────────────────────────
  const addRiga = useCallback((tipo = "material") => {
    setRighe(r => [...r, { id: ID(), desc: "", tipo, unidad: "un", cant: 1, pu: 0 }]);
  }, []);

  const addDalListino = useCallback((item) => {
    setRighe(r => [...r, {
      id:     ID(),
      desc:   item.nombre,
      tipo:   "material",
      unidad: item.unidad || "un",
      cant:   1,
      pu:     item.precioCliente || item.precio || 0,
    }]);
    setShowListino(false);
  }, []);

  const updR = useCallback((id, k, v) => {
    setRighe(r => r.map(x => x.id === id ? { ...x, [k]: v } : x));
  }, []);

  const delR = useCallback((id) => {
    setRighe(r => r.filter(x => x.id !== id));
  }, []);

  // ── Salva calcolo ────────────────────────────────────────────────────────────
  const handleSave = () => {
    if (!nome.trim() && righe.length === 0) return;
    const calc = {
      id:     ID(),
      nome:   nome || "Cálculo " + new Date().toLocaleDateString("es-CL"),
      righe,
      margine,
      iva,
      total:  iva ? totals.totIva : totals.total,
      data:   new Date().toISOString().slice(0,10),
    };
    const nuovi = [calc, ...calcSalvati].slice(0, 20);
    setCalcSalvati(nuovi);
    localStorage.setItem("calc_salvati", JSON.stringify(nuovi));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // ── Carica calcolo salvato ───────────────────────────────────────────────────
  const handleLoad = (c) => {
    setNome(c.nome);
    setRighe(c.righe);
    setMargine(c.margine || 20);
    setIva(c.iva || false);
  };

  const handleDeleteSaved = (id) => {
    const nuovi = calcSalvati.filter(c => c.id !== id);
    setCalcSalvati(nuovi);
    localStorage.setItem("calc_salvati", JSON.stringify(nuovi));
  };

  // ── Export PDF ───────────────────────────────────────────────────────────────
  const handlePDF = () => {
    const win = window.open("", "_blank");
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Cálculo — ${nome || "Presupuesto rápido"}</title>
<style>
  body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; color: #1a365d; }
  h1   { font-size: 22px; border-bottom: 3px solid #1a365d; padding-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; }
  thead tr { background: #1a365d; color: white; }
  th, td { padding: 8px 10px; text-align: left; }
  tr:nth-child(even) { background: #f0f4f8; }
  tfoot tr { background: #1a365d; color: white; font-weight: bold; }
  .total-box { background: #f0fff4; border: 2px solid #276749; padding: 16px 20px; border-radius: 8px; margin-top: 16px; }
  .total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
  .total-final { font-size: 18px; font-weight: 900; color: #276749; }
  @media print { body { margin: 20px; } }
</style></head><body>
<h1>🔨 ${nome || "Presupuesto rápido"}</h1>
<p style="color:#718096;font-size:12px">Fecha: ${new Date().toLocaleDateString("es-CL")} · Margen: ${margine}%${iva ? " · IVA incluido" : ""}</p>
<table>
  <thead><tr><th>Descripción</th><th>Tipo</th><th>Un.</th><th>Cant.</th><th>P.Unit.</th><th>Subtotal</th></tr></thead>
  <tbody>
    ${righe.map(r => `<tr>
      <td>${r.desc||"—"}</td>
      <td>${r.tipo==="material"?"Material":"Mano obra"}</td>
      <td>${r.unidad}</td>
      <td style="text-align:right">${r.cant}</td>
      <td style="text-align:right">${r.pu.toLocaleString("es-CL")}</td>
      <td style="text-align:right;font-weight:700">${(r.cant*r.pu).toLocaleString("es-CL")}</td>
    </tr>`).join("")}
  </tbody>
  <tfoot><tr><td colspan="5">COSTO DIRECTO</td><td style="text-align:right">${totals.cd.toLocaleString("es-CL")}</td></tr></tfoot>
</table>
<div class="total-box">
  <div class="total-row"><span>Costo directo</span><span>$${totals.cd.toLocaleString("es-CL")}</span></div>
  <div class="total-row"><span>Margen ${margine}%</span><span>$${totals.util.toLocaleString("es-CL")}</span></div>
  <div class="total-row" style="border-top:1px solid #ccc;margin-top:6px;padding-top:6px">
    <span>TOTAL s/IVA</span><span>$${totals.total.toLocaleString("es-CL")}</span>
  </div>
  ${iva ? `<div class="total-row"><span>IVA 19%</span><span>$${totals.ivaAmt.toLocaleString("es-CL")}</span></div>
  <div class="total-row total-final"><span>TOTAL c/IVA</span><span>$${totals.totIva.toLocaleString("es-CL")}</span></div>` : 
  `<div class="total-row total-final"><span>TOTAL</span><span>$${totals.total.toLocaleString("es-CL")}</span></div>`}
</div>
<p style="margin-top:32px;font-size:10px;color:#a0aec0;text-align:center">Generado con Obra Nova · obra-nova-spa.web.app</p>
</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 400);
  };

  // ── WhatsApp ─────────────────────────────────────────────────────────────────
  const handleWhatsApp = () => {
    const lineas = righe
      .filter(r => r.cant > 0 && r.pu > 0)
      .map(r => `• ${r.desc||"Ítem"}: ${r.cant} ${r.unidad} × $${r.pu.toLocaleString("es-CL")} = $${(r.cant*r.pu).toLocaleString("es-CL")}`)
      .join("\n");
    const total  = iva ? totals.totIva : totals.total;
    const texto  = `🔨 *${nome || "Presupuesto rápido"}*\n\n${lineas}\n\n📊 Margen ${margine}%\n✅ *TOTAL: $${total.toLocaleString("es-CL")}*${iva?" (IVA inc.)":""}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
  };

  // ── Listino filtrato ──────────────────────────────────────────────────────────
  const listinoFiltrato = useMemo(() =>
    listino.filter(x => !searchMat || x.nombre?.toLowerCase().includes(searchMat.toLowerCase()))
  , [listino, searchMat]);

  // ── Layout ────────────────────────────────────────────────────────────────────
  const containerStyle = standalone
    ? { fontFamily:"'Segoe UI',system-ui,sans-serif",background:"#f0f4f8",minHeight:"100vh",padding:16 }
    : { display:"flex",flexDirection:"column",gap:14 };

  return (
    <div style={containerStyle}>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#744210,#c05621)",borderRadius:12,padding:"18px 20px",color:"white" }}>
        <div style={{ fontSize:18,fontWeight:800,marginBottom:3 }}>🔨 Calculadora Rápida</div>
        <div style={{ color:"rgba(255,255,255,.75)",fontSize:12 }}>
          Estima el costo de un trabajo en segundos — sin crear un proyecto
        </div>
      </div>

      {/* Nome calcolo + margine */}
      <div style={{ background:"white",borderRadius:12,padding:16,boxShadow:"0 1px 4px rgba(0,0,0,.07)",display:"flex",gap:12,flexWrap:"wrap",alignItems:"center" }}>
        <input value={nome} onChange={e => setNome(e.target.value)}
          placeholder="Nombre del cálculo (ej. Baño completo)"
          style={{ flex:2,minWidth:200,padding:"9px 12px",border:"2px solid #e2e8f0",borderRadius:8,fontSize:13,color:"#1a365d" }} />
        <div style={{ display:"flex",alignItems:"center",gap:8,flex:1,minWidth:160 }}>
          <label style={{ fontSize:12,fontWeight:700,color:"#4a5568",whiteSpace:"nowrap" }}>Margen %</label>
          <input type="number" value={margine} min={0} max={100}
            onChange={e => setMargine(parseFloat(e.target.value)||0)}
            style={{ width:70,padding:"9px 10px",border:"2px solid #e2e8f0",borderRadius:8,fontSize:14,fontWeight:700,textAlign:"right",color:"#c05621" }} />
        </div>
        <label style={{ display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13,color:"#4a5568",fontWeight:600 }}>
          <input type="checkbox" checked={iva} onChange={e => setIva(e.target.checked)} style={{ width:15,height:15 }} />
          IVA 19%
        </label>
      </div>

      {/* Toolbar */}
      <div style={{ display:"flex",gap:8,flexWrap:"wrap",alignItems:"center" }}>
        <button onClick={() => addRiga("material")}
          style={{ padding:"8px 14px",background:"#2b6cb0",color:"white",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:13 }}>
          🧱 + Material
        </button>
        <button onClick={() => addRiga("mano")}
          style={{ padding:"8px 14px",background:"#276749",color:"white",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:13 }}>
          🔧 + Mano obra
        </button>
        {listino.length > 0 && (
          <button onClick={() => setShowListino(v => !v)}
            style={{ padding:"8px 14px",background:showListino?"#553c9a":"#f0f4f8",color:showListino?"white":"#4a5568",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:13 }}>
            📦 {showListino ? "▲ Cerrar listino" : "▼ Desde listino"}
          </button>
        )}
        <button onClick={() => { setRighe([]); setNome(""); setSaved(false); }}
          style={{ padding:"8px 12px",background:"#fff5f5",color:"#c53030",border:"1px solid #fed7d7",borderRadius:8,cursor:"pointer",fontSize:12 }}>
          🗑️ Limpiar
        </button>
      </div>

      {/* Panel listino */}
      {showListino && (
        <div style={{ background:"white",borderRadius:12,padding:14,boxShadow:"0 1px 4px rgba(0,0,0,.07)",border:"2px solid #553c9a33" }}>
          <div style={{ fontWeight:700,fontSize:13,color:"#553c9a",marginBottom:10 }}>📦 Selecciona del listino</div>
          <input value={searchMat} onChange={e => setSearchMat(e.target.value)}
            placeholder="🔍 Buscar material..."
            style={{ width:"100%",padding:"8px 12px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:13,color:"#1a365d",marginBottom:10,boxSizing:"border-box" }} />
          {listinoFiltrato.length === 0 ? (
            <div style={{ textAlign:"center",color:"#a0aec0",padding:"20px 0",fontSize:12 }}>Sin resultados</div>
          ) : (
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:7,maxHeight:240,overflowY:"auto" }}>
              {listinoFiltrato.map(item => (
                <div key={item.id}
                  onClick={() => addDalListino(item)}
                  style={{ padding:"9px 12px",background:"#f7fafc",borderRadius:9,cursor:"pointer",border:"1px solid #e2e8f0",transition:"all .15s" }}
                  onMouseEnter={e => { e.currentTarget.style.background="#ebf8ff"; e.currentTarget.style.borderColor="#bee3f8"; }}
                  onMouseLeave={e => { e.currentTarget.style.background="#f7fafc"; e.currentTarget.style.borderColor="#e2e8f0"; }}>
                  <div style={{ fontWeight:600,fontSize:12,color:"#1a365d" }}>{item.nombre}</div>
                  <div style={{ display:"flex",justifyContent:"space-between",marginTop:3 }}>
                    <span style={{ fontSize:10,color:"#718096" }}>{item.unidad||"un"}</span>
                    <span style={{ fontSize:12,fontWeight:700,color:"#276749" }}>
                      {fmt(item.precioCliente||item.precio||0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tabella righe */}
      {righe.length > 0 && (
        <div style={{ background:"white",borderRadius:12,overflow:"auto",boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
          <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:560 }}>
            <thead>
              <tr style={{ background:"#1a365d",color:"white" }}>
                {["Descripción","Tipo","Unidad","Cant.","Precio unit.","Subtotal",""].map((h,i) => (
                  <th key={i} style={{ padding:"9px 8px",textAlign:"left",fontWeight:600,fontSize:11,whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {righe.map(r => (
                <RigaCalc key={r.id} riga={r} onUpdate={updR} onDelete={delR} />
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background:"#2d3748",color:"white" }}>
                <td colSpan={5} style={{ padding:"9px 10px",fontWeight:700,fontSize:12 }}>COSTO DIRECTO</td>
                <td style={{ padding:"9px 8px",fontWeight:800,fontSize:14,textAlign:"right" }}>{fmt(totals.cd)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Box totali */}
      {righe.length > 0 && (
        <div style={{ background:"white",borderRadius:12,padding:18,boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:16 }}>
            <div>
              <div style={{ fontWeight:700,fontSize:13,color:"#1a365d",marginBottom:10 }}>📊 Resumen</div>
              {[
                ["Costo directo",  totals.cd,   "#2b6cb0"],
                [`Margen ${margine}%`, totals.util, "#c05621"],
                ["TOTAL s/IVA",    totals.total,"#1a365d"],
                ...(iva ? [["IVA 19%", totals.ivaAmt,"#c05621"],["TOTAL c/IVA",totals.totIva,"#276749"]] : []),
              ].map(([l,v,c],i) => (
                <div key={i} style={{ display:"flex",justifyContent:"space-between",padding:"6px 0",
                  borderTop: i>0?"1px solid #f0f4f8":"none" }}>
                  <span style={{ fontSize:12,color:"#718096" }}>{l}</span>
                  <span style={{ fontSize:i>=2?15:13,fontWeight:i>=2?800:600,color:c }}>{fmt(v)}</span>
                </div>
              ))}
            </div>

            {/* Bottoni azione */}
            <div style={{ display:"flex",flexDirection:"column",gap:8,justifyContent:"flex-end" }}>
              <button onClick={handleSave}
                style={{ padding:"11px",background:saved?"#276749":"#1a365d",color:"white",border:"none",borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:13,transition:"all .2s" }}>
                {saved ? "✅ Guardado" : "💾 Guardar cálculo"}
              </button>
              <button onClick={handlePDF}
                style={{ padding:"11px",background:"#2b6cb0",color:"white",border:"none",borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:13 }}>
                🖨️ Exportar PDF
              </button>
              <button onClick={handleWhatsApp}
                style={{ padding:"11px",background:"#25D366",color:"white",border:"none",borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:13 }}>
                💬 Compartir WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calcoli salvati */}
      {calcSalvati.length > 0 && (
        <div style={{ background:"white",borderRadius:12,padding:16,boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ fontWeight:700,fontSize:13,color:"#1a365d",marginBottom:10 }}>
            📁 Cálculos guardados ({calcSalvati.length})
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
            {calcSalvati.map(c => (
              <div key={c.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",
                padding:"10px 14px",background:"#f7fafc",borderRadius:9,gap:8,flexWrap:"wrap" }}>
                <div>
                  <div style={{ fontWeight:700,fontSize:13,color:"#1a365d" }}>{c.nome}</div>
                  <div style={{ fontSize:11,color:"#718096" }}>
                    {c.righe?.length||0} ítems · {c.data} · Margen {c.margine||0}%
                  </div>
                </div>
                <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                  <span style={{ fontWeight:800,fontSize:14,color:"#276749" }}>{fmt(c.total)}</span>
                  <button onClick={() => handleLoad(c)}
                    style={{ padding:"5px 11px",background:"#ebf8ff",color:"#2b6cb0",border:"1px solid #bee3f8",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:600 }}>
                    📂 Cargar
                  </button>
                  <button onClick={() => handleDeleteSaved(c.id)}
                    style={{ padding:"5px 8px",background:"#fff5f5",border:"1px solid #fed7d7",borderRadius:7,cursor:"pointer",color:"#c53030",fontSize:11 }}>
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {righe.length === 0 && (
        <div style={{ textAlign:"center",padding:"50px 20px",color:"#a0aec0",background:"white",borderRadius:12,boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ fontSize:48,marginBottom:12 }}>🔨</div>
          <div style={{ fontSize:15,fontWeight:700,color:"#2d3748",marginBottom:6 }}>Empieza tu cálculo</div>
          <div style={{ fontSize:13 }}>
            Agrega materiales con <strong>🧱 + Material</strong>, mano de obra con <strong>🔧 + Mano obra</strong>
            {listino.length > 0 && <>, o selecciona del <strong>📦 listino</strong></>}.
          </div>
        </div>
      )}

    </div>
  );
}
