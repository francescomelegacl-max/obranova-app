// ─── hooks/usePlan.js ─────────────────────────────────────────────────────────
// Regole e limiti per ogni piano. Unica fonte di verità per i paywall.
// Usato da App.jsx e da qualsiasi componente che deve controllare i limiti.

// ── Definizione limiti per piano ──────────────────────────────────────────────
export const PLAN_LIMITS = {
  free: {
    maxProyectos:   3,       // max progetti attivi (non Finalizado/Rechazado)
    historialDays:  60,      // giorni di storico visibili
    pdfWatermark:   true,    // watermark "Obra Nova" nel PDF
    exportExcel:    false,   // export Excel disabilitato
    firma:          false,   // firma digitale disabilitata
    fatture:        false,   // fatture disabilitate
    templates:      false,   // templates disabilitati
    agenda:         false,   // agenda disabilitata
  },
  pro: {
    maxProyectos:   Infinity,
    historialDays:  Infinity,
    pdfWatermark:   false,
    exportExcel:    true,
    firma:          true,
    fatture:        true,
    templates:      true,
    agenda:         true,
  },
  team: {
    maxProyectos:   Infinity,
    historialDays:  Infinity,
    pdfWatermark:   false,
    exportExcel:    true,
    firma:          true,
    fatture:        true,
    templates:      true,
    agenda:         true,
  },
};

// Features bloccate nel Free con messaggio e tab di upgrade
export const PAYWALL_FEATURES = {
  exportExcel: {
    title:    "Export Excel",
    desc:     "Exporta tus presupuestos a Excel con subtotales por categoría, IVA y márgenes.",
    icon:     "📊",
    plan:     "Pro",
  },
  firma: {
    title:    "Firma digital",
    desc:     "Envía un link al cliente para que firme el presupuesto digitalmente desde su celular.",
    icon:     "✍️",
    plan:     "Pro",
  },
  fatture: {
    title:    "Facturas",
    desc:     "Crea y gestiona facturas vinculadas a tus proyectos.",
    icon:     "🧾",
    plan:     "Pro",
  },
  templates: {
    title:    "Templates de presupuesto",
    desc:     "Guarda y reutiliza conjuntos de partidas para agilizar nuevos proyectos.",
    icon:     "📂",
    plan:     "Pro",
  },
  agenda: {
    title:    "Agenda",
    desc:     "Organiza tus proyectos en el calendario con recordatorios.",
    icon:     "📅",
    plan:     "Pro",
  },
  maxProyectos: {
    title:    "Límite de proyectos alcanzado",
    desc:     "El plan Free permite hasta 3 proyectos activos. Actualiza a Pro para proyectos ilimitados.",
    icon:     "📁",
    plan:     "Pro",
  },
};

// ── Hook principale ───────────────────────────────────────────────────────────
export function usePlan({ workspace } = {}, proyectos = []) {
  const plan   = workspace?.plan || "free";
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  const isPro  = plan === "pro" || plan === "team";

  // Conta solo progetti "attivi" (non terminati/rifiutati)
  const activeProyectos = proyectos.filter(
    p => !["Finalizado", "Rechazado"].includes(p.estado)
  );

  // Controlla se una feature è disponibile nel piano corrente
  const canUse = (feature) => {
    if (isPro) return true;
    return limits[feature] !== false && limits[feature] !== 0;
  };

  // Controlla se può creare un nuovo progetto
  const canCreateProyecto = () => {
    if (isPro) return true;
    return activeProyectos.length < limits.maxProyectos;
  };

  // Quanti progetti rimangono nel Free
  const proyectosRestantes = isPro
    ? Infinity
    : Math.max(0, limits.maxProyectos - activeProyectos.length);

  return {
    plan,
    isPro,
    limits,
    canPlan: canUse,
    canUse,
    canCreateProyecto,
    proyectosRestantes,
    activeCount: activeProyectos.length,
  };
}
