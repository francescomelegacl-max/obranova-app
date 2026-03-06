// ─── components/ui/CategoryFilters.jsx ───────────────────────────────────────
// Componenti condivisi per filtri e separatori categoria.
// Usato da: TabMagazzino, TabCostos, TabCalcolatoreMateriali, TabKitMateriali

// ── Mappa colori per categoria ────────────────────────────────────────────────
export const CAT_COLORS = {
  "Obra Gruesa":     { pill: "#1a365d", bg: "#ebf8ff", border: "#bee3f8", text: "#1a365d", light: "#f0f7ff" },
  "Instalaciones":   { pill: "#276749", bg: "#f0fff4", border: "#9ae6b4", text: "#276749", light: "#f5fff8" },
  "Terminaciones":   { pill: "#744210", bg: "#fffaf0", border: "#fbd38d", text: "#744210", light: "#fffdf5" },
  "Equipamiento":    { pill: "#553c9a", bg: "#faf5ff", border: "#d6bcfa", text: "#553c9a", light: "#fdf9ff" },
  "Mano de Obra":    { pill: "#c53030", bg: "#fff5f5", border: "#fed7d7", text: "#c53030", light: "#fffafa" },
  "Gastos Generales":{ pill: "#2d3748", bg: "#f7fafc", border: "#e2e8f0", text: "#2d3748", light: "#fafbfc" },
};

export const catColor = (cat) =>
  CAT_COLORS[cat] || { pill: "#4a5568", bg: "#f7fafc", border: "#e2e8f0", text: "#4a5568", light: "#fafafa" };

// ── Filtri pillola colorati ───────────────────────────────────────────────────
// Props:
//   cats      — array di stringhe categoria
//   activeCat — categoria attiva (null = tutti)
//   onChange  — callback(cat | null)
//   counts    — { _total: N, "Categoria": N, ... }
export function CategoryChips({ cats, activeCat, onChange, counts = {} }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      <button
        onClick={() => onChange(null)}
        style={{
          padding: "6px 14px", borderRadius: 99, border: "none", cursor: "pointer",
          fontSize: 12, fontWeight: 700, transition: "all .15s",
          background: activeCat === null ? "#1a365d" : "#f0f4f8",
          color: activeCat === null ? "white" : "#718096",
          boxShadow: activeCat === null ? "0 2px 6px rgba(26,54,93,.25)" : "none",
        }}>
        Todos{counts._total ? ` (${counts._total})` : ""}
      </button>
      {cats.map(c => {
        const col = catColor(c);
        const active = activeCat === c;
        return (
          <button key={c} onClick={() => onChange(c === activeCat ? null : c)}
            style={{
              padding: "6px 14px", borderRadius: 99, cursor: "pointer",
              fontSize: 12, fontWeight: active ? 700 : 600, transition: "all .15s",
              border: `2px solid ${active ? col.pill : col.border}`,
              background: active ? col.pill : col.bg,
              color: active ? "white" : col.text,
              boxShadow: active ? `0 2px 8px ${col.pill}44` : "none",
            }}>
            {c}{counts[c] ? ` (${counts[c]})` : ""}
          </button>
        );
      })}
    </div>
  );
}

// ── Separatore di sezione per tabelle desktop ─────────────────────────────────
export function CategoryDivider({ cat }) {
  const col = catColor(cat);
  return (
    <tr>
      <td colSpan={99} style={{ padding: 0 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 12px 6px",
          background: col.light,
          borderLeft: `4px solid ${col.pill}`,
          borderBottom: `1px solid ${col.border}`,
        }}>
          <span style={{
            padding: "2px 12px", borderRadius: 99, fontSize: 11, fontWeight: 800,
            background: col.pill, color: "white", letterSpacing: "0.04em",
          }}>{cat}</span>
        </div>
      </td>
    </tr>
  );
}

// ── Separatore di sezione per liste mobile ────────────────────────────────────
export function CategoryDividerMobile({ cat }) {
  const col = catColor(cat);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "10px 10px 6px",
      borderLeft: `4px solid ${col.pill}`,
      marginTop: 8,
    }}>
      <span style={{
        padding: "2px 12px", borderRadius: 99, fontSize: 11, fontWeight: 800,
        background: col.pill, color: "white", letterSpacing: "0.04em",
      }}>{cat}</span>
    </div>
  );
}
