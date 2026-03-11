// ─── hooks/useAnalytics.js ────────────────────────────────────────────────────
// Tracking eventi chiave per ottimizzare funnel Free → Pro
// Eventi tracciati:
//   - proyecto_created      → ogni volta che un utente crea un progetto
//   - pdf_generated         → ogni volta che viene generato un PDF
//   - pdf_shared_whatsapp   → PDF inviato via WhatsApp
//   - firma_requested       → firma digitale richiesta al cliente
//   - paywall_shown         → paywall visualizzato (quale feature ha bloccato)
//   - plan_upgraded         → utente clicca su un piano a pagamento
//   - trial_started         → nuovo workspace creato (trial iniziato)

import { useCallback } from "react";
import { logEvent } from "firebase/analytics";
import { analytics } from "../lib/firebase";

export function useAnalytics() {
  // Helper interno — logga solo se analytics è inizializzato
  const track = useCallback((eventName, params = {}) => {
    if (!analytics) return;
    try {
      logEvent(analytics, eventName, params);
    } catch (e) {
      // Mai bloccare l'app per un errore di analytics
      console.warn("[Analytics] logEvent error:", e);
    }
  }, []);

  // ── Progetti ──────────────────────────────────────────────────────────────
  const trackProyectoCreated = useCallback((plan, proyectoCount) => {
    track("proyecto_created", {
      plan,
      proyecto_count: proyectoCount,
    });
  }, [track]);

  // ── PDF ───────────────────────────────────────────────────────────────────
  const trackPdfGenerated = useCallback((plan, proyectoId) => {
    track("pdf_generated", {
      plan,
      proyecto_id: proyectoId ?? "unknown",
    });
  }, [track]);

  const trackPdfSharedWhatsapp = useCallback((plan) => {
    track("pdf_shared_whatsapp", { plan });
  }, [track]);

  // ── Firma digitale ────────────────────────────────────────────────────────
  const trackFirmaRequested = useCallback((plan) => {
    track("firma_requested", { plan });
  }, [track]);

  // ── Paywall ───────────────────────────────────────────────────────────────
  const trackPaywallShown = useCallback((feature, plan) => {
    track("paywall_shown", { feature, plan });
  }, [track]);

  // ── Upgrade ───────────────────────────────────────────────────────────────
  const trackPlanUpgradeClick = useCallback((targetPlan, currentPlan) => {
    track("plan_upgrade_click", {
      target_plan:  targetPlan,
      current_plan: currentPlan,
    });
  }, [track]);

  // ── Trial ─────────────────────────────────────────────────────────────────
  const trackTrialStarted = useCallback((workspaceId) => {
    track("trial_started", { workspace_id: workspaceId });
  }, [track]);

  return {
    trackProyectoCreated,
    trackPdfGenerated,
    trackPdfSharedWhatsapp,
    trackFirmaRequested,
    trackPaywallShown,
    trackPlanUpgradeClick,
    trackTrialStarted,
  };
}
