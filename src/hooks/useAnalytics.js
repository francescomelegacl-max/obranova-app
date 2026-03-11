// ─── hooks/useAnalytics.js ────────────────────────────────────────────────────
// STUB temporaneo — Analytics disabilitato per fix crash init.
// Da riattivare con Firebase Analytics dopo stabilizzazione app.
import { useCallback } from "react";

const noop = () => {};

export function useAnalytics() {
  return {
    trackUserPlan:            useCallback(noop, []),
    trackProjectCreated:      useCallback(noop, []),
    trackPaywallHit:          useCallback(noop, []),
    trackPdfGenerated:        useCallback(noop, []),
    trackPdfSharedWhatsapp:   useCallback(noop, []),
    trackFirmaRequested:      useCallback(noop, []),
    trackFirmaCompleted:      useCallback(noop, []),
    trackUpgradeClicked:      useCallback(noop, []),
    trackCheckoutStarted:     useCallback(noop, []),
    trackOnboardingCompleted: useCallback(noop, []),
    trackLockedTabOpened:     useCallback(noop, []),
  };
}
