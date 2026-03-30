// ─── components/tabs/TabContratos.jsx ────────────────────────────────────────
// Generador de contratos para ObraNova.
// Plan Pro+: acceso completo. Free: preview locked.
// Flujo: selecciona tipo → compila campi extra → preview → descarga PDF / firma
// Nova AI: personalizza il contratto con /contrato [tipo] [dettagli extra]
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback, useRef } from "react";
import jsPDF from "jspdf";
import {
  TIPOS_CONTRATO, generarContrato, mapProyectoToContrato
} from "../../utils/contratoTemplates";
import { fmt } from "../../utils/helpers";
import { EMPRESA } from "../../utils/constants";

// ── Genera PDF via jsPDF (dinamicamente per non gonfiare il bundle) ───────────
async function descargarContratoPDF(texto, titulo) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const margen = 20;
  const lineH  = 5.5;
  const maxW   = 170;
  let y        = 25;

  // Header
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(26, 54, 93);
  doc.text("ObraNova", margen, y);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(113, 128, 150);
  doc.text("app.obranova.cl", 210 - margen, y, { align: "right" });
  y += 4;
  doc.setDrawColor(26, 54, 93);
  doc.setLineWidth(0.5);
  doc.line(margen, y, 210 - margen, y);
  y += 8;

  doc.setTextColor(40, 40, 40);

  const lineas = texto.split("\n");
  for (const linea of lineas) {
    if (y > 270) { doc.addPage(); y = 20; }

    const trimmed = linea.trim();
    const esTitulo = trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !trimmed.startsWith("•") && !trimmed.startsWith("a)");

    if (esTitulo && trimmed.length > 0) {
      if (y > 20) y += 2;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(26, 54, 93);
      const wrapped = doc.splitTextToSize(linea, maxW);
      doc.text(wrapped, margen, y);
      y += wrapped.length * lineH + 1;
      doc.setTextColor(40, 40, 40);
    } else if (linea.startsWith("─")) {
      y += 3;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margen, y, 210 - margen, y);
      y += 4;
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      const wrapped = doc.splitTextToSize(linea || " ", maxW);
      doc.text(wrapped, margen, y);
      y += wrapped.length * lineH;
    }
  }

  // Footer su ogni pagina
  const nPages = doc.getNumberOfPages();
  for (let i = 1; i <= nPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(160, 174, 192);
    doc.text(
      `ObraNova SPA · app.obranova.cl · Página ${i} de ${nPages}`,
      210 / 2, 290, { align: "center" }
    );
  }

  doc.save(`${titulo.replace(/\s+/g, "_")}.pdf`);
}

// ── Campos extra per tipo ──────────────────────────────────────────────────────
function CamposExtra({ tipo, extra, setExtra }) {
  const campo = (key, label, placeholder = "", type = "text") => (
    <div key={key} style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, color: "#718096", marginBottom: 3 }}>{label}</div>
      <input
        type={type}
        value={extra[key] || ""}
        onChange={e => setExtra(p => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        style={{ width: "100%", padding: "7px 10px", border: "1px solid #e2e8f0",
          borderRadius: 8, fontSize: 13, boxSizing: "border-box" }}
      />
    </div>
  );

  const comun = [
    campo("rutContratista", "RUT Contratista", "12.345.678-9"),
    campo("domicilioContratista", "Domicilio Contratista", "Av. del Mar 123, Coquimbo"),
    campo("rutCliente", "RUT Cliente", "12.345.678-9"),
    campo("domicilioCliente", "Domicilio Cliente", "Calle Los Aromos 45, La Serena"),
    campo("plazo", "Plazo de ejecución (días hábiles)", "30", "number"),
    campo("garantia", "Garantía (meses)", "6", "number"),
  ];

  if (tipo === "subcontrato") return (
    <>
      {campo("subcontratista", "Nombre Subcontratista", "Juan Pérez Eléctrica")}
      {campo("rutSubcontratista", "RUT Subcontratista", "12.345.678-9")}
      {campo("especialidad", "Especialidad", "Instalaciones eléctricas")}
      {campo("descripcionTrabajo", "Descripción del trabajo", "Instalación tablero eléctrico y circuitos")}
      {campo("plazo", "Plazo (días hábiles)", "15", "number")}
    </>
  );

  if (tipo === "suministro") return (
    <>
      {campo("proveedor", "Nombre Proveedor", "Sodimac Constructor")}
      {campo("rutProveedor", "RUT Proveedor", "96.510.760-5")}
      {campo("plazoEntrega", "Plazo de entrega (días hábiles)", "15", "number")}
      {campo("lugarEntrega", "Lugar de entrega", "Obra en Av. del Mar 123")}
      {campo("garantiaMateriales", "Garantía materiales (meses)", "12", "number")}
    </>
  );

  if (tipo === "mantencion") return (
    <>
      {campo("rutContratista", "RUT Contratista", "12.345.678-9")}
      {campo("rutCliente", "RUT Cliente", "12.345.678-9")}
      {campo("frecuencia", "Frecuencia", "mensual")}
      {campo("duracionMeses", "Duración del contrato (meses)", "12", "number")}
      {campo("montoMensual", "Monto por visita (CLP)", "0", "number")}
    </>
  );

  if (tipo === "encargo") return (
    <>
      {campo("rutContratista", "RUT Contratista", "12.345.678-9")}
      {campo("rutCliente", "RUT Cliente", "12.345.678-9")}
      {campo("plazo", "Plazo estimado (días hábiles)", "30", "number")}
      {campo("validez", "Validez de la carta (días)", "30", "number")}
    </>
  );

  return <>{comun}</>;
}

// ── Componente principale ─────────────────────────────────────────────────────
export default function TabContratos({
  proyState, workspace, plan, user,
  onPaywall, onToast, onAskNova,
}) {
  const isPro     = plan?.isPro;
  const isEmpresa = plan?.plan === "empresa";

  const [tipoSel,   setTipoSel]   = useState(null);
  const [extra,     setExtra]     = useState({});
  const [preview,   setPreview]   = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [novaText,  setNovaText]  = useState("");
  const textRef = useRef(null);

  const hasProyecto = !!(proyState?.partidas?.length || proyState?.info?.cliente);

  // Genera preview del contratto
  const handleGenera = useCallback(() => {
    if (!isPro) { onPaywall("firma"); return; }
    if (!tipoSel) return;

    const base = mapProyectoToContrato(proyState, workspace, user);
    const datos = { ...base, ...extra };
    const texto = generarContrato(tipoSel, datos);
    setPreview(texto);
    setTimeout(() => textRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [tipoSel, extra, proyState, workspace, user, isPro, onPaywall]);

  // Descarga PDF
  const handleDescarga = useCallback(async () => {
    if (!preview) return;
    setLoading(true);
    try {
      const tipo = TIPOS_CONTRATO.find(t => t.id === tipoSel);
      await descargarContratoPDF(preview, tipo?.label || "Contrato");
      onToast?.("✅ Contrato descargado");
    } catch (e) {
      onToast?.("❌ Error al generar PDF: " + e.message);
    } finally {
      setLoading(false);
    }
  }, [preview, tipoSel, onToast]);

  // Nova personalizza
  const handleNova = useCallback(() => {
    if (!tipoSel) return;
    const tipo = TIPOS_CONTRATO.find(t => t.id === tipoSel);
    const msg = `/contrato ${tipo?.label} — personaliza este contrato para: ${proyState?.info?.cliente || "mi cliente"}, obra: ${proyState?.info?.descripcion || ""}, monto: ${fmt(mapProyectoToContrato(proyState, workspace).montoTotal)} CLP. Agrega cláusulas específicas si lo consideras necesario.`;
    onAskNova?.(msg);
  }, [tipoSel, proyState, workspace, onAskNova]);

  // Copia testo
  const handleCopia = useCallback(() => {
    if (!preview) return;
    navigator.clipboard.writeText(preview).then(() => onToast?.("✅ Texto copiado al portapapeles"));
  }, [preview, onToast]);

  return (
    <div style={{ padding: "20px 24px", maxWidth: 900, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1a365d" }}>Contratos</div>
          <div style={{ fontSize: 12, color: "#718096", marginTop: 2 }}>
            Genera contratos legales chilenos desde los datos del proyecto
          </div>
        </div>
        {isPro && tipoSel && (
          <button onClick={handleNova} style={{
            padding: "7px 14px", background: "#1a365d", color: "white",
            border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}>
            🤖 Nova personaliza
          </button>
        )}
      </div>

      {/* Paywall Free */}
      {!isPro && (
        <div style={{ background: "linear-gradient(135deg,#ebf8ff,#bee3f8)",
          border: "1px solid #90cdf4", borderRadius: 12, padding: "14px 18px",
          marginBottom: 20, display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#2a4365" }}>
              📋 Contratos — plan Pro
            </div>
            <div style={{ fontSize: 12, color: "#2c5282", marginTop: 2 }}>
              Genera contratos legales chilenos personalizados desde tu proyecto.
            </div>
          </div>
          <button onClick={() => onPaywall("firma")} style={{
            padding: "8px 16px", background: "#1a365d", color: "white",
            border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700,
            cursor: "pointer", whiteSpace: "nowrap" }}>
            Ver planes →
          </button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: preview ? "1fr 1fr" : "1fr", gap: 16 }}>

        {/* Sinistra: selezione tipo + campi */}
        <div>
          {/* Tipo contratto */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#1a365d", marginBottom: 10 }}>
              Tipo de contrato
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {TIPOS_CONTRATO.map(tipo => (
                <div
                  key={tipo.id}
                  onClick={() => { setTipoSel(tipo.id); setPreview(null); setExtra({}); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                    border: tipoSel === tipo.id
                      ? "2px solid #1a365d"
                      : "1px solid #e2e8f0",
                    background: tipoSel === tipo.id ? "#EBF5FB" : "white",
                    transition: "all .15s",
                  }}
                >
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{tipo.emoji}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600,
                      color: tipoSel === tipo.id ? "#1a365d" : "#2D3748" }}>
                      {tipo.label}
                    </div>
                    <div style={{ fontSize: 11, color: "#718096" }}>{tipo.desc}</div>
                  </div>
                  {tipoSel === tipo.id && (
                    <span style={{ marginLeft: "auto", color: "#1a365d", fontWeight: 700 }}>✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Avviso dati progetto */}
          {tipoSel && (
            <div style={{ marginBottom: 16 }}>
              {hasProyecto ? (
                <div style={{ background: "#EAF3DE", border: "1px solid #3B6D11",
                  borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#27500A" }}>
                  ✓ Los datos del proyecto se cargarán automáticamente.
                  Completa los campos adicionales si es necesario.
                </div>
              ) : (
                <div style={{ background: "#FAEEDA", border: "1px solid #BA7517",
                  borderRadius: 8, padding: "10px 12px", fontSize: 12, color: "#633806" }}>
                  ⚠ No hay proyecto abierto. Completa los campos manualmente.
                </div>
              )}
            </div>
          )}

          {/* Campos extra */}
          {tipoSel && (
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px",
              marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#1a365d", marginBottom: 12 }}>
                Datos adicionales
              </div>
              <CamposExtra tipo={tipoSel} extra={extra} setExtra={setExtra} />
            </div>
          )}

          {/* Bottone genera */}
          {tipoSel && (
            <button
              onClick={handleGenera}
              disabled={!isPro}
              style={{
                width: "100%", padding: "12px", borderRadius: 10,
                background: isPro ? "#1a365d" : "#e2e8f0",
                color: isPro ? "white" : "#a0aec0",
                border: "none", fontSize: 14, fontWeight: 700,
                cursor: isPro ? "pointer" : "not-allowed",
              }}
            >
              {isPro ? "📋 Generar contrato" : "🔒 Disponible en Pro"}
            </button>
          )}
        </div>

        {/* Destra: preview */}
        {preview && (
          <div ref={textRef}>
            <div style={{ display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#1a365d" }}>
                Vista previa
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={handleCopia} style={{
                  padding: "5px 10px", fontSize: 11, border: "1px solid #e2e8f0",
                  borderRadius: 7, background: "white", color: "#718096", cursor: "pointer" }}>
                  Copiar
                </button>
                <button onClick={handleDescarga} disabled={loading} style={{
                  padding: "5px 12px", fontSize: 11, fontWeight: 700,
                  border: "none", borderRadius: 7,
                  background: loading ? "#e2e8f0" : "#1a365d",
                  color: loading ? "#a0aec0" : "white", cursor: loading ? "wait" : "pointer" }}>
                  {loading ? "Generando..." : "↓ PDF"}
                </button>
              </div>
            </div>

            {/* Nova tip */}
            <div style={{ background: "#EEEDFE", border: "1px solid #7F77DD",
              borderRadius: 8, padding: "8px 12px", marginBottom: 10,
              display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>🤖</span>
              <span style={{ fontSize: 11, color: "#3C3489" }}>
                <b>Nova puede personalizar este contrato</b> con cláusulas específicas
                para tu proyecto. Haz clic en "Nova personaliza" arriba.
              </span>
            </div>

            {/* Testo contratto */}
            <textarea
              value={preview}
              onChange={e => setPreview(e.target.value)}
              style={{
                width: "100%", height: 480, padding: "12px",
                fontFamily: "Courier New, monospace", fontSize: 10.5,
                lineHeight: 1.6, border: "1px solid #e2e8f0",
                borderRadius: 10, resize: "vertical", color: "#2D3748",
                background: "white", boxSizing: "border-box",
              }}
            />
            <div style={{ fontSize: 10, color: "#a0aec0", marginTop: 4 }}>
              Puedes editar el texto directamente antes de descargar.
            </div>
          </div>
        )}
      </div>

      {/* Empty state */}
      {!tipoSel && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#a0aec0" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#718096", marginBottom: 6 }}>
            Selecciona un tipo de contrato para comenzar
          </div>
          <div style={{ fontSize: 12 }}>
            Los datos del proyecto abierto se cargarán automáticamente
          </div>
        </div>
      )}
    </div>
  );
}
