// ─── hooks/useMercadoLibre.js ─────────────────────────────────────────────────
import { useState, useCallback, useRef } from "react";
import { doc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

const ML_ENDPOINT = "/.netlify/functions/ml-search";

export const ML_CATS = [
  { id: "",         label: "Tutto" },
  { id: "MLC1574",  label: "Construcción" },
  { id: "MLC1500",  label: "Ferretería" },
  { id: "MLC1580",  label: "Pintura" },
  { id: "MLC1648",  label: "Tuberías" },
  { id: "MLC1646",  label: "Electricidad" },
  { id: "MLC1649",  label: "Pisos" },
];

export function useMercadoLibre({ lang = "es", workspaceId, onToast } = {}) {
  const [risultati,     setRisultati]     = useState([]);
  const [caricando,     setCaricando]     = useState(false);
  const [errore,        setErrore]        = useState(null);
  const [prezziSalvati, setPrezziSalvati] = useState([]);
  const abortRef = useRef(null);

  const base = workspaceId ? `workspaces/${workspaceId}/prezzi_ml` : null;

  const cerca = useCallback(async (query, categoria = "") => {
    if (!query?.trim()) return;
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setCaricando(true); setErrore(null); setRisultati([]);
    try {
      let url = `${ML_ENDPOINT}?q=${encodeURIComponent(query)}&limit=12`;
      if (categoria) url += `&categoria=${categoria}`;
      const res  = await fetch(url, { signal: abortRef.current.signal });
      if (!res.ok) throw new Error(`Errore ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRisultati(data.results || []);
    } catch (e) {
      if (e.name !== "AbortError") setErrore("Connessione a MercadoLibre fallita");
    } finally { setCaricando(false); }
  }, []);

  const getStats = useCallback((items) => {
    const prezzi = items.map(r => r.precio).filter(Boolean).sort((a, b) => a - b);
    if (!prezzi.length) return null;
    return {
      min:     prezzi[0],
      max:     prezzi[prezzi.length - 1],
      mediana: prezzi[Math.floor(prezzi.length / 2)],
      media:   Math.round(prezzi.reduce((s, p) => s + p, 0) / prezzi.length),
      moneda:  items[0]?.moneda || "CLP",
    };
  }, []);

  const salvaPrezzo = useCallback(async (item) => {
    if (!base) return;
    try {
      const ref  = doc(collection(db, base));
      const dati = { mlId: item.id, titulo: item.titulo, precio: item.precio, moneda: item.moneda || "CLP", link: item.link, thumbnail: item.thumbnail, aggiornatoAt: new Date().toISOString() };
      await setDoc(ref, dati);
      setPrezziSalvati(ps => [{ id: ref.id, ...dati }, ...ps.filter(p => p.mlId !== item.id)]);
      onToast?.("💾 Prezzo salvato nel listino");
    } catch (e) { onToast?.("⚠️ " + e.message); }
  }, [base, onToast]);

  const loadPrezziSalvati = useCallback(async () => {
    if (!base) return;
    try {
      const snap = await getDocs(collection(db, base));
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.aggiornatoAt || "").localeCompare(a.aggiornatoAt || ""));
      setPrezziSalvati(list);
    } catch (e) { console.error("loadPrezziSalvati:", e); }
  }, [base]);

  const eliminaPrezzo = useCallback(async (id) => {
    if (!base) return;
    try {
      await deleteDoc(doc(db, base, id));
      setPrezziSalvati(ps => ps.filter(p => p.id !== id));
      onToast?.("🗑️ Rimosso dal listino");
    } catch (e) { onToast?.("⚠️ " + e.message); }
  }, [base, onToast]);

  const fmtP = useCallback((precio, moneda = "CLP") => {
    const sim = { CLP: "$", USD: "US$", ARS: "AR$", BRL: "R$" };
    return `${sim[moneda] || "$"} ${Number(precio).toLocaleString("es-CL", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }, []);

  return { risultati, caricando, errore, prezziSalvati, cerca, getStats, salvaPrezzo, loadPrezziSalvati, eliminaPrezzo, fmtP };
}