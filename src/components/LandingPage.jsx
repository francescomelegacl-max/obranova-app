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
  { icon: "🤖", title: "Nova AI genera tu presupuesto", desc: "Escribe /genera cocina 12m² y Nova crea partidas con precios reales de mercado chileno 2026. O usa /cotiza para responder al cliente en 30 segundos." },
  { icon: "✍️", title: "Firma digital en segundos", desc: "El cliente recibe un link, abre desde el celular y firma. Tú recibes notificación inmediata. Sin imprimir, sin escanear." },
  { icon: "💳", title: "Cobro integrado con MercadoPago", desc: "El QR de pago va directo en el PDF del presupuesto. El cliente paga, el sistema actualiza el estado automáticamente." },
  { icon: "📊", title: "Márgenes y benchmarks en tiempo real", desc: "CI, gastos fijos, imprevistos y utilidad calculados al instante. Nova compara tus precios con el mercado y te avisa si estás bajo." },
  { icon: "🎨", title: "Render AI fotorealístico", desc: "Describe materiales, colores y estilo — la AI genera la imagen del proyecto terminado. Incluye Before/After para WhatsApp." },
  { icon: "🌐", title: "Portal del cliente con Nova AI", desc: "Tu cliente tiene su portal con presupuesto, renders, preguntas frecuentes contestadas por Nova, firma y pagos." },
  { icon: "⚡", title: "/cotiza — respuesta express", desc: "Te llaman preguntando cuánto cuesta un baño. Escribes /cotiza baño 6m² y en 30 segundos tienes el presupuesto listo para enviar." },
  { icon: "🤝", title: "CRM + Planificación integrados", desc: "Pipeline Kanban de clientes, tareas de obra con asignación, agenda con hitos. Todo en un solo lugar, sin apps externas." },
];

// ── Testimonios ───────────────────────────────────────────────────────────────
const TESTIMONIOS = [
  { nombre: "Carlos M.", empresa: "Construcciones del Norte, Coquimbo", texto: "Antes me tomaba 2 horas hacer un presupuesto en Excel. Ahora en 15 minutos lo tengo listo y enviado con PDF profesional.", stars: 5 },
  { nombre: "Ana L.", empresa: "Remodelaciones AL, La Serena", texto: "La firma digital fue un cambio total. El cliente firmó desde su celular mientras yo estaba en otra obra. Todo automático.", stars: 5 },
  { nombre: "Roberto P.", empresa: "RP Obras, Ovalle", texto: "Le mostré el render AI al cliente y cerró en el acto. Nunca había tenido una herramienta así. Vale cada peso.", stars: 5 },
];

// ── Planes ────────────────────────────────────────────────────────────────────
const PLANES = [
  {
    id: "free", nombre: "Free", precio: "Gratis", periodo: "",
    color: COLORS.gray, highlight: false,
    features: ["5 proyectos", "15 partidas por proyecto", "PDF con watermark", "5 mensajes Nova AI/mes", "App móvil PWA"],
    noFeatures: ["PDF personalizado", "Firma digital", "Render AI", "/cotiza express"],
    cta: "Empezar gratis", href: `${APP_URL}`,
  },
  {
    id: "pro", nombre: "Pro", precio: "$29.900", periodo: "/mes",
    color: COLORS.yellow, highlight: true,
    badge: "Más popular",
    features: ["Proyectos ilimitados", "Nova AI 100 msg/mes + /genera + /cotiza", "PDF con tu logo", "Firma digital cliente", "Render AI (15/mes) + Before/After", "Portfolio público AI", "Export Excel", "MercadoPago integrado", "Portal del cliente con Nova"],
    noFeatures: [],
    cta: `Probar ${TRIAL_DAYS} días gratis`, href: `${APP_URL}`,
  },
  {
    id: "empresa", nombre: "Empresa", precio: "$49.900", periodo: "/mes",
    color: "#60a5fa", highlight: false,
    features: ["Todo Pro +", "Hasta 5 usuarios", "CRM Kanban completo", "Renders ilimitados", "Nova AI ilimitada + benchmarks", "Export contable Bsale/Defontana", "Soporte prioritario WhatsApp"],
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
  // SEO: imposta title e meta description per la landing
  useEffect(() => {
    document.title = "ObraNova — Software de Presupuestos para Constructoras Chile";
    const setMeta = (name, content, prop = false) => {
      const attr = prop ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("description", "Software con AI para constructoras chilenas. Genera presupuestos, firma digital, cobro con MercadoPago y portal del cliente. Prueba 14 días gratis.");
    setMeta("keywords", "software construcción chile, presupuesto obra, cotización construcción, firma digital presupuesto, software constructoras");
    setMeta("og:title", "ObraNova — Software de Presupuestos para Constructoras Chile", false);
    setMeta("og:description", "Genera presupuestos con AI, firma digital y cobro integrado. 14 días gratis.", false);
    setMeta("og:type", "website", false);
    setMeta("og:url", "https://app.obranova.cl", false);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", "ObraNova — Presupuestos para Constructoras");
    setMeta("twitter:description", "Software con AI para constructoras chilenas. 14 días gratis.");
    return () => { document.title = "ObraNova"; };
  }, []);

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
              <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ width: 32, height: 32 }}>
                <rect x="4" y="8" width="50" height="84" rx="4" fill="white" opacity="0.95"/>
                <rect x="16" y="24" width="22" height="48" rx="2" fill={COLORS.navy}/>
                <polygon points="44,8 60,8 96,92 80,92" fill={COLORS.yellow}/>
                <rect x="78" y="8" width="18" height="84" rx="3" fill={COLORS.yellow}/>
              </svg>
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
                  DE EXCEL<br />
                  <span style={{ color: COLORS.yellow, fontStyle: "italic" }}>A OBRA CERRADA</span><br />
                  EN 10 MINUTOS
                </h1>

                <p style={{
                  fontSize: 17, color: COLORS.grayLight, lineHeight: 1.65,
                  margin: "0 0 36px", maxWidth: 460,
                }}>
                  El software con AI para constructoras chilenas. Genera presupuestos, 
                  cobra con MercadoPago y firma digitalmente — todo desde el celular.
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

        {/* ── PROBLEMA → SOLUCIÓN ── */}
        <section style={{ padding: "80px 24px", background: COLORS.navyMid, borderTop: `1px solid ${COLORS.border}` }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.yellow, letterSpacing: 2, marginBottom: 12 }}>EL PROBLEMA</div>
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, margin: "0 0 16px", lineHeight: 1.1 }}>
                ¿TE SUENA FAMILIAR?
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
              {[
                { emoji: "😩", problema: "Haces presupuestos en Excel", solucion: "Nova genera 12 partidas con precios reales en 30 segundos" },
                { emoji: "📱", problema: "Los mandas por WhatsApp y se pierden", solucion: "PDF profesional con tu logo, enviado con link directo al cliente" },
                { emoji: "🖊️", problema: "El cliente tarda semanas en firmar", solucion: "Firma digital desde el celular del cliente, sin instalar nada" },
                { emoji: "💸", problema: "No sabes cuándo te van a pagar", solucion: "QR MercadoPago en el PDF, notificación automática al cobrar" },
              ].map((item, i) => (
                <div key={i} style={{ background: COLORS.navy, borderRadius: 12, padding: "20px 18px", border: `1px solid ${COLORS.border}` }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{item.emoji}</div>
                  <div style={{ fontSize: 13, color: "#fc8181", fontWeight: 700, marginBottom: 8, textDecoration: "line-through", opacity: 0.8 }}>
                    {item.problema}
                  </div>
                  <div style={{ fontSize: 13, color: "#68d391", fontWeight: 600, lineHeight: 1.5 }}>
                    ✓ {item.solucion}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <section ref={statsRef} style={{ padding: "60px 24px", borderTop: `1px solid ${COLORS.border}`, borderBottom: `1px solid ${COLORS.border}` }}>
          <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 40, textAlign: "center" }}>
            {[
              { label: "Horas ahorradas por presupuesto", value: 2, suffix: "h" },
              { label: "Módulos en producción", value: 35, suffix: "+" },
              { label: "Minutos al primer presupuesto", value: 10, suffix: " min" },
              { label: "Dias de prueba gratis", value: 14, suffix: " días" },
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

        {/* ── VIDEO DEMO ── */}
        <section style={{ padding: "80px 24px", background: COLORS.navyMid, borderTop: `1px solid ${COLORS.border}` }}>
          <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.yellow, letterSpacing: 2, marginBottom: 12 }}>DEMO</div>
            <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, margin: "0 0 32px", lineHeight: 1 }}>
              MÍRALO EN ACCIÓN
            </h2>
            {/* Video placeholder — reemplazar con iframe de YouTube */}
            <div style={{
              position: "relative", paddingBottom: "56.25%", height: 0,
              background: COLORS.navy, borderRadius: 16, overflow: "hidden",
              border: `1px solid ${COLORS.border}`,
              boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
            }}>
              {/* TODO: reemplazar con <iframe src="https://www.youtube.com/embed/TU_VIDEO_ID" /> */}
              <div style={{
                position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 16,
              }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: COLORS.yellow, display: "flex", alignItems: "center",
                  justifyContent: "center", cursor: "pointer",
                  boxShadow: `0 0 0 12px ${COLORS.yellow}22`,
                }}>
                  <span style={{ fontSize: 28, marginLeft: 4 }}>▶</span>
                </div>
                <div style={{ color: COLORS.gray, fontSize: 14 }}>
                  Demo disponible próximamente
                </div>
                <div style={{ fontSize: 12, color: COLORS.gray }}>
                  Presupuesto → firma → cobro en menos de 5 minutos
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" ref={featRef} style={{ padding: "100px 24px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 60 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.yellow, letterSpacing: 2, marginBottom: 12 }}>FUNCIONES</div>
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900, margin: 0, lineHeight: 1 }}>
                TODO EN UN SOLO<br />
                <span style={{ color: COLORS.yellow }}>SOFTWARE</span>
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
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

                  <a href={plan.href} onClick={plan.id !== "empresa" ? goToApp : undefined}
                    className={plan.highlight ? "landing-btn-primary" : "landing-btn-ghost"}
                    style={{ width: "100%", justifyContent: "center", fontSize: 14 }}>
                    {plan.cta}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section style={{ padding: "80px 24px", borderTop: `1px solid ${COLORS.border}` }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.yellow, letterSpacing: 2, marginBottom: 12 }}>FAQ</div>
              <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, margin: 0 }}>
                PREGUNTAS FRECUENTES
              </h2>
            </div>
            <FaqSection />
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
              <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ width: 28, height: 28 }}>
                <rect x="4" y="8" width="50" height="84" rx="4" fill="white" opacity="0.95"/>
                <rect x="16" y="24" width="22" height="48" rx="2" fill={COLORS.navy}/>
                <polygon points="44,8 60,8 96,92 80,92" fill={COLORS.yellow}/>
                <rect x="78" y="8" width="18" height="84" rx="3" fill={COLORS.yellow}/>
              </svg>
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
        
      {/* Links legali */}
      <div style={{ textAlign: "center", padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,.1)" }}>
        <a href="/privacidad" style={{ color: "rgba(255,255,255,.5)", fontSize: 12, textDecoration: "none", marginRight: 16 }}>
          Política de Privacidad
        </a>
        <a href="/terminos" style={{ color: "rgba(255,255,255,.5)", fontSize: 12, textDecoration: "none" }}>
          Términos de Uso
        </a>
      </div>
    </footer>

      </div>

      {/* ── WHATSAPP BUBBLE ── */}
      <a href={WA_CONTACTO} target="_blank" rel="noopener noreferrer"
        title="Habla con nosotros por WhatsApp"
        style={{
          position: "fixed", bottom: 24, left: 24, zIndex: 999,
          width: 56, height: 56, borderRadius: "50%",
          background: "#25D366", color: "white",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(37,211,102,.4)",
          fontSize: 26, textDecoration: "none",
          animation: "waPulse 3s ease-in-out infinite",
        }}>
        💬
        <style>{`@keyframes waPulse{0%,100%{box-shadow:0 4px 20px rgba(37,211,102,.4)}50%{box-shadow:0 4px 28px rgba(37,211,102,.7)}}`}</style>
      </a>

    </>
  );
}

// ── FAQ Component ──────────────────────────────────────────────────────────────
function FaqSection() {
  const [open, setOpen] = useState(null);
  const faqs = [
    {
      q: "¿Necesito tarjeta de crédito para el período de prueba?",
      a: "No. Los 14 días de prueba del plan Pro son completamente gratis y sin tarjeta. Al terminar, puedes continuar en el plan Free o suscribirte.",
    },
    {
      q: "¿Funciona en el celular?",
      a: "Sí. ObraNova es una PWA (Progressive Web App) optimizada para móvil. Puedes instalarla en tu pantalla de inicio como si fuera una app nativa, sin pasar por la App Store.",
    },
    {
      q: "¿Puedo importar mis presupuestos de Excel?",
      a: "Puedes exportar tus presupuestos de ObraNova a Excel. Para importar desde Excel, Nova AI puede generar las partidas automáticamente con el comando /genera, o puedes agregarlas manualmente.",
    },
    {
      q: "¿Mis datos están seguros?",
      a: "Sí. Todos los datos se almacenan en Google Firebase (región Santiago, Chile), con backups nocturnos automáticos. El acceso está protegido por roles y los datos de cada empresa están completamente aislados.",
    },
    {
      q: "¿Puedo cancelar cuando quiera?",
      a: "Sí. Sin contratos de permanencia. Cancelas desde tu panel en cualquier momento y no se te cobra el siguiente mes.",
    },
    {
      q: "¿Funciona para todo tipo de obra?",
      a: "Sí. Remodelaciones, construcción en seco, instalaciones eléctricas y sanitarias, pintura, paisajismo y más. Las categorías y partidas son completamente personalizables.",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {faqs.map((faq, i) => (
        <div key={i} style={{
          background: COLORS.navyMid, borderRadius: 10,
          border: `1px solid ${open === i ? COLORS.yellow + "44" : COLORS.border}`,
          overflow: "hidden", transition: "border-color .2s",
        }}>
          <button onClick={() => setOpen(open === i ? null : i)} style={{
            width: "100%", padding: "16px 18px", background: "none", border: "none",
            cursor: "pointer", display: "flex", justifyContent: "space-between",
            alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.white, textAlign: "left" }}>
              {faq.q}
            </span>
            <span style={{ color: COLORS.yellow, fontSize: 18, flexShrink: 0, transition: "transform .2s",
              transform: open === i ? "rotate(45deg)" : "rotate(0deg)" }}>+</span>
          </button>
          {open === i && (
            <div style={{ padding: "0 18px 16px", fontSize: 14, color: COLORS.gray, lineHeight: 1.65 }}>
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
