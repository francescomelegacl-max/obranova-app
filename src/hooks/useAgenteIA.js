// ─── hooks/useAgenteIA.js ─────────────────────────────────────────────────────
import { useState, useCallback } from "react";
import { doc as fbDoc, setDoc as fbSetDoc } from "firebase/firestore";
import { db as fbDb } from "../lib/firebase";

const FUNCTIONS_URL = "https://southamerica-west1-obra-nova-spa.cloudfunctions.net/agenteIA";

function calcTotal(partidas, pct) {
  if (!Array.isArray(partidas)) return 0;
  const subtotal = partidas.reduce((s, p) => {
    const pu   = parseFloat(p?.pu   ?? 0);
    const cant = parseFloat(p?.cant ?? 1);
    const desc = parseFloat(p?.desc ?? 0);
    return s + pu * cant * (1 - desc / 100);
  }, 0);
  if (!pct) return subtotal;
  const ci          = subtotal * (parseFloat(pct.ci          ?? 0) / 100);
  const gf          = subtotal * (parseFloat(pct.gf          ?? 0) / 100);
  const imprevistos = subtotal * (parseFloat(pct.imprevistos ?? 0) / 100);
  const utilidad    = subtotal * (parseFloat(pct.utilidad    ?? 0) / 100);
  return subtotal + ci + gf + imprevistos + utilidad;
}

// ── Parser JSON partidas dalla risposta testuale ──────────────────────────────
// Estrae il primo blocco ```json [...] ``` dalla risposta di Nova
function extractPartidas(text) {
  if (!text) return null;
  // Prova blocco ```json ... ```
  const blockMatch = text.match(/```json\s*([\s\S]*?)```/i);
  if (blockMatch) {
    try {
      const parsed = JSON.parse(blockMatch[1].trim());
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch { /* continua */ }
  }
  // Prova array JSON diretto nel testo (fallback)
  const arrayMatch = text.match(/(\[\s*\{[\s\S]*?\}\s*\])/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[1]);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch { /* niente */ }
  }
  return null;
}

// Normalizza una partida proveniente dall'AI verso il formato app
function normalizePartida(p) {
  return {
    nombre:    String(p.nombre    || "Partida sin nombre").trim(),
    cat:       String(p.cat       || "Terminaciones").trim(),
    unidad:    String(p.unidad    || "gl").trim(),
    cant:      parseFloat(p.cant  ?? 1)  || 1,
    pu:        parseFloat(p.pu    ?? 0)  || 0,
    nota:      String(p.nota      || "").trim(),
    proveedor: "",
  };
}

export function useAgenteIA({ workspace, proyState, activeTab, user, novaProfile } = {}) {
  // onInsertPartidas viene passato come prop ad AgenteIA dal JSX — non all'hook
  const [messages,         setMessages]         = useState([]);
  const [loading,          setLoading]          = useState(false);
  const [open,             setOpen]             = useState(false);
  const [pendingPartidas,  setPendingPartidas]  = useState(null);
  const [novaLimitReached, setNovaLimitReached] = useState(false);
  const [novaLimitInfo,    setNovaLimitInfo]    = useState(null);

  // novaCredits: crediti extra acquistati — letti direttamente dal workspace
  const novaCredits = workspace?.novaCredits || 0;

  const buildContext = useCallback(() => {
    const partidas = Array.isArray(proyState?.partidas)
      ? proyState.partidas.filter(p => p?.nombre)
      : [];
    const pct   = proyState?.pct  || {};
    const info  = proyState?.info || {};
    const total = calcTotal(partidas, pct);

    const cats = [...new Set(partidas.map(p => p.cat).filter(Boolean))];
    const resumenPartidas = cats.map(cat => {
      const items    = partidas.filter(p => p.cat === cat);
      const subtotal = items.reduce((s, p) => s + (parseFloat(p.pu ?? 0) * parseFloat(p.cant ?? 1)), 0);
      return "  - " + cat + ": " + items.length + " partidas, subtotal $" + subtotal.toLocaleString("es-CL");
    }).join("\n");

    // Dettaglio partidas per /genera (così Nova non duplica)
    const partidasDetalle = partidas.length > 0
      ? partidas.slice(0, 20).map(p => `  - ${p.nombre} (${p.cat}) ${p.cant} ${p.unidad} x $${(p.pu||0).toLocaleString("es-CL")}`).join("\n")
      : "";

    // ── Nova Profile: storico costruttore per personalizzazione ──────────
    let profileBlock = "";
    if (novaProfile && novaProfile.totalProyectos > 0) {
      const p = novaProfile;
      const lines = [
        `Margen promedio: ${p.margenMedio}%`,
        `Categorías frecuentes: ${(p.categoriasFrecuentes || []).join(", ")}`,
        p.preciosMedios ? `Precios habituales: ${Object.entries(p.preciosMedios).map(([cat, precio]) => `${cat} $${precio.toLocaleString("es-CL")}/avg`).join(", ")}` : "",
        `Proyectos: ${p.totalProyectos} total, tasa cierre ${p.tasaCierre}%`,
      ];
      // Livello 2: learning data
      if (p.tipoFrecuente?.length) lines.push(`Tipo de obra frecuente: ${p.tipoFrecuente.join(", ")}`);
      if (p.presupuestoMedio > 0) lines.push(`Presupuesto promedio: $${p.presupuestoMedio.toLocaleString("es-CL")} CLP`);
      if (p.tiempoMedioInvio != null) lines.push(`Tiempo promedio creación→envío: ${p.tiempoMedioInvio} días`);
      if (p.conRender > 0) lines.push(`Usa Render AI: sí (${p.conRender} proyectos con render)`);
      if (p.condPagoFrecuente) lines.push(`Condición de pago frecuente: ${p.condPagoFrecuente}`);
      profileBlock = lines.filter(Boolean).join(" | ");
    }

    return {
      workspace:       workspace?.name   || "Sin nombre",
      plan:            workspace?.plan   || "free",
      tab:             activeTab         || "dashboard",
      cliente:         info.cliente      || "",
      descripcion:     info.descripcion  || "",
      estado:          proyState?.estado || "",
      total,
      totalFmt:        total > 0 ? "$" + Math.round(total).toLocaleString("es-CL") + " CLP" : "—",
      nPartidas:       partidas.length,
      resumenPartidas,
      partidasDetalle,
      profileBlock,
      pct,
      condPago:        proyState?.condPago || "",
      validez:         proyState?.validez  || 30,
    };
  }, [workspace, proyState, activeTab]);

  const sendMessage = useCallback(async (texto) => {
    if (!texto?.trim() || loading) return;

    const textoTrim  = texto.trim();
    const isGenera      = textoTrim.toLowerCase().startsWith("/genera");
    const isCotiza      = textoTrim.toLowerCase().startsWith("/cotiza");
    const isCronograma  = textoTrim.toLowerCase().startsWith("/cronograma");

    const userMsg    = { role: "user", content: textoTrim, ts: Date.now() };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setLoading(true);
    setPendingPartidas(null); // reset partidas precedenti

    try {
      const ctx = buildContext();
      const res = await fetch(FUNCTIONS_URL, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          messages: newHistory.map(m => ({ role: m.role, content: m.content })),
          context:  ctx,
          userId:   user?.uid     || "",
          wsId:     workspace?.id || "",
          isGenera,                          // ← flag per /genera
          isCotiza,                          // ← flag per /cotiza
          isCronograma,                      // ← flag per /cronograma
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Error del servidor");

      // ── Limite Nova raggiunto ─────────────────────────────────────────
      if (json.novaLimitReached) {
        setNovaLimitReached(true);
        setNovaLimitInfo({
          plan:       json.plan,
          used:       json.used,
          limit:      json.limit,
          upsellType: json.upsellType,
        });
        setMessages(prev => prev.slice(0, -1)); // rimuovi messaggio utente pendente
        setLoading(false);
        return;
      }

      const responseText = json.response || "No pude generar una respuesta.";

      // ── Se era un /genera o /cotiza, estrai il JSON partidas ──────────
      let extracted = null;
      if (isGenera || isCotiza) {
        extracted = extractPartidas(responseText);
        if (extracted) {
          const normalized = extracted.map(normalizePartida);
          setPendingPartidas(normalized);
        }
      }

      // ── Se era un /cronograma, estrai il JSON tasks ───────────────────
      let cronogramaExtracted = null;
      if (isCronograma) {
        cronogramaExtracted = extractPartidas(responseText); // stesso parser JSON
      }

      setMessages(prev => [...prev, {
        role:            "assistant",
        content:         responseText,
        ts:              Date.now(),
        isGenera,
        hasPartidas:     !!extracted,
        isCronograma,
        cronogramaTasks: cronogramaExtracted,
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role:    "assistant",
        content: "Lo siento, hubo un error: " + err.message,
        ts:      Date.now(),
        error:   true,
      }]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading, buildContext, user, workspace]);

  const dismissPartidas = useCallback(() => {
    // Track: l'utente ha rifiutato le partidas generate — Nova impara
    if (pendingPartidas?.length && workspace?.id) {
      fbSetDoc(fbDoc(fbDb, `workspaces/${workspace.id}/novaProfile`, "learning"), {
        lastDismissedAt: new Date().toISOString(),
        dismissCount: (novaProfile?.dismissCount || 0) + 1,
      }, { merge: true }).catch(() => {});
    }
    setPendingPartidas(null);
  }, [pendingPartidas, workspace, novaProfile]);

  // Track: l'utente ha accettato le partidas generate
  const trackAcceptPartidas = useCallback((count) => {
    if (workspace?.id) {
      fbSetDoc(fbDoc(fbDb, `workspaces/${workspace.id}/novaProfile`, "learning"), {
        lastAcceptedAt: new Date().toISOString(),
        acceptCount: (novaProfile?.acceptCount || 0) + 1,
        totalPartidasAccepted: (novaProfile?.totalPartidasAccepted || 0) + count,
      }, { merge: true }).catch(() => {});
    }
  }, [workspace, novaProfile]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setPendingPartidas(null);
  }, []);

  return {
    messages, loading, open, setOpen,
    sendMessage, clearMessages,
    pendingPartidas, setPendingPartidas, dismissPartidas,
    trackAcceptPartidas,
    novaLimitReached, setNovaLimitReached, novaLimitInfo,
    novaCredits,
  };
  // Nota: cronogramaTasks è dentro ogni messaggio con isCronograma:true
}
