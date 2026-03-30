// ─── components/PortfolioPublico.jsx ──────────────────────────────────────────
// Pagina pubblica portfolio render AI — /portfolio/{workspaceId}
// Mostra tutti i render salvati del workspace in una galleria professionale.
// Condivisibile su social, SEO-friendly, genera traffico organico.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function PortfolioPublico() {
  const [renders, setRenders]       = useState([]);
  const [workspace, setWorkspace]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);

  const workspaceId = window.location.pathname.split("/portfolio/")[1]?.split("/")[0];

  useEffect(() => {
    if (!workspaceId) return;
    (async () => {
      try {
        // Load workspace info
        const wsSnap = await getDoc(doc(db, "workspaces", workspaceId));
        if (wsSnap.exists()) {
          setWorkspace(wsSnap.data());
        }

        // Load renders from all projects
        const proySnap = await getDocs(collection(db, "workspaces", workspaceId, "proyectos"));
        const allRenders = [];
        proySnap.forEach(d => {
          const data = d.data();
          if (data.lastRenderUrl) {
            allRenders.push({
              id: d.id,
              imageUrl: data.lastRenderUrl,
              label: data.info?.descripcion || data.info?.cliente || "Proyecto",
              style: data.lastRenderStyle || "",
              date: data.lastRenderAt || data.updatedAt || "",
              coverImageUrl: data.coverImageUrl,
            });
          }
        });

        allRenders.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
        setRenders(allRenders);
      } catch (e) {
        console.error("Portfolio load error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [workspaceId]);

  if (!workspaceId) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ textAlign: "center", color: "#718096" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎨</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Portfolio no encontrado</div>
        </div>
      </div>
    );
  }

  const empresaNombre = workspace?.name || "Constructor";

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a" }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #1a365d 0%, #2d6a9f 50%, #1a365d 100%)",
        padding: "40px 20px 32px",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" }}>
          Portfolio de diseño
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, color: "white", marginBottom: 6 }}>
          {empresaNombre}
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
          {renders.length} visualizaciones AI generadas con ObraNova
        </div>
      </div>

      {/* Gallery */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 16px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.5)" }}>
            <div style={{ fontSize: 32, marginBottom: 8, animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</div>
            <div>Cargando portfolio...</div>
          </div>
        ) : renders.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.4)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎨</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Este constructor aún no tiene renders</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Los renders AI aparecerán aquí cuando se generen</div>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}>
            {renders.map((r, i) => (
              <div
                key={r.id}
                onClick={() => setSelected(selected === i ? null : i)}
                style={{
                  borderRadius: 12,
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "transform .2s, box-shadow .2s",
                  transform: selected === i ? "scale(1.02)" : "scale(1)",
                  boxShadow: selected === i ? "0 8px 32px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.2)",
                  background: "#1e293b",
                }}
              >
                <img
                  src={r.imageUrl}
                  alt={r.label}
                  style={{ width: "100%", height: 200, objectFit: "cover", display: "block" }}
                  loading="lazy"
                />
                <div style={{ padding: "10px 14px" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "white", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.label}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
                      {r.date ? new Date(r.date).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" }) : ""}
                    </span>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.08)", padding: "2px 8px", borderRadius: 4 }}>
                      Render AI
                    </span>
                  </div>
                </div>

                {/* Expanded view */}
                {selected === i && (
                  <div style={{ padding: "0 14px 14px" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <a
                        href={r.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ flex: 1, padding: "8px", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, color: "white", fontWeight: 700, fontSize: 11, textAlign: "center", textDecoration: "none", display: "block" }}
                      >
                        🔍 Ver completa
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const msg = encodeURIComponent(`🏗️ *${empresaNombre}*\n\n🎨 Diseño AI: ${r.label}\n\n${r.imageUrl}\n\n_Generado con ObraNova — app.obranova.cl_`);
                          window.open(`https://wa.me/?text=${msg}`, "_blank");
                        }}
                        style={{ flex: 1, padding: "8px", background: "#25d366", border: "none", borderRadius: 8, color: "white", fontWeight: 700, fontSize: 11, cursor: "pointer" }}
                      >
                        💬 Compartir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div style={{
        textAlign: "center",
        padding: "32px 20px 48px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        marginTop: 24,
      }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>
          Visualizaciones generadas con inteligencia artificial
        </div>
        <a
          href="https://app.obranova.cl"
          style={{
            display: "inline-block",
            padding: "12px 28px",
            background: "linear-gradient(135deg, #1a365d, #2d6a9f)",
            color: "white",
            borderRadius: 10,
            fontWeight: 800,
            fontSize: 14,
            textDecoration: "none",
            boxShadow: "0 4px 16px rgba(26,54,93,0.4)",
          }}
        >
          Crea tu portfolio con ObraNova →
        </a>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 16 }}>
          © {new Date().getFullYear()} ObraNova SPA — app.obranova.cl
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
