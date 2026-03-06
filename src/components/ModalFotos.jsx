// ─── components/ModalFotos.jsx ───────────────────────────────────────────────
// Galleria foto del progetto con supporto geolocalizzazione GPS.
// Estratto da App.jsx per mantenere il monolite snello.

import { useState } from "react";

const obtenerGeo = () => new Promise((resolve, reject) => {
  if (!navigator.geolocation) { reject(new Error("no_geo")); return; }
  navigator.geolocation.getCurrentPosition(
    pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, acc: Math.round(pos.coords.accuracy) }),
    err => reject(err),
    { enableHighAccuracy: true, timeout: 8000 }
  );
});

const ModalFotos = ({ fotos, setFotos, fotosMap, t, onClose }) => {
  const [galeriaModo, setGaleriaModo] = useState(false);
  const [fotosSort,   setFotosSort]   = useState("date");
  const [geoLoading,  setGeoLoading]  = useState(false);

  const sortedFotos = [...fotos].sort((a, b) =>
    fotosSort === "name"
      ? a.nombre.localeCompare(b.nombre)
      : new Date(b.fecha) - new Date(a.fecha)
  );
  const todasFotos = Object.values(fotosMap).flat();

  const agregarFoto = async (e) => {
    setGeoLoading(true);
    let geo = null;
    try { geo = await obtenerGeo(); } catch (_) { /* geo optional */ }
    setGeoLoading(false);
    Array.from(e.target.files).forEach(file => {
      const r = new FileReader();
      r.onload = ev => setFotos(fs => [...fs, {
        id: Date.now() + Math.random(),
        nombre: file.name,
        data: ev.target.result,
        fecha: new Date().toISOString(),
        descripcion: "",
        enPDF: true,
        geo: geo || null,
      }]);
      r.readAsDataURL(file);
    });
  };

  const abrirMapa = (geo) => {
    if (!geo) return;
    window.open(`https://www.google.com/maps?q=${geo.lat},${geo.lng}`, "_blank");
  };

  return (
    <div role="dialog" aria-modal="true"
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.65)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:12 }}>
      <div style={{ background:"white",borderRadius:16,padding:20,width:"100%",maxWidth:820,maxHeight:"93vh",overflow:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.35)" }}>

        {/* Header */}
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
          <div style={{ fontSize:17,fontWeight:700,color:"#1a365d" }}>📸 {t.fotosTitulo}</div>
          <button onClick={onClose} style={{ background:"#2d3748",border:"none",borderRadius:8,cursor:"pointer",padding:"5px 12px",color:"white",fontWeight:700 }}>✕</button>
        </div>

        {/* Tabs: Proyecto actual / Galería global */}
        <div style={{ display:"flex",gap:4,marginBottom:12,background:"#f0f4f8",borderRadius:10,padding:4 }}>
          {[[false, t.proyectoActual || "📂 Proyecto actual"], [true, t.galeriaGlobal || "🖼️ Galería global"]].map(([val, lbl]) => (
            <button key={String(val)} onClick={() => setGaleriaModo(val)}
              style={{ flex:1,padding:"7px 0",borderRadius:7,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,
                background: galeriaModo===val?"#2b6cb0":"transparent",
                color:      galeriaModo===val?"white":"#718096" }}>
              {lbl}
            </button>
          ))}
        </div>

        {/* Vista proyecto actual */}
        {!galeriaModo && <>
          <div style={{ display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center" }}>
            <label style={{ display:"flex",alignItems:"center",gap:6,padding:"7px 12px",
              background: geoLoading?"#718096":"#2b6cb0",
              color:"white",borderRadius:8,cursor:geoLoading?"wait":"pointer",fontSize:13,fontWeight:600 }}>
              {geoLoading
                ? "📍 " + (t.fotosObteniendoGeo || "Obteniendo ubicación...")
                : "📷 " + t.fotosAgregar}
              <input type="file" accept="image/*" multiple onChange={agregarFoto} style={{ display:"none" }} disabled={geoLoading} />
            </label>
            <div style={{ fontSize:11,color:"#718096",display:"flex",alignItems:"center",gap:4 }}>
              📍 {t.fotosGeoInfo || "Las fotos guardan tu ubicación GPS automáticamente"}
            </div>
            <div style={{ display:"flex",gap:3,background:"#f0f4f8",borderRadius:8,padding:3,marginLeft:"auto" }}>
              {[["date","📅"],["name","🔤"]].map(([v,l]) => (
                <button key={v} onClick={() => setFotosSort(v)}
                  style={{ padding:"4px 10px",borderRadius:6,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,
                    background: fotosSort===v?"#2b6cb0":"transparent",
                    color:      fotosSort===v?"white":"#718096" }}>{l}</button>
              ))}
            </div>
          </div>

          {sortedFotos.length === 0
            ? <div style={{ textAlign:"center",padding:"40px 0",color:"#a0aec0" }}>
                <div style={{ fontSize:36 }}>📷</div>
                <div style={{ marginTop:8 }}>{t.fotosSinFotos}</div>
              </div>
            : <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10 }}>
                {sortedFotos.map(f => (
                  <div key={f.id} style={{ borderRadius:10,overflow:"hidden",border:`2px solid ${f.enPDF?"#68d391":"#e2e8f0"}` }}>
                    <div style={{ position:"relative" }}>
                      <img src={f.data} alt={f.nombre} style={{ width:"100%",height:130,objectFit:"cover",display:"block" }} />
                      {/* Toggle PDF */}
                      <button onClick={() => setFotos(fs => fs.map(x => x.id===f.id ? {...x,enPDF:!x.enPDF} : x))}
                        style={{ position:"absolute",top:5,right:5,background:f.enPDF?"#276749":"rgba(0,0,0,.5)",
                          border:"none",borderRadius:99,cursor:"pointer",color:"white",fontWeight:700,fontSize:10,padding:"2px 7px" }}>
                        {f.enPDF ? (t.pdfOn||"📄 PDF") : (t.pdfOff||"⭕ PDF")}
                      </button>
                      {/* Badge GPS */}
                      {f.geo && (
                        <button onClick={() => abrirMapa(f.geo)}
                          title={`${f.geo.lat.toFixed(5)}, ${f.geo.lng.toFixed(5)} (±${f.geo.acc}m)`}
                          style={{ position:"absolute",bottom:5,left:5,background:"rgba(0,100,200,.8)",
                            border:"none",borderRadius:99,cursor:"pointer",color:"white",fontWeight:700,fontSize:10,padding:"2px 7px" }}>
                          📍 GPS
                        </button>
                      )}
                    </div>
                    <div style={{ padding:"7px 9px",background:"white" }}>
                      <div style={{ fontSize:10,color:"#718096",marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{f.nombre}</div>
                      {f.geo && (
                        <div style={{ fontSize:9,color:"#2b6cb0",marginBottom:4,display:"flex",alignItems:"center",gap:3 }}>
                          📍 {f.geo.lat.toFixed(4)}, {f.geo.lng.toFixed(4)}
                          <span style={{ color:"#a0aec0" }}>(±{f.geo.acc}m)</span>
                        </div>
                      )}
                      <input value={f.descripcion||""} placeholder={t.fotosDescripcion||"Descripción..."}
                        onChange={e => setFotos(fs => fs.map(x => x.id===f.id ? {...x,descripcion:e.target.value} : x))}
                        style={{ width:"100%",padding:"4px 7px",border:"1px solid #e2e8f0",borderRadius:6,fontSize:11,marginBottom:5,color:"#1a365d" }} />
                      <button onClick={() => setFotos(fs => fs.filter(x => x.id!==f.id))}
                        style={{ width:"100%",background:"#fff5f5",border:"1px solid #fed7d7",borderRadius:6,
                          cursor:"pointer",color:"#c53030",fontWeight:600,padding:"3px",fontSize:11 }}>
                        🗑️ {t.fotosEliminar}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
          }
        </>}

        {/* Vista galería global */}
        {galeriaModo && (
          <div>
            <div style={{ fontSize:13,color:"#718096",marginBottom:10 }}>
              {t.todasLasFotos || "Todas las fotos"} — {todasFotos.length} {t.fotosTotal || "en total."}
            </div>
            {todasFotos.length === 0
              ? <div style={{ textAlign:"center",padding:"40px 0",color:"#a0aec0" }}>
                  <div style={{ fontSize:36 }}>🖼️</div>
                  <div style={{ marginTop:8 }}>{t.sinFotos}</div>
                </div>
              : <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:8 }}>
                  {todasFotos.map((f, i) => (
                    <div key={i}
                      style={{ borderRadius:8,overflow:"hidden",border:"1px solid #e2e8f0",cursor:"pointer",position:"relative" }}
                      onClick={() => {
                        if (!fotos.find(x => x.data===f.data)) {
                          setFotos(fs => [...fs, { ...f, id:Date.now()+Math.random(), enPDF:false }]);
                          setGaleriaModo(false);
                        }
                      }}>
                      <img src={f.data} alt="" style={{ width:"100%",height:100,objectFit:"cover",display:"block" }} />
                      {f.geo && (
                        <div style={{ position:"absolute",top:3,right:3,background:"rgba(0,100,200,.8)",
                          borderRadius:99,color:"white",fontSize:8,padding:"1px 5px",fontWeight:700 }}>📍</div>
                      )}
                      {f.descripcion && (
                        <div style={{ padding:"3px 6px",fontSize:9,color:"#4a5568",background:"#f7fafc" }}>{f.descripcion}</div>
                      )}
                      <div style={{ padding:"3px 6px",fontSize:9,color:"#2b6cb0",background:"#ebf8ff",fontWeight:600 }}>
                        + {t.fotosAgregarBtn || "Agregar"}
                      </div>
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

export default ModalFotos;
