// ─── diseno/constants.js ─────────────────────────────────────────────────────
// Dati statici per l'editor planimetria: tipi stanza, catalogo mobili, snap grid.

// ── Palette colori stanze ─────────────────────────────────────────────────────
export const ROOM_TYPES = [
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

// ── Catalogo mobili ───────────────────────────────────────────────────────────
export const FURNITURE_CAT = [
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

export const ALL_FURNS = FURNITURE_CAT.flatMap(c => c.items);

// ── Grid snap ─────────────────────────────────────────────────────────────────
export const GRID = 20;
export const snap = v => Math.round(v / GRID) * GRID;

// ── ID univoco ────────────────────────────────────────────────────────────────
let _id = 1;
export const uid = () => `r${_id++}`;

// ── Factory stanza ────────────────────────────────────────────────────────────
export const mkRoom = (type, x = 100, y = 100) => ({
  id: uid(), type: type.id,
  x: snap(x), y: snap(y),
  w: type.id === "baño" ? 120 : type.id === "pasillo" ? 60 : 200,
  h: type.id === "baño" ? 100 : type.id === "pasillo" ? 180 : 160,
  label: type.label,
});

// ── Factory mobile ────────────────────────────────────────────────────────────
export const mkFurniture = (furn, x = 120, y = 120) => ({
  id: uid(), kind: "furniture", type: furn.id,
  x: snap(x), y: snap(y), w: furn.w, h: furn.h,
  label: furn.label, rotation: 0,
});

// ── Canvas dimensions ─────────────────────────────────────────────────────────
export const CANVAS_W = 800;
export const CANVAS_H = 560;
