// ─── components/tabs/TabDiseno.jsx ───────────────────────────────────────────
// Sprint D — Editor planimetria 2D + Mobiliario + Render AI
// Layer 1: stanze — Layer 2: mobili con sagome realistiche
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useRef, useCallback, useEffect } from "react";
import { Stage, Layer, Rect, Text, Transformer, Line, Circle, Group, Shape } from "react-konva";
import { httpsCallable, getFunctions } from "firebase/functions";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db, app } from "../../lib/firebase";

// ── Palette colori stanze ─────────────────────────────────────────────────────
const ROOM_TYPES = [
  { id: "sala",     label: "Sala",        color: "#bee3f8", border: "#2b6cb0", emoji: "🛋️"  },
  { id: "cocina",   label: "Cocina",      color: "#fefcbf", border: "#d69e2e", emoji: "🍳"  },
  { id: "dormit",   label: "Dormitorio",  color: "#e9d8fd", border: "#6b46c1", emoji: "🛏️"  },
  { id: "baño",     label: "Baño",        color: "#c6f6d5", border: "#276749", emoji: "🚿"  },
  { id: "comedor",  label: "Comedor",     color: "#fed7d7", border: "#c53030", emoji: "🍽️"  },
  { id: "pasillo",  label: "Pasillo",     color: "#e2e8f0", border: "#718096", emoji: "🚶"  },
  { id: "terraza",  label: "Terraza",     color: "#fefce8", border: "#ca8a04", emoji: "🌿"  },
  { id: "garage",   label: "Garage",      color: "#f0f4f8", border: "#4a5568", emoji: "🚗"  },
  { id: "oficina",  label: "Oficina",     color: "#ebf8ff", border: "#2b6cb0", emoji: "🖥️"  },
  { id: "exterior", label: "Exterior",    color: "#f0fff4", border: "#276749", emoji: "🏡"  },
];

// ── ID univoco ────────────────────────────────────────────────────────────────
let _id = 1;
const uid = () => `r${_id++}`;

// ── Catalogo mobili ───────────────────────────────────────────────────────────
const FURNITURE_CAT = [
  { cat:"🍳 Cocina", items:[
    { id:"stove",    label:"Cocina",       emoji:"🔥", w:80,  h:60,  shape:"stove",     color:"#fefcbf", border:"#d69e2e" },
    { id:"sink-k",   label:"Lavaplatos",   emoji:"🚰", w:80,  h:60,  shape:"sink-k",    color:"#ebf8ff", border:"#2b6cb0" },
    { id:"fridge",   label:"Refrigerador", emoji:"❄️", w:60,  h:80,  shape:"rect",      color:"#ebf8ff", border:"#2b6cb0" },
    { id:"counter",  label:"Mesada",       emoji:"▬",  w:160, h:40,  shape:"rect",      color:"#f7fafc", border:"#718096" },
    { id:"isla",     label:"Isla",         emoji:"⬜", w:120, h:80,  shape:"rect",      color:"#f7fafc", border:"#4a5568" },
    { id:"microwave",label:"Microondas",   emoji:"📦", w:50,  h:40,  shape:"rect",      color:"#fefcbf", border:"#d69e2e" },
  ]},
  { cat:"🛋️ Sala", items:[
    { id:"sofa-l",   label:"Sofá L",       emoji:"🛋️", w:160, h:120, shape:"l-sofa",    color:"#bee3f8", border:"#2b6cb0" },
    { id:"sofa",     label:"Sofá",         emoji:"🛋️", w:160, h:60,  shape:"sofa",      color:"#bee3f8", border:"#2b6cb0" },
    { id:"coffee",   label:"Mesa baja",    emoji:"◻️", w:80,  h:60,  shape:"rect",      color:"#fefcbf", border:"#d69e2e" },
    { id:"tv",       label:"TV",           emoji:"📺", w:120, h:20,  shape:"tv",        color:"#2d3748", border:"#1a202c" },
    { id:"tv-unit",  label:"Mueble TV",    emoji:"▬",  w:160, h:40,  shape:"rect",      color:"#e2e8f0", border:"#718096" },
    { id:"armchair", label:"Sillón",       emoji:"🪑", w:60,  h:60,  shape:"armchair",  color:"#bee3f8", border:"#2b6cb0" },
    { id:"rug",      label:"Alfombra",     emoji:"▬",  w:160, h:120, shape:"rect",      color:"#e2e8f0", border:"#a0aec0" },
  ]},
  { cat:"🍽️ Comedor", items:[
    { id:"dining-t", label:"Mesa comedor", emoji:"🍽️", w:140, h:80,  shape:"rect",      color:"#fefcbf", border:"#d69e2e" },
    { id:"dining-r", label:"Mesa redonda", emoji:"🍽️", w:100, h:100, shape:"oval-table", color:"#fefcbf", border:"#d69e2e" },
    { id:"chair-d",  label:"Silla",        emoji:"🪑", w:40,  h:40,  shape:"chair",     color:"#e2e8f0", border:"#718096" },
    { id:"buffet",   label:"Aparador",     emoji:"▬",  w:160, h:40,  shape:"rect",      color:"#fef3c7", border:"#92400e" },
    { id:"vitrina",  label:"Vitrina",      emoji:"🪟", w:120, h:40,  shape:"rect",      color:"#fef3c7", border:"#92400e" },
    { id:"bar",      label:"Barra/Bar",    emoji:"🍸", w:140, h:40,  shape:"rect",      color:"#fefcbf", border:"#b7791f" },
  ]},
  { cat:"🛏️ Dormitorio", items:[
    { id:"bed-d",    label:"Cama doble",   emoji:"🛏️", w:140, h:160, shape:"bed-d",     color:"#e9d8fd", border:"#6b46c1" },
    { id:"bed-s",    label:"Cama 1P",      emoji:"🛏️", w:80,  h:160, shape:"bed-s",     color:"#e9d8fd", border:"#6b46c1" },
    { id:"wardrobe", label:"Armario",      emoji:"🚪", w:160, h:60,  shape:"rect",      color:"#fef3c7", border:"#92400e" },
    { id:"dresser",  label:"Cómoda",       emoji:"▬",  w:80,  h:40,  shape:"rect",      color:"#fef3c7", border:"#92400e" },
    { id:"desk",     label:"Escritorio",   emoji:"🖥️", w:120, h:60,  shape:"desk",      color:"#f0fff4", border:"#276749" },
    { id:"nightstand",label:"Velador",     emoji:"🔲", w:40,  h:40,  shape:"rect",      color:"#fef3c7", border:"#92400e" },
    { id:"mirror",   label:"Espejo",       emoji:"🪞", w:80,  h:20,  shape:"rect",      color:"#e2e8f0", border:"#718096" },
  ]},
  { cat:"🚿 Baño", items:[
    { id:"bathtub",  label:"Bañera",       emoji:"🛁", w:140, h:60,  shape:"bathtub",   color:"#c6f6d5", border:"#276749" },
    { id:"shower",   label:"Ducha",        emoji:"🚿", w:80,  h:80,  shape:"shower",    color:"#c6f6d5", border:"#276749" },
    { id:"toilet",   label:"WC",           emoji:"🚽", w:40,  h:60,  shape:"toilet",    color:"#c6f6d5", border:"#276749" },
    { id:"sink-b",   label:"Lavabo",       emoji:"🪥", w:60,  h:40,  shape:"sink-b",    color:"#c6f6d5", border:"#276749" },
    { id:"bidet",    label:"Bidet",        emoji:"🪣", w:40,  h:60,  shape:"rect",      color:"#c6f6d5", border:"#276749" },
    { id:"jacuzzi",  label:"Hidromasaje",  emoji:"💧", w:120, h:120, shape:"pool",      color:"#bee3f8", border:"#2b6cb0" },
    { id:"vanity",   label:"Mueble baño",  emoji:"▬",  w:100, h:40,  shape:"rect",      color:"#e2e8f0", border:"#718096" },
  ]},
  { cat:"🏢 Oficina", items:[
    { id:"desk-l",   label:"Escritorio L", emoji:"🖥️", w:160, h:120, shape:"l-desk",    color:"#f0fff4", border:"#276749" },
    { id:"chair",    label:"Silla",        emoji:"🪑", w:40,  h:40,  shape:"chair",     color:"#e2e8f0", border:"#718096" },
    { id:"bookshelf",label:"Estantería",   emoji:"📚", w:160, h:30,  shape:"rect",      color:"#fef3c7", border:"#92400e" },
    { id:"meeting",  label:"Mesa reunión", emoji:"🪑", w:160, h:80,  shape:"oval-table",color:"#ebf8ff", border:"#2b6cb0" },
    { id:"filing",   label:"Archivador",   emoji:"🗄️", w:60,  h:40,  shape:"rect",      color:"#e2e8f0", border:"#718096" },
  ]},
  { cat:"🌿 Exterior", items:[
    { id:"table-out",label:"Mesa jardín",  emoji:"🌿", w:80,  h:80,  shape:"oval-table",color:"#fefce8", border:"#ca8a04" },
    { id:"pool",     label:"Piscina",      emoji:"🏊", w:200, h:120, shape:"pool",      color:"#bee3f8", border:"#2b6cb0" },
    { id:"bbq",      label:"BBQ",          emoji:"🔥", w:60,  h:60,  shape:"rect",      color:"#fed7d7", border:"#c53030" },
    { id:"plant",    label:"Planta",       emoji:"🌱", w:40,  h:40,  shape:"circle",    color:"#c6f6d5", border:"#276749" },
    { id:"lounger",  label:"Reposera",     emoji:"🏖️", w:60,  h:140, shape:"rect",      color:"#fefce8", border:"#ca8a04" },
    { id:"parasol",  label:"Sombrilla",    emoji:"⛱️", w:100, h:100, shape:"circle",    color:"#fefce8", border:"#ca8a04" },
    { id:"hammock",  label:"Hamaca",       emoji:"🪢", w:140, h:60,  shape:"rect",      color:"#fefce8", border:"#ca8a04" },
    { id:"fire-pit", label:"Fogata",       emoji:"🔥", w:80,  h:80,  shape:"circle",    color:"#fed7d7", border:"#c53030" },
  ]},
  { cat:"🏠 General", items:[
    { id:"door",     label:"Puerta",       emoji:"🚪", w:80,  h:10,  shape:"rect",      color:"#fef3c7", border:"#92400e" },
    { id:"window",   label:"Ventana",      emoji:"🪟", w:100, h:10,  shape:"rect",      color:"#ebf8ff", border:"#2b6cb0" },
    { id:"stairs",   label:"Escalera",     emoji:"🪜", w:80,  h:160, shape:"rect",      color:"#e2e8f0", border:"#718096" },
    { id:"column",   label:"Pilar",        emoji:"⬜", w:30,  h:30,  shape:"rect",      color:"#e2e8f0", border:"#4a5568" },
    { id:"wall-seg", label:"Muro",         emoji:"▬",  w:160, h:10,  shape:"rect",      color:"#4a5568", border:"#1a202c" },
  ]},
];

const ALL_FURNS = FURNITURE_CAT.flatMap(c => c.items);

const mkFurniture = (furn, x = 120, y = 120) => ({
  id: uid(), kind: "furniture", type: furn.id,
  x: snap(x), y: snap(y), w: furn.w, h: furn.h,
  label: furn.label, rotation: 0,
});

// ── Sagoma mobile realistica ──────────────────────────────────────────────────
function FurnitureShape({ item, selected, onSelect, onChange }) {
  const grpRef = useRef();
  const trRef  = useRef();
  const furn   = ALL_FURNS.find(f => f.id === item.type) || { color:"#e2e8f0", border:"#718096", emoji:"▪️", shape:"rect", label:"" };
  const { w, h } = item;
  const cx = w/2, cy = h/2;
  const sc = selected ? "#2b6cb0" : furn.border;
  const sw = selected ? 2.5 : 1.5;
  const sh = selected ? 10 : 3;

  useEffect(() => {
    if (selected && trRef.current && grpRef.current) {
      trRef.current.nodes([grpRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [selected]);

  const dp = {
    draggable: true,
    onClick:   () => onSelect(item.id),
    onTap:     () => onSelect(item.id),
    onDragEnd: e => onChange(item.id, { x: snap(e.target.x()), y: snap(e.target.y()) }),
    onTransformEnd: () => {
      const n = grpRef.current;
      const sx = n.scaleX();
      const sy = n.scaleY();
      const newW = snap(Math.max(20, item.w * sx));
      const newH = snap(Math.max(20, item.h * sy));
      onChange(item.id, { x: snap(n.x()), y: snap(n.y()), w: newW, h: newH, rotation: n.rotation() });
      n.scaleX(1); n.scaleY(1);
    },
  };

  const lbl = <Text x={4} y={h-14} width={w-8} text={item.label} fontSize={9} fill={furn.border} fontStyle="bold" align="center" listening={false}/>;
  const emj = <Text x={cx-10} y={cy-12} text={furn.emoji} fontSize={18} listening={false}/>;

  const inner = (() => {
    switch (furn.shape) {
      case "l-sofa": return (<><Rect width={w} height={h} fill={furn.color} stroke={sc} strokeWidth={sw} cornerRadius={8} shadowBlur={sh} shadowOpacity={0.18}/><Rect x={4} y={h*0.45} width={w-8} height={h*0.5} fill={furn.border} opacity={0.11} cornerRadius={4}/><Rect x={4} y={4} width={w*0.18} height={h-8} fill={furn.border} opacity={0.17} cornerRadius={4}/><Rect x={4} y={4} width={w-8} height={h*0.38} fill={furn.border} opacity={0.17} cornerRadius={4}/>{emj}{lbl}</>);
      case "sofa": return (<><Rect width={w} height={h} fill={furn.color} stroke={sc} strokeWidth={sw} cornerRadius={6} shadowBlur={sh} shadowOpacity={0.18}/><Rect x={4} y={h*0.5} width={w-8} height={h*0.45} fill={furn.border} opacity={0.11} cornerRadius={4}/><Rect x={4} y={4} width={w*0.12} height={h-8} fill={furn.border} opacity={0.17} cornerRadius={3}/><Rect x={w-w*0.12-4} y={4} width={w*0.12} height={h-8} fill={furn.border} opacity={0.17} cornerRadius={3}/><Rect x={4} y={4} width={w-8} height={h*0.38} fill={furn.border} opacity={0.14} cornerRadius={3}/>{emj}{lbl}</>);
      case "bed-d": return (<><Rect width={w} height={h} fill={furn.color} stroke={sc} strokeWidth={sw} cornerRadius={6} shadowBlur={sh} shadowOpacity={0.18}/><Rect x={0} y={0} width={w} height={h*0.2} fill={furn.border} opacity={0.26} cornerRadius={[6,6,0,0]}/><Rect x={6} y={h*0.22} width={w-12} height={h*0.72} fill="white" opacity={0.52} cornerRadius={4}/><Rect x={10} y={h*0.25} width={w/2-16} height={h*0.18} fill="white" opacity={0.88} cornerRadius={3}/><Rect x={w/2+6} y={h*0.25} width={w/2-16} height={h*0.18} fill="white" opacity={0.88} cornerRadius={3}/><Text x={cx-10} y={cy+6} text={furn.emoji} fontSize={16} listening={false}/>{lbl}</>);
      case "bed-s": return (<><Rect width={w} height={h} fill={furn.color} stroke={sc} strokeWidth={sw} cornerRadius={6} shadowBlur={sh} shadowOpacity={0.18}/><Rect x={0} y={0} width={w} height={h*0.2} fill={furn.border} opacity={0.26} cornerRadius={[6,6,0,0]}/><Rect x={6} y={h*0.22} width={w-12} height={h*0.72} fill="white" opacity={0.52} cornerRadius={4}/><Rect x={8} y={h*0.25} width={w-16} height={h*0.18} fill="white" opacity={0.88} cornerRadius={3}/><Text x={cx-10} y={cy+6} text={furn.emoji} fontSize={16} listening={false}/>{lbl}</>);
      case "bathtub": return (<><Rect width={w} height={h} fill={furn.color} stroke={sc} strokeWidth={sw} cornerRadius={h/2} shadowBlur={sh} shadowOpacity={0.18}/><Rect x={10} y={8} width={w-20} height={h-16} fill="white" opacity={0.48} cornerRadius={h/2-4}/><Circle x={w-16} y={cy} radius={5} fill={furn.border} opacity={0.58}/><Text x={cx-10} y={cy-10} text="🛁" fontSize={18} listening={false}/></>);
      case "shower": return (<><Rect width={w} height={h} fill={furn.color} stroke={sc} strokeWidth={sw} cornerRadius={4} shadowBlur={sh} shadowOpacity={0.18}/><Line points={[0,h*0.6,w*0.4,h*0.6]} stroke={furn.border} strokeWidth={2} opacity={0.45}/><Circle x={w*0.75} y={h*0.25} radius={8} fill={furn.border} opacity={0.22}/><Line points={[w*0.75,h*0.25,w*0.75,h*0.5]} stroke={furn.border} strokeWidth={2} opacity={0.32}/>{emj}{lbl}</>);
      case "toilet": return (<><Rect x={0} y={0} width={w} height={h*0.35} fill={furn.color} stroke={sc} strokeWidth={sw} cornerRadius={3} shadowBlur={sh} shadowOpacity={0.18}/><Shape sceneFunc={(ctx,s)=>{ ctx.beginPath(); ctx.ellipse(cx,h*0.68,w/2-3,h*0.34,0,0,Math.PI*2); ctx.fillStrokeShape(s); }} fill={furn.color} stroke={sc} strokeWidth={sw}/><Shape sceneFunc={(ctx,s)=>{ ctx.beginPath(); ctx.ellipse(cx,h*0.68,w/2-8,h*0.28,0,0,Math.PI*2); ctx.fillStrokeShape(s); }} fill="white" opacity={0.55}/></>);
      case "sink-k": return (<><Rect width={w} height={h} fill={furn.color} stroke={sc} strokeWidth={sw} cornerRadius={3} shadowBlur={sh} shadowOpacity={0.18}/><Rect x={6} y={6} width={w/2-10} height={h-12} fill="white" opacity={0.62} cornerRadius={3}/><Rect x={w/2+4} y={6} width={w/2-10} height={h-12} fill="white" opacity={0.62} cornerRadius={3}/><Circle x={w*0.27} y={cy} radius={3} fill={furn.border} opacity={0.48}/><Circle x={w*0.73} y={cy} radius={3} fill={furn.border} opacity={0.48}/></>);
      case "sink-b": return (<><Shape sceneFunc={(ctx,s)=>{ ctx.beginPath(); ctx.ellipse(cx,cy,w/2-4,h/2-4,0,0,Math.PI*2); ctx.fillStrokeShape(s); }} fill={furn.color} stroke={sc} strokeWidth={sw} shadowBlur={sh} shadowOpacity={0.18}/><Shape sceneFunc={(ctx,s)=>{ ctx.beginPath(); ctx.ellipse(cx,cy,w/2-10,h/2-10,0,0,Math.PI*2); ctx.fillStrokeShape(s); }} fill="white" opacity={0.58}/><Circle x={cx} y={cy} radius={4} fill={furn.border} opacity={0.42}/></>);
      case "stove": return (<><Rect width={w} height={h} fill={furn.color} stroke={sc} strokeWidth={sw} cornerRadius={3} shadowBlur={sh} shadowOpacity={0.18}/>{[[0.25,0.28],[0.75,0.28],[0.25,0.75],[0.75,0.75]].map(([fx,fy],i)=>(<Circle key={i} x={w*fx} y={h*fy} radius={9} fill={furn.border} opacity={0.2}/>))}{[[0.25,0.28],[0.75,0.28],[0.25,0.75],[0.75,0.75]].map(([fx,fy],i)=>(<Circle key={"c"+i} x={w*fx} y={h*fy} radius={5} fill={furn.border} opacity={0.36}/>))}</>);
      case "tv": return (<><Rect width={w} height={h} fill="#2d3748" stroke={sc} strokeWidth={sw} cornerRadius={2} shadowBlur={sh} shadowOpacity={0.28}/><Rect x={3} y={2} width={w-6} height={h-4} fill="#4a5568" opacity={0.52} cornerRadius={1}/></>);
      case "desk": case "l-desk": return (<><Rect width={w} height={h} fill={furn.color} stroke={sc} strokeWidth={sw} cornerRadius={furn.shape==="l-desk"?6:3} shadowBlur={sh} shadowOpacity={0.18}/><Rect x={5} y={5} width={w-10} height={h*(furn.shape==="l-desk"?0.42:0.45)} fill={furn.border} opacity={0.09} cornerRadius={2}/>{furn.shape==="l-desk"&&<Rect x={5} y={h*0.52} width={w*0.45} height={h*0.43} fill={furn.border} opacity={0.09} cornerRadius={2}/>}{emj}{lbl}</>);
      case "armchair": return (<><Rect width={w} height={h} fill={furn.color} stroke={sc} strokeWidth={sw} cornerRadius={8} shadowBlur={sh} shadowOpacity={0.18}/><Rect x={4} y={h*0.5} width={w-8} height={h*0.45} fill={furn.border} opacity={0.11} cornerRadius={4}/><Rect x={4} y={4} width={w*0.18} height={h-8} fill={furn.border} opacity={0.17} cornerRadius={3}/><Rect x={w-w*0.18-4} y={4} width={w*0.18} height={h-8} fill={furn.border} opacity={0.17} cornerRadius={3}/><Text x={cx-8} y={cy-8} text="🪑" fontSize={14} listening={false}/></>);
      case "chair": return (<><Rect width={w} height={h} fill={furn.color} stroke={sc} strokeWidth={sw} cornerRadius={4} shadowBlur={sh} shadowOpacity={0.18}/><Rect x={2} y={2} width={w-4} height={h*0.3} fill={furn.border} opacity={0.26} cornerRadius={2}/><Text x={cx-8} y={cy-6} text="🪑" fontSize={14} listening={false}/></>);
      case "oval-table": return (<><Shape sceneFunc={(ctx,s)=>{ ctx.beginPath(); ctx.ellipse(cx,cy,w/2-4,h/2-4,0,0,Math.PI*2); ctx.fillStrokeShape(s); }} fill={furn.color} stroke={sc} strokeWidth={sw} shadowBlur={sh} shadowOpacity={0.18}/>{emj}{lbl}</>);
      case "pool": return (<><Shape sceneFunc={(ctx,s)=>{ ctx.beginPath(); ctx.ellipse(cx,cy,w/2-4,h/2-4,0,0,Math.PI*2); ctx.fillStrokeShape(s); }} fill="#bee3f8" stroke={sc} strokeWidth={sw} shadowBlur={selected?14:6} shadowColor="#bee3f8" shadowOpacity={0.42}/>{[0.35,0.55,0.72].map((yp,i)=>(<Shape key={i} sceneFunc={(ctx,s)=>{ const y0=h*yp,amp=4,segs=4; ctx.beginPath(); ctx.moveTo(w*0.15,y0); for(let s2=0;s2<segs;s2++){const x1=w*(0.15+(s2+.5)/segs*0.7),x2=w*(0.15+(s2+1)/segs*0.7);ctx.quadraticCurveTo(x1,y0-(s2%2===0?amp:-amp),x2,y0);} ctx.strokeShape(s); }} stroke="#2b6cb0" strokeWidth={1.5} opacity={0.26}/>))}<Text x={cx-12} y={cy-12} text="🏊" fontSize={22} listening={false}/><Text x={4} y={cy+12} width={w-8} text={item.label} fontSize={10} fill="#2b6cb0" fontStyle="bold" align="center" listening={false}/></>);
      case "circle": return (<><Shape sceneFunc={(ctx,s)=>{ ctx.beginPath(); ctx.ellipse(cx,cy,w/2-4,h/2-4,0,0,Math.PI*2); ctx.fillStrokeShape(s); }} fill={furn.color} stroke={sc} strokeWidth={sw} shadowBlur={sh} shadowOpacity={0.18}/>{emj}</>);
      default: return (<><Rect width={w} height={h} fill={furn.color} stroke={sc} strokeWidth={sw} cornerRadius={4} shadowBlur={sh} shadowOpacity={0.18}/>{emj}{lbl}</>);
    }
  })();

  return (<>
    <Group ref={grpRef} x={item.x} y={item.y} rotation={item.rotation||0} {...dp}>{inner}</Group>
    {selected && <Transformer ref={trRef} rotateEnabled={true} keepRatio={true} enabledAnchors={["top-left","top-right","bottom-left","bottom-right"]} boundBoxFunc={(o,n)=>({...n,width:Math.max(20,n.width),height:Math.max(20,n.height)})}/>}
  </>);
}



// ── Griglia di snap ───────────────────────────────────────────────────────────
const GRID = 20;
const snap = v => Math.round(v / GRID) * GRID;

// ── Stanza predefinita ────────────────────────────────────────────────────────
const mkRoom = (type, x = 100, y = 100) => ({
  id: uid(), type: type.id,
  x: snap(x), y: snap(y),
  w: type.id === "baño" ? 120 : type.id === "pasillo" ? 60 : 200,
  h: type.id === "baño" ? 100 : type.id === "pasillo" ? 180 : 160,
  label: type.label,
});

// ── Componente stanza Konva ───────────────────────────────────────────────────
function RoomShape({ room, selected, onSelect, onChange, scale }) {
  const shapeRef  = useRef();
  const trRef     = useRef();
  const type = ROOM_TYPES.find(t => t.id === room.type) || ROOM_TYPES[0];

  useEffect(() => {
    if (selected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [selected]);

  return (
    <>
      <Rect
        ref={shapeRef}
        x={room.x} y={room.y}
        width={room.w} height={room.h}
        fill={type.color}
        stroke={selected ? "#2b6cb0" : type.border}
        strokeWidth={selected ? 2.5 : 1.5}
        cornerRadius={6}
        shadowBlur={selected ? 12 : 4}
        shadowColor={selected ? "#2b6cb0" : "rgba(0,0,0,0.1)"}
        shadowOpacity={selected ? 0.4 : 0.2}
        draggable
        onClick={() => onSelect(room.id)}
        onTap={() => onSelect(room.id)}
        onDragEnd={e => {
          onChange(room.id, {
            x: snap(e.target.x()),
            y: snap(e.target.y()),
          });
        }}
        onTransformEnd={e => {
          const node = shapeRef.current;
          // FIX: leer dimensiones reales ANTES de resetear scale,
          // y forzar scaleX/Y a 1 para que el siguiente render
          // use w/h reales en lugar de width*scale.
          const newW = snap(Math.max(60, node.width()  * node.scaleX()));
          const newH = snap(Math.max(60, node.height() * node.scaleY()));
          const newX = snap(node.x());
          const newY = snap(node.y());
          // Reset transform del nodo Konva PRIMA di chiamare onChange,
          // così il layer si ridisegna con valori coerenti.
          node.scaleX(1);
          node.scaleY(1);
          node.width(newW);
          node.height(newH);
          node.x(newX);
          node.y(newY);
          node.getLayer()?.batchDraw();
          onChange(room.id, { x: newX, y: newY, w: newW, h: newH });
        }}
      />
      <Text
        x={room.x + 8} y={room.y + room.h / 2 - 18}
        width={room.w - 16}
        text={type.emoji}
        fontSize={22}
        align="center"
        listening={false}
      />
      <Text
        x={room.x + 4} y={room.y + room.h / 2 + 6}
        width={room.w - 8}
        text={room.label}
        fontSize={11}
        fontStyle="bold"
        fill={type.border}
        align="center"
        listening={false}
      />
      <Text
        x={room.x + 4} y={room.y + room.h - 18}
        width={room.w - 8}
        text={`${Math.round(room.w / GRID * 0.4)}×${Math.round(room.h / GRID * 0.4)}m`}
        fontSize={9}
        fill="#718096"
        align="center"
        listening={false}
      />
      {selected && (
        <Transformer
          ref={trRef}
          rotateEnabled={true}
          keepRatio={false}
          enabledAnchors={["top-left","top-right","bottom-left","bottom-right","middle-right","middle-left","top-center","bottom-center"]}
          boundBoxFunc={(old, newBox) => ({
            ...newBox,
            width:  Math.max(60, newBox.width),
            height: Math.max(60, newBox.height),
          })}
        />
      )}
    </>
  );
}

// ── Griglia di sfondo ─────────────────────────────────────────────────────────
function GridLines({ width, height }) {
  const lines = [];
  for (let x = 0; x <= width; x += GRID) {
    lines.push(<Line key={`v${x}`} points={[x, 0, x, height]} stroke="#e2e8f0" strokeWidth={0.5} listening={false} />);
  }
  for (let y = 0; y <= height; y += GRID) {
    lines.push(<Line key={`h${y}`} points={[0, y, width, y]} stroke="#e2e8f0" strokeWidth={0.5} listening={false} />);
  }
  return <>{lines}</>;
}

// ── Componente principale ─────────────────────────────────────────────────────
export default function TabDiseno({ workspaceId, proyectoId, proyectoNombre, onToast, isPro, plan, onRendersReady }) {
  const [rooms,      setRooms]      = useState([]);
  const [furniture,  setFurniture]  = useState([]);
  const [selected,   setSelected]   = useState(null);  // { id, layer: 'room'|'furniture' }
  const [activeLayer,setActiveLayer]= useState('room');
  const [openCat,    setOpenCat]    = useState(null);
  const [renderImg,  setRenderImg]  = useState(null); // legacy
  const [renders,     setRenders]     = useState([]); // [{roomType, label, imageUrl, ok}]
  const [activeRender,setActiveRender] = useState(0); // indice render attivo nella galleria
  const [rendering,  setRendering]  = useState(false);
  const [renderStep, setRenderStep] = useState("");
  const [prompt,     setPrompt]     = useState("");
  const [panel,      setPanel]      = useState("editor"); // "editor" | "render"
  const [renderRoom, setRenderRoom] = useState(null); // id stanza selezionata per render, null = tutte
  const [photoFile,   setPhotoFile]   = useState(null);   // File caricato
  const [renderHistory, setRenderHistory] = useState([]); // storico render da Firestore
  const [showHistory, setShowHistory] = useState(false);  // mostra/nascondi storico
  const [photoPreview,setPhotoPreview]= useState(null);   // data URL anteprima
  const [photoBase64, setPhotoBase64] = useState(null);   // base64 per API
  const [renderMode,  setRenderMode]  = useState("plan"); // "plan" | "photo" | "both"
  const [quotaLeft,   setQuotaLeft]   = useState(null);   // render rimanenti mese
  const [beforeAfter, setBeforeAfter] = useState(false);  // slider before/after
  const [baSlider,    setBaSlider]    = useState(50);      // posizione slider 0-100
  const [compareMode, setCompareMode] = useState(false);  // griglia 4 stili
  const [compareRenders, setCompareRenders] = useState([]); // [{style,imageUrl}]
  const [comparingStyles, setComparingStyles] = useState(false);
  const [promptPresets, setPromptPresets] = useState([]); // preset salvati
  const [showPresets,   setShowPresets]   = useState(false);
  const [portadaSaved,  setPortadaSaved]  = useState(false); // feedback portada
  const [standalonePrompt, setStandalonePrompt] = useState("");
  const [standaloneRendering, setStandaloneRendering] = useState(false);
  const [standaloneResult,  setStandaloneResult]  = useState(null); // imageUrl
  const [standaloneStep,    setStandaloneStep]    = useState("");
  const fileInputRef = useRef();
  const stageRef = useRef();
  const CANVAS_W = 800;
  const CANVAS_H = 560;

  // ── Carica preset prompt da Firestore ──────────────────────────────────────
  useEffect(() => {
    if (!workspaceId) return;
    const loadPresets = async () => {
      try {
        const { collection, getDocs: gd, orderBy: ob, query: q } = await import("firebase/firestore");
        const snap = await gd(q(collection(db, "workspaces", workspaceId, "promptPresets"), ob("createdAt","desc")));
        setPromptPresets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch {}
    };
    loadPresets();
  }, [workspaceId]);

  // ── Carica planimetria (rooms + furniture) da Firestore ──────────────────
  useEffect(() => {
    if (!workspaceId || !proyectoId) return;
    const loadPlan = async () => {
      try {
        const { doc: docRef, getDoc: getDocFn } = await import("firebase/firestore");
        const snap = await getDocFn(docRef(db, "workspaces", workspaceId, "proyectos", proyectoId));
        if (snap.exists()) {
          const data = snap.data();
          if (data.plano2d?.rooms?.length > 0) setRooms(data.plano2d.rooms);
          if (data.plano2d?.furniture?.length > 0) setFurniture(data.plano2d.furniture);
        }
      } catch (e) {
        console.warn("Load planimetria:", e.message);
      }
    };
    loadPlan();
  }, [workspaceId, proyectoId]);

  // ── Auto-save planimetria in Firestore (debounce 2s) ────────────────────
  useEffect(() => {
    if (!workspaceId || !proyectoId) return;
    if (rooms.length === 0 && furniture.length === 0) return;
    const timer = setTimeout(async () => {
      try {
        const { doc: docRef, updateDoc } = await import("firebase/firestore");
        await updateDoc(docRef(db, "workspaces", workspaceId, "proyectos", proyectoId), {
          plano2d: { rooms, furniture, updatedAt: new Date().toISOString() },
        });
      } catch (e) {
        console.warn("Save planimetria:", e.message);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [workspaceId, proyectoId, rooms, furniture]);

  // ── Carica storico render da Firestore ──────────────────────────────────
  useEffect(() => {
    if (!workspaceId || !proyectoId) return;
    const loadHistory = async () => {
      try {
        const q = query(
          collection(db, "workspaces", workspaceId, "proyectos", proyectoId, "renders"),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        const items = snap.docs.map(d => {
          const data = d.data();
          // Converti Firestore Timestamp in stringa ISO
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || null);
          return { id: d.id, ...data, createdAt };
        });
        setRenderHistory(items);
      } catch (e) {
        console.warn("Render history load:", e.message);
      }
    };
    loadHistory();
  }, [workspaceId, proyectoId, renders]); // Ricarica quando si generano nuovi render

  // ── Handler upload foto ───────────────────────────────────────────────────
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { onToast?.("⚠️ Foto demasiado grande (máx 10MB)"); return; }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoPreview(ev.target.result);
      // Estrai base64 puro (senza header data:image/...;base64,)
      setPhotoBase64(ev.target.result.split(",")[1]);
    };
    reader.readAsDataURL(file);
    setRenderMode("photo");
  };

  const removePhoto = () => {
    setPhotoFile(null); setPhotoPreview(null); setPhotoBase64(null);
    setRenderMode(rooms.length > 0 ? "plan" : "plan");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // v4: stili rimossi come filtri — il prompt dell'utente ha la priorità.
  // Manteniamo solo per retrocompatibilità backend (style="" = nessuno stile forzato)
  const style = ""; // sempre vuoto — nessuno stile predefinito

  // ── Aggiungi stanza ───────────────────────────────────────────────────────
  const addRoom = useCallback((type) => {
    const offset = rooms.length * 20;
    setRooms(r => [...r, mkRoom(type, 80 + offset, 80 + offset)]);
    setActiveLayer('room');
  }, [rooms.length]);

  const addFurniture = useCallback((furn) => {
    const offset = furniture.length * 10;
    setFurniture(f => [...f, mkFurniture(furn, 120 + offset, 120 + offset)]);
    setActiveLayer('furniture');
  }, [furniture.length]);

  // ── Modifica stanza ───────────────────────────────────────────────────────
  const changeRoom = useCallback((id, patch) => {
    setRooms(r => r.map(x => x.id === id ? { ...x, ...patch } : x));
  }, []);

  const changeFurn = useCallback((id, patch) => {
    setFurniture(f => f.map(x => x.id === id ? { ...x, ...patch } : x));
  }, []);

  const rotateSelected = useCallback((deg) => {
    if (!selected || selected.layer !== 'furniture') return;
    changeFurn(selected.id, { rotation: ((furniture.find(f => f.id === selected.id)?.rotation || 0) + deg + 360) % 360 });
  }, [selected, furniture, changeFurn]);

  // ── Elimina stanza selezionata ────────────────────────────────────────────
  const deleteSelected = useCallback(() => {
    if (!selected) return;
    if (selected.layer === 'room') setRooms(r => r.filter(x => x.id !== selected.id));
    else setFurniture(f => f.filter(x => x.id !== selected.id));
    setSelected(null);
  }, [selected]);

  // ── Keyboard delete ───────────────────────────────────────────────────────
  useEffect(() => {
    const handler = e => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selected) {
        e.preventDefault();
        deleteSelected();
      }
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selected, deleteSelected]);

  // ── Export PNG del canvas ─────────────────────────────────────────────────
  const exportPNG = useCallback(() => {
    if (!stageRef.current) return null;
    setSelected(null);
    return new Promise(resolve => {
      setTimeout(() => {
        const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
        resolve(uri);
      }, 100);
    });
  }, []);

  // ── Genera render AI ──────────────────────────────────────────────────────
  const handleRender = useCallback(async () => {
    // Blocca solo se non c'è né stanze, né foto, né prompt testuale
    if (rooms.length === 0 && !photoBase64 && !prompt.trim()) {
      onToast?.("⚠️ Agrega habitaciones, sube una foto o escribe un prompt");
      return;
    }
    setRendering(true);
    setRenderImg(null);
    setPanel("render");

    try {
      setRenderStep("Preparando datos...");
      const fns      = getFunctions(app, "southamerica-west1");
      const renderAI = httpsCallable(fns, "renderAI");

      // Filtra stanze: selezionata o tutte
      const targetRooms = renderRoom
        ? rooms.filter(r => r.id === renderRoom)
        : rooms;

      // Mappa mobili per stanza con dati reali in metri
      const roomsData = targetRooms.map(r => {
        const t    = ROOM_TYPES.find(x => x.id === r.type);
        const wM   = Math.round(r.w / GRID * 0.4 * 10) / 10; // metri con 1 decimale
        const hM   = Math.round(r.h / GRID * 0.4 * 10) / 10;
        // Trova mobili contenuti nella stanza (con margine di 10px)
        const furnInRoom = furniture.filter(f =>
          f.x + f.w * 0.5 >= r.x && f.x + f.w * 0.5 <= r.x + r.w &&
          f.y + f.h * 0.5 >= r.y && f.y + f.h * 0.5 <= r.y + r.h
        );
        return {
          type:      r.type,
          label:     t?.label || r.type,
          w:         wM,
          h:         hM,
          area:      Math.round(wM * hM * 10) / 10,
          furniture: furnInRoom.map(f => f.label).filter(Boolean),
        };
      });

      // Controlla quota prima di partire
      if (!isPro && !plan?.canRender) {
        onToast?.("⚡ Actualiza a Pro para usar Render AI");
        setRendering(false); setPanel("editor"); return;
      }

      // ── Esporta planimetria come PNG per ControlNet ──────────────────────
      let planBase64 = null;
      if (stageRef.current && rooms.length > 0) {
        try {
          setRenderStep("Exportando plano 2D...");
          const uri = stageRef.current.toDataURL({ pixelRatio: 1, mimeType: "image/png" });
          planBase64 = uri.split(",")[1];
        } catch (e) {
          console.warn("Export planimetria fallito:", e);
        }
      }

      // Determina modalità per il messaggio
      const modeHint = photoBase64 && planBase64 ? "plano + foto" : planBase64 ? "plano 2D" : photoBase64 ? "foto" : "texto";
      setRenderStep(`Generando render${roomsData.length > 1 ? "s" : ""} [${modeHint}]...`);

      const result = await renderAI({
        rooms:       roomsData,
        style,
        extraPrompt: prompt.trim(),
        photoBase64: photoBase64 || null,
        planBase64:  planBase64 || null,
        workspaceId,
        proyectoId,
      });

      if (result.data?.renders?.length > 0) {
        // CF restituisce { roomId, imageUrl, mode } — normalizziamo aggiungendo ok e label
        const normalized = result.data.renders.map(r => ({
          ...r,
          ok:       !!r.imageUrl,
          label:    r.roomId || r.roomType || "Render",
          roomType: r.roomId || r.roomType || "sala",
        }));
        const successful = normalized.filter(r => r.ok);
        // Append nuovi render ai precedenti (non sovrascrivere)
        setRenders(prev => [...normalized, ...prev]);
        setRenderImg(successful[0]?.imageUrl || null);
        setActiveRender(0);
        // Aggiorna quota rimanente
        if (result.data.remaining !== null && result.data.remaining !== undefined) {
          setQuotaLeft(result.data.remaining);
        }
        const modeLabel = { "plan+photo": "📐+📷", "plan": "📐 plano", "photo": "📷 foto", "text": "✍️ texto", "controlnet": "📐 ControlNet", "img2img": "📷 img2img", "txt2img": "✍️ txt2img" }[result.data.mode] || result.data.mode;
        setRenderStep(`✅ ${successful.length} render completados [${modeLabel}]`);
        onToast?.(`✅ ${successful.length} renders AI generados`);
        // Salva lastRenderUrl nel progetto per Portfolio pubblico
        if (successful[0]?.imageUrl && workspaceId && proyectoId) {
          const { doc: docRef, updateDoc } = await import("firebase/firestore");
          updateDoc(docRef(db, "workspaces", workspaceId, "proyectos", proyectoId), {
            lastRenderUrl:   successful[0].imageUrl,
            lastRenderAt:    new Date().toISOString(),
            lastRenderStyle: style || "",
          }).catch(() => {});
        }
        // Notifica App dei render per Vista Cliente
        onRendersReady?.([...successful, ...(renders.filter(r => r.ok) || [])]);
      } else {
        throw new Error("No se recibieron renders");
      }
    } catch (e) {
      console.error("renderAI:", e);
      const msg = e.message || "";
      if (msg.includes("quota_exceeded:free")) {
        onToast?.("⚡ Actualiza a Pro para usar Render AI");
        setRenderStep("⚡ Disponible en Pro");
      } else if (msg.includes("quota_exceeded")) {
        const left = msg.split(":")[1]?.split(" ")[0] || "0";
        onToast?.(`⚠️ Solo te quedan ${left} renders este mes`);
        setRenderStep(`⚠️ Quota agotada (${left} restantes)`);
      } else {
        onToast?.("❌ Error al generar render: " + msg);
        setRenderStep("❌ Error — intenta de nuevo");
      }
      setPanel("editor");
    } finally {
      setRendering(false);
    }
  }, [rooms, furniture, style, prompt, renderRoom, photoBase64, isPro, plan, workspaceId, proyectoId, onToast]);

  // ── Salva render come portada del progetto ──────────────────────────────────
  const savePortada = async (imageUrl) => {
    if (!workspaceId || !proyectoId || !imageUrl) return;
    try {
      const { doc: docRef, updateDoc } = await import("firebase/firestore");
      await updateDoc(docRef(db, "workspaces", workspaceId, "proyectos", proyectoId), {
        coverImageUrl: imageUrl,
        updatedAt: new Date().toISOString(),
      });
      setPortadaSaved(true);
      onToast?.("⭐ Portada del proyecto actualizada");
      setTimeout(() => setPortadaSaved(false), 3000);
    } catch (e) {
      onToast?.("❌ Error al guardar portada: " + e.message);
    }
  };

  // ── Salva preset prompt ───────────────────────────────────────────────────
  const savePreset = async () => {
    if (!workspaceId || !prompt.trim()) return;
    try {
      const { collection, addDoc } = await import("firebase/firestore");
      const newPreset = { text: prompt.trim(), createdAt: new Date().toISOString() };
      const ref = await addDoc(collection(db, "workspaces", workspaceId, "promptPresets"), newPreset);
      setPromptPresets(prev => [{ id: ref.id, ...newPreset }, ...prev]);
      onToast?.("✅ Preset guardado");
    } catch (e) {
      onToast?.("❌ Error: " + e.message);
    }
  };

  // ── Elimina preset prompt ─────────────────────────────────────────────────
  const deletePreset = async (presetId) => {
    if (!workspaceId) return;
    try {
      const { doc: docRef, deleteDoc } = await import("firebase/firestore");
      await deleteDoc(docRef(db, "workspaces", workspaceId, "promptPresets", presetId));
      setPromptPresets(prev => prev.filter(p => p.id !== presetId));
    } catch {}
  };

  // ── Render standalone — foto+prompt senza plano 2D ───────────────────────
  const handleRenderStandalone = useCallback(async () => {
    if (!standalonePrompt.trim() && !photoBase64) {
      onToast?.("⚠️ Escribe un prompt o sube una foto");
      return;
    }
    if (!isPro && !plan?.canRender) {
      onToast?.("⚡ Actualiza a Pro para usar Render AI");
      return;
    }
    setStandaloneRendering(true);
    setStandaloneResult(null);
    setPanel("standalone");

    try {
      setStandaloneStep("Preparando render...");
      const fns      = getFunctions(app, "southamerica-west1");
      const renderAI = httpsCallable(fns, "renderAI");

      // Manda una stanza virtuale generica se non c'è plano
      const roomsData = rooms.length > 0
        ? rooms.map(r => ({
            type:      r.type,
            label:     ROOM_TYPES.find(x => x.id === r.type)?.label || r.type,
            w:         Math.round(r.w / GRID * 0.4 * 10) / 10,
            h:         Math.round(r.h / GRID * 0.4 * 10) / 10,
            area:      Math.round((r.w / GRID * 0.4) * (r.h / GRID * 0.4) * 10) / 10,
            furniture: [],
          }))
        : [{ type: "sala", label: "Ambiente", w: 5, h: 4, area: 20, furniture: [] }];

      setStandaloneStep(photoBase64 ? "Generando render [foto + prompt]..." : "Generando render [prompt]...");

      const result = await renderAI({
        rooms:       roomsData,
        style,
        extraPrompt: standalonePrompt.trim(),
        photoBase64: photoBase64 || null,
        planBase64:  null, // no plano 2D
        workspaceId,
        proyectoId,
      });

      if (result.data?.renders?.length > 0) {
        const successful = result.data.renders.filter(r => r.imageUrl);
        if (successful.length > 0) {
          setStandaloneResult(successful[0].imageUrl);
          // Aggiunge anche alla galleria principale
          setRenders(prev => [...successful.map(r => ({ ...r, ok: true, label: "Render Rápido" })), ...prev]);
          setActiveRender(0);
          if (result.data.remaining != null) setQuotaLeft(result.data.remaining);
          setStandaloneStep("✅ Render completado");
          onToast?.("✅ Render AI generado");
          // Salva lastRenderUrl nel progetto per Portfolio pubblico
          if (successful[0]?.imageUrl && workspaceId && proyectoId) {
            const { doc: docRef, updateDoc } = await import("firebase/firestore");
            updateDoc(docRef(db, "workspaces", workspaceId, "proyectos", proyectoId), {
              lastRenderUrl:   successful[0].imageUrl,
              lastRenderAt:    new Date().toISOString(),
              lastRenderStyle: style || "",
            }).catch(() => {});
          }
          onRendersReady?.([...successful]);
        } else {
          throw new Error("No se recibieron renders");
        }
      } else {
        throw new Error("No se recibieron renders");
      }
    } catch (e) {
      const msg = e.message || "";
      if (msg.includes("quota_exceeded:free")) {
        onToast?.("⚡ Actualiza a Pro para usar Render AI");
        setStandaloneStep("⚡ Disponible en Pro");
      } else if (msg.includes("quota_exceeded")) {
        onToast?.(`⚠️ Quota agotada este mes`);
        setStandaloneStep("⚠️ Quota agotada");
      } else {
        onToast?.("❌ Error al generar render: " + msg);
        setStandaloneStep("❌ Error — intenta de nuevo");
      }
    } finally {
      setStandaloneRendering(false);
    }
  }, [standalonePrompt, photoBase64, isPro, plan, style, rooms, workspaceId, proyectoId, onToast, onRendersReady]);
  const handleCompareStyles = async () => {
    const activePrompt = prompt.trim() || standalonePrompt.trim();
    if (rooms.length === 0 && !photoBase64 && !activePrompt) {
      onToast?.("⚠️ Añade habitaciones, sube una foto o escribe un prompt");
      return;
    }
    setComparingStyles(true);
    setCompareMode(true);
    setCompareRenders([]);
    const results = [];
    // v4: genera 4 varianti dello stesso prompt (nessuno stile forzato)
    for (let i = 0; i < 4; i++) {
      try {
        const roomsData = rooms
          .filter(r => !renderRoom || r.type === renderRoom)
          .map(r => ({
            type: r.type,
            label: ROOM_TYPES.find(x => x.id === r.type)?.label || r.type,
            w: Math.round(r.w / GRID * 0.4 * 10) / 10,
            h: Math.round(r.h / GRID * 0.4 * 10) / 10,
            furniture: furniture.filter(f => {
              const fr = rooms.find(rm => rm.id === r.id);
              return fr && f.x >= fr.x && f.x <= fr.x + fr.w && f.y >= fr.y && f.y <= fr.y + fr.h;
            }).map(f => f.label),
          }));
        if (roomsData.length === 0 && (photoBase64 || activePrompt)) {
          roomsData.push({ type: "sala", label: "Ambiente", w: 5, h: 4, area: 20, furniture: [] });
        }
        const fns = functions;
        const renderAI = httpsCallable(fns, "renderAI");
        const result = await renderAI({
          rooms: roomsData.slice(0, 1),
          style: "",
          extraPrompt: activePrompt,
          photoBase64: photoBase64 || null,
          planBase64: null,
          workspaceId,
          proyectoId,
        });
        const r = result.data?.renders?.[0];
        if (r?.imageUrl) {
          results.push({ style: `variant_${i+1}`, label: `Variante ${i+1}`, imageUrl: r.imageUrl });
          setCompareRenders([...results]);
        }
      } catch (err) {
        results.push({ style: `variant_${i+1}`, label: `Variante ${i+1}`, imageUrl: null, error: err.message });
        setCompareRenders([...results]);
      }
    }
    setComparingStyles(false);
  };

  // ── Download immagine render ──────────────────────────────────────────────
  // ── Applica watermark su canvas (Free plan) ──────────────────────────────────
  const applyWatermark = useCallback((sourceUrl) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width  = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        if (!isPro) {
          const W = canvas.width, H = canvas.height;
          ctx.save();
          ctx.translate(W / 2, H / 2);
          ctx.rotate(-Math.PI / 6);
          const stepX = 280, stepY = 120;
          const cols = Math.ceil(W / stepX) + 2;
          const rows = Math.ceil(H / stepY) + 2;
          for (let r = -rows; r <= rows; r++) {
            for (let c = -cols; c <= cols; c++) {
              ctx.font = "bold 38px 'Segoe UI', system-ui, sans-serif";
              ctx.fillStyle = "rgba(255,255,255,0.18)";
              ctx.textAlign = "center";
              ctx.fillText("OBRA NOVA", c * stepX, r * stepY);
              ctx.font = "500 14px 'Segoe UI', system-ui, sans-serif";
              ctx.fillStyle = "rgba(255,255,255,0.13)";
              ctx.fillText("app.obranova.cl · Plan Free", c * stepX, r * stepY + 20);
            }
          }
          ctx.restore();
          const bx = W - 262, by = H - 48;
          ctx.fillStyle = "rgba(26,54,93,0.82)";
          ctx.beginPath();
          ctx.roundRect(bx, by, 250, 34, 8);
          ctx.fill();
          ctx.font = "bold 13px 'Segoe UI', system-ui, sans-serif";
          ctx.fillStyle = "rgba(255,255,255,0.92)";
          ctx.textAlign = "center";
          ctx.fillText("⚡ Actualiza a Pro — app.obranova.cl", bx + 125, by + 22);
        }
        resolve(canvas.toDataURL("image/jpeg", 0.92));
      };
      img.onerror = () => resolve(sourceUrl);
      img.src = sourceUrl;
    });
  }, [isPro]);

  const downloadRender = useCallback(async () => {
    const activeImg   = renders[activeRender]?.imageUrl || renderImg;
    const activeLabel = renders[activeRender]?.label || "";
    if (!activeImg) return;
    const finalUrl = await applyWatermark(activeImg);
    const a = document.createElement("a");
    a.href = finalUrl;
    a.download = `render-${activeLabel || proyectoNombre || "proyecto"}-${Date.now()}.jpg`;
    a.click();
  }, [renders, activeRender, renderImg, proyectoNombre, applyWatermark]);

  // ── Download planimetria PNG ──────────────────────────────────────────────
  const downloadPlan = useCallback(async () => {
    const uri = await exportPNG();
    const a = document.createElement("a");
    a.href = uri;
    a.download = `planimetria-${proyectoNombre || "proyecto"}.png`;
    a.click();
  }, [exportPNG, proyectoNombre]);

  const selectedRoom = selected?.layer === 'room' ? rooms.find(r => r.id === selected.id) : null;
  const selectedFurn = selected?.layer === 'furniture' ? furniture.find(f => f.id === selected.id) : null;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:0, maxWidth:1100, margin:"0 auto" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        background:"linear-gradient(135deg,#1a365d 0%,#2d3748 60%,#553c9a 100%)",
        borderRadius:14, padding:"18px 24px", marginBottom:14,
        display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12,
      }}>
        <div>
          <div style={{ color:"rgba(255,255,255,.6)", fontSize:11, fontWeight:600, letterSpacing:1, marginBottom:3 }}>
            DISEÑO Y PLANIMETRÍA
          </div>
          <div style={{ color:"white", fontSize:20, fontWeight:900 }}>
            🏗️ Editor de Planos
          </div>
          {proyectoNombre && (
            <div style={{ color:"rgba(255,255,255,.6)", fontSize:12, marginTop:2 }}>{proyectoNombre}</div>
          )}
        </div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <button
            onClick={() => setPanel(panel === "editor" ? "render" : "editor")}
            style={{
              padding:"8px 16px", borderRadius:8, border:"none", cursor:"pointer",
              background: panel === "render" ? "white" : "rgba(255,255,255,.15)",
              color: panel === "render" ? "#1a365d" : "white",
              fontWeight:700, fontSize:12,
            }}
          >
            {panel === "editor" ? "🎨 Ver Render" : "✏️ Editor"}
          </button>
          <button
            onClick={() => setPanel(panel === "standalone" ? "editor" : "standalone")}
            style={{
              padding:"8px 16px", borderRadius:8, border:"none", cursor:"pointer",
              background: panel === "standalone" ? "#f0fff4" : "rgba(255,255,255,.15)",
              color: panel === "standalone" ? "#276749" : "white",
              fontWeight:700, fontSize:12,
            }}
          >
            ⚡ Render Rápido
          </button>
          {rooms.length > 0 && (
            <button
              onClick={downloadPlan}
              style={{
                padding:"8px 16px", borderRadius:8, border:"1px solid rgba(255,255,255,.3)",
                background:"transparent", color:"white", cursor:"pointer", fontWeight:600, fontSize:12,
              }}
            >
              ⬇️ PNG Plano
            </button>
          )}
        </div>
      </div>

      {/* ── Layout principale ──────────────────────────────────────────────── */}
      <div style={{ display:"flex", gap:14, alignItems:"flex-start", flexWrap:"wrap" }}>

        {/* ── Sidebar sinistra ─────────────────────────────────────────────── */}
        <div style={{ width:190, flexShrink:0, display:"flex", flexDirection:"column", gap:8 }}>

          {/* Toggle layer */}
          <div style={{ background:"white", borderRadius:10, padding:8, boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
            <div style={{ display:"flex", gap:4 }}>
              {[["room","🏠 Hab."],["furniture","🪑 Muebles"]].map(([k,lbl]) => (
                <button key={k} onClick={() => setActiveLayer(k)}
                  style={{ flex:1, padding:"7px 4px", borderRadius:7, border:"none", cursor:"pointer",
                    background:activeLayer===k?"#1a365d":"#f7fafc",
                    color:activeLayer===k?"white":"#4a5568",
                    fontWeight:700, fontSize:11, transition:"all .15s" }}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Stanze */}
          {activeLayer === "room" && (
            <div style={{ background:"white", borderRadius:10, padding:12, boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
              <div style={{ fontWeight:800, fontSize:10, color:"#1a365d", marginBottom:8, letterSpacing:.5 }}>
                HABITACIONES
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                {ROOM_TYPES.map(type => (
                  <button key={type.id} onClick={() => addRoom(type)}
                    style={{ display:"flex", alignItems:"center", gap:7, padding:"7px 9px",
                      borderRadius:7, border:`1.5px solid ${type.border}`, background:type.color,
                      cursor:"pointer", fontWeight:600, fontSize:11, color:type.border, transition:"transform .1s" }}
                    onMouseDown={e => e.currentTarget.style.transform="scale(.97)"}
                    onMouseUp={e => e.currentTarget.style.transform="scale(1)"}>
                    <span style={{ fontSize:14 }}>{type.emoji}</span>{type.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mobili */}
          {activeLayer === "furniture" && (
            <div style={{ background:"white", borderRadius:10, padding:12, boxShadow:"0 1px 4px rgba(0,0,0,.07)", maxHeight:430, overflowY:"auto" }}>
              <div style={{ fontWeight:800, fontSize:10, color:"#1a365d", marginBottom:8, letterSpacing:.5 }}>
                MOBILIARIO
              </div>
              {FURNITURE_CAT.map(cat => (
                <div key={cat.cat} style={{ marginBottom:5 }}>
                  <button onClick={() => setOpenCat(openCat === cat.cat ? null : cat.cat)}
                    style={{ width:"100%", padding:"5px 8px", background:"#f7fafc", border:"1px solid #e2e8f0",
                      borderRadius:6, cursor:"pointer", fontWeight:700, fontSize:10, color:"#4a5568",
                      textAlign:"left", display:"flex", justifyContent:"space-between" }}>
                    {cat.cat}<span>{openCat === cat.cat ? "▲" : "▼"}</span>
                  </button>
                  {openCat === cat.cat && (
                    <div style={{ marginTop:3, display:"flex", flexDirection:"column", gap:3 }}>
                      {cat.items.map(f => (
                        <button key={f.id} onClick={() => addFurniture(f)}
                          style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 8px",
                            borderRadius:6, border:`1px solid ${f.border}`, background:f.color,
                            cursor:"pointer", fontWeight:600, fontSize:10, color:f.border, transition:"transform .1s" }}
                          onMouseDown={e => e.currentTarget.style.transform="scale(.97)"}
                          onMouseUp={e => e.currentTarget.style.transform="scale(1)"}>
                          <span style={{ fontSize:12 }}>{f.emoji}</span>{f.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Elemento selezionato */}
          {(selectedRoom || selectedFurn) && (
            <div style={{ background:"white", borderRadius:10, padding:12, boxShadow:"0 1px 4px rgba(0,0,0,.07)", border:"2px solid #2b6cb0" }}>
              <div style={{ fontWeight:800, fontSize:10, color:"#2b6cb0", marginBottom:5 }}>SELECCIONADO</div>
              <div style={{ fontSize:11, color:"#4a5568", marginBottom:3 }}>
                {selectedRoom
                  ? ROOM_TYPES.find(t => t.id === selectedRoom.type)?.emoji
                  : ALL_FURNS.find(f => f.id === selectedFurn?.type)?.emoji
                } {(selectedRoom || selectedFurn)?.label}
              </div>
              {selectedRoom && (
                <div style={{ fontSize:10, color:"#718096", marginBottom:5 }}>
                  {Math.round(selectedRoom.w / GRID * 0.4)} × {Math.round(selectedRoom.h / GRID * 0.4)} m
                </div>
              )}
              <input
                value={(selectedRoom || selectedFurn)?.label || ""}
                onChange={e => {
                  if (selected?.layer === "room") changeRoom(selected.id, { label: e.target.value });
                  else changeFurn(selected.id, { label: e.target.value });
                }}
                style={{ width:"100%", padding:"5px 7px", border:"1px solid #e2e8f0", borderRadius:6,
                  fontSize:11, boxSizing:"border-box", marginBottom:6 }}
                placeholder="Etiqueta..."
              />
              {selectedFurn && (
                <>
                <div style={{ fontSize:10, color:"#718096", marginBottom:5 }}>
                  {Math.round(selectedFurn.w / GRID * 0.4)} × {Math.round(selectedFurn.h / GRID * 0.4)} m
                </div>
                <div style={{ display:"flex", gap:4, marginBottom:6 }}>
                  <div style={{ flex:1 }}>
                    <label style={{ fontSize:9, color:"#a0aec0" }}>Ancho (cm)</label>
                    <input type="number" min={20} step={20} value={selectedFurn.w}
                      onChange={e => changeFurn(selectedFurn.id, { w: Math.max(20, parseInt(e.target.value) || 20) })}
                      style={{ width:"100%", padding:"4px 6px", border:"1px solid #e2e8f0", borderRadius:5, fontSize:11, textAlign:"center", boxSizing:"border-box" }} />
                  </div>
                  <div style={{ flex:1 }}>
                    <label style={{ fontSize:9, color:"#a0aec0" }}>Alto (cm)</label>
                    <input type="number" min={20} step={20} value={selectedFurn.h}
                      onChange={e => changeFurn(selectedFurn.id, { h: Math.max(20, parseInt(e.target.value) || 20) })}
                      style={{ width:"100%", padding:"4px 6px", border:"1px solid #e2e8f0", borderRadius:5, fontSize:11, textAlign:"center", boxSizing:"border-box" }} />
                  </div>
                </div>
                <div style={{ display:"flex", gap:4, marginBottom:6 }}>
                  <button onClick={() => rotateSelected(-90)}
                    style={{ flex:1, padding:"5px", background:"#ebf8ff", border:"1px solid #bee3f8",
                      borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:600, color:"#2b6cb0" }}>
                    ↺ -90°
                  </button>
                  <button onClick={() => rotateSelected(90)}
                    style={{ flex:1, padding:"5px", background:"#ebf8ff", border:"1px solid #bee3f8",
                      borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:600, color:"#2b6cb0" }}>
                    ↻ +90°
                  </button>
                </div>
                <div style={{ fontSize:9, color:"#a0aec0", marginBottom:6, textAlign:"center" }}>
                  💡 También puedes arrastrar las esquinas en el plano
                </div>
                </>
              )}
              <button onClick={deleteSelected}
                style={{ width:"100%", padding:"6px", background:"#fff5f5", border:"1px solid #fed7d7",
                  borderRadius:6, color:"#c53030", cursor:"pointer", fontWeight:700, fontSize:11 }}>
                🗑️ Eliminar
              </button>
            </div>
          )}
        </div>

        {/* ── Canvas editor ────────────────────────────────────────────────── */}
        {panel === "editor" && (
          <div style={{ flex:1, minWidth:300 }}>
            <div style={{
              background:"white", borderRadius:12, overflow:"hidden",
              boxShadow:"0 1px 4px rgba(0,0,0,.07)",
              border:"1px solid #e2e8f0",
            }}>
              {/* Toolbar canvas */}
              <div style={{
                padding:"10px 14px", borderBottom:"1px solid #f0f4f8",
                display:"flex", alignItems:"center", gap:8, flexWrap:"wrap",
              }}>
                <span style={{ fontSize:11, color:"#718096", fontWeight:600 }}>
                  {rooms.length} hab. · {furniture.length} muebles
                </span>
                <div style={{ flex:1 }} />
                {(rooms.length > 0 || furniture.length > 0) && (
                  <button
                    onClick={() => { setRooms([]); setFurniture([]); setSelected(null); }}
                    style={{
                      padding:"5px 10px", background:"#fff5f5", border:"1px solid #fed7d7",
                      borderRadius:6, color:"#c53030", cursor:"pointer", fontSize:11, fontWeight:600,
                    }}
                  >
                    🗑️ Limpiar todo
                  </button>
                )}
                <span style={{ fontSize:10, color:"#a0aec0" }}>
                  Click = seleccionar · Arrastrar = mover · Delete = eliminar
                </span>
              </div>

              {/* Stage Konva */}
              <div
                style={{ cursor: "default" }}
                onClick={e => { if (e.target === e.currentTarget) setSelected(null); }}
              >
                <Stage
                  ref={stageRef}
                  width={CANVAS_W}
                  height={CANVAS_H}
                  style={{ display:"block" }}
                  onClick={e => { if (e.target === stageRef.current) setSelected(null); }}
                >
                  <Layer>
                    <GridLines width={CANVAS_W} height={CANVAS_H} />
                    {/* Sfondo bianco per export */}
                    <Rect x={0} y={0} width={CANVAS_W} height={CANVAS_H} fill="white" listening={false} />
                    <GridLines width={CANVAS_W} height={CANVAS_H} />
                  </Layer>
                  <Layer>
                    {rooms.map(room => (
                      <RoomShape
                        key={room.id}
                        room={room}
                        selected={selected?.id === room.id}
                        onSelect={id => setSelected({ id, layer: 'room' })}
                        onChange={changeRoom}
                      />
                    ))}
                  </Layer>
                  <Layer>
                    {furniture.map(item => (
                      <FurnitureShape
                        key={item.id}
                        item={item}
                        selected={selected?.id === item.id}
                        onSelect={id => setSelected({ id, layer: 'furniture' })}
                        onChange={changeFurn}
                      />
                    ))}
                  </Layer>
                </Stage>
              </div>

              {/* Empty state */}
              {rooms.length === 0 && furniture.length === 0 && (
                <div style={{
                  position:"relative", marginTop:-CANVAS_H,
                  height:CANVAS_H, display:"flex", flexDirection:"column",
                  alignItems:"center", justifyContent:"center",
                  pointerEvents:"none",
                }}>
                  <div style={{ fontSize:48, marginBottom:12, opacity:.3 }}>🏗️</div>
                  <div style={{ fontSize:14, color:"#a0aec0", fontWeight:600 }}>
                    Empieza añadiendo habitaciones desde el panel izquierdo
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Panel render AI ───────────────────────────────────────────────── */}
        {panel === "render" && (
          <div style={{ flex:1, minWidth:300, display:"flex", flexDirection:"column", gap:12 }}>

            {/* ── Bottone torna all'editor ─────────────────────────────────── */}
            <button
              onClick={() => setPanel("editor")}
              style={{
                display:"flex", alignItems:"center", gap:8,
                padding:"10px 16px", borderRadius:10,
                border:"2px solid #e2e8f0", background:"white",
                color:"#1a365d", cursor:"pointer", fontWeight:700, fontSize:13,
                boxShadow:"0 1px 4px rgba(0,0,0,.07)", transition:"all .15s",
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor="#2b6cb0"}
              onMouseLeave={e => e.currentTarget.style.borderColor="#e2e8f0"}
            >
              ✏️ Editar plano 2D
            </button>

            {/* ── Foto upload ──────────────────────────────────────────────── */}
            <div style={{ background:"white", borderRadius:12, padding:16, boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
              <div style={{ fontWeight:800, fontSize:12, color:"#1a365d", marginBottom:10, letterSpacing:.5 }}>
                📷 FOTO DEL AMBIENTE
              </div>

              {/* Paywall foto per Free */}
              {!isPro ? (
                <div style={{ background:"#f0fff4", border:"1.5px dashed #276749", borderRadius:10, padding:14, textAlign:"center" }}>
                  <div style={{ fontSize:22, marginBottom:6 }}>📷</div>
                  <div style={{ fontSize:12, fontWeight:700, color:"#276749", marginBottom:4 }}>Disponible en Pro</div>
                  <div style={{ fontSize:11, color:"#4a5568" }}>Sube una foto real y transfórmala con IA</div>
                </div>
              ) : photoPreview ? (
                /* Anteprima foto caricata */
                <div style={{ position:"relative" }}>
                  <img src={photoPreview} alt="Foto ambiente"
                    style={{ width:"100%", borderRadius:8, maxHeight:160, objectFit:"cover", display:"block" }} />
                  <button onClick={removePhoto} style={{
                    position:"absolute", top:6, right:6,
                    background:"rgba(0,0,0,.55)", color:"white", border:"none",
                    borderRadius:"50%", width:26, height:26, cursor:"pointer",
                    fontSize:14, display:"flex", alignItems:"center", justifyContent:"center",
                  }}>✕</button>
                  <div style={{ fontSize:10, color:"#276749", fontWeight:600, marginTop:5 }}>
                    ✅ Foto cargada — render con image-to-image
                  </div>
                </div>
              ) : (
                /* Bottone upload */
                <>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoUpload} style={{ display:"none" }} />
                  <button onClick={() => fileInputRef.current?.click()} style={{
                    width:"100%", padding:"12px 16px", borderRadius:10,
                    border:"2px dashed #bee3f8", background:"#f7fbff",
                    cursor:"pointer", textAlign:"center",
                  }}>
                    <div style={{ fontSize:22, marginBottom:4 }}>📷</div>
                    <div style={{ fontSize:12, fontWeight:700, color:"#2b6cb0" }}>Subir foto del ambiente</div>
                    <div style={{ fontSize:10, color:"#718096", marginTop:3 }}>JPG / PNG · max 10MB</div>
                  </button>
                  <div style={{ fontSize:10, color:"#a0aec0", marginTop:6, textAlign:"center" }}>
                    Opcional — sin foto usa el plano 2D
                  </div>
                </>
              )}
            </div>


            {/* Selezione stanza */}
            <div style={{ background:"white", borderRadius:12, padding:16, boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
              <div style={{ fontWeight:800, fontSize:12, color:"#1a365d", marginBottom:10, letterSpacing:.5 }}>
                HABITACIÓN A RENDERIZAR
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                <button
                  onClick={() => setRenderRoom(null)}
                  style={{
                    padding:"6px 12px", borderRadius:8, border:"none", cursor:"pointer",
                    fontSize:12, fontWeight:700,
                    background: renderRoom === null ? "#1a365d" : "#f0f4f8",
                    color: renderRoom === null ? "white" : "#4a5568",
                  }}
                >
                  🏠 Toda la casa
                </button>
                {rooms.map(r => {
                  const t = ROOM_TYPES.find(x => x.id === r.type);
                  return (
                    <button
                      key={r.id}
                      onClick={() => setRenderRoom(r.id)}
                      style={{
                        padding:"6px 12px", borderRadius:8, border:"none", cursor:"pointer",
                        fontSize:12, fontWeight:700,
                        background: renderRoom === r.id ? "#553c9a" : "#f0f4f8",
                        color: renderRoom === r.id ? "white" : "#4a5568",
                      }}
                    >
                      {t?.emoji} {r.label || t?.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Config stile */}
            <div style={{ background:"white", borderRadius:12, padding:16, boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
              <div style={{ fontWeight:800, fontSize:12, color:"#1a365d", marginBottom:12, letterSpacing:.5 }}>
                ESTILO DE DISEÑO
              </div>

              {/* v4: PROMPT-FIRST — describe lo que quieres */}
              <div style={{ fontWeight:800, fontSize:12, color:"#1a365d", marginBottom:8, letterSpacing:.5 }}>
                ✍️ DESCRIBE TU DISEÑO
              </div>
              <div style={{ fontSize:11, color:"#718096", marginBottom:8 }}>
                Describe materiales, colores, estilo e iluminación. Cuanto más detallado, mejor resultado.
              </div>

              {/* ── Sugerencias rápidas (additive) ──────────────────────── */}
              <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 }}>
                {[
                  "estilo moderno","madera oscura","mármol blanco","luz natural",
                  "colores cálidos","industrial","minimalista","con plantas",
                  "piso de madera","techo alto","ventanales grandes","estilo nórdico",
                ].map(sug => (
                  <button key={sug} onClick={() => setPrompt(p => p ? `${p}, ${sug}` : sug)}
                    style={{ padding:"4px 10px", borderRadius:99, border:"1px solid #e2e8f0", background:"white", color:"#4a5568", fontSize:10, fontWeight:600, cursor:"pointer", transition:"all .15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background="#ebf8ff"; e.currentTarget.style.borderColor="#2b6cb0"; e.currentTarget.style.color="#2b6cb0"; }}
                    onMouseLeave={e => { e.currentTarget.style.background="white"; e.currentTarget.style.borderColor="#e2e8f0"; e.currentTarget.style.color="#4a5568"; }}
                  >
                    + {sug}
                  </button>
                ))}
              </div>

              {/* ── Preset prompt ──────────────────────────────────────── */}
              <div style={{ marginBottom:8 }}>
                <div style={{ display:"flex", gap:6, alignItems:"center", marginBottom:6 }}>
                  <button
                    onClick={() => setShowPresets(v => !v)}
                    style={{ padding:"4px 10px", borderRadius:8, border:"1px solid #e2e8f0", background:"white", color:"#4a5568", fontSize:11, fontWeight:600, cursor:"pointer" }}
                  >
                    📋 Mis presets ({promptPresets.length})
                  </button>
                  {prompt.trim() && (
                    <button
                      onClick={savePreset}
                      style={{ padding:"4px 10px", borderRadius:8, border:"1px solid #d6bcfa", background:"#faf5ff", color:"#553c9a", fontSize:11, fontWeight:600, cursor:"pointer" }}
                    >
                      💾 Guardar como preset
                    </button>
                  )}
                </div>
                {showPresets && promptPresets.length > 0 && (
                  <div style={{ background:"#f7fafc", borderRadius:8, border:"1px solid #e2e8f0", maxHeight:140, overflowY:"auto" }}>
                    {promptPresets.map(p => (
                      <div key={p.id} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 10px", borderBottom:"1px solid #e2e8f0" }}>
                        <span
                          onClick={() => { setPrompt(p.text); setShowPresets(false); }}
                          style={{ flex:1, fontSize:11, color:"#2d3748", cursor:"pointer", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}
                          title={p.text}
                        >
                          {p.text}
                        </span>
                        <button
                          onClick={() => deletePreset(p.id)}
                          style={{ background:"none", border:"none", color:"#c53030", cursor:"pointer", fontSize:14, padding:"0 2px", flexShrink:0 }}
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}
                {showPresets && promptPresets.length === 0 && (
                  <div style={{ fontSize:11, color:"#a0aec0", padding:"6px 0" }}>
                    Guarda un prompt para usarlo rápido luego
                  </div>
                )}
              </div>

              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Ej: baño con ceramico azul, madera negra, estilo mediterráneo, luz natural cálida, espejo grande..."
                rows={3}
                style={{
                  width:"100%", padding:"10px 12px", border:"1.5px solid #bee3f8",
                  borderRadius:8, fontSize:12, resize:"vertical", boxSizing:"border-box",
                  color:"#2d3748", fontFamily:"inherit",
                }}
              />
              <button
                onClick={handleRender}
                disabled={rendering || (rooms.length === 0 && !photoBase64 && !prompt.trim())}
                style={{
                  marginTop:10, width:"100%", padding:"12px",
                  background: rendering ? "#a0aec0" : (rooms.length === 0 && !photoBase64 && !prompt.trim()) ? "#e2e8f0" : "linear-gradient(135deg,#553c9a,#2b6cb0)",
                  color: (rooms.length === 0 && !photoBase64 && !prompt.trim()) ? "#a0aec0" : "white",
                  border:"none", borderRadius:9, cursor: (rooms.length === 0 && !photoBase64 && !prompt.trim()) || rendering ? "not-allowed" : "pointer",
                  fontWeight:800, fontSize:14, transition:"opacity .2s",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                }}
              >
                {rendering ? (
                  <>
                    <span style={{ display:"inline-block", animation:"spin 1s linear infinite" }}>⏳</span>
                    {renderStep}
                  </>
                ) : (rooms.length === 0 && !photoBase64 && !prompt.trim()) ? (
                  "Añade habitaciones, sube una foto o escribe un prompt"
                ) : (
                  "✨ Generar Render AI"
                )}
              </button>
              {rooms.length === 0 && !photoBase64 && !prompt.trim() && (
                <div style={{ fontSize:11, color:"#c05621", textAlign:"center", marginTop:6 }}>
                  Agrega habitaciones al plano, sube una foto o escribe un prompt
                </div>
              )}
            </div>

            {/* Galleria render */}
            {renders.length > 0 && (
              <div style={{ background:"white", borderRadius:12, padding:16, boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
                <div style={{ fontWeight:800, fontSize:12, color:"#1a365d", marginBottom:12, letterSpacing:.5 }}>
                  RENDERS GENERADOS — {renders.filter(r=>r.ok).length}/{renders.length}
                  {renders[0]?.mode === "photo" && <span style={{marginLeft:8,fontSize:10,background:"#ebf8ff",color:"#2b6cb0",borderRadius:6,padding:"2px 7px",fontWeight:600}}>📷 foto</span>}
                </div>
                {/* Tabs stanze */}
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
                  {renders.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => { setActiveRender(i); setRenderImg(r.imageUrl); }}
                      style={{
                        padding:"5px 11px", borderRadius:8, border:"none", cursor:"pointer",
                        fontSize:11, fontWeight:700,
                        background: activeRender === i ? "#1a365d" : r.ok ? "#f0f4f8" : "#fff5f5",
                        color: activeRender === i ? "white" : r.ok ? "#4a5568" : "#c53030",
                      }}
                    >
                      {r.ok ? "" : "❌ "}{r.label || r.roomType}
                    </button>
                  ))}
                </div>
                {/* ── Toggle Before/After se c'è foto ─────────────────── */}
                {photoPreview && renders[activeRender]?.ok && (
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                    <button
                      onClick={() => setBeforeAfter(v => !v)}
                      style={{
                        padding:"5px 14px", borderRadius:8, border:"none", cursor:"pointer",
                        background: beforeAfter ? "#553c9a" : "#e2e8f0",
                        color: beforeAfter ? "white" : "#4a5568",
                        fontWeight:700, fontSize:11, transition:"all .2s",
                      }}
                    >
                      {beforeAfter ? "🔀 Antes / Después ON" : "🔀 Ver Antes / Después"}
                    </button>
                    {beforeAfter && (
                      <span style={{ fontSize:10, color:"#718096" }}>← arrastra el slider →</span>
                    )}
                  </div>
                )}

                {/* Immagine attiva */}
                {renders[activeRender]?.ok ? (
                  <div style={{ position:"relative", display:"inline-block", width:"100%" }}>
                    {/* ── Before/After slider ─────────────────────────────── */}
                    {beforeAfter && photoPreview ? (
                      <div
                        style={{ position:"relative", width:"100%", borderRadius:10, overflow:"hidden", userSelect:"none", cursor:"ew-resize" }}
                        onMouseMove={e => {
                          if (e.buttons !== 1) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          setBaSlider(Math.round(((e.clientX - rect.left) / rect.width) * 100));
                        }}
                        onTouchMove={e => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setBaSlider(Math.round(((e.touches[0].clientX - rect.left) / rect.width) * 100));
                        }}
                      >
                        {/* Foto originale (before) */}
                        <img src={photoPreview} alt="Antes" style={{ width:"100%", display:"block", borderRadius:10 }} />
                        {/* Render (after) — clip da sinistra */}
                        <div style={{ position:"absolute", top:0, left:0, width:`${baSlider}%`, height:"100%", overflow:"hidden" }}>
                          <img src={renders[activeRender].imageUrl} alt="Después"
                            style={{ width:`${10000/baSlider}%`, maxWidth:"none", display:"block", borderRadius:10 }} />
                        </div>
                        {/* Linea divisoria */}
                        <div style={{ position:"absolute", top:0, left:`${baSlider}%`, transform:"translateX(-50%)", width:3, height:"100%", background:"white", boxShadow:"0 0 8px rgba(0,0,0,.5)", pointerEvents:"none" }}>
                          <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", background:"white", borderRadius:"50%", width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 2px 8px rgba(0,0,0,.3)", fontSize:14 }}>⇔</div>
                        </div>
                        {/* Labels */}
                        <div style={{ position:"absolute", top:8, left:8, background:"rgba(0,0,0,.55)", color:"white", borderRadius:6, padding:"3px 8px", fontSize:10, fontWeight:700, pointerEvents:"none" }}>ANTES</div>
                        <div style={{ position:"absolute", top:8, right:8, background:"rgba(85,60,154,.85)", color:"white", borderRadius:6, padding:"3px 8px", fontSize:10, fontWeight:700, pointerEvents:"none" }}>DESPUÉS</div>
                      </div>
                    ) : (
                    <img
                      src={renders[activeRender].imageUrl}
                      alt={renders[activeRender].label}
                      style={{ width:"100%", borderRadius:10, display:"block", boxShadow:"0 4px 20px rgba(0,0,0,.12)" }}
                    />
                    )}
                    {!isPro && (
                      <div style={{
                        position:"absolute", inset:0, borderRadius:10,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        pointerEvents:"none", overflow:"hidden",
                      }}>
                        {Array.from({ length: 12 }).map((_, wi) => (
                          <div key={wi} style={{
                            position:"absolute",
                            top: `${(wi % 4) * 28 - 10}%`,
                            left: `${Math.floor(wi / 4) * 36 - 5}%`,
                            transform:"rotate(-20deg)", whiteSpace:"nowrap",
                            opacity:0.22, pointerEvents:"none",
                          }}>
                            <div style={{ fontSize:28, fontWeight:900, color:"white", letterSpacing:2, textShadow:"0 1px 4px rgba(0,0,0,.5)" }}>OBRA NOVA</div>
                            <div style={{ fontSize:11, color:"white", textAlign:"center", marginTop:2 }}>app.obranova.cl</div>
                          </div>
                        ))}
                        <div style={{ position:"absolute", bottom:10, right:10, background:"rgba(26,54,93,0.85)", borderRadius:8, padding:"7px 14px" }}>
                          <span style={{ color:"white", fontSize:12, fontWeight:700 }}>⚡ Actualiza a Pro para descargar sin marca</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ padding:24, textAlign:"center", color:"#c53030", fontSize:13 }}>❌ Este render falló</div>
                )}
                <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap" }}>
                  <button
                    onClick={downloadRender}
                    disabled={!renders[activeRender]?.ok}
                    style={{
                      flex:1, padding:"9px", minWidth:140,
                      background: renders[activeRender]?.ok ? "#276749" : "#e2e8f0",
                      color: renders[activeRender]?.ok ? "white" : "#a0aec0",
                      border:"none", borderRadius:8,
                      cursor: renders[activeRender]?.ok ? "pointer" : "not-allowed",
                      fontWeight:700, fontSize:12,
                    }}
                  >
                    ⬇️ Descargar {renders[activeRender]?.label || ""}
                  </button>
                  <button onClick={handleRender} style={{ flex:1, padding:"9px", minWidth:140, background:"#ebf8ff", color:"#2b6cb0", border:"1px solid #bee3f8", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}>
                    🔄 Regenerar todo
                  </button>
                  {/* ── Portada ─────────────────────────── */}
                  {isPro && renders[activeRender]?.ok && (
                    <button
                      onClick={() => savePortada(renders[activeRender].imageUrl)}
                      style={{
                        padding:"9px 14px", borderRadius:8, border:"none", cursor:"pointer",
                        background: portadaSaved ? "#276749" : "#faf5ff",
                        color: portadaSaved ? "white" : "#553c9a",
                        fontWeight:700, fontSize:12, whiteSpace:"nowrap", transition:"all .2s",
                      }}
                    >
                      {portadaSaved ? "✅ Portada guardada" : "⭐ Usar como portada"}
                    </button>
                  )}
                  {/* ── WhatsApp render singolo ───────────── */}
                  {renders[activeRender]?.ok && (
                    <button
                      onClick={() => {
                        const url = renders[activeRender].imageUrl;
                        const label = renders[activeRender].label || "ambiente";
                        const msg = encodeURIComponent(`🏗️ *Obra Nova — Visualización AI*

✨ Render de ${label}${proyectoNombre ? ` para "${proyectoNombre}"` : ""}

${url}`);
                        window.open(`https://wa.me/?text=${msg}`, "_blank");
                      }}
                      style={{ padding:"9px 14px", borderRadius:8, border:"none", cursor:"pointer", background:"#25d366", color:"white", fontWeight:700, fontSize:12, whiteSpace:"nowrap" }}
                    >
                      💬 WhatsApp
                    </button>
                  )}
                  {/* ── Before/After per WhatsApp ───────────── */}
                  {photoPreview && renders[activeRender]?.ok && (
                    <button
                      onClick={async () => {
                        try {
                          const canvas = document.createElement("canvas");
                          const W = 1200, H = 630; // formato WhatsApp/social preview
                          canvas.width = W; canvas.height = H;
                          const ctx = canvas.getContext("2d");

                          // Carica entrambe le immagini
                          const loadImg = (src) => new Promise((res, rej) => {
                            const img = new Image();
                            img.crossOrigin = "anonymous";
                            img.onload = () => res(img);
                            img.onerror = rej;
                            img.src = src;
                          });

                          const [imgBefore, imgAfter] = await Promise.all([
                            loadImg(photoPreview),
                            loadImg(renders[activeRender].imageUrl),
                          ]);

                          // Background
                          ctx.fillStyle = "#1a365d";
                          ctx.fillRect(0, 0, W, H);

                          // Before (left half)
                          const halfW = W / 2 - 3;
                          ctx.save();
                          ctx.beginPath();
                          ctx.roundRect(10, 50, halfW - 10, H - 100, 12);
                          ctx.clip();
                          const bRatio = imgBefore.width / imgBefore.height;
                          const bDrawH = H - 100;
                          const bDrawW = bDrawH * bRatio;
                          ctx.drawImage(imgBefore, 10 + (halfW - 10 - bDrawW) / 2, 50, bDrawW, bDrawH);
                          ctx.restore();

                          // After (right half)
                          ctx.save();
                          ctx.beginPath();
                          ctx.roundRect(W / 2 + 3, 50, halfW - 10, H - 100, 12);
                          ctx.clip();
                          const aRatio = imgAfter.width / imgAfter.height;
                          const aDrawH = H - 100;
                          const aDrawW = aDrawH * aRatio;
                          ctx.drawImage(imgAfter, W / 2 + 3 + (halfW - 10 - aDrawW) / 2, 50, aDrawW, aDrawH);
                          ctx.restore();

                          // Labels
                          ctx.font = "bold 18px sans-serif";
                          ctx.fillStyle = "rgba(0,0,0,0.6)";
                          ctx.fillRect(20, 56, 80, 28); ctx.fillRect(W / 2 + 13, 56, 100, 28);
                          ctx.fillStyle = "white";
                          ctx.fillText("ANTES", 32, 76);
                          ctx.fillText("DESPUÉS", W / 2 + 22, 76);

                          // Divider
                          ctx.fillStyle = "white";
                          ctx.fillRect(W / 2 - 2, 50, 4, H - 100);

                          // Branding
                          ctx.font = "bold 16px sans-serif";
                          ctx.fillStyle = "rgba(255,255,255,0.9)";
                          ctx.fillText("OBRA NOVA — Render AI", W / 2 - 100, H - 16);
                          ctx.font = "12px sans-serif";
                          ctx.fillStyle = "rgba(255,255,255,0.6)";
                          ctx.fillText("app.obranova.cl", W / 2 - 42, H - 2);

                          // Download
                          const a = document.createElement("a");
                          a.download = `antes-despues-${Date.now()}.jpg`;
                          a.href = canvas.toDataURL("image/jpeg", 0.92);
                          a.click();
                          onToast?.("✅ Imagen Antes/Después descargada");
                        } catch (e) {
                          console.error("Before/After:", e);
                          onToast?.("⚠️ Error al generar imagen");
                        }
                      }}
                      style={{ padding:"9px 14px", borderRadius:8, border:"none", cursor:"pointer", background:"linear-gradient(135deg,#553c9a,#2b6cb0)", color:"white", fontWeight:700, fontSize:12, whiteSpace:"nowrap" }}
                    >
                      🔀 Antes/Después
                    </button>
                  )}
                  {renders.filter(r => r.ok).length > 1 && (
                    <button onClick={() => {
                      renders.filter(r => r.ok).forEach((r, i) => {
                        setTimeout(() => {
                          const a = document.createElement("a");
                          a.href = r.imageUrl; a.download = `render_${r.label || r.roomType || i}.jpg`;
                          a.target = "_blank"; a.rel = "noopener";
                          document.body.appendChild(a); a.click(); document.body.removeChild(a);
                        }, i * 500);
                      });
                    }} style={{ padding:"9px 14px", background:"#553c9a", color:"white", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12, whiteSpace:"nowrap" }}>
                      📦 Descargar todos ({renders.filter(r => r.ok).length})
                    </button>
                  )}
                </div>

                {/* Portfolio tip */}
                {workspaceId && renders.filter(r => r.ok).length > 0 && (
                  <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "linear-gradient(135deg,#fefcbf,#faf089)", borderRadius: 8, border: "1px solid #ecc94b" }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>🎨</span>
                    <div style={{ flex: 1, fontSize: 11, color: "#744210" }}>
                      Tus renders aparecen en tu <strong>portfolio público</strong> — compártelo con tus clientes
                    </div>
                    <button
                      onClick={() => window.open(`${window.location.origin}/portfolio/${workspaceId}`, "_blank")}
                      style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: "#b7791f", color: "white", fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                    >
                      Ver portfolio
                    </button>
                  </div>
                )}

                {/* ── Refinar prompt ─────────────────────────────────────── */}
                <div style={{ marginTop:14, background:"#f7fafc", borderRadius:10, padding:"12px 14px", border:"1px solid #e2e8f0" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#1a365d", marginBottom:6 }}>✏️ Refinar indicaciones y regenerar</div>
                  <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="Modifica tus indicaciones: materiales, colores, estilo, iluminación..."
                    rows={2}
                    style={{
                      width:"100%", padding:"8px 10px", border:"1.5px solid #bee3f8",
                      borderRadius:8, fontSize:12, resize:"vertical", boxSizing:"border-box",
                      color:"#2d3748", fontFamily:"inherit", background:"white",
                    }}
                  />
                  <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
                    {["Más luz natural","Madera oscura","Colores cálidos","Más minimalista","Con plantas","Piso de mármol","Estilo rústico"].map(sug => (
                      <button key={sug} onClick={() => setPrompt(p => p ? `${p}, ${sug.toLowerCase()}` : sug.toLowerCase())}
                        style={{ padding:"4px 10px", borderRadius:99, border:"1px solid #bee3f8", background:"white", color:"#2b6cb0", fontSize:10, fontWeight:600, cursor:"pointer" }}>
                        + {sug}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleRender}
                    disabled={rendering}
                    style={{
                      marginTop:10, width:"100%", padding:"10px",
                      background: rendering ? "#a0aec0" : "linear-gradient(135deg,#553c9a,#2b6cb0)",
                      color:"white", border:"none", borderRadius:8, cursor: rendering ? "not-allowed" : "pointer",
                      fontWeight:800, fontSize:13,
                    }}
                  >
                    {rendering ? "⏳ Regenerando..." : "✨ Regenerar con nuevas indicaciones"}
                  </button>
                </div>
              </div>
            )}

            {/* Placeholder render vuoto */}
            {!renderImg && !rendering && renders.length === 0 && (
              <div style={{
                background:"white", borderRadius:12, padding:32,
                boxShadow:"0 1px 4px rgba(0,0,0,.07)",
                display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                border:"2px dashed #e2e8f0", minHeight:200,
              }}>
                <div style={{ fontSize:48, marginBottom:12, opacity:.4 }}>🎨</div>
                <div style={{ fontSize:13, color:"#a0aec0", fontWeight:600, textAlign:"center" }}>
                  El render aparecerá aquí
                </div>
                <div style={{ fontSize:11, color:"#cbd5e0", marginTop:4, textAlign:"center" }}>
                  ~$0.05 por habitación · flux-pro
                </div>
              </div>
            )}

            {/* ── Storico render (versioni precedenti) ──────────────────── */}
            {renderHistory.length > 0 && (
              <div style={{ background:"white", borderRadius:12, padding:16, boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div style={{ fontWeight:800, fontSize:12, color:"#1a365d", letterSpacing:.5 }}>
                    📁 HISTORIAL DE VERSIONES — {renderHistory.length}
                  </div>
                  <button onClick={() => setShowHistory(v => !v)}
                    style={{ background:"none", border:"1px solid #e2e8f0", borderRadius:6, padding:"3px 10px", cursor:"pointer", fontSize:11, color:"#718096", fontWeight:600 }}>
                    {showHistory ? "Ocultar" : "Ver todo"}
                  </button>
                </div>

                {/* Preview compatto — ultime 4 */}
                {!showHistory && (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(80px,1fr))", gap:6 }}>
                    {renderHistory.slice(0, 4).map((r, i) => (
                      <div key={r.id} onClick={() => { setRenderImg(r.imageUrl); setActiveRender(-1); }}
                        style={{ cursor:"pointer", borderRadius:6, overflow:"hidden", border: renderImg === r.imageUrl ? "2px solid #2b6cb0" : "1px solid #e2e8f0", transition:"border .2s" }}>
                        <img src={r.imageUrl} alt={r.label} style={{ width:"100%", height:56, objectFit:"cover", display:"block" }} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Gallery completa */}
                {showHistory && (
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {renderHistory.map((r, i) => {
                      const date = r.createdAt ? new Date(r.createdAt) : null;
                      const dateStr = date ? date.toLocaleDateString("es-CL", { day:"2-digit", month:"short" }) + " " + date.toLocaleTimeString("es-CL", { hour:"2-digit", minute:"2-digit" }) : "";
                      const modeIcon = { controlnet:"📐", img2img:"📷", txt2img:"✍️" }[r.mode] || "🎨";
                      return (
                        <div key={r.id} onClick={() => { setRenderImg(r.imageUrl); setActiveRender(-1); }}
                          style={{
                            display:"flex", gap:10, padding:"8px 10px", borderRadius:8, cursor:"pointer",
                            background: renderImg === r.imageUrl ? "#ebf8ff" : "#f7fafc",
                            border: renderImg === r.imageUrl ? "1.5px solid #2b6cb0" : "1px solid #e2e8f0",
                            transition:"all .2s",
                          }}>
                          <img src={r.imageUrl} alt={r.label} style={{ width:80, height:56, objectFit:"cover", borderRadius:6, flexShrink:0 }} />
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:12, fontWeight:700, color:"#1a365d", marginBottom:2 }}>
                              {modeIcon} {r.label || r.roomType || "Render"}
                            </div>
                            <div style={{ fontSize:10, color:"#718096" }}>
                              {r.style || ""}{dateStr ? ` · ${dateStr}` : ""}
                            </div>
                            <div style={{ fontSize:10, color:"#a0aec0", marginTop:1 }}>
                              Versión {renderHistory.length - i}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Panel Render Rápido (standalone) ────────────────────────────── */}
        {panel === "standalone" && (
          <div style={{ flex:1, minWidth:300, display:"flex", flexDirection:"column", gap:12 }}>

            {/* Torna all'editor */}
            <button onClick={() => setPanel("editor")}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 16px", borderRadius:10,
                border:"2px solid #e2e8f0", background:"white", color:"#1a365d",
                cursor:"pointer", fontWeight:700, fontSize:13, boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}
              onMouseEnter={e => e.currentTarget.style.borderColor="#276749"}
              onMouseLeave={e => e.currentTarget.style.borderColor="#e2e8f0"}
            >
              ✏️ Volver al Editor
            </button>

            {/* Header card */}
            <div style={{ background:"linear-gradient(135deg,#276749,#38a169)", borderRadius:12, padding:"14px 18px" }}>
              <div style={{ color:"white", fontWeight:900, fontSize:15, marginBottom:4 }}>⚡ Render Rápido</div>
              <div style={{ color:"rgba(255,255,255,.8)", fontSize:12 }}>
                Sin plano 2D — sube una foto o describe el ambiente y genera el render directamente
              </div>
            </div>

            {/* Foto upload */}
            <div style={{ background:"white", borderRadius:12, padding:16, boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
              <div style={{ fontWeight:800, fontSize:12, color:"#1a365d", marginBottom:10, letterSpacing:.5 }}>
                📷 FOTO DEL AMBIENTE (opcional)
              </div>
              {!isPro ? (
                <div style={{ background:"#f0fff4", border:"1.5px dashed #276749", borderRadius:10, padding:14, textAlign:"center" }}>
                  <div style={{ fontSize:20, marginBottom:4 }}>📷</div>
                  <div style={{ fontSize:12, fontWeight:700, color:"#276749", marginBottom:2 }}>Disponible en Pro</div>
                  <div style={{ fontSize:11, color:"#4a5568" }}>Sube una foto real y transfórmala con IA</div>
                </div>
              ) : photoPreview ? (
                <div style={{ position:"relative" }}>
                  <img src={photoPreview} alt="Foto" style={{ width:"100%", borderRadius:8, maxHeight:160, objectFit:"cover", display:"block" }} />
                  <button onClick={removePhoto} style={{ position:"absolute", top:6, right:6, background:"rgba(0,0,0,.55)", color:"white", border:"none", borderRadius:"50%", width:26, height:26, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
                  <div style={{ fontSize:10, color:"#276749", fontWeight:600, marginTop:5 }}>✅ Foto cargada — render con image-to-image</div>
                </div>
              ) : (
                <>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} style={{ display:"none" }} />
                  <button onClick={() => fileInputRef.current?.click()} style={{ width:"100%", padding:"12px 16px", borderRadius:10, border:"2px dashed #c6f6d5", background:"#f0fff4", cursor:"pointer", textAlign:"center" }}>
                    <div style={{ fontSize:22, marginBottom:4 }}>📷</div>
                    <div style={{ fontSize:12, fontWeight:700, color:"#276749" }}>Subir foto del ambiente</div>
                    <div style={{ fontSize:10, color:"#718096", marginTop:3 }}>JPG / PNG · max 10MB</div>
                  </button>
                </>
              )}
            </div>

            {/* Prompt + Genera */}
            <div style={{ background:"white", borderRadius:12, padding:16, boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>

              {/* Prompt */}
              <div style={{ fontWeight:800, fontSize:12, color:"#1a365d", marginBottom:8, letterSpacing:.5 }}>
                ✍️ DESCRIBE TU DISEÑO
              </div>
              <div style={{ fontSize:11, color:"#718096", marginBottom:8 }}>
                Describe el ambiente, materiales, colores y estilo que quieres. Cuanto más detallado, mejor resultado.
              </div>
              <textarea
                value={standalonePrompt}
                onChange={e => setStandalonePrompt(e.target.value)}
                placeholder="Ej: baño mediterráneo con ceramico azul, madera negra, luz natural cálida, espejo grande redondo, plantas..."
                rows={4}
                style={{ width:"100%", padding:"10px 12px", border:"1.5px solid #c6f6d5", borderRadius:8, fontSize:12,
                  resize:"vertical", boxSizing:"border-box", fontFamily:"inherit", color:"#2d3748" }}
              />
              {/* Sugerencias rápidas (additive) */}
              <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:8 }}>
                {[
                  "Sala moderna con sofá gris","Cocina nórdica con madera clara",
                  "Dormitorio minimalista","Baño con ceramico azul y madera",
                  "Terraza con plantas y piedra","Oficina industrial con ladrillo",
                  "Comedor elegante con mármol","Garage moderno",
                ].map(sug => (
                  <button key={sug} onClick={() => setStandalonePrompt(prev => prev ? `${prev}, ${sug.toLowerCase()}` : sug)}
                    style={{ padding:"4px 10px", borderRadius:99, border:"1px solid #c6f6d5", background:"white", color:"#276749", fontSize:10, fontWeight:600, cursor:"pointer" }}>
                    + {sug}
                  </button>
                ))}
              </div>

              {/* Bottone genera */}
              <button
                onClick={handleRenderStandalone}
                disabled={standaloneRendering || (!standalonePrompt.trim() && !photoBase64)}
                style={{
                  marginTop:14, width:"100%", padding:"13px",
                  background: standaloneRendering ? "#a0aec0"
                    : (!standalonePrompt.trim() && !photoBase64) ? "#e2e8f0"
                    : "linear-gradient(135deg,#276749,#2b6cb0)",
                  color: (!standalonePrompt.trim() && !photoBase64) ? "#a0aec0" : "white",
                  border:"none", borderRadius:9, fontWeight:900, fontSize:14,
                  cursor: standaloneRendering || (!standalonePrompt.trim() && !photoBase64) ? "not-allowed" : "pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                }}
              >
                {standaloneRendering ? (
                  <><span style={{ animation:"spin 1s linear infinite", display:"inline-block" }}>⏳</span> {standaloneStep}</>
                ) : (!standalonePrompt.trim() && !photoBase64) ? (
                  "Escribe un prompt o sube una foto"
                ) : (
                  "✨ Generar Render AI"
                )}
              </button>
            </div>

            {/* Risultato */}
            {standaloneResult && (
              <div style={{ background:"white", borderRadius:12, padding:16, boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
                <div style={{ fontWeight:800, fontSize:12, color:"#1a365d", marginBottom:10, letterSpacing:.5 }}>
                  ✅ RENDER GENERADO
                </div>
                <img src={standaloneResult} alt="Render" style={{ width:"100%", borderRadius:10, display:"block", boxShadow:"0 4px 20px rgba(0,0,0,.12)" }} />
                <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap" }}>
                  <button
                    onClick={async () => {
                      const finalUrl = await applyWatermark(standaloneResult);
                      const a = document.createElement("a");
                      a.href = finalUrl;
                      a.download = `render-rapido-${Date.now()}.jpg`;
                      a.click();
                    }}
                    style={{ flex:1, padding:"9px", background:"#276749", color:"white", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}
                  >
                    ⬇️ Descargar
                  </button>
                  <button
                    onClick={() => {
                      const msg = encodeURIComponent(`🏗️ *Obra Nova — Render Rápido AI*\n\n${standaloneResult}`);
                      window.open(`https://wa.me/?text=${msg}`, "_blank");
                    }}
                    style={{ flex:1, padding:"9px", background:"#25d366", color:"white", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}
                  >
                    💬 WhatsApp
                  </button>
                  {isPro && (
                    <button
                      onClick={() => savePortada(standaloneResult)}
                      style={{ padding:"9px 14px", background: portadaSaved ? "#276749" : "#faf5ff", color: portadaSaved ? "white" : "#553c9a", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:12 }}
                    >
                      {portadaSaved ? "✅ Portada guardada" : "⭐ Usar como portada"}
                    </button>
                  )}
                </div>
                <div style={{ marginTop:10, fontSize:11, color:"#718096", textAlign:"center" }}>
                  El render también aparece en tu galería de renders del proyecto
                </div>
              </div>
            )}

          </div>
        )}

        {/* ── Comparazione 4 stili ────────────────────────────────────────── */}
        <div style={{ background:"white", borderRadius:12, padding:16, boxShadow:"0 1px 4px rgba(0,0,0,.07)" }}>
          <div style={{ fontWeight:800, fontSize:12, color:"#1a365d", marginBottom:10, letterSpacing:.5 }}>
            🎨 COMPARAR 4 VARIANTES
          </div>
          <div style={{ fontSize:11, color:"#718096", marginBottom:10 }}>
            Genera 4 interpretaciones diferentes del mismo prompt para elegir la que más te gusta.
          </div>
          <button
            onClick={handleCompareStyles}
            disabled={comparingStyles || (rooms.length === 0 && !photoBase64 && !prompt.trim() && !standalonePrompt.trim())}
            style={{
              width:"100%", padding:"10px", borderRadius:9, border:"none", cursor: comparingStyles ? "not-allowed" : "pointer",
              background: comparingStyles ? "#a0aec0" : "linear-gradient(135deg,#276749,#2b6cb0)",
              color:"white", fontWeight:800, fontSize:13,
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            }}
          >
            {comparingStyles ? (
              <><span style={{ animation:"spin 1s linear infinite", display:"inline-block" }}>⏳</span> Generando {compareRenders.length}/4...</>
            ) : "🎨 Comparar 4 variantes"}
          </button>

          {compareRenders.length > 0 && (
            <div style={{ marginTop:14 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                {[1,2,3,4].map(varNum => {
                  const r = compareRenders[varNum - 1];
                  const label = `Variante ${varNum}`;
                  return (
                    <div key={varNum} style={{ borderRadius:10, overflow:"hidden", border:"1.5px solid #e2e8f0", background:"#f7fafc" }}>
                      {r?.imageUrl ? (
                        <>
                          <div style={{ position:"relative" }}>
                            <img src={r.imageUrl} alt={label} style={{ width:"100%", height:130, objectFit:"cover", display:"block" }} />
                            <div style={{ position:"absolute", bottom:0, left:0, right:0, background:"rgba(26,54,93,.7)", padding:"4px 8px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                              <span style={{ color:"white", fontSize:11, fontWeight:700 }}>{label}</span>
                              <div style={{ display:"flex", gap:4 }}>
                                <button
                                  onClick={() => {
                                    setRenders(prev => [{ ok:true, imageUrl:r.imageUrl, label, roomType:"sala", mode:"compare" }, ...prev]);
                                    setActiveRender(0); setRenderImg(r.imageUrl); setPanel("render");
                                    onToast?.(`✅ ${label} añadido a renders`);
                                  }}
                                  style={{ background:"white", border:"none", borderRadius:4, padding:"2px 6px", fontSize:10, fontWeight:700, cursor:"pointer", color:"#1a365d" }}
                                >+ Usar</button>
                                <button
                                  onClick={() => savePortada(r.imageUrl)}
                                  style={{ background:"#faf5ff", border:"none", borderRadius:4, padding:"2px 6px", fontSize:10, fontWeight:700, cursor:"pointer", color:"#553c9a" }}
                                >⭐</button>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : r?.error ? (
                        <div style={{ height:130, display:"flex", alignItems:"center", justifyContent:"center", color:"#c53030", fontSize:11, padding:8, textAlign:"center" }}>
                          ❌ {label}<br/><span style={{ fontSize:9 }}>{r.error.slice(0,40)}</span>
                        </div>
                      ) : (
                        <div style={{ height:130, display:"flex", alignItems:"center", justifyContent:"center", color:"#a0aec0", fontSize:11 }}>
                          {comparingStyles ? <span style={{ animation:"spin 1s linear infinite", display:"inline-block", fontSize:20 }}>⏳</span> : `${label}...`}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
