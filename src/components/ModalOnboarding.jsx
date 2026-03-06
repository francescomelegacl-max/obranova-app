// ─── components/ModalOnboarding.jsx ──────────────────────────────────────────
import { useState } from "react";

const STEPS = [
  {
    id: 1,
    emoji: "📋",
    titleKey: "onbStep1Title",
    descKey:  "onbStep1Desc",
    tipKey:   "onbStep1Tip",
    defaultTitle: "Datos del proyecto",
    defaultDesc:  "Ingresa el nombre del cliente, dirección de la obra y fechas. Esta información aparecerá en el PDF que le envíes.",
    defaultTip:   "💡 El cliente ve tu presupuesto en PDF — ponle su nombre correcto desde el inicio.",
    visual: () => (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { label: "Cliente", value: "Juan Pérez", icon: "👤" },
          { label: "Obra",    value: "Casa Providencia", icon: "📍" },
          { label: "Fecha",   value: "06/03/2026", icon: "📅" },
        ].map(({ label, value, icon }) => (
          <div key={label} style={{
            background: "rgba(255,255,255,.12)", borderRadius: 10,
            padding: "10px 14px", display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.55)", fontWeight: 600 }}>{label}</div>
              <div style={{ fontSize: 13, color: "white", fontWeight: 700 }}>{value}</div>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 2,
    emoji: "🏗️",
    titleKey: "onbStep2Title",
    descKey:  "onbStep2Desc",
    tipKey:   "onbStep2Tip",
    defaultTitle: "Agrega las partidas",
    defaultDesc:  "Cada partida es un ítem de costo: materiales, mano de obra, subcontratos. Ingresa cantidad y precio unitario — el total se calcula solo.",
    defaultTip:   "💡 En obra: usa el botón ➕ grande. Escribe rápido, guarda automático.",
    visual: () => (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {[
          { cat: "Materiales",   desc: "Cemento portland 25kg", cant: "40", pu: "8.500", total: "340.000" },
          { cat: "Mano de obra", desc: "Enfierradura losa",    cant: "120", pu: "4.200", total: "504.000" },
          { cat: "Materiales",   desc: "Fierro 10mm x 6m",     cant: "85",  pu: "6.300", total: "535.500" },
        ].map((row, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,.1)", borderRadius: 9,
            padding: "8px 12px", display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,.5)", fontWeight: 700 }}>{row.cat}</div>
              <div style={{ fontSize: 12, color: "white", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.desc}</div>
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)", flexShrink: 0 }}>{row.cant} × {row.pu}</div>
            <div style={{ fontSize: 13, color: "#fef08a", fontWeight: 800, flexShrink: 0 }}>$ {row.total}</div>
          </div>
        ))}
        {/* Totale */}
        <div style={{
          background: "rgba(255,255,255,.2)", borderRadius: 9,
          padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center",
          borderTop: "1px solid rgba(255,255,255,.2)",
        }}>
          <span style={{ fontSize: 12, color: "white", fontWeight: 700 }}>TOTAL DIRECTO</span>
          <span style={{ fontSize: 16, color: "#fef08a", fontWeight: 900 }}>$ 1.379.500</span>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    emoji: "🖨️",
    titleKey: "onbStep3Title",
    descKey:  "onbStep3Desc",
    tipKey:   "onbStep3Tip",
    defaultTitle: "Envía el presupuesto",
    defaultDesc:  "Ve a Vista Cliente, revisa qué ve el cliente, y manda el PDF por WhatsApp o email. También puedes enviar un link para firma digital.",
    defaultTip:   "💡 Objetivo: de cero a presupuesto enviado en menos de 5 minutos.",
    visual: () => (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {/* Preview PDF miniaturo */}
        <div style={{
          background: "white", borderRadius: 10, padding: "12px 14px",
          boxShadow: "0 4px 20px rgba(0,0,0,.3)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#1a365d" }}>PRESUPUESTO</div>
            <div style={{ fontSize: 9, color: "#276749", fontWeight: 700, background: "#f0fff4", padding: "2px 8px", borderRadius: 99, border: "1px solid #9ae6b4" }}>Enviado</div>
          </div>
          <div style={{ fontSize: 10, color: "#718096", marginBottom: 2 }}>Cliente: Juan Pérez</div>
          <div style={{ fontSize: 10, color: "#718096", marginBottom: 8 }}>Obra: Casa Providencia</div>
          <div style={{ height: 1, background: "#e2e8f0", marginBottom: 8 }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, color: "#4a5568", fontWeight: 600 }}>TOTAL</span>
            <span style={{ fontSize: 13, color: "#1a365d", fontWeight: 900 }}>$ 1.642.605</span>
          </div>
        </div>
        {/* Botones de envio */}
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, background: "#25D366", borderRadius: 9, padding: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <span style={{ fontSize: 16 }}>💬</span>
            <span style={{ fontSize: 12, color: "white", fontWeight: 700 }}>WhatsApp</span>
          </div>
          <div style={{ flex: 1, background: "rgba(255,255,255,.15)", borderRadius: 9, padding: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, border: "1px solid rgba(255,255,255,.2)" }}>
            <span style={{ fontSize: 16 }}>✍️</span>
            <span style={{ fontSize: 12, color: "white", fontWeight: 700 }}>Firma digital</span>
          </div>
        </div>
      </div>
    ),
  },
];

// ── Indicatore step ───────────────────────────────────────────────────────────
function StepDots({ total, current }) {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === current ? 22 : 7, height: 7, borderRadius: 99,
          background: i === current ? "white" : "rgba(255,255,255,.3)",
          transition: "all .3s ease",
        }} />
      ))}
    </div>
  );
}

// ── ModalOnboarding ───────────────────────────────────────────────────────────
export default function ModalOnboarding({ t = {}, onClose }) {
  const [step,    setStep]    = useState(0);
  const [exiting, setExiting] = useState(false);
  const [dir,     setDir]     = useState(1); // 1 = avanti, -1 = indietro

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;

  const navigate = (direction) => {
    setDir(direction);
    setExiting(true);
    setTimeout(() => {
      setStep(s => s + direction);
      setExiting(false);
    }, 180);
  };

  const handleClose = () => {
    setExiting(true);
    setTimeout(onClose, 200);
  };

  // Colori per step
  const STEP_GRADIENTS = [
    "linear-gradient(145deg, #1a365d 0%, #2b6cb0 100%)",
    "linear-gradient(145deg, #276749 0%, #38a169 100%)",
    "linear-gradient(145deg, #744210 0%, #c05621 100%)",
  ];

  const Visual = current.visual;

  return (
    <div
      onClick={e => e.target === e.currentTarget && handleClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 3000,
        background: "rgba(0,0,0,.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      <div style={{
        width: "100%", maxWidth: 400,
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 24px 80px rgba(0,0,0,.5)",
        transform: exiting
          ? `translateX(${dir * -40}px) scale(.97)`
          : "translateX(0) scale(1)",
        opacity: exiting ? 0 : 1,
        transition: "transform .18s ease, opacity .18s ease",
      }}>

        {/* ── Parte superiore colorata ── */}
        <div style={{
          background: STEP_GRADIENTS[step],
          padding: "24px 22px 20px",
          position: "relative",
          transition: "background .4s ease",
        }}>
          {/* Step number + close */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                background: "rgba(255,255,255,.2)", borderRadius: 99,
                padding: "3px 10px", fontSize: 11, color: "white", fontWeight: 700,
              }}>
                Paso {step + 1} de {STEPS.length}
              </div>
            </div>
            <button
              onClick={handleClose}
              style={{
                background: "rgba(255,255,255,.15)", border: "none", borderRadius: 8,
                cursor: "pointer", padding: "5px 11px", color: "white",
                fontSize: 14, fontWeight: 700, lineHeight: 1,
              }}>✕</button>
          </div>

          {/* Emoji + Título */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 40, marginBottom: 8, lineHeight: 1 }}>{current.emoji}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "white", lineHeight: 1.2, letterSpacing: -.3 }}>
              {t[current.titleKey] || current.defaultTitle}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.75)", marginTop: 6, lineHeight: 1.5 }}>
              {t[current.descKey] || current.defaultDesc}
            </div>
          </div>

          {/* Visual preview */}
          <Visual />

          {/* Dots */}
          <div style={{ marginTop: 18 }}>
            <StepDots total={STEPS.length} current={step} />
          </div>
        </div>

        {/* ── Parte inferiore bianca ── */}
        <div style={{ background: "white", padding: "18px 22px 22px" }}>

          {/* Tip */}
          <div style={{
            background: "#fffbeb", border: "1px solid #fef08a",
            borderRadius: 10, padding: "10px 14px",
            fontSize: 12, color: "#744210", lineHeight: 1.5,
            marginBottom: 16,
          }}>
            {t[current.tipKey] || current.defaultTip}
          </div>

          {/* Azioni */}
          <div style={{ display: "flex", gap: 10 }}>
            {step > 0 && (
              <button
                onClick={() => navigate(-1)}
                style={{
                  padding: "11px 18px", background: "#f0f4f8", color: "#4a5568",
                  border: "none", borderRadius: 10, cursor: "pointer",
                  fontWeight: 700, fontSize: 13,
                }}>← Atrás</button>
            )}
            <button
              onClick={isLast ? handleClose : () => navigate(1)}
              style={{
                flex: 1, padding: "12px",
                background: isLast
                  ? "linear-gradient(135deg,#276749,#38a169)"
                  : "linear-gradient(135deg,#1a365d,#2b6cb0)",
                color: "white", border: "none", borderRadius: 10,
                cursor: "pointer", fontWeight: 800, fontSize: 14,
                boxShadow: isLast
                  ? "0 4px 14px rgba(39,103,73,.4)"
                  : "0 4px 14px rgba(26,54,93,.4)",
                transition: "all .2s",
              }}>
              {isLast
                ? "✅ ¡Listo, empecemos!"
                : `Siguiente →`}
            </button>
          </div>

          {/* Skip */}
          {!isLast && (
            <div style={{ textAlign: "center", marginTop: 12 }}>
              <button
                onClick={handleClose}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#a0aec0", fontWeight: 600 }}>
                Saltar tutorial
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
