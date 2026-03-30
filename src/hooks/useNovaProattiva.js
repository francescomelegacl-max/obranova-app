// ─── hooks/useNovaProattiva.js ────────────────────────────────────────────────
// Motore suggerimenti proattivi per Nova.
// Principi:
//   • Non invasivo: max 1 suggerimento attivo, delay 3s, snooze 30min dopo dismiss
//   • Silenzioso: niente se Nova è aperta o l'utente sta già chattando
//   • Contestuale: ogni tab/stato ha suggerimenti diversi e rilevanti
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from "react";

const SNOOZE_KEY = "nova_proattiva_snooze";
const SNOOZE_MS  = 30 * 60 * 1000; // 30 min
const DELAY_MS   = 3000;           // 3s delay prima di mostrare

function calcMargine(proyState) {
  if (!proyState?.partidas?.length) return null;
  const pct = proyState.pct || {};
  return (parseFloat(pct.utilidad ?? 0) + parseFloat(pct.ci ?? 0) + parseFloat(pct.gf ?? 0));
}

function giorniDa(dateStr) {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function calcolaSuggerimento({ activeTab, proyState, currentId, clientes, plan, novaProfile }) {
  const isPro     = plan === "pro" || plan === "empresa";
  const isEmpresa = plan === "empresa";
  const margine   = calcMargine(proyState);
  const nPartidas = proyState?.partidas?.length || 0;
  const stato     = proyState?.estado;
  const giorni    = giorniDa(proyState?.updatedAt);

  // ── Benchmark: confronta prezzi con storico costruttore ──────────────────
  // Se il profilo Nova ha prezzi medi e il progetto corrente ha partidas,
  // segnala partidas con prezzo molto diverso dal solito
  if (activeTab === "costos" && currentId && nPartidas >= 3 && novaProfile?.preciosMedios) {
    const partidas = proyState?.partidas || [];
    const preciosMedios = novaProfile.preciosMedios;
    // Cerca partidas con prezzo >30% diverso dal solito
    for (const p of partidas) {
      if (!p.cat || !p.pu || p.pu <= 0) continue;
      const mediaSolita = preciosMedios[p.cat];
      if (!mediaSolita || mediaSolita <= 0) continue;
      const diff = ((p.pu - mediaSolita) / mediaSolita) * 100;
      if (diff < -30) {
        return {
          id: "benchmark_bajo", emoji: "📉", urgenza: "warn",
          testo: `"${p.nombre}" está un ${Math.abs(Math.round(diff))}% bajo tu precio habitual en ${p.cat}.`,
          cta: "¿Es correcto?",
          msg: `La partida "${p.nombre}" tiene un precio de $${p.pu.toLocaleString("es-CL")} pero mi promedio en ${p.cat} es $${mediaSolita.toLocaleString("es-CL")}. ¿Debería ajustarlo? ¿Cuál es el precio de mercado actual?`,
        };
      }
      if (diff > 40) {
        return {
          id: "benchmark_alto", emoji: "💰", urgenza: "info",
          testo: `"${p.nombre}" está un ${Math.round(diff)}% sobre tu precio habitual en ${p.cat}.`,
          cta: "¿Estoy cobrando de más?",
          msg: `La partida "${p.nombre}" tiene un precio de $${p.pu.toLocaleString("es-CL")} pero mi promedio en ${p.cat} es $${mediaSolita.toLocaleString("es-CL")}. ¿Es competitivo o debería ajustarlo?`,
        };
      }
    }
  }

  // ── Benchmark: tasso chiusura basso ─────────────────────────────────────
  if (activeTab === "dashboard" && novaProfile?.tasaCierre > 0 && novaProfile.tasaCierre < 20 && novaProfile.totalProyectos >= 5) {
    return {
      id: "tasa_cierre_baja", emoji: "📊", urgenza: "warn",
      testo: `Tu tasa de cierre es del ${novaProfile.tasaCierre}% — el promedio del sector es 30-40%.`,
      cta: "¿Cómo la mejoro?",
      msg: `Mi tasa de cierre es del ${novaProfile.tasaCierre}% (${novaProfile.totalProyectos} proyectos). ¿Qué estrategias puedo usar para mejorarla? ¿Debería agregar renders AI a mis presupuestos?`,
    };
  }

  // ── Analisi automatica al caricamento progetto ──────────────────────────
  // Quando l'utente apre un progetto con partidas, Nova segnala il punto più importante
  if (activeTab === "proyecto" && currentId && nPartidas >= 3 && margine !== null) {
    // Identifica il problema più critico
    const cats = [...new Set((proyState?.partidas || []).map(p => p.cat).filter(Boolean))];
    const hasBaños = cats.includes("Baños");
    const hasInstalaciones = cats.includes("Instalaciones");

    // Margine troppo basso — priorità massima
    if (margine < 12)
      return {
        id: "analisi_margine_critico", emoji: "🚨", urgenza: "warn",
        testo: `Margen del ${Math.round(margine)}% — muy bajo. Riesgo de pérdida.`,
        cta: "Analizar ahora",
        msg: `Analiza este presupuesto completo. El margen es del ${Math.round(margine)}%. Dime qué partidas tienen precios bajos y cómo puedo mejorar el margen sin perder al cliente.`,
      };

    // Categorías típicas faltantes
    if (nPartidas >= 5 && !hasInstalaciones)
      return {
        id: "analisi_cat_faltante", emoji: "⚠️", urgenza: "warn",
        testo: "No hay partidas de Instalaciones — ¿falta gasfitería o electricidad?",
        cta: "¿Qué me falta?",
        msg: `Este presupuesto tiene ${nPartidas} partidas en ${cats.join(", ")} pero no tiene Instalaciones. ¿Qué partidas de gasfitería y electricidad debería agregar?`,
      };

    // Presupuesto listo — suggerir render + invio
    if (margine >= 15 && stato === "borrador" && nPartidas >= 5)
      return {
        id: "analisi_listo", emoji: "✅", urgenza: "info",
        testo: `${nPartidas} partidas, margen ${Math.round(margine)}% — listo para enviar.`,
        cta: "¿Cómo lo mejoro aún más?",
        msg: `Este presupuesto tiene ${nPartidas} partidas con un margen del ${Math.round(margine)}%. ¿Está competitivo? ¿Debería agregar un render AI antes de enviarlo al cliente?`,
      };
  }

  // Costos: margine sotto soglia
  if (activeTab === "costos" && currentId && margine !== null && margine < 15)
    return {
      id: "margine_basso", emoji: "📉", urgenza: "warn",
      testo: `El margen total es del ${Math.round(margine)}% — bajo el 15% recomendado.`,
      cta: "¿Cómo lo mejoro?",
      msg: `Mi margen total es del ${Math.round(margine)}%. Dame recomendaciones concretas para mejorarlo sin perder el cliente.`,
    };

  // Costos: sin partidas
  if (activeTab === "costos" && currentId && nPartidas === 0)
    return {
      id: "sin_partidas", emoji: "🏗️", urgenza: "info",
      testo: "Este presupuesto no tiene partidas aún.",
      cta: "Generar con Nova",
      action: "genera",
      msg: null,
    };

  // Proyecto: borrador viejo
  if (activeTab === "proyecto" && currentId && stato === "borrador" && giorni !== null && giorni >= 7)
    return {
      id: "borrador_viejo", emoji: "⏰", urgenza: "warn",
      testo: `Lleva ${giorni} días como borrador sin enviarse.`,
      cta: "¿Qué hago?",
      msg: `Este presupuesto lleva ${giorni} días como borrador. ¿Qué me recomiendas para cerrarlo?`,
    };

  // Proyecto: enviado sin respuesta
  if (activeTab === "proyecto" && currentId && stato === "enviado" && giorni !== null && giorni >= 5)
    return {
      id: "enviado_sin_respuesta", emoji: "📬", urgenza: "warn",
      testo: `El cliente lleva ${giorni} días sin responder.`,
      cta: "Estrategia de seguimiento",
      msg: `Envié el presupuesto hace ${giorni} días sin respuesta. ¿Qué estrategia de seguimiento recomiendas?`,
    };

  // Proyecto: cliente sta guardando il presupuesto (visite recenti)
  const visitasCount = proyState?.visitasCount || 0;
  const lastVisita = proyState?.lastVisitaAt;
  const visitaRecente = lastVisita && giorniDa(lastVisita) !== null && giorniDa(lastVisita) <= 2;
  if (activeTab === "proyecto" && currentId && stato === "enviado" && visitasCount >= 3 && visitaRecente)
    return {
      id: "cliente_interesado", emoji: "🔥", urgenza: "warn",
      testo: `El cliente ha visto el presupuesto ${visitasCount} veces — está interesado.`,
      cta: "¿Cómo lo cierro?",
      msg: `El cliente ha abierto el presupuesto ${visitasCount} veces en los últimos días. ¿Cuál es la mejor estrategia para cerrar ahora? ¿Debería ofrecer un descuento o llamar directamente?`,
    };

  // Proyecto: cliente vio el presupuesto por primera vez
  if (activeTab === "proyecto" && currentId && stato === "enviado" && visitasCount === 1 && visitaRecente)
    return {
      id: "primera_visita", emoji: "👁️", urgenza: "info",
      testo: "El cliente acaba de ver el presupuesto por primera vez.",
      cta: "¿Qué hago ahora?",
      msg: "El cliente acaba de abrir el presupuesto por primera vez. ¿Debería esperar o hacer un seguimiento proactivo?",
    };

  // Clientes: follow-up pendientes
  if (activeTab === "clientes" && isEmpresa) {
    const pending = (clientes || []).filter(c =>
      c.proximoContacto && new Date(c.proximoContacto) <= new Date()
    ).length;
    if (pending > 0)
      return {
        id: "followup_pendiente", emoji: "📋", urgenza: "warn",
        testo: `${pending} cliente${pending > 1 ? "s" : ""} con follow-up vencido.`,
        cta: "¿Cómo los reactivo?",
        msg: `Tengo ${pending} cliente(s) con follow-up vencido. Dame una estrategia rápida para reactivarlos.`,
      };
  }

  // Resumen: suggerisce render
  if (activeTab === "resumen" && currentId && isPro && nPartidas > 0)
    return {
      id: "sugerir_render", emoji: "🎨", urgenza: "info",
      testo: "Un render AI puede aumentar el cierre hasta un 40%.",
      cta: "Generar render",
      msg: "Dame un prompt detallado para un render fotorrealista de este proyecto que pueda impresionar al cliente.",
    };

  // Resumen: presupuesto sin PDF generato
  if (activeTab === "resumen" && currentId && nPartidas > 3 && stato === "borrador")
    return {
      id: "enviar_presupuesto", emoji: "📤", urgenza: "info",
      testo: "El presupuesto tiene " + nPartidas + " partidas listas. ¿Lo enviamos?",
      cta: "¿Cómo lo envío?",
      msg: "Tengo un presupuesto con " + nPartidas + " partidas listo. ¿Cómo lo envío al cliente con firma digital?",
    };

  // Diseno: prompt ottimizzato
  if (activeTab === "diseno" && isPro)
    return {
      id: "render_prompt", emoji: "💡", urgenza: "info",
      testo: "Describe materiales, colores y estilo para un render perfecto.",
      cta: "Ayúdame con el prompt",
      msg: "Sugiéreme un prompt detallado en español para un render fotorrealista de este proyecto. Quiero incluir materiales, colores e iluminación.",
    };

  // Costos: margine alto (possibile upselling)
  if (activeTab === "costos" && currentId && margine !== null && margine > 35)
    return {
      id: "margine_alto", emoji: "💰", urgenza: "info",
      testo: `El margen del ${Math.round(margine)}% es alto — ¿estás seguro que es competitivo?`,
      cta: "¿Es buen precio?",
      msg: `Mi margen total es del ${Math.round(margine)}%. ¿Es competitivo para el mercado chileno o estoy cobrando de más?`,
    };

  // Fatture: progetto accettato senza fattura
  if (activeTab === "facturas" && currentId && stato === "aceptado")
    return {
      id: "factura_pendiente", emoji: "🧾", urgenza: "warn",
      testo: "El proyecto fue aceptado — ¿ya emitiste la factura?",
      cta: "¿Cómo facturo?",
      msg: "El cliente aceptó el presupuesto. ¿Cómo emito la factura y la envío al SII?",
    };

  // Dashboard: benvenuto
  if (activeTab === "dashboard" && !currentId)
    return {
      id: "bienvenida", emoji: "👋", urgenza: "info",
      testo: "¿Necesitas ayuda para crear tu primer presupuesto?",
      cta: "Guíame",
      msg: "¿Cómo creo un presupuesto profesional desde cero en ObraNova?",
    };

  // Kits: suggerire kits se non ne ha
  if (activeTab === "kits" && isPro)
    return {
      id: "crear_kit", emoji: "📦", urgenza: "info",
      testo: "Los kits te ahorran tiempo en presupuestos repetitivos.",
      cta: "¿Cómo creo un kit?",
      msg: "¿Cómo creo un kit de partidas reutilizable para presupuestos similares?",
    };

  return null;
}

export function useNovaProattiva({
  activeTab, proyState, currentId, clientes, plan, novaOpen, novaProfile,
} = {}) {
  const [suggerimento, setSuggerimento] = useState(null);
  const timerRef   = useRef(null);
  const prevTabRef = useRef(null);

  const isSnooze = useCallback(() => {
    try {
      const val = sessionStorage.getItem(SNOOZE_KEY);
      return val ? Date.now() < parseInt(val, 10) : false;
    } catch { return false; }
  }, []);

  const dismiss = useCallback(() => {
    try { sessionStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS)); } catch {}
    setSuggerimento(null);
  }, []);

  useEffect(() => {
    if (novaOpen || isSnooze()) { setSuggerimento(null); return; }

    // Tab cambiato → reset
    if (prevTabRef.current !== activeTab) {
      prevTabRef.current = activeTab;
      setSuggerimento(null);
      clearTimeout(timerRef.current);
    }

    const s = calcolaSuggerimento({ activeTab, proyState, currentId, clientes, plan, novaProfile });
    if (!s) { setSuggerimento(null); return; }

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (!novaOpen && !isSnooze()) setSuggerimento(s);
    }, DELAY_MS);

    return () => clearTimeout(timerRef.current);
  }, [
    activeTab, currentId,
    proyState?.estado, proyState?.partidas?.length,
    proyState?.pct?.utilidad, proyState?.updatedAt,
    novaOpen, plan, novaProfile,
  ]);

  useEffect(() => { if (novaOpen) setSuggerimento(null); }, [novaOpen]);

  return { suggerimento, dismiss };
}
