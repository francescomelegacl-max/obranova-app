import './index.css'
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.jsx";

Sentry.init({
  dsn: "https://93a290e4bd38b5638778dd4ea548fd86@o4511015101333504.ingest.us.sentry.io/4511030903832576",
  sendDefaultPii: true,
  tracesSampleRate: 0.1,
  ignoreErrors: [
    "Firebase no disponibile",
    "Missing or insufficient permissions",
    "ResizeObserver loop limit exceeded",
  ],
});

// ── Global error tracker per Debug Panel admin ──────────────────────────────
window.__ON_ERROR_LOG = [];
const pushErr = (type, message, source) => {
  window.__ON_ERROR_LOG.push({
    type, message: String(message).slice(0, 500),
    source: source ? String(source).slice(0, 200) : "",
    time: new Date().toLocaleTimeString("es-CL"),
  });
  // Tieni max 200 errori
  if (window.__ON_ERROR_LOG.length > 200) window.__ON_ERROR_LOG.shift();
};
window.addEventListener("error", (e) => {
  pushErr("JS Error", e.message || e.error?.message || "Unknown", e.filename ? `${e.filename}:${e.lineno}` : "");
});
window.addEventListener("unhandledrejection", (e) => {
  pushErr("Promise", e.reason?.message || e.reason || "Unhandled rejection", e.reason?.stack?.split("\n")[1]?.trim() || "");
});
// Intercetta fetch errors (CF 4xx/5xx)
const _fetch = window.fetch;
window.fetch = async (...args) => {
  try {
    const res = await _fetch(...args);
    if (!res.ok && res.status >= 400) {
      const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";
      // Solo per Cloud Functions
      if (url.includes("cloudfunctions.net") || url.includes("run.app")) {
        let body = "";
        try { body = await res.clone().text(); body = body.slice(0, 300); } catch {}
        pushErr(`CF ${res.status}`, body || res.statusText, url.split("?")[0].split("/").pop());
      }
    }
    return res;
  } catch (err) {
    pushErr("Fetch", err.message, typeof args[0] === "string" ? args[0].split("?")[0] : "");
    throw err;
  }
};

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Sentry.ErrorBoundary
      fallback={
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          minHeight: "100vh", background: "#1a365d", color: "white",
          flexDirection: "column", gap: 16, padding: 32, textAlign: "center"
        }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Algo salió mal</div>
          <div style={{ fontSize: 14, opacity: 0.8, maxWidth: 400 }}>
            El error ha sido reportado automáticamente. Recarga la página para continuar.
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "12px 24px", background: "white", color: "#1a365d",
              border: "none", borderRadius: 8, cursor: "pointer",
              fontWeight: 700, fontSize: 15, marginTop: 8
            }}
          >
            🔄 Recargar
          </button>
        </div>
      }
      showDialog={false}
    >
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>
);

