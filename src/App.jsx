// ─── App.jsx ─────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { onAuthStateChanged, signOut }      from "firebase/auth";
import { auth }                             from "./lib/firebase";
import { useProyecto }                      from "./hooks/useProyecto";
import { useFirestore }                     from "./hooks/useFirestore";
import { useWorkspace }                     from "./hooks/useWorkspace";
import { useMagazzino }                     from "./hooks/useMagazzino";
import { useFirma }                         from "./hooks/useFirma";
import { useFatture }                       from "./hooks/useFatture";
import { TabFatture }                       from "./components/tabs/TabFatture";
import TabMercado                           from "./components/tabs/TabMercado";
import PaginaFirma                          from "./components/FirmaPage";
import T                                    from "./i18n/translations";
import { calcTotals, exportCSV }            from "./utils/helpers";
import {
  LOGO_URL, ESTADOS, ESTADO_COLORS, ESTADO_BG,
  PRINT_STYLE, CAT_COLORS, DEFAULT_CATS
}                                           from "./utils/constants";
import { Toast, LoginScreen, ModalListino } from "./components/UI";
import WorkspaceScreen                      from "./components/WorkspaceScreen";
import TabSettings                          from "./components/tabs/TabSettings";
import TabMagazzino                         from "./components/tabs/TabMagazzino";
import TabDashboard                         from "./components/tabs/TabDashboard";
import TabCostos                            from "./components/tabs/TabCostos";
import TabProyecto                          from "./components/tabs/TabProyecto";
import {
  TabResumen, TabVistaCliente, TabProyectos,
  TabListino, TabStorico, TabHelp,
}                                           from "./components/tabs/OtherTabs";

// ─── Modal Fotos ──────────────────────────────────────────────────────────────
const ModalFotos = ({ fotos, setFotos, fotosMap, t, onClose }) => {
  const [galeriaModo, setGaleriaModo] = useState(false);
  const [fotosSort,   setFotosSort]   = useState("date");
  const sortedFotos = [...fotos].sort((a, b) =>
    fotosSort === "name" ? a.nombre.localeCompare(b.nombre) : new Date(b.fecha) - new Date(a.fecha)
  );
  const todasFotos = Object.values(fotosMap).flat();
  const agregarFoto = (e) => {
    Array.from(e.target.files).forEach(file => {
      const r = new FileReader();
      r.onload = ev => setFotos(fs => [...fs, { id: Date.now() + Math.random(), nombre: file.name, data: ev.target.result, fecha: new Date().toISOString(), descripcion: "", enPDF: true }]);
      r.readAsDataURL(file);
    });
  };
  return (
    <div role="dialog" aria-modal="true" onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
      <div style={{ background: "white", borderRadius: 16, padding: 20, width: "100%", maxWidth: 820, maxHeight: "93vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.35)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#1a365d" }}>📸 {t.fotosTitulo}</div>
          <button onClick={onClose} style={{ background: "#2d3748", border: "none", borderRadius: 8, cursor: "pointer", padding: "5px 12px", color: "white", fontWeight: 700 }}>✕</button>
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 12, background: "#f0f4f8", borderRadius: 10, padding: 4 }}>
          {[[false, "📂 Proyecto actual"], [true, "🖼️ Galería global"]].map(([val, lbl]) => (
            <button key={String(val)} onClick={() => setGaleriaModo(val)}
              style={{ flex: 1, padding: "7px 0", borderRadius: 7, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, background: galeriaModo === val ? "#2b6cb0" : "transparent", color: galeriaModo === val ? "white" : "#718096" }}>
              {lbl}
            </button>
          ))}
        </div>
        {!galeriaModo && <>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", background: "#2b6cb0", color: "white", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
              {t.fotosAgregar}<input type="file" accept="image/*" multiple onChange={agregarFoto} style={{ display: "none" }} />
            </label>
            <div style={{ display: "flex", gap: 3, background: "#f0f4f8", borderRadius: 8, padding: 3 }}>
              {[["date","📅"],["name","🔤"]].map(([v,l]) => (
                <button key={v} onClick={() => setFotosSort(v)} style={{ padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: fotosSort===v?"#2b6cb0":"transparent", color: fotosSort===v?"white":"#718096" }}>{l}</button>
              ))}
            </div>
          </div>
          {sortedFotos.length === 0
            ? <div style={{ textAlign: "center", padding: "40px 0", color: "#a0aec0" }}><div style={{ fontSize: 36 }}>📷</div><div style={{ marginTop: 8 }}>{t.fotosSinFotos}</div></div>
            : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10 }}>
                {sortedFotos.map(f => (
                  <div key={f.id} style={{ borderRadius: 10, overflow: "hidden", border: `2px solid ${f.enPDF?"#68d391":"#e2e8f0"}` }}>
                    <div style={{ position: "relative" }}>
                      <img src={f.data} alt={f.nombre} style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
                      <button onClick={() => setFotos(fs => fs.map(x => x.id===f.id ? {...x,enPDF:!x.enPDF} : x))}
                        style={{ position: "absolute", top: 5, right: 5, background: f.enPDF?"#276749":"rgba(0,0,0,.5)", border: "none", borderRadius: 99, cursor: "pointer", color: "white", fontWeight: 700, fontSize: 10, padding: "2px 7px" }}>
                        {f.enPDF?"📄":"⭕"}
                      </button>
                    </div>
                    <div style={{ padding: "7px 9px", background: "white" }}>
                      <div style={{ fontSize: 10, color: "#718096", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.nombre}</div>
                      <input value={f.descripcion||""} placeholder="Descripción..." onChange={e => setFotos(fs => fs.map(x => x.id===f.id ? {...x,descripcion:e.target.value} : x))}
                        style={{ width: "100%", padding: "4px 7px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 11, marginBottom: 5, color: "#1a365d" }} />
                      <button onClick={() => setFotos(fs => fs.filter(x => x.id!==f.id))}
                        style={{ width: "100%", background: "#fff5f5", border: "1px solid #fed7d7", borderRadius: 6, cursor: "pointer", color: "#c53030", fontWeight: 600, padding: "3px", fontSize: 11 }}>
                        🗑️ {t.fotosEliminar}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
          }
        </>}
        {galeriaModo && (
          <div>
            <div style={{ fontSize: 13, color: "#718096", marginBottom: 10 }}>Todas las fotos — {todasFotos.length} en total.</div>
            {todasFotos.length === 0
              ? <div style={{ textAlign: "center", padding: "40px 0", color: "#a0aec0" }}><div style={{ fontSize: 36 }}>🖼️</div><div style={{ marginTop: 8 }}>Sin fotos</div></div>
              : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 8 }}>
                  {todasFotos.map((f,i) => (
                    <div key={i} style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #e2e8f0", cursor: "pointer" }}
                      onClick={() => { if(!fotos.find(x=>x.data===f.data)){setFotos(fs=>[...fs,{...f,id:Date.now()+Math.random(),enPDF:false}]);setGaleriaModo(false);} }}>
                      <img src={f.data} alt="" style={{ width: "100%", height: 100, objectFit: "cover", display: "block" }} />
                      {f.descripcion && <div style={{ padding: "3px 6px", fontSize: 9, color: "#4a5568", background: "#f7fafc" }}>{f.descripcion}</div>}
                      <div style={{ padding: "3px 6px", fontSize: 9, color: "#2b6cb0", background: "#ebf8ff", fontWeight: 600 }}>+ Agregar</div>
                    </div>
                  ))}
                </div>
            }
          </div>
        )}
      </div>
    </div>
  );
};

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [user,           setUser]           = useState(null);
  const [authReady,      setAuthReady]      = useState(false);
  const [lang,           setLang]           = useState("es");
  const [pendingInvites, setPendingInvites] = useState([]);
  const t = T[lang] || T.es;

  const [tab,            setTab]            = useState(0);
  const [toast,          setToast]          = useState("");
  const [showFotos,      setShowFotos]      = useState(false);
  const [showEmailNotif, setShowEmailNotif] = useState(false);
  const [showAddListino, setShowAddListino] = useState(false);
  const [newCatName,     setNewCatName]     = useState("");

  const showToast = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); }, []);

  const {
    workspace, workspaces, members, myRole, loadingWS,
    loadWorkspaces, selectWorkspace, createWorkspace,
    inviteMember, loadPendingInvites, acceptInvite, rejectInvite,
    changeMemberRole, removeMember, updateWorkspaceName, can,
  } = useWorkspace({ onToast: showToast });

  const {
    proyectos, listino, fotosMap, cats, guardando,
    loadProyectos, saveProyecto, newProyecto, deleteProyecto,
    loadListino, saveListinoItem, deleteListinoItem, loadCats, addCat,
  } = useFirestore({ onToast: showToast, workspaceId: workspace?.id });

  const {
    items: magItems, movimenti, itemsInAlert, loading: magLoading,
    loadMagazzino, loadMovimenti,
    saveItem: saveMagItem, deleteItem: deleteMagItem,
    registraMovimento,
  } = useMagazzino({ workspaceId: workspace?.id, onToast: showToast });

  const {
    state: proy, loadProject, setInfo, setPct, setEstado, setIva, setValidez,
    setCondPago, setCondPagoPersonalizado, setCuotas, setFotos,
    setCatVisKey, getCatVis, addPartida, addFromListino, updP, delP, dispatch,
  } = useProyecto();

  const {
    firme, loading: firmaLoading,
    creaLinkFirma, loadFirme, copiaLink,
  } = useFirma({ workspaceId: workspace?.id || null, onToast: showToast });

  const {
    fatture, loadFatture, creaFattura, togglePagata, eliminaFattura,
  } = useFatture({ workspaceId: workspace?.id, onToast: showToast });

  // ── Routing firma pubblica (senza login) ──────────────────────────────────
  const firmaToken = useMemo(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/firma\/([a-f0-9]+)$/);
    return match ? match[1] : null;
  }, []);

  const saveTimer = useRef(null);

  useEffect(() => onAuthStateChanged(auth, u => { setUser(u); setAuthReady(true); }), []);

  useEffect(() => {
    if (!user) return;
    window.__currentUid = user.uid;
    Promise.all([loadWorkspaces(), loadPendingInvites()]).then(([wsList, invites]) => {
      setPendingInvites(invites || []);
      if (wsList?.length === 1 && (!invites || invites.length === 0)) selectWorkspace(wsList[0]);
    });
  }, [user]); // eslint-disable-line

  useEffect(() => {
    if (!workspace) return;
    Promise.all([loadProyectos(), loadListino(), loadCats(), loadMagazzino(), loadMovimenti(), loadFatture()]).then(([list]) => {
      if (list?.length > 0 && !proy.currentId) loadProject(list[0]);
    });
  }, [workspace?.id]); // eslint-disable-line

  useEffect(() => {
    if (!user || !proy.currentId || !workspace) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveProyecto(proy.currentId, proy, false), 900);
    return () => clearTimeout(saveTimer.current);
  }, [proy]); // eslint-disable-line

  const handleNewProject    = async () => { const id = await newProyecto(); if (id) { dispatch({ type: "NEW_PROJECT", payload: id }); setTab(1); } };
  const handleSaveManual    = () => saveProyecto(proy.currentId, proy, true);
  const handleOpenProject   = (p) => { loadProject(p); setTab(1); };
  const handleOpenPDF       = (p) => { loadProject(p); setTab(4); };
  const handleDeleteProject = async (id) => { const d = await deleteProyecto(id); if (d && id === proy.currentId) dispatch({ type: "NEW_PROJECT", payload: null }); };
  const handleAddFromListino = (item) => { addFromListino(item); setTab(2); };
  const handleInviaFirma = async () => {
    if (!proy.currentId) { showToast("❌ Nessun progetto aperto"); return; }
    const result = await creaLinkFirma(proy.currentId, proy.info);
    if (result) {
      // Salva anche in tokens_firma per accesso pubblico
      const { doc: fbDoc, setDoc: fbSet } = await import("firebase/firestore");
      const { db: fbDb } = await import("./lib/firebase");
      await fbSet(fbDoc(fbDb, "tokens_firma", result.token), {
        workspaceId: workspace.id,
        proyectoId:  proy.currentId,
        creadoAt:    new Date().toISOString(),
      });
      copiaLink(result.url);
    }
  };

  const handleAcceptInvite = async (invite) => {
    const ok = await acceptInvite(invite);
    if (ok) {
      setPendingInvites(p => p.filter(x => x.id !== invite.id));
      const wsList = await loadWorkspaces();
      const joined = wsList.find(w => w.id === invite.workspaceId);
      if (joined) selectWorkspace(joined);
    }
  };
  const handleRejectInvite = async (inviteId) => { await rejectInvite(inviteId); setPendingInvites(p => p.filter(x => x.id !== inviteId)); };
  const handleSelectWorkspace = async (ws) => { await selectWorkspace(ws); setTab(0); };

  const totals = useMemo(() => calcTotals(proy.partidas, proy.pct), [proy.partidas, proy.pct]);
  const TABS_DEF = useMemo(() => [
    { icon: "🏠", label: t.dashboard },
    { icon: "📋", label: t.proyecto },
    { icon: "🏗️", label: t.costos },
    { icon: "📊", label: t.resumen },
    { icon: "🖨️", label: t.vistaCliente },
    { icon: "💾", label: t.proyectos },
    { icon: "📦", label: t.listino },
    { icon: "🏭", label: "Magazzino" },
    { icon: "🧾", label: "Fatture" },
    { icon: "📈", label: t.storico },
    { icon: "🛒", label: "MercadoLibre" },
    { icon: "⚙️", label: "Impostazioni" },
    { icon: "❓", label: t.tabHelp },
  ], [t]);

  // ── Pagina pubblica firma (accessibile senza login) ──────────────────────
  if (firmaToken) return <PaginaFirma token={firmaToken} />;

  if (!authReady) return <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#1a365d",color:"white",fontSize:18 }}>Cargando...</div>;
  if (!user) return <LoginScreen onLogin={u => setUser(u)} />;
  if (!workspace) return (
    <WorkspaceScreen
      workspaces={workspaces} pendingInvites={pendingInvites}
      onSelect={handleSelectWorkspace} onCreate={createWorkspace}
      onAcceptInvite={handleAcceptInvite} onRejectInvite={handleRejectInvite}
      userEmail={user.email}
    />
  );

  return (
    <div style={{ fontFamily:"'Segoe UI',system-ui,sans-serif", background:"#f0f4f8", minHeight:"100vh" }}>
      <style>{PRINT_STYLE + `* { box-sizing:border-box; } input,select,textarea { color:#1a365d !important; } input::placeholder { color:#a0aec0 !important; }`}</style>
      <Toast msg={toast} />
      {showAddListino && <ModalListino onSave={saveListinoItem} onClose={() => setShowAddListino(false)} t={t} cats={cats} />}
      {showFotos && <ModalFotos fotos={proy.fotos} setFotos={setFotos} fotosMap={fotosMap} t={t} onClose={() => setShowFotos(false)} />}
      {showEmailNotif && (
        <div role="dialog" aria-modal="true" onClick={e => e.target===e.currentTarget&&setShowEmailNotif(false)}
          style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.65)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
          <div style={{ background:"white",borderRadius:16,padding:28,width:"100%",maxWidth:440,boxShadow:"0 20px 60px rgba(0,0,0,.35)" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18 }}>
              <div style={{ fontSize:16,fontWeight:700,color:"#1a365d" }}>🔔 {t.notifTitulo}</div>
              <button onClick={() => setShowEmailNotif(false)} style={{ background:"#2d3748",border:"none",borderRadius:8,cursor:"pointer",padding:"5px 12px",color:"white",fontWeight:700 }}>✕</button>
            </div>
            {[t.notifCambioEstado, t.notifVencimiento, t.notifAceptado].map(l => (
              <label key={l} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#f7fafc",borderRadius:10,cursor:"pointer",marginBottom:8,border:"1px solid #e2e8f0" }}>
                <input type="checkbox" defaultChecked style={{ width:15,height:15 }}/><span style={{ fontSize:13,color:"#2d3748" }}>{l}</span>
              </label>
            ))}
            <button onClick={() => { showToast("✅ "+t.notifGuardar); setShowEmailNotif(false); }}
              style={{ width:"100%",padding:10,background:"#1a365d",color:"white",border:"none",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:13,marginTop:8 }}>
              💾 {t.notifGuardar}
            </button>
          </div>
        </div>
      )}

      <header className="no-print" style={{ background:"linear-gradient(135deg,#1a365d,#2d3748)",padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 2px 12px rgba(0,0,0,.3)",gap:8,flexWrap:"wrap" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <img src={LOGO_URL} alt="Obra Nova" style={{ height:34 }} onError={e=>{e.target.style.display="none";}} />
          <div>
            <div style={{ color:"white",fontWeight:800,fontSize:15,letterSpacing:.3 }}>{workspace.name}</div>
            <div style={{ color:"#a0aec0",fontSize:10 }} aria-live="polite">
              {guardando ? t.guardando : t.guardado}
              {" · "}
              <span style={{ cursor:"pointer",textDecoration:"underline" }} onClick={() => handleSelectWorkspace(null)}>cambia azienda</span>
            </div>
          </div>
        </div>
        <div style={{ display:"flex",gap:5,flexWrap:"wrap",alignItems:"center" }}>
          {can("create_project") && <button onClick={handleNewProject} style={{ padding:"6px 11px",background:"#276749",color:"white",border:"none",borderRadius:7,cursor:"pointer",fontWeight:600,fontSize:12 }}>{t.nuevo}</button>}
          <button onClick={handleSaveManual} style={{ padding:"6px 11px",background:"#2b6cb0",color:"white",border:"none",borderRadius:7,cursor:"pointer",fontWeight:600,fontSize:12 }}>{t.guardar}</button>
          <button onClick={() => setShowFotos(true)} style={{ padding:"6px 11px",background:"#744210",color:"white",border:"none",borderRadius:7,cursor:"pointer",fontWeight:600,fontSize:12,display:"flex",alignItems:"center",gap:4 }}>
            {t.fotos}{proy.fotos.length>0&&<span style={{ background:"#f5a800",color:"#1a1a1a",borderRadius:99,fontSize:9,padding:"1px 5px",fontWeight:700 }}>{proy.fotos.length}</span>}
          </button>
          <button onClick={() => window.print()} style={{ padding:"6px 11px",background:"#4a5568",color:"white",border:"none",borderRadius:7,cursor:"pointer",fontWeight:600,fontSize:12 }}>{t.imprimir}</button>
          <button onClick={() => exportCSV(proy.info,proy.partidas,proy.pct,totals)} style={{ padding:"6px 11px",background:"#276749",color:"white",border:"none",borderRadius:7,cursor:"pointer",fontWeight:600,fontSize:12 }}>{t.exportExcel}</button>
          <button onClick={() => setShowEmailNotif(true)} style={{ padding:"6px 11px",background:"#c05621",color:"white",border:"none",borderRadius:7,cursor:"pointer",fontWeight:600,fontSize:12 }}>{t.notifEmail}</button>
          <select value={lang} onChange={e=>setLang(e.target.value)} style={{ padding:"6px 9px",borderRadius:7,border:"1px solid rgba(255,255,255,.3)",background:"rgba(255,255,255,.12)",color:"white",cursor:"pointer",fontSize:11,fontWeight:600 }}>
            <option value="es" style={{ color:"#1a365d",background:"white" }}>🇨🇱 ES</option>
            <option value="en" style={{ color:"#1a365d",background:"white" }}>🇬🇧 EN</option>
            <option value="it" style={{ color:"#1a365d",background:"white" }}>🇮🇹 IT</option>
            <option value="pt" style={{ color:"#1a365d",background:"white" }}>🇧🇷 PT</option>
            <option value="de" style={{ color:"#1a365d",background:"white" }}>🇩🇪 DE</option>
          </select>
          <button onClick={() => signOut(auth).then(() => setUser(null))} style={{ padding:"6px 9px",background:"rgba(255,255,255,.08)",color:"#a0aec0",border:"1px solid rgba(255,255,255,.15)",borderRadius:7,cursor:"pointer",fontSize:11 }}>{t.cerrarSesion}</button>
        </div>
      </header>

      <div className="no-print" style={{ background:"white",padding:"7px 14px",display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",borderBottom:"1px solid #e2e8f0" }}>
        <span style={{ fontSize:12,color:"#4a5568",fontWeight:700 }}>{t.estado}:</span>
        {ESTADOS.map(e => (
          <button key={e} onClick={() => setEstado(e)}
            style={{ padding:"4px 13px",borderRadius:99,cursor:"pointer",fontSize:12,transition:"all .2s", border:`2px solid ${proy.estado===e?ESTADO_COLORS[e]:"#e2e8f0"}`, background:proy.estado===e?ESTADO_BG[e]:"white", color:proy.estado===e?ESTADO_COLORS[e]:"#718096", fontWeight:proy.estado===e?700:400 }}>
            {t[e.toLowerCase()]||e}
          </button>
        ))}
        <span style={{ marginLeft:"auto",fontSize:12,color:"#4a5568" }}>
          {proy.info.cliente&&<><span>👤</span> <strong style={{ color:"#1a365d" }}>{proy.info.cliente}</strong></>}
          {proy.info.descripcion&&<> · <span style={{ color:"#718096" }}>{proy.info.descripcion.slice(0,35)}</span></>}
        </span>
      </div>

      <nav className="no-print" style={{ background:"white",borderBottom:"2px solid #e2e8f0",display:"flex",overflowX:"auto",WebkitOverflowScrolling:"touch" }}>
        {TABS_DEF.map((tb,i) => (
          <button key={i} onClick={() => setTab(i)} aria-selected={tab===i} role="tab"
            style={{ padding:"10px 12px",border:"none",borderBottom:`3px solid ${tab===i?"#2b6cb0":"transparent"}`,background:"white",color:tab===i?"#2b6cb0":"#718096",cursor:"pointer",fontSize:12,fontWeight:tab===i?700:500,whiteSpace:"nowrap",transition:"all .2s",flexShrink:0 }}>
            <span style={{ marginRight:4 }}>{tb.icon}</span><span>{tb.label}</span>
          </button>
        ))}
      </nav>

      <main style={{ padding:14,maxWidth:1200,margin:"0 auto" }}>
        {tab===0 && <TabDashboard proyectos={proyectos} partidas={proy.partidas} cats={cats} t={t} onOpenProject={handleOpenProject} onNewProject={handleNewProject} />}
        {tab===1 && <TabProyecto info={proy.info} setInfo={setInfo} pct={proy.pct} setPct={setPct} estado={proy.estado} setEstado={setEstado} iva={proy.iva} setIva={setIva} validez={proy.validez} setValidez={setValidez} condPago={proy.condPago} setCondPago={setCondPago} condPagoPersonalizado={proy.condPagoPersonalizado} setCondPagoPersonalizado={setCondPagoPersonalizado} cuotas={proy.cuotas} setCuotas={setCuotas} t={t} />}
        {tab===2 && <TabCostos partidas={proy.partidas} cats={cats} addPartida={addPartida} updP={updP} delP={delP} addFromListino={handleAddFromListino} listino={listino} t={t} workspaceId={workspace?.id} lang={lang} />}
        {tab===3 && <TabResumen partidas={proy.partidas} pct={proy.pct} cats={cats} iva={proy.iva} t={t} />}
        {tab===4 && <TabVistaCliente info={proy.info} partidas={proy.partidas} pct={proy.pct} cats={cats} catVis={proy.catVis} getCatVis={getCatVis} setCatVisKey={setCatVisKey} iva={proy.iva} estado={proy.estado} currentId={proy.currentId} validez={proy.validez} t={t} onInviaFirma={handleInviaFirma} firme={firme} />}
        {tab===5 && <TabProyectos proyectos={proyectos} currentId={proy.currentId} onLoad={handleOpenProject} onDelete={handleDeleteProject} onPDF={handleOpenPDF} t={t} />}
        {tab===6 && <TabListino listino={listino} cats={cats} catColors={CAT_COLORS} newCatName={newCatName} setNewCatName={setNewCatName} onAddCat={() => { addCat(newCatName,t); setNewCatName(""); }} onDeleteItem={deleteListinoItem} onAddFromListino={handleAddFromListino} onOpenAddModal={() => setShowAddListino(true)} DEFAULT_CATS={DEFAULT_CATS} t={t} />}
        {tab===7 && <TabMagazzino items={magItems} movimenti={movimenti} itemsInAlert={itemsInAlert} loading={magLoading} cats={cats} proyectos={proyectos} onSaveItem={saveMagItem} onDeleteItem={deleteMagItem} onMovimento={registraMovimento} />}
        {tab===8 && <TabFatture proyectos={proyectos} fatture={fatture} onCreaFattura={creaFattura} onTogglePagata={togglePagata} onEliminaFattura={eliminaFattura} />}
        {tab===9 && <TabStorico proyectos={proyectos} t={t} />}
        {tab===10 && <TabMercado workspaceId={workspace?.id} lang={lang} onToast={showToast} />}
        {tab===11 && <TabSettings workspace={workspace} members={members} myRole={myRole} can={can} onInvite={(email,role) => inviteMember(email,role,workspace.id)} onChangeRole={changeMemberRole} onRemoveMember={removeMember} onUpdateName={updateWorkspaceName} />}
        {tab===12 && <TabHelp t={t} />}
      </main>
    </div>
  );
}
