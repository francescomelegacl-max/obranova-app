// ─── src/components/TabLog.jsx ────────────────────────────────────────────────
// Sprint 4 — #9 Log attività workspace
// Visualizza gli ultimi N eventi del workspace con filtro per azione/utente
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useMemo } from "react";
import { useLog } from "../hooks/useLog";

// ── Icone per categoria ───────────────────────────────────────────────────────
const ICONE = {
  progetto_creato:       "📄",
  progetto_modificato:   "✏️",
  progetto_eliminato:    "🗑️",
  progetto_duplicato:    "📋",
  stato_cambiato:        "🔄",
  cuota_creata:          "💰",
  cuota_pagata:          "✅",
  link_pago_generado:    "🔗",
  firma_inviata:         "📨",
  firma_completada:      "✍️",
  voce_aggiunta:         "➕",
  voce_modificata:       "✏️",
  voce_eliminata:        "🗑️",
  articolo_aggiunto:     "📦",
  movimento_registrato:  "📦",
  fattura_creata:        "🧾",
  fattura_eliminata:     "🗑️",
  membro_invitato:       "👤",
  membro_rimosso:        "👤",
  piano_attivato:        "⚡",
  trial_avviato:         "🚀",
  backup_manuale:        "💾",
  impostazioni_modificate: "⚙️",
};

// ── Formatta timestamp Firestore ──────────────────────────────────────────────
function formatTs(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString("es-CL", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Label leggibile per l'azione ──────────────────────────────────────────────
function formatAzione(azione, dettagli) {
  const label = dettagli?.label || dettagli?.nombre || dettagli?.nombre || "";
  const map = {
    progetto_creato:       `Progetto creato${label ? ` — ${label}` : ""}`,
    progetto_modificato:   `Progetto modificato${label ? ` — ${label}` : ""}`,
    progetto_eliminato:    `Progetto eliminato${label ? ` — ${label}` : ""}`,
    progetto_duplicato:    `Progetto duplicato${label ? ` da ${label}` : ""}`,
    stato_cambiato:        `Stato cambiato${dettagli?.da ? ` da ${dettagli.da} a ${dettagli.a}` : ""}`,
    cuota_creata:          `Cuota creata${label ? ` — ${label}` : ""}`,
    cuota_pagata:          `Cuota pagata${label ? ` — ${label}` : ""}`,
    link_pago_generado:    `Link pagamento generato`,
    firma_inviata:         `Firma inviata al cliente`,
    firma_completada:      `Firma completata`,
    voce_aggiunta:         `Voce listino aggiunta${label ? ` — ${label}` : ""}`,
    voce_modificata:       `Voce listino modificata${label ? ` — ${label}` : ""}`,
    voce_eliminata:        `Voce listino eliminata`,
    articolo_aggiunto:     `Articolo magazzino aggiunto${label ? ` — ${label}` : ""}`,
    movimento_registrato:  `Movimento magazzino registrato`,
    fattura_creata:        `Fattura creata${label ? ` — ${label}` : ""}`,
    fattura_eliminata:     `Fattura eliminata`,
    membro_invitato:       `Membro invitato${label ? ` — ${label}` : ""}`,
    membro_rimosso:        `Membro rimosso${label ? ` — ${label}` : ""}`,
    piano_attivato:        `Piano attivato${dettagli?.piano ? ` — ${dettagli.piano}` : ""}`,
    trial_avviato:         `Trial avviato`,
    backup_manuale:        `Backup manuale eseguito`,
    impostazioni_modificate: `Impostazioni modificate`,
  };
  return map[azione] || azione;
}

// ── Categorie per filtro ──────────────────────────────────────────────────────
const CATEGORIE = [
  { value: "",          label: "Tutte le azioni" },
  { value: "progetto",  label: "🗂 Progetti" },
  { value: "cuota",     label: "💰 Cuote/Pagamenti" },
  { value: "firma",     label: "✍️ Firme" },
  { value: "voce",      label: "📋 Listino" },
  { value: "articolo",  label: "📦 Magazzino" },
  { value: "fattura",   label: "🧾 Fatture" },
  { value: "membro",    label: "👤 Team" },
  { value: "piano",     label: "⚡ Piano" },
  { value: "backup",    label: "💾 Sistema" },
];

// ── Componente principale ─────────────────────────────────────────────────────
export default function TabLog({ workspaceId }) {
  const { logs, loading, error } = useLog(workspaceId, { limit: 200 });
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroUtente,    setFiltroUtente]    = useState("");
  const [cerca,           setCerca]           = useState("");

  // Utenti unici per filtro
  const utenti = useMemo(() => {
    const map = new Map();
    logs.forEach(l => {
      if (l.uid && !map.has(l.uid)) {
        map.set(l.uid, l.displayName || l.email || l.uid);
      }
    });
    return Array.from(map.entries());
  }, [logs]);

  // Logs filtrati
  const logsFiltrati = useMemo(() => {
    return logs.filter(l => {
      if (filtroCategoria && !l.azione?.includes(filtroCategoria)) return false;
      if (filtroUtente    && l.uid !== filtroUtente) return false;
      if (cerca) {
        const s = cerca.toLowerCase();
        const haystack = [
          l.azione, l.displayName, l.email,
          formatAzione(l.azione, l.dettagli),
        ].join(" ").toLowerCase();
        if (!haystack.includes(s)) return false;
      }
      return true;
    });
  }, [logs, filtroCategoria, filtroUtente, cerca]);

  if (loading) return (
    <div className="flex items-center justify-center h-40 text-gray-400">
      <span className="text-2xl mr-2">📋</span> Caricamento log…
    </div>
  );

  if (error) return (
    <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">
      Errore caricamento log: {error}
    </div>
  );

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">📋 Log attività</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {logsFiltrati.length} eventi{filtroCategoria || filtroUtente || cerca ? " (filtrati)" : ""}
          </p>
        </div>
      </div>

      {/* Filtri */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="🔍 Cerca…"
          value={cerca}
          onChange={e => setCerca(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 w-44"
        />
        <select
          value={filtroCategoria}
          onChange={e => setFiltroCategoria(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          {CATEGORIE.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          value={filtroUtente}
          onChange={e => setFiltroUtente(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          <option value="">Tutti gli utenti</option>
          {utenti.map(([uid, nome]) => (
            <option key={uid} value={uid}>{nome}</option>
          ))}
        </select>
        {(filtroCategoria || filtroUtente || cerca) && (
          <button
            onClick={() => { setFiltroCategoria(""); setFiltroUtente(""); setCerca(""); }}
            className="text-xs text-gray-400 hover:text-gray-600 underline px-2"
          >
            Reset filtri
          </button>
        )}
      </div>

      {/* Lista log */}
      {logsFiltrati.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-2">📭</div>
          <p className="text-sm">Nessun evento trovato</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white overflow-hidden">
          {logsFiltrati.map((log) => (
            <div key={log.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
              {/* Icona */}
              <div className="text-xl mt-0.5 w-6 text-center flex-shrink-0">
                {ICONE[log.azione] || "📝"}
              </div>

              {/* Contenuto */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 font-medium truncate">
                  {formatAzione(log.azione, log.dettagli)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {log.displayName || log.email || "Utente sconosciuto"}
                  {" · "}
                  {formatTs(log.ts)}
                </p>
              </div>

              {/* Badge entità */}
              {log.entita && (
                <span className="flex-shrink-0 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  {log.entita}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
