// ─── components/FirmaPage.jsx ─────────────────────────────────────────────────
// Pagina pubblica per firma — /firma/{proyId}
// Cerca il progetto nei workspace e redirecta a /cliente/ oppure mostra direttamente.
// Retrocompatibile con i link già inviati ai clienti.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useMemo } from "react";
import { doc, getDoc, setDoc, collection, getDocs, collectionGroup, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { calcTotals, fmt } from "../utils/helpers";
import { EMPRESA, ESTADO_COLORS, ESTADO_BG } from "../utils/constants";
import { LOGO_URL } from "../utils/logo";

export default function FirmaPage() {
  const [proyecto, setProyecto]     = useState(null);
  const [workspace, setWorkspace]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [showFirma, setShowFirma]   = useState(false);
  const [firmaNome, setFirmaNome]   = useState("");
  const [firmaRut, setFirmaRut]     = useState("");
  const [firmando, setFirmando]     = useState(false);
  const [firmado, setFirmado]       = useState(false);

  // Extract proyId from /firma/{proyId}
  const parts = window.location.pathname.split("/").filter(Boolean);
  const proyId = parts[1] || null;

  useEffect(() => {
    if (!proyId) { setError("Link no válido"); setLoading(false); return; }

    const load = async () => {
      try {
        // Cerca il progetto nei workspace usando collectionGroup
        // Fallback: prova a cercare direttamente se conosciamo la struttura
        const wsSnap = await getDocs(collection(db, "workspaces"));
        let found = false;

        for (const wsDoc of wsSnap.docs) {
          const pSnap = await getDoc(doc(db, "workspaces", wsDoc.id, "proyectos", proyId));
          if (pSnap.exists()) {
            setWorkspace({ id: wsDoc.id, ...wsDoc.data() });
            setProyecto({ id: pSnap.id, ...pSnap.data() });
            found = true;

            // Track view via CF trackVisita (invia anche notifica WA al costruttore)
            fetch("https://southamerica-west1-obra-nova-spa.cloudfunctions.net/trackVisita", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                wsId: wsDoc.id, proyId,
                source: "firma-link",
                userAgent: navigator.userAgent?.slice(0, 200) || "",
              }),
            }).catch(() => {});

            break;
          }
        }

        if (!found) setError("Presupuesto no encontrado");
      } catch (e) {
        setError("Error al cargar: " + e.message);
      }
      setLoading(false);
    };
    load();
  }, [proyId]);

  // Compute totals
  const totals = useMemo(() => {
    if (!proyecto) return null;
    return calcTotals(proyecto.partidas || [], proyecto.pct || { ci: 10, gf: 5, imprevistos: 5, utilidad: 10 }, proyecto.descuento);
  }, [proyecto]);

  // Firma handler
  const handleFirma = async () => {
    if (!firmaNome.trim() || !workspace) return;
    setFirmando(true);
    try {
      const { httpsCallable, getFunctions } = await import("firebase/functions");
      const token = `${workspace.id}_${proyId}_${Date.now()}`;
      await setDoc(doc(db, "workspaces", workspace.id, "firme", token), {
        proyectoId: proyId,
        stato: "firmato",
        firmaNome: firmaNome.trim(),
        firmaRut: firmaRut.trim(),
        timestamp: serverTimestamp(),
        token,
        tipo: "firma",
        proyectoSnapshot: proyecto || null,
      });
      await httpsCallable(getFunctions(undefined, "southamerica-west1"), "notificaFirma")({
        workspaceId: workspace.id, proyectoId: proyId, token, tipo: "firma",
        firmaNome: firmaNome.trim(),
      });
      setFirmado(true);
    } catch (e) {
      alert("Error al firmar: " + e.message);
    }
    setFirmando(false);
  };

  // Loading
  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7fafc", fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 44, height: 44, border: "4px solid #bee3f8", borderTopColor: "#2b6cb0", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 16px" }} />
        <div style={{ color: "#718096", fontSize: 14 }}>Cargando presupuesto...</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  // Error
  if (error) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7fafc", fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 400, padding: 24 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#1a365d", marginBottom: 8 }}>{error}</div>
        <div style={{ fontSize: 13, color: "#718096" }}>Verifica el link o contacta a la empresa.</div>
      </div>
    </div>
  );

  if (!proyecto || !totals) return null;

  const info = proyecto.info || {};
  const partidas = proyecto.partidas || [];
  const pct = proyecto.pct || {};
  const iva = proyecto.iva !== false;
  const estado = proyecto.estado || "Borrador";
  const catVis = proyecto.catVis || {};
  const descuento = proyecto.descuento || {};
  const validez = proyecto.validez ?? 30;
  const wsName = workspace?.name || EMPRESA.nombre;

  const venceDate = info.fecha
    ? new Date(new Date(info.fecha).getTime() + validez * 86400000).toLocaleDateString("es-CL")
    : "—";

  const cats = [...new Set(partidas.map(p => p.cat))];
  const visibleCats = cats.filter(c => catVis[c] !== false);
  const visiblePartidas = partidas.filter(p => visibleCats.includes(p.cat));
  const { cd, ci, gf, imprevistos: imprev, sub, util, total, descuentoAmt, totalConDesc, iva: ivaAmt, totalIva } = totals;

  return (
    <div style={{ minHeight: "100vh", background: "#f7fafc", fontFamily: "'Segoe UI',system-ui,sans-serif" }}>

      {/* Header */}
      <header style={{ background: "#1a365d", padding: "16px 20px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={LOGO_URL} alt="ON" style={{ height: 28 }} onError={e => e.target.style.display = "none"} />
            <span style={{ color: "white", fontWeight: 800, fontSize: 15 }}>{wsName}</span>
          </div>
          <span style={{
            padding: "4px 12px", borderRadius: 99, fontSize: 11, fontWeight: 700,
            background: ESTADO_BG[estado] || "#edf2f7",
            color: ESTADO_COLORS[estado] || "#718096",
          }}>{estado}</span>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px" }}>

        {/* Card título */}
        <div style={{ background: "white", borderRadius: 14, padding: "24px 20px", boxShadow: "0 1px 6px rgba(0,0,0,.06)", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "#a0aec0", fontWeight: 600, letterSpacing: 0.5, marginBottom: 4 }}>PRESUPUESTO</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#1a365d", marginBottom: 4 }}>{info.descripcion || "Sin descripción"}</div>
              <div style={{ fontSize: 14, color: "#4a5568" }}>Para: <strong>{info.cliente || "—"}</strong></div>
              {info.direccion && <div style={{ fontSize: 12, color: "#718096", marginTop: 2 }}>📍 {info.direccion}{info.ciudad ? `, ${info.ciudad}` : ""}</div>}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#276749" }}>{fmt(iva ? totalIva : totalConDesc)}</div>
              <div style={{ fontSize: 11, color: "#718096" }}>{iva ? "IVA incluido" : "Neto"}</div>
              <div style={{ fontSize: 11, color: "#a0aec0", marginTop: 4 }}>Válido hasta: {venceDate}</div>
            </div>
          </div>
        </div>

        {/* Partidas por categoría */}
        {visibleCats.map(cat => {
          const catPartidas = visiblePartidas.filter(p => p.cat === cat);
          if (!catPartidas.length) return null;
          const catTotal = catPartidas.reduce((s, p) => s + p.cant * p.pu, 0);
          return (
            <div key={cat} style={{ background: "white", borderRadius: 14, padding: 16, boxShadow: "0 1px 6px rgba(0,0,0,.06)", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #f0f4f8" }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: "#1a365d" }}>{cat}</span>
                <span style={{ fontWeight: 700, fontSize: 13, color: "#276749" }}>{fmt(catTotal)}</span>
              </div>
              {catPartidas.map((p, i) => (
                <div key={p.id || i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < catPartidas.length - 1 ? "1px solid #f7fafc" : "none" }}>
                  <div>
                    <div style={{ fontSize: 13, color: "#2d3748", fontWeight: 500 }}>{p.nombre}</div>
                    <div style={{ fontSize: 11, color: "#a0aec0" }}>{p.cant} {p.unidad}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#2d3748" }}>{fmt(p.cant * p.pu)}</div>
                    <div style={{ fontSize: 10, color: "#a0aec0" }}>@ {fmt(p.pu)}/{p.unidad}</div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}

        {/* Desglose finanziario */}
        <div style={{ background: "white", borderRadius: 14, padding: "18px 16px", boxShadow: "0 1px 6px rgba(0,0,0,.06)", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#1a365d", marginBottom: 10 }}>📊 Resumen financiero</div>
          {[
            { l: "Costos directos", v: cd },
            { l: `Costos indirectos (${pct.ci || 0}%)`, v: ci },
            { l: `Gastos fijos (${pct.gf || 0}%)`, v: gf },
            { l: `Imprevistos (${pct.imprevistos || 0}%)`, v: imprev },
          ].map(r => (
            <div key={r.l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12, color: "#718096" }}>
              <span>{r.l}</span><span>{fmt(r.v)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid #e2e8f0", fontWeight: 700, fontSize: 13, color: "#1a365d" }}>
            <span>Subtotal</span><span>{fmt(sub)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12, color: "#553c9a" }}>
            <span>Utilidad ({pct.utilidad || 0}%)</span><span>{fmt(util)}</span>
          </div>
          {(descuentoAmt || 0) > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12, color: "#e53e3e" }}>
              <span>Descuento{descuento.tipo === "pct" ? ` (${descuento.valor}%)` : ""}</span>
              <span>−{fmt(descuentoAmt)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "1px solid #e2e8f0", fontWeight: 800, fontSize: 14, color: "#1a365d" }}>
            <span>Total neto</span><span>{fmt(totalConDesc)}</span>
          </div>
          {iva && <>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12, color: "#c05621" }}>
              <span>IVA 19%</span><span>{fmt(ivaAmt)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", background: "#1a365d", borderRadius: 10, marginTop: 6 }}>
              <span style={{ color: "white", fontWeight: 800, fontSize: 15 }}>TOTAL</span>
              <span style={{ color: "white", fontWeight: 900, fontSize: 17 }}>{fmt(totalIva)}</span>
            </div>
          </>}
        </div>

        {/* Firma */}
        {firmado ? (
          <div style={{ background: "#f0fff4", borderRadius: 14, padding: "24px 20px", textAlign: "center", border: "2px solid #9ae6b4", marginBottom: 16 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#276749", marginBottom: 4 }}>Presupuesto firmado</div>
            <div style={{ fontSize: 13, color: "#4a5568" }}>Gracias, {firmaNome}. La empresa ha sido notificada.</div>
          </div>
        ) : (
          <div style={{ background: "white", borderRadius: 14, padding: "20px 16px", boxShadow: "0 1px 6px rgba(0,0,0,.06)", marginBottom: 16 }}>
            {!showFirma ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1a365d", marginBottom: 6 }}>¿Deseas aceptar este presupuesto?</div>
                <div style={{ fontSize: 12, color: "#718096", marginBottom: 14 }}>Al firmar, aceptas las condiciones y montos detallados arriba.</div>
                <button onClick={() => setShowFirma(true)}
                  style={{ padding: "14px 32px", background: "linear-gradient(135deg,#276749,#38a169)", color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: 15 }}>
                  ✍️ Firmar y aceptar
                </button>
              </div>
            ) : (
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d", marginBottom: 12 }}>✍️ Firma digital</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#4a5568", display: "block", marginBottom: 3 }}>Nombre completo *</label>
                    <input value={firmaNome} onChange={e => setFirmaNome(e.target.value)} placeholder="Ej: Juan Pérez López" autoFocus
                      style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#4a5568", display: "block", marginBottom: 3 }}>RUT (opcional)</label>
                    <input value={firmaRut} onChange={e => setFirmaRut(e.target.value)} placeholder="12.345.678-9"
                      style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, boxSizing: "border-box" }} />
                  </div>
                </div>
                <button onClick={handleFirma} disabled={firmando || !firmaNome.trim()}
                  style={{
                    width: "100%", padding: "14px",
                    background: firmaNome.trim() ? "linear-gradient(135deg,#276749,#38a169)" : "#e2e8f0",
                    color: firmaNome.trim() ? "white" : "#a0aec0",
                    border: "none", borderRadius: 10, cursor: firmaNome.trim() ? "pointer" : "default", fontWeight: 800, fontSize: 15,
                  }}>
                  {firmando ? "⏳ Firmando..." : "✅ Confirmar firma"}
                </button>
                <button onClick={() => setShowFirma(false)}
                  style={{ width: "100%", padding: "10px", marginTop: 8, background: "none", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", color: "#718096", fontSize: 13 }}>
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "20px 0 32px", color: "#a0aec0", fontSize: 11, lineHeight: 1.7 }}>
          <img src={LOGO_URL} alt="ON" style={{ height: 24, marginBottom: 8 }} onError={e => e.target.style.display = "none"} />
          <div style={{ fontWeight: 700, color: "#718096" }}>{wsName}</div>
          <div>RUT {EMPRESA.rut} · {EMPRESA.giro}</div>
          <div>{EMPRESA.direccion}, {EMPRESA.ciudad}</div>
          <div>📞 {EMPRESA.telefono} · ✉ {EMPRESA.email}</div>
        </div>
      </main>
    </div>
  );
}
