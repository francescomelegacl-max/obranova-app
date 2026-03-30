// ─── hooks/useFCM.js ──────────────────────────────────────────────────────────
// Gestisce la registrazione FCM per le push notifications PWA.
// - Chiede il permesso notifiche
// - Ottiene il token FCM
// - Salva il token in Firestore: workspaces/{wsId}/fcmTokens/{token}
// - Gestisce aggiornamento token e cleanup al logout
//
// USO in App.jsx:
//   const { fcmReady, requestPushPermission } = useFCM({ workspaceId, userId });
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from "react";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

// VAPID key pubblica — da Firebase Console → Project Settings → Cloud Messaging
// Genera con: firebase messaging → Web Push certificates → Generate key pair
const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY || "BAP8C07DAdGWB9Diwv1wxsQTsNZToWb7U6omf1fG4zQmOpe7xo_tEwHJneuwJbEcOXnsb73idyx3OSAfYNTAISw";

export function useFCM({ workspaceId, userId } = {}) {
  const [fcmReady,      setFcmReady]      = useState(false);
  const [fcmToken,      setFcmToken]      = useState(null);
  const [permission,    setPermission]    = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );

  // ── Salva token in Firestore ───────────────────────────────────────────────
  const saveToken = useCallback(async (token) => {
    if (!workspaceId || !userId || !token) return;
    try {
      await setDoc(
        doc(db, "workspaces", workspaceId, "fcmTokens", token),
        {
          token,
          userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          platform:  "web",
          userAgent: navigator.userAgent.slice(0, 200),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn("[FCM] saveToken error:", e.message);
    }
  }, [workspaceId, userId]);

  // ── Elimina token (logout / revoca) ───────────────────────────────────────
  const removeToken = useCallback(async (token) => {
    if (!workspaceId || !token) return;
    try {
      await deleteDoc(doc(db, "workspaces", workspaceId, "fcmTokens", token));
    } catch (e) {
      console.warn("[FCM] removeToken error:", e.message);
    }
  }, [workspaceId]);

  // ── Registra FCM ──────────────────────────────────────────────────────────
  const registerFCM = useCallback(async () => {
    if (!VAPID_KEY) {
      console.warn("[FCM] VITE_FCM_VAPID_KEY non configurata — push disabilitato");
      return null;
    }

    try {
      const { getMessaging, getToken, onMessage } = await import("firebase/messaging");
      const { app } = await import("../lib/firebase");

      const messaging = getMessaging(app);

      // Ottieni token (richiede SW registrato + permesso notifiche)
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });

      if (token) {
        setFcmToken(token);
        await saveToken(token);
        setFcmReady(true);

        // Gestisci messaggi in foreground (app aperta)
        onMessage(messaging, (payload) => {
          const { title, body } = payload.notification || {};
          if (title && Notification.permission === "granted") {
            new Notification(title, {
              body:  body || "",
              icon:  "/icons/icon-192.png",
              badge: "/icons/icon-192.png",
            });
          }
        });

        return token;
      }
    } catch (e) {
      console.warn("[FCM] registerFCM error:", e.message);
    }
    return null;
  }, [saveToken]);

  // ── Richiedi permesso + registra FCM ──────────────────────────────────────
  const requestPushPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return "unsupported";

    if (Notification.permission === "default") {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") await registerFCM();
      return result;
    }

    if (Notification.permission === "granted") {
      await registerFCM();
      return "granted";
    }

    return Notification.permission; // "denied"
  }, [registerFCM]);

  // ── Auto-registra se permesso già concesso e workspace disponibile ─────────
  useEffect(() => {
    if (!workspaceId || !userId) return;
    if (Notification.permission === "granted" && VAPID_KEY) {
      registerFCM();
    }
  }, [workspaceId, userId, registerFCM]);

  return {
    fcmReady,
    fcmToken,
    permission,
    requestPushPermission,
    removeToken: () => fcmToken && removeToken(fcmToken),
  };
}
