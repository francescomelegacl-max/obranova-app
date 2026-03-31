// ─── components/PaywallModal.jsx ─────────────────────────────────────────────
// Modal paywall riutilizzabile — mostrato quando l'utente Free tenta di usare
// una feature Pro. Passa onUpgrade per andare direttamente a TabPiani.

import { PAYWALL_FEATURES } from "../hooks/usePlan";

export default function PaywallModal({ feature, onGoToPiani, onClose }) {
  const info = PAYWALL_FEATURES[feature] || {
    title: "Función Pro",
    desc:  "Esta función está disponible en el plan Pro.",
    icon:  "⚡",
    plan:  "Pro",
  };

  const isEmpresa = info.plan === "Empresa";
  const gradient = isEmpresa ? "linear-gradient(135deg,#553c9a,#6b46c1)" : "linear-gradient(135deg,#2b6cb0,#553c9a)";
  const iconBg = isEmpresa ? "linear-gradient(135deg,#faf5ff,#e9d8fd)" : "linear-gradient(135deg,#ebf8ff,#bee3f8)";

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 9000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div style={{
        background: "white", borderRadius: 20, padding: 28, width: "100%", maxWidth: 400,
        boxShadow: "0 24px 64px rgba(0,0,0,.35)", textAlign: "center",
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: iconBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 32, margin: "0 auto 16px",
        }}>
          {info.icon}
        </div>

        <div style={{
          display: "inline-block", padding: "3px 12px", borderRadius: 99,
          background: gradient,
          color: "white", fontSize: 11, fontWeight: 700, marginBottom: 12,
        }}>
          {isEmpresa ? "🏢" : "⚡"} PLAN {info.plan.toUpperCase()}
        </div>

        <div style={{ fontSize: 20, fontWeight: 800, color: "#1a365d", marginBottom: 8 }}>
          {info.title}
        </div>
        <div style={{ fontSize: 13, color: "#718096", marginBottom: 24, lineHeight: 1.5 }}>
          {info.desc}
        </div>

        <button
          onClick={onGoToPiani}
          style={{
            width: "100%", padding: "14px", marginBottom: 10,
            background: gradient,
            color: "white", border: "none", borderRadius: 12,
            cursor: "pointer", fontWeight: 800, fontSize: 15,
          }}
        >
          {isEmpresa ? "🏢" : "⚡"} Ver planes y precios →
        </button>
        <button
          onClick={onClose}
          style={{
            width: "100%", padding: "10px",
            background: "#f7fafc", border: "1px solid #e2e8f0",
            borderRadius: 10, cursor: "pointer", color: "#718096",
            fontWeight: 600, fontSize: 13,
          }}
        >
          Ahora no
        </button>

        <div style={{ fontSize: 11, color: "#a0aec0", marginTop: 12 }}>
          {isEmpresa
            ? <>Plan Empresa desde <strong style={{ color: "#553c9a" }}>$ 39.900 / mes</strong></>
            : <>Plan Pro desde <strong style={{ color: "#2b6cb0" }}>$ 19.900 / mes</strong></>
          }
        </div>
      </div>
    </div>
  );
}
