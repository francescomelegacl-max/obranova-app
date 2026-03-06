// ─── components/tabs/TabPiani.jsx ─────────────────────────────────────────────
// Schermata piani Free / Pro / Team con MercadoPago (link esterni)
//
// ─── ISTRUZIONI SETUP MERCADOPAGO ────────────────────────────────────────────
// 1. Vai su mercadopago.cl → Tu negocio → Cobros → Link de pago
// 2. Crea 5 link:
//    a) "Pro Mensual"        → $19.900 CLP ricorrente mensile  → MP_PRO_MENSUAL
//    b) "Team Mensual"       → $39.900 CLP ricorrente mensile  → MP_TEAM_MENSUAL
//    c) "Activación Pro"     → $29.900 CLP una tantum          → MP_ACTIVACION_PRO
//    d) "Activación Team"    → $49.900 CLP una tantum          → MP_ACTIVACION_TEAM
//    e) "Migración Datos"    → $19.900 CLP una tantum          → MP_MIGRACION
// 3. Sostituisci le costanti qui sotto con i tuoi link reali
// 4. Aggiorna WA_CONTACTO con il tuo numero WhatsApp
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";

const MP_PRO_MENSUAL     = "https://mpago.la/TULINK_PRO";
const MP_TEAM_MENSUAL    = "https://mpago.la/TULINK_TEAM";
const MP_ACTIVACION_PRO  = "https://mpago.la/TULINK_ACT_PRO";
const MP_ACTIVACION_TEAM = "https://mpago.la/TULINK_ACT_TEAM";
const MP_MIGRACION       = "https://mpago.la/TULINK_MIGRACION";
const WA_CONTACTO        = "https://wa.me/56900000000?text=Hola,%20quiero%20saber%20más%20sobre%20Obra%20Nova";

// ── Definición de planes ──────────────────────────────────────────────────────
const PIANI = [
  {
    id:           "free",
    nombre:       "Free",
    emoji:        "🔓",
    precio:       0,
    precioStr:    "Gratis",
    activacion:   null,
    color:        "#718096",
    colorLight:   "#f7fafc",
    border:       "#e2e8f0",
    features: [
      { ok: true,  text: "3 proyectos activos" },
      { ok: true,  text: "1 usuario" },
      { ok: true,  text: "PDF con logo Obra Nova" },
      { ok: true,  text: "Historial 60 días" },
      { ok: false, text: "PDF con tu logo" },
      { ok: false, text: "Proyectos ilimitados" },
      { ok: false, text: "Templates guardados" },
      { ok: false, text: "Agenda + Gantt" },
      { ok: false, text: "Export Excel/CSV" },
      { ok: false, text: "Facturas" },
      { ok: false, text: "Firma digital" },
    ],
    linkMensual:    null,
    linkActivacion: null,
    ctaLabel:       "Plan actual",
  },
  {
    id:               "pro",
    nombre:           "Pro",
    emoji:            "⚡",
    badge:            "Más popular",
    precio:           19900,
    precioStr:        "$ 19.900",
    activacion:       29900,
    activacionStr:    "$ 29.900",
    color:            "#2b6cb0",
    colorLight:       "#ebf8ff",
    border:           "#bee3f8",
    features: [
      { ok: true,  text: "Proyectos ilimitados" },
      { ok: true,  text: "1 usuario" },
      { ok: true,  text: "PDF con tu logo y colores" },
      { ok: true,  text: "Historial ilimitado" },
      { ok: true,  text: "Templates guardados" },
      { ok: true,  text: "Agenda + Gantt" },
      { ok: true,  text: "Export Excel/CSV" },
      { ok: true,  text: "Facturas" },
      { ok: true,  text: "Firma digital" },
      { ok: false, text: "Multi-usuario (hasta 5)" },
      { ok: false, text: "Notificaciones WhatsApp" },
    ],
    linkMensual:    MP_PRO_MENSUAL,
    linkActivacion: MP_ACTIVACION_PRO,
    ctaLabel:       "Activar Pro →",
    migracion:      { label: "Migración de datos", precio: 19900, link: MP_MIGRACION },
  },
  {
    id:                   "team",
    nombre:               "Team",
    emoji:                "👥",
    precio:               39900,
    precioStr:            "$ 39.900",
    activacion:           49900,
    activacionStr:        "$ 49.900",
    activacionIncludes:   "Onboarding 1h WhatsApp + Migración datos incluida",
    color:                "#553c9a",
    colorLight:           "#faf5ff",
    border:               "#d6bcfa",
    features: [
      { ok: true, text: "Todo lo de Pro" },
      { ok: true, text: "Hasta 5 usuarios" },
      { ok: true, text: "Multi-workspace" },
      { ok: true, text: "Notificaciones WhatsApp" },
      { ok: true, text: "Onboarding 1h WhatsApp incluido" },
      { ok: true, text: "Migración de datos incluida" },
      { ok: true, text: "Proyectos ilimitados" },
      { ok: true, text: "PDF con tu logo y colores" },
      { ok: true, text: "Historial ilimitado" },
      { ok: true, text: "Templates + Agenda + Gantt" },
      { ok: true, text: "Export Excel/CSV + Facturas" },
    ],
    linkMensual:    MP_TEAM_MENSUAL,
    linkActivacion: MP_ACTIVACION_TEAM,
    ctaLabel:       "Activar Team →",
  },
];

// ── Card singolo piano ─────────────────────────────────────────────────────────
function PlanCard({ plan, isCurrent, isMobile }) {
  const [showAll, setShowAll] = useState(false);
  const isPopular = !!plan.badge;
  const visibleFeatures = showAll ? plan.features : plan.features.slice(0, 5);

  return (
    <div
      style={{
        background:   "white",
        border:       `2px solid ${isCurrent ? plan.color : isPopular ? plan.color + "88" : "#e2e8f0"}`,
        borderRadius: 16,
        overflow:     "hidden",
        boxShadow:    isPopular ? `0 8px 32px ${plan.color}22` : "0 2px 8px rgba(0,0,0,.06)",
        flex:         isMobile ? "none" : 1,
        width:        isMobile ? "100%" : "auto",
        position:     "relative",
        transition:   "transform .2s, box-shadow .2s",
      }}
      onMouseEnter={e => {
        if (!isMobile) {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = `0 16px 48px ${plan.color}33`;
        }
      }}
      onMouseLeave={e => {
        if (!isMobile) {
          e.currentTarget.style.transform = "none";
          e.currentTarget.style.boxShadow = isPopular ? `0 8px 32px ${plan.color}22` : "0 2px 8px rgba(0,0,0,.06)";
        }
      }}
    >
      {/* Badge popolare */}
      {isPopular && (
        <div style={{
          background: plan.color, color: "white",
          textAlign: "center", padding: "5px 0",
          fontSize: 11, fontWeight: 800, letterSpacing: .5,
        }}>
          ⭐ {plan.badge}
        </div>
      )}

      {/* Header */}
      <div style={{
        background:   `linear-gradient(135deg, ${plan.color}18, ${plan.color}05)`,
        padding:      `${isPopular ? 16 : 20}px 20px 16px`,
        borderBottom: `1px solid ${plan.border}`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 26, marginBottom: 4 }}>{plan.emoji}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: plan.color }}>{plan.nombre}</div>
          </div>
          {isCurrent && (
            <span style={{
              background: plan.color, color: "white",
              borderRadius: 99, padding: "3px 10px",
              fontSize: 10, fontWeight: 800,
            }}>✓ Activo</span>
          )}
        </div>

        {/* Prezzo */}
        <div style={{ marginTop: 10 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: plan.precio === 0 ? 24 : 28, fontWeight: 900, color: "#1a365d" }}>
              {plan.precioStr}
            </span>
            {plan.precio > 0 && (
              <span style={{ fontSize: 12, color: "#718096" }}>CLP/mes</span>
            )}
          </div>

          {/* Fee attivazione */}
          {plan.activacion && (
            <div style={{
              marginTop: 8, fontSize: 11, color: "#718096",
              background: "white", borderRadius: 8, padding: "6px 10px",
              border: `1px solid ${plan.border}`, display: "inline-block",
              lineHeight: 1.5,
            }}>
              <span style={{ fontWeight: 700, color: "#2d3748" }}>
                + {plan.activacionStr} activación
              </span>
              {" "}(pago único)
              {plan.activacionIncludes && (
                <div style={{ fontSize: 10, color: plan.color, fontWeight: 600, marginTop: 2 }}>
                  ✓ {plan.activacionIncludes}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Features + CTA */}
      <div style={{ padding: "16px 20px" }}>

        {/* Lista features */}
        <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
          {visibleFeatures.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                fontSize: 12, flexShrink: 0, fontWeight: 700,
                color: f.ok ? plan.color : "#e2e8f0",
                width: 14, textAlign: "center",
              }}>
                {f.ok ? "✓" : "✗"}
              </span>
              <span style={{
                fontSize: 12,
                color: f.ok ? "#2d3748" : "#b0bec5",
                fontWeight: f.ok ? 500 : 400,
              }}>
                {f.text}
              </span>
            </div>
          ))}
        </div>

        {plan.features.length > 5 && (
          <button
            onClick={() => setShowAll(v => !v)}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 11, color: plan.color, fontWeight: 700,
              padding: "0 0 12px", display: "block",
            }}>
            {showAll ? "▲ Ver menos" : `▼ Ver todas (${plan.features.length})`}
          </button>
        )}

        {/* Addon migrazione per Pro */}
        {plan.migracion && !isCurrent && (
          <div style={{
            background: "#fffbeb", border: "1px solid #fef08a",
            borderRadius: 9, padding: "8px 12px", marginBottom: 12,
            fontSize: 11, color: "#744210", lineHeight: 1.5,
          }}>
            <span style={{ fontWeight: 700 }}>+ Migración de datos:</span>{" "}
            <strong>$ {plan.migracion.precio.toLocaleString("es-CL")} CLP</strong> pago único
            <a href={plan.migracion.link} target="_blank" rel="noopener noreferrer"
              style={{ marginLeft: 8, color: "#c05621", fontWeight: 700, fontSize: 10 }}>
              Contratar →
            </a>
          </div>
        )}

        {/* CTA */}
        {plan.linkMensual && !isCurrent ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <a
              href={plan.linkActivacion}
              target="_blank" rel="noopener noreferrer"
              style={{
                display: "block", padding: "12px",
                background: plan.color, color: "white",
                borderRadius: 10, fontWeight: 800, fontSize: 14,
                textAlign: "center", textDecoration: "none",
                boxShadow: `0 4px 14px ${plan.color}44`,
              }}>
              {plan.ctaLabel}
            </a>
            <a
              href={plan.linkMensual}
              target="_blank" rel="noopener noreferrer"
              style={{
                display: "block", padding: "9px",
                background: plan.colorLight, color: plan.color,
                borderRadius: 9, fontWeight: 600, fontSize: 11,
                textAlign: "center", textDecoration: "none",
                border: `1px solid ${plan.border}`,
              }}>
              Solo suscripción mensual (sin activación)
            </a>
          </div>
        ) : (
          <div style={{
            padding: "11px",
            background: isCurrent ? plan.colorLight : "#f0f4f8",
            color: isCurrent ? plan.color : "#718096",
            borderRadius: 10, fontWeight: 700, fontSize: 13, textAlign: "center",
            border: isCurrent ? `1px solid ${plan.border}` : "none",
          }}>
            {isCurrent ? `✓ Plan activo` : plan.ctaLabel}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Banner sconto annuale ──────────────────────────────────────────────────────
function BannerAnual({ planActual }) {
  const plan = PIANI.find(p => p.id === planActual);
  if (!plan?.precio) return null;
  const risparmio = Math.round(plan.precio * 12 * 0.12);

  return (
    <div style={{
      background: "linear-gradient(135deg,#276749,#38a169)",
      borderRadius: 14, padding: "16px 20px",
      display: "flex", alignItems: "center",
      justifyContent: "space-between", flexWrap: "wrap", gap: 12,
    }}>
      <div>
        <div style={{ fontWeight: 800, fontSize: 14, color: "white" }}>
          💰 Paga anual y ahorra 12%
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.8)", marginTop: 3 }}>
          Ahorras <strong>$ {risparmio.toLocaleString("es-CL")} CLP al año</strong> — escríbenos para activarlo
        </div>
      </div>
      <a href={WA_CONTACTO} target="_blank" rel="noopener noreferrer"
        style={{
          padding: "9px 18px", background: "white", color: "#276749",
          borderRadius: 9, fontWeight: 800, fontSize: 13,
          textDecoration: "none", whiteSpace: "nowrap",
        }}>
        💬 Consultar plan anual
      </a>
    </div>
  );
}

// ── TabPiani principale ────────────────────────────────────────────────────────
export default function TabPiani({ workspace }) {
  const planActual = workspace?.plan || "free";
  const isMobile   = window.innerWidth < 768;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 960, margin: "0 auto" }}>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg,#1a365d 0%,#553c9a 100%)",
        borderRadius: 16, padding: "28px 24px", textAlign: "center",
      }}>
        <div style={{ fontSize: 38, marginBottom: 8 }}>💎</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: "white", marginBottom: 6 }}>
          Planes Obra Nova
        </div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,.7)", maxWidth: 420, margin: "0 auto 14px" }}>
          Sin contratos. Sin sorpresas. Cancela cuando quieras.
        </div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(255,255,255,.15)", borderRadius: 99,
          padding: "6px 16px", fontSize: 12, color: "white", fontWeight: 700,
        }}>
          Plan actual:{" "}
          <span style={{ color: "#fef08a", textTransform: "capitalize", marginLeft: 4 }}>
            {planActual}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: 16,
        alignItems: isMobile ? "stretch" : "flex-start",
      }}>
        {PIANI.map(plan => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrent={plan.id === planActual}
            isMobile={isMobile}
          />
        ))}
      </div>

      {/* Banner annuale */}
      <BannerAnual planActual={planActual} />

      {/* Cosa include l'attivazione */}
      <div style={{ background: "white", borderRadius: 14, padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d", marginBottom: 14 }}>
          🚀 ¿Qué incluye la activación?
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
          {[
            { icon: "⚙️", title: "Configuración inicial",      desc: "Configuramos tu workspace con nombre, logo y colores de tu empresa" },
            { icon: "📦", title: "Migración de datos",         desc: "Importamos tus presupuestos desde Excel o papel (incluida en Team, addon en Pro)" },
            { icon: "🎓", title: "Onboarding vía WhatsApp",    desc: "1 hora de capacitación en vivo para ti y tu equipo (solo plan Team)" },
            { icon: "🔧", title: "Soporte prioritario 30 días",desc: "Acceso directo al equipo técnico durante el primer mes" },
          ].map(({ icon, title, desc }) => (
            <div key={title} style={{
              display: "flex", gap: 12, padding: "12px 14px",
              background: "#f7fafc", borderRadius: 10, border: "1px solid #e2e8f0",
            }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#1a365d", marginBottom: 3 }}>{title}</div>
                <div style={{ fontSize: 11, color: "#718096", lineHeight: 1.5 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div style={{ background: "white", borderRadius: 14, padding: "20px 22px", boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d", marginBottom: 14 }}>❓ Preguntas frecuentes</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { q: "¿Puedo cancelar cuando quiera?",          a: "Sí. Cancelas desde tu cuenta de MercadoPago en cualquier momento. Tu plan sigue activo hasta el fin del período pagado." },
            { q: "¿Es obligatorio pagar la activación?",    a: "No. Puedes suscribirte solo al plan mensual. La activación incluye configuración guiada, migración y soporte prioritario — si prefieres hacerlo solo, usa el botón 'Solo suscripción mensual'." },
            { q: "¿Qué pasa con mis datos si bajo a Free?", a: "Todos tus proyectos se conservan. En Free puedes tener 3 activos — los demás quedan archivados y los recuperas si vuelves a Pro o Team." },
            { q: "¿Cómo pago?",                             a: "Tarjeta de débito o crédito chilena a través de MercadoPago. El cobro mensual es automático." },
            { q: "¿Hay descuento pagando anual?",           a: "Sí, 12% de descuento pagando el año completo. Escríbenos por WhatsApp y te generamos el link de pago anual en minutos." },
          ].map(({ q, a }, i, arr) => (
            <div key={i} style={{ borderBottom: i < arr.length - 1 ? "1px solid #f0f4f8" : "none", paddingBottom: i < arr.length - 1 ? 14 : 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#2d3748", marginBottom: 4 }}>{q}</div>
              <div style={{ fontSize: 12, color: "#718096", lineHeight: 1.6 }}>{a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Contatto WhatsApp */}
      <div style={{
        background: "#fffbeb", border: "1px solid #fef08a",
        borderRadius: 12, padding: "14px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 10,
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#744210" }}>¿Tienes dudas antes de suscribirte?</div>
          <div style={{ fontSize: 12, color: "#92600a", marginTop: 2 }}>Respondemos en menos de 1 hora — también podemos hacer una demo en vivo</div>
        </div>
        <a href={WA_CONTACTO} target="_blank" rel="noopener noreferrer"
          style={{
            padding: "10px 20px", background: "#25D366", color: "white",
            borderRadius: 9, fontWeight: 800, fontSize: 13,
            textDecoration: "none", display: "flex", alignItems: "center", gap: 6,
            whiteSpace: "nowrap",
          }}>
          💬 WhatsApp
        </a>
      </div>

    </div>
  );
}
