// ─── hooks/useAnalytics.js ────────────────────────────────────────────────────
import { useCallback } from "react";
import { logEvent } from "firebase/analytics";
import { getAnalyticsInstance } from "../lib/firebase";

export function useAnalytics() {
  const track = useCallback((eventName, params = {}) => {
    const analytics = getAnalyticsInstance();
    if (!analytics) return;
    try {
      logEvent(analytics, eventName, params);
    } catch (e) {
      console.warn("[Analytics] logEvent error:", e);
    }
  }, []);

  const trackProyectoCreated = useCallback((plan, proyectoCount) => {
    track("proyecto_created", { plan, proyecto_count: proyectoCount });
  }, [track]);

  const trackPdfGenerated = useCallback((plan, proyectoId) => {
    track("pdf_generated", { plan, proyecto_id: proyectoId ?? "unknown" });
  }, [track]);

  const trackPdfSharedWhatsapp = useCallback((plan) => {
    track("pdf_shared_whatsapp", { plan });
  }, [track]);

  const trackFirmaRequested = useCallback((plan) => {
    track("firma_requested", { plan });
  }, [track]);

  const trackPaywallShown = useCallback((feature, plan) => {
    track("paywall_shown", { feature, plan });
  }, [track]);

  const trackPlanUpgradeClick = useCallback((targetPlan, currentPlan) => {
    track("plan_upgrade_click", { target_plan: targetPlan, current_plan: currentPlan });
  }, [track]);

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
