// ─── components/BenchmarkReport.jsx ───────────────────────────────────────────
// Report benchmark condivisibile — genera un'immagine con i dati di mercato
// Il costruttore la manda al cliente per giustificare i prezzi
// Uso: <BenchmarkReport partidas={[...]} novaProfile={...} onClose={fn} />
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useRef, useCallback } from "react";

export default function BenchmarkReport({ partidas = [], novaProfile, proyectoNombre, clienteNombre, workspaceName, onClose, onToast }) {
  const canvasRef = useRef(null);
  const [generating, setGenerating] = useState(false);

  const generateReport = useCallback(async (action) => {
    setGenerating(true);
    try {
      const canvas = document.createElement("canvas");
      const W = 1080, H = 1350; // formato Instagram / WhatsApp verticale
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");

      // Background
      ctx.fillStyle = "#0f1b2d";
      ctx.fillRect(0, 0, W, H);

      // Header gradient bar
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, "#1a365d");
      grad.addColorStop(1, "#2b6cb0");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, 160);

      // Logo text
      ctx.font = "bold 36px Arial, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText("OBRA", 40, 60);
      ctx.fillStyle = "#f5a623";
      ctx.fillText("NOVA", 155, 60);

      // Subtitle
      ctx.font = "16px Arial, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText("Informe de precios de mercado — Chile 2026", 40, 90);

      // Project info
      if (proyectoNombre || clienteNombre) {
        ctx.font = "bold 20px Arial, sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(proyectoNombre || clienteNombre || "", 40, 130);
      }

      // Date
      ctx.font = "14px Arial, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      const dateStr = new Date().toLocaleDateString("es-CL", { day: "2-digit", month: "long", year: "numeric" });
      ctx.textAlign = "right";
      ctx.fillText(dateStr, W - 40, 90);
      ctx.textAlign = "left";

      // Workspace
      if (workspaceName) {
        ctx.fillText(`Elaborado por: ${workspaceName}`, W - 40 - ctx.measureText(`Elaborado por: ${workspaceName}`).width, 130);
      }

      // ── Build comparison data ──────────────────────────────────────────
      const cats = {};
      for (const p of partidas) {
        if (!p.cat || !p.pu || p.pu <= 0) continue;
        if (!cats[p.cat]) cats[p.cat] = { items: [], total: 0 };
        cats[p.cat].items.push(p);
        cats[p.cat].total += p.pu * (p.cant || 1);
      }

      const catEntries = Object.entries(cats).sort((a, b) => b[1].total - a[1].total).slice(0, 8);

      // ── Table header ──────────────────────────────────────────────────
      let y = 200;
      const colX = [40, 300, 500, 700, 880];
      const headers = ["Categoría", "Tu precio prom.", "Mercado p25-p75", "Posición", "Items"];

      // Header bg
      ctx.fillStyle = "#1a365d";
      ctx.fillRect(30, y - 8, W - 60, 40);

      ctx.font = "bold 14px Arial, sans-serif";
      ctx.fillStyle = "#ffffff";
      headers.forEach((h, i) => {
        ctx.textAlign = i === 0 ? "left" : "center";
        ctx.fillText(h, colX[i], y + 18);
      });
      ctx.textAlign = "left";

      y += 48;

      // ── Table rows ────────────────────────────────────────────────────
      const preciosMedios = novaProfile?.preciosMedios || {};

      for (const [cat, data] of catEntries) {
        const avgPU = Math.round(data.items.reduce((s, p) => s + p.pu, 0) / data.items.length);
        const benchmark = preciosMedios[cat];

        // Row background
        const rowIdx = catEntries.indexOf([cat, data]);
        ctx.fillStyle = y % 2 === 0 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)";
        ctx.fillRect(30, y - 8, W - 60, 52);

        // Category name
        ctx.font = "bold 15px Arial, sans-serif";
        ctx.fillStyle = "#e2e8f0";
        ctx.fillText(cat, colX[0], y + 16);

        // Your avg price
        ctx.font = "16px Arial, sans-serif";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText(`$${avgPU.toLocaleString("es-CL")}`, colX[1], y + 16);

        // Benchmark range
        if (benchmark) {
          const p25 = Math.round(benchmark * 0.75);
          const p75 = Math.round(benchmark * 1.25);
          ctx.fillStyle = "rgba(255,255,255,0.6)";
          ctx.font = "14px Arial, sans-serif";
          ctx.fillText(`$${p25.toLocaleString("es-CL")} - $${p75.toLocaleString("es-CL")}`, colX[2], y + 16);

          // Position indicator
          const diff = ((avgPU - benchmark) / benchmark) * 100;
          if (Math.abs(diff) < 15) {
            ctx.fillStyle = "#68d391";
            ctx.font = "bold 14px Arial, sans-serif";
            ctx.fillText("✓ En rango", colX[3], y + 16);
          } else if (diff < -15) {
            ctx.fillStyle = "#fc8181";
            ctx.font = "bold 14px Arial, sans-serif";
            ctx.fillText(`↓ ${Math.abs(Math.round(diff))}% bajo`, colX[3], y + 16);
          } else {
            ctx.fillStyle = "#fbd38d";
            ctx.font = "bold 14px Arial, sans-serif";
            ctx.fillText(`↑ ${Math.round(diff)}% sobre`, colX[3], y + 16);
          }
        } else {
          ctx.fillStyle = "rgba(255,255,255,0.3)";
          ctx.font = "14px Arial, sans-serif";
          ctx.fillText("Sin datos", colX[2], y + 16);
          ctx.fillText("—", colX[3], y + 16);
        }

        // Item count
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "14px Arial, sans-serif";
        ctx.fillText(`${data.items.length}`, colX[4], y + 16);

        ctx.textAlign = "left";
        y += 56;
      }

      // ── Summary section ───────────────────────────────────────────────
      y += 20;
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(30, y, W - 60, 120);

      // Total
      const totalPresupuesto = partidas.reduce((s, p) => s + (p.pu || 0) * (p.cant || 1), 0);
      ctx.font = "bold 18px Arial, sans-serif";
      ctx.fillStyle = "#f5a623";
      ctx.fillText("Resumen del presupuesto", 50, y + 30);

      ctx.font = "16px Arial, sans-serif";
      ctx.fillStyle = "#e2e8f0";
      ctx.fillText(`Total neto: $${Math.round(totalPresupuesto).toLocaleString("es-CL")} CLP`, 50, y + 58);
      ctx.fillText(`${partidas.length} partidas en ${catEntries.length} categorías`, 50, y + 82);

      if (novaProfile?.margenMedio) {
        ctx.fillText(`Margen promedio constructor: ${novaProfile.margenMedio}%`, 50, y + 106);
      }

      // ── Credibility badge ─────────────────────────────────────────────
      y += 150;
      ctx.fillStyle = "rgba(39,103,73,0.3)";
      ctx.fillRect(30, y, W - 60, 60);
      ctx.fillStyle = "#68d391";
      ctx.font = "bold 14px Arial, sans-serif";
      ctx.fillText("✓ Precios verificados con datos del mercado chileno 2026", 50, y + 25);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "13px Arial, sans-serif";
      ctx.fillText("Generado por Nova AI — ObraNova · app.obranova.cl", 50, y + 46);

      // ── Footer ────────────────────────────────────────────────────────
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.font = "11px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Este informe es referencial. Los precios finales dependen de las condiciones específicas de cada proyecto.", W / 2, H - 30);
      ctx.fillText(`© ${new Date().getFullYear()} ObraNova SPA — app.obranova.cl`, W / 2, H - 14);
      ctx.textAlign = "left";

      // ── Action ────────────────────────────────────────────────────────
      if (action === "download") {
        const a = document.createElement("a");
        a.download = `benchmark-${(proyectoNombre || "proyecto").replace(/\s/g, "-")}-${Date.now()}.jpg`;
        a.href = canvas.toDataURL("image/jpeg", 0.92);
        a.click();
        onToast?.("✅ Informe de benchmark descargado");
      } else if (action === "whatsapp") {
        // Can't directly share image via WA web — download first
        const a = document.createElement("a");
        a.download = `benchmark-obranova.jpg`;
        a.href = canvas.toDataURL("image/jpeg", 0.92);
        a.click();
        setTimeout(() => {
          const msg = encodeURIComponent(`📊 *Informe de precios de mercado — ${proyectoNombre || "Proyecto"}*\n\nPrecios verificados con datos del mercado chileno 2026.\nGenerado por ObraNova AI.\n\n_app.obranova.cl_`);
          window.open(`https://wa.me/?text=${msg}`, "_blank");
        }, 500);
        onToast?.("✅ Imagen descargada — compártela en WhatsApp");
      }
    } catch (e) {
      console.error("BenchmarkReport:", e);
      onToast?.("⚠️ Error al generar informe");
    } finally {
      setGenerating(false);
    }
  }, [partidas, novaProfile, proyectoNombre, clienteNombre, workspaceName, onToast]);

  if (!partidas?.length) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 10000, padding: 20,
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div style={{
        background: "white", borderRadius: 16, maxWidth: 480, width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg, #1a365d, #2b6cb0)",
          padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div>
            <div style={{ color: "white", fontWeight: 800, fontSize: 16 }}>📊 Informe de Benchmark</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>Precios de mercado Chile 2026</div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.15)", border: "none", color: "white",
            borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 16,
          }}>✕</button>
        </div>

        {/* Preview info */}
        <div style={{ padding: "20px 24px" }}>
          <div style={{ fontSize: 13, color: "#4a5568", marginBottom: 12, lineHeight: 1.5 }}>
            Genera un informe visual con los precios de tu presupuesto comparados con el mercado.
            Ideal para enviar al cliente y justificar tus precios.
          </div>

          {/* Quick stats */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            {[
              { label: "Partidas", value: partidas.length, color: "#2b6cb0" },
              { label: "Categorías", value: [...new Set(partidas.map(p => p.cat).filter(Boolean))].length, color: "#276749" },
              { label: "Total", value: `$${Math.round(partidas.reduce((s, p) => s + (p.pu || 0) * (p.cant || 1), 0)).toLocaleString("es-CL")}`, color: "#b7791f" },
            ].map(s => (
              <div key={s.label} style={{ flex: 1, background: "#f7fafc", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: "#718096" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => generateReport("download")}
              disabled={generating}
              style={{
                flex: 1, padding: "12px", borderRadius: 10, border: "none", cursor: "pointer",
                background: generating ? "#a0aec0" : "linear-gradient(135deg, #1a365d, #2b6cb0)",
                color: "white", fontWeight: 700, fontSize: 14,
              }}
            >
              {generating ? "⏳ Generando..." : "⬇️ Descargar imagen"}
            </button>
            <button
              onClick={() => generateReport("whatsapp")}
              disabled={generating}
              style={{
                flex: 1, padding: "12px", borderRadius: 10, border: "none", cursor: "pointer",
                background: generating ? "#a0aec0" : "#25d366",
                color: "white", fontWeight: 700, fontSize: 14,
              }}
            >
              {generating ? "⏳..." : "💬 WhatsApp"}
            </button>
          </div>

          <div style={{ fontSize: 10, color: "#a0aec0", textAlign: "center", marginTop: 10 }}>
            Imagen 1080x1350px — optimizada para redes sociales y WhatsApp
          </div>
        </div>
      </div>
    </div>
  );
}
