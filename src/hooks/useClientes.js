// ─── hooks/useClientes.js ─────────────────────────────────────────────────────
// CRM — gestione clienti per workspace.
// Free  : solo lettura clienti derivati dai proyectos (no salvataggio)
// Pro   : lista clienti (max 10, no kanban, no note, no export)
// Empresa: CRM completo — kanban, note, follow-up, export CSV
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import {
  collection, onSnapshot, doc,
  addDoc, updateDoc, deleteDoc,
  serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { handleError } from "../utils/errorHandler";

export const ESTADOS_CRM = ["lead", "cotizacion", "negociacion", "cerrado", "perdido"];

export const ESTADO_LABELS = {
  lead:        "Lead",
  cotizacion:  "Cotización",
  negociacion: "Negociación",
  cerrado:     "Cerrado",
  perdido:     "Perdido",
};

export const ESTADO_COLORS = {
  lead:        { bg: "#E6F1FB", color: "#0C447C" },
  cotizacion:  { bg: "#FAEEDA", color: "#633806" },
  negociacion: { bg: "#EEEDFE", color: "#3C3489" },
  cerrado:     { bg: "#EAF3DE", color: "#27500A" },
  perdido:     { bg: "#FCEBEB", color: "#791F1F" },
};

// Deriva clienti unici dai proyectos esistenti (usato per Free e come seed)
export function deriveClientesFromProyectos(proyectos = []) {
  const map = new Map();
  for (const p of proyectos) {
    const nombre = p.info?.cliente || p.cliente || "";
    if (!nombre.trim()) continue;
    const key = nombre.trim().toLowerCase();
    if (!map.has(key)) {
      map.set(key, {
        id:               key,
        nombre:           nombre.trim(),
        empresa:          "",
        email:            p.info?.email || "",
        telefono:         p.info?.telefono || "",
        ciudad:           p.info?.ciudad || "",
        estado:           "lead",
        proyectosIds:     [p.id],
        valorTotal:       0,
        notas:            [],
        proximoContacto:  null,
        derived:          true,
      });
    } else {
      map.get(key).proyectosIds.push(p.id);
    }
  }
  return Array.from(map.values());
}

export function useClientes({ workspaceId, proyectos = [], plan } = {}) {
  const [clientes,  setClientes]  = useState([]);
  const [cargando,  setCargando]  = useState(true);
  const [error,     setError]     = useState(null);

  const isEmpresa = plan?.plan === "empresa";
  const isPro     = plan?.isPro;

  // Firestore real-time listener (solo Pro+)
  useEffect(() => {
    if (!workspaceId || !isPro) {
      // Free: deriva dai proyectos, zero Firestore
      setClientes(deriveClientesFromProyectos(proyectos));
      setCargando(false);
      return;
    }

    setCargando(true);
    const ref = collection(db, "workspaces", workspaceId, "clientes");
    const q   = query(ref, orderBy("creadoAt", "desc"));

    const unsub = onSnapshot(q,
      (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Merge con clienti derivati dai proyectos non ancora nel CRM
        const derived = deriveClientesFromProyectos(proyectos);
        const existing = new Set(data.map(c => c.nombre?.trim().toLowerCase()));
        const merged = [
          ...data,
          ...derived.filter(d => !existing.has(d.nombre?.trim().toLowerCase())),
        ];
        setClientes(merged);
        setCargando(false);
      },
      (err) => { handleError(err, { context: "onSnapshot:clientes" }); setError(err.message); setCargando(false); }
    );
    return unsub;
  }, [workspaceId, isPro, proyectos.length]);

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const addCliente = useCallback(async (data) => {
    if (!workspaceId || !isEmpresa) return null;
    const ref = collection(db, "workspaces", workspaceId, "clientes");
    const doc = await addDoc(ref, {
      nombre:          data.nombre    || "",
      empresa:         data.empresa   || "",
      email:           data.email     || "",
      telefono:        data.telefono  || "",
      ciudad:          data.ciudad    || "",
      estado:          data.estado    || "lead",
      proyectosIds:    data.proyectosIds || [],
      notas:           [],
      proximoContacto: data.proximoContacto || null,
      valorTotal:      data.valorTotal || 0,
      creadoAt:        serverTimestamp(),
      updatedAt:       serverTimestamp(),
    });
    return doc.id;
  }, [workspaceId, isEmpresa]);

  const updateCliente = useCallback(async (clienteId, data) => {
    if (!workspaceId || !isPro) return;
    const ref = doc(db, "workspaces", workspaceId, "clientes", clienteId);
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
  }, [workspaceId, isPro]);

  const deleteCliente = useCallback(async (clienteId) => {
    if (!workspaceId || !isEmpresa) return;
    await deleteDoc(doc(db, "workspaces", workspaceId, "clientes", clienteId));
  }, [workspaceId, isEmpresa]);

  const addNota = useCallback(async (clienteId, texto, userId) => {
    if (!workspaceId || !isEmpresa) return;
    const cliente = clientes.find(c => c.id === clienteId);
    if (!cliente) return;
    const notas = [...(cliente.notas || []), {
      texto, userId,
      fecha: new Date().toISOString(),
    }];
    await updateCliente(clienteId, { notas });
  }, [workspaceId, isEmpresa, clientes, updateCliente]);

  const updateEstado = useCallback(async (clienteId, estado) => {
    if (!workspaceId || !isPro) return;
    await updateCliente(clienteId, { estado });
  }, [workspaceId, isPro, updateCliente]);

  // Export CSV (Empresa only)
  const exportCSV = useCallback(() => {
    if (!isEmpresa) return;
    const headers = ["Nombre","Empresa","Email","Teléfono","Ciudad","Estado","Valor Total","Próximo Contacto"];
    const rows = clientes.map(c => [
      c.nombre, c.empresa, c.email, c.telefono, c.ciudad,
      ESTADO_LABELS[c.estado] || c.estado,
      c.valorTotal || 0,
      c.proximoContacto || "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "clientes_obranova.csv"; a.click();
    URL.revokeObjectURL(url);
  }, [isEmpresa, clientes]);

  // Metriche pipeline
  const metriche = (() => {
    const total    = clientes.length;
    const cerrados = clientes.filter(c => c.estado === "cerrado").length;
    const enviados = clientes.filter(c => ["cotizacion","negociacion","cerrado"].includes(c.estado)).length;
    const pipeline = clientes.reduce((s, c) => s + (parseFloat(c.valorTotal) || 0), 0);
    const conversion = enviados > 0 ? Math.round((cerrados / enviados) * 100) : 0;
    const ticketMedio = cerrados > 0
      ? clientes.filter(c => c.estado === "cerrado").reduce((s,c) => s + (parseFloat(c.valorTotal)||0), 0) / cerrados
      : 0;
    const followUpPendientes = clientes.filter(c => {
      if (!c.proximoContacto) return false;
      return new Date(c.proximoContacto) <= new Date();
    }).length;
    return { total, cerrados, pipeline, conversion, ticketMedio, followUpPendientes };
  })();

  return {
    clientes,
    cargando,
    error,
    metriche,
    addCliente,
    updateCliente,
    deleteCliente,
    addNota,
    updateEstado,
    exportCSV,
  };
}
