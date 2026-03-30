// ─── components/ModalOnboarding.jsx ──────────────────────────────────────────
// Wizard attivo 4 step — crea il primo progetto reale guidando l'utente
// Props:
//   onClose()
//   onFinish({ cliente, telefono, direccion, partida })
//     → chiamato all'ultimo step, l'App crea il progetto e porta al tab
//
// FIX: handleFinish non chiama più onClose() — la chiusura del modal è gestita
//      direttamente da App.jsx dentro onFinish (async) dopo il salvataggio su
//      Firestore e il setTab(5). Chiamare onClose() in modo sincrono qui
//      causava un re-render che sovrascriveva setTab(5) riportando a tab 0.
import { useState, useRef, useEffect } from "react";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtCLP = (n) => {
  const num = parseInt((n || "0").toString().replace(/\D/g, ""), 10) || 0;
  return num.toLocaleString("es-CL");
};
const parseCLP = (s) => parseInt((s || "").replace(/\D/g, ""), 10) || 0;

// ── Step dots ─────────────────────────────────────────────────────────────────
function Dots({ total, current }) {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === current ? 24 : 7, height: 7, borderRadius: 99,
          background: i <= current ? "white" : "rgba(255,255,255,.25)",
          transition: "all .3s ease",
        }} />
      ))}
    </div>
  );
}

// ── Input stilizzato ──────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = "text", autoFocus }) {
  const ref = useRef(null);
  useEffect(() => { if (autoFocus && ref.current) ref.current.focus(); }, [autoFocus]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#718096", letterSpacing: .5, textTransform: "uppercase" }}>
        {label}
      </label>
      <input
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        style={{
          padding: "11px 14px", border: "2px solid #e2e8f0", borderRadius: 10,
          fontSize: 14, outline: "none", fontFamily: "inherit",
          transition: "border-color .15s",
        }}
        onFocus={e => e.target.style.borderColor = "#2b6cb0"}
        onBlur={e => e.target.style.borderColor = "#e2e8f0"}
      />
    </div>
  );
}

// ── ModalOnboarding ───────────────────────────────────────────────────────────
export default function ModalOnboarding({ t = {}, onClose, onFinish, userName = "" }) {
  const [step,    setStep]    = useState(0);
  const [sliding, setSliding] = useState(false);
  const [dir,     setDir]     = useState(1);
  const [loading, setLoading] = useState(false); // blocca doppio click sul finish

  // Dati raccolti
  const [wsNombre,  setWsNombre]  = useState("");   // nome azienda
  const [tipoObra,  setTipoObra]  = useState("");   // tipo di lavori
  const [cliente,   setCliente]   = useState("");
  const [telefono,  setTelefono]  = useState("");
  const [comuna,    setComuna]    = useState("");   // per benchmark geografici
  const [direccion, setDireccion] = useState("");
  const [pDesc,     setPDesc]     = useState("");
  const [pCant,     setPCant]     = useState("1");
  const [pPU,       setPPU]       = useState("");
  const [pPUDisplay,setPPUDisplay]= useState("");

  const TOTAL = 5;
  const isLast = step === TOTAL - 1;

  const navigate = (d) => {
    setDir(d);
    setSliding(true);
    setTimeout(() => { setStep(s => s + d); setSliding(false); }, 160);
  };

  const canNext = () => {
    if (step === 0) return wsNombre.trim().length > 0;
    if (step === 2) return cliente.trim().length > 0;
    if (step === 3) return pDesc.trim().length > 0 && parseCLP(pPU) > 0;
    return true;
  };

  // ── FIX CHIAVE: handleFinish NON chiama onClose() ─────────────────────────
  // App.jsx gestisce la chiusura del modal DENTRO onFinish (async), dopo
  // saveProyecto + LOAD_PROJECT + setTab(5) + setPrintingOnboarding(true).
  // Chiamare onClose() in modo sincrono qui causava un re-render intermedio
  // che sovrascriveva setTab(5) e riportava l'utente alla dashboard.
  const handleFinish = async () => {
    if (loading) return;
    if (!onFinish) return;
    setLoading(true);
    try {
      await onFinish({
        wsNombre:  wsNombre.trim(),
        tipoObra:  tipoObra,
        cliente:   cliente.trim(),
        telefono:  telefono.trim(),
        comuna:    comuna.trim(),
        direccion: direccion.trim(),
        partida: {
          nombre: pDesc.trim(),
          cant:   parseFloat(pCant) || 1,
          pu:     parseCLP(pPU),
          unidad: "gl",
          cat:    "General",
        },
      });
    } catch (e) {
      console.error("ModalOnboarding onFinish error:", e);
      setLoading(false);
    }
    // Non chiamiamo onClose() — lo fa App.jsx dentro onFinish
    // dopo setTab(5) e setPrintingOnboarding(true)
  };

  // Totale preview
  const total = (parseFloat(pCant) || 1) * parseCLP(pPU);

  // Gradienti per step
  const GRADS = [
    "linear-gradient(145deg,#553c9a,#805ad5)",   // step 0: azienda
    "linear-gradient(145deg,#1a365d,#2b6cb0)",   // step 1: benvenuto
    "linear-gradient(145deg,#276749,#38a169)",   // step 2: cliente
    "linear-gradient(145deg,#553c9a,#805ad5)",
    "linear-gradient(145deg,#744210,#c05621)",
  ];

  const TIPOS_OBRA = [
    "Remodelaciones", "Construcción nueva", "Instalaciones eléctricas",
    "Gasfitería", "Pintura", "Otro",
  ];

  const STEPS = [
    // ── Step 0: Tu empresa ──────────────────────────────────────────────────
    {
      title: `Hola${userName ? `, ${userName.split(" ")[0]}` : ""}! 👋`,
      sub: "Primero, cuéntanos sobre ti",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Nombre de tu empresa o negocio *" value={wsNombre} onChange={setWsNombre}
            placeholder="Ej: Construcciones López, Juan Pérez Obras" autoFocus />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,.7)", marginBottom: 8 }}>
              ¿En qué tipo de obras te especializas?
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {TIPOS_OBRA.map(tipo => (
                <button key={tipo} onClick={() => setTipoObra(tipo)} style={{
                  padding: "6px 12px", borderRadius: 20, border: "none", cursor: "pointer",
                  background: tipoObra === tipo ? "white" : "rgba(255,255,255,.15)",
                  color: tipoObra === tipo ? "#553c9a" : "rgba(255,255,255,.85)",
                  fontSize: 12, fontWeight: tipoObra === tipo ? 700 : 500,
                  transition: "all .15s",
                }}>{tipo}</button>
              ))}
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,.12)", borderRadius: 10, padding: "10px 14px",
            fontSize: 12, color: "rgba(255,255,255,.75)" }}>
            ✨ Personalizaremos ObraNova según tu tipo de trabajo
          </div>
        </div>
      ),
      cta: "Continuar →",
    },

    // ── Step 1: Bienvenido + Nova preview ───────────────────────────────────
    {
      title: "Tu asistente AI está listo",
      sub: "Nova genera presupuestos por ti",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Demo Nova */}
          <div style={{ background: "rgba(255,255,255,.1)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)", marginBottom: 8, fontWeight: 600 }}>
              💬 Escribe en Nova:
            </div>
            <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "8px 12px",
              fontSize: 13, color: "white", fontWeight: 600, fontFamily: "monospace" }}>
              /genera baño completo 8m²
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)", marginTop: 6, textAlign: "center" }}>
              ↓ Nova genera al instante:
            </div>
            <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
              {[
                ["Cerámica piso", "8 m²", "$ 15.000"],
                ["Porcelanato muro", "12 m²", "$ 18.000"],
                ["Punto gasfitería", "2 un", "$ 95.000"],
              ].map(([n, u, p]) => (
                <div key={n} style={{ display: "flex", justifyContent: "space-between",
                  fontSize: 11, color: "rgba(255,255,255,.8)", padding: "3px 0",
                  borderBottom: "1px solid rgba(255,255,255,.1)" }}>
                  <span>{n}</span><span style={{ color: "#68d391" }}>{p}/{u}</span>
                </div>
              ))}
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.5)", textAlign: "right", marginTop: 2 }}>
                + 9 partidas más con precios reales 2026...
              </div>
            </div>
          </div>
          {[
            { icon: "✍️", text: "Firma digital del cliente desde el celular" },
            { icon: "💳", text: "Cobro con MercadoPago integrado en el PDF" },
            { icon: "🌐", text: "Portal del cliente con avance de obra" },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 10,
              background: "rgba(255,255,255,.1)", borderRadius: 8, padding: "8px 12px" }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,.85)" }}>{text}</span>
            </div>
          ))}
        </div>
      ),
      cta: "Crear mi primer presupuesto →",
    },

    // ── Step 2: Datos del cliente ───────────────────────────────────────────
    {
      title: "¿Para quién es la obra?",
      sub: "Datos del primer presupuesto",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Nombre del cliente *" value={cliente} onChange={setCliente}
            placeholder="Ej: Juan Pérez" autoFocus />
          <Field label="Teléfono" value={telefono} onChange={setTelefono}
            placeholder="+56 9 1234 5678" type="tel" />
          <Field label="Comuna *" value={comuna} onChange={setComuna}
            placeholder="Ej: Providencia, Viña del Mar, Concepción" />
          <Field label="Dirección / Obra" value={direccion} onChange={setDireccion}
            placeholder="Ej: Av. Providencia 123, Santiago" />
        </div>
      ),
      cta: "Siguiente →",
    },

    // ── Step 3: Primera partida ─────────────────────────────────────────────
    {
      title: "¿Qué vas a presupuestar?",
      sub: "Agrega el primer ítem — o hazlo con Nova después",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Descripción *" value={pDesc} onChange={setPDesc}
            placeholder="Ej: Instalación cielo americano" autoFocus />
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: "0 0 100px" }}>
              <Field label="Cantidad" value={pCant} onChange={setPCant}
                placeholder="1" type="number" />
            </div>
            <div style={{ flex: 1 }}>
              <Field
                label="Precio unitario (CLP) *"
                value={pPUDisplay}
                onChange={(v) => {
                  const raw = v.replace(/\D/g, "");
                  setPPU(raw);
                  setPPUDisplay(raw ? parseInt(raw).toLocaleString("es-CL") : "");
                }}
                placeholder="Ej: 150.000"
              />
            </div>
          </div>
          {total > 0 && (
            <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 10,
              padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,.7)", fontWeight: 600 }}>
                {pCant} × $ {fmtCLP(pPU)}
              </span>
              <span style={{ fontSize: 18, color: "white", fontWeight: 900 }}>
                $ {total.toLocaleString("es-CL")}
              </span>
            </div>
          )}
          <div style={{ background: "rgba(255,255,255,.1)", borderRadius: 8, padding: "8px 12px",
            fontSize: 11, color: "rgba(255,255,255,.65)" }}>
            💡 Tip: después puedes usar <strong style={{ color: "white" }}>/genera</strong> en Nova
            para crear 10+ partidas en segundos
          </div>
        </div>
      ),
      cta: "Crear presupuesto →",
    },

    // ── Step 4: Listo ───────────────────────────────────────────────────────
    {
      title: "¡Presupuesto creado! 🎉",
      sub: "Ya está guardado en tu sistema",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Mini preview */}
          <div style={{ background: "white", borderRadius: 12, padding: "16px",
            boxShadow: "0 4px 20px rgba(0,0,0,.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#1a365d", letterSpacing: .5 }}>PRESUPUESTO</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#276749", background: "#f0fff4",
                padding: "2px 8px", borderRadius: 99, border: "1px solid #9ae6b4" }}>Borrador</div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1a365d", marginBottom: 2 }}>
              {cliente || "Cliente"}
            </div>
            {direccion && <div style={{ fontSize: 11, color: "#718096", marginBottom: 8 }}>📍 {direccion}</div>}
            <div style={{ height: 1, background: "#e2e8f0", margin: "8px 0" }} />
            {pDesc && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#4a5568" }}>{pDesc}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#1a365d" }}>
                  $ {total.toLocaleString("es-CL")}
                </span>
              </div>
            )}
          </div>

          {/* Prossimi passi cliccabili */}
          <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,.6)", marginBottom: 2 }}>
            ¿Qué hacer ahora?
          </div>
          {[
            { icon: "🤖", text: "Pide a Nova más partidas con /genera", tab: "costos" },
            { icon: "🖨️", text: "Genera el PDF y envíalo al cliente", tab: "resumen" },
            { icon: "✍️", text: "Solicita la firma digital", tab: "vistacliente" },
          ].map(({ icon, text, tab }) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 10,
              background: "rgba(255,255,255,.12)", borderRadius: 8, padding: "9px 12px",
              cursor: "pointer" }}
              onClick={() => {}}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,.9)", fontWeight: 600 }}>{text}</span>
              <span style={{ marginLeft: "auto", color: "rgba(255,255,255,.4)", fontSize: 12 }}>→</span>
            </div>
          ))}
        </div>
      ),
      cta: loading ? "Guardando..." : "¡Empezar ahora! →",
    },
  ];
  const current = STEPS[step];

  return (
    <div
      onClick={e => e.target === e.currentTarget && !loading && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 3000,
        background: "rgba(0,0,0,.72)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16,
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
    >
      <div style={{
        width: "100%", maxWidth: 420,
        borderRadius: 22, overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,.5)",
        transform: sliding ? `translateX(${dir * -32}px) scale(.97)` : "none",
        opacity: sliding ? 0 : 1,
        transition: "transform .16s ease, opacity .16s ease",
      }}>

        {/* ── Header colorato ── */}
        <div style={{
          background: GRADS[step], padding: "24px 24px 20px",
          transition: "background .35s ease",
        }}>
          {/* Top bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div style={{
              background: "rgba(255,255,255,.2)", borderRadius: 99,
              padding: "3px 12px", fontSize: 11, color: "white", fontWeight: 700,
            }}>
              {step + 1} / {TOTAL}
            </div>
            <button onClick={() => !loading && onClose()} style={{
              background: "rgba(255,255,255,.15)", border: "none", borderRadius: 8,
              cursor: loading ? "not-allowed" : "pointer", padding: "5px 11px", color: "white",
              fontSize: 14, fontWeight: 700, opacity: loading ? 0.5 : 1,
            }}>✕</button>
          </div>

          {/* Titolo */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 21, fontWeight: 900, color: "white", letterSpacing: -.3, lineHeight: 1.2 }}>
              {current.title}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.65)", marginTop: 5 }}>
              {current.sub}
            </div>
          </div>

          {/* Contenuto step */}
          {current.content}

          {/* Dots */}
          <div style={{ marginTop: 20 }}>
            <Dots total={TOTAL} current={step} />
          </div>
        </div>

        {/* ── Footer bianco ── */}
        <div style={{ background: "white", padding: "18px 24px 22px" }}>
          <div style={{ display: "flex", gap: 10 }}>
            {step > 0 && !loading && (
              <button onClick={() => navigate(-1)} style={{
                padding: "11px 18px", background: "#f0f4f8", color: "#4a5568",
                border: "none", borderRadius: 10, cursor: "pointer",
                fontWeight: 700, fontSize: 13,
              }}>← Atrás</button>
            )}
            <button
              onClick={isLast ? handleFinish : () => { if (canNext()) navigate(1); }}
              disabled={!canNext() || loading}
              style={{
                flex: 1, padding: "13px",
                background: (!canNext() || loading)
                  ? "#e2e8f0"
                  : isLast
                    ? "linear-gradient(135deg,#744210,#c05621)"
                    : GRADS[step],
                color: (!canNext() || loading) ? "#a0aec0" : "white",
                border: "none", borderRadius: 10,
                cursor: (canNext() && !loading) ? "pointer" : "not-allowed",
                fontWeight: 800, fontSize: 14,
                boxShadow: (canNext() && !loading) ? "0 4px 14px rgba(0,0,0,.2)" : "none",
                transition: "all .2s",
              }}
            >{current.cta}</button>
          </div>

          {(step === 0 || step === 1) && (
            <div style={{ textAlign: "center", marginTop: 12 }}>
              <button onClick={onClose} style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 12, color: "#a0aec0", fontWeight: 600,
              }}>Saltar y explorar solo</button>
            </div>
          )}

          {step === 0 && !canNext() && (
            <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: "#a0aec0" }}>
              El nombre de tu empresa es obligatorio
            </div>
          )}
          {step === 2 && !canNext() && (
            <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: "#a0aec0" }}>
              El nombre del cliente es obligatorio
            </div>
          )}
          {step === 3 && !canNext() && (
            <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: "#a0aec0" }}>
              Ingresa la descripción y el precio
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
