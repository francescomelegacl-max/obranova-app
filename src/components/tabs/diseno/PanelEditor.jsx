// ─── diseno/PanelEditor.jsx ──────────────────────────────────────────────────
// Sidebar (stanze + mobili + selezione) + Canvas Konva.
import { Stage, Layer, Rect } from "react-konva";
import { ROOM_TYPES, FURNITURE_CAT, ALL_FURNS, GRID, CANVAS_W, CANVAS_H } from "./constants";
import { RoomShape, FurnitureShape, GridLines } from "./KonvaShapes";

export default function PanelEditor({
  rooms, furniture, selected, activeLayer, openCat,
  stageRef, selectedRoom, selectedFurn,
  addRoom, addFurniture, changeRoom, changeFurn,
  rotateSelected, deleteSelected,
  setSelected, setActiveLayer, setOpenCat,
  setRooms, setFurniture,
}) {
  return (
    <>
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
            <div style={{ fontWeight:800, fontSize:10, color:"#1a365d", marginBottom:8, letterSpacing:.5 }}>HABITACIONES</div>
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
            <div style={{ fontWeight:800, fontSize:10, color:"#1a365d", marginBottom:8, letterSpacing:.5 }}>MOBILIARIO</div>
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
                También puedes arrastrar las esquinas en el plano
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
                }}>
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
    </>
  );
}
