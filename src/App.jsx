// ─── App.jsx ─────────────────────────────────────────────────────────────────
// Componente root — Obra Nova SPA
// ─────────────────────────────────────────────────────────────────────────────

// IMPORTANTE: firebase/app primo import — evita TDZ Rollup in prod
import "firebase/app";

import { useState, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./lib/firebase";

// ── Hooks ─────────────────────────────────────────────────────────────────────
import { useWorkspace }   from "./hooks/useWorkspace";
import { useFirestore }   from "./hooks/useFirestore";
import { useKits }        from "./hooks/useKits";
import { useMagazzino }   from "./hooks/useMagazzino";
import { useFatture }     from "./hooks/useFatture";
import { usePlan }        from "./hooks/usePlan";
import { useNotifiche }   from "./hooks/useNotifiche";
import { useLogAction }   from "./hooks/useLogAction";
import { mkVacioState }   from "./hooks/useProyecto";
import { useTemplates }   from "./hooks/useTemplates";

// ── Componenti schermata (lazy per pagine pubbliche — riduce bundle iniziale) ─
const LandingPage        = lazy(() => import("./components/LandingPage"));
const FirmaPage          = lazy(() => import("./components/FirmaPage"));
const VistaPublica       = lazy(() => import("./components/VistaPublica"));
const PresupuestoWizard  = lazy(() => import("./components/PresupuestoWizard"));
const PortfolioPublico  = lazy(() => import("./components/PortfolioPublico"));
const LegalPrivacy     = lazy(() => import("./components/LegalPages").then(m => ({ default: m.PrivacyPolicy })));
const LegalTerms       = lazy(() => import("./components/LegalPages").then(m => ({ default: m.TermsOfService })));
const WorkspaceScreen    = lazy(() => import("./components/WorkspaceScreen"));
const NotifichePanel     = lazy(() => import("./components/NotifichePanel"));
const PaywallModal       = lazy(() => import("./components/PaywallModal"));
const ModalOnboarding    = lazy(() => import("./components/ModalOnboarding"));
const ModalVersiones     = lazy(() => import("./components/ModalVersiones"));
const AgenteIA           = lazy(() => import("./components/AgenteIA"));
const BenchmarkReport    = lazy(() => import("./components/BenchmarkReport"));
const PanelComentarios   = lazy(() => import("./components/PanelComentarios"));
import { useFCM }          from "./hooks/useFCM";
import { useAgenteIA }     from "./hooks/useAgenteIA";
import { useNovaProattiva } from "./hooks/useNovaProattiva";
import { LOGO_URL, LOGO_LIGHT_URL } from "./utils/logo";

// ── Tabs (lazy — ogni tab è un chunk separato, zero TDZ in prod) ──────────────
const TabDashboard       = lazy(() => import("./components/tabs/TabDashboard"));
const TabProyecto        = lazy(() => import("./components/tabs/TabProyecto"));
const TabCostos          = lazy(() => import("./components/tabs/TabCostos"));
const TabSettings        = lazy(() => import("./components/tabs/TabSettings"));
const TabPiani           = lazy(() => import("./components/tabs/TabPiani"));
const TabAgenda          = lazy(() => import("./components/tabs/TabAgenda"));
const TabGestionPersonal = lazy(() => import("./components/tabs/TabGestionPersonal"));
const TabKitMateriali    = lazy(() => import("./components/tabs/TabKitMateriali"));
const TabMagazzino       = lazy(() => import("./components/tabs/TabMagazzino"));
const TabSII             = lazy(() => import("./components/tabs/TabSII"));
const TabDiseno          = lazy(() => import("./components/tabs/TabDiseno"));
const TabCalcolatore     = lazy(() => import("./components/tabs/TabCalcolatore"));
const TabReporteMensual  = lazy(() => import("./components/tabs/TabReporteMensual"));
const TabPlanificacion   = lazy(() => import("./components/tabs/TabPlanificacion"));
const TabExportContable  = lazy(() => import("./components/tabs/TabExportContable"));
const AdminDashboard     = lazy(() => import("./components/tabs/AdminDashboard"));
const TabContratos       = lazy(() => import("./components/tabs/TabContratos"));
const TabClientes        = lazy(() => import("./components/tabs/TabClientes"));

// ── Tabs (named exports da OtherTabs — lazy con named re-export) ──────────────
const TabResumen      = lazy(() => import("./components/tabs/OtherTabs").then(m => ({ default: m.TabResumen })));
const TabVistaCliente = lazy(() => import("./components/tabs/OtherTabs").then(m => ({ default: m.TabVistaCliente })));
const TabProyectos    = lazy(() => import("./components/tabs/OtherTabs").then(m => ({ default: m.TabProyectos })));
const TabListino      = lazy(() => import("./components/tabs/OtherTabs").then(m => ({ default: m.TabListino })));
const TabStorico      = lazy(() => import("./components/tabs/OtherTabs").then(m => ({ default: m.TabStorico })));
const TabHelp         = lazy(() => import("./components/tabs/OtherTabs").then(m => ({ default: m.TabHelp })));

// ── TabFatture (named export — lazy) ─────────────────────────────────────────
const TabFatture = lazy(() => import("./components/tabs/TabFatture").then(m => ({ default: m.TabFatture })));

// ── i18n ──────────────────────────────────────────────────────────────────────
import translations from "./i18n/translations";

// ── Icone ─────────────────────────────────────────────────────────────────────
import { LogOut, Menu, X, Bell, PlusCircle, ArrowLeft } from "lucide-react";
import { LoginScreen } from "./components/UI";
import { signInWithEmailAndPassword } from "firebase/auth";

// ── Costanti ──────────────────────────────────────────────────────────────────
import { DEFAULT_CATS } from "./utils/constants";

// ─────────────────────────────────────────────────────────────────────────────
// Hook Toast
// ─────────────────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);
  const showToast = useCallback((msg, duration = 3000) => {
    const id = ++counter.current;
    setToasts(prev => [...prev, { id, msg }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);
  return { toasts, showToast };
}

function ToastContainer({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", gap: 8, zIndex: 99999, pointerEvents: "none" }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background: "#1a365d", color: "white", padding: "11px 22px", borderRadius: 10, fontWeight: 600, fontSize: 14, boxShadow: "0 4px 20px rgba(0,0,0,.35)", whiteSpace: "nowrap" }}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {

  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const { toasts, showToast } = useToast();
  const [lang]                = useState(() => localStorage.getItem("on_lang") || "es");
  const t = translations[lang] || translations["es"];

  // ── Workspace ─────────────────────────────────────────────────────────────
  const {
    workspace, workspaces, members, myRole, loadingWS,
    loadWorkspaces, selectWorkspace, createWorkspace,
    inviteMember, loadPendingInvites, acceptInvite, rejectInvite,
    changeMemberRole, removeMember, updateWorkspaceName, can,
  } = useWorkspace({ onToast: showToast });

  // ── Firestore ─────────────────────────────────────────────────────────────
  const {
    proyectos, listino, cats, guardando,
    wizardProyectos,
    novaProfile, loadNovaProfile,
    loadProyectos, saveProyecto, newProyecto, deleteProyecto,
    loadListino, saveListinoItem, deleteListinoItem,
    updatePrezzoManuale, loadCats, addCat,
    loadFirme,
    clientes, loadClientes,
  } = useFirestore({ onToast: showToast, workspaceId: workspace?.id });

  // ── Kits ──────────────────────────────────────────────────────────────────
  const { kits, cargando: kitsLoading, loadKits, saveKit, deleteKit, importarKitPredefinito } =
    useKits({ onToast: showToast, workspaceId: workspace?.id });

  // ── Magazzino ─────────────────────────────────────────────────────────────
  const { items: magItems, movimenti, loading: magLoading, itemsInAlert,
    loadMagazzino, loadMovimenti, saveItem: saveMagItem, deleteItem: deleteMagItem, registraMovimento } =
    useMagazzino({ workspaceId: workspace?.id, onToast: showToast });

  // ── Fatture ───────────────────────────────────────────────────────────────
  const { fatture, loadFatture, creaFattura, togglePagata, eliminaFattura } =
    useFatture({ onToast: showToast, workspaceId: workspace?.id });

  // ── Templates ─────────────────────────────────────────────────────────────
  const {
    getAll: getTemplates,
    saveTemplate, deleteTemplate, markUsed: markTemplateUsed,
  } = useTemplates({ workspaceId: workspace?.id, onToast: showToast });

  // ── Piano ─────────────────────────────────────────────────────────────────
  const plan = usePlan({ workspace }, proyectos);

  // ── Notifiche ─────────────────────────────────────────────────────────────
  const { notifiche, unreadCount, lastSeenAt, markAllRead } = useNotifiche(workspace?.id, user?.uid);

  // ── Log ───────────────────────────────────────────────────────────────────
  const { logAction } = useLogAction(workspace?.id);

  // ── FCM Push Notifications ────────────────────────────────────────────────
  const { requestPushPermission, permission: pushPermission } = useFCM({
    workspaceId: workspace?.id,
    userId: user?.uid,
  });

  // ── UI ────────────────────────────────────────────────────────────────────
  const lastSavedTabRef = useRef(null); // per auto-save snapshot
  const [activeTab, setActiveTab] = useState(() => {
    // Se MP redirige con ?pago=ok|error|pendiente → apri direttamente Planes
    const pago = new URLSearchParams(window.location.search).get("pago");
    return pago ? "piani" : "dashboard";
  });
  const [currentId,      setCurrentId]      = useState(null);

  // ── Firme del progetto corrente ─────────────────────────────────────────
  const [firme, setFirme] = useState([]);
  useEffect(() => {
    if (!currentId || !workspace?.id) { setFirme([]); return; }
    loadFirme(currentId).then(setFirme).catch(() => setFirme([]));
  }, [currentId, workspace?.id]); // eslint-disable-line
  const [isSidebarOpen,  setIsSidebarOpen]  = useState(true);
  const [showNotifiche,  setShowNotifiche]  = useState(false);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [paywallFeature, setPaywallFeature] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [newCatName,     setNewCatName]     = useState("");
  const [showVersiones,    setShowVersiones]    = useState(false);
  const [showComentarios,    setShowComentarios]    = useState(false);
  const [unreadComentarios,  setUnreadComentarios]  = useState(0);
  const [isMobile,       setIsMobile]       = useState(() => window.matchMedia("(max-width: 767px)").matches);
  const [showLogin,      setShowLogin]      = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [proyState,      setProyState]      = useState(() => mkVacioState());
  const [portalConfig,   setPortalConfig]   = useState({});

  // ── Agente AI Nova ────────────────────────────────────────────────────────
  const agente = useAgenteIA({ workspace, proyState, activeTab, user, novaProfile });

  // ── Nova proattiva ─────────────────────────────────────────────────────────
  const { suggerimento, dismiss: dismissSuggerimento } = useNovaProattiva({
    activeTab,
    proyState,
    currentId,
    clientes,
    plan:     plan?.plan,
    novaOpen: agente.open,
    novaProfile,
  });

  // ── Auto-save snapshot quando si lascia tab costos/proyecto ───────────────
  useEffect(() => {
    const prev = lastSavedTabRef.current;
    lastSavedTabRef.current = activeTab;
    if (!currentId || !workspace?.id) return;
    if ((prev === "costos" || prev === "proyecto") && prev !== activeTab) {
      // Salva in background silenziosamente
      import("./components/ModalVersiones")
        .then(m => m.saveSnapshotAuto(currentId, workspace.id, proyState, "Auto · salida " + prev))
        .catch(() => {}); // silenzioso — non disturba l'utente
    }
  }, [activeTab]);
  const [aiRenders,      setAiRenders]      = useState([]); // renders AI per il progetto corrente
  const [showBenchmark,  setShowBenchmark]  = useState(false); // modal report benchmark

  // Carica renders AI da Firestore quando si apre un progetto
  // TabDiseno chiama onRendersReady solo se l'utente visita il tab Diseno.
  // Questo effect garantisce che i renders siano disponibili in Resumen e Vista Cliente
  // anche se l'utente non passa da Diseno.
  useEffect(() => {
    if (!currentId || !workspace?.id) { setAiRenders([]); return; }
    let cancelled = false;
    import("firebase/firestore").then(({ collection, getDocs, query, orderBy, limit }) => {
      import("./lib/firebase").then(({ db }) => {
        getDocs(query(
          collection(db, "workspaces", workspace.id, "proyectos", currentId, "renders"),
          orderBy("createdAt", "desc"),
          limit(8),
        )).then(snap => {
          if (cancelled) return;
          const renders = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(r => r.imageUrl);
          setAiRenders(renders);
        }).catch(() => {});
      });
    });
    return () => { cancelled = true; };
  }, [currentId, workspace?.id]); // eslint-disable-line

  const mkSetter = (key) => (val) =>
    setProyState(s => ({
      ...s,
      [key]: typeof val === "function"
        ? val(s[key])
        : (val !== null && typeof val === "object" && !Array.isArray(val)
            ? { ...s[key], ...val }   // merge oggetti (es. info, pct, transferencia)
            : val),                   // sostituisce scalari e array
    }));

  // ── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const h = (e) => { setIsMobile(e.matches); if (e.matches) setIsSidebarOpen(false); };
    mq.addEventListener("change", h);
    if (mq.matches) setIsSidebarOpen(false);
    return () => mq.removeEventListener("change", h);
  }, []);

  useEffect(() => onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); }), []);

  // ── Print: aggiunge/rimuove classe "is-printing" sul body ──────────────────
  // La classe è usata dal CSS in index.css per nascondere tutto tranne #print-area.
  // Usiamo la classe invece di manipolare inline styles direttamente:
  // - evita race condition con React reconciler
  // - non viene sovrascritta da re-render React
  // - si combina con @media print per massima compatibilità
  useEffect(() => {
    const beforePrint = () => {
      document.body.classList.add('is-printing');
    };
    const afterPrint = () => {
      document.body.classList.remove('is-printing');
    };
    window.addEventListener('beforeprint', beforePrint);
    window.addEventListener('afterprint', afterPrint);
    // Cleanup safety: rimuovi la classe se il componente smonta durante la stampa
    return () => {
      window.removeEventListener('beforeprint', beforePrint);
      window.removeEventListener('afterprint', afterPrint);
      document.body.classList.remove('is-printing');
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    loadWorkspaces().then(async (list) => {
      if (list.length === 1) await selectWorkspace(list[0]);
      setPendingInvites(await loadPendingInvites());
    });
  }, [user]); // eslint-disable-line

  useEffect(() => {
    if (!workspace?.id) return;
    loadProyectos(); loadListino(); loadCats();
    loadKits(); loadMagazzino(); loadMovimenti(); loadFatture();
    loadNovaProfile(); loadClientes();
    const key = `on_onboarding_${workspace.id}`;
    if (!localStorage.getItem(key)) { setShowOnboarding(true); localStorage.setItem(key, "1"); }
  }, [workspace?.id]); // eslint-disable-line

  useEffect(() => { localStorage.setItem("on_lang", lang); }, [lang]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const openProject = useCallback((idOrObj) => {
    const id = typeof idOrObj === "object" ? idOrObj?.id : idOrObj;
    const p = proyectos.find(x => x.id === id);
    if (!p) return;
    const e = mkVacioState();
    setProyState({
      info: p.info || e.info, partidas: p.partidas || [],
      pct: p.pct || e.pct, estado: p.estado || "Borrador",
      fotos: p.fotos || [], validez: p.validez ?? 30,
      iva: p.iva !== undefined ? p.iva : true,
      condPago: p.condPago || "cuotas",
      condPagoPersonalizado: p.condPagoPersonalizado || "",
      cuotas: p.cuotas || [], catVis: p.catVis || {},
      transferencia: p.transferencia || e.transferencia,
      descuento: p.descuento || e.descuento,
    });
    setCurrentId(id); setActiveTab("proyecto"); setAiRenders([]); setPortalConfig({});
  }, [proyectos]);

  const handleNewProject = useCallback(async () => {
    if (!plan.canCreateProyecto()) { setPaywallFeature("maxProyectos"); return; }
    const id = await newProyecto();
    if (id) {
      // Non usare openProject — proyectos non è ancora aggiornato dopo newProyecto()
      setProyState(mkVacioState());
      setCurrentId(id);
      setActiveTab("proyecto");
      logAction("progetto_creato", "proyectos", id);
    }
  }, [plan, newProyecto, logAction]);

  const handleLogout = () => signOut(auth).catch(console.error);

  const handleBackup = useCallback(async () => {
    try {
      const { getFunctions, httpsCallable } = await import("firebase/functions");
      const fn = httpsCallable(getFunctions(undefined, "southamerica-west1"), "backupManualeCallable");
      return (await fn()).data;
    } catch (e) { showToast("❌ Backup fallito: " + e.message); return null; }
  }, [showToast]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render condizionali
  // ─────────────────────────────────────────────────────────────────────────
  const PageLoader = (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7fafc" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "4px solid #bee3f8", borderTopColor: "#2b6cb0", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 12px" }} />
        <div style={{ color: "#718096", fontSize: 13 }}>Cargando...</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (window.location.pathname === "/privacidad") return <Suspense fallback={PageLoader}><LegalPrivacy /></Suspense>;
  if (window.location.pathname === "/terminos") return <Suspense fallback={PageLoader}><LegalTerms /></Suspense>;
  if (window.location.pathname.startsWith("/portfolio/")) return <Suspense fallback={PageLoader}><PortfolioPublico /></Suspense>;
  if (window.location.pathname.startsWith("/presupuesto/")) return <Suspense fallback={PageLoader}><PresupuestoWizard /></Suspense>;
  if (window.location.pathname.startsWith("/firma/")) return <Suspense fallback={PageLoader}><FirmaPage /></Suspense>;
  if (window.location.pathname.startsWith("/cliente/")) return <Suspense fallback={PageLoader}><VistaPublica /></Suspense>;

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f7fafc" }}>
      <div style={{ width: 44, height: 44, border: "4px solid #bee3f8", borderTopColor: "#2b6cb0", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!user) {
    if (showLogin) return (
      <LoginScreen
        auth={auth}
        signIn={signInWithEmailAndPassword}
        onLogin={() => setShowLogin(false)}
        onSignupComplete={async (user, { empresa }) => {
          // Aspetta che Firebase Auth propaghi auth.currentUser
          await new Promise(r => setTimeout(r, 500));
          const ws = await createWorkspace(empresa || "Mi Empresa");
          if (ws) await selectWorkspace(ws);
        }}
      />
    );
    return <Suspense fallback={PageLoader}><LandingPage onGoToApp={() => setShowLogin(true)} /></Suspense>;
  }

  if (loadingWS || (!workspace && workspaces.length !== 1)) return (
    <>
      <WorkspaceScreen
        workspaces={workspaces} pendingInvites={pendingInvites}
        onSelect={selectWorkspace} onCreate={createWorkspace}
        onAcceptInvite={async (invite) => {
          await acceptInvite(invite);
          const list = await loadWorkspaces();
          setPendingInvites(await loadPendingInvites());
          if (list.length === 1) selectWorkspace(list[0]);
        }}
        onRejectInvite={async (id) => {
          await rejectInvite(id);
          setPendingInvites(await loadPendingInvites());
        }}
        userEmail={user.email}
      />
      <ToastContainer toasts={toasts} />
    </>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Render tab
  // ─────────────────────────────────────────────────────────────────────────
  const addPartida = (p) => mkSetter("partidas")(prev => {
    const base = typeof p === "string"
      ? { nombre: "", cat: p || cats[0] || "General", unidad: "gl", cant: 1, pu: 0, nota: "", proveedor: "" }
      : { nombre: "", cat: cats[0] || "General", unidad: "gl", cant: 1, pu: 0, nota: "", proveedor: "", ...p };
    return [...prev, { ...base, id: Date.now() + Math.random() }];
  });

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard":
        return <TabDashboard proyectos={proyectos} partidas={proyState.partidas} cats={cats} t={t} onOpenProject={openProject} onNewProject={handleNewProject} plan={plan} proyectosRestantes={plan.proyectosRestantes} onUpgrade={() => setActiveTab("piani")} itemsInAlert={itemsInAlert} currentId={currentId} isMobile={isMobile} wizardProyectos={wizardProyectos} wizardLink={workspace?.id ? `${window.location.origin}/presupuesto/${workspace.id}` : null} />;

      case "proyecto":
        return (
          <>
            {/* Barra versiones */}
            {currentId && (
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "flex-end",
                marginBottom: 10, gap: 8,
              }}>
                <button
                  onClick={() => setShowVersiones(true)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 14px", borderRadius: 9,
                    border: "1px solid #bee3f8", background: "#ebf8ff",
                    color: "#2b6cb0", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  🕓 Versiones
                </button>
                <button
                  onClick={() => { setShowComentarios(v => !v); setUnreadComentarios(0); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 14px", borderRadius: 9,
                    border: `1px solid ${showComentarios ? "#1a365d" : "#e2e8f0"}`,
                    background: showComentarios ? "#1a365d" : "white",
                    color: showComentarios ? "white" : "#718096",
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  💬 Comentarios
                  {unreadComentarios > 0 && (
                    <span style={{ background: "#e53e3e", color: "white", borderRadius: "50%", width: 16, height: 16, fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {unreadComentarios > 9 ? "9+" : unreadComentarios}
                    </span>
                  )}
                </button>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: showComentarios && currentId ? "1fr 340px" : "1fr", gap: 14, alignItems: "start" }}>
            <TabProyecto
              info={proyState.info}                           setInfo={mkSetter("info")}
              pct={proyState.pct}                             setPct={mkSetter("pct")}
              estado={proyState.estado}                       setEstado={mkSetter("estado")}
              iva={proyState.iva}                             setIva={mkSetter("iva")}
              validez={proyState.validez}                     setValidez={mkSetter("validez")}
              condPago={proyState.condPago}                   setCondPago={mkSetter("condPago")}
              condPagoPersonalizado={proyState.condPagoPersonalizado}
              setCondPagoPersonalizado={mkSetter("condPagoPersonalizado")}
              cuotas={proyState.cuotas}                       setCuotas={mkSetter("cuotas")}
              transferencia={proyState.transferencia}         setTransferencia={mkSetter("transferencia")}
              partidas={proyState.partidas}
              workspaceId={workspace?.id} proyectoId={currentId} t={t}
              portalConfig={portalConfig} setPortalConfig={setPortalConfig}
            />
            {/* Panel comentarios laterale */}
            {showComentarios && currentId && (
              <PanelComentarios
                workspaceId={workspace?.id}
                proyectoId={currentId}
                autorNombre={user?.displayName || user?.email || "Usuario"}
                autorEmail={user?.email || ""}
                autorUid={user?.uid || ""}
                myRole={myRole}
                esCliente={false}
                onNewComment={() => !showComentarios && setUnreadComentarios(v => v + 1)}
              />
            )}
            </div>
            {/* Modal versiones */}
            {showVersiones && currentId && (
              <ModalVersiones
                proyectoId={currentId}
                workspaceId={workspace?.id}
                proyState={proyState}
                onRestore={(data) => {
                  setProyState(prev => ({ ...prev, ...data }));
                  showToast("↩ Versión restaurada");
                }}
                onClose={() => setShowVersiones(false)}
                t={t}
              />
            )}
          </>
        );

      case "costos":
        return (
          <TabCostos
            partidas={proyState.partidas} cats={cats}
            addPartida={addPartida}
            updP={(id, field, val) => mkSetter("partidas")(prev => prev.map(x => x.id === id ? { ...x, [field]: val } : x))}
            delP={(id) => mkSetter("partidas")(prev => prev.filter(x => x.id !== id))}
            dupP={(id) => mkSetter("partidas")(prev => {
              const idx = prev.findIndex(x => x.id === id);
              if (idx < 0) return prev;
              const copy = { ...prev[idx], id: Date.now() + Math.random() };
              return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)];
            })}
            addFromListino={(item) => addPartida({ nombre: item.nombre, cat: item.cat || cats[0] || "General", unidad: item.unidad || "m²", cant: 1, pu: item.precioVenta || 0 })}
            listino={listino} t={t}
            info={proyState.info} pct={proyState.pct}
            condPago={proyState.condPago} condPagoPersonalizado={proyState.condPagoPersonalizado}
            cuotas={proyState.cuotas} iva={proyState.iva}
            canExcel={plan.canUse("exportExcel")} canTemplates={plan.canUse("templates")}
            canPlan={plan.canUse} onPaywall={(f) => setPaywallFeature(f)}
            partidasRestantes={plan.remaining("partidas", proyState.partidas.length)}
            isPro={plan.isPro}
            onSaveKit={plan.canUse("kits") ? saveKit : () => setPaywallFeature("maxKits")}
            // ── Templates Firestore ──────────────────────────────────────────
            onSaveTemplate={saveTemplate}
            onDeleteTemplate={deleteTemplate}
            onMarkTemplateUsed={markTemplateUsed}
            getTemplates={getTemplates}
            onApplyTemplate={(tpl, mode) => {
              // mode: "replace" | "append" (scelto nel modal di TabCostos)
              const nuovePartidas = (tpl.partidas || []).map(p => ({
                ...p,
                id: Date.now() + Math.random(),
                cat: p.cat || cats[0],
              }));
              if (mode === "replace") {
                mkSetter("partidas")(nuovePartidas);
                // Applica anche pct, condPago, iva se presenti nel template
                if (tpl.pct)     mkSetter("pct")(tpl.pct);
                if (tpl.condPago) mkSetter("condPago")(tpl.condPago);
                if (tpl.iva !== undefined) mkSetter("iva")(tpl.iva);
                showToast(`✅ Template "${tpl.nombre}" aplicado`);
              } else {
                mkSetter("partidas")(prev => [...prev, ...nuovePartidas]);
                showToast(`✅ ${nuovePartidas.length} partidas agregadas desde "${tpl.nombre}"`);
              }
              markTemplateUsed(tpl.id);
            }}
          />
        );

      case "resumen":
        return <TabResumen partidas={proyState.partidas} pct={proyState.pct} cats={cats} iva={proyState.iva} t={t} descuento={proyState.descuento} setDescuento={mkSetter("descuento")} aiRenders={aiRenders} plan={plan?.plan} onShowBenchmark={() => setShowBenchmark(true)} />;

      case "vistacliente":
        return (
          <TabVistaCliente
            info={proyState.info} partidas={proyState.partidas} pct={proyState.pct}
            cats={cats} catVis={proyState.catVis}
            setCatVisKey={(c, key, value) => {
              setProyState(s => {
                const prev = s.catVis || {};
                const cur = prev[c] && typeof prev[c] === "object" ? prev[c] : { visible: prev[c] !== false, modo: "detalle" };
                return { ...s, catVis: { ...prev, [c]: { ...cur, [key]: value } } };
              });
            }}
            iva={proyState.iva} estado={proyState.estado}
            currentId={currentId} validez={proyState.validez} t={t}
            firme={firme} fotos={proyState.fotos || []}
            onInviaFirma={currentId && workspace?.id ? async () => {
              try {
                const { getFunctions, httpsCallable } = await import("firebase/functions");
                const token = `${workspace.id}_${currentId}_${Date.now()}`;
                const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
                const { db } = await import("./lib/firebase");
                await setDoc(doc(db, "workspaces", workspace.id, "firme", token), {
                  proyectoId: currentId, stato: "richiesta", token,
                  tipo: "richiesta_firma", timestamp: serverTimestamp(),
                  proyectoSnapshot: proyState,
                });
                await httpsCallable(getFunctions(undefined, "southamerica-west1"), "notificaFirma")({
                  workspaceId: workspace.id, proyectoId: currentId, token, tipo: "richiesta_firma",
                });
                showToast("✅ Solicitud de firma enviada");
              } catch(e) { showToast("❌ Error: " + e.message); }
            } : undefined}
            plan={plan.plan} trialEndsAt={workspace?.trialEndsAt}
            descuento={proyState.descuento} setDescuento={mkSetter("descuento")}
            aiRenders={aiRenders}
            workspaceId={workspace?.id}
            onShowBenchmark={() => setShowBenchmark(true)}
            onTrackPdf={(type) => {
              if (!currentId || !workspace?.id) return;
              import("firebase/firestore").then(({ doc, updateDoc, increment }) => {
                import("./lib/firebase").then(({ db }) => {
                  updateDoc(doc(db, "workspaces", workspace.id, "proyectos", currentId), {
                    [`pdfTracking.${type}`]: increment(1),
                    "pdfTracking.lastAt": new Date().toISOString(),
                  }).catch(() => {});
                });
              });
            }}
          />
        );

      case "proyectos":
        return <TabProyectos proyectos={proyectos} currentId={currentId} onLoad={openProject} onDelete={deleteProyecto} onPDF={(p) => { openProject(p.id); setActiveTab("vistacliente"); }} t={t} canPlan={plan.canUse} onPaywall={(f) => setPaywallFeature(f)} />;

      case "listino":
        return (
          <TabListino
            listino={listino} cats={cats} catColors={[]}
            newCatName={newCatName} setNewCatName={setNewCatName}
            onAddCat={(name) => { addCat(name || newCatName, t); setNewCatName(""); }}
            onDeleteItem={deleteListinoItem}
            onAddFromListino={(item) => { addPartida({ nombre: item.nombre, cat: item.cat || cats[0] || "General", unidad: item.unidad || "m²", cant: 1, pu: item.precioVenta || item.precioCliente || item.precio || 0 }); showToast("✅ Agregado a Costos"); }}
            onSaveListinoItem={saveListinoItem}
            onOpenAddModal={() => {}}
            DEFAULT_CATS={DEFAULT_CATS} t={t}
            onUpdatePrecio={async (id, field, val) => {
              if (val === undefined) {
                // Legacy 2-arg: inline price edit (field = price value)
                return updatePrezzoManuale(id, field);
              }
              // 3-arg: generic field update for edit modal
              try {
                const { updateDoc, doc: fdoc } = await import("firebase/firestore");
                const { db } = await import("./lib/firebase");
                const wsId = workspace?.id;
                if (!wsId) return;
                await updateDoc(fdoc(db, "workspaces", wsId, "listino", id), { [field]: val, updatedAt: new Date().toISOString() });
                await loadListino();
              } catch (e) { console.error("updateListinoField:", e); }
            }}
            listinoRestanti={plan.remaining("listino", listino.length)}
            onPaywall={(f) => setPaywallFeature(f)} isPro={plan.isPro}
          />
        );

      case "storico":
        return <TabStorico proyectos={proyectos} t={t} isPro={plan.isPro} filterByHistorial={plan.filterByHistorial} onPaywall={(f) => setPaywallFeature(f)} />;

      case "fatture":
        return <TabFatture proyectos={proyectos} fatture={fatture} onCreaFattura={creaFattura} onTogglePagata={togglePagata} onEliminaFattura={eliminaFattura} />;

      case "agenda":
        return <TabAgenda proyectos={proyectos} fatture={fatture} onOpenProject={openProject} isPro={plan.isPro} />;

      case "planificacion":
        return (
          <TabPlanificacion
            workspaceId={workspace?.id}
            proyectos={proyectos}
            members={members}
            cats={cats}
            user={user}
            myRole={myRole}
            isEmpresa={workspace?.plan === "empresa"}
            onPaywall={(f) => setPaywallFeature(f)}
            proyState={proyState}
            onAskNova={(msg) => {
              agente.setOpen(true);
              setTimeout(() => agente.sendMessage(msg), 300);
            }}
          />
        );

      case "kits":
        return (
          <TabKitMateriali
            kits={kits} cargando={kitsLoading}
            onSaveKit={saveKit} onDeleteKit={deleteKit}
            onImportarPredefinito={importarKitPredefinito}
            addPartida={addPartida} cats={cats} onToast={showToast}
            canAddKit={() => plan.canAdd("kits", kits.filter(k => k.esPersonalizado).length)}
            kitsRestanti={plan.remaining("kits", kits.filter(k => k.esPersonalizado).length)}
            onPaywall={(f) => setPaywallFeature(f)}
            listino={listino} magItems={magItems}
          />
        );

      case "magazzino":
        return (
          <TabMagazzino
            items={magItems} movimenti={movimenti} proyectos={proyectos}
            onSaveItem={saveMagItem} onDeleteItem={deleteMagItem}
            onMovimento={registraMovimento} loading={magLoading} cats={cats}
            bodegaRestanti={plan.remaining("bodega", magItems.length)}
            onPaywall={(f) => setPaywallFeature(f)} isPro={plan.isPro}
          />
        );

      case "personal":
        return <TabGestionPersonal workspaceId={workspace?.id} onToast={showToast} isTeam={workspace?.plan === "empresa"} />;

      case "sii":
        return <TabSII proyectos={proyectos} workspaceId={workspace?.id} t={t} onToast={showToast} />;

      case "diseno":
        return <TabDiseno workspaceId={workspace?.id} proyectoId={currentId} proyectoNombre={proyState.info?.descripcion || ""} onToast={showToast} isPro={plan.isPro} plan={plan} onRendersReady={setAiRenders} />;

      case "calcolatore":
        return (
          <TabCalcolatore
            listino={listino} cats={cats} onToast={showToast}
            addPartida={addPartida}
            canAdd={() => plan.canAdd("calcoli", 0)}
            calcRestanti={plan.remaining("calcoli", 0)}
            onPaywall={(f) => setPaywallFeature(f)}
          />
        );

      case "reporte":
        return <TabReporteMensual proyectos={proyectos} fatture={fatture} workspace={workspace} firme={[]} />;
      case "export_contable":
        return <TabExportContable proyectos={proyectos} workspace={workspace} plan={plan} onPaywall={(f) => setPaywallFeature(f)} />;

      case "help":
        return <TabHelp t={t} />;

      case "piani":
        return <TabPiani workspace={workspace} />;

      case "clientes":
        return (
          <TabClientes
            workspace={workspace}
            proyectos={proyectos}
            plan={plan}
            user={user}
            onPaywall={(f) => setPaywallFeature(f)}
            onToast={showToast}
            onAskNova={(msg) => {
              agente.setOpen(true);
              setTimeout(() => agente.sendMessage(msg), 300);
            }}
          />
        );

      case "contratos":
        return (
          <TabContratos
            proyState={proyState}
            workspace={workspace}
            plan={plan}
            user={user}
            onPaywall={(f) => setPaywallFeature(f)}
            onToast={showToast}
            onAskNova={(msg) => {
              agente.setOpen(true);
              setTimeout(() => agente.sendMessage(msg), 300);
            }}
          />
        );

      case "admin":
        return <AdminDashboard userEmail={user?.email} />;

      case "settings":
        return (
          <TabSettings
            workspace={workspace} members={members} myRole={myRole} can={can}
            onInvite={(email, role) => inviteMember(email, role, workspace?.id)}
            onChangeRole={changeMemberRole} onRemoveMember={removeMember}
            onUpdateName={updateWorkspaceName}
            onGoToPiani={() => setActiveTab("piani")}
            user={user} onToast={showToast} onBackup={handleBackup}
            onRequestPush={requestPushPermission} pushPermission={pushPermission}
          />
        );

      default:
        return <TabDashboard proyectos={proyectos} partidas={proyState.partidas} cats={cats} t={t} onOpenProject={openProject} onNewProject={handleNewProject} plan={plan} proyectosRestantes={plan.proyectosRestantes} onUpgrade={() => setActiveTab("piani")} itemsInAlert={itemsInAlert} currentId={currentId} isMobile={isMobile} wizardProyectos={wizardProyectos} wizardLink={workspace?.id ? `${window.location.origin}/presupuesto/${workspace.id}` : null} />;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Layout
  // ─────────────────────────────────────────────────────────────────────────
  const NAV = [
    { id: "dashboard",    label: t.dashboard    || "Dashboard",     icon: "🏠" },
    { id: "proyectos",    label: t.proyectos    || "Cotizaciones",  icon: "📁" },
    { id: "proyecto",     label: t.proyecto     || "Proyecto",      icon: "📄" },
    { id: "costos",       label: t.costos       || "Costos",        icon: "💰" },
    { id: "resumen",      label: t.resumen      || "Resumen",       icon: "📊" },
    { id: "vistacliente", label: "Vista Cliente",                   icon: "👁️" },
    { id: "listino",      label: t.listino      || "Lista de Precios", icon: "📋" },
    { id: "calcolatore",  label: t.calcolatore  || "Calculadora",   icon: "🧮" },
    { id: "kits",         label: t.kits         || "Kits",          icon: "📦" },
    { id: "magazzino",    label: t.magazzino    || "Bodega",        icon: "🏭" },
    { id: "personal",     label: t.personal     || "Personal",      icon: "👷" },
    { id: "diseno",       label: "Diseño AI",                       icon: "🎨" },
    { id: "agenda",       label: t.agenda       || "Agenda",        icon: "📅" },
    { id: "planificacion", label: "Planificación",                    icon: "🗂️" },
    { id: "fatture",      label: t.fatture      || "Facturas",      icon: "🧾" },
    { id: "sii",          label: "SII / DTE",                       icon: "🏛️" },
    { id: "export_contable", label: "Export Contable",              icon: "📊" },
    { id: "reporte",      label: "Reporte",                         icon: "📈" },
    { id: "storico",      label: t.storico      || "Histórico",     icon: "🕐" },
    { id: "help",         label: "Ayuda",                           icon: "❓" },
    { id: "piani",        label: t.piani        || "Planes",        icon: "⭐" },
    { id: "clientes",     label: "Clientes",                        icon: "🤝" },
    { id: "contratos",    label: "Contratos",                       icon: "📋" },
    { id: "settings",     label: t.impostazioni || "Ajustes",       icon: "⚙️" },
    ...(["francescomelega.cl@gmail.com", "melegaf@gmail.com"].includes(user?.email)
      ? [{ id: "admin", label: "Admin", icon: "🛡️" }]
      : []),
  ];

  const sideW = isMobile
    ? (isSidebarOpen ? 220 : 0)
    : (isSidebarOpen ? 220 : 56);

  return (
    <div style={{ minHeight: "100vh", background: "#f7fafc", display: "flex", fontFamily: "'Segoe UI',system-ui,sans-serif", overflowX: "hidden" }}>

      {/* Sidebar */}
      <aside id="app-sidebar" className={`no-print${isMobile ? " sidebar-hidden" : ""}`} style={{ width: sideW, minHeight: "100vh", background: "#1a365d", color: "white", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 30, transition: "width .2s ease", overflowX: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "14px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,.1)", minHeight: 54 }}>
          {isSidebarOpen && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <img src={LOGO_LIGHT_URL} alt="Obra Nova" style={{ height: 28 }} onError={e => e.target.style.display = "none"} />
              <span style={{ fontWeight: 800, fontSize: 13, whiteSpace: "nowrap", letterSpacing: -0.3 }}>OBRA<span style={{ color: "#d69e2e" }}>NOVA</span></span>
            </div>
          )}
          <button onClick={() => setIsSidebarOpen(v => !v)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: 4, borderRadius: 6, flexShrink: 0 }}>
            {isSidebarOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>

        {/* Workspace info */}
        {isSidebarOpen && workspace && (
          <div style={{ margin: "8px 8px 0", padding: "7px 9px", background: "rgba(255,255,255,.08)", borderRadius: 7 }}>
            <div style={{ fontWeight: 700, color: "white", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{workspace.name}</div>
            <div style={{ fontSize: 11, color: "#a0aec0", marginTop: 1, textTransform: "capitalize" }}>{workspace.plan || "free"} · {myRole}</div>
          </div>
        )}

        {/* Nuevo proyecto */}
        <div style={{ padding: "8px 6px 2px" }}>
          <button onClick={handleNewProject} style={{ width: "100%", display: "flex", alignItems: "center", gap: 7, padding: isSidebarOpen ? "8px 9px" : "8px 0", justifyContent: isSidebarOpen ? "flex-start" : "center", background: "#276749", border: "none", color: "white", borderRadius: 7, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
            <PlusCircle size={15} />
            {isSidebarOpen && <span>Nuevo proyecto</span>}
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: "2px 6px", overflowY: "auto" }}>
          {NAV.map(item => (
            <button key={item.id}
              onClick={() => { setActiveTab(item.id); if (isMobile) setIsSidebarOpen(false); }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 7, padding: isSidebarOpen ? "7px 9px" : "7px 0", justifyContent: isSidebarOpen ? "flex-start" : "center", background: activeTab === item.id ? "rgba(255,255,255,.15)" : "none", border: "none", color: activeTab === item.id ? "white" : "#a0aec0", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: activeTab === item.id ? 700 : 400, marginBottom: 1 }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
              {isSidebarOpen && <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: "6px", borderTop: "1px solid rgba(255,255,255,.1)" }}>
          {workspace?.id && isSidebarOpen && (
            <button onClick={() => window.open(`${window.location.origin}/portfolio/${workspace.id}`, "_blank")} style={{ width: "100%", display: "flex", alignItems: "center", gap: 7, padding: "7px 9px", justifyContent: "flex-start", background: "rgba(255,255,255,.05)", border: "none", color: "#d69e2e", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              <span style={{ fontSize: 14 }}>🎨</span>
              <span>Mi Portfolio AI</span>
            </button>
          )}
          <button onClick={() => setShowNotifiche(v => !v)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 7, padding: isSidebarOpen ? "7px 9px" : "7px 0", justifyContent: isSidebarOpen ? "flex-start" : "center", background: "none", border: "none", color: "#a0aec0", borderRadius: 7, cursor: "pointer", fontSize: 12, position: "relative" }}>
            <Bell size={15} />
            {unreadCount > 0 && <span style={{ position: "absolute", top: 3, left: isSidebarOpen ? 18 : 12, background: "#e53e3e", color: "white", borderRadius: "50%", width: 15, height: 15, fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
            {isSidebarOpen && <span>Notificaciones</span>}
          </button>
          <button onClick={handleLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 7, padding: isSidebarOpen ? "7px 9px" : "7px 0", justifyContent: isSidebarOpen ? "flex-start" : "center", background: "none", border: "none", color: "#fc8181", borderRadius: 7, cursor: "pointer", fontSize: 12 }}>
            <LogOut size={15} />
            {isSidebarOpen && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* Overlay mobile — sidebar replaced by bottom nav on mobile */}

      {/* Main */}
      <main style={{ flex: 1, marginLeft: isMobile ? 0 : sideW, minHeight: "100vh", transition: "margin-left .2s ease", overflowX: "hidden", boxSizing: "border-box", width: isMobile ? "100%" : `calc(100% - ${sideW}px)`, maxWidth: "100vw", paddingBottom: isMobile ? 68 : 0 }}>
        {/* Header barra con bottone Guardar — visibile su tab che hanno un progetto aperto */}
        {currentId && ["proyecto","costos","resumen","vistacliente","diseno"].includes(activeTab) && (
          <div className="no-print" style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 10, padding: isMobile ? "10px 12px 0" : "12px 20px 0",
            boxSizing: "border-box",
          }}>
            <button
              onClick={() => { setCurrentId(null); setActiveTab("proyectos"); }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 9,
                background: "rgba(26,54,93,.08)",
                border: "1px solid rgba(26,54,93,.15)",
                color: "#1a365d",
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                transition: "background .15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(26,54,93,.15)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(26,54,93,.08)"}
            >
              <ArrowLeft size={15} />
              Volver
            </button>
            <button
              onClick={async () => {
                if (!currentId || !workspace?.id) return;
                try {
                  await saveProyecto(currentId, proyState);
                  showToast("✅ Guardado correctamente");
                } catch (e) {
                  showToast("❌ Error al guardar: " + e.message);
                }
              }}
              disabled={guardando}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "8px 18px", borderRadius: 9,
                background: guardando ? "#a0aec0" : "#276749",
                border: "none", color: "white",
                fontSize: 13, fontWeight: 700, cursor: guardando ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(39,103,73,.25)",
                transition: "background .15s",
              }}
            >
              {guardando ? "⏳ Guardando..." : "💾 Guardar"}
            </button>
          </div>
        )}
        {/* Wrapper padding mobile — il dashboard gestisce il suo internamente */}
        <div style={isMobile && activeTab !== "dashboard" ? { padding: "12px 12px 0", boxSizing: "border-box" } : {}}>
          <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#718096", fontSize: 14 }}>Cargando...</div>}>
            {renderTab()}
          </Suspense>
        </div>
      </main>

      {/* ── Bottom Navigation Mobile ───────────────────────────────── */}
      {isMobile && (
        <>
          <nav style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
            background: "#1a365d", borderTop: "1px solid rgba(255,255,255,.12)",
            display: "flex", alignItems: "stretch",
            height: 58, paddingBottom: "env(safe-area-inset-bottom)",
          }}>
            {[
              { id: "dashboard", label: "Inicio",    icon: "🏠" },
              { id: "proyectos", label: "Cotiz.",     icon: "📁" },
              { id: "costos",    label: "Costos",     icon: "💰" },
              { id: "listino",   label: "Precios",    icon: "📋" },
            ].map(item => (
              <button key={item.id}
                onClick={() => { setActiveTab(item.id); setShowMobileMenu(false); }}
                style={{
                  flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", gap: 2, background: "none", border: "none",
                  color: activeTab === item.id ? "#d69e2e" : "rgba(255,255,255,.55)",
                  cursor: "pointer", padding: "6px 4px", position: "relative",
                  borderTop: activeTab === item.id ? "2px solid #d69e2e" : "2px solid transparent",
                  transition: "color .15s", overflow: "hidden",
                }}
              >
                <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span>
                <span style={{ fontSize: 9, fontWeight: activeTab === item.id ? 700 : 500,
                  letterSpacing: .2, whiteSpace: "nowrap", overflow: "hidden",
                  textOverflow: "ellipsis", maxWidth: "100%" }}>{item.label}</span>
              </button>
            ))}

            {/* Más — hamburger */}
            <button
              onClick={() => setShowMobileMenu(v => !v)}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: 2, background: "none", border: "none",
                color: showMobileMenu ? "#d69e2e" : "rgba(255,255,255,.55)",
                cursor: "pointer", padding: "6px 0",
                borderTop: showMobileMenu ? "2px solid #d69e2e" : "2px solid transparent",
                position: "relative",
              }}
            >
              {unreadCount > 0 && (
                <span style={{ position: "absolute", top: 6, right: "calc(50% - 16px)", background: "#e53e3e", color: "white", borderRadius: "50%", width: 14, height: 14, fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
              <span style={{ fontSize: 18, lineHeight: 1 }}>☰</span>
              <span style={{ fontSize: 9, fontWeight: 500, letterSpacing: .2 }}>Más</span>
            </button>
          </nav>

          {/* Mobile menu drawer */}
          {showMobileMenu && (
            <>
              <div onClick={() => setShowMobileMenu(false)}
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 39 }} />
              <div style={{
                position: "fixed", bottom: 58, left: 0, right: 0, zIndex: 40,
                background: "#1a365d", borderTop: "1px solid rgba(255,255,255,.15)",
                borderRadius: "16px 16px 0 0", padding: "12px 8px 8px",
                maxHeight: "70vh", overflowY: "auto",
              }}>
                {/* Workspace info */}
                {workspace && (
                  <div style={{ margin: "0 8px 10px", padding: "8px 12px", background: "rgba(255,255,255,.08)", borderRadius: 8 }}>
                    <div style={{ fontWeight: 700, color: "white", fontSize: 13 }}>{workspace.name}</div>
                    <div style={{ fontSize: 11, color: "#a0aec0", marginTop: 1, textTransform: "capitalize" }}>{workspace.plan || "free"} · {myRole}</div>
                  </div>
                )}
                {/* New project button */}
                <button onClick={() => { handleNewProject(); setShowMobileMenu(false); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "#276749", border: "none", color: "white", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>
                  <PlusCircle size={15} /> Nuevo proyecto
                </button>
                {/* All nav items in 2-col grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                  {NAV.filter(item => !["dashboard","proyectos","costos","listino"].includes(item.id)).map(item => (
                    <button key={item.id}
                      onClick={() => { setActiveTab(item.id); setShowMobileMenu(false); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
                        background: activeTab === item.id ? "rgba(255,255,255,.15)" : "rgba(255,255,255,.05)",
                        border: "none", color: activeTab === item.id ? "white" : "#a0aec0",
                        borderRadius: 8, cursor: "pointer", fontSize: 12,
                        fontWeight: activeTab === item.id ? 700 : 400, textAlign: "left",
                      }}>
                      <span style={{ fontSize: 15 }}>{item.icon}</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
                    </button>
                  ))}
                </div>
                {/* Notifiche + logout */}
                <div style={{ display: "flex", gap: 8, marginTop: 8, padding: "0 4px" }}>
                  <button onClick={() => { setShowNotifiche(v => !v); setShowMobileMenu(false); }}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", background: "rgba(255,255,255,.08)", border: "none", color: "#a0aec0", borderRadius: 8, cursor: "pointer", fontSize: 12, position: "relative" }}>
                    <Bell size={14} /> Notif.
                    {unreadCount > 0 && <span style={{ background: "#e53e3e", color: "white", borderRadius: "50%", width: 16, height: 16, fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{unreadCount}</span>}
                  </button>
                  <button onClick={() => { handleLogout(); setShowMobileMenu(false); }}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", background: "rgba(255,255,255,.08)", border: "none", color: "#fc8181", borderRadius: 8, cursor: "pointer", fontSize: 12 }}>
                    <LogOut size={14} /> Salir
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {showNotifiche && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setShowNotifiche(false); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.3)", zIndex: 8000, display: "flex", justifyContent: "flex-end", alignItems: "flex-start", padding: isMobile ? "0" : "60px 16px 0 0" }}>
          <div style={{ width: isMobile ? "100%" : 360, maxHeight: isMobile ? "100vh" : "calc(100vh - 80px)", background: "white", borderRadius: isMobile ? 0 : 14, boxShadow: "0 8px 40px rgba(0,0,0,.18)", overflowY: "auto" }}>
            <NotifichePanel
                notifiche={notifiche}
                unreadCount={unreadCount}
                lastSeenAt={lastSeenAt}
                onClose={() => setShowNotifiche(false)}
                onMarkRead={markAllRead}
                onNavigate={(proyectoId) => {
                  if (proyectoId) openProject(proyectoId);
                  setShowNotifiche(false);
                }}
              />
          </div>
        </div>
      )}
      <AgenteIA
        {...agente}
        activeTab={activeTab}
        hasProject={!!currentId}
        plan={plan?.plan}
        proyState={proyState}
        novaLimitReached={agente.novaLimitReached}
        setNovaLimitReached={agente.setNovaLimitReached}
        novaLimitInfo={agente.novaLimitInfo}
        novaCredits={agente.novaCredits}
        onInsertPartidas={(partidas) => {
          partidas.forEach(p => addPartida(p));
          setActiveTab("costos");
          showToast(`✅ ${partidas.length} partidas insertadas en Costos`);
          agente.trackAcceptPartidas?.(partidas.length);
        }}
        onInsertCronograma={async (tasks) => {
          if (!currentId || !workspace?.id) {
            showToast("❌ Abre un proyecto primero"); return;
          }
          try {
            const { addDoc, collection, serverTimestamp } = await import("firebase/firestore");
            const { db } = await import("./lib/firebase");
            const ref = collection(db, "workspaces", workspace.id, "proyectos", currentId, "tasks");
            await Promise.all(tasks.map(t => addDoc(ref, {
              titulo:         t.titulo      || "Tarea",
              descripcion:    t.descripcion || "",
              estado:         "todo",
              categoria:      t.categoria   || "",
              fechaInicio:    t.fechaInicio || "",
              fechaFin:       t.fechaFin    || "",
              prioridad:      t.prioridad   || "media",
              asignadoA:      "",
              asignadoNombre: "",
              creadoAt:       serverTimestamp(),
            })));
            setActiveTab("planificacion");
            showToast(`✅ ${tasks.length} tareas insertadas en Planificación`);
          } catch(e) {
            showToast("❌ Error al insertar tareas: " + e.message);
          }
        }}
        suggerimento={suggerimento}
        onDismissSuggerimento={dismissSuggerimento}
        onUpgrade={() => setActiveTab("piani")}
      />
      {paywallFeature && <PaywallModal feature={paywallFeature} onGoToPiani={() => { setPaywallFeature(null); setActiveTab("piani"); }} onClose={() => setPaywallFeature(null)} />}
      {showBenchmark && (
        <BenchmarkReport
          partidas={proyState.partidas}
          novaProfile={novaProfile}
          proyectoNombre={proyState.info?.descripcion || ""}
          clienteNombre={proyState.info?.cliente || ""}
          workspaceName={workspace?.name || ""}
          onClose={() => setShowBenchmark(false)}
          onToast={showToast}
        />
      )}
      {showOnboarding && <ModalOnboarding t={t} userName={user?.displayName || user?.email || ""} onClose={() => setShowOnboarding(false)} onFinish={async (data) => {
        try {
          if (workspace?.id) {
            const { doc: fdoc, updateDoc } = await import("firebase/firestore");
            const { db: _db } = await import("./lib/firebase");
            await updateDoc(fdoc(_db, "workspaces", workspace.id), {
              comuna: data.comuna || "",
              "waConfig.ownerPhone": data.telefono || "",
              updatedAt: new Date().toISOString(),
            });
          }
        } catch (e) { console.warn("onboarding save:", e.message); }
        setShowOnboarding(false);
      }} />}
      <ToastContainer toasts={toasts} />
    </div>
  );
}



