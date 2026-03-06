// ─── hooks/useTemplates.js ────────────────────────────────────────────────────
// Gestiona templates de proyectos en localStorage.
// Un template guarda: nombre, categoria, partidas, pct, condPago, iva, nota.

const STORAGE_KEY = "obra_templates_v1";

const CATEGORIAS = [
  "Baño", "Cocina", "Habitación", "Fachada", "Techado",
  "Instalaciones", "Pintura", "Demolición", "General",
];

function loadAll() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveAll(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export { CATEGORIAS };

export function useTemplates() {
  // ── Leer todos ──────────────────────────────────────────────────────────────
  const getAll = () => loadAll();

  // ── Guardar nuevo template ──────────────────────────────────────────────────
  const saveTemplate = ({ nombre, categoria, partidas, pct, condPago, condPagoPersonalizado, cuotas, iva, nota }) => {
    const list = loadAll();
    const tpl = {
      id:       Date.now().toString(),
      nombre:   nombre || "Template sin nombre",
      categoria: categoria || "General",
      partidas: partidas || [],
      pct:      pct || { ci: 0, gf: 0, imprevistos: 0, utilidad: 0 },
      condPago: condPago || "contado",
      condPagoPersonalizado: condPagoPersonalizado || "",
      cuotas:   cuotas || [],
      iva:      iva || false,
      nota:     nota || "",
      creadoAt: new Date().toISOString().slice(0, 10),
      usadoVeces: 0,
    };
    saveAll([tpl, ...list]);
    return tpl;
  };

  // ── Eliminar ────────────────────────────────────────────────────────────────
  const deleteTemplate = (id) => {
    saveAll(loadAll().filter(t => t.id !== id));
  };

  // ── Incrementa contador uso ─────────────────────────────────────────────────
  const markUsed = (id) => {
    saveAll(loadAll().map(t => t.id === id ? { ...t, usadoVeces: (t.usadoVeces || 0) + 1 } : t));
  };

  // ── Aggiorna ────────────────────────────────────────────────────────────────
  const updateTemplate = (id, changes) => {
    saveAll(loadAll().map(t => t.id === id ? { ...t, ...changes } : t));
  };

  return { getAll, saveTemplate, deleteTemplate, markUsed, updateTemplate, CATEGORIAS };
}
