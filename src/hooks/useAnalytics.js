// ─── hooks/useAnalytics.js ────────────────────────────────────────────────────
import { logEvent, setUserProperties } from "firebase/analytics";
import { useCallback } from "react";
import { getAnalyticsInstance } from "../lib/firebase";

// Helper — chiama analytics solo se disponibile
function safeLog(eventName, params = {}) {
  try {
    const analytics = getAnalyticsInstance();
    if (!analytics) return;
    logEvent(analytics, eventName, params);
  } catch (e) {
    // Analytics bloccato da adblocker — silent fail
  }
}

export function useAnalytics() {

  // ── Utente ────────────────────────────────────────────────────────────────
  const trackUserPlan = useCallback((plan, isTrialActive) => {
    try {
      const analytics = getAnalyticsInstance();
      if (!analytics) return;
      setUserProperties(analytics, {
        plan,
        trial_active: isTrialActive ? "yes" : "no",
      });
    } catch (e) {}
  }, []);

  // ── Progetti ──────────────────────────────────────────────────────────────
  const trackProjectCreated = useCallback((plan, totalProyectos) => {
    safeLog("proyecto_created", { plan, total_proyectos: totalProyectos });
  }, []);

  const trackPaywallHit = useCallback((reason) => {
    safeLog("paywall_hit", { reason });
  }, []);

  // ── PDF ───────────────────────────────────────────────────────────────────
  const trackPdfGenerated = useCallback((plan, pdfCountThisMonth) => {
    safeLog("pdf_generated", { plan, pdf_count_month: pdfCountThisMonth });
  }, []);

  const trackPdfSharedWhatsapp = useCallback((plan) => {
    safeLog("pdf_shared_whatsapp", { plan });
  }, []);

  // ── Firma digitale ────────────────────────────────────────────────────────
  const trackFirmaRequested = useCallback((plan) => {
    safeLog("firma_requested", { plan });
  }, []);

  const trackFirmaCompleted = useCallback(() => {
    safeLog("firma_completed", {});
  }, []);

  // ── Piani / Upgrade ───────────────────────────────────────────────────────
  const trackUpgradeClicked = useCallback((source) => {
    safeLog("upgrade_clicked", { source });
  }, []);

  const trackCheckoutStarted = useCallback((planName) => {
    safeLog("checkout_started", { plan_name: planName });
  }, []);

  // ── Onboarding ────────────────────────────────────────────────────────────
  const trackOnboardingCompleted = useCallback(() => {
    safeLog("onboarding_completed", {});
  }, []);

  // ── Tab usage ─────────────────────────────────────────────────────────────
  const trackLockedTabOpened = useCallback((tabName) => {
    safeLog("locked_tab_opened", { tab_name: tabName });
  }, []);

  return {
    trackUserPlan,
    trackProjectCreated,
    trackPaywallHit,
    trackPdfGenerated,
    trackPdfSharedWhatsapp,
    trackFirmaRequested,
    trackFirmaCompleted,
    trackUpgradeClicked,
    trackCheckoutStarted,
    trackOnboardingCompleted,
    trackLockedTabOpened,
  };
}
