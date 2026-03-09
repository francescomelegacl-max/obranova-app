// ─── components/tabs/AdminDashboard.jsx ──────────────────────────────────────
// Dashboard admin — visibile solo per le email admin hardcodate.
// Legge tutti i workspace da Firestore e calcola MRR, churn, conversione.

import { useState, useEffect, useMemo, useCallback } from "react";
import { collection, getDocs, doc, updateDoc, collectionGroup } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { fmt } from "../../utils/helpers";

// ── Email admin autorizzate ───────────────────────────────────────────────────
const ADMIN_EMAILS = ["francescomelega.cl@gmail.com", "melegaf@gmail.com"];

// ── Prezzi piani (CLP/mese) ───────────────────────────────────────────────────
const PLAN_MRR = { free: 0, pro: 19900, team: 39900, enterprise: 79900 };

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtK = (n) => n >= 1000000 ? `$${(n/1000000).toFixed(1)}M` : n >= 1000 ? `$${(n/1000).toFixed(0)}K` : fmt(n);
const thisMonth = () => new Date().toISOString().slice(0, 7);
const lastMonth = () => { const d = new Date(); d.setMonth(d.getMonth()-1); return d.toISOString().slice(0,7); };

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color = "#1a365d", bg = "#ebf8ff" }) {
  return (
    <div style={{ background: bg, border: `1px solid ${color}22`, borderRadius: 14, padding: "16px 20px" }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 700, color, marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#718096", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

// ── Barra piano ───────────────────────────────────────────────────────────────
function PlanBar({ label, count, total, mrr, color }) {
  const pct = total > 0 ? Math.round(count / total * 100) : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#2d3748" }}>{label}</span>
        <span style={{ fontSize: 12, color: "#718096" }}>{count} ws · {pct}% · {mrr > 0 ? fmtK(mrr)+"/mes" : "—"}</span>
      </div>
      <div style={{ height: 8, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width .4s" }} />
      </div>
    </div>
  );
}

// ─── Componente principale ────────────────────────────────────────────────────
export default function AdminDashboard({ userEmail }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState("");
  const [sortBy,     setSortBy]     = useState("createdAt");
  const [planFilter, setPlanFilter] = useState("tutti");
  const [changingPlan, setChangingPlan] = useState(null);

  // ── Blocco accesso se non admin ───────────────────────────────────────────
  if (!ADMIN_EMAILS.includes(userEmail)) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "#c53030" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🚫</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Accesso non autorizzato</div>
      </div>
    );
  }

  // ── Carica tutti i workspace ──────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const wsSnap = await getDocs(collection(db, "workspaces"));
      const list = [];
      for (const wsDoc of wsSnap.docs) {
        const data = wsDoc.data();
        // Carica membri per trovare owner email
        let ownerEmail = data.ownerEmail || "";
        if (!ownerEmail) {
          try {
            const membersSnap = await getDocs(collection(db, "workspaces", wsDoc.id, "members"));
            membersSnap.forEach(m => {
              if (m.data().role === "owner") ownerEmail = m.data().email || "";
            });
          } catch {}
        }
        list.push({ id: wsDoc.id, ...data, ownerEmail, memberCount: 0 });
      }
      // Carica conteggio membri via collectionGroup
      try {
        const membersSnap = await getDocs(collectionGroup(db, "members"));
        const counts = {};
        membersSnap.forEach(m => {
          const wsId = m.ref.parent.parent.id;
          counts[wsId] = (counts[wsId] || 0) + 1;
        });
        list.forEach(ws => { ws.memberCount = counts[ws.id] || 0; });
      } catch {}
      list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      setWorkspaces(list);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Cambio piano ──────────────────────────────────────────────────────────
  const handleChangePlan = useCallback(async (wsId, newPlan) => {
    setChangingPlan(wsId);
    try {
      await updateDoc(doc(db, "workspaces", wsId), { plan: newPlan });
      setWorkspaces(list => list.map(ws => ws.id === wsId ? { ...ws, plan: newPlan } : ws));
    } catch (e) {
      alert("Errore: " + e.message);
    } finally {
      setChangingPlan(null);
    }
  }, []);

  // ── KPI calcolati ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total  = workspaces.length;
    const byPlan = { free: 0, pro: 0, team: 0, enterprise: 0 };
    let mrr = 0;
    let newThisMonth = 0;
    let newLastMonth = 0;
    const tm = thisMonth();
    const lm = lastMonth();

    workspaces.forEach(ws => {
      const p = ws.plan || "free";
      byPlan[p] = (byPlan[p] || 0) + 1;
      mrr += PLAN_MRR[p] || 0;
      const month = (ws.createdAt || "").slice(0, 7);
      if (month === tm) newThisMonth++;
      if (month === lm) newLastMonth++;
    });

    const paying    = total - byPlan.free;
    const conv      = total > 0 ? Math.round(paying / total * 100) : 0;
    const arr       = mrr * 12;
    const growth    = newLastMonth > 0 ? Math.round((newThisMonth - newLastMonth) / newLastMonth * 100) : null;

    return { total, byPlan, mrr, arr, paying, conv, newThisMonth, newLastMonth, growth };
  }, [workspaces]);

  // ── Tabella filtrata ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...workspaces];
    if (planFilter !== "tutti") list = list.filter(ws => (ws.plan || "free") === planFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(ws =>
        (ws.name || "").toLowerCase().includes(q) ||
        (ws.ownerEmail || "").toLowerCase().includes(q)
      );
    }
    if (sortBy === "createdAt") list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    if (sortBy === "plan")      list.sort((a, b) => (PLAN_MRR[b.plan||"free"]) - (PLAN_MRR[a.plan||"free"]));
    if (sortBy === "members")   list.sort((a, b) => b.memberCount - a.memberCount);
    if (sortBy === "name")      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    return list;
  }, [workspaces, search, sortBy, planFilter]);

  // ── Export CSV ────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const rows = [["ID","Nome","Owner","Piano","MRR","Membri","Creato"]];
    workspaces.forEach(ws => rows.push([
      ws.id, ws.name || "", ws.ownerEmail || "",
      ws.plan || "free", PLAN_MRR[ws.plan || "free"],
      ws.memberCount, (ws.createdAt || "").slice(0, 10),
    ]));
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\uFEFF"+csv], { type: "text/csv" }));
    a.download = `ObraNova_Workspaces_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const PLAN_COLOR = { free: "#718096", pro: "#2b6cb0", team: "#553c9a", enterprise: "#276749" };
  const PLAN_BG    = { free: "#f7fafc", pro: "#ebf8ff", team: "#faf5ff", enterprise: "#f0fff4" };

  if (loading) return (
    <div style={{ padding: 60, textAlign: "center", color: "#a0aec0" }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
      <div>Caricamento workspace...</div>
    </div>
  );

  if (error) return (
    <div style={{ padding: 40, textAlign: "center", color: "#c53030" }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>❌</div>
      <div style={{ fontWeight: 700 }}>Errore: {error}</div>
      <button onClick={loadAll} style={{ marginTop: 12, padding: "8px 20px", background: "#1a365d", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}>
        Riprova
      </button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#1a365d" }}>🛠️ Admin Dashboard</div>
          <div style={{ fontSize: 12, color: "#718096" }}>Accesso riservato · {workspaces.length} workspace totali</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={exportCSV}
            style={{ padding: "8px 16px", background: "#276749", color: "white", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
            📥 Export CSV
          </button>
          <button onClick={loadAll}
            style={{ padding: "8px 16px", background: "#ebf8ff", color: "#2b6cb0", border: "1px solid #bee3f8", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
            🔄 Aggiorna
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        <KpiCard icon="💰" label="MRR" value={fmtK(stats.mrr)} sub={`ARR: ${fmtK(stats.arr)}`} color="#276749" bg="#f0fff4" />
        <KpiCard icon="🏢" label="Workspace totali" value={stats.total} sub={`+${stats.newThisMonth} questo mese`} color="#1a365d" bg="#ebf8ff" />
        <KpiCard icon="💎" label="Paganti" value={stats.paying} sub={`${stats.conv}% conversione`} color="#553c9a" bg="#faf5ff" />
        <KpiCard icon="📈" label="Nuovi questo mese" value={stats.newThisMonth}
          sub={stats.growth !== null ? `${stats.growth >= 0 ? "+" : ""}${stats.growth}% vs mese scorso` : "—"}
          color={stats.growth >= 0 ? "#276749" : "#c53030"}
          bg={stats.growth >= 0 ? "#f0fff4" : "#fff5f5"} />
      </div>

      {/* Distribuzione piani */}
      <div style={{ background: "white", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#1a365d", marginBottom: 16 }}>📊 Distribuzione piani</div>
        <PlanBar label="Free"        count={stats.byPlan.free}       total={stats.total} mrr={0}                                    color="#a0aec0" />
        <PlanBar label="Pro"         count={stats.byPlan.pro}        total={stats.total} mrr={stats.byPlan.pro * PLAN_MRR.pro}       color="#2b6cb0" />
        <PlanBar label="Team"        count={stats.byPlan.team}       total={stats.total} mrr={stats.byPlan.team * PLAN_MRR.team}     color="#553c9a" />
        <PlanBar label="Enterprise"  count={stats.byPlan.enterprise} total={stats.total} mrr={stats.byPlan.enterprise * PLAN_MRR.enterprise} color="#276749" />
      </div>

      {/* Tabella workspace */}
      <div style={{ background: "white", borderRadius: 14, boxShadow: "0 1px 4px rgba(0,0,0,.07)", overflow: "hidden" }}>
        {/* Toolbar tabella */}
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Cerca workspace o email..."
            style={{ flex: 1, minWidth: 200, padding: "8px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#1a365d" }} />
          <select value={planFilter} onChange={e => setPlanFilter(e.target.value)}
            style={{ padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#1a365d" }}>
            <option value="tutti">Tutti i piani</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="team">Team</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#1a365d" }}>
            <option value="createdAt">Più recenti</option>
            <option value="plan">Per piano</option>
            <option value="members">Per membri</option>
            <option value="name">Nome A-Z</option>
          </select>
          <span style={{ fontSize: 11, color: "#a0aec0" }}>{filtered.length} risultati</span>
        </div>

        {/* Tabella desktop */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#1a365d", color: "white" }}>
                {["Nome workspace","Owner","Piano","MRR","Membri","Creato","Azioni"].map((h, i) => (
                  <th key={i} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, fontSize: 11, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ padding: "30px", textAlign: "center", color: "#a0aec0" }}>Nessun workspace trovato</td></tr>
              )}
              {filtered.map((ws, i) => {
                const plan   = ws.plan || "free";
                const mrr    = PLAN_MRR[plan] || 0;
                const color  = PLAN_COLOR[plan] || "#718096";
                const bg     = PLAN_BG[plan] || "#f7fafc";
                return (
                  <tr key={ws.id} style={{ background: i % 2 === 0 ? "#f7fafc" : "white", borderBottom: "1px solid #f0f4f8" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#ebf8ff"}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#f7fafc" : "white"}>
                    <td style={{ padding: "9px 12px", fontWeight: 700, color: "#1a365d" }}>{ws.name || "—"}</td>
                    <td style={{ padding: "9px 12px", color: "#4a5568", fontSize: 11 }}>{ws.ownerEmail || "—"}</td>
                    <td style={{ padding: "9px 8px" }}>
                      <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                        background: bg, color, border: `1px solid ${color}44` }}>
                        {plan.charAt(0).toUpperCase() + plan.slice(1)}
                      </span>
                    </td>
                    <td style={{ padding: "9px 12px", fontWeight: 700, color: mrr > 0 ? "#276749" : "#a0aec0" }}>
                      {mrr > 0 ? fmtK(mrr) : "—"}
                    </td>
                    <td style={{ padding: "9px 12px", color: "#4a5568", textAlign: "center" }}>{ws.memberCount}</td>
                    <td style={{ padding: "9px 12px", color: "#718096", fontSize: 11 }}>{(ws.createdAt || "").slice(0, 10) || "—"}</td>
                    <td style={{ padding: "9px 8px" }}>
                      <select
                        value={plan}
                        disabled={changingPlan === ws.id}
                        onChange={e => handleChangePlan(ws.id, e.target.value)}
                        style={{ padding: "4px 8px", border: `1px solid ${color}`, borderRadius: 7,
                          fontSize: 11, background: bg, color, cursor: "pointer", fontWeight: 600 }}>
                        <option value="free">Free</option>
                        <option value="pro">Pro</option>
                        <option value="team">Team</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {stats.mrr > 0 && (
              <tfoot>
                <tr style={{ background: "#1a365d", color: "white" }}>
                  <td colSpan={3} style={{ padding: "9px 12px", fontWeight: 700 }}>TOTALE</td>
                  <td style={{ padding: "9px 12px", fontWeight: 900 }}>{fmtK(stats.mrr)}/mes</td>
                  <td colSpan={3} style={{ padding: "9px 12px", color: "#a0aec0", fontSize: 11 }}>ARR: {fmtK(stats.arr)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
