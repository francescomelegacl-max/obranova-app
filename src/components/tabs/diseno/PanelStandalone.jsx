// ─── diseno/PanelStandalone.jsx ──────────────────────────────────────────────
// Render rapido: foto + prompt senza plano 2D.

export default function PanelStandalone({
  isPro, photoPreview, photoBase64, fileInputRef,
  standalonePrompt, setStandalonePrompt,
  standaloneRendering, standaloneResult, standaloneStep,
  portadaSaved,
  onHandlePhotoUpload, onRemovePhoto, onHandleRenderStandalone,
  onSavePortada, onDownloadStandalone, onToast,
  setPanel,
}) {
  return (
    <div style={{ flex:1, minWidth:300, display:"flex", flexDirection:"column", gap:12 }}>
      {/* Torna all'editor */}
      <button onClick={() => setPanel("editor")}
        style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 16px", borderRadius:10,
          border:"2px solid #e2e8f0", background:"white", color:"#1a365d",
          cursor:"pointer", fontWeight:700, fontSize:13, boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}
        onMouseEnter={e => e.currentTarget.style.borderColor="#276749"}
        onMouseLeave={e => e.currentTarget.style.borderColor="#e2e8f0"}>
        ✏️ Volver al Editor
      </button>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#276749,#38a169)", borderRadius:12, padding:"14px 18px" }}>
        <div style={{ color:"white", fontWeight:900, fontSize:15, marginBottom:4 }}>⚡ Render Rápido</div>
        <div style={{ color:"rgba(255,255,255,.8)", fontSize:12 }}>
          Sin plano 2D — sube una foto o describe el ambiente y genera el render directamente
        </div>
      </div>

      {/* Foto upload */}
      <div style={{ background:"white", borderRadius:12, padding:16, boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
        <div style={{ fontWeight:800, fontSize:12, color:"#1a365d", marginBottom:10, letterSpacing:.5 }}>📷 FOTO DEL AMBIENTE (opcional)</div>
        {!isPro ? (
          <div style={{ background:"#f0fff4", border:"1.5px dashed #276749", borderRadius:10, padding:14, textAlign:"center" }}>
            <div style={{ fontSize:20, marginBottom:4 }}>📷</div>
            <div style={{ fontSize:12, fontWeight:700, color:"#276749", marginBottom:2 }}>Disponible en Pro</div>
            <div style={{ fontSize:11, color:"#4a5568" }}>Sube una foto real y transfórmala con IA</div>
          </div>
        ) : photoPreview ? (
          <div style={{ position:"relative" }}>
            <img src={photoPreview} alt="Foto" style={{ width:"100%", borderRadius:8, maxHeight:160, objectFit:"cover", display:"block" }} />
            <button onClick={onRemovePhoto} style={{ position:"absolute", top:6, right:6, background:"rgba(0,0,0,.55)", color:"white", border:"none", borderRadius:"50%", width:26, height:26, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
            <div style={{ fontSize:10, color:"#276749", fontWeight:600, marginTop:5 }}>✅ Foto cargada — render con image-to-image</div>
          </div>
        ) : (
          <>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onHandlePhotoUpload} style={{ display:"none" }} />
            <button onClick={() => fileInputRef.current?.click()} style={{ width:"100%", padding:"12px 16px", borderRadius:10, border:"2px dashed #c6f6d5", background:"#f0fff4", cursor:"pointer", textAlign:"center" }}>
              <div style={{ fontSize:22, marginBottom:4 }}>📷</div>
              <div style={{ fontSize:12, fontWeight:700, color:"#276749" }}>Subir foto del ambiente</div>
              <div style={{ fontSize:10, color:"#718096", marginTop:3 }}>JPG / PNG · max 10MB</div>
            </button>
          </>
        )}
      </div>

      {/* Prompt + genera */}
      <div style={{ background:"white", borderRadius:12, padding:16, boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
        <div style={{ fontWeight:800, fontSize:12, color:"#1a365d", marginBottom:8, letterSpacing:.5 }}>✍️ DESCRIBE TU DISEÑO</div>
        <div style={{ fontSize:11, color:"#718096", marginBottom:8 }}>
          Describe el ambiente, materiales, colores y estilo que quieres. Cuanto más detallado, mejor resultado.
        </div>
        <textarea value={standalonePrompt} onChange={e => setStandalonePrompt(e.target.value)}
          placeholder="Ej: baño mediterráneo con ceramico azul, madera negra, luz natural cálida, espejo grande redondo, plantas..."
          rows={4}
          style={{ width:"100%", padding:"10px 12px", border:"1.5px solid #c6f6d5", borderRadius:8, fontSize:12,
            resize:"vertical", boxSizing:"border-box", fontFamily:"inherit", color:"#2d3748" }}
        />
        <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:8 }}>
          {["Sala moderna con sofá gris","Cocina nórdica con madera clara","Dormitorio minimalista","Baño con ceramico azul y madera","Terraza con plantas y piedra","Oficina industrial con ladrillo","Comedor elegante con mármol","Garage moderno"].map(sug => (
            <button key={sug} onClick={() => setStandalonePrompt(prev => prev ? `${prev}, ${sug.toLowerCase()}` : sug)}
              style={{ padding:"4px 10px", borderRadius:99, border:"1px solid #c6f6d5", background:"white", color:"#276749", fontSize:10, fontWeight:600, cursor:"pointer" }}>
              + {sug}
            </button>
          ))}
        </div>
        <button onClick={onHandleRenderStandalone}
          disabled={standaloneRendering || (!standalonePrompt.trim() && !photoBase64)}
          style={{ marginTop:14, width:"100%", padding:"13px",
            background: standaloneRendering ? "#a0aec0" : (!standalonePrompt.trim() && !photoBase64) ? "#e2e8f0" : "linear-gradient(135deg,#276749,#2b6cb0)",
            color: (!standalonePrompt.trim() && !photoBase64) ? "#a0aec0" : "white",
            border:"none", borderRadius:9, fontWeight:900, fontSize:14,
            cursor: standaloneRendering || (!standalonePrompt.trim() && !photoBase64) ? "not-allowed" : "pointer",
            display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
          {standaloneRendering ? (<><span style={{ animation:"spin 1s linear infinite", display:"inline-block" }}>⏳</span> {standaloneStep}</>) :
           (!standalonePrompt.trim() && !photoBase64) ? "Escribe un prompt o sube una foto" : "✨ Generar Render AI"}
        </button>
      </div>

      {/* Risultato */}
      {standaloneResult && (
        <div style={{ background:"white", borderRadius:12, padding:16, boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ fontWeight:800, fontSize:12, color:"#1a365d", marginBottom:10, letterSpacing:.5 }}>✅ RENDER GENERADO</div>
          <img src={standaloneResult} alt="Render" style={{ width:"100%", borderRadius:10, display:"block", boxShadow:"0 4px 20px rgba(0,0,0,.12)" }} />
          <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap" }}>
            <button onClick={onDownloadStandalone}
              style={{ flex:1, padding:"9px", background:"#276749", color:"white", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}>
              ⬇️ Descargar
            </button>
            <button onClick={() => {
              const msg = encodeURIComponent(`🏗️ *Obra Nova — Render Rápido AI*\n\n${standaloneResult}`);
              window.open(`https://wa.me/?text=${msg}`, "_blank");
            }}
              style={{ flex:1, padding:"9px", background:"#25d366", color:"white", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}>
              💬 WhatsApp
            </button>
            {isPro && (
              <button onClick={() => onSavePortada(standaloneResult)}
                style={{ padding:"9px 14px", background: portadaSaved ? "#276749" : "#faf5ff", color: portadaSaved ? "white" : "#553c9a", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}>
                {portadaSaved ? "✅ Portada guardada" : "⭐ Usar como portada"}
              </button>
            )}
          </div>
          <div style={{ marginTop:10, fontSize:11, color:"#718096", textAlign:"center" }}>
            El render también aparece en tu galería de renders del proyecto
          </div>
        </div>
      )}
    </div>
  );
}
