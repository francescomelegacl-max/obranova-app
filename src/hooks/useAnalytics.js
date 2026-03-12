// ─── hooks/useAnalytics.js ────────────────────────────────────────────────────
// Firebase Analytics + Sentry per errori critici.
// Tutti i track sono safe — non crashano mai se Analytics non è disponibile.

import { useCallback } from "react";
import { logEvent } from "firebase/analytics";
import * as Sentry from "@sentry/react";
import { getAnalyticsInstance } from "../lib/firebase";

// ── Helper sicuro: logga solo se Analytics è inizializzato ────────────────────
function track(eventName, params = {}) {
  try {
    const analytics = getAnalyticsInstance();
    if (analytics) logEvent(analytics, eventName, params);
  } catch (e) {
    // Analytics non disponibile — silenzioso
  }
}

// ── Helper Sentry: cattura errori critici con contesto ────────────────────────
function captureError(error, context = {}) {
  try {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([k, v]) => scope.setExtra(k, v));
      Sentry.captureException(error);
    });
  } catch (e) {
    // Sentry non disponibile — silenzioso
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAnalytics({ workspace, plan, isTrialActive } = {}) {

  const wsId   = workspace?.id   || null;
  const wsName = workspace?.name || null;

  const trackProyectoCreado = useCallback((proyectoId) => {
    track("proyecto_creado", { workspace_id: wsId, workspace_name: wsName, plan, proyecto_id: proyectoId });
  }, [wsId, wsName, plan]);

  const trackPdfGenerado = useCallback((proyectoId) => {
    track("pdf_generado", { workspace_id: wsId, plan, proyecto_id: proyectoId });
  }, [wsId, plan]);

  const trackFirmaSolicitada = useCallback((proyectoId) => {
    track("firma_solicitada", { workspace_id: wsId, plan, proyecto_id: proyectoId });
  }, [wsId, plan]);

  const trackPaywallShown = useCallback((feature) => {
    track("paywall_shown", { workspace_id: wsId, plan, feature, is_trial: !!isTrialActive });
  }, [wsId, plan, isTrialActive]);

  const trackUpgradeClick = useCallback((source) => {
    track("upgrade_click", { workspace_id: wsId, plan, source, is_trial: !!isTrialActive });
  }, [wsId, plan, isTrialActive]);

  const trackTrialStarted = useCallback(() => {
    track("trial_started", { workspace_id: wsId, workspace_name: wsName });
  }, [wsId, wsName]);

  // ── Errori critici → Sentry ───────────────────────────────────────────────
  const trackError = useCallback((error, context = {}) => {
    captureError(error, { workspace_id: wsId, plan, ...context });
  }, [wsId, plan]);

  // ── Compatibilità nomi alternativi ────────────────────────────────────────
  const trackUserPlan            = useCallback(() => track("user_plan",            { plan, is_trial: !!isTrialActive }), [plan, isTrialActive]);
  const trackProjectCreated      = trackProyectoCreado;
  const trackPaywallHit          = trackPaywallShown;
  const trackPdfSharedWhatsapp   = useCallback((proyectoId) => track("pdf_whatsapp",          { workspace_id: wsId, proyecto_id: proyectoId }), [wsId]);
  const trackFirmaCompleted      = useCallback((proyectoId) => track("firma_completada",       { workspace_id: wsId, proyecto_id: proyectoId }), [wsId]);
  const trackUpgradeClicked      = trackUpgradeClick;
  const trackCheckoutStarted     = useCallback((p)          => track("checkout_started",       { workspace_id: wsId, plan: p }), [wsId]);
  const trackOnboardingCompleted = useCallback(()           => track("onboarding_completed",   { workspace_id: wsId }), [wsId]);
  const trackLockedTabOpened     = useCallback((tab)        => track("locked_tab_opened",      { workspace_id: wsId, tab, plan }), [wsId, plan]);

  return {
    trackProyectoCreado,
    trackPdfGenerado,
    trackFirmaSolicitada,
    trackPaywallShown,
    trackUpgradeClick,
    trackTrialStarted,
    trackError,
    trackUserPlan,
    trackProjectCreated,
    trackPaywallHit,
    trackPdfSharedWhatsapp,
    trackFirmaCompleted,
    trackUpgradeClicked,
    trackCheckoutStarted,
    trackOnboardingCompleted,
    trackLockedTabOpened,
  };
}
