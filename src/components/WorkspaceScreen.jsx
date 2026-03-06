// ─── components/WorkspaceScreen.jsx ─────────────────────────────────────────
// Schermata mostrata dopo il login quando l'utente deve:
//   a) scegliere un workspace esistente
//   b) creare il primo workspace
//   c) accettare/rifiutare inviti pendenti

import { useState, useEffect } from "react";
import { LOGO_URL } from "../utils/constants";
import { ROLE_LABELS, ROLE_COLORS } from "../hooks/useWorkspace";

export default function WorkspaceScreen({
  workspaces,
  pendingInvites,
  onSelect,
  onCreate,
  onAcceptInvite,
  onRejectInvite,
  userEmail,
}) {
  const [newName,  setNewName]  = useState("");
  const [creating, setCreating] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    const ws = await onCreate(newName);
    if (ws) onSelect(ws);
    setLoading(false);
  };

  const handleAccept = async (invite) => {
    setLoading(true);
    const ok = await onAcceptInvite(invite);
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#1a365d 0%,#2d3748 60%,#1a202c 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, fontFamily: "'Segoe UI',system-ui,sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 520 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src={LOGO_URL} alt="Obra Nova" style={{ height: 52, marginBottom: 12 }}
            onError={e => { e.target.style.display = "none"; }} />
          <div style={{ color: "white", fontSize: 24, fontWeight: 800, letterSpacing: .3 }}>Obra Nova</div>
          <div style={{ color: "#a0aec0", fontSize: 13, marginTop: 4 }}>{userEmail}</div>
        </div>

        {/* Inviti pendenti */}
        {pendingInvites.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: "#f6e05e", fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
              📬 Hai {pendingInvites.length} invito{pendingInvites.length > 1 ? "i" : ""} in attesa
            </div>
            {pendingInvites.map(inv => {
              const rc = ROLE_COLORS[inv.role] || ROLE_COLORS.member;
              return (
                <div key={inv.id} style={{
                  background: "white", borderRadius: 12, padding: "14px 16px",
                  marginBottom: 10, display: "flex", justifyContent: "space-between",
                  alignItems: "center", gap: 10, flexWrap: "wrap",
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d" }}>{inv.workspaceName}</div>
                    <div style={{ fontSize: 12, color: "#718096", marginTop: 2 }}>
                      Invitato da {inv.invitedByEmail} come{" "}
                      <span style={{ padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: rc.bg, color: rc.color, border: `1px solid ${rc.border}` }}>
                        {ROLE_LABELS[inv.role]}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 7 }}>
                    <button onClick={() => handleAccept(inv)} disabled={loading}
                      style={{ padding: "7px 14px", background: "#276749", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
                      ✅ Accetta
                    </button>
                    <button onClick={() => onRejectInvite(inv.id)} disabled={loading}
                      style={{ padding: "7px 14px", background: "#fff5f5", color: "#c53030", border: "1px solid #fed7d7", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
                      ✕ Rifiuta
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Workspace esistenti */}
        {workspaces.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: "#a0aec0", fontSize: 12, fontWeight: 600, marginBottom: 10, letterSpacing: .5 }}>
              LE TUE AZIENDE
            </div>
            {workspaces.map(ws => {
              const rc = ROLE_COLORS[ws.myRole] || ROLE_COLORS.member;
              return (
                <div
                  key={ws.id}
                  onClick={() => onSelect(ws)}
                  role="button" tabIndex={0}
                  onKeyDown={e => e.key === "Enter" && onSelect(ws)}
                  style={{
                    background: "white", borderRadius: 12, padding: "16px 18px",
                    marginBottom: 10, cursor: "pointer", display: "flex",
                    justifyContent: "space-between", alignItems: "center",
                    transition: "transform .15s, box-shadow .15s",
                    boxShadow: "0 4px 12px rgba(0,0,0,.15)",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,.15)"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 10,
                      background: "linear-gradient(135deg,#1a365d,#2b6cb0)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 18, color: "white", fontWeight: 800, flexShrink: 0,
                    }}>
                      {ws.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#1a365d" }}>{ws.name}</div>
                      <div style={{ fontSize: 11, color: "#718096", marginTop: 2 }}>
                        Piano: <strong>{ws.plan || "free"}</strong>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                      background: rc.bg, color: rc.color, border: `1px solid ${rc.border}`,
                    }}>{ROLE_LABELS[ws.myRole]}</span>
                    <span style={{ color: "#a0aec0", fontSize: 18 }}>›</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Crea nuovo workspace */}
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            style={{
              width: "100%", padding: "14px", borderRadius: 12,
              border: "2px dashed rgba(255,255,255,.3)",
              background: "rgba(255,255,255,.05)",
              color: "white", cursor: "pointer", fontSize: 14, fontWeight: 600,
              transition: "all .2s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.1)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.05)"}
          >
            + Crea nuova azienda
          </button>
        )}

        {creating && (
          <div style={{ background: "white", borderRadius: 12, padding: 20, boxShadow: "0 8px 32px rgba(0,0,0,.2)" }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1a365d", marginBottom: 14 }}>
              🏢 Nuova azienda
            </div>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreate()}
              placeholder="Nome azienda (es. Edil Rossi SRL)"
              autoFocus
              style={{
                width: "100%", padding: "11px 14px", border: "2px solid #e2e8f0",
                borderRadius: 9, fontSize: 14, color: "#1a365d", background: "white",
                boxSizing: "border-box", marginBottom: 12, outline: "none",
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleCreate} disabled={loading || !newName.trim()}
                style={{
                  flex: 1, padding: "11px", background: "#1a365d", color: "white",
                  border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 14,
                  opacity: !newName.trim() ? .5 : 1,
                }}>
                {loading ? "Creazione..." : "✅ Crea azienda"}
              </button>
              <button onClick={() => setCreating(false)}
                style={{ padding: "11px 16px", background: "#f7fafc", color: "#718096", border: "1px solid #e2e8f0", borderRadius: 9, cursor: "pointer", fontWeight: 600 }}>
                Annulla
              </button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {workspaces.length === 0 && pendingInvites.length === 0 && !creating && (
          <div style={{ textAlign: "center", color: "#a0aec0", fontSize: 13, marginTop: 16 }}>
            Nessuna azienda trovata. Creane una per iniziare.
          </div>
        )}
      </div>
    </div>
  );
}
