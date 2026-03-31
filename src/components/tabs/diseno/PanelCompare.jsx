// ─── diseno/PanelCompare.jsx ─────────────────────────────────────────────────
// Griglia 4 varianti render per confronto.

export default function PanelCompare({
  rooms, photoBase64, prompt, standalonePrompt,
  compareRenders, comparingStyles,
  onHandleCompareStyles, onSavePortada, onToast,
  setRenders, setActiveRender, setRenderImg, setPanel,
}) {
  const activePrompt = prompt?.trim() || standalonePrompt?.trim() || "";
  const canCompare = rooms.length > 0 || !!photoBase64 || !!activePrompt;

  return (
    <div style={{ background:"white", borderRadius:12, padding:16, boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
      <div style={{ fontWeight:800, fontSize:12, color:"#1a365d", marginBottom:10, letterSpacing:.5 }}>
        🎨 COMPARAR 4 VARIANTES
      </div>
      <div style={{ fontSize:11, color:"#718096", marginBottom:10 }}>
        Genera 4 interpretaciones diferentes del mismo prompt para elegir la que más te gusta.
      </div>
      <button onClick={onHandleCompareStyles}
        disabled={comparingStyles || !canCompare}
        style={{
          width:"100%", padding:"10px", borderRadius:9, border:"none",
          cursor: comparingStyles || !canCompare ? "not-allowed" : "pointer",
          background: comparingStyles ? "#a0aec0" : "linear-gradient(135deg,#276749,#2b6cb0)",
          color:"white", fontWeight:800, fontSize:13,
          display:"flex", alignItems:"center", justifyContent:"center", gap:8,
        }}>
        {comparingStyles ? (
          <><span style={{ animation:"spin 1s linear infinite", display:"inline-block" }}>⏳</span> Generando {compareRenders.length}/4...</>
        ) : "🎨 Comparar 4 variantes"}
      </button>

      {compareRenders.length > 0 && (
        <div style={{ marginTop:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {[1,2,3,4].map(varNum => {
              const r = compareRenders[varNum - 1];
              const label = `Variante ${varNum}`;
              return (
                <div key={varNum} style={{ borderRadius:10, overflow:"hidden", border:"1.5px solid #e2e8f0", background:"#f7fafc" }}>
                  {r?.imageUrl ? (
                    <div style={{ position:"relative" }}>
                      <img src={r.imageUrl} alt={label} style={{ width:"100%", height:130, objectFit:"cover", display:"block" }} />
                      <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"rgba(26,54,93,.7)", padding:"4px 8px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <span style={{ color:"white", fontSize:11, fontWeight:700 }}>{label}</span>
                        <div style={{ display:"flex", gap:4 }}>
                          <button onClick={() => {
                            setRenders(prev => [{ ok:true, imageUrl:r.imageUrl, label, roomType:"sala", mode:"compare" }, ...prev]);
                            setActiveRender(0); setRenderImg(r.imageUrl); setPanel("render");
                            onToast?.(`✅ ${label} añadido a renders`);
                          }}
                            style={{ background:"white", border:"none", borderRadius:4, padding:"2px 6px", fontSize:10, fontWeight:700, cursor:"pointer", color:"#1a365d" }}>
                            + Usar
                          </button>
                          <button onClick={() => onSavePortada(r.imageUrl)}
                            style={{ background:"#faf5ff", border:"none", borderRadius:4, padding:"2px 6px", fontSize:10, fontWeight:700, cursor:"pointer", color:"#553c9a" }}>
                            ⭐
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : r?.error ? (
                    <div style={{ height:130, display:"flex", alignItems:"center", justifyContent:"center", color:"#c53030", fontSize:11, padding:8, textAlign:"center" }}>
                      ❌ {label}<br/><span style={{ fontSize:9 }}>{r.error.slice(0,40)}</span>
                    </div>
                  ) : (
                    <div style={{ height:130, display:"flex", alignItems:"center", justifyContent:"center", color:"#a0aec0", fontSize:11 }}>
                      {comparingStyles ? <span style={{ animation:"spin 1s linear infinite", display:"inline-block", fontSize:20 }}>⏳</span> : `${label}...`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
