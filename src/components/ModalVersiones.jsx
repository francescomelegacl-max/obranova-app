// ─── components/ModalVersiones.jsx ───────────────────────────────────────────
// Comparatore versioni presupuesto.
// Mostra la lista degli snapshot salvati, permette di confrontare due versioni
// (diff partidas + totali) e ripristinare una versione precedente.
//
// USO in App.jsx:
//   import ModalVersiones from "./components/ModalVersiones";
//
//   <ModalVersiones
//     proyectoId={currentId}
//     workspaceId={workspace?.id}
//     proyState={proyState}          // stato corrente (per "Guardar versión")
//     onRestore={(snap) => { ... }}  // callback con lo snapshot da ripristinare
//     onClose={() => ...}
//     t={t}
//   />
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import {
  collection, addDoc, getDocs, deleteDoc, doc, orderBy, query, limit,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";

// ── Helpers ──────────────────────────────────────────────────────────────────

function calcTotal(partidas = [], pct = {}, iva = true) {
  const totalPct = (pct.ci || 0) + (pct.gf || 0) + (pct.imprevistos || 0) + (pct.utilidad || 0);
  const subtotal  = partidas.reduce((s, p) => s + (p.cant || 0) * (p.pu || 0), 0);
  const neto      = subtotal * (1 + totalPct / 100);
  return iva ? neto * 1.19 : neto;
}

function calcDetalle(partidas = [], pct = {}, iva = true) {
  const cd       = partidas.reduce((s, p) => s + (p.cant||0) * (p.pu||0), 0);
  const ci       = cd * ((pct.ci||0) / 100);
  const gf       = cd * ((pct.gf||0) / 100);
  const imp      = cd * ((pct.imprevistos||0) / 100);
  const sub      = cd + ci + gf + imp;
  const util     = sub * ((pct.utilidad||0) / 100);
  const neto     = sub + util;
  const total    = iva ? neto * 1.19 : neto;
  const margen   = cd > 0 ? ((neto - cd) / neto * 100) : 0;
  return { cd, ci, gf, imp, sub, util, neto, total, margen };
}

function fmt(n) {
  return "$" + Math.round(n).toLocaleString("es-CL");
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "2-digit" }) +
    " " + d.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
}

// ── Diff partidas entre dos snapshots ─────────────────────────────────────────
// Retorna { added, removed, changed } comparando por nombre+cat
function diffPartidas(partidasA = [], partidasB = []) {
  const keyOf = (p) => `${p.nombre}|${p.cat}`;
  const mapA  = Object.fromEntries(partidasA.map(p => [keyOf(p), p]));
  const mapB  = Object.fromEntries(partidasB.map(p => [keyOf(p), p]));

  const added   = partidasB.filter(p => !mapA[keyOf(p)]);
  const removed = partidasA.filter(p => !mapB[keyOf(p)]);
  const changed = partidasB.filter(p => {
    const a = mapA[keyOf(p)];
    if (!a) return false;
    return a.cant !== p.cant || a.pu !== p.pu;
  });

  return { added, removed, changed };
}

// ═══════════════════════════════════════════════════════════════════════════
// Componente principale
// ═══════════════════════════════════════════════════════════════════════════
// ── Helper esportabile per auto-save da App.jsx ───────────────────────────────
export async function saveSnapshotAuto(proyectoId, workspaceId, proyState, label = null) {
  if (!proyectoId || !workspaceId) return;
  const { addDoc, collection } = await import("firebase/firestore");
  const { db } = await import("../lib/firebase");
  const { partidas = [], pct = {}, info = {}, estado = "", iva = true,
    condPago = "", cuotas = [], catVis = {}, transferencia = {}, descuento = {} } = proyState;
  const cd       = partidas.reduce((s, p) => s + (p.cant||0) * (p.pu||0), 0);
  const totalPct = (pct.ci||0) + (pct.gf||0) + (pct.imprevistos||0) + (pct.utilidad||0);
  const total    = cd * (1 + totalPct / 100) * (iva !== false ? 1.19 : 1);
  await addDoc(collection(db, `workspaces/${workspaceId}/proyectos/${proyectoId}/snapshots`), {
    label:         label || "Auto-guardado",
    savedAt:       new Date().toISOString(),
    savedBy:       "auto",
    totalCalc:     total,
    partidasCount: partidas.length,
    data: { info, partidas, pct, estado, iva, condPago, cuotas, catVis, transferencia, descuento },
  });
}

export default function ModalVersiones({
  proyectoId,
  workspaceId,
  proyState,
  onRestore,
  onClose,
  t = {},
}) {
  const [snapshots,    setSnapshots]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [label,        setLabel]        = useState("");
  const [compareA,     setCompareA]     = useState(null); // índice A
  const [compareB,     setCompareB]     = useState(null); // índice B (null = versión actual)
  const [view,         setView]         = useState("list"); // "list" | "compare"
  const [confirmRestore, setConfirmRestore] = useState(null);

  const basePath = workspaceId
    ? `workspaces/${workspaceId}/proyectos/${proyectoId}/snapshots`
    : `users/${auth.currentUser?.uid}/proyectos/${proyectoId}/snapshots`;

  // ── Carga snapshots ────────────────────────────────────────────────────────
  const loadSnapshots = useCallback(async () => {
    if (!proyectoId) return;
    setLoading(true);
    try {
      const q    = query(collection(db, basePath), orderBy("savedAt", "desc"), limit(20));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setSnapshots(list);
    } catch (e) {
      console.error("loadSnapshots:", e);
    } finally {
      setLoading(false);
    }
  }, [proyectoId, basePath]);

  useEffect(() => { loadSnapshots(); }, [loadSnapshots]);

  // ── Guarda nueva versión ───────────────────────────────────────────────────
  const handleSave = async () => {
    if (!proyectoId) return;
    setSaving(true);
    try {
      const { info, partidas, pct, estado, validez, iva, condPago,
              condPagoPersonalizado, cuotas, catVis, transferencia, descuento } = proyState;
      await addDoc(collection(db, basePath), {
        label:     label.trim() || null,
        savedAt:   new Date().toISOString(),
        savedBy:   auth.currentUser?.email || "",
        totalCalc: calcTotal(partidas, pct, iva),
        partidasCount: (partidas || []).length,
        // Snapshot completo del estado
        data: {
          info, partidas, pct, estado, validez, iva,
          condPago, condPagoPersonalizado, cuotas, catVis, transferencia, descuento,
        },
      });
      setLabel("");
      await loadSnapshots();
    } catch (e) {
      console.error("saveSnapshot:", e);
      alert("Error al guardar versión: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Elimina snapshot ───────────────────────────────────────────────────────
  const handleDelete = async (snapId) => {
    if (!window.confirm("¿Eliminar esta versión?")) return;
    try {
      await deleteDoc(doc(db, basePath, snapId));
      await loadSnapshots();
    } catch (e) {
      console.error("deleteSnapshot:", e);
    }
  };

  // ── Restore ────────────────────────────────────────────────────────────────
  const handleRestore = (snap) => {
    onRestore(snap.data);
    onClose();
  };

  // ── Datos para comparación ─────────────────────────────────────────────────
  const snapA = compareA !== null ? snapshots[compareA] : null;

  // versión B: si compareB === null → versión actual
  const snapBData = compareB !== null
    ? snapshots[compareB]?.data
    : {
        partidas: proyState.partidas,
        pct:      proyState.pct,
        iva:      proyState.iva,
      };
  const snapBLabel = compareB !== null
    ? (snapshots[compareB]?.label || `v${snapshots.length - compareB}`)
    : "Versión actual";

  const diff = snapA
    ? diffPartidas(snapA.data?.partidas, snapBData?.partidas)
    : null;

  const totalA = snapA ? calcTotal(snapA.data?.partidas, snapA.data?.pct, snapA.data?.iva) : 0;
  const totalB = snapBData ? calcTotal(snapBData.partidas, snapBData.pct, snapBData.iva) : 0;
  const diffTotal = totalB - totalA;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const styles = {
    overlay: {
      position: "fixed", inset: 0, background: "rgba(0,0,0,.55)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px",
    },
    modal: {
      background: "white", borderRadius: 16, width: "100%", maxWidth: 720,
      maxHeight: "90vh", display: "flex", flexDirection: "column",
      boxShadow: "0 20px 60px rgba(0,0,0,.25)",
    },
    header: {
      padding: "18px 22px 14px",
      borderBottom: "1px solid #e2e8f0",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    },
    body: {
      flex: 1, overflowY: "auto", padding: "16px 22px",
    },
    footer: {
      padding: "14px 22px",
      borderTop: "1px solid #e2e8f0",
      display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap",
    },
    chip: (active) => ({
      padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700,
      border: "none", cursor: "pointer",
      background: active ? "#1a365d" : "#f0f4f8",
      color: active ? "white" : "#4a5568",
      transition: "all .15s",
    }),
    btn: (color = "#1a365d") => ({
      padding: "7px 16px", borderRadius: 9, border: "none", cursor: "pointer",
      background: color, color: "white", fontWeight: 700, fontSize: 12,
    }),
    snapCard: (selected) => ({
      padding: "12px 14px", borderRadius: 10, marginBottom: 8,
      border: `2px solid ${selected ? "#2b6cb0" : "#e2e8f0"}`,
      background: selected ? "#ebf8ff" : "white",
      display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
      cursor: "pointer", transition: "all .15s",
    }),
    tag: (color) => ({
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
      background: color + "22", color, border: `1px solid ${color}44`,
    }),
  };

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#1a365d" }}>
              🕓 Versiones del presupuesto
            </div>
            <div style={{ fontSize: 12, color: "#718096", marginTop: 2 }}>
              {snapshots.length} versión{snapshots.length !== 1 ? "es" : ""} guardada{snapshots.length !== 1 ? "s" : ""}
              {" · "}{proyState.partidas?.length || 0} partidas actuales
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#718096", padding: 4 }}>✕</button>
        </div>

        {/* View toggle */}
        <div style={{ padding: "10px 22px 0", display: "flex", gap: 6 }}>
          <button style={styles.chip(view === "list")}    onClick={() => setView("list")}>📋 Lista</button>
          <button style={styles.chip(view === "compare")} onClick={() => setView("compare")} disabled={snapshots.length === 0}>
            🔀 Comparar
          </button>
        </div>

        {/* Body */}
        <div style={styles.body}>

          {/* ── Vista Lista ─────────────────────────────────────────────── */}
          {view === "list" && (
            <div>
              {/* Versión actual (pseudo-snapshot) */}
              <div style={{
                padding: "12px 14px", borderRadius: 10, marginBottom: 10,
                background: "#f0fff4", border: "2px solid #9ae6b4",
                display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#276749", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ ...styles.tag("#276749"), fontSize: 10 }}>ACTUAL</span>
                    Sin guardar
                  </div>
                  <div style={{ fontSize: 11, color: "#4a5568", marginTop: 3 }}>
                    {proyState.partidas?.length || 0} partidas · {fmt(calcTotal(proyState.partidas, proyState.pct, proyState.iva))}
                  </div>
                </div>
              </div>

              {loading && (
                <div style={{ textAlign: "center", padding: 24, color: "#718096", fontSize: 13 }}>
                  Cargando versiones...
                </div>
              )}

              {!loading && snapshots.length === 0 && (
                <div style={{ textAlign: "center", padding: 28, color: "#a0aec0" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                  <div style={{ fontSize: 13 }}>No hay versiones guardadas todavía.</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Guarda una versión antes de hacer cambios importantes.</div>
                </div>
              )}

              {snapshots.map((snap, idx) => {
                const vNum = snapshots.length - idx;
                const lbl  = snap.label || `Versión ${vNum}`;
                return (
                  <div key={snap.id} style={styles.snapCard(false)}>
                    {/* Número */}
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ebf8ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#2b6cb0", flexShrink: 0 }}>
                      v{vNum}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#1a365d", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lbl}</div>
                      <div style={{ fontSize: 11, color: "#718096", marginTop: 2 }}>
                        {fmtDate(snap.savedAt)}
                        {snap.savedBy && ` · ${snap.savedBy}`}
                      </div>
                    </div>
                    {/* Stats */}
                    <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap", alignItems: "center" }}>
                      <span style={styles.tag("#553c9a")}>{snap.partidasCount ?? "?"} partidas</span>
                      <span style={styles.tag("#276749")}>{fmt(snap.totalCalc ?? 0)}</span>
                    </div>
                    {/* Acciones */}
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => setConfirmRestore(snap)}
                        style={{ ...styles.btn("#276749"), padding: "5px 12px", fontSize: 11 }}
                        title="Restaurar esta versión"
                      >↩ Restaurar</button>
                      <button
                        onClick={() => handleDelete(snap.id)}
                        style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #fed7d7", background: "#fff5f5", color: "#c53030", cursor: "pointer", fontSize: 11, fontWeight: 600 }}
                        title="Eliminar versión"
                      >🗑</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Vista Comparación ─────────────────────────────────────── */}
          {view === "compare" && (
            <div>
              {/* Selección A y B */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                {[
                  { key: "A", state: compareA, setter: setCompareA, label: "Versión base (A)" },
                  { key: "B", state: compareB, setter: setCompareB, label: "Versión destino (B)" },
                ].map(({ key, state, setter, label: lbl }) => (
                  <div key={key}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#4a5568", marginBottom: 6 }}>
                      {lbl}
                    </div>
                    <select
                      value={state ?? ""}
                      onChange={e => setter(e.target.value === "" ? null : parseInt(e.target.value))}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, color: "#1a365d" }}
                    >
                      {key === "B" && <option value="">📍 Versión actual</option>}
                      {key === "A" && <option value="">— Selecciona —</option>}
                      {snapshots.map((s, i) => (
                        <option key={s.id} value={i}>
                          v{snapshots.length - i} · {s.label || fmtDate(s.savedAt)} · {fmt(s.totalCalc ?? 0)}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Resultado comparación */}
              {!snapA ? (
                <div style={{ textAlign: "center", padding: 28, color: "#a0aec0", fontSize: 13 }}>
                  Selecciona una versión base (A) para comparar.
                </div>
              ) : (
                <div>
                  {/* Resumen totales dettagliato */}
                  {(() => {
                    const dA = calcDetalle(snapA.data?.partidas, snapA.data?.pct, snapA.data?.iva);
                    const dB = calcDetalle(snapBData?.partidas, snapBData?.pct, snapBData?.iva);
                    const rows = [
                      { l: "Costos directos",   a: dA.cd,   b: dB.cd   },
                      { l: "CI + GF + Imprev.", a: dA.ci+dA.gf+dA.imp, b: dB.ci+dB.gf+dB.imp },
                      { l: "Subtotal",          a: dA.sub,  b: dB.sub  },
                      { l: `Utilidad (${snapA.data?.pct?.utilidad||0}% → ${snapBData?.pct?.utilidad||0}%)`,
                                                a: dA.util, b: dB.util },
                      { l: "Total neto",        a: dA.neto, b: dB.neto, bold: true },
                    ];
                    return (
                      <div style={{ marginBottom: 16 }}>
                        {/* Header */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                          <div />
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#2b6cb0", textAlign: "right" }}>
                            {snapA.label || `v${snapshots.length - compareA}`}
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#276749", textAlign: "right" }}>
                            {snapBLabel}
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#718096", textAlign: "right" }}>
                            Δ Diferencia
                          </div>
                        </div>
                        {rows.map((r, i) => {
                          const diff = r.b - r.a;
                          const diffColor = diff > 0 ? "#276749" : diff < 0 ? "#c53030" : "#718096";
                          return (
                            <div key={i} style={{
                              display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8,
                              padding: "6px 8px", borderRadius: 6, marginBottom: 2,
                              background: r.bold ? "#f0f4f8" : "transparent",
                              fontWeight: r.bold ? 800 : 400,
                            }}>
                              <div style={{ fontSize: 12, color: "#4a5568" }}>{r.l}</div>
                              <div style={{ fontSize: 12, color: "#2b6cb0", textAlign: "right" }}>{fmt(r.a)}</div>
                              <div style={{ fontSize: 12, color: "#276749", textAlign: "right" }}>{fmt(r.b)}</div>
                              <div style={{ fontSize: 12, color: diffColor, textAlign: "right", fontWeight: 700 }}>
                                {diff !== 0 ? (diff > 0 ? "+" : "") + fmt(diff) : "—"}
                              </div>
                            </div>
                          );
                        })}
                        {/* Margine */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8,
                          padding: "6px 8px", borderRadius: 6, background: "#faf5ff" }}>
                          <div style={{ fontSize: 12, color: "#553c9a", fontWeight: 700 }}>Margen %</div>
                          <div style={{ fontSize: 12, color: "#553c9a", textAlign: "right", fontWeight: 700 }}>{dA.margen.toFixed(1)}%</div>
                          <div style={{ fontSize: 12, color: "#553c9a", textAlign: "right", fontWeight: 700 }}>{dB.margen.toFixed(1)}%</div>
                          <div style={{ fontSize: 12, textAlign: "right", fontWeight: 700,
                            color: dB.margen > dA.margen ? "#276749" : dB.margen < dA.margen ? "#c53030" : "#718096" }}>
                            {(dB.margen - dA.margen) !== 0 ? (dB.margen > dA.margen ? "+" : "") + (dB.margen - dA.margen).toFixed(1) + "%" : "—"}
                          </div>
                        </div>
                        {/* Diff estado/condPago */}
                        {(snapA.data?.estado !== snapBData?.estado || snapA.data?.condPago !== snapBData?.condPago) && (
                          <div style={{ marginTop: 8, padding: "8px 12px", background: "#FAEEDA",
                            border: "1px solid #BA7517", borderRadius: 8, fontSize: 12 }}>
                            {snapA.data?.estado !== snapBData?.estado && (
                              <div>Estado: <b style={{ color: "#c53030" }}>{snapA.data?.estado}</b> → <b style={{ color: "#276749" }}>{snapBData?.estado}</b></div>
                            )}
                            {snapA.data?.condPago !== snapBData?.condPago && (
                              <div>Pago: <b style={{ color: "#c53030" }}>{snapA.data?.condPago}</b> → <b style={{ color: "#276749" }}>{snapBData?.condPago}</b></div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Diff partidas */}
                  {diff && (
                    <div>
                      {/* Agregadas */}
                      {diff.added.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#276749", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ background: "#f0fff4", border: "1px solid #9ae6b4", borderRadius: 6, padding: "1px 8px" }}>+ {diff.added.length} agregada{diff.added.length !== 1 ? "s" : ""}</span>
                          </div>
                          {diff.added.map((p, i) => (
                            <div key={i} style={{ padding: "8px 12px", borderRadius: 8, background: "#f0fff4", border: "1px solid #9ae6b4", marginBottom: 5, fontSize: 12, display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "#276749", fontWeight: 600 }}>✚ {p.nombre} <span style={{ fontWeight: 400, color: "#4a5568" }}>({p.cat})</span></span>
                              <span style={{ color: "#276749", fontWeight: 700 }}>{p.cant} {p.unidad} · {fmt((p.cant || 0) * (p.pu || 0))}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Eliminadas */}
                      {diff.removed.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#c53030", marginBottom: 6 }}>
                            <span style={{ background: "#fff5f5", border: "1px solid #feb2b2", borderRadius: 6, padding: "1px 8px" }}>− {diff.removed.length} eliminada{diff.removed.length !== 1 ? "s" : ""}</span>
                          </div>
                          {diff.removed.map((p, i) => (
                            <div key={i} style={{ padding: "8px 12px", borderRadius: 8, background: "#fff5f5", border: "1px solid #feb2b2", marginBottom: 5, fontSize: 12, display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "#c53030", fontWeight: 600 }}>✕ {p.nombre} <span style={{ fontWeight: 400, color: "#4a5568" }}>({p.cat})</span></span>
                              <span style={{ color: "#c53030", fontWeight: 700 }}>{p.cant} {p.unidad} · {fmt((p.cant || 0) * (p.pu || 0))}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Modificadas */}
                      {diff.changed.length > 0 && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#b7791f", marginBottom: 6 }}>
                            <span style={{ background: "#fffaf0", border: "1px solid #fbd38d", borderRadius: 6, padding: "1px 8px" }}>~ {diff.changed.length} modificada{diff.changed.length !== 1 ? "s" : ""}</span>
                          </div>
                          {diff.changed.map((pB, i) => {
                            const pA = (snapA.data?.partidas || []).find(p => `${p.nombre}|${p.cat}` === `${pB.nombre}|${pB.cat}`);
                            return (
                              <div key={i} style={{ padding: "8px 12px", borderRadius: 8, background: "#fffaf0", border: "1px solid #fbd38d", marginBottom: 5, fontSize: 12 }}>
                                <div style={{ fontWeight: 700, color: "#744210", marginBottom: 4 }}>~ {pB.nombre}</div>
                                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", color: "#4a5568" }}>
                                  {pA?.cant !== pB.cant && (
                                    <span>Cant: <b style={{ color: "#c53030" }}>{pA?.cant}</b> → <b style={{ color: "#276749" }}>{pB.cant}</b></span>
                                  )}
                                  {pA?.pu !== pB.pu && (
                                    <span>PU: <b style={{ color: "#c53030" }}>{fmt(pA?.pu || 0)}</b> → <b style={{ color: "#276749" }}>{fmt(pB.pu || 0)}</b></span>
                                  )}
                                  <span style={{ marginLeft: "auto", fontWeight: 700, color: "#744210" }}>
                                    {fmt((pA?.cant || 0) * (pA?.pu || 0))} → {fmt((pB.cant || 0) * (pB.pu || 0))}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0 && (
                        <div style={{ textAlign: "center", padding: 20, color: "#718096", fontSize: 13 }}>
                          ✅ Las partidas son idénticas entre estas dos versiones.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer — guardar nueva versión */}
        <div style={styles.footer}>
          <input
            value={label}
            onChange={e => setLabel(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !saving && handleSave()}
            placeholder='Etiqueta (opcional) — ej: "Antes de bajar precios"'
            style={{
              flex: 1, minWidth: 160, padding: "8px 12px",
              border: "1px solid #e2e8f0", borderRadius: 9, fontSize: 12, color: "#1a365d",
            }}
            maxLength={60}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ ...styles.btn("#1a365d"), opacity: saving ? 0.6 : 1, flexShrink: 0 }}
          >
            {saving ? "⏳ Guardando..." : snapshots.length >= 20 ? "💾 Guardar (elimina la más antigua)" : "💾 Guardar versión actual"}
          </button>
          <button onClick={onClose} style={{ ...styles.btn("#718096"), flexShrink: 0 }}>Cerrar</button>
        </div>
      </div>

      {/* Modal confirm restore */}
      {confirmRestore && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "white", borderRadius: 14, padding: 24, maxWidth: 400, width: "100%", boxShadow: "0 8px 32px rgba(0,0,0,.2)" }}>
            <div style={{ fontSize: 18, marginBottom: 10 }}>↩ Restaurar versión</div>
            <div style={{ fontSize: 13, color: "#4a5568", marginBottom: 16, lineHeight: 1.6 }}>
              ¿Restaurar <b>"{confirmRestore.label || "esta versión"}"</b>?<br />
              El estado actual se perderá si no lo guardaste antes.<br />
              <span style={{ color: "#c53030" }}>Esta acción no se puede deshacer.</span>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmRestore(null)} style={{ padding: "8px 16px", borderRadius: 9, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: 13 }}>
                Cancelar
              </button>
              <button
                onClick={() => { handleRestore(confirmRestore); setConfirmRestore(null); }}
                style={{ padding: "8px 18px", borderRadius: 9, border: "none", background: "#276749", color: "white", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
              >
                ↩ Sí, restaurar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
