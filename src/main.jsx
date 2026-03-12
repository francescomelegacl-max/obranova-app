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
