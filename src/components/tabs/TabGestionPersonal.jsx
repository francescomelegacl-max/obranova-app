// ─── components/tabs/TabGestionPersonal.jsx ──────────────────────────────────
// Tab Team exclusive — Gestión de personal, contratos y presencias
// v1 — Marzo 2026

import { useState, useMemo, useEffect } from "react";
import {
  useEmpleados,
  TIPOS_CONTRATO, ESTADOS_EMPLEADO, CARGOS_SUGERIDOS,
  calcularSueldoLiquido, diasHastaVencimiento,
} from "../../hooks/useEmpleados";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = n => n ? "$ " + Math.round(n).toLocaleString("es-CL") : "—";
const fmtDate = d => d ? new Date(d + "T12:00:00").toLocaleDateString("es-CL") : "—";

function estadoStyle(estado) {
  const e = ESTADOS_EMPLEADO.find(x => x.value === estado);
  return e ? { color: e.color, background: e.bg } : { color: "#718096", background: "#f7fafc" };
}

function tipoLabel(tipo) {
  return TIPOS_CONTRATO.find(x => x.value === tipo)?.label || tipo;
}

// ── Export Excel ──────────────────────────────────────────────────────────────
async function exportarEmpleadosExcel(empleados) {
  const XLSX = await import("xlsx");
  const rows = empleados.map(e => ({
    "Nombre":           e.nombre || "",
    "RUT":              e.rut    || "",
    "Teléfono":         e.telefono || "",
    "Cargo":            e.cargo  || "",
    "Tipo contrato":    tipoLabel(e.tipoContrato),
    "Estado":           e.estado || "",
    "Fecha inicio":     fmtDate(e.fechaInicio),
    "Vencimiento":      e.fechaVencimiento ? fmtDate(e.fechaVencimiento) : "—",
    "Sueldo bruto":     e.sueldoBruto || 0,
    "Sueldo líquido":   calcularSueldoLiquido(e.sueldoBruto, e.tipoContrato)?.liquido || "",
    "Nota":             e.nota || "",
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  // Ancho colonne
  ws["!cols"] = [22,14,14,18,16,12,14,14,14,14,30].map(w => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Personal");
  XLSX.writeFile(wb, `personal_${new Date().toISOString().slice(0,10)}.xlsx`);
}

// ── Componente Modal Empleado ─────────────────────────────────────────────────
function ModalEmpleado({ empleado, onSave, onClose }) {
  const esNuevo = !empleado?.id;
  const [form, setForm] = useState({
    nombre:           empleado?.nombre           || "",
    rut:              empleado?.rut              || "",
    telefono:         empleado?.telefono         || "",
    cargo:            empleado?.cargo            || "",
    fechaInicio:      empleado?.fechaInicio      || "",
    tipoContrato:     empleado?.tipoContrato     || "indefinido",
    fechaVencimiento: empleado?.fechaVencimiento || "",
    estado:           empleado?.estado           || "Activo",
    sueldoBruto:      empleado?.sueldoBruto      || "",
    nota:             empleado?.nota             || "",
  });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("datos"); // "datos" | "sueldo"

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const necesitaVencimiento = ["plazo_fijo", "por_obra"].includes(form.tipoContrato);

  const sueldo = useMemo(() =>
    calcularSueldoLiquido(form.sueldoBruto, form.tipoContrato),
    [form.sueldoBruto, form.tipoContrato]
  );

  const handleSubmit = async () => {
    if (!form.nombre.trim()) return alert("El nombre es obligatorio");
    setSaving(true);
    await onSave(form, empleado?.id || null);
    setSaving(false);
    onClose();
  };

  const inputStyle = {
    width: "100%", padding: "8px 10px", borderRadius: 8,
    border: "1px solid #e2e8f0", fontSize: 13, boxSizing: "border-box",
    outline: "none", background: "white",
  };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: "#718096", marginBottom: 4, display: "block" };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.5)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "white", borderRadius: 16, width: "100%", maxWidth: 480,
        maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.25)",
      }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#1a365d,#2d3748)", padding: "18px 20px", borderRadius: "16px 16px 0 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "white", fontWeight: 800, fontSize: 15 }}>
              {esNuevo ? "➕ Nuevo empleado" : "✏️ Editar empleado"}
            </div>
            {!esNuevo && <div style={{ color: "#a0aec0", fontSize: 12, marginTop: 2 }}>{empleado.nombre}</div>}
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,.1)", border: "none", color: "white", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        {/* Tabs interni */}
        <div style={{ display: "flex", borderBottom: "2px solid #f0f4f8", padding: "0 20px" }}>
          {[["datos","👤 Datos"], ["sueldo","💰 Sueldo"]].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding: "10px 14px", border: "none", background: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 700, color: tab === k ? "#1a365d" : "#a0aec0",
              borderBottom: tab === k ? "2px solid #1a365d" : "2px solid transparent",
              marginBottom: -2,
            }}>{label}</button>
          ))}
        </div>

        <div style={{ padding: "20px" }}>
          {tab === "datos" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Nombre */}
              <div>
                <label style={labelStyle}>NOMBRE COMPLETO *</label>
                <input style={inputStyle} value={form.nombre} onChange={e => set("nombre", e.target.value)} placeholder="Ej. Juan Pérez González" />
              </div>
              {/* RUT + Teléfono */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>RUT</label>
                  <input style={inputStyle} value={form.rut} onChange={e => set("rut", e.target.value)} placeholder="12.345.678-9" />
                </div>
                <div>
                  <label style={labelStyle}>TELÉFONO</label>
                  <input style={inputStyle} value={form.telefono} onChange={e => set("telefono", e.target.value)} placeholder="+56 9 1234 5678" />
                </div>
              </div>
              {/* Cargo */}
              <div>
                <label style={labelStyle}>CARGO</label>
                <input style={inputStyle} value={form.cargo} onChange={e => set("cargo", e.target.value)} placeholder="Ej. Maestro mayor" list="cargos-list" />
                <datalist id="cargos-list">
                  {CARGOS_SUGERIDOS.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
              {/* Tipo contrato + Estado */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>TIPO CONTRATO</label>
                  <select style={inputStyle} value={form.tipoContrato} onChange={e => set("tipoContrato", e.target.value)}>
                    {TIPOS_CONTRATO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>ESTADO</label>
                  <select style={inputStyle} value={form.estado} onChange={e => set("estado", e.target.value)}>
                    {ESTADOS_EMPLEADO.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                  </select>
                </div>
              </div>
              {/* Fecha inicio + Vencimiento */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>FECHA INICIO</label>
                  <input type="date" style={inputStyle} value={form.fechaInicio} onChange={e => set("fechaInicio", e.target.value)} />
                </div>
                <div>
                  <label style={{ ...labelStyle, color: necesitaVencimiento ? "#c05621" : "#cbd5e0" }}>
                    VENCIMIENTO CONTRATO {necesitaVencimiento ? "*" : ""}
                  </label>
                  <input type="date" style={{ ...inputStyle, opacity: necesitaVencimiento ? 1 : 0.4 }}
                    value={form.fechaVencimiento} onChange={e => set("fechaVencimiento", e.target.value)}
                    disabled={!necesitaVencimiento} />
                </div>
              </div>
              {/* Nota */}
              <div>
                <label style={labelStyle}>NOTAS</label>
                <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }}
                  value={form.nota} onChange={e => set("nota", e.target.value)}
                  placeholder="Observaciones, habilidades, etc." />
              </div>
            </div>
          )}

          {tab === "sueldo" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>SUELDO BASE BRUTO (CLP)</label>
                <input type="number" style={inputStyle} value={form.sueldoBruto}
                  onChange={e => set("sueldoBruto", e.target.value)}
                  placeholder="Ej. 600000" />
              </div>

              {form.tipoContrato === "subcontrato" && (
                <div style={{ background: "#fffff0", border: "1px solid #f6e05e", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#744210" }}>
                  ⚠️ El cálculo de liquidación no aplica para subcontratos.
                </div>
              )}

              {sueldo && (
                <div style={{ background: "#f0fff4", border: "1px solid #9ae6b4", borderRadius: 12, padding: "16px 18px" }}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: "#276749", marginBottom: 12 }}>💰 ESTIMACIÓN SUELDO LÍQUIDO</div>
                  <div style={{ fontSize: 11, color: "#718096", marginBottom: 10 }}>
                    Estimación basada en gratificación legal (Art. 50), AFP ~10%, Salud ~7%.
                  </div>
                  {[
                    ["Sueldo bruto",       sueldo.bruto,        "#4a5568"],
                    ["+ Gratificación",    sueldo.gratificacion, "#276749"],
                    ["− AFP (~10%)",       -sueldo.afp,         "#c53030"],
                    ["− Salud (~7%)",      -sueldo.salud,       "#c53030"],
                  ].map(([label, val, color]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: "#718096" }}>{label}</span>
                      <span style={{ fontWeight: 700, color }}>{val < 0 ? "− " + fmt(-val) : fmt(val)}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: "2px solid #9ae6b4", paddingTop: 10, marginTop: 6, display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, color: "#276749" }}>
                    <span>Sueldo líquido est.</span>
                    <span>{fmt(sueldo.liquido)}</span>
                  </div>
                </div>
              )}

              <div style={{ background: "#ebf8ff", border: "1px solid #bee3f8", borderRadius: 8, padding: "10px 14px", fontSize: 11, color: "#2b6cb0" }}>
                ℹ️ Valores estimativos. Consulta con tu contador para la liquidación oficial.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #f0f4f8", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "9px 20px", background: "#f7fafc", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13, color: "#4a5568" }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={saving} style={{ padding: "9px 22px", background: saving ? "#a0aec0" : "#276749", border: "none", borderRadius: 8, cursor: saving ? "default" : "pointer", fontWeight: 700, fontSize: 13, color: "white" }}>
            {saving ? "Guardando..." : esNuevo ? "Agregar empleado" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Card Empleado ─────────────────────────────────────────────────────────────
function CardEmpleado({ emp, onEdit, onDelete }) {
  const dias = diasHastaVencimiento(emp.fechaVencimiento);
  const alertaDias = dias !== null && dias <= 30;
  const contratoVencido = dias !== null && dias < 0;

  return (
    <div style={{
      background: "white", borderRadius: 12, padding: "14px 16px",
      boxShadow: "0 1px 4px rgba(0,0,0,.07)",
      border: contratoVencido ? "2px solid #fc8181" : alertaDias ? "2px solid #f6ad55" : "1px solid #e2e8f0",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        {/* Info principale */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 800, fontSize: 14, color: "#1a365d" }}>{emp.nombre || "—"}</span>
            <span style={{ ...estadoStyle(emp.estado), fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99 }}>
              {emp.estado}
            </span>
          </div>
          <div style={{ fontSize: 12, color: "#718096", marginBottom: 6 }}>
            {emp.cargo && <span style={{ fontWeight: 600, color: "#4a5568" }}>{emp.cargo}</span>}
            {emp.cargo && emp.tipoContrato && <span> · </span>}
            {emp.tipoContrato && <span>{tipoLabel(emp.tipoContrato)}</span>}
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 11, color: "#a0aec0" }}>
            {emp.rut      && <span>🪪 {emp.rut}</span>}
            {emp.telefono && <span>📱 {emp.telefono}</span>}
            {emp.fechaInicio && <span>📅 Desde {fmtDate(emp.fechaInicio)}</span>}
          </div>
          {emp.fechaVencimiento && (
            <div style={{
              marginTop: 6, fontSize: 11, fontWeight: 700,
              color: contratoVencido ? "#c53030" : alertaDias ? "#c05621" : "#718096",
            }}>
              {contratoVencido
                ? `⚠️ Contrato vencido hace ${Math.abs(dias)} días`
                : alertaDias
                  ? `⏳ Vence en ${dias} días (${fmtDate(emp.fechaVencimiento)})`
                  : `Vence: ${fmtDate(emp.fechaVencimiento)}`}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {emp.telefono && (() => {
            const num = emp.telefono.replace(/[\s\-\+\(\)]/g,"");
            const norm = num.startsWith("56") ? num : num.startsWith("9") ? `56${num}` : `569${num}`;
            return (
              <a href={`https://wa.me/${norm}`} target="_blank" rel="noopener noreferrer"
                style={{ padding: "6px 9px", background: "#f0fff4", border: "1px solid #9ae6b4", borderRadius: 7, cursor: "pointer", fontSize: 14, textDecoration: "none" }}
                title="WhatsApp">💬</a>
            );
          })()}
          <button onClick={() => onEdit(emp)} style={{ padding: "6px 9px", background: "#ebf8ff", border: "1px solid #bee3f8", borderRadius: 7, cursor: "pointer", fontSize: 12, color: "#2b6cb0", fontWeight: 600 }}>
            Editar
          </button>
          <button onClick={() => onDelete(emp.id)} style={{ padding: "6px 9px", background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 7, cursor: "pointer", fontSize: 12, color: "#c53030" }}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Banner Alertas ────────────────────────────────────────────────────────────
function BannerAlertas({ alertas, onEdit }) {
  if (!alertas.length) return null;
  return (
    <div style={{ background: "#fffbeb", border: "1px solid #f6ad55", borderRadius: 12, padding: "14px 16px" }}>
      <div style={{ fontWeight: 800, fontSize: 13, color: "#c05621", marginBottom: 10 }}>
        ⚠️ {alertas.length} contrato{alertas.length > 1 ? "s" : ""} próximo{alertas.length > 1 ? "s" : ""} a vencer
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {alertas.map(e => {
          const dias = diasHastaVencimiento(e.fechaVencimiento);
          const vencido = dias < 0;
          return (
            <div key={e.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: 12 }}>
              <span style={{ color: vencido ? "#c53030" : "#c05621", fontWeight: 600 }}>
                {vencido ? "🔴" : "🟠"} {e.nombre} — {vencido ? `vencido hace ${Math.abs(dias)} días` : `vence en ${dias} días`}
              </span>
              <button onClick={() => onEdit(e)} style={{ padding: "3px 10px", background: "white", border: "1px solid #f6ad55", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#c05621", flexShrink: 0 }}>
                Ver
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Componente principale ─────────────────────────────────────────────────────
export default function TabGestionPersonal({ workspaceId, onToast, isTeam = false }) {
  const { empleados, loading, alertasVencimiento, loadEmpleados, saveEmpleado, deleteEmpleado } =
    useEmpleados({ workspaceId, onToast });

  const [modalOpen,     setModalOpen]     = useState(false);
  const [empleadoEdit,  setEmpleadoEdit]  = useState(null);
  const [filtroEstado,  setFiltroEstado]  = useState("Todos");
  const [search,        setSearch]        = useState("");

  // Carica al mount — solo se l'utente è su piano Team
  // Senza questo guard, Firestore nega la lettura di /empleados per utenti non-Team
  useEffect(() => { if (isTeam) loadEmpleados(); }, [isTeam, loadEmpleados]);

  // Filtro e ricerca
  const empleadosFiltrati = useMemo(() => {
    let list = empleados;
    if (filtroEstado !== "Todos") list = list.filter(e => e.estado === filtroEstado);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        (e.nombre || "").toLowerCase().includes(q) ||
        (e.cargo  || "").toLowerCase().includes(q) ||
        (e.rut    || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [empleados, filtroEstado, search]);

  const handleNuevo = () => { setEmpleadoEdit(null); setModalOpen(true); };
  const handleEdit  = (emp) => { setEmpleadoEdit(emp); setModalOpen(true); };
  const handleSave  = async (form, id) => { await saveEmpleado(form, id); };

  // Paywall se non Team
  if (!isTeam) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <div style={{ textAlign: "center", maxWidth: 360, padding: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
          <div style={{ fontWeight: 800, fontSize: 18, color: "#1a365d", marginBottom: 8 }}>Gestión Personal</div>
          <div style={{ fontSize: 14, color: "#718096", marginBottom: 24, lineHeight: 1.6 }}>
            Gestiona tu equipo, contratos y sueldos. Disponible exclusivamente en el plan Empresa.
          </div>
          <div style={{ background: "linear-gradient(135deg,#1a365d,#553c9a)", borderRadius: 12, padding: "14px 20px", color: "white", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
            👥 Plan Empresa — $34.900/mes
          </div>
          <div style={{ fontSize: 12, color: "#a0aec0" }}>Incluye hasta 5 usuarios en el workspace</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#1a365d,#2d3748)", borderRadius: 12, padding: "18px 20px", color: "white" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 3 }}>👥 Gestión Personal</div>
            <div style={{ color: "#a0aec0", fontSize: 12 }}>
              {empleados.length} empleado{empleados.length !== 1 ? "s" : ""} · {empleados.filter(e => e.estado === "Activo").length} activos
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => exportarEmpleadosExcel(empleados)}
              style={{ padding: "8px 14px", background: "rgba(255,255,255,.12)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 8, cursor: "pointer", color: "white", fontSize: 12, fontWeight: 700 }}>
              📊 Excel
            </button>
            <button onClick={handleNuevo}
              style={{ padding: "8px 16px", background: "#276749", border: "none", borderRadius: 8, cursor: "pointer", color: "white", fontSize: 13, fontWeight: 700 }}>
              + Nuevo empleado
            </button>
          </div>
        </div>
      </div>

      {/* Banner alertas vencimiento */}
      <BannerAlertas alertas={alertasVencimiento} onEdit={handleEdit} />

      {/* Filtri + ricerca */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#a0aec0", fontSize: 14 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, cargo o RUT..."
            style={{ width: "100%", paddingLeft: 32, paddingRight: 10, paddingTop: 8, paddingBottom: 8, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["Todos", "Activo", "Inactivo", "Licencia"].map(e => (
            <button key={e} onClick={() => setFiltroEstado(e)} style={{
              padding: "7px 12px", borderRadius: 99, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "none",
              background: filtroEstado === e ? "#1a365d" : "#f0f4f8",
              color: filtroEstado === e ? "white" : "#718096",
            }}>{e}</button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#a0aec0" }}>Cargando personal...</div>
      ) : empleadosFiltrati.length === 0 ? (
        <div style={{ background: "white", borderRadius: 16, padding: "60px 24px", textAlign: "center", boxShadow: "0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👷</div>
          <div style={{ fontWeight: 800, fontSize: 16, color: "#1a365d", marginBottom: 8 }}>
            {empleados.length === 0 ? "Aún no hay empleados" : "Sin resultados"}
          </div>
          <div style={{ fontSize: 14, color: "#718096", marginBottom: 20, maxWidth: 280, margin: "0 auto 20px" }}>
            {empleados.length === 0
              ? "Agrega tu primer empleado para empezar a gestionar tu equipo."
              : "Prueba con otro filtro o búsqueda."}
          </div>
          {empleados.length === 0 && (
            <button onClick={handleNuevo} style={{ padding: "10px 24px", background: "#276749", border: "none", borderRadius: 10, cursor: "pointer", color: "white", fontWeight: 700, fontSize: 14 }}>
              + Agregar primer empleado
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {empleadosFiltrati.map(emp => (
            <CardEmpleado key={emp.id} emp={emp} onEdit={handleEdit} onDelete={deleteEmpleado} />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <ModalEmpleado
          empleado={empleadoEdit}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
