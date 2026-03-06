// ─── components/ErrorBoundary.jsx ───────────────────────────────────────────
// Cattura errori nei tab figli e mostra un messaggio leggibile
// invece di far crashare tutta l'app.

import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In produzione si potrebbe loggare su Sentry o simile
    console.error("Tab error:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const { label = "esta sección" } = this.props;
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "60px 20px", textAlign: "center",
        background: "white", borderRadius: 16, margin: "14px 0",
        boxShadow: "0 1px 4px rgba(0,0,0,.07)",
      }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: "#1a365d", marginBottom: 8 }}>
          Algo salió mal en {label}
        </div>
        <div style={{ fontSize: 12, color: "#718096", marginBottom: 20, maxWidth: 360 }}>
          {this.state.error?.message || "Error inesperado. Intenta recargar la página."}
        </div>
        <button
          onClick={() => this.setState({ hasError: false, error: null })}
          style={{
            padding: "9px 20px", background: "#2b6cb0", color: "white",
            border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 13,
            marginBottom: 8,
          }}>
          🔄 Reintentar
        </button>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "7px 16px", background: "none", color: "#718096",
            border: "1px solid #e2e8f0", borderRadius: 9, cursor: "pointer", fontSize: 12,
          }}>
          Recargar página completa
        </button>
      </div>
    );
  }
}
