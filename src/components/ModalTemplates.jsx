// ─── components/ModalTemplates.jsx ───────────────────────────────────────────
// Modal completo para:
//   1. Ver y aplicar templates existentes
//   2. Guardar el proyecto actual como template
//   3. Crear un template desde cero
// Se importa en TabProyecto y se abre con un botón.

import { useState, useMemo } from "react";
import { useTemplates, CATEGORIAS } from "../hooks/useTemplates";

const fmt = (n) => new Intl.NumberFormat("es-CL", {
  style: "currency", currency: "CLP", maximumFractionDigits: 0,
}).format(n || 0);

// ── Colores categoria ─────────────────────────────────────────────────────────
const CAT_COLORS = {
  "Baño":          "#2b6cb0",
  "Cocina":        "#276749",
  "Habitación":    "#553c9a",
  "Fachada":       "#c05621",
  "Techado":       "#b7791f",
  "Instalaciones": "#2c7a7b",
  "Pintura":       "#d53f8c",
  "Demolición":    "#718096",
  "General":       "#1a365d",
};

function catColor(cat) { return CAT_COLORS[cat] || "#1a365d"; }

// ── Chip categoria ────────────────────────────────────────────────────────────
function CatChip({ cat, selected, onClick }) {
  const c = catColor(cat);
  return (
    <button onClick={() => onClick(cat)}
      style={{
        padding: "5px 12px", borderRadius: 99, border: `2px solid ${selected ? c : "#e2e8f0"}`,
        background: selected ? c : "white", color: selected ? "white" : "#718096",
        fontWeight: 600, fontSize: 11, cursor: "pointer", transition: "all .15s",
      }}>
      {cat}
    </button>
  );
}

// ── Form crea/salva template ──────────────────────────────────────────────────
function FormTemplate({ initial = {}, partidas = [], pct = {}, condPago, condPagoPersonalizado, cuotas, iva, onSave, onCancel }) {
  const [nome,      setNome]      = useState(initial.nome || "");
  const [categoria, setCategoria] = useState(initial.categoria || "General");
  const [nota,      setNota]      = useState(initial.nota || "");
  const [usaPct,    setUsaPct]    = useState(true);
  const [usaCond,   setUsaCond]   = useState(true);
  const [usaPartidas, setUsaPartidas] = useState(true);

  const totalCD = partidas.reduce((s, p) => s + (p.cant || 0) * (p.pu || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Nome */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: "#4a5568", display: "block", marginBottom: 5 }}>
          Nombre del template *
        </label>
        <input value={nome} onChange={e => setNome(e.target.value)}
          placeholder="Ej: Baño completo estándar"
          autoFocus
          style={{ width: "100%", padding: "10px 12px", border: "2px solid #e2e8f0", borderRadius: 9,
            fontSize: 14, color: "#1a365d", boxSizing: "border-box", fontWeight: 600 }} />
      </div>

      {/* Categoria */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: "#4a5568", display: "block", marginBottom: 7 }}>Categoría</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {CATEGORIAS.map(c => (
            <CatChip key={c} cat={c} selected={categoria === c} onClick={setCategoria} />
          ))}
        </div>
      </div>

      {/* Contenido a incluir */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: "#4a5568", display: "block", marginBottom: 7 }}>
          ¿Qué incluir en el template?
        </label>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {[
            { k: "partidas", v: usaPartidas, set: setUsaPartidas,
              label: `📦 Partidas (${partidas.length} ítems · ${fmt(totalCD)})`,
              desc: "Todos los ítems de costo del proyecto actual" },
            { k: "pct", v: usaPct, set: setUsaPct,
              label: `⚙️ Porcentajes (CI ${pct.ci||0}% / GF ${pct.gf||0}% / Util ${pct.utilidad||0}%)`,
              desc: "CI, Gastos fijos, Imprevistos, Utilidad" },
            { k: "cond", v: usaCond, set: setUsaCond,
              label: `💳 Condición de pago (${condPago || "—"})`,
              desc: "Tipo de pago y cuotas si aplica" },
          ].map(item => (
            <label key={item.k} style={{ display: "flex", gap: 10, padding: "10px 12px",
              background: item.v ? "#f0fff4" : "#f7fafc", borderRadius: 9, cursor: "pointer",
              border: `1px solid ${item.v ? "#9ae6b4" : "#e2e8f0"}`, transition: "all .15s" }}>
              <input type="checkbox" checked={item.v} onChange={e => item.set(e.target.checked)}
                style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1a365d" }}>{item.label}</div>
                <div style={{ fontSize: 10, color: "#718096" }}>{item.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Nota */}
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: "#4a5568", display: "block", marginBottom: 5 }}>
          Nota interna (opcional)
        </label>
        <textarea value={nota} onChange={e => setNota(e.target.value)}
          placeholder="Ej: Para baños de 4-6m², incluye sanitarios básicos..."
          rows={2}
          style={{ width: "100%", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8,
            fontSize: 12, color: "#1a365d", resize: "vertical", boxSizing: "border-box" }} />
      </div>

      {/* Acciones */}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onCancel}
          style={{ flex: 1, padding: 10, background: "#f7fafc", border: "1px solid #e2e8f0",
            borderRadius: 9, cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#718096" }}>
          Cancelar
        </button>
        <button
          onClick={() => {
            if (!nome.trim()) return;
            onSave({
              nombre:   nome.trim(),
              categoria,
              nota,
              partidas: usaPartidas ? partidas : [],
              pct:      usaPct ? pct : { ci: 0, gf: 0, imprevistos: 0, utilidad: 0 },
              condPago: usaCond ? condPago : "contado",
              condPagoPersonalizado: usaCond ? condPagoPersonalizado : "",
              cuotas:   usaCond ? cuotas : [],
              iva,
            });
          }}
          disabled={!nome.trim()}
          style={{ flex: 2, padding: 10, background: !nome.trim() ? "#f0f4f8" : "#276749",
            color: !nome.trim() ? "#a0aec0" : "white", border: "none",
            borderRadius: 9, cursor: nome.trim() ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 13 }}>
          💾 Guardar template
        </button>
      </div>
    </div>
  );
}

// ── Card template (lista) ─────────────────────────────────────────────────────
function TemplateCard({ tpl, onApply, onDelete }) {
  const [confirm, setConfirm] = useState(false);
  const c = catColor(tpl.categoria);
  const totalCD = tpl.partidas?.reduce((s, p) => s + (p.cant || 0) * (p.pu || 0), 0) || 0;

  return (
    <div style={{ background: "white", borderRadius: 11, border: `1px solid #e2e8f0`,
      borderLeft: `4px solid ${c}`, padding: "12px 14px", transition: "all .15s" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 3px 12px rgba(0,0,0,.1)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: "#1a365d", marginBottom: 3 }}>{tpl.nombre}</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
              background: c + "18", color: c }}>{tpl.categoria}</span>
            {tpl.usadoVeces > 0 && (
              <span style={{ fontSize: 10, color: "#a0aec0" }}>usado {tpl.usadoVeces}x</span>
            )}
            <span style={{ fontSize: 10, color: "#a0aec0" }}>{tpl.creadoAt}</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        {tpl.partidas?.length > 0 && (
          <div style={{ fontSize: 10, color: "#4a5568", background: "#f7fafc", padding: "3px 8px", borderRadius: 6 }}>
            📦 {tpl.partidas.length} partidas · {fmt(totalCD)}
          </div>
        )}
        {tpl.pct?.utilidad > 0 && (
          <div style={{ fontSize: 10, color: "#553c9a", background: "#faf5ff", padding: "3px 8px", borderRadius: 6 }}>
            ⚙️ Util {tpl.pct.utilidad}%
          </div>
        )}
        {tpl.condPago && (
          <div style={{ fontSize: 10, color: "#276749", background: "#f0fff4", padding: "3px 8px", borderRadius: 6 }}>
            💳 {tpl.condPago}
          </div>
        )}
        {tpl.iva && (
          <div style={{ fontSize: 10, color: "#c05621", background: "#fffaf0", padding: "3px 8px", borderRadius: 6 }}>
            IVA 19%
          </div>
        )}
      </div>

      {tpl.nota && (
        <div style={{ fontSize: 11, color: "#718096", fontStyle: "italic", marginBottom: 8,
          padding: "5px 8px", background: "#fefcbf", borderRadius: 6 }}>
          "{tpl.nota}"
        </div>
      )}

      {/* Acciones */}
      {confirm ? (
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#c53030", flex: 1 }}>¿Eliminar template?</span>
          <button onClick={() => onDelete(tpl.id)}
            style={{ padding: "5px 10px", background: "#c53030", color: "white", border: "none",
              borderRadius: 7, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Sí</button>
          <button onClick={() => setConfirm(false)}
            style={{ padding: "5px 10px", background: "#f7fafc", border: "1px solid #e2e8f0",
              borderRadius: 7, cursor: "pointer", fontSize: 11, color: "#718096" }}>No</button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => onApply(tpl)}
            style={{ flex: 1, padding: "7px 10px", background: "#1a365d", color: "white",
              border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
            ✅ Aplicar al proyecto
          </button>
          <button onClick={() => setConfirm(true)}
            style={{ padding: "7px 10px", background: "#fff5f5", border: "1px solid #fed7d7",
              borderRadius: 8, cursor: "pointer", color: "#c53030", fontSize: 11 }}>
            🗑️
          </button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MODAL PRINCIPALE
// ══════════════════════════════════════════════════════════════════════════════
export default function ModalTemplates({
  // Dati progetto corrente (per salvare come template)
  partidas = [], pct = {}, condPago, condPagoPersonalizado, cuotas = [], iva,
  // Callback per applicare template al progetto
  onApplyTemplate,
  // Chiudi modal
  onClose,
}) {
  const { getAll, saveTemplate, deleteTemplate, markUsed } = useTemplates();
  const [view,       setView]       = useState("lista"); // lista | salva | nuovo
  const [search,     setSearch]     = useState("");
  const [filterCat,  setFilterCat]  = useState("Todos");
  const [applied,    setApplied]    = useState(null);

  const templates = getAll();

  const filtered = useMemo(() => {
    return templates.filter(t => {
      const matchSearch = !search || t.nombre.toLowerCase().includes(search.toLowerCase()) || (t.nota || "").toLowerCase().includes(search.toLowerCase());
      const matchCat    = filterCat === "Todos" || t.categoria === filterCat;
      return matchSearch && matchCat;
    });
  }, [templates, search, filterCat]);

  // Categorie presenti
  const catsPresenti = ["Todos", ...new Set(templates.map(t => t.categoria))];

  const handleApply = (tpl) => {
    markUsed(tpl.id);
    onApplyTemplate(tpl);
    setApplied(tpl.nombre);
    setTimeout(() => { setApplied(null); onClose(); }, 1500);
  };

  const handleSave = (data) => {
    saveTemplate(data);
    setView("lista");
  };

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 3000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>

      <div style={{ background: "#f0f4f8", borderRadius: 16, width: "100%", maxWidth: 560,
        maxHeight: "90vh", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 64px rgba(0,0,0,.35)" }}>

        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#1a365d,#2b6cb0)", borderRadius: "16px 16px 0 0",
          padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "white", fontWeight: 800, fontSize: 16 }}>📋 Templates de Proyecto</div>
            <div style={{ color: "rgba(255,255,255,.7)", fontSize: 11, marginTop: 2 }}>
              {templates.length} template{templates.length !== 1 ? "s" : ""} guardados
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: 8,
              padding: "6px 12px", cursor: "pointer", color: "white", fontWeight: 700, fontSize: 14 }}>✕</button>
        </div>

        {/* Tab selector */}
        <div style={{ display: "flex", gap: 4, padding: "12px 16px 0", background: "white" }}>
          {[
            ["lista",  "📂 Mis templates"],
            ["salva",  "💾 Guardar actual"],
            ["nuevo",  "✨ Crear desde cero"],
          ].map(([k, l]) => (
            <button key={k} onClick={() => setView(k)}
              style={{ padding: "8px 14px", borderRadius: "9px 9px 0 0", border: "none", cursor: "pointer",
                fontWeight: 700, fontSize: 12, transition: "all .15s",
                background: view === k ? "#f0f4f8" : "white",
                color: view === k ? "#1a365d" : "#718096",
                borderBottom: view === k ? "3px solid #2b6cb0" : "3px solid transparent" }}>
              {l}
            </button>
          ))}
        </div>

        {/* Contenuto scrollabile */}
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>

          {/* ── LISTA ── */}
          {view === "lista" && (
            <>
              {/* Feedback applicato */}
              {applied && (
                <div style={{ padding: "10px 14px", background: "#f0fff4", border: "1px solid #9ae6b4",
                  borderRadius: 9, marginBottom: 12, fontWeight: 700, fontSize: 13, color: "#276749" }}>
                  ✅ Template "{applied}" aplicado al proyecto
                </div>
              )}

              {templates.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#a0aec0" }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>📋</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#2d3748", marginBottom: 6 }}>Sin templates todavía</div>
                  <div style={{ fontSize: 12, marginBottom: 16 }}>
                    Guarda el proyecto actual como template o crea uno desde cero.
                  </div>
                  <button onClick={() => setView(partidas.length > 0 ? "salva" : "nuevo")}
                    style={{ padding: "9px 18px", background: "#1a365d", color: "white", border: "none",
                      borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                    {partidas.length > 0 ? "💾 Guardar proyecto actual" : "✨ Crear template"}
                  </button>
                </div>
              ) : (
                <>
                  {/* Cerca + filtro */}
                  <div style={{ marginBottom: 12 }}>
                    <input value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="🔍 Buscar template..."
                      style={{ width: "100%", padding: "8px 12px", border: "1px solid #e2e8f0",
                        borderRadius: 8, fontSize: 13, boxSizing: "border-box", marginBottom: 8, color: "#1a365d" }} />
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {catsPresenti.map(c => (
                        <button key={c} onClick={() => setFilterCat(c)}
                          style={{ padding: "4px 10px", borderRadius: 99, border: "none", cursor: "pointer",
                            fontSize: 11, fontWeight: 600, transition: "all .15s",
                            background: filterCat === c ? "#1a365d" : "#e2e8f0",
                            color: filterCat === c ? "white" : "#718096" }}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filtered.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 24, color: "#a0aec0", fontSize: 13 }}>
                      Sin resultados para "{search}"
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {filtered.map(tpl => (
                        <TemplateCard key={tpl.id} tpl={tpl}
                          onApply={handleApply} onDelete={deleteTemplate} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ── SALVA PROGETTO ATTUALE ── */}
          {view === "salva" && (
            <>
              {partidas.length === 0 ? (
                <div style={{ padding: "20px 14px", background: "#fffaf0", borderRadius: 10,
                  border: "1px solid #f6e05e", marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#744210", marginBottom: 4 }}>
                    ⚠️ El proyecto no tiene partidas
                  </div>
                  <div style={{ fontSize: 12, color: "#718096" }}>
                    Puedes guardar los porcentajes y condiciones de pago igualmente.
                  </div>
                </div>
              ) : (
                <div style={{ padding: "10px 14px", background: "#ebf8ff", borderRadius: 9,
                  border: "1px solid #bee3f8", marginBottom: 14, fontSize: 12, color: "#2b6cb0" }}>
                  💡 Se guardará el proyecto actual con {partidas.length} partidas
                </div>
              )}
              <FormTemplate
                partidas={partidas} pct={pct}
                condPago={condPago} condPagoPersonalizado={condPagoPersonalizado}
                cuotas={cuotas} iva={iva}
                onSave={handleSave}
                onCancel={() => setView("lista")}
              />
            </>
          )}

          {/* ── NUOVO DA ZERO ── */}
          {view === "nuevo" && (
            <>
              <div style={{ padding: "10px 14px", background: "#faf5ff", borderRadius: 9,
                border: "1px solid #d6bcfa", marginBottom: 14, fontSize: 12, color: "#553c9a" }}>
                ✨ Crea un template vacío — puedes agregar partidas desde la pestaña Costos después de aplicarlo
              </div>
              <FormTemplate
                partidas={[]} pct={{ ci: 0, gf: 0, imprevistos: 0, utilidad: 20 }}
                condPago="contado" condPagoPersonalizado="" cuotas={[]} iva={false}
                onSave={handleSave}
                onCancel={() => setView("lista")}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
