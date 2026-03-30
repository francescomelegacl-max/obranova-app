// ─── components/ModalSolicitudNew.jsx ────────────────────────────────────────
// Form capocantiere — crea una solicitud de material dal progetto
// Accessibile da TabProyecto o dalla sidebar mobile
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useCallback } from "react";

const UNIDADES = ["un", "m²", "ml", "kg", "lts", "gl", "m³", "pza", "ton", "hr"];

function ItemRow({ item, idx, onChange, onRemove }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 80px 70px 32px",
      gap: 6, alignItems: "center", marginBottom: 6,
    }}>
      <input
        value={item.nombre}
        onChange={e => onChange(idx, "nombre", e.target.value)}
        placeholder="Material o herramienta"
        style={{ padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13 }}
      />
      <input
        type="number"
        value={item.cantidad}
        onChange={e => onChange(idx, "cantidad", e.target.value)}
        placeholder="Cant."
        min={0}
        style={{ padding: "8px 8px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, textAlign: "center" }}
      />
      <select
        value={item.unidad}
        onChange={e => onChange(idx, "unidad", e.target.value)}
        style={{ padding: "8px 6px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#1a365d" }}
      >
        {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
      </select>
      <button onClick={() => onRemove(idx)} style={{
        width: 32, height: 32, borderRadius: 8, border: "1px solid #fed7d7",
        background: "#fff5f5", color: "#c53030", cursor: "pointer", fontSize: 14,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>✕</button>
    </div>
  );
}

export default function ModalSolicitudNew({
  proyectoId,
  proyectoNombre,
  workspaceId,
  user,
  onSave,   // crearSolicitud callback
  onClose,
  bodegaItems = [], // items bodega per autocomplete
}) {
  const [items, setItems] = useState([
    { nombre: "", cantidad: "1", unidad: "un", itemId: null },
  ]);
  const [nota,    setNota]    = useState("");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  const addItem = () => setItems(p => [
    ...p, { nombre: "", cantidad: "1", unidad: "un", itemId: null }
  ]);

  const updateItem = useCallback((idx, field, value) => {
    setItems(p => p.map((x, i) => i === idx ? { ...x, [field]: value } : x));
  }, []);

  const removeItem = useCallback((idx) => {
    setItems(p => p.filter((_, i) => i !== idx));
  }, []);

  // Autocomplete da bodega
  const handleNombreChange = (idx, value) => {
    updateItem(idx, "nombre", value);
    // Cerca match in bodega
    const match = bodegaItems.find(b =>
      b.nome?.toLowerCase().startsWith(value.toLowerCase()) && value.length > 2
    );
    if (match) {
      updateItem(idx, "itemId", match.id);
      updateItem(idx, "unidad", match.unita || "un");
    } else {
      updateItem(idx, "itemId", null);
    }
  };

  const handleSave = async () => {
    const validItems = items.filter(x => x.nombre.trim() && parseFloat(x.cantidad) > 0);
    if (validItems.length === 0) { setError("Agrega al menos un material con cantidad"); return; }
    setSaving(true);
    setError("");
    try {
      await onSave({
        proyectoId,
        proyectoNombre,
        items: validItems.map(x => ({
          nombre:   x.nombre.trim(),
          cantidad: parseFloat(x.cantidad) || 1,
          unidad:   x.unidad,
          itemId:   x.itemId || null,
        })),
        nota: nota.trim(),
        creadoPor: user?.displayName || user?.email || "Usuario",
      });
      onClose();
    } catch(e) {
      setError("Error al enviar: " + e.message);
      setSaving(false);
    }
  };

  const canSave = items.some(x => x.nombre.trim() && parseFloat(x.cantidad) > 0);

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.6)",
      zIndex: 2000, display: "flex", alignItems: "center",
      justifyContent: "center", padding: 16,
    }}>
      <div style={{
        width: "100%", maxWidth: 520, background: "white",
        borderRadius: 18, overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,.25)",
      }}>
        {/* Header */}
        <div style={{
          background: "linear-gradient(135deg,#744210,#c05621)",
          padding: "18px 22px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "white" }}>
                📦 Solicitud de materiales
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.75)", marginTop: 3 }}>
                {proyectoNombre || "Proyecto"}
              </div>
            </div>
            <button onClick={onClose} style={{
              background: "rgba(255,255,255,.15)", border: "none",
              borderRadius: 8, color: "white", cursor: "pointer",
              padding: "5px 10px", fontSize: 14, fontWeight: 700,
            }}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 22px", maxHeight: "60vh", overflowY: "auto" }}>

          {/* Header colonne */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 80px 70px 32px",
            gap: 6, marginBottom: 6,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#718096" }}>Material</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#718096", textAlign: "center" }}>Cant.</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#718096" }}>Unidad</div>
            <div />
          </div>

          {/* Rows */}
          {items.map((item, idx) => (
            <div key={idx} style={{ position: "relative" }}>
              <ItemRow item={item} idx={idx}
                onChange={(i, f, v) => f === "nombre" ? handleNombreChange(i, v) : updateItem(i, f, v)}
                onRemove={removeItem} />
              {/* Badge bodega match */}
              {item.itemId && (
                <div style={{
                  position: "absolute", top: 2, right: 40,
                  fontSize: 10, color: "#276749", background: "#EAF3DE",
                  padding: "1px 6px", borderRadius: 99, fontWeight: 700,
                }}>✓ en bodega</div>
              )}
            </div>
          ))}

          {/* Aggiungi riga */}
          <button onClick={addItem} style={{
            width: "100%", padding: "8px", marginBottom: 16,
            background: "#f8fafc", border: "1px dashed #cbd5e0",
            borderRadius: 8, cursor: "pointer", color: "#718096",
            fontSize: 12, fontWeight: 600,
          }}>
            + Agregar material
          </button>

          {/* Nota */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#4a5568", marginBottom: 6 }}>
              Nota / urgencia (opcional)
            </div>
            <textarea
              value={nota}
              onChange={e => setNota(e.target.value)}
              placeholder="Ej: Urgente para el lunes, necesitamos por las mañana..."
              rows={2}
              style={{
                width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0",
                borderRadius: 8, fontSize: 13, resize: "vertical",
                boxSizing: "border-box", color: "#2d3748",
              }}
            />
          </div>

          {error && (
            <div style={{ fontSize: 12, color: "#c53030", background: "#fff5f5",
              border: "1px solid #fed7d7", borderRadius: 8, padding: "8px 12px", marginBottom: 10 }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 22px", borderTop: "1px solid #e2e8f0",
          display: "flex", gap: 8,
        }}>
          <button onClick={onClose} style={{
            padding: "11px 20px", borderRadius: 10, border: "1px solid #e2e8f0",
            background: "white", color: "#718096", cursor: "pointer",
            fontWeight: 600, fontSize: 13,
          }}>Cancelar</button>
          <button onClick={handleSave} disabled={!canSave || saving} style={{
            flex: 1, padding: "11px",
            background: canSave && !saving
              ? "linear-gradient(135deg,#744210,#c05621)"
              : "#e2e8f0",
            color: canSave && !saving ? "white" : "#a0aec0",
            border: "none", borderRadius: 10, cursor: canSave && !saving ? "pointer" : "not-allowed",
            fontWeight: 800, fontSize: 14,
          }}>
            {saving ? "⏳ Enviando..." : "📤 Enviar solicitud"}
          </button>
        </div>
      </div>
    </div>
  );
}
