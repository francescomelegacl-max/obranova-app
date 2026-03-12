// ─── hooks/usePlan.js ─────────────────────────────────────────────────────────
// Regole e limiti per ogni piano. Unica fonte di verità per i paywall.
// v2 — 12 Marzo 2026
//
// LIMITI FREE (definitivi):
//   • 5 progetti totali — counter permanente, non si rinnova mai
//   • 15 partidas per progetto
//   • 20 voci listino prezzi
//   • 10 articoli bodega/magazzino
//   • 3 kits personalizzati salvati (kit predefiniti sempre disponibili)
//   • 5 calcoli salvati nel Calcolatore
//   • 30 giorni di storico visibile
//   • Watermark "Obra Nova" nel PDF esportato E nell'anteprima app
//   • WhatsApp automatico: disponibile (funnel di marketing)
//   • Export Excel, firma digitale, fatture, templates, agenda: bloccati
// ─────────────────────────────────────────────────────────────────────────────

// ── Definizione limiti per piano ──────────────────────────────────────────────
export const PLAN_LIMITS = {
  free: {
    // Progetti — counter PERMANENTE (non si azzera, non si rinnova)
    maxProyectos:       5,
    maxProyectosNote:   "permanente",   // usato nei messaggi UI

    // Contenuto per progetto
    maxPartidas:        15,             // righe max per preventivo

    // Listino prezzi
    maxListino:         20,             // voci max nel listino

    // Bodega / Magazzino
    maxBodega:          10,             // articoli max in magazzino

    // Kits
    maxKits:            3,              // kits personalizzati salvabili (predefiniti sempre visibili)

    // Calcolatore
    maxCalcoli:         5,              // calcoli rapidi salvabili

    // Storico
    historialDays:      30,             // giorni di storico visibili

    // PDF e visual
    pdfWatermark:       true,           // watermark nel PDF esportato
    appWatermark:       true,           // watermark nell'anteprima dentro l'app

    // Features bloccate
    exportExcel:        false,
    firma:              false,
    fatture:            false,
    templates:          false,
    agenda:             false,

    // Features disponibili nel Free
    whatsapp:           true,           // funnel di marketing
  },

  pro: {
    maxProyectos:       Infinity,
    maxProyectosNote:   "",
    maxPartidas:        Infinity,
    maxListino:         Infinity,
    maxBodega:          Infinity,
    maxKits:            Infinity,
    maxCalcoli:         Infinity,
    historialDays:      Infinity,
    pdfWatermark:       false,
    appWatermark:       false,
    exportExcel:        true,
    firma:              true,
    fatture:            true,
    templates:          true,
    agenda:             true,
    whatsapp:           true,
  },

  team: {
    maxProyectos:       Infinity,
    maxProyectosNote:   "",
    maxPartidas:        Infinity,
    maxListino:         Infinity,
    maxBodega:          Infinity,
    maxKits:            Infinity,
    maxCalcoli:         Infinity,
    historialDays:      Infinity,
    pdfWatermark:       false,
    appWatermark:       false,
    exportExcel:        true,
    firma:              true,
    fatture:            true,
    templates:          true,
    agenda:             true,
    whatsapp:           true,
  },
};

// ── Messaggi paywall per ogni feature ────────────────────────────────────────
// Usato da PaywallModal e da qualsiasi componente che mostra il blocco.
export const PAYWALL_FEATURES = {
  exportExcel: {
    title:  "Export Excel",
    desc:   "Exporta tus presupuestos a Excel con subtotales por categoría, IVA y márgenes.",
    icon:   "📊",
    plan:   "Pro",
  },
  firma: {
    title:  "Firma digital",
    desc:   "Envía un link al cliente para que firme el presupuesto digitalmente desde su celular.",
    icon:   "✍️",
    plan:   "Pro",
  },
  fatture: {
    title:  "Facturas",
    desc:   "Crea y gestiona facturas vinculadas a tus proyectos.",
    icon:   "🧾",
    plan:   "Pro",
  },
  templates: {
    title:  "Templates de presupuesto",
    desc:   "Guarda y reutiliza conjuntos de partidas para agilizar nuevos proyectos.",
    icon:   "📂",
    plan:   "Pro",
  },
  agenda: {
    title:  "Agenda",
    desc:   "Organiza tus proyectos en el calendario con recordatorios.",
    icon:   "📅",
    plan:   "Pro",
  },
  maxProyectos: {
    title:  "Límite de proyectos alcanzado",
    desc:   "El plan Free permite hasta 5 proyectos en total (sin renovación). Actualiza a Pro para proyectos ilimitados.",
    icon:   "📁",
    plan:   "Pro",
  },
  maxPartidas: {
    title:  "Límite de partidas alcanzado",
    desc:   "El plan Free permite hasta 15 partidas por proyecto. Actualiza a Pro para presupuestos ilimitados.",
    icon:   "📋",
    plan:   "Pro",
  },
  maxListino: {
    title:  "Límite de lista de precios alcanzado",
    desc:   "El plan Free permite hasta 20 ítems en tu lista de precios. Actualiza a Pro para un listín ilimitado.",
    icon:   "💰",
    plan:   "Pro",
  },
  maxBodega: {
    title:  "Límite de bodega alcanzado",
    desc:   "El plan Free permite hasta 10 artículos en bodega. Actualiza a Pro para gestión ilimitada.",
    icon:   "🏭",
    plan:   "Pro",
  },
  maxKits: {
    title:  "Límite de kits personalizados alcanzado",
    desc:   "El plan Free permite hasta 3 kits propios. Los kits predefinidos siempre están disponibles. Actualiza a Pro para kits ilimitados.",
    icon:   "📦",
    plan:   "Pro",
  },
  maxCalcoli: {
    title:  "Límite de cálculos guardados alcanzado",
    desc:   "El plan Free permite guardar hasta 5 cálculos rápidos. Actualiza a Pro para guardar sin límite.",
    icon:   "🧮",
    plan:   "Pro",
  },
};

// ── Hook principale ───────────────────────────────────────────────────────────
//
// USO:
//   const plan = usePlan({ workspace }, proyectos);
//
//   // Controlla feature booleane (export, firma, ecc.)
//   plan.canUse("exportExcel")  → true/false
//
//   // Controlla limiti numerici
//   plan.canAdd("partidas", currentCount)   → true/false
//   plan.remaining("partidas", currentCount) → numero rimanente (o Infinity)
//
//   // Watermark
//   plan.limits.pdfWatermark   → true/false (per il generatore PDF)
//   plan.limits.appWatermark   → true/false (per l'anteprima nell'app)
//
export function usePlan({ workspace } = {}, proyectos = []) {
  const rawPlan    = workspace?.plan      || "free";
  const trialEndsAt = workspace?.trialEndsAt || null;

  // Trial Pro: se trialEndsAt è nel futuro, tratta come pro
  const isTrialActive = trialEndsAt && new Date(trialEndsAt) > new Date();
  const plan   = isTrialActive ? "pro" : rawPlan;
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  const isPro  = plan === "pro" || plan === "team";

  // Giorni rimasti nel trial
  const trialDaysLeft = isTrialActive
    ? Math.ceil((new Date(trialEndsAt) - new Date()) / 86400000)
    : 0;

  // Conta TUTTI i progetti (il limite Free è permanente — non esclude Finalizado)
  // NOTA: cambiato da activeProyectos a totalProyectos per il Free.
  // Pro resta su "attivi" (nessun limite comunque).
  const totalProyectos = proyectos.length;
  const activeProyectos = proyectos.filter(
    p => !["Finalizado", "Rechazado"].includes(p.estado)
  );

  // ── Controlla feature booleane ─────────────────────────────────────────────
  // Es: canUse("exportExcel"), canUse("firma"), canUse("whatsapp")
  const canUse = (feature) => {
    if (isPro) return true;
    const val = limits[feature];
    return val !== false && val !== 0;
  };

  // ── Controlla limiti numerici ──────────────────────────────────────────────
  // feature: "proyectos" | "partidas" | "listino" | "bodega" | "kits" | "calcoli"
  // currentCount: numero attuale di elementi
  const LIMIT_MAP = {
    proyectos: "maxProyectos",
    partidas:  "maxPartidas",
    listino:   "maxListino",
    bodega:    "maxBodega",
    kits:      "maxKits",
    calcoli:   "maxCalcoli",
  };

  const canAdd = (feature, currentCount) => {
    if (isPro) return true;
    const limitKey = LIMIT_MAP[feature];
    if (!limitKey) return true;
    return currentCount < limits[limitKey];
  };

  const remaining = (feature, currentCount) => {
    if (isPro) return Infinity;
    const limitKey = LIMIT_MAP[feature];
    if (!limitKey) return Infinity;
    return Math.max(0, limits[limitKey] - currentCount);
  };

  // ── Controlla se può creare un nuovo progetto ──────────────────────────────
  // Free: limite sul totale (permanente). Pro: sempre sì.
  const canCreateProyecto = () => canAdd("proyectos", totalProyectos);

  // Quanti progetti rimangono nel Free
  const proyectosRestantes = isPro
    ? Infinity
    : remaining("proyectos", totalProyectos);

  // ── Filtra storico per piano ───────────────────────────────────────────────
  // Usa questa funzione per filtrare array di eventi/movimenti per data.
  // Es: filterByHistorial(movimenti, item => item.fecha)
  const filterByHistorial = (items, getDate) => {
    if (isPro || limits.historialDays === Infinity) return items;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - limits.historialDays);
    return items.filter(item => {
      const d = new Date(getDate(item));
      return !isNaN(d) && d >= cutoff;
    });
  };

  return {
    plan,
    rawPlan,
    isPro,
    limits,

    // Feature booleane
    canPlan: canUse,   // alias retrocompatibile
    canUse,

    // Limiti numerici
    canAdd,
    remaining,

    // Progetti
    canCreateProyecto,
    proyectosRestantes,
    totalCount:  totalProyectos,
    activeCount: activeProyectos.length,

    // Storico
    filterByHistorial,

    // Trial
    isTrialActive,
    trialDaysLeft,
  };
}

// Nota: il watermark visivo nell'app è implementato direttamente in OtherTabs.jsx
// tramite plan.limits.appWatermark — nessun componente da importare.
