// ─── components/PresupuestoWizard.jsx ────────────────────────────────────────
// Página pública /presupuesto/{wsId} o /presupuesto/{wsId}/{tipo}
// Wizard 5 pasos → crea proyecto en Firestore → notifica owner vía WA + in-app
// Sin login, sin dependencias del app principal.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useMemo } from "react";
import { doc, getDoc, collection, setDoc, getDocs } from "firebase/firestore";
import { db, appCheck } from "../lib/firebase";
import { getToken } from "firebase/app-check";

// ── Configuración por tipo de trabajo ────────────────────────────────────────
const TIPOS_TRABAJO = {
  bano: {
    label: "Baño",
    emoji: "🚿",
    color: "#2b6cb0",
    preguntas: ["¿Qué quieres hacer en el baño?"],
    opciones: ["Remodelación completa", "Solo revestimientos", "Plomería / sanitarios", "Pintura", "Vanitory / muebles", "Otro"],
  },
  cocina: {
    label: "Cocina",
    emoji: "🍳",
    color: "#276749",
    preguntas: ["¿Qué quieres hacer en la cocina?"],
    opciones: ["Remodelación completa", "Muebles y mesón", "Revestimientos", "Electricidad / gas", "Pintura", "Otro"],
  },
  pintura: {
    label: "Pintura",
    emoji: "🎨",
    color: "#553c9a",
    preguntas: ["¿Qué espacios quieres pintar?"],
    opciones: ["Interior completo", "Exterior fachada", "Solo habitaciones", "Solo áreas comunes", "Cielos", "Otro"],
  },
  piso: {
    label: "Pisos",
    emoji: "🏠",
    color: "#c05621",
    preguntas: ["¿Qué tipo de piso quieres instalar?"],
    opciones: ["Porcelanato", "Cerámica", "Madera / flotante", "Cemento pulido", "Quitar piso existente", "Otro"],
  },
  techado: {
    label: "Techado",
    emoji: "🏗️",
    color: "#b7791f",
    preguntas: ["¿Qué necesitas del techo?"],
    opciones: ["Techo nuevo completo", "Reparación de filtraciones", "Cambio de cubierta", "Cielo interior", "Canaletas", "Otro"],
  },
  electricidad: {
    label: "Electricidad",
    emoji: "⚡",
    color: "#d69e2e",
    preguntas: ["¿Qué trabajo eléctrico necesitas?"],
    opciones: ["Instalación nueva", "Ampliación cuadro", "Puntos de luz / enchufes", "Certificación SEC", "Iluminación LED", "Otro"],
  },
  general: {
    label: "Remodelación general",
    emoji: "🔨",
    color: "#1a365d",
    preguntas: ["¿Qué tipo de trabajo necesitas?"],
    opciones: ["Remodelación completa", "Obra gruesa", "Terminaciones", "Reparaciones menores", "Ampliación", "Otro"],
  },
};

const CALIDAD_OPTIONS = [
  { id: "basica",   label: "Básica",   desc: "Materiales económicos, funcional", emoji: "💰", color: "#718096" },
  { id: "estandar", label: "Estándar", desc: "Buena relación precio-calidad",    emoji: "⭐", color: "#2b6cb0" },
  { id: "premium",  label: "Premium",  desc: "Materiales de alta gama",          emoji: "💎", color: "#553c9a" },
];

const URGENCIA_OPTIONS = [
  { id: "urgente",  label: "Lo antes posible", emoji: "🔥" },
  { id: "1mes",     label: "En 1 mes",          emoji: "📅" },
  { id: "3meses",   label: "En 2-3 meses",      emoji: "🗓️" },
  { id: "flexible", label: "Sin fecha fija",     emoji: "😌" },
];

// ── Componente chip seleccionable ─────────────────────────────────────────────
function Chip({ label, emoji, desc, selected, color = "#2b6cb0", onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 14px", borderRadius: 10, cursor: "pointer", textAlign: "left",
        border: `2px solid ${selected ? color : "#e2e8f0"}`,
        background: selected ? color + "15" : "white",
        color: selected ? color : "#4a5568",
        fontWeight: selected ? 700 : 500, fontSize: 13,
        transition: "all .15s", display: "flex", alignItems: "center", gap: 8,
        width: "100%",
      }}
    >
      {emoji && <span style={{ fontSize: 18 }}>{emoji}</span>}
      <div>
        <div>{label}</div>
        {desc && <div style={{ fontSize: 11, opacity: .7, marginTop: 1 }}>{desc}</div>}
      </div>
      {selected && <span style={{ marginLeft: "auto", color, fontSize: 16 }}>✓</span>}
    </button>
  );
}

// ── Step indicator ────────────────────────────────────────────────────────────
function StepDots({ total, current, color }) {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 24 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === current ? 24 : 8, height: 8, borderRadius: 4,
          background: i <= current ? color : "#e2e8f0",
          transition: "all .3s",
        }} />
      ))}
    </div>
  );
}

// ── Hook: carica dati workspace pubblici ──────────────────────────────────────
function useWorkspacePublico(wsId) {
  const [ws, setWs]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!wsId) { setError("Link no válido"); setLoading(false); return; }
    getDoc(doc(db, "workspaces", wsId)).then(snap => {
      if (!snap.exists()) { setError("Empresa no encontrada"); setLoading(false); return; }
      setWs({ id: snap.id, ...snap.data() });
      setLoading(false);
    }).catch(e => { setError(e.message); setLoading(false); });
  }, [wsId]);

  return { ws, loading, error };
}

// ── Crea proyecto en Firestore desde el wizard ────────────────────────────────
async function crearProyectoDesdeWizard({ wsId, tipo, respuestas, ws }) {
  // App Check token — necessario per write anonime con enforcement attivo
  try { if (appCheck) await getToken(appCheck, false); } catch (e) { console.warn("AppCheck token:", e.message); }
  const ref  = doc(collection(db, "workspaces", wsId, "proyectos"));
  const now  = new Date().toISOString();
  const tipoConfig = TIPOS_TRABAJO[tipo] || TIPOS_TRABAJO.general;

  const calidad = CALIDAD_OPTIONS.find(c => c.id === respuestas.calidad);

  const proyecto = {
    info: {
      cliente:     respuestas.nombre     || "",
      telefono:    respuestas.telefono   || "",
      descripcion: `${tipoConfig.label} — ${respuestas.trabajo || "Sin especificar"}`,
      ciudad:      respuestas.ciudad     || "",
      empresa:     ws?.name              || "Obra Nova",
      nota:        [
        respuestas.trabajo  ? `Trabajo: ${respuestas.trabajo}`       : null,
        respuestas.metros   ? `Superficie: ${respuestas.metros} m²`   : null,
        respuestas.calidad  ? `Calidad: ${calidad?.label || respuestas.calidad}` : null,
        respuestas.urgencia ? `Plazo: ${URGENCIA_OPTIONS.find(u=>u.id===respuestas.urgencia)?.label || respuestas.urgencia}` : null,
        respuestas.detalle  ? `Detalle: ${respuestas.detalle}`        : null,
      ].filter(Boolean).join("\n"),
    },
    partidas:              [],
    pct:                   { ci: 10, gf: 5, imprevistos: 5, utilidad: 10 },
    estado:                "Borrador",
    fotos:                 [],
    validez:               30,
    iva:                   false,
    condPago:              "cuotas",
    condPagoPersonalizado: "",
    cuotas:                [],
    catVis:                {},
    transferencia:         { banco: "", cuenta: "", rutTitular: "", nota: "" },
    // Metadata wizard
    fromWizard:            true,
    wizardTipo:            tipo,
    wizardCalidad:         respuestas.calidad  || "estandar",
    wizardMetros:          respuestas.metros   || "",
    wizardUrgencia:        respuestas.urgencia || "",
    createdAt:             now,
    updatedAt:             now,
    createdBy:             "wizard_publico",
  };

  await setDoc(ref, proyecto);

  // Notifica in-app all'owner
  try {
    const notifRef = doc(collection(db, "workspaces", wsId, "notifiche"));
    await setDoc(notifRef, {
      tipo:        "nuevo_presupuesto_wizard",
      icon:        "📋",
      titulo:      `Nueva solicitud de ${tipoConfig.label}`,
      descripcion: `${respuestas.nombre || "Cliente"} solicita ${tipoConfig.label.toLowerCase()}${respuestas.metros ? ` · ${respuestas.metros} m²` : ""}${respuestas.calidad ? ` · ${calidad?.label}` : ""}`,
      proyectoId:  ref.id,
      source:      "cliente",
      read:        false,
      ts:          now,
    });
  } catch (e) {
    console.warn("Notifica in-app fallita:", e.message);
  }

  return { proyectoId: ref.id, proyecto };
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function PresupuestoWizard() {
  // Parsing URL: /presupuesto/{wsId} o /presupuesto/{wsId}/{tipo}
  const parts  = window.location.pathname.split("/").filter(Boolean);
  const wsId   = parts[1] || "";
  const tipoUrl= parts[2] || "general";
  const tipo   = TIPOS_TRABAJO[tipoUrl] ? tipoUrl : "general";
  const config = TIPOS_TRABAJO[tipo];

  const { ws, loading: wsLoading, error: wsError } = useWorkspacePublico(wsId);

  const [step,       setStep]       = useState(0);  // 0-4
  const [respuestas, setRespuestas] = useState({
    trabajo: "", metros: "", calidad: "", urgencia: "",
    nombre: "", telefono: "", ciudad: "", detalle: "",
  });
  const [enviando,  setEnviando]  = useState(false);
  const [enviado,   setEnviado]   = useState(false);
  const [proyId,    setProyId]    = useState(null);
  const [error,     setError]     = useState(null);

  const set = (k, v) => setRespuestas(r => ({ ...r, [k]: v }));

  // ── Validazione per step ───────────────────────────────────────────────────
  const canNext = useMemo(() => {
    if (step === 0) return !!respuestas.trabajo;
    if (step === 1) return !!respuestas.metros;
    if (step === 2) return !!respuestas.calidad;
    if (step === 3) return !!respuestas.urgencia;
    if (step === 4) return respuestas.nombre.trim().length >= 2 && respuestas.telefono.replace(/\D/g,"").length >= 8;
    return true;
  }, [step, respuestas]);

  const TOTAL_STEPS = 5;

  // ── Invio finale ───────────────────────────────────────────────────────────
  const handleEnviar = async () => {
    setEnviando(true);
    setError(null);
    try {
      const { proyectoId } = await crearProyectoDesdeWizard({ wsId, tipo, respuestas, ws });
      setProyId(proyectoId);
      setEnviado(true);
    } catch (e) {
      console.error(e);
      setError("Ocurrió un error al enviar. Por favor intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  // ── Loading / Error states ─────────────────────────────────────────────────
  if (wsLoading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7fafc" }}>
      <div style={{ width: 40, height: 40, border: `4px solid ${config.color}33`, borderTopColor: config.color, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (wsError) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7fafc", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 340 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#1a365d", marginBottom: 8 }}>Link no válido</div>
        <div style={{ fontSize: 13, color: "#718096" }}>Este enlace no corresponde a ninguna empresa registrada en Obra Nova.</div>
      </div>
    </div>
  );

  // ── Pantalla de éxito ──────────────────────────────────────────────────────
  if (enviado) {
    const waOwner = ws?.telefono
      ? `https://wa.me/${ws.telefono.replace(/\D/g,"").replace(/^(?!56)/,"56")}?text=${encodeURIComponent(
          `Hola! Acabo de solicitar un presupuesto de ${config.label.toLowerCase()} a través de su sistema. Soy ${respuestas.nombre}, ${respuestas.telefono}.`
        )}`
      : null;

    return (
      <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${config.color}08, #f7fafc)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: "white", borderRadius: 20, padding: 40, maxWidth: 420, width: "100%", textAlign: "center", boxShadow: "0 8px 40px rgba(0,0,0,.1)" }}>
          <div style={{ width: 72, height: 72, background: `${config.color}15`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 32 }}>
            ✅
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#1a365d", marginBottom: 8 }}>
            ¡Solicitud enviada!
          </div>
          <div style={{ fontSize: 14, color: "#718096", lineHeight: 1.6, marginBottom: 28 }}>
            {ws?.name || "La empresa"} recibió tu solicitud de <strong>{config.label.toLowerCase()}</strong> y te contactará en menos de 2 horas.
          </div>

          {/* Resumen */}
          <div style={{ background: "#f7fafc", borderRadius: 12, padding: 16, marginBottom: 24, textAlign: "left" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#718096", marginBottom: 10, letterSpacing: .5 }}>RESUMEN DE TU SOLICITUD</div>
            {[
              { l: "Tipo",      v: config.label },
              { l: "Trabajo",   v: respuestas.trabajo },
              { l: "Superficie", v: respuestas.metros ? `${respuestas.metros} m²` : null },
              { l: "Calidad",   v: CALIDAD_OPTIONS.find(c=>c.id===respuestas.calidad)?.label },
              { l: "Plazo",     v: URGENCIA_OPTIONS.find(u=>u.id===respuestas.urgencia)?.label },
            ].filter(r => r.v).map(r => (
              <div key={r.l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #e2e8f0", fontSize: 12 }}>
                <span style={{ color: "#718096" }}>{r.l}</span>
                <span style={{ fontWeight: 600, color: "#1a365d" }}>{r.v}</span>
              </div>
            ))}
          </div>

          {waOwner && (
            <a href={waOwner} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 24px", background: "#25D366", color: "white", borderRadius: 12, fontWeight: 800, fontSize: 14, textDecoration: "none", marginBottom: 12 }}>
              💬 Escríbenos por WhatsApp
            </a>
          )}
          <div style={{ fontSize: 11, color: "#a0aec0", marginTop: 8 }}>
            Powered by <strong>Obra Nova</strong>
          </div>
        </div>
      </div>
    );
  }

  // ── Header workspace ───────────────────────────────────────────────────────
  const headerColor = ws?.colorPrimario || config.color;

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${headerColor}08, #f7fafc)`, padding: "24px 16px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>

        {/* Logo + nombre empresa */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          {ws?.logoUrl ? (
            <img src={ws.logoUrl} alt={ws.name} style={{ height: 44, objectFit: "contain", marginBottom: 8 }} />
          ) : (
            <div style={{ fontSize: 28, fontWeight: 900, color: headerColor, marginBottom: 4 }}>
              {ws?.name || "Obra Nova"}
            </div>
          )}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${headerColor}15`, borderRadius: 99, padding: "5px 14px" }}>
            <span style={{ fontSize: 16 }}>{config.emoji}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: headerColor }}>Cotización de {config.label}</span>
          </div>
        </div>

        {/* Card wizard */}
        <div style={{ background: "white", borderRadius: 20, padding: "28px 24px", boxShadow: "0 4px 24px rgba(0,0,0,.08)" }}>

          <StepDots total={TOTAL_STEPS} current={step} color={headerColor} />

          {/* ── STEP 0: Tipo de trabajo ──────────────────────────────────── */}
          {step === 0 && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#1a365d", marginBottom: 6 }}>
                {config.preguntas[0]}
              </div>
              <div style={{ fontSize: 13, color: "#718096", marginBottom: 20 }}>Selecciona la opción que mejor describe lo que necesitas</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {config.opciones.map(op => (
                  <Chip key={op} label={op} selected={respuestas.trabajo === op} color={headerColor}
                    onClick={() => set("trabajo", op)} />
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 1: Superficie ───────────────────────────────────────── */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#1a365d", marginBottom: 6 }}>
                ¿Cuántos metros cuadrados aproximadamente?
              </div>
              <div style={{ fontSize: 13, color: "#718096", marginBottom: 20 }}>Una estimación es suficiente</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                {[["1-5 m²","1-5"],["6-15 m²","6-15"],["16-30 m²","16-30"],["31-60 m²","31-60"],["61-100 m²","61-100"],["Más de 100 m²","100+"]].map(([label, val]) => (
                  <Chip key={val} label={label} selected={respuestas.metros === val} color={headerColor}
                    onClick={() => set("metros", val)} />
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                <span style={{ fontSize: 12, color: "#718096", whiteSpace: "nowrap" }}>O escribe exacto:</span>
                <input
                  type="number" placeholder="ej. 24"
                  value={/^\d/.test(respuestas.metros || "") && !["1-5","6-15","16-30","31-60","61-100","100+"].includes(respuestas.metros) ? respuestas.metros : ""}
                  onChange={e => set("metros", e.target.value)}
                  style={{ flex: 1, padding: "9px 12px", border: `1.5px solid ${headerColor}44`, borderRadius: 9, fontSize: 13 }}
                />
                <span style={{ fontSize: 12, color: "#718096" }}>m²</span>
              </div>
            </div>
          )}

          {/* ── STEP 2: Calidad ───────────────────────────────────────────── */}
          {step === 2 && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#1a365d", marginBottom: 6 }}>
                ¿Qué calidad de materiales prefieres?
              </div>
              <div style={{ fontSize: 13, color: "#718096", marginBottom: 20 }}>Esto nos ayuda a darte una propuesta adecuada</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {CALIDAD_OPTIONS.map(c => (
                  <Chip key={c.id} label={c.label} emoji={c.emoji} desc={c.desc}
                    selected={respuestas.calidad === c.id} color={c.color}
                    onClick={() => set("calidad", c.id)} />
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 3: Urgencia ─────────────────────────────────────────── */}
          {step === 3 && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#1a365d", marginBottom: 6 }}>
                ¿Cuándo quieres empezar?
              </div>
              <div style={{ fontSize: 13, color: "#718096", marginBottom: 20 }}>Nos ayuda a planificar la visita y el presupuesto</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {URGENCIA_OPTIONS.map(u => (
                  <Chip key={u.id} label={u.label} emoji={u.emoji}
                    selected={respuestas.urgencia === u.id} color={headerColor}
                    onClick={() => set("urgencia", u.id)} />
                ))}
              </div>
              {/* Campo detalle opcional */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, color: "#718096", marginBottom: 6 }}>Detalles adicionales (opcional)</div>
                <textarea
                  value={respuestas.detalle}
                  onChange={e => set("detalle", e.target.value)}
                  placeholder="Ej: tengo los materiales, necesito solo mano de obra, hay que demoler el piso actual..."
                  rows={3}
                  style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 13, resize: "none", boxSizing: "border-box", color: "#2d3748" }}
                />
              </div>
            </div>
          )}

          {/* ── STEP 4: Datos de contacto ─────────────────────────────────── */}
          {step === 4 && (
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#1a365d", marginBottom: 6 }}>
                ¿Cómo te contactamos?
              </div>
              <div style={{ fontSize: 13, color: "#718096", marginBottom: 20 }}>Solo necesitamos tu nombre y teléfono</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#4a5568", display: "block", marginBottom: 4 }}>Nombre *</label>
                  <input
                    value={respuestas.nombre} onChange={e => set("nombre", e.target.value)}
                    placeholder="Tu nombre completo" autoFocus
                    style={{ width: "100%", padding: "11px 14px", border: `1.5px solid ${respuestas.nombre.length >= 2 ? headerColor : "#e2e8f0"}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", color: "#1a365d" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#4a5568", display: "block", marginBottom: 4 }}>Teléfono / WhatsApp *</label>
                  <input
                    type="tel" value={respuestas.telefono} onChange={e => set("telefono", e.target.value)}
                    placeholder="+56 9 1234 5678"
                    style={{ width: "100%", padding: "11px 14px", border: `1.5px solid ${respuestas.telefono.replace(/\D/g,"").length >= 8 ? headerColor : "#e2e8f0"}`, borderRadius: 10, fontSize: 14, boxSizing: "border-box", color: "#1a365d" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#4a5568", display: "block", marginBottom: 4 }}>Ciudad (opcional)</label>
                  <input
                    value={respuestas.ciudad} onChange={e => set("ciudad", e.target.value)}
                    placeholder="Ej: La Serena, Coquimbo..."
                    style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 14, boxSizing: "border-box", color: "#1a365d" }}
                  />
                </div>
              </div>

              {/* Privacy note */}
              <div style={{ marginTop: 14, fontSize: 11, color: "#a0aec0", lineHeight: 1.5 }}>
                🔒 Tus datos son confidenciales y solo se usan para contactarte con el presupuesto.
              </div>
            </div>
          )}

          {/* ── Navegación ───────────────────────────────────────────────── */}
          <div style={{ display: "flex", gap: 10, marginTop: 28 }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                style={{ padding: "12px 20px", border: "1.5px solid #e2e8f0", borderRadius: 12, background: "white", color: "#718096", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                ← Atrás
              </button>
            )}
            {step < TOTAL_STEPS - 1 ? (
              <button
                onClick={() => canNext && setStep(s => s + 1)}
                disabled={!canNext}
                style={{ flex: 1, padding: "13px", borderRadius: 12, border: "none", background: canNext ? headerColor : "#e2e8f0", color: canNext ? "white" : "#a0aec0", fontWeight: 800, fontSize: 15, cursor: canNext ? "pointer" : "not-allowed", transition: "all .2s" }}>
                Siguiente →
              </button>
            ) : (
              <button
                onClick={handleEnviar}
                disabled={!canNext || enviando}
                style={{ flex: 1, padding: "13px", borderRadius: 12, border: "none", background: canNext ? headerColor : "#e2e8f0", color: canNext ? "white" : "#a0aec0", fontWeight: 800, fontSize: 15, cursor: canNext && !enviando ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {enviando ? (
                  <>
                    <div style={{ width: 16, height: 16, border: "2.5px solid rgba(255,255,255,.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin .7s linear infinite" }} />
                    Enviando...
                  </>
                ) : "✅ Enviar solicitud"}
              </button>
            )}
          </div>

          {error && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: "#fff5f5", borderRadius: 9, fontSize: 12, color: "#c53030", border: "1px solid #fed7d7" }}>
              ⚠️ {error}
            </div>
          )}

        </div>

        {/* Step counter */}
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: "#a0aec0" }}>
          Paso {step + 1} de {TOTAL_STEPS} · Powered by <strong>Obra Nova</strong>
        </div>

      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
