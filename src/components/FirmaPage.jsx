// ─── components/PaginaFirma.jsx ──────────────────────────────────────────────
// Pagina pubblica di firma — accessibile senza login tramite token univoco.
// Il cliente vede il preventivo, può firmare con dito/mouse e accettare o rifiutare.

import { useState, useEffect, useRef, useCallback } from "react";
import { doc, getDoc, updateDoc, query, collectionGroup, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { LOGO_URL } from "../utils/logo";
import { fmt } from "../utils/helpers";

const EMPRESA = {
  nombre: "Obra Nova SPA", rut: "78.301.823-3",
  direccion: "Humedal los Panules 2209", ciudad: "Coquimbo",
  telefono: "9-42981608", email: "obranovaspa@gmail.com",
};

// ─── Canvas firma ─────────────────────────────────────────────────────────────
const CanvasFirma = ({ onFirma }) => {
  const canvasRef  = useRef(null);
  const drawing    = useRef(false);
  const lastPos    = useRef(null);
  const [hasFirma, setHasFirma] = useState(false);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top)  * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    };
  };

  const startDraw = (e) => {
    e.preventDefault();
    drawing.current = true;
    lastPos.current = getPos(e, canvasRef.current);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    const pos    = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1a365d";
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = "round";
    ctx.lineJoin    = "round";
    ctx.stroke();
    lastPos.current = pos;
    setHasFirma(true);
  };

  const stopDraw = () => { drawing.current = false; };

  const cancella = () => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasFirma(false);
    onFirma(null);
  };

  const conferma = () => {
    if (!hasFirma) return;
    const canvas = canvasRef.current;
    onFirma(canvas.toDataURL("image/png"));
  };

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 12, color: "#718096", marginBottom: 8 }}>
        Firma qui sotto con il dito o il mouse
      </div>
      <canvas
        ref={canvasRef}
        width={500} height={160}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
        style={{
          border: "2px dashed #2b6cb0", borderRadius: 10, cursor: "crosshair",
          background: "#f7fafc", width: "100%", maxWidth: 500, touchAction: "none",
          display: "block", margin: "0 auto",
        }}
      />
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 10 }}>
        <button onClick={cancella} style={{ padding: "8px 18px", background: "#f7fafc", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", color: "#718096", fontWeight: 600, fontSize: 13 }}>
          🗑️ Cancella
        </button>
        <button onClick={conferma} disabled={!hasFirma}
          style={{ padding: "8px 20px", background: hasFirma ? "#276749" : "#e2e8f0", border: "none", borderRadius: 8, cursor: hasFirma ? "pointer" : "default", color: hasFirma ? "white" : "#a0aec0", fontWeight: 700, fontSize: 13 }}>
          ✅ Usa questa firma
        </button>
      </div>
    </div>
  );
};

// ─── Pagina principale ────────────────────────────────────────────────────────
export default function PaginaFirma({ token }) {
  const [firma,      setFirma]      = useState(null);
  const [proyecto,   setProyecto]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [errore,     setErrore]     = useState(null);
  const [step,       setStep]       = useState("preview"); // preview | firma | rifiuto | successo | rifiutato
  const [nome,       setNome]       = useState("");
  const [firmaImg,   setFirmaImg]   = useState(null);
  const [motivo,     setMotivo]     = useState("");
  const [saving,     setSaving]     = useState(false);

  // Carica dati tramite token
  useEffect(() => {
    if (!token) { setErrore("Token non valido"); setLoading(false); return; }
    const load = async () => {
      try {
        // FIX 1.5/2.9: cerca il token con collectionGroup('firme') — tokens_firma non esiste
        const q = query(collectionGroup(db, "firme"), where("token", "==", token));
        const snap = await getDocs(q);
        if (snap.empty) { setErrore("Link non trovato o scaduto"); setLoading(false); return; }

        const firmaDoc  = snap.docs[0];
        const firmaData = { id: firmaDoc.id, ...firmaDoc.data() };
        const { workspaceId, proyectoId } = firmaData;

        // Controlla scadenza
        if (firmaData.scadenzaAt && new Date(firmaData.scadenzaAt) < new Date()) {
          setErrore("Questo link è scaduto. Contatta l'azienda per riceverne uno nuovo.");
          setLoading(false); return;
        }

        // Controlla stato
        if (firmaData.stato === "firmato") {
          setFirma(firmaData); setStep("successo"); setLoading(false); return;
        }
        if (firmaData.stato === "rifiutato") {
          setFirma(firmaData); setStep("rifiutato"); setLoading(false); return;
        }

        // Usa snapshot salvato nel documento firma (non richiede auth)
        // Fallback: tenta lettura diretta proyectos (per firme vecchie senza snapshot)
        if (firmaData.proyectoSnapshot) {
          setFirma(firmaData);
          setProyecto({ id: proyectoId, ...firmaData.proyectoSnapshot });
          setLoading(false);
          return;
        }

        // Fallback per firme create prima di questo fix
        try {
          const proyRef  = doc(db, `workspaces/${workspaceId}/proyectos/${proyectoId}`);
          const proySnap = await getDoc(proyRef);
          setFirma(firmaData);
          setProyecto(proySnap.exists() ? { id: proySnap.id, ...proySnap.data() } : null);
        } catch {
          // Se le rules bloccano (utente non autenticato), usa solo i dati della firma
          setFirma(firmaData);
          setProyecto(null);
        }
        setLoading(false);
      } catch (e) {
        console.error(e);
        setErrore("Errore nel caricamento: " + e.message);
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const handleFirma = async () => {
    if (!nome.trim()) { alert("Inserisci il tuo nome completo"); return; }
    if (!firmaImg)    { alert("Aggiungi la tua firma"); return; }
    setSaving(true);
    try {
      const { workspaceId, proyectoId } = firma;
      await updateDoc(doc(db, `workspaces/${workspaceId}/firme/${token}`), {
        stato: "firmato", firmaNome: nome.trim(),
        firmaImmagine: firmaImg, firmaData: new Date().toISOString(),
      });
      await updateDoc(doc(db, `workspaces/${workspaceId}/proyectos/${proyectoId}`), {
        estado: "Aceptado", updatedAt: new Date().toISOString(),
      });
      setStep("successo");
    } catch (e) { alert("Errore: " + e.message); }
    setSaving(false);
  };

  const handleRifiuto = async () => {
    setSaving(true);
    try {
      const { workspaceId, proyectoId } = firma;
      await updateDoc(doc(db, `workspaces/${workspaceId}/firme/${token}`), {
        stato: "rifiutato", rifiutoMotivo: motivo, firmaData: new Date().toISOString(),
      });
      await updateDoc(doc(db, `workspaces/${workspaceId}/proyectos/${proyectoId}`), {
        estado: "Rechazado", updatedAt: new Date().toISOString(),
      });
      setStep("rifiutato");
    } catch (e) { alert("Errore: " + e.message); }
    setSaving(false);
  };

  // ── Calcolo totali ────────────────────────────────────────────────────────
  const totals = (() => {
    if (!proyecto) return {};
    const { partidas = [], pct = {}, iva = false } = proyecto;
    const visibili = partidas.filter(p => p.visible !== false);
    const subtotal = visibili.reduce((s, p) => s + (p.cantidad * p.pUnit * (1 + (parseFloat(p.pct) || 0) / 100)), 0);
    const utilidad = subtotal * (parseFloat(pct.utilidad) || 0) / 100;
    const gastos   = subtotal * (parseFloat(pct.gastos)   || 0) / 100;
    const imprevistos = subtotal * (parseFloat(pct.imprevistos) || 0) / 100;
    const neto     = subtotal + utilidad + gastos + imprevistos;
    const ivaAmt   = iva ? neto * 0.19 : 0;
    const total    = neto + ivaAmt;
    return { subtotal, utilidad, gastos, imprevistos, neto, ivaAmt, total };
  })();

  const containerStyle = {
    minHeight: "100vh", background: "#f0f4f8",
    fontFamily: "'Segoe UI',system-ui,sans-serif",
    padding: "16px",
  };
  const cardStyle = {
    background: "white", borderRadius: 16, padding: 20,
    maxWidth: 680, margin: "0 auto",
    boxShadow: "0 4px 20px rgba(0,0,0,.1)",
  };

  if (loading) return (
    <div style={{ ...containerStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "#4a5568" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Caricamento preventivo...</div>
      </div>
    </div>
  );

  if (errore) return (
    <div style={{ ...containerStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ ...cardStyle, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>❌</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#c53030", marginBottom: 8 }}>Link non valido</div>
        <div style={{ fontSize: 14, color: "#718096" }}>{errore}</div>
      </div>
    </div>
  );

  if (step === "successo") return (
    <div style={{ ...containerStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ ...cardStyle, textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#276749", marginBottom: 8 }}>Preventivo accettato!</div>
        <div style={{ fontSize: 14, color: "#718096", marginBottom: 16 }}>
          {firma?.firmaNome && <>Firmato da <strong>{firma.firmaNome}</strong><br /></>}
          {firma?.firmaData && <>il {new Date(firma.firmaData).toLocaleDateString("it-IT")}</>}
        </div>
        {firma?.firmaImmagine && (
          <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 10, display: "inline-block", marginBottom: 12 }}>
            <img src={firma.firmaImmagine} alt="Firma" style={{ maxWidth: 300, height: 80, objectFit: "contain" }} />
          </div>
        )}
        <div style={{ fontSize: 13, color: "#a0aec0" }}>Puoi chiudere questa pagina.</div>
      </div>
    </div>
  );

  if (step === "rifiutato") return (
    <div style={{ ...containerStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ ...cardStyle, textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>❌</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#c53030", marginBottom: 8 }}>Preventivo rifiutato</div>
        {firma?.rifiutoMotivo && <div style={{ fontSize: 14, color: "#718096", marginBottom: 8 }}>Motivo: {firma.rifiutoMotivo}</div>}
        <div style={{ fontSize: 13, color: "#a0aec0" }}>Puoi chiudere questa pagina.</div>
      </div>
    </div>
  );

  const info = proyecto?.info || {};
  const partidas = (proyecto?.partidas || []).filter(p => p.visible !== false);

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>

        {/* Header azienda */}
        <div style={{ background: "linear-gradient(135deg,#1a365d,#2d3748)", borderRadius: 16, padding: "18px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
          <img src={LOGO_URL} alt="Logo" style={{ height: 44 }} onError={e => { e.target.style.display = "none"; }} />
          <div>
            <div style={{ color: "white", fontWeight: 800, fontSize: 18 }}>{EMPRESA.nombre}</div>
            <div style={{ color: "#a0aec0", fontSize: 12 }}>{EMPRESA.ciudad} · {EMPRESA.telefono}</div>
          </div>
        </div>

        {/* Dati preventivo */}
        <div style={{ ...cardStyle, marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#1a365d", marginBottom: 12, borderBottom: "2px solid #ebf8ff", paddingBottom: 8 }}>
            📋 Preventivo
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }}>
            {[
              ["Cliente",       info.cliente],
              ["Descrizione",   info.descripcion],
              ["Indirizzo",     info.direccion],
              ["Data",          info.fecha],
              ["Inizio lavori", info.fechaInicio],
              ["Fine lavori",   info.fechaTerm],
            ].filter(([,v]) => v).map(([l,v]) => (
              <div key={l}>
                <div style={{ color: "#a0aec0", fontSize: 11, fontWeight: 600 }}>{l}</div>
                <div style={{ color: "#1a365d", fontWeight: 600 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Partidas */}
        {partidas.length > 0 && (
          <div style={{ ...cardStyle, marginBottom: 14, overflow: "auto" }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1a365d", marginBottom: 12 }}>Voci di preventivo</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 400 }}>
              <thead>
                <tr style={{ background: "#1a365d", color: "white" }}>
                  {["Descrizione", "Categoria", "Qty", "P.Unit.", "Totale"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {partidas.map((p, i) => {
                  const total = p.cantidad * p.pUnit * (1 + (parseFloat(p.pct) || 0) / 100);
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? "#f7fafc" : "white" }}>
                      <td style={{ padding: "8px 10px", color: "#1a365d", fontWeight: 600 }}>{p.nombre}</td>
                      <td style={{ padding: "8px 8px", color: "#718096" }}>{p.cat}</td>
                      <td style={{ padding: "8px 8px" }}>{p.cantidad} {p.unidad}</td>
                      <td style={{ padding: "8px 8px" }}>{fmt(p.pUnit)}</td>
                      <td style={{ padding: "8px 8px", fontWeight: 700, color: "#1a365d" }}>{fmt(total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* Totali */}
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-end" }}>
              {[
                ["Subtotale",     totals.subtotal, false],
                ["IVA (19%)",     totals.ivaAmt,   totals.ivaAmt > 0],
              ].filter(([,, show]) => show !== false || true).map(([l, v, show]) =>
                show !== false && v > 0 ? (
                  <div key={l} style={{ fontSize: 12, color: "#718096" }}>{l}: {fmt(v)}</div>
                ) : null
              )}
              <div style={{ fontSize: 18, fontWeight: 800, color: "#1a365d", borderTop: "2px solid #e2e8f0", paddingTop: 8, marginTop: 4 }}>
                TOTALE: {fmt(totals.total)}
              </div>
            </div>
          </div>
        )}

        {/* Condizioni pagamento */}
        {info.condPago && (
          <div style={{ ...cardStyle, marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d", marginBottom: 6 }}>💳 Condizioni di pagamento</div>
            <div style={{ fontSize: 13, color: "#4a5568" }}>{info.condPagoPersonalizado || info.condPago}</div>
          </div>
        )}

        {/* Step: preview → azioni */}
        {step === "preview" && (
          <div style={{ ...cardStyle, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1a365d", marginBottom: 14, textAlign: "center" }}>
              Come vuoi procedere?
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={() => setStep("firma")}
                style={{ padding: "16px 12px", background: "linear-gradient(135deg,#276749,#38a169)", color: "white", border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: 15, textAlign: "center" }}>
                ✅ Accetto e firmo
                <div style={{ fontSize: 11, fontWeight: 400, marginTop: 3, opacity: .85 }}>Approvo il preventivo</div>
              </button>
              <button onClick={() => setStep("rifiuto")}
                style={{ padding: "16px 12px", background: "#fff5f5", border: "2px solid #fed7d7", borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: 15, color: "#c53030", textAlign: "center" }}>
                ❌ Rifiuto
                <div style={{ fontSize: 11, fontWeight: 400, marginTop: 3, opacity: .85 }}>Non accetto questo preventivo</div>
              </button>
            </div>
          </div>
        )}

        {/* Step: firma */}
        {step === "firma" && (
          <div style={{ ...cardStyle, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1a365d", marginBottom: 14 }}>✍️ Firma il preventivo</div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: "#4a5568", fontWeight: 600, display: "block", marginBottom: 5 }}>Il tuo nome completo *</label>
              <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Es. Mario Rossi"
                style={{ width: "100%", padding: "11px 14px", border: "2px solid #e2e8f0", borderRadius: 9, fontSize: 14, color: "#1a365d", boxSizing: "border-box" }} />
            </div>
            <CanvasFirma onFirma={img => setFirmaImg(img)} />
            {firmaImg && (
              <div style={{ marginTop: 10, padding: 10, background: "#f0fff4", border: "1px solid #9ae6b4", borderRadius: 9, textAlign: "center" }}>
                <div style={{ fontSize: 12, color: "#276749", fontWeight: 600, marginBottom: 6 }}>✅ Firma acquisita</div>
                <img src={firmaImg} alt="firma" style={{ maxHeight: 60, maxWidth: "100%", objectFit: "contain" }} />
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={() => setStep("preview")} style={{ padding: "10px 18px", background: "#f7fafc", border: "1px solid #e2e8f0", borderRadius: 9, cursor: "pointer", color: "#718096", fontWeight: 600 }}>← Indietro</button>
              <button onClick={handleFirma} disabled={saving || !firmaImg || !nome.trim()}
                style={{ flex: 1, padding: "12px", background: (!firmaImg || !nome.trim()) ? "#e2e8f0" : "#276749", color: (!firmaImg || !nome.trim()) ? "#a0aec0" : "white", border: "none", borderRadius: 9, cursor: (!firmaImg || !nome.trim()) ? "default" : "pointer", fontWeight: 800, fontSize: 15 }}>
                {saving ? "Salvataggio..." : "✅ Conferma e firma"}
              </button>
            </div>
          </div>
        )}

        {/* Step: rifiuto */}
        {step === "rifiuto" && (
          <div style={{ ...cardStyle, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#c53030", marginBottom: 12 }}>❌ Rifiuto preventivo</div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: "#4a5568", fontWeight: 600, display: "block", marginBottom: 5 }}>Motivo del rifiuto (opzionale)</label>
              <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={3}
                placeholder="Es. Prezzo troppo alto, preferisco un altro fornitore..."
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 9, fontSize: 13, color: "#1a365d", resize: "vertical", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setStep("preview")} style={{ padding: "10px 18px", background: "#f7fafc", border: "1px solid #e2e8f0", borderRadius: 9, cursor: "pointer", color: "#718096", fontWeight: 600 }}>← Indietro</button>
              <button onClick={handleRifiuto} disabled={saving}
                style={{ flex: 1, padding: "11px", background: "#c53030", color: "white", border: "none", borderRadius: 9, cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
                {saving ? "Salvataggio..." : "Conferma rifiuto"}
              </button>
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", fontSize: 11, color: "#a0aec0", padding: "10px 0" }}>
          Powered by Obra Nova SPA · {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
