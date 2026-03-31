// ─── diseno/KonvaShapes.jsx ──────────────────────────────────────────────────
// Componenti Konva per stanze, mobili e griglia.
import { useRef, useEffect } from "react";
import { Rect, Text, Transformer, Line, Circle, Group, Shape } from "react-konva";
import { ROOM_TYPES, ALL_FURNS, GRID, snap } from "./constants";

// ── Sagoma mobile realistica ──────────────────────────────────────────────────
export function FurnitureShape({ item, selected, onSelect, onChange }) {
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

// ── Componente stanza Konva ───────────────────────────────────────────────────
export function RoomShape({ room, selected, onSelect, onChange }) {
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
        onTransformEnd={() => {
          const node = shapeRef.current;
          const newW = snap(Math.max(60, node.width()  * node.scaleX()));
          const newH = snap(Math.max(60, node.height() * node.scaleY()));
          const newX = snap(node.x());
          const newY = snap(node.y());
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
export function GridLines({ width, height }) {
  const lines = [];
  for (let x = 0; x <= width; x += GRID) {
    lines.push(<Line key={`v${x}`} points={[x, 0, x, height]} stroke="#e2e8f0" strokeWidth={0.5} listening={false} />);
  }
  for (let y = 0; y <= height; y += GRID) {
    lines.push(<Line key={`h${y}`} points={[0, y, width, y]} stroke="#e2e8f0" strokeWidth={0.5} listening={false} />);
  }
  return <>{lines}</>;
}
