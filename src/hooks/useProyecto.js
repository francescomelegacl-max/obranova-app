// ─── hooks/useProyecto.js ────────────────────────────────────────────────────
// Sostituisce i ~15 useState separati con un singolo useReducer.
// Vantaggi:
//   - Un solo re-render per ogni operazione complessa (loadProject, newProject)
//   - Logica centralizzata e testabile
//   - Dipendenze dell'autosave più chiare

import { useReducer, useCallback } from "react";
import { DEFAULT_CATS } from "../utils/constants";
import { todayStr } from "../utils/helpers";

/** Stato iniziale di un progetto vuoto */
export const mkVacioState = () => ({
  info: {
    cliente: "", descripcion: "", referencia: "",
    direccion: "", ciudad: "Coquimbo",
    fecha: todayStr(), fechaInicio: "", fechaTermino: "",
    telefono: "", email: "",
  },
  partidas: [
    { id: 1, cat: "Obra Gruesa",    nombre: "Excavación y fundaciones",  unidad: "m²", cant: 0, pu: 0, visible: true, proveedor: "", nota: "" },
    { id: 2, cat: "Obra Gruesa",    nombre: "Radier",                     unidad: "m²", cant: 0, pu: 0, visible: true, proveedor: "", nota: "" },
    { id: 3, cat: "Obra Gruesa",    nombre: "Estructura muros y pilares", unidad: "m²", cant: 0, pu: 0, visible: true, proveedor: "", nota: "" },
    { id: 4, cat: "Instalaciones",  nombre: "Instalación eléctrica",      unidad: "gl", cant: 1, pu: 0, visible: true, proveedor: "", nota: "" },
    { id: 5, cat: "Instalaciones",  nombre: "Gasfitería / Sanitario",     unidad: "gl", cant: 1, pu: 0, visible: true, proveedor: "", nota: "" },
    { id: 6, cat: "Terminaciones",  nombre: "Revestimientos y cerámica",  unidad: "m²", cant: 0, pu: 0, visible: true, proveedor: "", nota: "" },
    { id: 7, cat: "Terminaciones",  nombre: "Pintura interior/exterior",  unidad: "m²", cant: 0, pu: 0, visible: true, proveedor: "", nota: "" },
  ],
  pct: { ci: 10, gf: 5, imprevistos: 5, utilidad: 10 },
  estado: "Borrador",
  catVis: {},
  fotos: [],
  validez: 30,
  iva: true,
  condPago: "cuotas",
  cuotas: [{ monto: 0, fecha: "", desc: "Pie" }],
  condPagoPersonalizado: "",
  currentId: null,
});

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {

    case "LOAD_PROJECT": {
      const p = action.payload;
      return {
        ...state,
        info:                 p.info                 || mkVacioState().info,
        partidas:             (p.partidas            || mkVacioState().partidas).map(x => ({ ...x, id: x.id || Date.now() + Math.random() })),
        pct:                  p.pct                  || mkVacioState().pct,
        estado:               p.estado               || "Borrador",
        fotos:                p.fotos                || [],
        validez:              p.validez              ?? 30,
        iva:                  p.iva                  !== undefined ? p.iva : true,
        condPago:             p.condPago             || "cuotas",
        cuotas:               p.cuotas               || [{ monto: 0, fecha: "", desc: "Pie" }],
        condPagoPersonalizado:p.condPagoPersonalizado|| "",
        catVis:               p.catVis               || {},
        currentId:            p.id,
      };
    }

    case "NEW_PROJECT":
      return { ...mkVacioState(), currentId: action.payload };

    case "SET_INFO":
      return { ...state, info: { ...state.info, ...action.payload } };

    case "SET_PCT":
      return { ...state, pct: { ...state.pct, ...action.payload } };

    case "SET_ESTADO":
      return { ...state, estado: action.payload };

    case "SET_IVA":
      return { ...state, iva: action.payload };

    case "SET_VALIDEZ":
      return { ...state, validez: action.payload };

    case "SET_COND_PAGO":
      return { ...state, condPago: action.payload };

    case "SET_COND_PAGO_PERSONALIZADO":
      return { ...state, condPagoPersonalizado: action.payload };

    case "SET_CUOTAS":
      return { ...state, cuotas: action.payload };

    case "SET_CAT_VIS": {
      const { cat, key, value } = action.payload;
      const prev = state.catVis[cat] || { visible: true, modo: "detalle" };
      return { ...state, catVis: { ...state.catVis, [cat]: { ...prev, [key]: value } } };
    }

    case "SET_FOTOS":
      return { ...state, fotos: action.payload };

    // ── Partidas ──────────────────────────────────────────────────────────────

    case "ADD_PARTIDA":
      return {
        ...state,
        partidas: [...state.partidas, {
          id: Date.now(), cat: action.payload || DEFAULT_CATS[0],
          nombre: "", unidad: "m²", cant: 0, pu: 0,
          visible: true, proveedor: "", nota: "",
        }],
      };

    case "ADD_PARTIDA_FROM_LISTINO":
      return {
        ...state,
        partidas: [...state.partidas, {
          id:        Date.now(),
          listinoId: action.payload.id || null,
          cat:       action.payload.cat      || DEFAULT_CATS[0],
          nombre:    action.payload.nombre,
          unidad:    action.payload.unidad   || "gl",
          cant:      1,
          pu:        action.payload.precioCliente || action.payload.precioCompra || 0,
          visible:   true,
          proveedor: action.payload.proveedor|| "",
          nota:      "",
        }],
      };

    case "UPDATE_PARTIDA":
      return {
        ...state,
        partidas: state.partidas.map(p =>
          p.id !== action.payload.id ? p : {
            ...p,
            [action.payload.key]: (action.payload.key === "cant" || action.payload.key === "pu")
              ? parseFloat(action.payload.value) || 0
              : action.payload.value,
          }
        ),
      };

    case "DELETE_PARTIDA":
      return { ...state, partidas: state.partidas.filter(p => p.id !== action.payload) };

    case "SET_CURRENT_ID":
      return { ...state, currentId: action.payload };

    default:
      return state;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useProyecto() {
  const [state, dispatch] = useReducer(reducer, undefined, mkVacioState);

  const loadProject = useCallback((p) => dispatch({ type: "LOAD_PROJECT", payload: p }), []);

  const setInfo    = useCallback((patch) => dispatch({ type: "SET_INFO",    payload: patch }), []);
  const setPct     = useCallback((patch) => dispatch({ type: "SET_PCT",     payload: patch }), []);
  const setEstado  = useCallback((v)     => dispatch({ type: "SET_ESTADO",  payload: v }),     []);
  const setIva     = useCallback((v)     => dispatch({ type: "SET_IVA",     payload: v }),     []);
  const setValidez = useCallback((v)     => dispatch({ type: "SET_VALIDEZ", payload: v }),     []);
  const setCondPago= useCallback((v)     => dispatch({ type: "SET_COND_PAGO", payload: v }),   []);
  const setCondPagoPersonalizado = useCallback((v) => dispatch({ type: "SET_COND_PAGO_PERSONALIZADO", payload: v }), []);
  const setCuotas  = useCallback((v)     => dispatch({ type: "SET_CUOTAS",  payload: v }),     []);
  const setFotos   = useCallback((v)     => dispatch({ type: "SET_FOTOS",   payload: typeof v === "function" ? v(state.fotos) : v }), [state.fotos]);
  const setCatVisKey = useCallback((cat, key, value) => dispatch({ type: "SET_CAT_VIS", payload: { cat, key, value } }), []);

  const addPartida    = useCallback((cat) => dispatch({ type: "ADD_PARTIDA",             payload: cat }),     []);
  const addFromListino= useCallback((item) => dispatch({ type: "ADD_PARTIDA_FROM_LISTINO", payload: item }), []);
  const updP = useCallback((id, key, value) => dispatch({ type: "UPDATE_PARTIDA", payload: { id, key, value } }), []);
  const delP = useCallback((id) => dispatch({ type: "DELETE_PARTIDA", payload: id }), []);

  const getCatVis = useCallback((cat) => state.catVis[cat] || { visible: true, modo: "detalle" }, [state.catVis]);

  return {
    state,
    dispatch,
    loadProject,
    setInfo, setPct, setEstado, setIva, setValidez,
    setCondPago, setCondPagoPersonalizado, setCuotas,
    setFotos, setCatVisKey, getCatVis,
    addPartida, addFromListino, updP, delP,
  };
}
