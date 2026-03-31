// ─── diseno/useRenderAI.js ───────────────────────────────────────────────────
// Hook centralizzato per tutte le operazioni di render AI.
//
// FIX rispetto al vecchio TabDiseno monolite:
// 1. getFunctions() inizializzato una sola volta (useMemo)
// 2. buildRoomsData() unica funzione — era duplicata 3 volte
// 3. handleRender + handleRenderStandalone unificati in callRenderAI()
// 4. handleCompareStyles usa Promise.allSettled (era for-loop sequenziale)
// 5. Bug fix: `functions` non definito in compare — ora usa `renderAIFn`
// 6. Error handling quota unificato in parseRenderError()
// 7. lastRenderUrl save unificato in saveLastRender()
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback, useMemo, useRef } from "react";
import { httpsCallable, getFunctions } from "firebase/functions";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db, app } from "../../../lib/firebase";
import { handleError } from "../../../utils/errorHandler";
import { ROOM_TYPES, GRID } from "./constants";

// ── Parsing errori quota ──────────────────────────────────────────────────────
function parseRenderError(e) {
  const msg = e.message || "";
  if (msg.includes("quota_exceeded:free")) {
    return { toast: "⚡ Actualiza a Pro para usar Render AI", step: "⚡ Disponible en Pro" };
  }
  if (msg.includes("quota_exceeded")) {
    const left = msg.split(":")[1]?.split(" ")[0] || "0";
    return { toast: `⚠️ Solo te quedan ${left} renders este mes`, step: `⚠️ Quota agotada (${left} restantes)` };
  }
  return { toast: `❌ Error al generar render: ${msg}`, step: "❌ Error — intenta de nuevo" };
}

export function useRenderAI({ workspaceId, proyectoId, isPro, plan, onToast, onRendersReady }) {
  // ── State ─────────────────────────────────────────────────────────────────
  const [renders,          setRenders]          = useState([]);
  const [activeRender,     setActiveRender]     = useState(0);
  const [renderImg,        setRenderImg]        = useState(null);
  const [rendering,        setRendering]        = useState(false);
  const [renderStep,       setRenderStep]       = useState("");
  const [quotaLeft,        setQuotaLeft]        = useState(null);
  const [renderHistory,    setRenderHistory]    = useState([]);
  const [portadaSaved,     setPortadaSaved]     = useState(false);
  // Standalone
  const [standaloneRendering, setStandaloneRendering] = useState(false);
  const [standaloneResult,    setStandaloneResult]    = useState(null);
  const [standaloneStep,      setStandaloneStep]      = useState("");
  // Compare
  const [compareMode,      setCompareMode]      = useState(false);
  const [compareRenders,   setCompareRenders]   = useState([]);
  const [comparingStyles,  setComparingStyles]  = useState(false);

  // ── Firebase Functions — inizializzato una sola volta ─────────────────────
  const renderAIFn = useMemo(
    () => httpsCallable(getFunctions(app, "southamerica-west1"), "renderAI"),
    []
  );

  // ── Preset prompt ─────────────────────────────────────────────────────────
  const [promptPresets, setPromptPresets] = useState([]);

  const loadPresets = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const snap = await getDocs(
        query(collection(db, "workspaces", workspaceId, "promptPresets"), orderBy("createdAt", "desc"))
      );
      setPromptPresets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {}
  }, [workspaceId]);

  const savePreset = useCallback(async (text) => {
    if (!workspaceId || !text.trim()) return;
    try {
      const { collection: col, addDoc } = await import("firebase/firestore");
      const newPreset = { text: text.trim(), createdAt: new Date().toISOString() };
      const ref = await addDoc(col(db, "workspaces", workspaceId, "promptPresets"), newPreset);
      setPromptPresets(prev => [{ id: ref.id, ...newPreset }, ...prev]);
      onToast?.("✅ Preset guardado");
    } catch (e) {
      handleError(e, { context: "savePreset", onToast });
    }
  }, [workspaceId, onToast]);

  const deletePreset = useCallback(async (presetId) => {
    if (!workspaceId) return;
    try {
      const { doc: docRef, deleteDoc } = await import("firebase/firestore");
      await deleteDoc(docRef(db, "workspaces", workspaceId, "promptPresets", presetId));
      setPromptPresets(prev => prev.filter(p => p.id !== presetId));
    } catch {}
  }, [workspaceId]);

  // ── Render history ────────────────────────────────────────────────────────
  const loadRenderHistory = useCallback(async () => {
    if (!workspaceId || !proyectoId) return;
    try {
      const q = query(
        collection(db, "workspaces", workspaceId, "proyectos", proyectoId, "renders"),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setRenderHistory(snap.docs.map(d => {
        const data = d.data();
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || null);
        return { id: d.id, ...data, createdAt };
      }));
    } catch (e) {
      handleError(e, { context: "loadRenderHistory", silent: true });
    }
  }, [workspaceId, proyectoId]);

  // ── Build roomsData — unica funzione, era duplicata 3 volte ───────────────
  const buildRoomsData = useCallback((rooms, furniture, renderRoom = null) => {
    const targetRooms = renderRoom
      ? rooms.filter(r => r.id === renderRoom)
      : rooms;

    if (targetRooms.length === 0) {
      return [{ type: "sala", label: "Ambiente", w: 5, h: 4, area: 20, furniture: [] }];
    }

    return targetRooms.map(r => {
      const t    = ROOM_TYPES.find(x => x.id === r.type);
      const wM   = Math.round(r.w / GRID * 0.4 * 10) / 10;
      const hM   = Math.round(r.h / GRID * 0.4 * 10) / 10;
      const furnInRoom = furniture.filter(f =>
        f.x + f.w * 0.5 >= r.x && f.x + f.w * 0.5 <= r.x + r.w &&
        f.y + f.h * 0.5 >= r.y && f.y + f.h * 0.5 <= r.y + r.h
      );
      return {
        type:      r.type,
        label:     t?.label || r.type,
        w:         wM,
        h:         hM,
        area:      Math.round(wM * hM * 10) / 10,
        furniture: furnInRoom.map(f => f.label).filter(Boolean),
      };
    });
  }, []);

  // ── Salva lastRenderUrl — unificato ───────────────────────────────────────
  const saveLastRender = useCallback(async (imageUrl) => {
    if (!imageUrl || !workspaceId || !proyectoId) return;
    try {
      const { doc: docRef, updateDoc } = await import("firebase/firestore");
      await updateDoc(docRef(db, "workspaces", workspaceId, "proyectos", proyectoId), {
        lastRenderUrl:   imageUrl,
        lastRenderAt:    new Date().toISOString(),
        lastRenderStyle: "",
      });
    } catch {}
  }, [workspaceId, proyectoId]);

  // ── Salva portada ─────────────────────────────────────────────────────────
  const savePortada = useCallback(async (imageUrl) => {
    if (!workspaceId || !proyectoId || !imageUrl) return;
    try {
      const { doc: docRef, updateDoc } = await import("firebase/firestore");
      await updateDoc(docRef(db, "workspaces", workspaceId, "proyectos", proyectoId), {
        coverImageUrl: imageUrl,
        updatedAt: new Date().toISOString(),
      });
      setPortadaSaved(true);
      onToast?.("⭐ Portada del proyecto actualizada");
      setTimeout(() => setPortadaSaved(false), 3000);
    } catch (e) {
      handleError(e, { context: "savePortada", onToast });
    }
  }, [workspaceId, proyectoId, onToast]);

  // ── Watermark (Free plan) ─────────────────────────────────────────────────
  const applyWatermark = useCallback((sourceUrl) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width  = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        if (!isPro) {
          const W = canvas.width, H = canvas.height;
          ctx.save();
          ctx.translate(W / 2, H / 2);
          ctx.rotate(-Math.PI / 6);
          const stepX = 280, stepY = 120;
          const cols = Math.ceil(W / stepX) + 2;
          const rows = Math.ceil(H / stepY) + 2;
          for (let r = -rows; r <= rows; r++) {
            for (let c = -cols; c <= cols; c++) {
              ctx.font = "bold 38px 'Segoe UI', system-ui, sans-serif";
              ctx.fillStyle = "rgba(255,255,255,0.18)";
              ctx.textAlign = "center";
              ctx.fillText("OBRA NOVA", c * stepX, r * stepY);
              ctx.font = "500 14px 'Segoe UI', system-ui, sans-serif";
              ctx.fillStyle = "rgba(255,255,255,0.13)";
              ctx.fillText("app.obranova.cl · Plan Free", c * stepX, r * stepY + 20);
            }
          }
          ctx.restore();
          const bx = W - 262, by = H - 48;
          ctx.fillStyle = "rgba(26,54,93,0.82)";
          ctx.beginPath();
          ctx.roundRect(bx, by, 250, 34, 8);
          ctx.fill();
          ctx.font = "bold 13px 'Segoe UI', system-ui, sans-serif";
          ctx.fillStyle = "rgba(255,255,255,0.92)";
          ctx.textAlign = "center";
          ctx.fillText("⚡ Actualiza a Pro — app.obranova.cl", bx + 125, by + 22);
        }
        resolve(canvas.toDataURL("image/jpeg", 0.92));
      };
      img.onerror = () => resolve(sourceUrl);
      img.src = sourceUrl;
    });
  }, [isPro]);

  // ── Core: chiama renderAI ─────────────────────────────────────────────────
  // Funzione interna unificata — usata da handleRender e handleRenderStandalone
  const callRenderAI = useCallback(async ({
    rooms, furniture, prompt, photoBase64, planBase64, renderRoom,
    setStep, setResult, label,
  }) => {
    // Check permessi
    if (!isPro && !plan?.canRender) {
      onToast?.("⚡ Actualiza a Pro para usar Render AI");
      return null;
    }

    const roomsData = buildRoomsData(rooms, furniture, renderRoom);
    const modeHint = photoBase64 && planBase64 ? "plano + foto" : planBase64 ? "plano 2D" : photoBase64 ? "foto" : "texto";
    setStep(`Generando render${roomsData.length > 1 ? "s" : ""} [${modeHint}]...`);

    const result = await renderAIFn({
      rooms:       roomsData,
      style:       "",
      extraPrompt: prompt.trim(),
      photoBase64: photoBase64 || null,
      planBase64:  planBase64 || null,
      workspaceId,
      proyectoId,
    });

    if (!result.data?.renders?.length) throw new Error("No se recibieron renders");

    const normalized = result.data.renders.map(r => ({
      ...r,
      ok:       !!r.imageUrl,
      label:    r.roomId || r.roomType || label || "Render",
      roomType: r.roomId || r.roomType || "sala",
    }));
    const successful = normalized.filter(r => r.ok);

    // Aggiorna state
    setRenders(prev => [...normalized, ...prev]);
    setRenderImg(successful[0]?.imageUrl || null);
    setActiveRender(0);
    if (result.data.remaining != null) setQuotaLeft(result.data.remaining);

    // Salva lastRenderUrl in background
    if (successful[0]?.imageUrl) saveLastRender(successful[0].imageUrl);

    // Notifica App
    onRendersReady?.([...successful, ...(renders.filter(r => r.ok) || [])]);

    const modeLabel = { "plan+photo": "📐+📷", "plan": "📐 plano", "photo": "📷 foto", "text": "✍️ texto", "controlnet": "📐 ControlNet", "img2img": "📷 img2img", "txt2img": "✍️ txt2img" }[result.data.mode] || result.data.mode;
    return { successful, modeLabel };
  }, [isPro, plan, buildRoomsData, renderAIFn, workspaceId, proyectoId, saveLastRender, onRendersReady, onToast, renders]);

  // ── handleRender — plano 2D + prompt ──────────────────────────────────────
  const handleRender = useCallback(async ({ rooms, furniture, prompt, photoBase64, stageRef, renderRoom }) => {
    if (rooms.length === 0 && !photoBase64 && !prompt.trim()) {
      onToast?.("⚠️ Agrega habitaciones, sube una foto o escribe un prompt");
      return;
    }
    setRendering(true);
    setRenderImg(null);

    try {
      setRenderStep("Preparando datos...");

      // Export planimetria come PNG per ControlNet
      let planBase64 = null;
      if (stageRef?.current && rooms.length > 0) {
        try {
          setRenderStep("Exportando plano 2D...");
          const uri = stageRef.current.toDataURL({ pixelRatio: 1, mimeType: "image/png" });
          planBase64 = uri.split(",")[1];
        } catch (e) {
          console.warn("Export planimetria fallito:", e);
        }
      }

      const res = await callRenderAI({
        rooms, furniture, prompt, photoBase64, planBase64, renderRoom,
        setStep: setRenderStep, label: "Render",
      });

      if (res) {
        setRenderStep(`✅ ${res.successful.length} render completados [${res.modeLabel}]`);
        onToast?.(`✅ ${res.successful.length} renders AI generados`);
        loadRenderHistory();
      }
      return "render";
    } catch (e) {
      const { toast, step } = parseRenderError(e);
      onToast?.(toast);
      setRenderStep(step);
      return "editor";
    } finally {
      setRendering(false);
    }
  }, [callRenderAI, onToast, loadRenderHistory]);

  // ── handleRenderStandalone — foto/prompt senza plano ──────────────────────
  const handleRenderStandalone = useCallback(async ({ rooms, prompt, photoBase64 }) => {
    if (!prompt.trim() && !photoBase64) {
      onToast?.("⚠️ Escribe un prompt o sube una foto");
      return;
    }
    setStandaloneRendering(true);
    setStandaloneResult(null);

    try {
      setStandaloneStep("Preparando render...");

      const res = await callRenderAI({
        rooms, furniture: [], prompt, photoBase64, planBase64: null, renderRoom: null,
        setStep: setStandaloneStep, label: "Render Rápido",
      });

      if (res?.successful?.[0]) {
        setStandaloneResult(res.successful[0].imageUrl);
        setStandaloneStep("✅ Render completado");
        onToast?.("✅ Render AI generado");
        loadRenderHistory();
      }
    } catch (e) {
      const { toast, step } = parseRenderError(e);
      onToast?.(toast);
      setStandaloneStep(step);
    } finally {
      setStandaloneRendering(false);
    }
  }, [callRenderAI, onToast, loadRenderHistory]);

  // ── handleCompareStyles — 4 varianti in parallelo ─────────────────────────
  // FIX: era sequenziale (for loop) + bug `functions` non definito.
  // Ora usa Promise.allSettled per parallelizzare e renderAIFn corretto.
  const handleCompareStyles = useCallback(async ({ rooms, furniture, prompt, photoBase64, renderRoom }) => {
    if (rooms.length === 0 && !photoBase64 && !prompt.trim()) {
      onToast?.("⚠️ Añade habitaciones, sube una foto o escribe un prompt");
      return;
    }
    setComparingStyles(true);
    setCompareMode(true);
    setCompareRenders([]);

    const roomsData = buildRoomsData(rooms, furniture, renderRoom);

    // Lancia 4 render in parallelo
    const promises = Array.from({ length: 4 }, (_, i) =>
      renderAIFn({
        rooms:       roomsData.slice(0, 1),
        style:       "",
        extraPrompt: prompt.trim(),
        photoBase64: photoBase64 || null,
        planBase64:  null,
        workspaceId,
        proyectoId,
      }).then(result => {
        const r = result.data?.renders?.[0];
        return {
          style: `variant_${i+1}`,
          label: `Variante ${i+1}`,
          imageUrl: r?.imageUrl || null,
        };
      }).catch(err => ({
        style: `variant_${i+1}`,
        label: `Variante ${i+1}`,
        imageUrl: null,
        error: err.message,
      }))
    );

    // Aggiorna UI man mano che arrivano
    const results = [];
    for (const p of promises) {
      const r = await p;
      results.push(r);
      setCompareRenders([...results]);
    }

    setComparingStyles(false);
  }, [buildRoomsData, renderAIFn, workspaceId, proyectoId, onToast]);

  return {
    // State
    renders, activeRender, renderImg, rendering, renderStep,
    quotaLeft, renderHistory, portadaSaved,
    standaloneRendering, standaloneResult, standaloneStep,
    compareMode, compareRenders, comparingStyles,
    promptPresets,
    // Setters (per i panel)
    setRenders, setActiveRender, setRenderImg, setRenderStep,
    setCompareMode, setCompareRenders,
    // Actions
    handleRender, handleRenderStandalone, handleCompareStyles,
    savePortada, applyWatermark, loadRenderHistory, loadPresets,
    savePreset, deletePreset,
  };
}
