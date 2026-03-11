// ─── components/LandingPage.jsx ──────────────────────────────────────────────
// Landing page pubblica — accessibile su app.obranova.cl/
// Route: pathname === "/" o "/landing"
// Design: industrial-refined, dark navy + giallo cantiere
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";

// ── Costanti ──────────────────────────────────────────────────────────────────
const APP_URL       = "/app";   // cambia in "https://app.obranova.cl/app" se domini diversi
const TRIAL_DAYS    = 14;
const WA_CONTACTO   = "https://wa.me/56942981608?text=Hola%2C%20quiero%20saber%20m%C3%A1s%20sobre%20Obra%20Nova";

const COLORS = {
  navy:    "#0f1b2d",
  navyMid: "#162236",
  navyLight:"#1e3a5f",
  yellow:  "#f5a623",
  yellowHover: "#e8941a",
  white:   "#ffffff",
  gray:    "#8a9bb5",
  grayLight:"#c5d0e0",
  border:  "rgba(255,255,255,0.08)",
};

// ── Features principali ───────────────────────────────────────────────────────
const FEATURES = [
  { icon: "📋", title: "Presupuestos en minutos", desc: "Crea presupuestos profesionales con partidas, categorías y totales automáticos. Envía PDF al cliente en un clic." },
  { icon: "✍️", title: "Firma digital del cliente", desc: "El cliente firma desde su celular sin instalar nada. El estado del proyecto se actualiza automáticamente." },
  { icon: "📊", title: "Control de costos real", desc: "Visualiza márgenes, gastos e imprevistos en tiempo real. Export a Excel con un clic." },
  { icon: "🏗️", title: "Gestión de obra completa", desc: "Proyectos, bodega, agenda y facturas en un solo lugar. Trabaja desde el celular en la obra." },
  { icon: "💬", title: "WhatsApp integrado", desc: "Notifica al cliente el estado del proyecto con mensajes predefinidos. Sin copiar y pegar." },
  { icon: "👥", title: "Trabajo en equipo", desc: "Invita a tu equipo con roles diferenciados. Cada uno ve solo lo que necesita." },
];

// ── Testimonios ───────────────────────────────────────────────────────────────
const TESTIMONIOS = [
  { nombre: "Carlos M.", empresa: "Construcciones del Norte", texto: "Antes perdía 2 horas por presupuesto. Ahora en 20 minutos lo tengo listo y enviado al cliente.", stars: 5 },
  { nombre: "Ana L.", empresa: "Remodelaciones AL", texto: "La firma digital fue un cambio total. Los clientes firman al momento, sin imprimir nada.", stars: 5 },
  { nombre: "Roberto P.", empresa: "RP Obras", texto: "Llevo el control de 8 obras al mismo tiempo desde el celular. Imposible antes.", stars: 5 },
];

// ── Planes ────────────────────────────────────────────────────────────────────
const PLANES = [
  {
    id: "free", nombre: "Free", precio: "Gratis", periodo: "",
    color: COLORS.gray, highlight: false,
    features: ["3 proyectos activos", "PDF con marca Obra Nova", "Presupuestos básicos", "App móvil PWA"],
    noFeatures: ["Proyectos ilimitados", "PDF personalizado", "Export Excel", "Firma digital", "Facturas", "Templates"],
    cta: "Empezar gratis", href: `${APP_URL}`,
  },
  {
    id: "pro", nombre: "Pro", precio: "$19.900", periodo: "/mes",
    color: COLORS.yellow, highlight: true,
    badge: "Más popular",
    features: ["Proyectos ilimitados", "PDF con tu logo y colores", "Export Excel", "Firma digital cliente", "Facturas", "Templates reutilizables", "Agenda + control de obra", "Soporte prioritario"],
    noFeatures: [],
    cta: `Probar ${TRIAL_DAYS} días gratis`, href: `${APP_URL}`,
  },
  {
    id: "team", nombre: "Team", precio: "$39.900", periodo: "/mes",
    color: "#60a5fa", highlight: false,
    features: ["Todo Pro +", "Hasta 5 usuarios", "Roles y permisos", "Dashboard compartido", "Historial completo"],
    noFeatures: [],
    cta: "Hablar con ventas", href: WA_CONTACTO,
  },
];

// ── Componente Stats animato ──────────────────────────────────────────────────
function AnimatedNumber({ target, suffix = "", duration = 2000 }) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = Date.now();
        const tick = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(Math.round(eased * target));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{value.toLocaleString("es-CL")}{suffix}</span>;
}

// ── Hook: scroll position ─────────────────────────────────────────────────────
function useScrolled(threshold = 60) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > threshold);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, [threshold]);
  return scrolled;
}

// ── Hook: intersection observer per animazioni ────────────────────────────────
function useFadeIn() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, visible];
}

// ── CSS globale ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700&family=Barlow+Condensed:wght@700;800;900&display=swap');

  .landing-root * { box-sizing: border-box; }
  .landing-root { font-family: 'Barlow', sans-serif; background: ${COLORS.navy}; color: ${COLORS.white}; }

  .landing-btn-primary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 14px 28px; background: ${COLORS.yellow}; color: ${COLORS.navy};
    border: none; border-radius: 6px; font-family: 'Barlow', sans-serif;
    font-weight: 800; font-size: 15px; cursor: pointer; text-decoration: none;
    transition: background 0.2s, transform 0.15s;
    letter-spacing: 0.3px;
  }
  .landing-btn-primary:hover { background: ${COLORS.yellowHover}; transform: translateY(-1px); }

  .landing-btn-ghost {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 13px 26px; background: transparent; color: ${COLORS.white};
    border: 1.5px solid ${COLORS.border}; border-radius: 6px;
    font-family: 'Barlow', sans-serif; font-weight: 700; font-size: 15px;
    cursor: pointer; text-decoration: none;
    transition: border-color 0.2s, background 0.2s;
  }
  .landing-btn-ghost:hover { border-color: rgba(255,255,255,0.3); background: rgba(255,255,255,0.05); }

  .fade-up { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
  .fade-up.visible { opacity: 1; transform: translateY(0); }

  .feature-card {
    background: ${COLORS.navyMid}; border: 1px solid ${COLORS.border};
    border-radius: 12px; padding: 28px 24px;
    transition: border-color 0.2s, transform 0.2s;
  }
  .feature-card:hover { border-color: rgba(245,166,35,0.3); transform: translateY(-3px); }

  .plan-card {
    border-radius: 14px; padding: 32px 28px;
    transition: transform 0.2s;
    position: relative;
  }
  .plan-card:hover { transform: translateY(-4px); }

  .star { color: ${COLORS.yellow}; font-size: 14px; }

  @keyframes grain {
    0%, 100% { transform: translate(0,0); }
    10% { transform: translate(-2%,-3%); }
    20% { transform: translate(3%,1%); }
    30% { transform: translate(-1%,4%); }
    40% { transform: translate(4%,-2%); }
    50% { transform: translate(-3%,3%); }
    60% { transform: translate(1%,-4%); }
    70% { transform: translate(-4%,2%); }
    80% { transform: translate(2%,4%); }
    90% { transform: translate(-2%,-1%); }
  }

  @media (max-width: 768px) {
    .hide-mobile { display: none !important; }
    .landing-hero-title { font-size: clamp(40px, 10vw, 80px) !important; }
  }
`;

// ── LandingPage ───────────────────────────────────────────────────────────────
export default function LandingPage({ onGoToApp }) {
  const scrolled = useScrolled();
  const [featRef, featVisible] = useFadeIn();
  const [statsRef, statsVisible] = useFadeIn();
  const [testRef, testVisible] = useFadeIn();
  const [pricingRef, pricingVisible] = useFadeIn();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const goToApp = (e) => {
    e?.preventDefault();
    if (onGoToApp) { onGoToApp(); return; }
    window.location.href = APP_URL;
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div className="landing-root">

        {/* ── NAVBAR ── */}
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          padding: "0 24px",
          background: scrolled ? "rgba(15,27,45,0.95)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? `1px solid ${COLORS.border}` : "none",
          transition: "all 0.3s ease",
        }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, background: COLORS.yellow, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, color: COLORS.navy }}>O</div>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 20, letterSpacing: 1 }}>
                OBRA<span style={{ color: COLORS.yellow }}>NOVA</span>
              </span>
            </div>

            {/* Nav links desktop */}
            <div className="hide-mobile" style={{ display: "flex", alignItems: "center", gap: 32 }}>
              {[["Funciones", "#features"], ["Precios", "#precios"], ["Contacto", WA_CONTACTO]].map(([label, href]) => (
                <a key={label} href={href} style={{ color: COLORS.grayLight, textDecoration: "none", fontSize: 14, fontWeight: 600, transition: "color 0.2s" }}
                  onMouseEnter={e => e.target.style.color = COLORS.white}
                  onMouseLeave={e => e.target.style.color = COLORS.grayLight}>
                  {label}
                </a>
              ))}
            </div>

            {/* CTA */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button onClick={goToApp} className="landing-btn-ghost" style={{ padding: "9px 18px", fontSize: 13 }}>
                Iniciar sesión
              </button>
              <button onClick={goToApp} className="landing-btn-primary" style={{ padding: "9px 18px", fontSize: 13 }}>
                Prueba gratis
              </button>
            </div>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section style={{
          minHeight: "100vh", display: "flex", alignItems: "center",
          position: "relative", overflow: "hidden",
          padding: "100px 24px 60px",
        }}>
          {/* Grain texture overlay */}
          <div style={{
            position: "absolute", inset: "-50%", opacity: 0.04,
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
            backgroundSize: "128px 128px",
            animation: "grain 8s steps(1) infinite",
          }} />

          {/* Gradient radiale sfondo */}
          <div style={{
            position: "absolute", inset: 0,
            background: `radial-gradient(ellipse 80% 60% at 60% 40%, ${COLORS.navyLight}55 0%, transparent 70%)`,
            pointerEvents: "none",
          }} />

          {/* Grid pattern */}
          <div style={{
            position: "absolute", inset: 0, opacity: 0.03,
            backgroundImage: `linear-gradient(${COLORS.white} 1px, transparent 1px), linear-gradient(90deg, ${COLORS.white} 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }} />

          <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%", position: "relative", zIndex: 1 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>

              {/* Left */}
              <div>
                {/* Badge */}
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "6px 14px", borderRadius: 99,
                  border: `1px solid ${COLORS.yellow}44`,
                  background: `${COLORS.yellow}11`,
                  marginBottom: 24,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.yellow, display: "inline-block", animation: "pulse 2s infinite" }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.yellow, letterSpacing: 1 }}>
                    {TRIAL_DAYS} DÍAS GRATIS · SIN TARJETA
                  </span>
                </div>

                <h1 className="landing-hero-title" style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "clamp(52px, 7vw, 88px)",
                  fontWeight: 900, lineHeight: 0.95,
                  margin: "0 0 24px",
                  letterSpacing: "-1px",
                }}>
                  PRESUPUESTOS<br />
                  <span style={{ color: COLORS.yellow, fontStyle: "italic" }}>QUE CIERRAN</span><br />
                  CONTRATOS
                </h1>

                <p style={{
                  fontSize: 17, color: COLORS.grayLight, lineHeight: 1.65,
                  margin: "0 0 36px", maxWidth: 460,
                }}>
                  El software de gestión para constructoras y maestros en Chile.
                  Presupuesta, firma y controla tus obras — todo desde el celular.
                </p>

                <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                  <button onClick={goToApp} className="landing-btn-primary" style={{ fontSize: 16, padding: "16px 32px" }}>
                    Empezar gratis →
                  </button>
                  <a href={WA_CONTACTO} target="_blank" rel="noopener noreferrer" className="landing-btn-ghost" style={{ fontSize: 16, padding: "16px 32px" }}>
                    💬 Ver demo en vivo
                  </a>
                </div>

                {/* Social proof */}
                <div style={{ marginTop: 36, display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ display: "flex" }}>
                    {["#f5a623","#60a5fa","#68d391","#f687b3"].map((c, i) => (
                      <div key={i} style={{
                        width: 32, height: 32, borderRadius: "50%",
                        background: c, border: `2px solid ${COLORS.navy}`,
                        marginLeft: i > 0 ? -10 : 0, fontSize: 13, fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: COLORS.navy,
                      }}>
                        {["C","A","R","M"][i]}
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 13, color: COLORS.gray }}>
                    <span style={{ color: COLORS.white, fontWeight: 700 }}>+50 constructoras</span> ya usan Obra Nova
                  </div>
                </div>
              </div>

              {/* Right — App mockup */}
              <div className="hide-mobile" style={{ position: "relative" }}>
                <div style={{
                  background: COLORS.navyMid,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 16, overflow: "hidden",
                  boxShadow: "0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
                }}>
                  {/* Barra titolo mockup */}
                  <div style={{ background: "#0a1525", padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                    {["#ff5f57","#febc2e","#28c840"].map(c => (
                      <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
                    ))}
                    <div style={{ flex: 1, margin: "0 12px", background: COLORS.navyMid, borderRadius: 4, height: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 10, color: COLORS.gray }}>app.obranova.cl</span>
                    </div>
                  </div>

                  {/* Contenuto mockup */}
                  <div style={{ padding: 20 }}>
                    {/* Header app */}
                    <div style={{ background: "linear-gradient(135deg,#1a365d,#2d3748)", borderRadius: 10, padding: "12px 16px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ color: "white", fontWeight: 800, fontSize: 13 }}>Constructora Demo</div>
                        <div style={{ color: "#a0aec0", fontSize: 10 }}>Plan Pro · 14 días de prueba</div>
                      </div>
                      <div style={{ background: COLORS.yellow, color: COLORS.navy, padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 800 }}>PRO</div>
                    </div>

                    {/* Cards proyectos */}
                    {[
                      { nombre: "Remodelación cocina López", estado: "En obra", total: "$ 3.450.000", color: "#3182ce" },
                      { nombre: "Pintura interior Pérez", estado: "Aceptado", total: "$ 890.000", color: "#38a169" },
                      { nombre: "Ampliación garage Torres", estado: "Enviado", total: "$ 5.200.000", color: "#d69e2e" },
                    ].map((p, i) => (
                      <div key={i} style={{
                        background: "#0f1b2d", borderRadius: 8, padding: "10px 14px", marginBottom: 8,
                        border: "1px solid rgba(255,255,255,0.06)",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                      }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "white", marginBottom: 2 }}>{p.nombre}</div>
                          <div style={{ fontSize: 9, color: p.color, fontWeight: 700, background: `${p.color}22`, padding: "2px 7px", borderRadius: 99, display: "inline-block" }}>{p.estado}</div>
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: "#68d391" }}>{p.total}</div>
                      </div>
                    ))}

                    {/* Footer mockup */}
                    <div style={{ marginTop: 12, display: "flex", gap: 6 }}>
                      {["📋","🏗️","💰","📊","⚙️"].map((icon, i) => (
                        <div key={i} style={{
                          flex: 1, background: i === 0 ? `${COLORS.yellow}22` : "#0a1525",
                          borderRadius: 8, padding: "8px 4px", textAlign: "center", fontSize: 14,
                          border: i === 0 ? `1px solid ${COLORS.yellow}44` : "1px solid rgba(255,255,255,0.04)",
                        }}>{icon}</div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating badge */}
                <div style={{
                  position: "absolute", top: -16, right: -16,
                  background: COLORS.yellow, color: COLORS.navy,
                  borderRadius: 10, padding: "10px 14px",
                  boxShadow: "0 8px 24px rgba(245,166,35,0.4)",
                  fontSize: 11, fontWeight: 800, textAlign: "center",
                }}>
                  ✅ Firma recibida<br />
                  <span style={{ fontSize: 9, fontWeight: 600 }}>hace 2 minutos</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <section ref={statsRef} style={{ padding: "60px 24px", borderTop: `1px solid ${COLORS.border}`, borderBottom: `1px solid ${COLORS.border}` }}>
          <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 40, textAlign: "center" }}>
            {[
              { label: "Presupuestos creados", value: 2400, suffix: "+" },
              { label: "Constructoras activas", value: 50, suffix: "+" },
              { label: "Firmas digitales", value: 890, suffix: "+" },
              { label: "Horas ahorradas/mes", value: 120, suffix: "h" },
            ].map(s => (
              <div key={s.label} className={`fade-up ${statsVisible ? "visible" : ""}`}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 52, fontWeight: 900, color: COLORS.yellow, lineHeight: 1 }}>
                  {statsVisible ? <AnimatedNumber target={s.value} suffix={s.suffix} /> : `0${s.suffix}`}
                </div>
                <div style={{ fontSize: 13, color: COLORS.gray, marginTop: 6, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" ref={featRef} style={{ padding: "100px 24px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 60 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.yellow, letterSpacing: 2, marginBottom: 12 }}>FUNCIONES</div>
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900, margin: 0, lineHeight: 1 }}>
                TODO LO QUE NECESITAS<br />
                <span style={{ color: COLORS.yellow }}>PARA CRECER</span>
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
              {FEATURES.map((f, i) => (
                <div key={i} className={`feature-card fade-up ${featVisible ? "visible" : ""}`} style={{ transitionDelay: `${i * 80}ms` }}>
                  <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
                  <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8, color: COLORS.white }}>{f.title}</div>
                  <div style={{ fontSize: 14, color: COLORS.gray, lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIOS ── */}
        <section ref={testRef} style={{ padding: "80px 24px", background: COLORS.navyMid }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 50 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.yellow, letterSpacing: 2, marginBottom: 12 }}>TESTIMONIOS</div>
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, margin: 0 }}>
                LO DICEN NUESTROS CLIENTES
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
              {TESTIMONIOS.map((t, i) => (
                <div key={i} className={`fade-up ${testVisible ? "visible" : ""}`}
                  style={{ transitionDelay: `${i * 100}ms`, background: COLORS.navy, borderRadius: 12, padding: "24px 22px", border: `1px solid ${COLORS.border}` }}>
                  <div style={{ marginBottom: 12 }}>
                    {Array.from({ length: t.stars }).map((_, j) => <span key={j} className="star">★</span>)}
                  </div>
                  <p style={{ fontSize: 14, color: COLORS.grayLight, lineHeight: 1.65, margin: "0 0 16px", fontStyle: "italic" }}>
                    "{t.texto}"
                  </p>
                  <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.white }}>{t.nombre}</div>
                  <div style={{ fontSize: 11, color: COLORS.gray }}>{t.empresa}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRECIOS ── */}
        <section id="precios" ref={pricingRef} style={{ padding: "100px 24px" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 60 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.yellow, letterSpacing: 2, marginBottom: 12 }}>PRECIOS</div>
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900, margin: "0 0 14px" }}>
                SIMPLE Y TRANSPARENTE
              </h2>
              <p style={{ color: COLORS.gray, fontSize: 16, margin: 0 }}>
                Sin contratos. Cancela cuando quieras. {TRIAL_DAYS} días gratis en todos los planes de pago.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, alignItems: "start" }}>
              {PLANES.map((plan, i) => (
                <div key={plan.id} className={`plan-card fade-up ${pricingVisible ? "visible" : ""}`}
                  style={{
                    transitionDelay: `${i * 100}ms`,
                    background: plan.highlight ? `linear-gradient(135deg, ${COLORS.navyLight}, #1a365d)` : COLORS.navyMid,
                    border: plan.highlight ? `2px solid ${COLORS.yellow}` : `1px solid ${COLORS.border}`,
                    boxShadow: plan.highlight ? `0 20px 60px ${COLORS.yellow}22` : "none",
                  }}>
                  {plan.badge && (
                    <div style={{
                      position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                      background: COLORS.yellow, color: COLORS.navy,
                      padding: "4px 16px", borderRadius: 99, fontSize: 11, fontWeight: 800,
                    }}>{plan.badge}</div>
                  )}

                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: plan.color, marginBottom: 6 }}>{plan.nombre}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 44, fontWeight: 900, color: COLORS.white }}>{plan.precio}</span>
                      <span style={{ fontSize: 14, color: COLORS.gray }}>{plan.periodo}</span>
                    </div>
                    {plan.id === "pro" && (
                      <div style={{ fontSize: 11, color: COLORS.yellow, marginTop: 4, fontWeight: 600 }}>
                        ✨ {TRIAL_DAYS} días gratis, sin tarjeta
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: 24, display: "flex", flexDirection: "column", gap: 8 }}>
                    {plan.features.map((f, j) => (
                      <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: COLORS.grayLight }}>
                        <span style={{ color: "#68d391", fontSize: 12, flexShrink: 0 }}>✓</span>{f}
                      </div>
                    ))}
                    {plan.noFeatures.map((f, j) => (
                      <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#4a5568" }}>
                        <span style={{ fontSize: 12, flexShrink: 0 }}>✗</span>{f}
                      </div>
                    ))}
                  </div>

                  <a href={plan.href} onClick={plan.id !== "team" ? goToApp : undefined}
                    className={plan.highlight ? "landing-btn-primary" : "landing-btn-ghost"}
                    style={{ width: "100%", justifyContent: "center", fontSize: 14 }}>
                    {plan.cta}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA FINALE ── */}
        <section style={{
          padding: "100px 24px", textAlign: "center",
          background: `linear-gradient(135deg, ${COLORS.navyLight} 0%, ${COLORS.navy} 100%)`,
          borderTop: `1px solid ${COLORS.border}`,
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            width: 600, height: 600,
            background: `radial-gradient(circle, ${COLORS.yellow}08 0%, transparent 70%)`,
            pointerEvents: "none",
          }} />
          <div style={{ maxWidth: 600, margin: "0 auto", position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.yellow, letterSpacing: 2, marginBottom: 16 }}>EMPIEZA HOY</div>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 900, margin: "0 0 20px", lineHeight: 1 }}>
              TU PRÓXIMO<br />
              <span style={{ color: COLORS.yellow, fontStyle: "italic" }}>PRESUPUESTO</span><br />
              EN 5 MINUTOS
            </h2>
            <p style={{ color: COLORS.gray, fontSize: 16, margin: "0 0 36px", lineHeight: 1.6 }}>
              Únete a las constructoras que ya digitalizaron su gestión.<br />
              {TRIAL_DAYS} días gratis, sin tarjeta de crédito.
            </p>
            <button onClick={goToApp} className="landing-btn-primary" style={{ fontSize: 17, padding: "18px 40px" }}>
              Crear cuenta gratis →
            </button>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ padding: "40px 24px", borderTop: `1px solid ${COLORS.border}` }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, background: COLORS.yellow, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, color: COLORS.navy }}>O</div>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 16, letterSpacing: 1 }}>
                OBRA<span style={{ color: COLORS.yellow }}>NOVA</span>
              </span>
              <span style={{ color: COLORS.gray, fontSize: 12, marginLeft: 8 }}>Software de gestión para constructoras</span>
            </div>
            <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
              <a href={WA_CONTACTO} target="_blank" rel="noopener noreferrer" style={{ color: COLORS.gray, textDecoration: "none", fontSize: 13, fontWeight: 600 }}>Contacto</a>
              <button onClick={goToApp} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.gray, fontSize: 13, fontWeight: 600 }}>Iniciar sesión</button>
              <span style={{ color: COLORS.gray, fontSize: 12 }}>© {new Date().getFullYear()} Obra Nova</span>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
