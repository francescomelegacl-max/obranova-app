// ─── components/ModalFirma.jsx ────────────────────────────────────────────────
// Modal che appare quando si clicca "Invia per firma".
// Genera il link e permette di copiarlo o aprirlo.

import { useState } from "react";

export default function ModalFirma({ proy, workspace, onCrea, onClose }) {
  const [link,      setLink]      = useState("");
  const [copiato,   setCopiato]   = useState(false);
  const [loading,   setLoading]   = useState(false);

  const handleGenera = async () => {
    setLoading(true);
    const url = await onCrea(proy.currentId, proy);
    if (url) setLink(url);
    setLoading(false);
  };

  const copia = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopiato(true);
      setTimeout(() => setCopiato(false), 2000);
    });
  };

  const apriWhatsapp = () => {
    const msg = encodeURIComponent(
      `Buongiorno ${proy.info?.cliente || ""},\n\nLe invio il preventivo da firmare digitalmente:\n\n${link}\n\nGrazie,\n${workspace?.name || "Obra Nova"}`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const apriEmail = () => {
    const soggetto = encodeURIComponent(`Preventivo da firmare - ${proy.info?.cliente || ""}`);
    const corpo = encodeURIComponent(
      `Buongiorno ${proy.info?.cliente || ""},\n\nLe invio il link per firmare digitalmente il preventivo:\n\n${link}\n\nGrazie,\n${workspace?.name || "Obra Nova"}`
    );
    window.open(`mailto:${proy.info?.email || ""}?subject=${soggetto}&body=${corpo}`, "_blank");
  };

  return (
    <div
      role="dialog" aria-modal="true"
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <div style={{ background: "white", borderRadius: 16, padding: 28, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,.35)" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#1a365d" }}>✍️ Firma digitale</div>
          <button onClick={onClose} style={{ background: "#2d3748", border: "none", borderRadius: 8, cursor: "pointer", padding: "5px 12px", color: "white", fontWeight: 700 }}>✕</button>
        </div>

        {/* Info progetto */}
        <div style={{ background: "#f7fafc", borderRadius: 10, padding: "12px 14px", marginBottom: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1a365d" }}>{proy.info?.cliente || "Cliente non specificato"}</div>
          {proy.info?.descripcion && <div style={{ fontSize: 11, color: "#718096", marginTop: 2 }}>{proy.info.descripcion}</div>}
          {proy.info?.email && <div style={{ fontSize: 11, color: "#2b6cb0", marginTop: 2 }}>✉ {proy.info.email}</div>}
        </div>

        {!link ? (
          <>
            <div style={{ fontSize: 13, color: "#718096", marginBottom: 16, lineHeight: 1.6 }}>
              Genera un link sicuro da inviare al cliente. Il cliente potrà leggere il preventivo e firmarlo digitalmente dal proprio telefono.
            </div>
            <button
              onClick={handleGenera}
              disabled={loading}
              style={{ width: "100%", padding: "13px", background: loading ? "#e2e8f0" : "#1a365d", color: loading ? "#a0aec0" : "white", border: "none", borderRadius: 10, cursor: loading ? "not-allowed" : "pointer", fontWeight: 800, fontSize: 15, transition: "all .2s" }}
            >
              {loading ? "⏳ Generazione..." : "🔗 Genera link firma"}
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 12, color: "#276749", fontWeight: 700, marginBottom: 8 }}>✅ Link generato! Invialo al cliente:</div>

            {/* Link box */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <div style={{ flex: 1, padding: "10px 12px", background: "#f0fff4", border: "1px solid #9ae6b4", borderRadius: 9, fontSize: 11, color: "#276749", wordBreak: "break-all", fontFamily: "monospace" }}>
                {link}
              </div>
              <button
                onClick={copia}
                style={{ padding: "10px 14px", background: copiato ? "#276749" : "#2b6cb0", color: "white", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap", transition: "all .2s" }}
              >
                {copiato ? "✅ Copiato!" : "📋 Copia"}
              </button>
            </div>

            {/* Invio rapido */}
            <div style={{ fontSize: 12, color: "#718096", fontWeight: 600, marginBottom: 8 }}>Invia rapidamente tramite:</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <button
                onClick={apriWhatsapp}
                style={{ flex: 1, padding: "10px", background: "#25D366", color: "white", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 13 }}
              >
                💬 WhatsApp
              </button>
              <button
                onClick={apriEmail}
                style={{ flex: 1, padding: "10px", background: "#c05621", color: "white", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 13 }}
              >
                ✉️ Email
              </button>
              <button
                onClick={() => window.open(link, "_blank")}
                style={{ flex: 1, padding: "10px", background: "#4a5568", color: "white", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 13 }}
              >
                👁️ Anteprima
              </button>
            </div>

            <div style={{ padding: "10px 14px", background: "#fffff0", border: "1px solid #fef08a", borderRadius: 9, fontSize: 12, color: "#92400e" }}>
              ⏰ Il link è valido per <strong>30 giorni</strong>. Quando il cliente firma, lo stato del preventivo cambierà automaticamente in <strong>"Aceptado"</strong>.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
