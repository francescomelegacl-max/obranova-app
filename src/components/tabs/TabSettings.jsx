// ─── components/tabs/TabSettings.jsx ────────────────────────────────────────
// Tab Impostazioni: gestione workspace, membri, inviti, ruoli.

import { useState } from "react";
import { ROLES, ROLE_LABELS, ROLE_COLORS } from "../../hooks/useWorkspace";

export default function TabSettings({
  workspace, members, myRole, can,
  onInvite, onChangeRole, onRemoveMember, onUpdateName,
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

  const currentUid = () => {
    // Recupera uid dall'auth — importato via prop o da window
    return window.__currentUid;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 760, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1a365d,#2d3748)", borderRadius: 12, padding: "18px 20px", color: "white" }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 3 }}>⚙️ Impostazioni Workspace</div>
        <div style={{ color: "#a0aec0", fontSize: 12 }}>Gestisci la tua azienda e i collaboratori</div>
      </div>

      {/* Dati azienda */}
      <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d", marginBottom: 14, borderBottom: "2px solid #ebf8ff", paddingBottom: 7 }}>
          🏢 Dati Azienda
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center" }}>
          {editName ? (
            <>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSaveName()}
                autoFocus
                style={{ padding: "9px 12px", border: "2px solid #2b6cb0", borderRadius: 8, fontSize: 14, color: "#1a365d" }}
              />
              <div style={{ display: "flex", gap: 7 }}>
                <button onClick={handleSaveName} style={{ padding: "8px 14px", background: "#276749", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>✅</button>
                <button onClick={() => setEditName(false)} style={{ padding: "8px 14px", background: "#f7fafc", color: "#718096", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>✕</button>
              </div>
            </>
          ) : (
            <>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#1a365d" }}>{workspace?.name}</div>
                <div style={{ fontSize: 12, color: "#718096", marginTop: 3 }}>
                  Piano: <strong style={{ color: "#553c9a" }}>{workspace?.plan || "free"}</strong>
                  {" · "}ID: <span style={{ fontFamily: "monospace", fontSize: 11 }}>{workspace?.id?.slice(-8)}</span>
                </div>
              </div>
              {can("manage_workspace") && (
                <button onClick={() => { setNewName(workspace?.name || ""); setEditName(true); }}
                  style={{ padding: "7px 14px", background: "#ebf8ff", color: "#2b6cb0", border: "1px solid #bee3f8", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
                  ✏️ Modifica
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Invita membro */}
      {can("invite_members") && (
        <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d", marginBottom: 14, borderBottom: "2px solid #ebf8ff", paddingBottom: 7 }}>
            ✉️ Invita Collaboratore
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, alignItems: "center" }}>
            <input
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleInvite()}
              placeholder="email@collaboratore.com"
              type="email"
              style={{ padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#1a365d" }}
            />
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value)}
              style={{ padding: "9px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#1a365d", background: "white" }}
            >
              {Object.entries(ROLE_LABELS)
                .filter(([r]) => r !== ROLES.OWNER) // non si può invitare come owner
                .map(([r, l]) => (
                  <option key={r} value={r}>{l}</option>
                ))
              }
            </select>
            <button onClick={handleInvite} disabled={loading || !inviteEmail.trim()}
              style={{
                padding: "9px 16px", background: "#1a365d", color: "white",
                border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13,
                opacity: !inviteEmail.trim() ? .5 : 1, whiteSpace: "nowrap",
              }}>
              {loading ? "..." : "📨 Invita"}
            </button>
          </div>

          {/* Legenda ruoli */}
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 8 }}>
            {Object.entries(ROLE_LABELS).filter(([r]) => r !== ROLES.OWNER).map(([r, l]) => {
              const rc = ROLE_COLORS[r];
              const descriptions = {
                admin:  "Tutto tranne gestire il workspace",
                member: "Crea e modifica i propri progetti",
                viewer: "Solo visualizzazione, nessuna modifica",
              };
              return (
                <div key={r} style={{ padding: "9px 11px", borderRadius: 9, background: rc.bg, border: `1px solid ${rc.border}` }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: rc.color, marginBottom: 2 }}>
                    {l}
                  </div>
                  <div style={{ fontSize: 11, color: "#718096" }}>{descriptions[r]}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lista membri */}
      <div style={{ background: "white", borderRadius: 12, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d", marginBottom: 14, borderBottom: "2px solid #ebf8ff", paddingBottom: 7 }}>
          👥 Membri ({members.length})
        </div>
        {members.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "#a0aec0" }}>
            Nessun membro. Invita qualcuno!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {members.map(m => {
              const rc = ROLE_COLORS[m.role] || ROLE_COLORS.member;
              const isMe = m.uid === window.__currentUid;
              const isOwner = m.role === ROLES.OWNER;
              return (
                <div key={m.uid} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "11px 14px", background: isMe ? "#f0fff4" : "#f7fafc",
                  borderRadius: 10, gap: 10, flexWrap: "wrap",
                  border: isMe ? "1px solid #9ae6b4" : "1px solid transparent",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: `linear-gradient(135deg,${rc.color},${rc.border})`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "white", fontWeight: 800, fontSize: 14, flexShrink: 0,
                    }}>
                      {(m.displayName || m.email || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#1a365d" }}>
                        {m.displayName || m.email}
                        {isMe && <span style={{ marginLeft: 6, fontSize: 10, color: "#276749", fontWeight: 600 }}>(tu)</span>}
                      </div>
                      <div style={{ fontSize: 11, color: "#718096" }}>{m.email}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {/* Cambio ruolo — solo owner può farlo, e non su se stesso */}
                    {can("manage_members") && !isMe && !isOwner ? (
                      <select
                        value={m.role}
                        onChange={e => onChangeRole(m.uid, e.target.value)}
                        style={{
                          padding: "5px 8px", borderRadius: 7, border: `1px solid ${rc.border}`,
                          background: rc.bg, color: rc.color, fontSize: 12, fontWeight: 700, cursor: "pointer",
                        }}
                      >
                        {Object.entries(ROLE_LABELS)
                          .filter(([r]) => r !== ROLES.OWNER)
                          .map(([r, l]) => <option key={r} value={r}>{l}</option>)
                        }
                      </select>
                    ) : (
                      <span style={{
                        padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                        background: rc.bg, color: rc.color, border: `1px solid ${rc.border}`,
                      }}>{ROLE_LABELS[m.role]}</span>
                    )}

                    {/* Rimuovi membro */}
                    {can("manage_members") && !isMe && !isOwner && (
                      <button
                        onClick={() => onRemoveMember(m.uid)}
                        aria-label="Rimuovi membro"
                        style={{ padding: "5px 9px", background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 7, cursor: "pointer", color: "#c53030", fontSize: 12 }}
                      >🗑️</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info piano */}
      <div style={{ background: "linear-gradient(135deg,#553c9a,#2b6cb0)", borderRadius: 12, padding: "18px 20px", color: "white" }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>
          💎 Piano attuale: <span style={{ textTransform: "capitalize" }}>{workspace?.plan || "Free"}</span>
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)", marginBottom: 12 }}>
          {workspace?.plan === "free"
            ? "Hai 3 progetti attivi e 1 utente. Passa a Pro per sbloccare tutto."
            : "Grazie per essere un cliente Pro!"}
        </div>
        {workspace?.plan === "free" && (
          <button style={{ padding: "8px 18px", background: "white", color: "#553c9a", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
            🚀 Upgrade a Pro — $19/mese
          </button>
        )}
      </div>

    </div>
  );
}
