// ─── diseno/PanelRender.jsx ──────────────────────────────────────────────────
// Pannello render AI: foto upload, selezione stanza, prompt, galleria, storico.
import { useState } from "react";
import { ROOM_TYPES } from "./constants";

export default function PanelRender({
  rooms, renders, activeRender, renderImg, rendering, renderStep,
  renderHistory, portadaSaved, isPro, prompt, setPrompt,
  photoPreview, photoBase64, fileInputRef,
  renderRoom, setRenderRoom, showHistory, setShowHistory,
  onHandleRender, onHandlePhotoUpload, onRemovePhoto,
  onDownloadRender, onSavePortada,
  setActiveRender, setRenderImg, setPanel,
  proyectoNombre, onToast, workspaceId,
}) {
  const [beforeAfter, setBeforeAfter] = useState(false);
  const [baSlider, setBaSlider]       = useState(50);

  return (
    <div style={{ flex:1, minWidth:300, display:"flex", flexDirection:"column", gap:12 }}>

      {/* Torna all'editor */}
      <button onClick={() => setPanel("editor")}
        style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 16px", borderRadius:10,
          border:"2px solid #e2e8f0", background:"white", color:"#1a365d",
          cursor:"pointer", fontWeight:700, fontSize:13, boxShadow:"0 1px 4px rgba(0,0,0,.07)", transition:"all .15s" }}
        onMouseEnter={e => e.currentTarget.style.borderColor="#2b6cb0"}
        onMouseLeave={e => e.currentTarget.style.borderColor="#e2e8f0"}>
        ✏️ Editar plano 2D
      </button>

      {/* ── Foto upload ──────────────────────────────────────────────── */}
      <div style={{ background:"white", borderRadius:12, padding:16, boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
        <div style={{ fontWeight:800, fontSize:12, color:"#1a365d", marginBottom:10, letterSpacing:.5 }}>📷 FOTO DEL AMBIENTE</div>
        {!isPro ? (
          <div style={{ background:"#f0fff4", border:"1.5px dashed #276749", borderRadius:10, padding:14, textAlign:"center" }}>
            <div style={{ fontSize:22, marginBottom:6 }}>📷</div>
            <div style={{ fontSize:12, fontWeight:700, color:"#276749", marginBottom:4 }}>Disponible en Pro</div>
            <div style={{ fontSize:11, color:"#4a5568" }}>Sube una foto real y transfórmala con IA</div>
          </div>
        ) : photoPreview ? (
          <div style={{ position:"relative" }}>
            <img src={photoPreview} alt="Foto ambiente" style={{ width:"100%", borderRadius:8, maxHeight:160, objectFit:"cover", display:"block" }} />
            <button onClick={onRemovePhoto} style={{ position:"absolute", top:6, right:6, background:"rgba(0,0,0,.55)", color:"white", border:"none", borderRadius:"50%", width:26, height:26, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
            <div style={{ fontSize:10, color:"#276749", fontWeight:600, marginTop:5 }}>✅ Foto cargada — render con image-to-image</div>
          </div>
        ) : (
          <>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onHandlePhotoUpload} style={{ display:"none" }} />
            <button onClick={() => fileInputRef.current?.click()} style={{ width:"100%", padding:"12px 16px", borderRadius:10, border:"2px dashed #bee3f8", background:"#f7fbff", cursor:"pointer", textAlign:"center" }}>
              <div style={{ fontSize:22, marginBottom:4 }}>📷</div>
              <div style={{ fontSize:12, fontWeight:700, color:"#2b6cb0" }}>Subir foto del ambiente</div>
              <div style={{ fontSize:10, color:"#718096", marginTop:3 }}>JPG / PNG · max 10MB</div>
            </button>
            <div style={{ fontSize:10, color:"#a0aec0", marginTop:6, textAlign:"center" }}>Opcional — sin foto usa el plano 2D</div>
          </>
        )}
      </div>

      {/* Selezione stanza */}
      <div style={{ background:"white", borderRadius:12, padding:16, boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
        <div style={{ fontWeight:800, fontSize:12, color:"#1a365d", marginBottom:10, letterSpacing:.5 }}>HABITACIÓN A RENDERIZAR</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
          <button onClick={() => setRenderRoom(null)}
            style={{ padding:"6px 12px", borderRadius:8, border:"none", cursor:"pointer", fontSize:12, fontWeight:700,
              background: renderRoom === null ? "#1a365d" : "#f0f4f8",
              color: renderRoom === null ? "white" : "#4a5568" }}>
            🏠 Toda la casa
          </button>
          {rooms.map(r => {
            const t = ROOM_TYPES.find(x => x.id === r.type);
            return (
              <button key={r.id} onClick={() => setRenderRoom(r.id)}
                style={{ padding:"6px 12px", borderRadius:8, border:"none", cursor:"pointer", fontSize:12, fontWeight:700,
                  background: renderRoom === r.id ? "#553c9a" : "#f0f4f8",
                  color: renderRoom === r.id ? "white" : "#4a5568" }}>
                {t?.emoji} {r.label || t?.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Config prompt */}
      <PromptSection
        prompt={prompt} setPrompt={setPrompt}
        rendering={rendering} renderStep={renderStep}
        rooms={rooms} photoBase64={photoBase64}
        onHandleRender={onHandleRender}
      />

      {/* Galleria render */}
      {renders.length > 0 && (
        <RenderGallery
          renders={renders} activeRender={activeRender} renderImg={renderImg}
          rendering={rendering} portadaSaved={portadaSaved} isPro={isPro}
          photoPreview={photoPreview} prompt={prompt} setPrompt={setPrompt}
          beforeAfter={beforeAfter} setBeforeAfter={setBeforeAfter}
          baSlider={baSlider} setBaSlider={setBaSlider}
          setActiveRender={setActiveRender} setRenderImg={setRenderImg}
          onDownloadRender={onDownloadRender} onSavePortada={onSavePortada}
          onHandleRender={onHandleRender}
          proyectoNombre={proyectoNombre} onToast={onToast} workspaceId={workspaceId}
        />
      )}

      {/* Placeholder vuoto */}
      {!renderImg && !rendering && renders.length === 0 && (
        <div style={{ background:"white", borderRadius:12, padding:32, boxShadow:"0 1px 4px rgba(0,0,0,.07)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", border:"2px dashed #e2e8f0", minHeight:200 }}>
          <div style={{ fontSize:48, marginBottom:12, opacity:.4 }}>🎨</div>
          <div style={{ fontSize:13, color:"#a0aec0", fontWeight:600, textAlign:"center" }}>El render aparecerá aquí</div>
          <div style={{ fontSize:11, color:"#cbd5e0", marginTop:4, textAlign:"center" }}>~$0.05 por habitación · flux-pro</div>
        </div>
      )}

      {/* Storico render */}
      {renderHistory.length > 0 && (
        <RenderHistoryPanel
          renderHistory={renderHistory} renderImg={renderImg}
          showHistory={showHistory} setShowHistory={setShowHistory}
          setRenderImg={setRenderImg} setActiveRender={setActiveRender}
        />
      )}
    </div>
  );
}

// ── Sezione prompt ──────────────────────────────────────────────────────────
function PromptSection({ prompt, setPrompt, rendering, renderStep, rooms, photoBase64, onHandleRender }) {
  const canRender = rooms.length > 0 || !!photoBase64 || !!prompt.trim();
  return (
    <div style={{ background:"white", borderRadius:12, padding:16, boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
      <div style={{ fontWeight:800, fontSize:12, color:"#1a365d", marginBottom:8, letterSpacing:.5 }}>✍️ DESCRIBE TU DISEÑO</div>
      <div style={{ fontSize:11, color:"#718096", marginBottom:8 }}>
        Describe materiales, colores, estilo e iluminación. Cuanto más detallado, mejor resultado.
      </div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 }}>
        {["estilo moderno","madera oscura","mármol blanco","luz natural","colores cálidos","industrial","minimalista","con plantas","piso de madera","techo alto","ventanales grandes","estilo nórdico"].map(sug => (
          <button key={sug} onClick={() => setPrompt(p => p ? `${p}, ${sug}` : sug)}
            style={{ padding:"4px 10px", borderRadius:99, border:"1px solid #e2e8f0", background:"white", color:"#4a5568", fontSize:10, fontWeight:600, cursor:"pointer", transition:"all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.background="#ebf8ff"; e.currentTarget.style.borderColor="#2b6cb0"; e.currentTarget.style.color="#2b6cb0"; }}
            onMouseLeave={e => { e.currentTarget.style.background="white"; e.currentTarget.style.borderColor="#e2e8f0"; e.currentTarget.style.color="#4a5568"; }}>
            + {sug}
          </button>
        ))}
      </div>
      <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
        placeholder="Ej: baño con ceramico azul, madera negra, estilo mediterráneo, luz natural cálida, espejo grande..."
        rows={3}
        style={{ width:"100%", padding:"10px 12px", border:"1.5px solid #bee3f8", borderRadius:8, fontSize:12, resize:"vertical", boxSizing:"border-box", color:"#2d3748", fontFamily:"inherit" }}
      />
      <button onClick={onHandleRender} disabled={rendering || !canRender}
        style={{ marginTop:10, width:"100%", padding:"12px",
          background: rendering ? "#a0aec0" : !canRender ? "#e2e8f0" : "linear-gradient(135deg,#553c9a,#2b6cb0)",
          color: !canRender ? "#a0aec0" : "white",
          border:"none", borderRadius:9, cursor: !canRender || rendering ? "not-allowed" : "pointer",
          fontWeight:800, fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
        {rendering ? (<><span style={{ display:"inline-block", animation:"spin 1s linear infinite" }}>⏳</span>{renderStep}</>) :
         !canRender ? "Añade habitaciones, sube una foto o escribe un prompt" : "✨ Generar Render AI"}
      </button>
    </div>
  );
}

// ── Galleria render ─────────────────────────────────────────────────────────
function RenderGallery({
  renders, activeRender, isPro, photoPreview,
  beforeAfter, setBeforeAfter, baSlider, setBaSlider,
  prompt, setPrompt, rendering, portadaSaved,
  setActiveRender, setRenderImg,
  onDownloadRender, onSavePortada, onHandleRender,
  proyectoNombre, onToast, workspaceId,
}) {
  return (
    <div style={{ background:"white", borderRadius:12, padding:16, boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
      <div style={{ fontWeight:800, fontSize:12, color:"#1a365d", marginBottom:12, letterSpacing:.5 }}>
        RENDERS GENERADOS — {renders.filter(r=>r.ok).length}/{renders.length}
      </div>
      {/* Tabs stanze */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
        {renders.map((r, i) => (
          <button key={i} onClick={() => { setActiveRender(i); setRenderImg(r.imageUrl); }}
            style={{ padding:"5px 11px", borderRadius:8, border:"none", cursor:"pointer", fontSize:11, fontWeight:700,
              background: activeRender === i ? "#1a365d" : r.ok ? "#f0f4f8" : "#fff5f5",
              color: activeRender === i ? "white" : r.ok ? "#4a5568" : "#c53030" }}>
            {r.ok ? "" : "❌ "}{r.label || r.roomType}
          </button>
        ))}
      </div>

      {/* Before/After toggle */}
      {photoPreview && renders[activeRender]?.ok && (
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
          <button onClick={() => setBeforeAfter(v => !v)}
            style={{ padding:"5px 14px", borderRadius:8, border:"none", cursor:"pointer",
              background: beforeAfter ? "#553c9a" : "#e2e8f0",
              color: beforeAfter ? "white" : "#4a5568",
              fontWeight:700, fontSize:11, transition:"all .2s" }}>
            {beforeAfter ? "🔀 Antes / Después ON" : "🔀 Ver Antes / Después"}
          </button>
          {beforeAfter && <span style={{ fontSize:10, color:"#718096" }}>← arrastra el slider →</span>}
        </div>
      )}

      {/* Immagine attiva */}
      {renders[activeRender]?.ok ? (
        <div style={{ position:"relative", display:"inline-block", width:"100%" }}>
          {beforeAfter && photoPreview ? (
            <div
              style={{ position:"relative", width:"100%", borderRadius:10, overflow:"hidden", userSelect:"none", cursor:"ew-resize" }}
              onMouseMove={e => { if (e.buttons !== 1) return; const rect = e.currentTarget.getBoundingClientRect(); setBaSlider(Math.round(((e.clientX - rect.left) / rect.width) * 100)); }}
              onTouchMove={e => { const rect = e.currentTarget.getBoundingClientRect(); setBaSlider(Math.round(((e.touches[0].clientX - rect.left) / rect.width) * 100)); }}>
              <img src={photoPreview} alt="Antes" style={{ width:"100%", display:"block", borderRadius:10 }} />
              <div style={{ position:"absolute", top:0, left:0, width:`${baSlider}%`, height:"100%", overflow:"hidden" }}>
                <img src={renders[activeRender].imageUrl} alt="Después" style={{ width:`${10000/baSlider}%`, maxWidth:"none", display:"block", borderRadius:10 }} />
              </div>
              <div style={{ position:"absolute", top:0, left:`${baSlider}%`, transform:"translateX(-50%)", width:3, height:"100%", background:"white", boxShadow:"0 0 8px rgba(0,0,0,.5)", pointerEvents:"none" }}>
                <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", background:"white", borderRadius:"50%", width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 8px rgba(0,0,0,.3)", fontSize:14 }}>⇔</div>
              </div>
              <div style={{ position:"absolute", top:8, left:8, background:"rgba(0,0,0,.55)", color:"white", borderRadius:6, padding:"3px 8px", fontSize:10, fontWeight:700, pointerEvents:"none" }}>ANTES</div>
              <div style={{ position:"absolute", top:8, right:8, background:"rgba(85,60,154,.85)", color:"white", borderRadius:6, padding:"3px 8px", fontSize:10, fontWeight:700, pointerEvents:"none" }}>DESPUÉS</div>
            </div>
          ) : (
            <img src={renders[activeRender].imageUrl} alt={renders[activeRender].label}
              style={{ width:"100%", borderRadius:10, display:"block", boxShadow:"0 4px 20px rgba(0,0,0,.12)" }} />
          )}
          {!isPro && (
            <div style={{ position:"absolute", inset:0, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none", overflow:"hidden" }}>
              {Array.from({ length: 12 }).map((_, wi) => (
                <div key={wi} style={{ position:"absolute", top: `${(wi % 4) * 28 - 10}%`, left: `${Math.floor(wi / 4) * 36 - 5}%`, transform:"rotate(-20deg)", whiteSpace:"nowrap", opacity:0.22, pointerEvents:"none" }}>
                  <div style={{ fontSize:28, fontWeight:900, color:"white", letterSpacing:2, textShadow:"0 1px 4px rgba(0,0,0,.5)" }}>OBRA NOVA</div>
                  <div style={{ fontSize:11, color:"white", textAlign:"center", marginTop:2 }}>app.obranova.cl</div>
                </div>
              ))}
              <div style={{ position:"absolute", bottom:10, right:10, background:"rgba(26,54,93,0.85)", borderRadius:8, padding:"7px 14px" }}>
                <span style={{ color:"white", fontSize:12, fontWeight:700 }}>⚡ Actualiza a Pro para descargar sin marca</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding:24, textAlign:"center", color:"#c53030", fontSize:13 }}>❌ Este render falló</div>
      )}

      {/* Action buttons */}
      <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap" }}>
        <button onClick={onDownloadRender} disabled={!renders[activeRender]?.ok}
          style={{ flex:1, padding:"9px", minWidth:140,
            background: renders[activeRender]?.ok ? "#276749" : "#e2e8f0",
            color: renders[activeRender]?.ok ? "white" : "#a0aec0",
            border:"none", borderRadius:8, cursor: renders[activeRender]?.ok ? "pointer" : "not-allowed", fontWeight:700, fontSize:12 }}>
          ⬇️ Descargar {renders[activeRender]?.label || ""}
        </button>
        <button onClick={onHandleRender}
          style={{ flex:1, padding:"9px", minWidth:140, background:"#ebf8ff", color:"#2b6cb0", border:"1px solid #bee3f8", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}>
          🔄 Regenerar todo
        </button>
        {isPro && renders[activeRender]?.ok && (
          <button onClick={() => onSavePortada(renders[activeRender].imageUrl)}
            style={{ padding:"9px 14px", borderRadius:8, border:"none", cursor:"pointer",
              background: portadaSaved ? "#276749" : "#faf5ff",
              color: portadaSaved ? "white" : "#553c9a", fontWeight:700, fontSize:12, whiteSpace:"nowrap", transition:"all .2s" }}>
            {portadaSaved ? "✅ Portada guardada" : "⭐ Usar como portada"}
          </button>
        )}
        {renders[activeRender]?.ok && (
          <button onClick={() => {
            const url = renders[activeRender].imageUrl;
            const label = renders[activeRender].label || "ambiente";
            const msg = encodeURIComponent(`🏗️ *Obra Nova — Visualización AI*\n\n✨ Render de ${label}${proyectoNombre ? ` para "${proyectoNombre}"` : ""}\n\n${url}`);
            window.open(`https://wa.me/?text=${msg}`, "_blank");
          }}
            style={{ padding:"9px 14px", borderRadius:8, border:"none", cursor:"pointer", background:"#25d366", color:"white", fontWeight:700, fontSize:12, whiteSpace:"nowrap" }}>
            💬 WhatsApp
          </button>
        )}
        {renders.filter(r => r.ok).length > 1 && (
          <button onClick={() => {
            renders.filter(r => r.ok).forEach((r, i) => {
              setTimeout(() => {
                const a = document.createElement("a");
                a.href = r.imageUrl; a.download = `render_${r.label || r.roomType || i}.jpg`;
                a.target = "_blank"; a.rel = "noopener";
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
              }, i * 500);
            });
          }} style={{ padding:"9px 14px", background:"#553c9a", color:"white", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12, whiteSpace:"nowrap" }}>
            📦 Descargar todos ({renders.filter(r => r.ok).length})
          </button>
        )}
      </div>

      {/* Portfolio tip */}
      {workspaceId && renders.filter(r => r.ok).length > 0 && (
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "linear-gradient(135deg,#fefcbf,#faf089)", borderRadius: 8, border: "1px solid #ecc94b" }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>🎨</span>
          <div style={{ flex: 1, fontSize: 11, color: "#744210" }}>
            Tus renders aparecen en tu <strong>portfolio público</strong> — compártelo con tus clientes
          </div>
          <button onClick={() => window.open(`${window.location.origin}/portfolio/${workspaceId}`, "_blank")}
            style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: "#b7791f", color: "white", fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
            Ver portfolio
          </button>
        </div>
      )}

      {/* Refinar prompt */}
      <div style={{ marginTop:14, background:"#f7fafc", borderRadius:10, padding:"12px 14px", border:"1px solid #e2e8f0" }}>
        <div style={{ fontSize:12, fontWeight:700, color:"#1a365d", marginBottom:6 }}>✏️ Refinar indicaciones y regenerar</div>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
          placeholder="Modifica tus indicaciones: materiales, colores, estilo, iluminación..."
          rows={2}
          style={{ width:"100%", padding:"8px 10px", border:"1.5px solid #bee3f8", borderRadius:8, fontSize:12, resize:"vertical", boxSizing:"border-box", color:"#2d3748", fontFamily:"inherit", background:"white" }}
        />
        <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
          {["Más luz natural","Madera oscura","Colores cálidos","Más minimalista","Con plantas","Piso de mármol","Estilo rústico"].map(sug => (
            <button key={sug} onClick={() => setPrompt(p => p ? `${p}, ${sug.toLowerCase()}` : sug.toLowerCase())}
              style={{ padding:"4px 10px", borderRadius:99, border:"1px solid #bee3f8", background:"white", color:"#2b6cb0", fontSize:10, fontWeight:600, cursor:"pointer" }}>
              + {sug}
            </button>
          ))}
        </div>
        <button onClick={onHandleRender} disabled={rendering}
          style={{ marginTop:10, width:"100%", padding:"10px",
            background: rendering ? "#a0aec0" : "linear-gradient(135deg,#553c9a,#2b6cb0)",
            color:"white", border:"none", borderRadius:8, cursor: rendering ? "not-allowed" : "pointer",
            fontWeight:800, fontSize:13 }}>
          {rendering ? "⏳ Regenerando..." : "✨ Regenerar con nuevas indicaciones"}
        </button>
      </div>
    </div>
  );
}

// ── Storico render ──────────────────────────────────────────────────────────
function RenderHistoryPanel({ renderHistory, renderImg, showHistory, setShowHistory, setRenderImg, setActiveRender }) {
  return (
    <div style={{ background:"white", borderRadius:12, padding:16, boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div style={{ fontWeight:800, fontSize:12, color:"#1a365d", letterSpacing:.5 }}>
          📁 HISTORIAL DE VERSIONES — {renderHistory.length}
        </div>
        <button onClick={() => setShowHistory(v => !v)}
          style={{ background:"none", border:"1px solid #e2e8f0", borderRadius:6, padding:"3px 10px", cursor:"pointer", fontSize:11, color:"#718096", fontWeight:600 }}>
          {showHistory ? "Ocultar" : "Ver todo"}
        </button>
      </div>
      {!showHistory && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(80px,1fr))", gap:6 }}>
          {renderHistory.slice(0, 4).map((r) => (
            <div key={r.id} onClick={() => { setRenderImg(r.imageUrl); setActiveRender(-1); }}
              style={{ cursor:"pointer", borderRadius:6, overflow:"hidden", border: renderImg === r.imageUrl ? "2px solid #2b6cb0" : "1px solid #e2e8f0", transition:"border .2s" }}>
              <img src={r.imageUrl} alt={r.label} style={{ width:"100%", height:56, objectFit:"cover", display:"block" }} />
            </div>
          ))}
        </div>
      )}
      {showHistory && (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {renderHistory.map((r, i) => {
            const date = r.createdAt ? new Date(r.createdAt) : null;
            const dateStr = date ? date.toLocaleDateString("es-CL", { day:"2-digit", month:"short" }) + " " + date.toLocaleTimeString("es-CL", { hour:"2-digit", minute:"2-digit" }) : "";
            const modeIcon = { controlnet:"📐", img2img:"📷", txt2img:"✍️" }[r.mode] || "🎨";
            return (
              <div key={r.id} onClick={() => { setRenderImg(r.imageUrl); setActiveRender(-1); }}
                style={{ display:"flex", gap:10, padding:"8px 10px", borderRadius:8, cursor:"pointer",
                  background: renderImg === r.imageUrl ? "#ebf8ff" : "#f7fafc",
                  border: renderImg === r.imageUrl ? "1.5px solid #2b6cb0" : "1px solid #e2e8f0", transition:"all .2s" }}>
                <img src={r.imageUrl} alt={r.label} style={{ width:80, height:56, objectFit:"cover", borderRadius:6, flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#1a365d", marginBottom:2 }}>{modeIcon} {r.label || r.roomType || "Render"}</div>
                  <div style={{ fontSize:10, color:"#718096" }}>{r.style || ""}{dateStr ? ` · ${dateStr}` : ""}</div>
                  <div style={{ fontSize:10, color:"#a0aec0", marginTop:1 }}>Versión {renderHistory.length - i}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
