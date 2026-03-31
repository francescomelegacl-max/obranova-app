// ─── components/tabs/TabSettings.jsx ────────────────────────────────────────
import { useState } from "react";
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { ROLES, ROLE_LABELS, ROLE_COLORS } from "../../hooks/useWorkspace";

// ─── Helper: legge/scrive impostazioni PDF in localStorage ───────────────────
export function usePDFSettings() {
  const saved = localStorage.getItem("pdf_settings");
  return saved ? JSON.parse(saved) : {
    logoUrl:        "",
    colorPrimario:  "#1a365d",
    colorAccento:   "#276749",
    colorTabella:   "#ebf8ff",
    mostraFirma:    true,
    mostraFoto:     true,
    mostraCondPago: true,
  };
}

// ─── Helper: legge/scrive dati tributari in localStorage ─────────────────────
export function useEmpresaSettings() {
  const saved = localStorage.getItem("empresa_settings");
  return saved ? JSON.parse(saved) : {
    rut:            "",
    razonSocial:    "",
    giro:           "",
    direccion:      "",
    ciudad:         "",
    telefono:       "",
    email:          "",
    tipoContribuyente: "empresa", // "empresa" | "persona_natural"
  };
}

// ─── Sezione Datos Tributarios ────────────────────────────────────────────────
function DatosTributariosSection() {
  const [cfg, setCfg] = useState(() => {
    const saved = localStorage.getItem("empresa_settings");
    return saved ? JSON.parse(saved) : {
      rut:            "",
      razonSocial:    "",
      giro:           "",
      direccion:      "",
      ciudad:         "",
      telefono:       "",
      email:          "",
      tipoContribuyente: "empresa",
    };
  });
  const [saved, setSaved] = useState(false);

  const u = (k, v) => setCfg(x => ({ ...x, [k]: v }));

  const handleSave = () => {
    localStorage.setItem("empresa_settings", JSON.stringify(cfg));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const inp = (label, key, placeholder, type = "text") => (
    <div>
      <label style={{ fontSize: 11, color: "#718096", fontWeight: 700, display: "block", marginBottom: 4 }}>{label}</label>
      <input
        type={type}
        value={cfg[key]}
        onChange={e => u(key, e.target.value)}
        placeholder={placeholder}
        style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#1a365d", boxSizing: "border-box" }}
      />
    </div>
  );

  return (
    <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d", marginBottom: 14, borderBottom: "2px solid #ebf8ff", paddingBottom: 7 }}>
        🇨🇱 Datos Tributarios (SII Chile)
      </div>

      {/* Tipo contribuyente */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "#718096", fontWeight: 700, marginBottom: 8 }}>Tipo de contribuyente</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { val: "empresa",        label: "🏢 Empresa (SpA / Ltda)",         desc: "Emite Facturas — IVA 19%" },
            { val: "persona_natural", label: "👤 Persona Natural",               desc: "Emite Boletas de Honorarios — Retención 10%" },
          ].map(({ val, label, desc }) => (
            <button key={val} onClick={() => u("tipoContribuyente", val)}
              style={{
                flex: 1, padding: "10px 14px", borderRadius: 10, cursor: "pointer", textAlign: "left",
                border: cfg.tipoContribuyente === val ? "2px solid #2b6cb0" : "2px solid #e2e8f0",
                background: cfg.tipoContribuyente === val ? "#ebf8ff" : "#f7fafc",
              }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: cfg.tipoContribuyente === val ? "#2b6cb0" : "#2d3748", marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 10, color: "#718096" }}>{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Campi fiscali */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        {inp("RUT Emisor *", "rut", "12.345.678-9")}
        {inp("Razón Social *", "razonSocial", "Mi Empresa SpA")}
        {inp("Giro *", "giro", "Construcción y Remodelación")}
        {inp("Ciudad", "ciudad", "Santiago")}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginBottom: 12 }}>
        {inp("Dirección", "direccion", "Av. Providencia 1234, Of. 56")}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        {inp("Teléfono", "telefono", "+56 9 1234 5678")}
        {inp("Email tributario", "email", "contacto@empresa.cl", "email")}
      </div>

      {/* Info IVA / Retención */}
      <div style={{
        background: cfg.tipoContribuyente === "empresa" ? "#ebf8ff" : "#faf5ff",
        border: `1px solid ${cfg.tipoContribuyente === "empresa" ? "#bee3f8" : "#d6bcfa"}`,
        borderRadius: 9, padding: "10px 14px", marginBottom: 16, fontSize: 12,
      }}>
        {cfg.tipoContribuyente === "empresa" ? (
          <>
            <div style={{ fontWeight: 700, color: "#2b6cb0", marginBottom: 3 }}>📋 Régimen Empresa (SpA/Ltda)</div>
            <div style={{ color: "#2d3748" }}>Los DTE generarán <strong>IVA 19%</strong> separado. Las facturas mostrarán Neto + IVA + Total.</div>
          </>
        ) : (
          <>
            <div style={{ fontWeight: 700, color: "#553c9a", marginBottom: 3 }}>📋 Régimen Persona Natural (Honorarios)</div>
            <div style={{ color: "#2d3748" }}>Las boletas aplicarán <strong>retención 10%</strong> automática. El cliente retiene y paga al SII en tu nombre.</div>
          </>
        )}
      </div>

      <button onClick={handleSave}
        style={{ padding: "10px 22px", background: saved ? "#276749" : "#1a365d", color: "white", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 13, transition: "all .2s" }}>
        {saved ? "✅ Datos guardados" : "💾 Guardar datos tributarios"}
      </button>
    </div>
  );
}

// ─── Sezione personalizzazione PDF ───────────────────────────────────────────
function PDFSettingsSection({ plan = "free", onGoToPiani }) {
  const isPro = plan === "pro" || plan === "empresa";

  const [cfg, setCfg] = useState(() => {
    const saved = localStorage.getItem("pdf_settings");
    return saved ? JSON.parse(saved) : {
      logoUrl:        "",
      colorPrimario:  "#1a365d",
      colorAccento:   "#276749",
      colorTabella:   "#ebf8ff",
      mostraFirma:    true,
      mostraFoto:     true,
      mostraCondPago: true,
    };
  });
  const [saved, setSaved] = useState(false);

  const u = (k, v) => setCfg(x => ({ ...x, [k]: v }));

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = ev => u("logoUrl", ev.target.result);
    r.readAsDataURL(file);
  };

  const handleSave = () => {
    localStorage.setItem("pdf_settings", JSON.stringify(cfg));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ background:"white",borderRadius:12,padding:18,boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
      <div style={{ fontWeight:700,fontSize:14,color:"#1a365d",marginBottom:14,borderBottom:"2px solid #ebf8ff",paddingBottom:7 }}>
        🎨 Personalización PDF
      </div>

      {/* Logo */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:12,fontWeight:700,color:"#4a5568",marginBottom:8 }}>
          Logo empresa
          {!isPro && <span style={{ marginLeft:8,fontSize:10,background:"#faf5ff",color:"#553c9a",border:"1px solid #d6bcfa",borderRadius:99,padding:"2px 8px",fontWeight:700 }}>💎 Pro</span>}
        </div>
        {!isPro ? (
          <div style={{ background:"#faf5ff",border:"2px dashed #d6bcfa",borderRadius:10,padding:"16px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap" }}>
            <div>
              <div style={{ fontWeight:700,fontSize:13,color:"#553c9a",marginBottom:4 }}>🔒 Logo personalizado — Plan Pro</div>
              <div style={{ fontSize:12,color:"#718096" }}>
                En el plan Free los PDF muestran el logo de <strong>Obra Nova</strong> como marca de agua.<br/>
                Pasa a Pro para subir el logo de tu empresa.
              </div>
            </div>
            {onGoToPiani && (
              <button onClick={onGoToPiani}
                style={{ padding:"9px 18px",background:"linear-gradient(135deg,#553c9a,#2b6cb0)",color:"white",border:"none",borderRadius:9,cursor:"pointer",fontWeight:800,fontSize:12,whiteSpace:"nowrap" }}>
                🚀 Ver planes →
              </button>
            )}
          </div>
        ) : (
          <div style={{ display:"flex",gap:12,alignItems:"center",flexWrap:"wrap" }}>
            {cfg.logoUrl
              ? <img src={cfg.logoUrl} alt="Logo" style={{ height:52,maxWidth:160,borderRadius:6,border:"1px solid #e2e8f0",background:"#f7fafc",padding:4,objectFit:"contain" }} />
              : <div style={{ width:90,height:52,borderRadius:6,border:"2px dashed #e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",color:"#a0aec0",fontSize:11 }}>Sin logo</div>
            }
            <label style={{ padding:"8px 14px",background:"#ebf8ff",color:"#2b6cb0",border:"1px solid #bee3f8",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:12 }}>
              📁 Subir logo
              <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display:"none" }} />
            </label>
            {cfg.logoUrl && (
              <button onClick={() => u("logoUrl","")}
                style={{ padding:"8px 12px",background:"#fff5f5",color:"#c53030",border:"1px solid #fed7d7",borderRadius:8,cursor:"pointer",fontSize:12 }}>
                🗑️ Quitar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Colori */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:12,fontWeight:700,color:"#4a5568",marginBottom:8 }}>Colores</div>
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10 }}>
          {[
            { key:"colorPrimario", label:"Encabezado / tablas", icon:"🎨" },
            { key:"colorAccento",  label:"Totales / énfasis",   icon:"✨" },
            { key:"colorTabella",  label:"Fondo filas pares",   icon:"📋" },
          ].map(({ key, label, icon }) => (
            <div key={key} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#f7fafc",borderRadius:9,border:"1px solid #e2e8f0" }}>
              <span style={{ fontSize:16 }}>{icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11,color:"#718096",marginBottom:4 }}>{label}</div>
                <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                  <input type="color" value={cfg[key]} onChange={e => u(key, e.target.value)}
                    style={{ width:34,height:30,border:"none",borderRadius:5,cursor:"pointer",padding:0,background:"none" }} />
                  <span style={{ fontSize:11,fontFamily:"monospace",color:"#4a5568" }}>{cfg[key]}</span>
                </div>
              </div>
              <div style={{ width:22,height:22,borderRadius:5,background:cfg[key],border:"1px solid #e2e8f0",flexShrink:0 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Toggle sezioni PDF */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:12,fontWeight:700,color:"#4a5568",marginBottom:8 }}>Secciones visibles en PDF</div>
        <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
          {[
            { key:"mostraFirma",    label:"✍️ Firma digital" },
            { key:"mostraFoto",     label:"📸 Fotos del proyecto" },
            { key:"mostraCondPago", label:"💳 Condiciones de pago" },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => u(key, !cfg[key])}
              style={{ padding:"8px 16px",borderRadius:99,border:"none",cursor:"pointer",fontWeight:600,fontSize:12,transition:"all .2s",
                background: cfg[key]?"#276749":"#f0f4f8",
                color:      cfg[key]?"white":"#718096" }}>
              {cfg[key] ? "✓ " : ""}{label}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div style={{ marginBottom:16,borderRadius:9,overflow:"hidden",border:"1px solid #e2e8f0" }}>
        <div style={{ background:cfg.colorPrimario,padding:"8px 14px",color:"white",fontWeight:700,fontSize:12,display:"flex",justifyContent:"space-between" }}>
          <span>CATEGORÍA EJEMPLO</span><span>$ 850.000</span>
        </div>
        <div style={{ background:cfg.colorTabella,padding:"7px 14px",fontSize:11,display:"flex",justifyContent:"space-between",color:"#2d3748" }}>
          <span>Ítem par (fondo color)</span><span>$ 120.000</span>
        </div>
        <div style={{ padding:"7px 14px",background:"white",display:"flex",justifyContent:"space-between",fontSize:11 }}>
          <span>Ítem impar (blanco)</span><span>$ 100.000</span>
        </div>
        <div style={{ padding:"8px 14px",background:cfg.colorPrimario,display:"flex",justifyContent:"space-between",fontSize:12,color:"white",fontWeight:700 }}>
          <span>TOTAL</span><span style={{ color:"#fff",fontSize:13,fontWeight:800 }}>$ 220.000</span>
        </div>
      </div>

      <button onClick={handleSave}
        style={{ padding:"10px 22px",background:saved?"#276749":"#1a365d",color:"white",border:"none",
          borderRadius:9,cursor:"pointer",fontWeight:700,fontSize:13,transition:"all .2s" }}>
        {saved ? "✅ Configuración guardada" : "💾 Guardar configuración PDF"}
      </button>
    </div>
  );
}

// ─── TabSettings principal ────────────────────────────────────────────────────
// ─── 4.6 Componente Referral ──────────────────────────────────────────────────
function ReferralCard({ workspace, userEmail, onToast }) {
  const [copied, setCopied] = useState(false);

  // Genera codice stabile basato sull'ID workspace (no round-trip al server)
  const code = workspace?.id
    ? "ON-" + workspace.id.slice(0, 6).toUpperCase()
    : null;

  const referralUrl = code
    ? `${window.location.origin}?ref=${code}`
    : null;

  const handleCopy = () => {
    if (!referralUrl) return;
    navigator.clipboard?.writeText(referralUrl).then(() => {
      setCopied(true);
      onToast?.("✅ Link copiado");
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => onToast?.("⚠️ No se pudo copiar"));
  };

  const handleWA = () => {
    if (!referralUrl) return;
    const msg = encodeURIComponent(
      `Te recomiendo Obra Nova para gestionar presupuestos de construcción 🏗️\n\nRegístrate con mi link y ambos conseguimos 30 días Pro gratis:\n${referralUrl}`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div style={{ background: "linear-gradient(135deg,#276749,#2d6a4f)", borderRadius: 14, padding: "20px 22px", color: "white" }}>
      <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>🎁 Invita y gana 30 días Pro</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,.75)", marginBottom: 16, maxWidth: 420 }}>
        Comparte tu link. Por cada amigo que se registre y active un plan Pro, <strong>ambos</strong> reciben 30 días extra de Pro gratis.
      </div>

      {code ? (
        <>
          {/* Link copiabile */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            <div style={{ flex: 1, minWidth: 200, background: "rgba(255,255,255,.12)", borderRadius: 9,
              padding: "9px 12px", fontSize: 12, fontWeight: 700, fontFamily: "monospace",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {referralUrl}
            </div>
            <button onClick={handleCopy}
              style={{ padding: "9px 16px", background: copied ? "rgba(255,255,255,.3)" : "rgba(255,255,255,.15)",
                border: "1px solid rgba(255,255,255,.3)", borderRadius: 9, color: "white",
                cursor: "pointer", fontWeight: 700, fontSize: 12, flexShrink: 0, transition: "background .2s" }}>
              {copied ? "✅ Copiado" : "📋 Copiar"}
            </button>
            <button onClick={handleWA}
              style={{ padding: "9px 16px", background: "#25D366", border: "none", borderRadius: 9,
                color: "white", cursor: "pointer", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
              💬 WhatsApp
            </button>
          </div>

          {/* Código destacado */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.6)" }}>Tu código:</div>
            <div style={{ background: "rgba(255,255,255,.18)", borderRadius: 7, padding: "4px 12px",
              fontSize: 14, fontWeight: 900, letterSpacing: 2, fontFamily: "monospace" }}>
              {code}
            </div>
          </div>
        </>
      ) : (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)" }}>Crea un workspace para obtener tu link de referido.</div>
      )}
    </div>
  );
}


// ── ScadenzarioSection ────────────────────────────────────────────────────────
// Configura i giorni prima del reminder automatico sui preventivi Enviados.
// Scrive workspace.reminderDias su Firestore — letto da scadenzarioReminder cron.
function ScadenzarioSection({ workspace, can, onToast }) {
  const [dias,    setDias]    = useState(workspace?.reminderDias ?? 7);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  const handleSave = async () => {
    if (!workspace?.id) return;
    const val = parseInt(dias, 10);
    if (!val || val < 1 || val > 60) { onToast?.("⚠️ Ingresa un valor entre 1 y 60 días"); return; }
    setSaving(true);
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../../lib/firebase");
      await updateDoc(doc(db, "workspaces", workspace.id), { reminderDias: val });
      onToast?.("✅ Configuración guardada");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      onToast?.("⚠️ Error al guardar: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const isPro = ["pro","empresa"].includes(workspace?.plan);

  return (
    <div style={{ background:"white",borderRadius:12,padding:18,boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
      <div style={{ fontWeight:700,fontSize:14,color:"#1a365d",marginBottom:4,borderBottom:"2px solid #ebf8ff",paddingBottom:7 }}>
        ⏰ Recordatorios automáticos
      </div>
      <div style={{ fontSize:12,color:"#718096",marginBottom:14 }}>
        Obra Nova te avisa por email cuando un presupuesto enviado no recibe respuesta.
        Se envían dos recordatorios: el primero a los X días, el segundo a los 2X días.
      </div>
      {!isPro ? (
        <div style={{ background:"#faf5ff",border:"1px solid #e9d8fd",borderRadius:10,padding:"12px 14px",fontSize:12,color:"#553c9a",fontWeight:600 }}>
          ⚡ Los recordatorios automáticos están disponibles en el plan Pro y superior.
        </div>
      ) : (
        <div style={{ display:"flex",alignItems:"center",gap:12,flexWrap:"wrap" }}>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <label style={{ fontSize:13,color:"#4a5568",fontWeight:600 }}>
              Días sin respuesta antes del primer aviso:
            </label>
            <input
              type="number"
              value={dias}
              min={1}
              max={60}
              onChange={e => setDias(e.target.value)}
              disabled={!can("manage_workspace")}
              style={{
                width:60,padding:"7px 10px",border:"1px solid #e2e8f0",
                borderRadius:8,fontSize:14,fontWeight:700,color:"#1a365d",
                textAlign:"center",
              }}
            />
            <span style={{ fontSize:12,color:"#a0aec0" }}>días (2° aviso a los {(parseInt(dias,10)||7)*2} días)</span>
          </div>
          {can("manage_workspace") && (
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding:"8px 18px",
                background: saved ? "#276749" : "#1a365d",
                color:"white",border:"none",borderRadius:8,
                cursor:"pointer",fontWeight:700,fontSize:13,
                transition:"background .2s",
              }}
            >
              {saving ? "Guardando..." : saved ? "✅ Guardado" : "Guardar"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── BackupSection ─────────────────────────────────────────────────────────────
function BackupSection({ onBackup, onToast, can, userEmail }) {
  const ADMIN_EMAILS = ["francescomelega.cl@gmail.com", "obranovaspa@gmail.com", "melegaf@gmail.com"];
  const isAdmin = ADMIN_EMAILS.includes(userEmail);
  if (!isAdmin) return null;
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const handleBackup = async () => {
    if (!onBackup) { onToast?.("⚠️ Función no disponible"); return; }
    setLoading(true);
    try {
      const result = await onBackup();
      setLastResult({ ok: true, ...result });
      onToast?.(`✅ Backup completado — ${result.timestamp ?? new Date().toISOString().slice(0,10)}`);
    } catch (err) {
      setLastResult({ ok: false, error: err.message });
      onToast?.("❌ Backup fallido: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background:"white", borderRadius:12, border:"1px solid #e2e8f0", padding:"18px 20px" }}>
      <div style={{ fontWeight:700, fontSize:14, color:"#1a365d", marginBottom:14, borderBottom:"2px solid #ebf8ff", paddingBottom:7 }}>
        🗄️ Backup de datos
      </div>
      <div style={{ fontSize:13, color:"#718096", marginBottom:14, lineHeight:1.6 }}>
        Los backups se guardan en Firebase Storage y se envía confirmación por email.
        El backup automático se ejecuta todos los días a las 05:00.
      </div>
      {lastResult && (
        <div style={{ padding:"10px 14px", borderRadius:8, marginBottom:12,
          background: lastResult.ok ? "#f0fff4" : "#fff5f5",
          border: `1px solid ${lastResult.ok ? "#9ae6b4" : "#fed7d7"}`,
          fontSize:12, color: lastResult.ok ? "#276749" : "#c53030" }}>
          {lastResult.ok
            ? `✅ Último backup: ${lastResult.timestamp ?? new Date().toISOString().slice(0,10)}`
            : `❌ Error: ${lastResult.error}`}
        </div>
      )}
      <button
        onClick={handleBackup}
        disabled={loading}
        style={{ padding:"10px 20px", background: loading ? "#a0aec0" : "#2b6cb0",
          color:"white", border:"none", borderRadius:9, cursor: loading ? "not-allowed" : "pointer",
          fontWeight:700, fontSize:13, display:"flex", alignItems:"center", gap:8 }}>
        {loading ? "⏳ Ejecutando backup..." : "🗄️ Ejecutar backup ahora"}
      </button>
    </div>
  );
}

// ── EliminarCuentaSection ─────────────────────────────────────────────────────
function EliminarCuentaSection({ user, onToast }) {
  const [open,      setOpen]      = useState(false);
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  const isGoogle = user?.providerData?.[0]?.providerId === "google.com";

  const handleDelete = async () => {
    if (confirm !== "ELIMINAR") { setError("Escribe ELIMINAR para confirmar"); return; }
    setLoading(true); setError("");
    try {
      // Riautentica prima di eliminare
      if (!isGoogle && password) {
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(auth.currentUser, credential);
      }
      await deleteUser(auth.currentUser);
      onToast?.("✅ Cuenta eliminada");
      // Auth state change in App.jsx porterà al login
    } catch (e) {
      const msgs = {
        "auth/wrong-password":        "Contraseña incorrecta",
        "auth/requires-recent-login":  "Sesión expirada. Cierra sesión y vuelve a entrar antes de eliminar.",
        "auth/too-many-requests":      "Demasiados intentos. Espera unos minutos.",
      };
      setError(msgs[e.code] || e.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ background:"white", borderRadius:12, border:"2px solid #fed7d7", padding:"18px 20px" }}>
      <div style={{ fontWeight:700, fontSize:14, color:"#c53030", marginBottom:6, borderBottom:"2px solid #fff5f5", paddingBottom:7 }}>
        🗑️ Eliminar cuenta
      </div>
      <div style={{ fontSize:13, color:"#718096", marginBottom:14, lineHeight:1.6 }}>
        Esta acción es <strong>permanente e irreversible</strong>. Se eliminará tu acceso a la app.
        Los datos del workspace (proyectos, presupuestos) permanecerán en Firestore para los demás miembros.
      </div>

      {!open ? (
        <button onClick={() => setOpen(true)}
          style={{ padding:"9px 20px", background:"#fff5f5", color:"#c53030",
            border:"1px solid #fed7d7", borderRadius:9, cursor:"pointer", fontWeight:700, fontSize:13 }}>
          Eliminar mi cuenta →
        </button>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {/* Conferma password solo per email/password */}
          {!isGoogle && (
            <div>
              <label style={{ fontSize:11, color:"#718096", fontWeight:700, display:"block", marginBottom:4 }}>
                Contraseña actual
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #e2e8f0",
                  borderRadius:8, fontSize:13, boxSizing:"border-box" }} />
            </div>
          )}
          <div>
            <label style={{ fontSize:11, color:"#c53030", fontWeight:700, display:"block", marginBottom:4 }}>
              Escribe ELIMINAR para confirmar
            </label>
            <input value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="ELIMINAR"
              style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #fed7d7",
                borderRadius:8, fontSize:13, boxSizing:"border-box", color:"#c53030", fontWeight:700 }} />
          </div>
          {error && (
            <div style={{ background:"#fff5f5", border:"1px solid #fed7d7", borderRadius:8,
              padding:"9px 14px", fontSize:12, color:"#c53030" }}>
              ⚠️ {error}
            </div>
          )}
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => { setOpen(false); setError(""); setConfirm(""); setPassword(""); }}
              style={{ padding:"9px 18px", background:"#f7fafc", border:"1px solid #e2e8f0",
                borderRadius:9, cursor:"pointer", fontWeight:600, fontSize:13, color:"#718096" }}>
              Cancelar
            </button>
            <button onClick={handleDelete}
              disabled={loading || confirm !== "ELIMINAR"}
              style={{ flex:1, padding:"9px", background: confirm === "ELIMINAR" ? "#c53030" : "#e2e8f0",
                color: confirm === "ELIMINAR" ? "white" : "#a0aec0",
                border:"none", borderRadius:9, cursor: confirm === "ELIMINAR" ? "pointer" : "not-allowed",
                fontWeight:800, fontSize:13 }}>
              {loading ? "Eliminando..." : "🗑️ Eliminar cuenta definitivamente"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


// ── ReporteButton: fetch diretto a southamerica-west1 (no App Check) ──────────
function ReporteButton({ wsId, uid, onToast }) {
  const [loading, setLoading] = useState(false);
  const handleClick = async () => {
    if (!wsId || !uid) { onToast?.("⚠️ Workspace no disponible"); return; }
    setLoading(true);
    try {
      const res  = await fetch(
        "https://southamerica-west1-obra-nova-spa.cloudfunctions.net/reporteMensualCallable",
        { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid, wsId }) }
      );
      const json = await res.json();
      if (json?.success) onToast?.("✅ Reporte enviado a " + json.email);
      else onToast?.("⚠️ " + (json?.message || json?.error || "Sin actividad este mes"));
    } catch (e) {
      onToast?.("❌ Error: " + e.message);
    } finally { setLoading(false); }
  };
  return (
    <button onClick={handleClick} disabled={loading}
      style={{ padding: "10px 20px", background: loading ? "#a0aec0" : "#1a365d",
        color: "white", border: "none", borderRadius: 10,
        cursor: loading ? "not-allowed" : "pointer",
        fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
      {loading ? "⏳ Enviando..." : "📧 Enviar reporte de prueba ahora"}
    </button>
  );
}

// ── WhatsAppConfigSection — Configurazione Nova WhatsApp Business ─────────────
function WhatsAppConfigSection({ workspace, can, members = [], onToast }) {
  const isPro = ["pro", "empresa"].includes(workspace?.plan);
  const isEmpresa = workspace?.plan === "empresa";
  const wsId = workspace?.id;

  // Stato locale inizializzato dal workspace
  const existing = workspace?.waConfig || {};
  const [enabled, setEnabled]       = useState(existing.enabled || false);
  const [mode, setMode]             = useState(existing.autoReplyMode || "manual");
  const [canPrices, setCanPrices]   = useState(existing.canAnswerPrices || false);
  const [canCotiza, setCanCotiza]   = useState(existing.canGenerateCotiza || false);
  const [canVisits, setCanVisits]   = useState(existing.canScheduleVisits || false);
  const [greeting, setGreeting]     = useState(existing.greetingMessage || "");
  const [timeout, setTimeout_]      = useState(existing.approvalTimeout || 300);
  const [phones, setPhones]         = useState(existing.authorizedPhones || []);
  const [newPhone, setNewPhone]     = useState("");
  const [newPhoneRole, setNewPhoneRole] = useState("owner");
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);

  const addPhone = () => {
    const clean = newPhone.trim();
    if (!clean) return;
    if (phones.find(p => p.phone === clean)) { onToast?.("⚠️ Número ya registrado"); return; }
    setPhones(prev => [...prev, {
      phone: clean,
      role: newPhoneRole,
      addedAt: new Date().toISOString(),
      label: newPhoneRole === "owner" ? "Administrador" : "Operador",
    }]);
    setNewPhone("");
  };

  const removePhone = (idx) => setPhones(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!wsId) return;
    setSaving(true);
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../../lib/firebase");

      const waConfig = {
        enabled,
        autoReplyMode:     mode,
        canAnswerPrices:   canPrices,
        canGenerateCotiza: canCotiza,
        canScheduleVisits: canVisits,
        greetingMessage:   greeting.trim(),
        approvalTimeout:   parseInt(timeout) || 300,
        authorizedPhones:  phones,
        // Mantieni ownerPhone per compatibilità backend
        ownerPhone:        phones.find(p => p.role === "owner")?.phone || "",
        businessHours:     existing.businessHours || { start: 8, end: 20 },
        updatedAt:         new Date().toISOString(),
      };

      await updateDoc(doc(db, "workspaces", wsId), { waConfig });
      onToast?.("✅ Configuración WhatsApp guardada");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      onToast?.("⚠️ Error: " + e.message);
    } finally { setSaving(false); }
  };

  const MODES = [
    { id: "manual", emoji: "✋", label: "Manual", desc: "Nova sugiere, tú apruebas antes de enviar", color: "#2b6cb0", bg: "#ebf8ff" },
    { id: "assisted", emoji: "⏱️", label: "Asistida", desc: `Nova envía en ${Math.round(timeout/60)} min si no intervienes`, color: "#b7791f", bg: "#fefcbf" },
    { id: "express", emoji: "⚡", label: "Express", desc: "Nova responde inmediatamente (solo datos verificables)", color: "#276749", bg: "#f0fff4" },
  ];

  const inputStyle = { padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#1a365d", width: "100%", boxSizing: "border-box" };

  if (!isPro) {
    return (
      <div style={{ background: "linear-gradient(135deg,#1a365d,#553c9a)", borderRadius: 14, padding: "22px 24px", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 24 }}>💬</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Nova por WhatsApp</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)" }}>Tu asistente administrativo 24/7 por WhatsApp</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.8)", marginBottom: 14, lineHeight: 1.6 }}>
          Tus clientes preguntan por WhatsApp y Nova responde con los datos del presupuesto.
          Tú le escribes a Nova y ella actualiza tus proyectos sin abrir la app.
        </div>
        <div style={{ background: "rgba(255,255,255,.15)", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "rgba(255,255,255,.9)", fontWeight: 600 }}>
          ⚡ Disponible en planes Pro y Empresa
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d", marginBottom: 4, borderBottom: "2px solid #ebf8ff", paddingBottom: 7, display: "flex", alignItems: "center", gap: 8 }}>
        💬 Nova por WhatsApp
        {enabled && <span style={{ fontSize: 10, background: "#f0fff4", color: "#276749", padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>Activo</span>}
      </div>
      <div style={{ fontSize: 12, color: "#718096", marginBottom: 16, lineHeight: 1.5 }}>
        Nova responde a tus clientes por WhatsApp y funciona como tu administrativa virtual.
        Tú le escribes a Nova por WA y ella ejecuta acciones en tu workspace.
      </div>

      {/* Toggle principal */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, padding: "12px 16px", background: enabled ? "#f0fff4" : "#f7fafc", borderRadius: 10, border: `1px solid ${enabled ? "#9ae6b4" : "#e2e8f0"}` }}>
        <button onClick={() => setEnabled(!enabled)} style={{
          width: 48, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
          background: enabled ? "#276749" : "#cbd5e0", position: "relative", transition: "background .2s",
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: 11, background: "white",
            position: "absolute", top: 2, left: enabled ? 24 : 2, transition: "left .2s",
            boxShadow: "0 1px 3px rgba(0,0,0,.2)",
          }} />
        </button>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1a365d" }}>
            {enabled ? "WhatsApp activo" : "WhatsApp desactivado"}
          </div>
          <div style={{ fontSize: 11, color: "#718096" }}>
            {enabled ? "Nova está respondiendo por WhatsApp" : "Activa para que Nova gestione tus mensajes WA"}
          </div>
        </div>
      </div>

      {enabled && (
        <>
          {/* ── Números autorizados ──────────────────────────────────────── */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1a365d", marginBottom: 8 }}>
              📱 Números autorizados
            </div>
            <div style={{ fontSize: 11, color: "#718096", marginBottom: 10 }}>
              Los números registrados como "Administrador" pueden dar órdenes a Nova (agregar partidas, cambiar precios, enviar mensajes).
              Los "Operador" solo pueden consultar estado y registrar avances.
            </div>

            {/* Lista números existenti */}
            {phones.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#f7fafc", borderRadius: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 14 }}>{p.role === "owner" ? "👑" : "👷"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1a365d" }}>{p.phone}</div>
                  <div style={{ fontSize: 10, color: "#718096" }}>{p.label || (p.role === "owner" ? "Administrador" : "Operador")}</div>
                </div>
                <button onClick={() => removePhone(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#e53e3e", fontSize: 14 }}>✕</button>
              </div>
            ))}

            {/* Aggiungi numero */}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input value={newPhone} onChange={e => setNewPhone(e.target.value)}
                placeholder="+56 9 1234 5678" style={{ ...inputStyle, flex: 1 }}
                onKeyDown={e => e.key === "Enter" && addPhone()} />
              <select value={newPhoneRole} onChange={e => setNewPhoneRole(e.target.value)}
                style={{ ...inputStyle, width: 140 }}>
                <option value="owner">👑 Administrador</option>
                <option value="operator">👷 Operador</option>
              </select>
              <button onClick={addPhone} style={{
                padding: "9px 14px", background: "#1a365d", color: "white", border: "none",
                borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap",
              }}>+ Agregar</button>
            </div>
            {phones.length === 0 && (
              <div style={{ fontSize: 11, color: "#e53e3e", marginTop: 6 }}>
                ⚠️ Agrega al menos tu número para que Nova te reconozca por WhatsApp
              </div>
            )}
          </div>

          {/* ── Modo de respuesta (3 corsie) ────────────────────────────── */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1a365d", marginBottom: 8 }}>
              🛣️ Modo de respuesta a clientes
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {MODES.map(m => (
                <button key={m.id} onClick={() => setMode(m.id)} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                  borderRadius: 10, border: `2px solid ${mode === m.id ? m.color : "#e2e8f0"}`,
                  background: mode === m.id ? m.bg : "white", cursor: "pointer", textAlign: "left",
                  transition: "all .15s",
                }}>
                  <span style={{ fontSize: 20 }}>{m.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.label}</div>
                    <div style={{ fontSize: 11, color: "#718096" }}>{m.desc}</div>
                  </div>
                  {mode === m.id && <span style={{ fontSize: 16, color: m.color }}>✓</span>}
                </button>
              ))}
            </div>
            {mode === "assisted" && (
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ fontSize: 12, color: "#4a5568", fontWeight: 600 }}>Tiempo de espera:</label>
                <select value={timeout} onChange={e => setTimeout_(e.target.value)} style={{ ...inputStyle, width: 120 }}>
                  <option value={120}>2 minutos</option>
                  <option value={300}>5 minutos</option>
                  <option value={600}>10 minutos</option>
                  <option value={900}>15 minutos</option>
                </select>
              </div>
            )}
            {mode === "express" && (
              <div style={{ marginTop: 8, padding: "8px 12px", background: "#fff5f5", borderRadius: 8, fontSize: 11, color: "#c53030", border: "1px solid #fed7d7" }}>
                ⚠️ En modo Express, Nova responde inmediatamente. Solo usa datos verificables del presupuesto. Asegúrate de que tus presupuestos estén completos antes de activar.
              </div>
            )}
          </div>

          {/* ── Capacidades Nova ─────────────────────────────────────────── */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1a365d", marginBottom: 8 }}>
              🧠 ¿Qué puede hacer Nova con los clientes?
            </div>
            {[
              { key: "prices", val: canPrices, set: setCanPrices, label: "Dar precios indicativos", desc: "Nova puede dar estimaciones de precio basadas en el mercado", emoji: "💰" },
              { key: "cotiza", val: canCotiza, set: setCanCotiza, label: "Generar cotizaciones (/cotiza)", desc: "Nova puede crear presupuestos rápidos para nuevos clientes", emoji: "⚡" },
              { key: "visits", val: canVisits, set: setCanVisits, label: "Agendar visitas", desc: "Nova puede proponer horarios de visita a obra", emoji: "📅" },
            ].map(cap => (
              <div key={cap.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#f7fafc", borderRadius: 8, marginBottom: 6 }}>
                <button onClick={() => cap.set(!cap.val)} style={{
                  width: 40, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
                  background: cap.val ? "#276749" : "#cbd5e0", position: "relative", transition: "background .2s", flexShrink: 0,
                }}>
                  <div style={{ width: 18, height: 18, borderRadius: 9, background: "white", position: "absolute", top: 2, left: cap.val ? 20 : 2, transition: "left .2s", boxShadow: "0 1px 2px rgba(0,0,0,.2)" }} />
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#1a365d" }}>{cap.emoji} {cap.label}</div>
                  <div style={{ fontSize: 10, color: "#718096" }}>{cap.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Mensaje de bienvenida ─────────────────────────────────────── */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1a365d", marginBottom: 6 }}>
              👋 Mensaje de bienvenida (nuevos contactos)
            </div>
            <textarea value={greeting} onChange={e => setGreeting(e.target.value)}
              placeholder={`Hola! 👋 Gracias por contactar a ${workspace?.name || "nuestra empresa"}. Tu mensaje fue recibido y te responderemos a la brevedad.`}
              rows={3}
              style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
            <div style={{ fontSize: 10, color: "#718096", marginTop: 4 }}>
              Se envía automáticamente a números nuevos que no están en tus proyectos
            </div>
          </div>
        </>
      )}

      {/* ── Botón guardar ────────────────────────────────────────────── */}
      <button onClick={handleSave} disabled={saving}
        style={{
          width: "100%", padding: "12px", borderRadius: 10, border: "none", cursor: "pointer",
          background: saved ? "#276749" : saving ? "#a0aec0" : "linear-gradient(135deg,#1a365d,#2b6cb0)",
          color: "white", fontWeight: 700, fontSize: 14, transition: "all .2s",
        }}>
        {saving ? "⏳ Guardando..." : saved ? "✅ Configuración guardada" : "💾 Guardar configuración WhatsApp"}
      </button>

      {/* Info sandbox */}
      {enabled && (
        <div style={{ marginTop: 12, padding: "10px 14px", background: "#f7fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#1a365d", marginBottom: 4 }}>📋 Para activar WhatsApp Business:</div>
          <div style={{ fontSize: 10, color: "#718096", lineHeight: 1.6 }}>
            1. Configura Twilio en tu cuenta ObraNova (administración)<br/>
            2. El webhook se configura automáticamente al activar<br/>
            3. Para testing con sandbox: envía "join flies-total" al +14155238886 desde cada número
          </div>
        </div>
      )}
    </div>
  );
}

export default function TabSettings({
  workspace, members, myRole, can,
  onInvite, onChangeRole, onRemoveMember, onUpdateName, onGoToPiani,
  user, onToast, onBackup,
  onRequestPush, pushPermission = "default",
  onRestartOnboarding,
}) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole,  setInviteRole]  = useState(ROLES.MEMBER);
  const [editName,    setEditName]    = useState(false);
  const [newName,     setNewName]     = useState(workspace?.name || "");
  const [loading,     setLoading]     = useState(false);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setLoading(true);
    await onInvite(inviteEmail.trim(), inviteRole);
    setInviteEmail("");
    setLoading(false);
  };

  const handleSaveName = async () => {
    await onUpdateName(newName);
    setEditName(false);
  };

  return (
    <div style={{ display:"flex",flexDirection:"column",gap:16,maxWidth:760,margin:"0 auto" }}>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#1a365d,#2d3748)",borderRadius:12,padding:"18px 20px",color:"white" }}>
        <div style={{ fontSize:18,fontWeight:800,marginBottom:3 }}>⚙️ Ajustes del Workspace</div>
        <div style={{ color:"#a0aec0",fontSize:12 }}>Gestiona tu empresa, colaboradores y presentación PDF</div>
      </div>

      {/* Dati azienda */}
      <div style={{ background:"white",borderRadius:12,padding:18,boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
        <div style={{ fontWeight:700,fontSize:14,color:"#1a365d",marginBottom:14,borderBottom:"2px solid #ebf8ff",paddingBottom:7 }}>
          🏢 Datos de la Empresa
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr auto",gap:10,alignItems:"center" }}>
          {editName ? (
            <>
              <input value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key==="Enter" && handleSaveName()} autoFocus
                style={{ padding:"9px 12px",border:"2px solid #2b6cb0",borderRadius:8,fontSize:14,color:"#1a365d" }} />
              <div style={{ display:"flex",gap:7 }}>
                <button onClick={handleSaveName} style={{ padding:"8px 14px",background:"#276749",color:"white",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700 }}>✅</button>
                <button onClick={() => setEditName(false)} style={{ padding:"8px 14px",background:"#f7fafc",color:"#718096",border:"1px solid #e2e8f0",borderRadius:8,cursor:"pointer" }}>✕</button>
              </div>
            </>
          ) : (
            <>
              <div>
                <div style={{ fontSize:18,fontWeight:800,color:"#1a365d" }}>{workspace?.name}</div>
                <div style={{ fontSize:12,color:"#718096",marginTop:3 }}>
                  Plan: <strong style={{ color:"#553c9a" }}>{workspace?.plan || "free"}</strong>
                  {" · "}ID: <span style={{ fontFamily:"monospace",fontSize:11 }}>{workspace?.id?.slice(-8)}</span>
                </div>
              </div>
              {can("manage_workspace") && (
                <button onClick={() => { setNewName(workspace?.name||""); setEditName(true); }}
                  style={{ padding:"7px 14px",background:"#ebf8ff",color:"#2b6cb0",border:"1px solid #bee3f8",borderRadius:8,cursor:"pointer",fontWeight:600,fontSize:12 }}>
                  ✏️ Editar
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Datos Tributarios SII ─────────────────────────────────────────── */}
      <DatosTributariosSection />

      {/* ── Personalizzazione PDF ──────────────────────────────────────────── */}
      <PDFSettingsSection plan={workspace?.plan} onGoToPiani={onGoToPiani} />

      {/* Invita membro */}
      {can("invite_members") && (
        <div style={{ background:"white",borderRadius:12,padding:18,boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ fontWeight:700,fontSize:14,color:"#1a365d",marginBottom:14,borderBottom:"2px solid #ebf8ff",paddingBottom:7 }}>
            ✉️ Invitar Colaborador
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
              onKeyDown={e => e.key==="Enter" && handleInvite()}
              placeholder="email@colaborador.com" type="email"
              style={{ padding:"9px 12px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:13,color:"#1a365d" }} />
            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
              style={{ padding:"9px 10px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:13,color:"#1a365d",background:"white" }}>
              {Object.entries(ROLE_LABELS).filter(([r]) => r!==ROLES.OWNER).map(([r,l]) => <option key={r} value={r}>{l}</option>)}
            </select>
            <button onClick={handleInvite} disabled={loading || !inviteEmail.trim()}
              style={{ padding:"9px 16px",background:"#1a365d",color:"white",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:13,opacity:!inviteEmail.trim()?.5:1,whiteSpace:"nowrap" }}>
              {loading ? "..." : "📨 Invitar"}
            </button>
          </div>
          <div style={{ marginTop:14,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:8 }}>
            {Object.entries(ROLE_LABELS).filter(([r]) => r!==ROLES.OWNER).map(([r,l]) => {
              const rc = ROLE_COLORS[r];
              const desc = { admin:"Acceso total excepto gestión workspace", member:"Crea y edita sus proyectos", viewer:"Solo lectura, sin modificaciones" };
              return (
                <div key={r} style={{ padding:"9px 11px",borderRadius:9,background:rc.bg,border:`1px solid ${rc.border}` }}>
                  <div style={{ fontWeight:700,fontSize:12,color:rc.color,marginBottom:2 }}>{l}</div>
                  <div style={{ fontSize:11,color:"#718096" }}>{desc[r]}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lista membri */}
      <div style={{ background:"white",borderRadius:12,padding:18,boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
        <div style={{ fontWeight:700,fontSize:14,color:"#1a365d",marginBottom:14,borderBottom:"2px solid #ebf8ff",paddingBottom:7 }}>
          👥 Miembros ({members.length})
        </div>
        {members.length === 0 ? (
          <div style={{ textAlign:"center",padding:"30px 0",color:"#a0aec0" }}>Sin miembros. ¡Invita a alguien!</div>
        ) : (
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {members.map(m => {
              const rc = ROLE_COLORS[m.role] || ROLE_COLORS.member;
              const isMe = m.uid === window.__currentUid;
              const isOwner = m.role === ROLES.OWNER;
              return (
                <div key={m.uid} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",
                  padding:"11px 14px",background:isMe?"#f0fff4":"#f7fafc",borderRadius:10,gap:10,flexWrap:"wrap",
                  border:isMe?"1px solid #9ae6b4":"1px solid transparent" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                    <div style={{ width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,${rc.color},${rc.border})`,
                      display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:800,fontSize:14,flexShrink:0 }}>
                      {(m.displayName||m.email||"?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight:700,fontSize:13,color:"#1a365d" }}>
                        {m.displayName||m.email}
                        {isMe && <span style={{ marginLeft:6,fontSize:10,color:"#276749",fontWeight:600 }}>(tú)</span>}
                      </div>
                      <div style={{ fontSize:11,color:"#718096" }}>{m.email}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                    {can("manage_members") && !isMe && !isOwner ? (
                      <select value={m.role} onChange={e => onChangeRole(m.uid,e.target.value)}
                        style={{ padding:"5px 8px",borderRadius:7,border:`1px solid ${rc.border}`,background:rc.bg,color:rc.color,fontSize:12,fontWeight:700,cursor:"pointer" }}>
                        {Object.entries(ROLE_LABELS).filter(([r]) => r!==ROLES.OWNER).map(([r,l]) => <option key={r} value={r}>{l}</option>)}
                      </select>
                    ) : (
                      <span style={{ padding:"4px 10px",borderRadius:99,fontSize:11,fontWeight:700,background:rc.bg,color:rc.color,border:`1px solid ${rc.border}` }}>
                        {ROLE_LABELS[m.role]}
                      </span>
                    )}
                    {can("manage_members") && !isMe && !isOwner && (
                      <button onClick={() => onRemoveMember(m.uid)} aria-label="Eliminar miembro"
                        style={{ padding:"5px 9px",background:"#fff5f5",border:"1px solid #fed7d7",borderRadius:7,cursor:"pointer",color:"#c53030",fontSize:12 }}>🗑️</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Piano */}
      <div style={{ background:"linear-gradient(135deg,#553c9a,#2b6cb0)",borderRadius:12,padding:"18px 20px",color:"white",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12 }}>
        <div>
          <div style={{ fontWeight:700,fontSize:14,marginBottom:4 }}>
            💎 Plan actual: <span style={{ textTransform:"capitalize",color:"#fef08a" }}>{workspace?.plan||"Free"}</span>
          </div>
          <div style={{ fontSize:12,color:"rgba(255,255,255,.7)" }}>
            {workspace?.plan==="free"
              ? "3 proyectos · 1 usuario. Pasa a Pro para desbloquear todo."
              : workspace?.plan==="pro"
              ? "Proyectos ilimitados · PDF personalizado · Templates"
              : "Todo incluido · 5 usuarios · WhatsApp · Multi-workspace"}
          </div>
        </div>
        {workspace?.plan==="free" && onGoToPiani && (
          <button
            onClick={onGoToPiani}
            style={{ padding:"9px 20px",background:"white",color:"#553c9a",border:"none",borderRadius:9,cursor:"pointer",fontWeight:800,fontSize:13,whiteSpace:"nowrap" }}>
            🚀 Ver planes →
          </button>
        )}
      </div>

      {/* Push Notifications */}
      <div style={{ background: "white", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.07)", marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
          🔔 Notificaciones push
        </div>
        <div style={{ fontSize: 12, color: "#718096", marginBottom: 14, lineHeight: 1.6 }}>
          Recibe alertas en tu dispositivo cuando un cliente comenta, firma un presupuesto o hay una acción importante en tu workspace.
        </div>
        {pushPermission === "granted" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#f0fff4", borderRadius: 9, border: "1px solid #9ae6b4" }}>
            <span>✅</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#276749" }}>Notificaciones activadas en este dispositivo</span>
          </div>
        ) : pushPermission === "denied" ? (
          <div style={{ padding: "10px 14px", background: "#fff5f5", borderRadius: 9, border: "1px solid #feb2b2", fontSize: 12, color: "#c53030" }}>
            ⚠️ Las notificaciones están bloqueadas en este navegador. Para activarlas, ve a la configuración del sitio en tu navegador y permite las notificaciones para app.obranova.cl.
          </div>
        ) : (
          <button
            onClick={async () => {
              const result = await onRequestPush?.();
              if (result === "granted") onToast?.("🔔 Notificaciones activadas");
              else if (result === "denied") onToast?.("⚠️ Permiso denegado — actívalas desde el navegador");
            }}
            style={{ padding: "10px 22px", background: "#1a365d", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}
          >
            🔔 Activar notificaciones push
          </button>
        )}
      </div>

      {/* Reporte Mensual */}
      <div style={{ background: "white", borderRadius: 12, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.07)", marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
          📈 Reporte mensual automático
        </div>
        <div style={{ fontSize: 12, color: "#718096", marginBottom: 14, lineHeight: 1.6 }}>
          El 1° de cada mes recibirás un email con los KPIs del mes anterior: facturación, margen, tasa de conversión y proyectos. Solo para planes Pro y Empresa.
        </div>
        <ReporteButton wsId={workspace?.id} uid={user?.uid} onToast={onToast} />
      </div>

      {/* Backup */}
      <BackupSection onBackup={onBackup} onToast={onToast} can={can} userEmail={user?.email} />

      {/* ═══ WhatsApp Business — Nova por WhatsApp ═══════════════════════ */}
      <WhatsAppConfigSection workspace={workspace} can={can} members={members} onToast={onToast} />

      {/* ── Scadenzario reminder ── */}
      <ScadenzarioSection workspace={workspace} can={can} onToast={onToast} />

      {/* 4.6 Referral */}
      <ReferralCard workspace={workspace} userEmail={user?.email} onToast={onToast} />

      {/* ── Eliminar cuenta ── */}
      <EliminarCuentaSection user={user} onToast={onToast} />


      {/* ── Reiniciar onboarding ──────────────────────────────────────── */}
      {onRestartOnboarding && (
        <div style={{ marginTop: 24, background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1a365d", marginBottom: 2 }}>🧭 Guía de inicio</div>
            <div style={{ fontSize: 12, color: "#718096" }}>Vuelve a ver el asistente de configuración inicial</div>
          </div>
          <button onClick={onRestartOnboarding} style={{ padding: "8px 16px", background: "#EBF5FB", color: "#2b6cb0", border: "1px solid #bee3f8", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            Reiniciar →
          </button>
        </div>
      )}
    </div>
  );
}
