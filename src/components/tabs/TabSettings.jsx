// ─── components/tabs/TabSettings.jsx ────────────────────────────────────────
import { useState } from "react";
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

// ─── Sezione personalizzazione PDF ───────────────────────────────────────────
function PDFSettingsSection({ plan = "free", onGoToPiani }) {
  const isPro = plan === "pro" || plan === "team" || plan === "enterprise";

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
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:10 }}>
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
export default function TabSettings({
  workspace, members, myRole, can,
  onInvite, onChangeRole, onRemoveMember, onUpdateName, onGoToPiani,
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

      {/* ── Personalizzazione PDF ──────────────────────────────────────────── */}
      <PDFSettingsSection plan={workspace?.plan} onGoToPiani={onGoToPiani} />

      {/* Invita membro */}
      {can("invite_members") && (
        <div style={{ background:"white",borderRadius:12,padding:18,boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ fontWeight:700,fontSize:14,color:"#1a365d",marginBottom:14,borderBottom:"2px solid #ebf8ff",paddingBottom:7 }}>
            ✉️ Invitar Colaborador
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr auto auto",gap:10,alignItems:"center" }}>
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
    </div>
  );
}
