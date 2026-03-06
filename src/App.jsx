// ─── App.jsx ─────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from "react";
import { onAuthStateChanged, signOut }      from "firebase/auth";
import { auth }                             from "./lib/firebase";
import { useProyecto }                      from "./hooks/useProyecto";
import { useFirestore }                     from "./hooks/useFirestore";
import { useKits }                          from "./hooks/useKits";
import { useWorkspace }                     from "./hooks/useWorkspace";
import { useMagazzino }                     from "./hooks/useMagazzino";
import { useFirma }                         from "./hooks/useFirma";
import { useFatture }                       from "./hooks/useFatture";

import T                                    from "./i18n/translations";
import { calcTotals, exportCSV }            from "./utils/helpers";
import {
  LOGO_URL, ESTADOS, ESTADO_COLORS, ESTADO_BG,
  PRINT_STYLE, CAT_COLORS, DEFAULT_CATS
}                                           from "./utils/constants";
import { Toast, LoginScreen, ModalListino } from "./components/UI";
import WorkspaceScreen                      from "./components/WorkspaceScreen";
import ModalFotos                           from "./components/ModalFotos";
import ModalOnboarding                      from "./components/ModalOnboarding";
import RicercaGlobale                       from "./components/RicercaGlobale";
import ErrorBoundary                        from "./components/ErrorBoundary";

// ── WhatsApp inline (zero dipendenze esterne) ─────────────────────────────────
const WA_ESTADOS = new Set(["Enviado","Aceptado","Rechazado","En obra","Finalizado"]);
const fmtCLP = n => n ? `$ ${Number(n).toLocaleString("es-CL",{maximumFractionDigits:0})}` : "";
const waLink = (telefono, estado, {cliente="",descripcion="",total=0,empresa="Obra Nova"}={}) => {
  const msgs = {
    "Enviado":    `Hola ${cliente},\n\nTe enviamos el presupuesto para *${descripcion||"tu proyecto"}* por *${fmtCLP(total)} CLP*.\n\nConsúltanos cualquier duda.\n\n_${empresa}_`,
    "Aceptado":   `Hola ${cliente},\n\n¡Gracias por aceptar el presupuesto de *${descripcion||"tu proyecto"}*! 🎉\n\nTotal: *${fmtCLP(total)} CLP*. Coordinamos el inicio.\n\n_${empresa}_`,
    "Rechazado":  `Hola ${cliente},\n\nEntendemos que el presupuesto de *${descripcion||"tu proyecto"}* no se ajustó. Quedamos disponibles.\n\n_${empresa}_`,
    "En obra":    `Hola ${cliente},\n\n¡Comenzamos los trabajos de *${descripcion||"tu proyecto"}*! 🏗️\n\nTe iremos informando del avance.\n\n_${empresa}_`,
    "Finalizado": `Hola ${cliente},\n\n¡Los trabajos de *${descripcion||"tu proyecto"}* están terminados! ✅\n\nTotal: *${fmtCLP(total)} CLP*. ¡Gracias!\n\n_${empresa}_`,
  };
  const msg = msgs[estado]; if (!msg) return null;
  const num = (telefono||"").replace(/[\s\-\+\(\)]/g,"");
  const norm = num ? (num.startsWith("56")?num:num.startsWith("9")?`56${num}`:`569${num}`) : "";
  return `https://wa.me/${norm}?text=${encodeURIComponent(msg)}`;
};

// ── Lazy loading tab (non caricati finché non servono) ────────────────────────
const TabFatture    = lazy(() => import("./components/tabs/TabFatture").then(m => ({ default: m.TabFatture })));
const TabSII        = lazy(() => import("./components/tabs/TabSII"));
const TabSettings   = lazy(() => import("./components/tabs/TabSettings"));
const TabPiani      = lazy(() => import("./components/tabs/TabPiani"));
const TabMagazzino  = lazy(() => import("./components/tabs/TabMagazzino"));
const TabDashboard  = lazy(() => import("./components/tabs/TabDashboard"));
const TabCostos     = lazy(() => import("./components/tabs/TabCostos"));
const TabProyecto   = lazy(() => import("./components/tabs/TabProyecto"));
const TabCalcolatore= lazy(() => import("./components/tabs/TabCalcolatore"));
const TabKitMateriali= lazy(() => import("./components/tabs/TabKitMateriali"));
const TabAgenda     = lazy(() => import("./components/tabs/TabAgenda"));
const PaginaFirma   = lazy(() => import("./components/FirmaPage"));

// ── OtherTabs — lazy con named export wrapper (fix: no await top-level) ───────
const TabResumen     = lazy(() => import("./components/tabs/OtherTabs").then(m => ({ default: m.TabResumen })));
const TabVistaCliente= lazy(() => import("./components/tabs/OtherTabs").then(m => ({ default: m.TabVistaCliente })));
const TabProyectos   = lazy(() => import("./components/tabs/OtherTabs").then(m => ({ default: m.TabProyectos })));
const TabListino     = lazy(() => import("./components/tabs/OtherTabs").then(m => ({ default: m.TabListino })));
const TabStorico     = lazy(() => import("./components/tabs/OtherTabs").then(m => ({ default: m.TabStorico })));
const TabHelp        = lazy(() => import("./components/tabs/OtherTabs").then(m => ({ default: m.TabHelp })));

// Fallback caricamento tab
const TabLoader = () => (
  <div style={{ display:"flex",alignItems:"center",justifyContent:"center",padding:"60px 0",color:"#a0aec0" }}>
    <div style={{ textAlign:"center" }}>
      <div style={{ fontSize:28,marginBottom:8,animation:"shimmer 1.2s infinite" }}>⏳</div>
      <div style={{ fontSize:12 }}>Cargando...</div>
    </div>
  </div>
);

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [user,           setUser]           = useState(null);
  const [authReady,      setAuthReady]      = useState(false);
  const [lang,           setLang]           = useState("es");
  const [pendingInvites, setPendingInvites] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showRicerca,    setShowRicerca]    = useState(false);
  const t = T[lang] || T.es;

  const [tab,            setTab]            = useState(0);
  const [toast,          setToast]          = useState("");
  const [showFotos,      setShowFotos]      = useState(false);
  const [showEmailNotif, setShowEmailNotif] = useState(false);
  const [showAddListino, setShowAddListino] = useState(false);
  const [newCatName,     setNewCatName]     = useState("");

  const showToast = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(""), 3500); }, []);

  const {
    workspace, workspaces, members, myRole,
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
    saveItem: saveMagItem, deleteItem: deleteMagItem, registraMovimento,
  } = useMagazzino({ workspaceId: workspace?.id, onToast: showToast });

  const {
    state: proy, loadProject, setInfo, setPct, setEstado, setIva, setValidez,
    setCondPago, setCondPagoPersonalizado, setCuotas, setFotos,
    setCatVisKey, getCatVis, addPartida, addFromListino, updP, delP, dispatch,
  } = useProyecto();

  const {
    firme, creaLinkFirma, loadFirme, copiaLink,
  } = useFirma({ workspaceId: workspace?.id || null, onToast: showToast });

  const {
    fatture, loadFatture, creaFattura, togglePagata, eliminaFattura,
  } = useFatture({ workspaceId: workspace?.id, onToast: showToast });

  const {
    kits, cargando: cargandoKits,
    loadKits, saveKit, deleteKit, importarKitPredefinito,
  } = useKits({ onToast: showToast, workspaceId: workspace?.id });

  // ── Routing firma pubblica ────────────────────────────────────────────────
  const firmaToken = useMemo(() => {
    const match = window.location.pathname.match(/^\/firma\/([a-f0-9]+)$/);
    return match ? match[1] : null;
  }, []);

  const saveTimer = useRef(null);

  // ── Ctrl+K per aprire ricerca ─────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowRicerca(v => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => onAuthStateChanged(auth, u => { setUser(u); setAuthReady(true); }), []);

  useEffect(() => {
    if (!user) return;
    window.__currentUid = user.uid;
    const onbKey = `onb_done_${user.uid}`;
    if (!localStorage.getItem(onbKey)) {
      setShowOnboarding(true);
      localStorage.setItem(onbKey, "1");
    }
    Promise.all([loadWorkspaces(), loadPendingInvites()]).then(([wsList, invites]) => {
      setPendingInvites(invites || []);
      if (wsList?.length === 1 && (!invites || invites.length === 0)) selectWorkspace(wsList[0]);
    });
  }, [user]); // eslint-disable-line

  useEffect(() => {
    if (!workspace) return;
    Promise.all([loadProyectos(), loadListino(), loadCats(), loadMagazzino(), loadMovimenti(), loadFatture(), loadKits()]).then(([list]) => {
      if (list?.length > 0 && !proy.currentId) loadProject(list[0]);
    });
  }, [workspace?.id]); // eslint-disable-line

  useEffect(() => {
    if (!user || !proy.currentId || !workspace) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveProyecto(proy.currentId, proy, false), 900);
    return () => clearTimeout(saveTimer.current);
  }, [proy]); // eslint-disable-line

  const handleNewProject     = async () => { const id = await newProyecto(); if (id) { dispatch({ type:"NEW_PROJECT", payload:id }); setTab(1); } };
  const handleSaveManual     = () => saveProyecto(proy.currentId, proy, true);
  const handleOpenProject    = (p) => { loadProject(p); setTab(1); };
  const handleOpenPDF        = (p) => { loadProject(p); setTab(4); };
  const handleDeleteProject  = async (id) => { const d = await deleteProyecto(id); if (d && id===proy.currentId) dispatch({ type:"NEW_PROJECT", payload:null }); };
  const handleAddFromListino = (item) => { addFromListino(item); setTab(2); };
  const handleInviaFirma     = async () => {
    if (!proy.currentId) { showToast("❌ " + t.errorNoProyecto); return; }
    const result = await creaLinkFirma(proy.currentId, proy.info);
    if (result) {
      const { doc: fbDoc, setDoc: fbSet } = await import("firebase/firestore");
      const { db: fbDb } = await import("./lib/firebase");
      await fbSet(fbDoc(fbDb, "tokens_firma", result.token), {
        workspaceId: workspace.id, proyectoId: proy.currentId, creadoAt: new Date().toISOString(),
      });
      copiaLink(result.url);
    }
  };

  const handleAcceptInvite    = async (invite) => {
    const ok = await acceptInvite(invite);
    if (ok) {
      setPendingInvites(p => p.filter(x => x.id !== invite.id));
      const wsList = await loadWorkspaces();
      const joined = wsList.find(w => w.id === invite.workspaceId);
      if (joined) selectWorkspace(joined);
    }
  };
  const handleRejectInvite    = async (id) => { await rejectInvite(id); setPendingInvites(p => p.filter(x => x.id !== id)); };
  const handleSelectWorkspace = async (ws) => { await selectWorkspace(ws); setTab(0); };

  const totals = useMemo(() => calcTotals(proy.partidas, proy.pct), [proy.partidas, proy.pct]);

  // ── Detect mobile — deve stare PRIMA dei return condizionali ─────────────
  const [isMobile,     setIsMobile]     = useState(() => window.innerWidth < 768);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const TABS_DEF = useMemo(() => [
    { icon:"🏠", label: t.dashboard },
    { icon:"📋", label: t.proyecto },
    { icon:"🏗️", label: t.costos },
    { icon:"📊", label: t.resumen },
    { icon:"🖨️", label: t.vistaCliente },
    { icon:"💾", label: t.proyectos },
    { icon:"📦", label: t.listino },
    { icon:"🏭", label: t.magazzino    || "Bodega" },
    { icon:"🧾", label: t.fatture      || "Facturas" },
    { icon:"📈", label: t.storico },
    { icon:"🔨", label: t.calcolatore  || "Calculadora" },
    { icon:"📅", label: t.agenda       || "Agenda" },
    { icon:"🇨🇱", label: t.siiTab      || "SII" },
    { icon:"⚙️", label: t.impostazioni || "Ajustes" },
    { icon:"💎", label: "Planes" },
    { icon:"❓", label: t.tabHelp },
    { icon:"📦", label: "Kits" },
  ], [t]);

  // ── Pagina pubblica firma ─────────────────────────────────────────────────
  if (firmaToken) return (
    <Suspense fallback={<div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#1a365d",color:"white" }}>Cargando...</div>}>
      <PaginaFirma token={firmaToken} />
    </Suspense>
  );

  if (!authReady) return (
    <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#1a365d",color:"white",fontSize:18 }}>
      Cargando...
    </div>
  );
  if (!user) return <LoginScreen onLogin={u => setUser(u)} />;
  if (!workspace) return (
    <WorkspaceScreen
      workspaces={workspaces} pendingInvites={pendingInvites}
      onSelect={handleSelectWorkspace} onCreate={createWorkspace}
      onAcceptInvite={handleAcceptInvite} onRejectInvite={handleRejectInvite}
      userEmail={user.email}
    />
  );

  // Tab principali nella bottom nav mobile
  const BOTTOM_TABS = [
    { idx: 0,  icon: "🏠", label: t.dashboard   || "Inicio" },
    { idx: 1,  icon: "📋", label: t.proyecto     || "Proyecto" },
    { idx: 2,  icon: "🏗️", label: t.costos       || "Costos" },
    { idx: 5,  icon: "💾", label: t.proyectos    || "Proyectos" },
    { idx: -1, icon: "☰",  label: t.mas          || "Más" },
  ];

  return (
    <div style={{ fontFamily:"'Segoe UI',system-ui,sans-serif",background:"#f0f4f8",minHeight:"100vh",
      paddingBottom: isMobile ? 70 : 0 }}>
      <style>{PRINT_STYLE}</style>

      <Toast msg={toast} />
      {showOnboarding  && <ModalOnboarding t={t} onClose={() => setShowOnboarding(false)} />}
      {showRicerca     && <RicercaGlobale proyectos={proyectos} t={t} onOpenProject={(p) => { handleOpenProject(p); }} onClose={() => setShowRicerca(false)} />}
      {showAddListino  && <ModalListino onSave={saveListinoItem} onClose={() => setShowAddListino(false)} t={t} cats={cats} />}
      {showFotos       && <ModalFotos fotos={proy.fotos} setFotos={setFotos} fotosMap={fotosMap} t={t} onClose={() => setShowFotos(false)} />}

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

      {/* ── MORE MENU MOBILE ─────────────────────────────────────────────────── */}
      {isMobile && showMoreMenu && (
        <div onClick={() => setShowMoreMenu(false)}
          style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:1000,display:"flex",alignItems:"flex-end" }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:"white",borderRadius:"20px 20px 0 0",width:"100%",padding:"8px 0 24px",
              boxShadow:"0 -8px 32px rgba(0,0,0,.2)" }}>
            {/* Handle */}
            <div style={{ width:40,height:4,background:"#cbd5e0",borderRadius:99,margin:"8px auto 16px" }} />
            <div style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:4,padding:"0 12px" }}>
              {TABS_DEF.map((tb,i) => {
                const isMain = [0,1,2,5].includes(i);
                if (isMain) return null;
                return (
                  <button key={i} onClick={() => { setTab(i); setShowMoreMenu(false); }}
                    style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:4,
                      padding:"12px 6px",border:"none",borderRadius:12,cursor:"pointer",
                      background: tab===i ? "#ebf8ff" : "#f7fafc",
                      transition:"all .15s" }}>
                    <span style={{ fontSize:22 }}>{tb.icon}</span>
                    <span style={{ fontSize:10,fontWeight:600,color:tab===i?"#2b6cb0":"#4a5568",textAlign:"center",lineHeight:1.2 }}>{tb.label}</span>
                  </button>
                );
              })}
            </div>
            {/* Azioni rapide */}
            <div style={{ display:"flex",gap:8,padding:"16px 12px 0",borderTop:"1px solid #e2e8f0",marginTop:12 }}>
              <button onClick={() => { handleSaveManual(); setShowMoreMenu(false); }}
                style={{ flex:1,padding:"10px 0",background:"#2b6cb0",color:"white",border:"none",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:13 }}>
                💾 {t.guardar}
              </button>
              {can("create_project") && (
                <button onClick={() => { handleNewProject(); setShowMoreMenu(false); }}
                  style={{ flex:1,padding:"10px 0",background:"#276749",color:"white",border:"none",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:13 }}>
                  ➕ {t.nuevo}
                </button>
              )}
              <button onClick={() => { setShowFotos(true); setShowMoreMenu(false); }}
                style={{ flex:1,padding:"10px 0",background:"#744210",color:"white",border:"none",borderRadius:10,cursor:"pointer",fontWeight:700,fontSize:13,position:"relative" }}>
                📷 {t.fotos}
                {proy.fotos.length>0 && <span style={{ position:"absolute",top:4,right:4,background:"#f5a800",color:"#1a1a1a",borderRadius:99,fontSize:9,padding:"1px 5px",fontWeight:700 }}>{proy.fotos.length}</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HEADER DESKTOP ──────────────────────────────────────────────────── */}
      {!isMobile && (
        <header className="no-print" style={{ background:"linear-gradient(135deg,#1a365d,#2d3748)",padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 2px 12px rgba(0,0,0,.3)",gap:8,flexWrap:"wrap" }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <img src={LOGO_URL} alt="Obra Nova" style={{ height:34 }} onError={e=>{e.target.style.display="none";}} />
            <div>
              <div style={{ color:"white",fontWeight:800,fontSize:15,letterSpacing:.3 }}>{workspace.name}</div>
              <div style={{ color:"#a0aec0",fontSize:10 }} aria-live="polite">
                {guardando ? t.guardando : t.guardado}
                {" · "}
                <span style={{ cursor:"pointer",textDecoration:"underline" }} onClick={() => handleSelectWorkspace(null)}>
                  {t.cambiarEmpresa || "Cambiar empresa"}
                </span>
                {" · "}
                <span style={{ cursor:"pointer",textDecoration:"underline",color:"#90cdf4" }} onClick={() => setShowOnboarding(true)}>
                  {t.verTutorial || "Ver tutorial"}
                </span>
              </div>
            </div>
          </div>
          <div style={{ display:"flex",gap:5,flexWrap:"wrap",alignItems:"center" }}>
            <button onClick={() => setShowRicerca(true)} title="Ctrl+K"
              style={{ padding:"6px 11px",background:"rgba(255,255,255,.12)",color:"white",border:"1px solid rgba(255,255,255,.2)",borderRadius:7,cursor:"pointer",fontWeight:600,fontSize:12,display:"flex",alignItems:"center",gap:5 }}>
              🔍 <span style={{ opacity:.7,fontSize:10 }}>Ctrl+K</span>
            </button>
            {can("create_project") && (
              <button onClick={handleNewProject} style={{ padding:"6px 11px",background:"#276749",color:"white",border:"none",borderRadius:7,cursor:"pointer",fontWeight:600,fontSize:12 }}>{t.nuevo}</button>
            )}
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
      )}

      {/* ── HEADER MOBILE ───────────────────────────────────────────────────── */}
      {isMobile && (
        <header className="no-print" style={{ background:"linear-gradient(135deg,#1a365d,#2d3748)",padding:"10px 14px",
          display:"flex",alignItems:"center",justifyContent:"space-between",
          boxShadow:"0 2px 12px rgba(0,0,0,.3)",position:"sticky",top:0,zIndex:100 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <img src={LOGO_URL} alt="Obra Nova" style={{ height:28 }} onError={e=>{e.target.style.display="none";}} />
            <div>
              <div style={{ color:"white",fontWeight:800,fontSize:13 }}>{workspace.name}</div>
              <div style={{ color:"#a0aec0",fontSize:9 }}>{guardando ? t.guardando : t.guardado}</div>
            </div>
          </div>
          <div style={{ display:"flex",gap:6,alignItems:"center" }}>
            <button onClick={() => setShowRicerca(true)}
              style={{ padding:"7px 10px",background:"rgba(255,255,255,.15)",color:"white",border:"none",borderRadius:8,cursor:"pointer",fontSize:16 }}>
              🔍
            </button>
            {can("create_project") && (
              <button onClick={handleNewProject}
                style={{ padding:"7px 14px",background:"#276749",color:"white",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:13 }}>
                ➕ {t.nuevo}
              </button>
            )}
            <button onClick={handleSaveManual}
              style={{ padding:"7px 10px",background:"#2b6cb0",color:"white",border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:700 }}>
              💾
            </button>
          </div>
        </header>
      )}

      {/* ── BARRA STATO (solo desktop) ──────────────────────────────────────── */}
      {!isMobile && (
        <div className="no-print" style={{ background:"white",padding:"7px 14px",display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",borderBottom:"1px solid #e2e8f0" }}>
          <span style={{ fontSize:12,color:"#4a5568",fontWeight:700 }}>{t.estado}:</span>
          {ESTADOS.map(e => (
            <button key={e} onClick={() => setEstado(e)}
              style={{ padding:"4px 13px",borderRadius:99,cursor:"pointer",fontSize:12,transition:"all .2s",
                border:`2px solid ${proy.estado===e?ESTADO_COLORS[e]:"#e2e8f0"}`,
                background: proy.estado===e?ESTADO_BG[e]:"white",
                color:      proy.estado===e?ESTADO_COLORS[e]:"#718096",
                fontWeight: proy.estado===e?700:400 }}>
              {t[e.toLowerCase()]||e}
            </button>
          ))}
          {/* Bottone WhatsApp */}
          {WA_ESTADOS.has(proy.estado) && (
            <button
              onClick={() => { const l=waLink(proy.info.telefono,proy.estado,{cliente:proy.info.cliente,descripcion:proy.info.descripcion,total:totals.totalIva||totals.total,empresa:workspace?.name}); if(l) window.open(l,"_blank","noopener,noreferrer"); }}
              style={{ padding:"4px 13px",borderRadius:99,cursor:"pointer",fontSize:12,fontWeight:700,
                background:"#25D366",color:"white",border:"none",display:"flex",alignItems:"center",gap:5 }}>
              💬 Notificar cliente
            </button>
          )}
          <span style={{ marginLeft:"auto",fontSize:12,color:"#4a5568" }}>
            {proy.info.cliente&&<><span>👤</span> <strong style={{ color:"#1a365d" }}>{proy.info.cliente}</strong></>}
            {proy.info.descripcion&&<> · <span style={{ color:"#718096" }}>{proy.info.descripcion.slice(0,35)}</span></>}
          </span>
        </div>
      )}

      {/* ── BARRA STATO MOBILE (compatta) ───────────────────────────────────── */}
      {isMobile && proy.info.cliente && (
        <div className="no-print" style={{ background:"white",padding:"8px 14px",display:"flex",gap:8,alignItems:"center",borderBottom:"1px solid #e2e8f0" }}>
          <span style={{ fontSize:12,fontWeight:600,color:"#1a365d",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
            👤 {proy.info.cliente}
          </span>
          <button onClick={() => {
            const idx = ESTADOS.indexOf(proy.estado);
            setEstado(ESTADOS[(idx+1) % ESTADOS.length]);
          }} style={{ padding:"4px 12px",borderRadius:99,cursor:"pointer",fontSize:11,fontWeight:700,
            border:`2px solid ${ESTADO_COLORS[proy.estado]||"#e2e8f0"}`,
            background: ESTADO_BG[proy.estado]||"white",
            color: ESTADO_COLORS[proy.estado]||"#718096" }}>
            {t[proy.estado?.toLowerCase()]||proy.estado}
          </button>
          {/* WhatsApp mobile */}
          {WA_ESTADOS.has(proy.estado) && (
            <button
              onClick={() => { const l=waLink(proy.info.telefono,proy.estado,{cliente:proy.info.cliente,descripcion:proy.info.descripcion,total:totals.totalIva||totals.total,empresa:workspace?.name}); if(l) window.open(l,"_blank","noopener,noreferrer"); }}
              style={{ padding:"6px 10px",borderRadius:99,cursor:"pointer",fontSize:16,
                background:"#25D366",color:"white",border:"none",lineHeight:1 }}>
              💬
            </button>
          )}
        </div>
      )}

      {/* ── NAV TAB DESKTOP ─────────────────────────────────────────────────── */}
      {!isMobile && (
        <nav role="tablist" className="no-print" style={{ background:"white",borderBottom:"2px solid #e2e8f0",display:"flex",overflowX:"auto",WebkitOverflowScrolling:"touch" }}>
          {TABS_DEF.map((tb,i) => (
            <button key={i} onClick={() => setTab(i)} aria-selected={tab===i} role="tab"
              style={{ padding:"10px 12px",border:"none",borderBottom:`3px solid ${tab===i?"#2b6cb0":"transparent"}`,
                background:"white",color:tab===i?"#2b6cb0":"#718096",cursor:"pointer",
                fontSize:12,fontWeight:tab===i?700:500,whiteSpace:"nowrap",transition:"all .2s",flexShrink:0 }}>
              <span style={{ marginRight:4 }}>{tb.icon}</span><span>{tb.label}</span>
            </button>
          ))}
        </nav>
      )}

      {/* ── MAIN ────────────────────────────────────────────────────────────── */}
      <main style={{ padding: isMobile ? 10 : 14, maxWidth:1200, margin:"0 auto" }}>
        <Suspense fallback={<TabLoader />}>
          <ErrorBoundary label={TABS_DEF[tab]?.label}>
            {tab===0  && <TabDashboard proyectos={proyectos} partidas={proy.partidas} cats={cats} t={t} onOpenProject={handleOpenProject} onNewProject={handleNewProject} />}
            {tab===1  && <TabProyecto info={proy.info} setInfo={setInfo} pct={proy.pct} setPct={setPct} estado={proy.estado} setEstado={setEstado} iva={proy.iva} setIva={setIva} validez={proy.validez} setValidez={setValidez} condPago={proy.condPago} setCondPago={setCondPago} condPagoPersonalizado={proy.condPagoPersonalizado} setCondPagoPersonalizado={setCondPagoPersonalizado} cuotas={proy.cuotas} setCuotas={setCuotas} partidas={proy.partidas} t={t} />}
            {tab===2  && <TabCostos partidas={proy.partidas} cats={cats} addPartida={addPartida} updP={updP} delP={delP} addFromListino={handleAddFromListino} listino={listino} t={t} workspaceId={workspace?.id} lang={lang} />}
            {tab===3  && <TabResumen partidas={proy.partidas} pct={proy.pct} cats={cats} iva={proy.iva} t={t} />}
            {tab===4  && <TabVistaCliente info={proy.info} partidas={proy.partidas} pct={proy.pct} cats={cats} catVis={proy.catVis} getCatVis={getCatVis} setCatVisKey={setCatVisKey} iva={proy.iva} estado={proy.estado} currentId={proy.currentId} validez={proy.validez} t={t} onInviaFirma={handleInviaFirma} firme={firme} plan={workspace?.plan} />}
            {tab===5  && <TabProyectos proyectos={proyectos} currentId={proy.currentId} onLoad={handleOpenProject} onDelete={handleDeleteProject} onPDF={handleOpenPDF} t={t} />}
            {tab===6  && <TabListino listino={listino} cats={cats} catColors={CAT_COLORS} newCatName={newCatName} setNewCatName={setNewCatName} onAddCat={() => { addCat(newCatName,t); setNewCatName(""); }} onDeleteItem={deleteListinoItem} onAddFromListino={handleAddFromListino} onOpenAddModal={() => setShowAddListino(true)} DEFAULT_CATS={DEFAULT_CATS} t={t} />}
            {tab===7  && <TabMagazzino items={magItems} movimenti={movimenti} itemsInAlert={itemsInAlert} loading={magLoading} cats={cats} proyectos={proyectos} onSaveItem={saveMagItem} onDeleteItem={deleteMagItem} onMovimento={registraMovimento} />}
            {tab===8  && <TabFatture proyectos={proyectos} fatture={fatture} onCreaFattura={creaFattura} onTogglePagata={togglePagata} onEliminaFattura={eliminaFattura} />}
            {tab===9  && <TabStorico proyectos={proyectos} t={t} />}
            {tab===10 && <TabCalcolatore listino={listino} addPartida={addPartida} cats={cats} onToast={showToast} />}
            {tab===11 && <TabAgenda proyectos={proyectos} fatture={fatture} onOpenProject={handleOpenProject} />}
            {tab===12 && <TabSII proyectos={proyectos} workspaceId={workspace?.id} t={t} onToast={showToast} />}
            {tab===13 && <TabSettings workspace={workspace} members={members} myRole={myRole} can={can} onInvite={(email,role) => inviteMember(email,role,workspace.id)} onChangeRole={changeMemberRole} onRemoveMember={removeMember} onUpdateName={updateWorkspaceName} onGoToPiani={() => setTab(15)} />}
            {tab===14 && <TabHelp t={t} />}
            {tab===15 && <TabPiani workspace={workspace} />}
            {tab===16 && <TabKitMateriali kits={kits} cargando={cargandoKits} onSaveKit={saveKit} onDeleteKit={deleteKit} onImportarPredefinito={importarKitPredefinito} addPartida={addPartida} cats={cats} onToast={showToast} />}
          </ErrorBoundary>
        </Suspense>
      </main>

      {/* ── BOTTOM NAV MOBILE ───────────────────────────────────────────────── */}
      {isMobile && (
        <nav className="no-print" style={{
          position:"fixed",bottom:0,left:0,right:0,
          background:"white",borderTop:"1px solid #e2e8f0",
          display:"flex",alignItems:"stretch",
          boxShadow:"0 -4px 20px rgba(0,0,0,.1)",
          zIndex:200, paddingBottom:"env(safe-area-inset-bottom)",
        }}>
          {BOTTOM_TABS.map((bt) => {
            const isMore  = bt.idx === -1;
            const isActive = isMore ? showMoreMenu : tab === bt.idx;
            return (
              <button key={bt.idx}
                onClick={() => {
                  if (isMore) { setShowMoreMenu(v => !v); }
                  else        { setTab(bt.idx); setShowMoreMenu(false); }
                }}
                style={{
                  flex:1, display:"flex", flexDirection:"column", alignItems:"center",
                  justifyContent:"center", gap:2, padding:"8px 4px",
                  border:"none", background:"none", cursor:"pointer",
                  borderTop:`2px solid ${isActive ? "#2b6cb0" : "transparent"}`,
                  transition:"all .15s",
                }}>
                <span style={{ fontSize:20 }}>{bt.icon}</span>
                <span style={{ fontSize:9,fontWeight:isActive?700:500,
                  color:isActive?"#2b6cb0":"#718096" }}>{bt.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
// cache bust 
