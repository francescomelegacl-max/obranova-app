// ─── components/tabs/TabKitMateriali.jsx ─────────────────────────────────────
// Tab per gestire kit/combo di materiali da costruzione
// Permette: visualizzare kit predefiniti, creare kit personalizzati,
// applicare un kit al calcolatore, aggiungere direttamente a Costos

import { useState, useEffect, useCallback } from "react";
import { KIT_PREDEFINITI } from "../../hooks/useKits";

// ── Icone inline (evita dipendenze) ──────────────────────────────────────────
const IconPlus      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconTrash     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>;
const IconEdit      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconCopy      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const IconCheck     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>;
const IconClose     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconAdd       = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconSave      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;

const CATEGORIAS = ["Todos", "Pisos", "Muros", "Terminaciones", "Carpintería", "Estructura", "Instalaciones", "Personalizado"];

const COLORES_CAT = {
  "Pisos":        { bg: "#fff3e0", border: "#ff9800", text: "#e65100" },
  "Muros":        { bg: "#fce4ec", border: "#e91e63", text: "#880e4f" },
  "Terminaciones":{ bg: "#e8f5e9", border: "#4caf50", text: "#1b5e20" },
  "Carpintería":  { bg: "#fff8e1", border: "#ffc107", text: "#ff6f00" },
  "Estructura":   { bg: "#e3f2fd", border: "#2196f3", text: "#0d47a1" },
  "Instalaciones":{ bg: "#f3e5f5", border: "#9c27b0", text: "#4a148c" },
  "Personalizado":{ bg: "#eceff1", border: "#607d8b", text: "#263238" },
};

// ── Componente principal ──────────────────────────────────────────────────────
export default function TabKitMateriali({
  kits = [],
  cargando = false,
  onSaveKit,
  onDeleteKit,
  onImportarPredefinito,
  addPartida,
  cats = [],
  onToast,
}) {
  const [vista, setVista] = useState("galeria"); // "galeria" | "editor" | "detalle"
  const [filtrocat, setFiltroCat] = useState("Todos");
  const [kitSeleccionado, setKitSeleccionado] = useState(null);
  const [editando, setEditando] = useState(null); // kit en edición
  const [busqueda, setBusqueda] = useState("");
  const [pestana, setPestana] = useState("predefinidos"); // "predefinidos" | "mios"
  const [confirmBorrar, setConfirmBorrar] = useState(null);
  const [m2, setM2] = useState(1); // moltiplicatore superficie per vista detalle

  // ── Estado del editor ─────────────────────────────────────────────────────
  const kitVacio = {
    nombre: "",
    emoji: "📦",
    categoria: "Personalizado",
    descripcion: "",
    materiales: [{ nombre: "", unidad: "m²", cantidad: 1, nota: "" }],
  };
  const [formKit, setFormKit] = useState(kitVacio);

  const abrirEditor = (kit = null) => {
    if (kit) {
      setFormKit({ ...kit, materiales: kit.materiales?.map(m => ({ ...m })) || [] });
      setEditando(kit.id || null);
    } else {
      setFormKit(kitVacio);
      setEditando(null);
    }
    setVista("editor");
  };

  const cerrarEditor = () => {
    setVista(kitSeleccionado ? "detalle" : "galeria");
    setFormKit(kitVacio);
    setEditando(null);
  };

  // ── Materiales del formulario ─────────────────────────────────────────────
  const addMaterial = () =>
    setFormKit(f => ({ ...f, materiales: [...f.materiales, { nombre: "", unidad: "m²", cantidad: 1, nota: "" }] }));

  const removeMaterial = (i) =>
    setFormKit(f => ({ ...f, materiales: f.materiales.filter((_, idx) => idx !== i) }));

  const updateMaterial = (i, campo, val) =>
    setFormKit(f => ({
      ...f,
      materiales: f.materiales.map((m, idx) => idx === i ? { ...m, [campo]: val } : m)
    }));

  // ── Guardar kit ───────────────────────────────────────────────────────────
  const handleGuardar = async () => {
    if (!formKit.nombre.trim()) { onToast?.("⚠️ Ingresa un nombre para el kit"); return; }
    if (formKit.materiales.some(m => !m.nombre.trim())) { onToast?.("⚠️ Todos los materiales deben tener nombre"); return; }
    const kitGuardado = await onSaveKit?.({
      ...formKit,
      ...(editando ? { id: editando } : {}),
    });
    cerrarEditor();
    if (kitGuardado) setKitSeleccionado(kitGuardado);
    setPestana("mios");
  };

  // ── Agregar todo el kit a Costos ──────────────────────────────────────────
  const agregarKitACostos = useCallback((kit, m2 = 1) => {
    if (!addPartida) { onToast?.("⚠️ Función no disponible"); return; }
    // addPartida con struttura compatibile con ADD_PARTIDA_FROM_LISTINO
    kit.materiales?.forEach(mat => {
      addPartida({
        nombre:    `[${kit.nombre}] ${mat.nombre}`,
        cat:       kit.categoria || "Obra Gruesa",
        unidad:    mat.unidad || mat.unit || "un",
        cant:      +(mat.cantidad * m2).toFixed(2),
        pu:        0,
        visible:   true,
        proveedor: "",
        nota:      mat.nota || "",
      });
    });
    onToast?.(`✅ ${kit.materiales?.length || 0} materiales de "${kit.nombre}" agregados a Costos`);
  }, [addPartida, onToast]);

  // ── Importar predefinido ──────────────────────────────────────────────────
  const handleImportar = async (kitPred) => {
    await onImportarPredefinito?.(kitPred);
    setPestana("mios");
  };

  // ── Filtros ───────────────────────────────────────────────────────────────
  const listaBase = pestana === "predefinidos" ? KIT_PREDEFINITI : kits;
  const listaFiltrada = listaBase.filter(k => {
    const matchCat = filtrocat === "Todos" || k.categoria === filtrocat;
    const matchBus = !busqueda || k.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      k.materiales?.some(m => m.nombre?.toLowerCase().includes(busqueda.toLowerCase()));
    return matchCat && matchBus;
  });

  // ── Render: Vista detalle kit ─────────────────────────────────────────────
  if (vista === "detalle" && kitSeleccionado) {
    const kit = kitSeleccionado;
    const col = COLORES_CAT[kit.categoria] || COLORES_CAT["Personalizado"];
    return (
      <div style={{ padding: "16px", maxWidth: 600, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <button onClick={() => { setVista("galeria"); setKitSeleccionado(null); }}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: "2px 6px" }}>←</button>
          <span style={{ fontSize: 28 }}>{kit.emoji}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17 }}>{kit.nombre}</div>
            <div style={{ display: "inline-block", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999,
              background: col.bg, color: col.text, border: `1px solid ${col.border}` }}>{kit.categoria}</div>
          </div>
        </div>

        {kit.descripcion && (
          <div style={{ background: "#f8f9fa", borderRadius: 10, padding: "10px 14px", marginBottom: 16,
            fontSize: 13, color: "#555", borderLeft: "3px solid #dee2e6" }}>{kit.descripcion}</div>
        )}

        {/* Multiplicador m² */}
        <div style={{ background: "#e8f4fd", borderRadius: 10, padding: "12px 14px", marginBottom: 16,
          border: "1px solid #b3d9f7" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#0d6efd", marginBottom: 6 }}>
            📐 Escala los materiales por superficie
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <label style={{ fontSize: 13, color: "#333" }}>Superficie (m²):</label>
            <input type="number" min="0.1" step="0.1" value={m2}
              onChange={e => setM2(+e.target.value || 1)}
              style={{ width: 80, padding: "6px 8px", borderRadius: 6, border: "1px solid #b3d9f7",
                fontSize: 14, fontWeight: 600, textAlign: "center" }} />
            {m2 !== 1 && <span style={{ fontSize: 12, color: "#0d6efd" }}>×{m2} aplicado</span>}
          </div>
        </div>

        {/* Lista materiales */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#333", marginBottom: 8 }}>
            Materiales ({kit.materiales?.length || 0})
          </div>
          {kit.materiales?.map((mat, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              padding: "10px 12px", background: i % 2 === 0 ? "#fff" : "#f9f9f9",
              borderRadius: 8, marginBottom: 4, border: "1px solid #f0f0f0" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{mat.nombre}</div>
                {mat.nota && <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{mat.nota}</div>}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e" }}>
                  {+(mat.cantidad * m2).toFixed(3)}
                </div>
                <div style={{ fontSize: 11, color: "#888" }}>{mat.unidad}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Acciones */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {addPartida && (
            <button onClick={() => agregarKitACostos(kit, m2)}
              style={{ padding: "12px", background: "#1a1a2e", color: "#fff", border: "none",
                borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              ➕ Agregar todo a Costos
            </button>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => abrirEditor(kit)}
              style={{ flex: 1, padding: "10px", background: "#f0f0f0", border: "none",
                borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <IconEdit /> Editar
            </button>
            {pestana !== "predefinidos" && (
              <button onClick={() => { setConfirmBorrar(kit); }}
                style={{ flex: 1, padding: "10px", background: "#fff0f0", border: "1px solid #ffcccc",
                  borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", color: "#dc3545",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <IconTrash /> Eliminar
              </button>
            )}
            {pestana === "predefinidos" && (
              <button onClick={() => handleImportar(kit)}
                style={{ flex: 1, padding: "10px", background: "#e8f5e9", border: "1px solid #a5d6a7",
                  borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer", color: "#2e7d32",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <IconCopy /> Importar y personalizar
              </button>
            )}
          </div>
        </div>

        {/* Confirm borrar */}
        {confirmBorrar && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex",
            alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }}>
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, maxWidth: 320, width: "100%" }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>¿Eliminar kit?</div>
              <div style={{ fontSize: 13, color: "#555", marginBottom: 20 }}>
                Se eliminará <strong>{confirmBorrar.nombre}</strong>. Esta acción no se puede deshacer.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setConfirmBorrar(null)}
                  style={{ flex: 1, padding: "10px", background: "#f0f0f0", border: "none",
                    borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Cancelar</button>
                <button onClick={async () => {
                    await onDeleteKit?.(confirmBorrar.id);
                    setConfirmBorrar(null);
                    setVista("galeria");
                    setKitSeleccionado(null);
                  }}
                  style={{ flex: 1, padding: "10px", background: "#dc3545", color: "#fff", border: "none",
                    borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>Eliminar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Render: Editor kit ────────────────────────────────────────────────────
  if (vista === "editor") {
    return (
      <div style={{ padding: "16px", maxWidth: 600, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={cerrarEditor}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: "2px 6px" }}>←</button>
            <div style={{ fontWeight: 700, fontSize: 17 }}>
              {editando ? "✏️ Editar kit" : "➕ Nuevo kit"}
            </div>
          </div>
          <button onClick={handleGuardar}
            style={{ padding: "8px 16px", background: "#1a1a2e", color: "#fff", border: "none",
              borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6 }}>
            <IconSave /> Guardar
          </button>
        </div>

        {/* Info básica */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e9ecef", padding: 16, marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#888", display: "block", marginBottom: 4 }}>EMOJI</label>
              <input value={formKit.emoji} onChange={e => setFormKit(f => ({ ...f, emoji: e.target.value }))}
                style={{ width: 60, padding: "8px", borderRadius: 8, border: "1px solid #dee2e6",
                  fontSize: 22, textAlign: "center" }} maxLength={2} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#888", display: "block", marginBottom: 4 }}>NOMBRE DEL KIT *</label>
              <input value={formKit.nombre} onChange={e => setFormKit(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Piso cerámico baño"
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #dee2e6",
                  fontSize: 14, boxSizing: "border-box" }} />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#888", display: "block", marginBottom: 4 }}>CATEGORÍA</label>
            <select value={formKit.categoria} onChange={e => setFormKit(f => ({ ...f, categoria: e.target.value }))}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #dee2e6", fontSize: 14 }}>
              {CATEGORIAS.filter(c => c !== "Todos").map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#888", display: "block", marginBottom: 4 }}>DESCRIPCIÓN (opcional)</label>
            <textarea value={formKit.descripcion} onChange={e => setFormKit(f => ({ ...f, descripcion: e.target.value }))}
              placeholder="¿Para qué sirve este kit?"
              rows={2}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #dee2e6",
                fontSize: 13, resize: "none", boxSizing: "border-box" }} />
          </div>
        </div>

        {/* Materiales */}
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10, color: "#333" }}>
          Materiales del kit
        </div>
        {formKit.materiales.map((mat, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 10, border: "1px solid #e9ecef",
            padding: "12px", marginBottom: 8 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input value={mat.nombre} onChange={e => updateMaterial(i, "nombre", e.target.value)}
                placeholder="Nombre del material *"
                style={{ flex: 1, padding: "7px 10px", borderRadius: 7, border: "1px solid #dee2e6", fontSize: 13 }} />
              <button onClick={() => removeMaterial(i)}
                style={{ background: "#fff0f0", border: "1px solid #ffcccc", borderRadius: 7,
                  padding: "0 10px", cursor: "pointer", color: "#dc3545" }}>
                <IconTrash />
              </button>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: "#aaa", display: "block", marginBottom: 3 }}>CANTIDAD</label>
                <input type="number" min="0" step="any" value={mat.cantidad}
                  onChange={e => updateMaterial(i, "cantidad", +e.target.value)}
                  style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #dee2e6",
                    fontSize: 13, boxSizing: "border-box" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 10, fontWeight: 600, color: "#aaa", display: "block", marginBottom: 3 }}>UNIDAD</label>
                <select value={mat.unidad} onChange={e => updateMaterial(i, "unidad", e.target.value)}
                  style={{ width: "100%", padding: "7px 8px", borderRadius: 7, border: "1px solid #dee2e6", fontSize: 13 }}>
                  {["m²", "ml", "m³", "kg", "L", "pcs", "gl", "hr"].map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <input value={mat.nota} onChange={e => updateMaterial(i, "nota", e.target.value)}
              placeholder="Nota / aclaración (opcional)"
              style={{ width: "100%", padding: "6px 10px", borderRadius: 7, border: "1px dashed #dee2e6",
                fontSize: 12, color: "#666", boxSizing: "border-box" }} />
          </div>
        ))}

        <button onClick={addMaterial}
          style={{ width: "100%", padding: "10px", background: "#f8f9fa", border: "2px dashed #dee2e6",
            borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#555",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <IconAdd /> Agregar material
        </button>
      </div>
    );
  }

  // ── Render: Galería (vista principal) ─────────────────────────────────────
  return (
    <div style={{ padding: "16px", maxWidth: 600, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 20, color: "#1a1a2e", marginBottom: 2 }}>
          📦 Kits de Materiales
        </div>
        <div style={{ fontSize: 12, color: "#888" }}>Combos predefinidos y personalizados</div>
      </div>

      {/* Pestañas */}
      <div style={{ display: "flex", background: "#f0f0f0", borderRadius: 10, padding: 3, marginBottom: 14, gap: 3 }}>
        {[["predefinidos", "⚡ Predefinidos"], ["mios", `📁 Mis kits${kits.length ? ` (${kits.length})` : ""}`]].map(([val, label]) => (
          <button key={val} onClick={() => setPestana(val)}
            style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", cursor: "pointer",
              fontWeight: 600, fontSize: 13,
              background: pestana === val ? "#fff" : "transparent",
              color: pestana === val ? "#1a1a2e" : "#888",
              boxShadow: pestana === val ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Buscador */}
      <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
        placeholder="🔍 Buscar kit o material..."
        style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid #dee2e6",
          fontSize: 13, marginBottom: 10, boxSizing: "border-box", background: "#fafafa" }} />

      {/* Filtro categorías */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 14, paddingBottom: 4 }}>
        {CATEGORIAS.map(cat => {
          const col = COLORES_CAT[cat];
          const activo = filtrocat === cat;
          return (
            <button key={cat} onClick={() => setFiltroCat(cat)}
              style={{ flexShrink: 0, padding: "5px 12px", borderRadius: 999, border: `1px solid ${activo && col ? col.border : "#dee2e6"}`,
                background: activo && col ? col.bg : "#fff",
                color: activo && col ? col.text : "#555",
                fontWeight: activo ? 700 : 500, fontSize: 12, cursor: "pointer",
                transition: "all 0.15s" }}>
              {cat}
            </button>
          );
        })}
      </div>

      {/* Lista de kits */}
      {cargando && pestana === "mios" ? (
        <div style={{ textAlign: "center", padding: 40, color: "#aaa" }}>Cargando...</div>
      ) : listaFiltrada.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>{pestana === "mios" ? "📭" : "🔍"}</div>
          <div style={{ fontWeight: 600, color: "#555", marginBottom: 6 }}>
            {pestana === "mios" ? "Aún no tienes kits personalizados" : "No hay resultados"}
          </div>
          <div style={{ fontSize: 13, color: "#aaa" }}>
            {pestana === "mios" ? "Crea tu primer kit o importa uno predefinido" : "Prueba con otro filtro"}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {listaFiltrada.map((kit, i) => {
            const col = COLORES_CAT[kit.categoria] || COLORES_CAT["Personalizado"];
            return (
              <div key={kit.id || i}
                onClick={() => { setKitSeleccionado(kit); setM2(1); setVista("detalle"); }}
                style={{ background: "#fff", borderRadius: 12, border: "1px solid #e9ecef",
                  padding: "14px", cursor: "pointer", transition: "box-shadow 0.15s, transform 0.1s",
                  display: "flex", alignItems: "center", gap: 14 }}
                onMouseOver={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"}
                onMouseOut={e => e.currentTarget.style.boxShadow = "none"}
              >
                <span style={{ fontSize: 28, flexShrink: 0 }}>{kit.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, whiteSpace: "nowrap",
                    overflow: "hidden", textOverflow: "ellipsis" }}>{kit.nombre}</div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999,
                      background: col.bg, color: col.text, border: `1px solid ${col.border}` }}>
                      {kit.categoria}
                    </span>
                    <span style={{ fontSize: 11, color: "#aaa" }}>
                      {kit.materiales?.length || 0} materiales
                    </span>
                  </div>
                </div>
                <span style={{ color: "#ccc", fontSize: 18, flexShrink: 0 }}>›</span>
              </div>
            );
          })}
        </div>
      )}

      {/* FAB nuevo kit */}
      <button onClick={() => abrirEditor()}
        style={{ position: "fixed", bottom: 80, right: 20, width: 52, height: 52,
          borderRadius: "50%", background: "#1a1a2e", color: "#fff", border: "none",
          fontSize: 24, cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
        <IconPlus />
      </button>
    </div>
  );
}
