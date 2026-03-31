// ─── components/tabs/TabDiseno.jsx ───────────────────────────────────────────
// Sprint D — Editor planimetria 2D + Mobiliario + Render AI
// Orchestrator: state + routing tra i 4 panel.
// ────────────────────────────────────────────────────────────────��────────────
import { useState, useRef, useCallback, useEffect } from "react";
import { db } from "../../lib/firebase";
import { ROOM_TYPES, mkRoom, mkFurniture, snap } from "./diseno/constants";
import { useRenderAI } from "./diseno/useRenderAI";
import PanelEditor     from "./diseno/PanelEditor";
import PanelRender     from "./diseno/PanelRender";
import PanelStandalone from "./diseno/PanelStandalone";
import PanelCompare    from "./diseno/PanelCompare";

export default function TabDiseno({ workspaceId, proyectoId, proyectoNombre, onToast, isPro, plan, onRendersReady }) {
  // ── State editor ──────────────────────────────────────────────────────────
  const [rooms,       setRooms]       = useState([]);
  const [furniture,   setFurniture]   = useState([]);
  const [selected,    setSelected]    = useState(null);
  const [activeLayer, setActiveLayer] = useState('room');
  const [openCat,     setOpenCat]     = useState(null);
  const [panel,       setPanel]       = useState("editor");
  const [renderRoom,  setRenderRoom]  = useState(null);
  const [prompt,      setPrompt]      = useState("");
  const [standalonePrompt, setStandalonePrompt] = useState("");
  // Foto
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoBase64,  setPhotoBase64]  = useState(null);
  const [showHistory,  setShowHistory]  = useState(false);
  const fileInputRef = useRef();
  const stageRef     = useRef();

  // ── Hook render AI ────────────────────────────────────────────────────────
  const ai = useRenderAI({ workspaceId, proyectoId, isPro, plan, onToast, onRendersReady });

  // ── Load planimetria da Firestore ─────────────────────────────────────────
  useEffect(() => {
    if (!workspaceId || !proyectoId) return;
    (async () => {
      try {
        const { doc: docRef, getDoc: getDocFn } = await import("firebase/firestore");
        const snap = await getDocFn(docRef(db, "workspaces", workspaceId, "proyectos", proyectoId));
        if (snap.exists()) {
          const data = snap.data();
          if (data.plano2d?.rooms?.length > 0) setRooms(data.plano2d.rooms);
          if (data.plano2d?.furniture?.length > 0) setFurniture(data.plano2d.furniture);
        }
      } catch (e) { console.warn("Load planimetria:", e.message); }
    })();
  }, [workspaceId, proyectoId]);

  // ── Auto-save planimetria (debounce 2s) ───────────────────────────────────
  useEffect(() => {
    if (!workspaceId || !proyectoId) return;
    if (rooms.length === 0 && furniture.length === 0) return;
    const timer = setTimeout(async () => {
      try {
        const { doc: docRef, updateDoc } = await import("firebase/firestore");
        await updateDoc(docRef(db, "workspaces", workspaceId, "proyectos", proyectoId), {
          plano2d: { rooms, furniture, updatedAt: new Date().toISOString() },
        });
      } catch (e) { console.warn("Save planimetria:", e.message); }
    }, 2000);
    return () => clearTimeout(timer);
  }, [workspaceId, proyectoId, rooms, furniture]);

  // ── Load presets + history ────────────────────────────────────────────────
  useEffect(() => { ai.loadPresets(); }, [workspaceId]);
  useEffect(() => { ai.loadRenderHistory(); }, [workspaceId, proyectoId, ai.renders]);

  // ── Handlers editor ───────────────────────────────────────────────────────
  const addRoom = useCallback((type) => {
    const offset = rooms.length * 20;
    setRooms(r => [...r, mkRoom(type, 80 + offset, 80 + offset)]);
    setActiveLayer('room');
  }, [rooms.length]);

  const addFurniture = useCallback((furn) => {
    const offset = furniture.length * 10;
    setFurniture(f => [...f, mkFurniture(furn, 120 + offset, 120 + offset)]);
    setActiveLayer('furniture');
  }, [furniture.length]);

  const changeRoom = useCallback((id, patch) => {
    setRooms(r => r.map(x => x.id === id ? { ...x, ...patch } : x));
  }, []);

  const changeFurn = useCallback((id, patch) => {
    setFurniture(f => f.map(x => x.id === id ? { ...x, ...patch } : x));
  }, []);

  const rotateSelected = useCallback((deg) => {
    if (!selected || selected.layer !== 'furniture') return;
    changeFurn(selected.id, { rotation: ((furniture.find(f => f.id === selected.id)?.rotation || 0) + deg + 360) % 360 });
  }, [selected, furniture, changeFurn]);

  const deleteSelected = useCallback(() => {
    if (!selected) return;
    if (selected.layer === 'room') setRooms(r => r.filter(x => x.id !== selected.id));
    else setFurniture(f => f.filter(x => x.id !== selected.id));
    setSelected(null);
  }, [selected]);

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = e => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected) { e.preventDefault(); deleteSelected(); }
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected, deleteSelected]);

  // ── Export PNG ─────────────────────────────────────────────────────────────
  const downloadPlan = useCallback(async () => {
    if (!stageRef.current) return;
    setSelected(null);
    await new Promise(r => setTimeout(r, 100));
    const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
    const a = document.createElement("a");
    a.href = uri; a.download = `planimetria-${proyectoNombre || "proyecto"}.png`; a.click();
  }, [proyectoNombre]);

  // ── Foto handlers ─────────────────────────────────────────────────────────
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { onToast?.("⚠️ Foto demasiado grande (máx 10MB)"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreview(ev.target.result);
      setPhotoBase64(ev.target.result.split(",")[1]);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoPreview(null); setPhotoBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Render wrappers ───────────────────────────────────────────────────────
  const onHandleRender = useCallback(async () => {
    setPanel("render");
    const result = await ai.handleRender({ rooms, furniture, prompt, photoBase64, stageRef, renderRoom });
    if (result === "editor") setPanel("editor");
  }, [ai, rooms, furniture, prompt, photoBase64, renderRoom]);

  const onHandleRenderStandalone = useCallback(async () => {
    setPanel("standalone");
    await ai.handleRenderStandalone({ rooms, prompt: standalonePrompt, photoBase64 });
  }, [ai, rooms, standalonePrompt, photoBase64]);

  const onHandleCompareStyles = useCallback(() => {
    ai.handleCompareStyles({ rooms, furniture, prompt: prompt || standalonePrompt, photoBase64, renderRoom });
  }, [ai, rooms, furniture, prompt, standalonePrompt, photoBase64, renderRoom]);

  const onDownloadRender = useCallback(async () => {
    const activeImg = ai.renders[ai.activeRender]?.imageUrl || ai.renderImg;
    if (!activeImg) return;
    const finalUrl = await ai.applyWatermark(activeImg);
    const a = document.createElement("a");
    a.href = finalUrl;
    a.download = `render-${ai.renders[ai.activeRender]?.label || proyectoNombre || "proyecto"}-${Date.now()}.jpg`;
    a.click();
  }, [ai, proyectoNombre]);

  const onDownloadStandalone = useCallback(async () => {
    if (!ai.standaloneResult) return;
    const finalUrl = await ai.applyWatermark(ai.standaloneResult);
    const a = document.createElement("a");
    a.href = finalUrl; a.download = `render-rapido-${Date.now()}.jpg`; a.click();
  }, [ai]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const selectedRoom = selected?.layer === 'room' ? rooms.find(r => r.id === selected.id) : null;
  const selectedFurn = selected?.layer === 'furniture' ? furniture.find(f => f.id === selected.id) : null;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:0, maxWidth:1100, margin:"0 auto" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        background:"linear-gradient(135deg,#1a365d 0%,#2d3748 60%,#553c9a 100%)",
        borderRadius:14, padding:"18px 24px", marginBottom:14,
        display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12,
      }}>
        <div>
          <div style={{ color:"rgba(255,255,255,.6)", fontSize:11, fontWeight:600, letterSpacing:1, marginBottom:3 }}>DISEÑO Y PLANIMETRÍA</div>
          <div style={{ color:"white", fontSize:20, fontWeight:900 }}>��️ Editor de Planos</div>
          {proyectoNombre && <div style={{ color:"rgba(255,255,255,.6)", fontSize:12, marginTop:2 }}>{proyectoNombre}</div>}
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <button onClick={() => setPanel(panel === "editor" ? "render" : "editor")}
            style={{ padding:"8px 16px", borderRadius:8, border:"none", cursor:"pointer",
              background: panel === "render" ? "white" : "rgba(255,255,255,.15)",
              color: panel === "render" ? "#1a365d" : "white", fontWeight:700, fontSize:12 }}>
            {panel === "editor" ? "🎨 Ver Render" : "✏️ Editor"}
          </button>
          <button onClick={() => setPanel(panel === "standalone" ? "editor" : "standalone")}
            style={{ padding:"8px 16px", borderRadius:8, border:"none", cursor:"pointer",
              background: panel === "standalone" ? "#f0fff4" : "rgba(255,255,255,.15)",
              color: panel === "standalone" ? "#276749" : "white", fontWeight:700, fontSize:12 }}>
            ⚡ Render Rápido
          </button>
          {rooms.length > 0 && (
            <button onClick={downloadPlan}
              style={{ padding:"8px 16px", borderRadius:8, border:"1px solid rgba(255,255,255,.3)",
                background:"transparent", color:"white", cursor:"pointer", fontWeight:600, fontSize:12 }}>
              ⬇️ PNG Plano
            </button>
          )}
        </div>
      </div>

      {/* ── Layout principale ──────────────────────────────────────────────── */}
      <div style={{ display:"flex", gap:14, alignItems:"flex-start", flexWrap:"wrap" }}>

        {panel === "editor" && (
          <PanelEditor
            rooms={rooms} furniture={furniture} selected={selected}
            activeLayer={activeLayer} openCat={openCat}
            stageRef={stageRef} selectedRoom={selectedRoom} selectedFurn={selectedFurn}
            addRoom={addRoom} addFurniture={addFurniture}
            changeRoom={changeRoom} changeFurn={changeFurn}
            rotateSelected={rotateSelected} deleteSelected={deleteSelected}
            setSelected={setSelected} setActiveLayer={setActiveLayer} setOpenCat={setOpenCat}
            setRooms={setRooms} setFurniture={setFurniture}
          />
        )}

        {panel === "render" && (
          <PanelRender
            rooms={rooms} renders={ai.renders} activeRender={ai.activeRender}
            renderImg={ai.renderImg} rendering={ai.rendering} renderStep={ai.renderStep}
            renderHistory={ai.renderHistory} portadaSaved={ai.portadaSaved}
            isPro={isPro} prompt={prompt} setPrompt={setPrompt}
            photoPreview={photoPreview} photoBase64={photoBase64} fileInputRef={fileInputRef}
            renderRoom={renderRoom} setRenderRoom={setRenderRoom}
            showHistory={showHistory} setShowHistory={setShowHistory}
            onHandleRender={onHandleRender}
            onHandlePhotoUpload={handlePhotoUpload} onRemovePhoto={removePhoto}
            onDownloadRender={onDownloadRender} onSavePortada={ai.savePortada}
            setActiveRender={ai.setActiveRender} setRenderImg={ai.setRenderImg}
            setPanel={setPanel}
            proyectoNombre={proyectoNombre} onToast={onToast} workspaceId={workspaceId}
          />
        )}

        {panel === "standalone" && (
          <PanelStandalone
            isPro={isPro} photoPreview={photoPreview} photoBase64={photoBase64}
            fileInputRef={fileInputRef}
            standalonePrompt={standalonePrompt} setStandalonePrompt={setStandalonePrompt}
            standaloneRendering={ai.standaloneRendering} standaloneResult={ai.standaloneResult}
            standaloneStep={ai.standaloneStep} portadaSaved={ai.portadaSaved}
            onHandlePhotoUpload={handlePhotoUpload} onRemovePhoto={removePhoto}
            onHandleRenderStandalone={onHandleRenderStandalone}
            onSavePortada={ai.savePortada} onDownloadStandalone={onDownloadStandalone}
            onToast={onToast} setPanel={setPanel}
          />
        )}

        {/* Compare — visibile sempre sotto il panel attivo */}
        <PanelCompare
          rooms={rooms} photoBase64={photoBase64}
          prompt={prompt} standalonePrompt={standalonePrompt}
          compareRenders={ai.compareRenders} comparingStyles={ai.comparingStyles}
          onHandleCompareStyles={onHandleCompareStyles}
          onSavePortada={ai.savePortada} onToast={onToast}
          setRenders={ai.setRenders} setActiveRender={ai.setActiveRender}
          setRenderImg={ai.setRenderImg} setPanel={setPanel}
        />
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
