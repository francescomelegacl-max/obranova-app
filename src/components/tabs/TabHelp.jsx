// ─── components/tabs/TabHelp.jsx ─────────────────────────────────────────────

export default function TabHelp({ t }) {

  // ── Componente separatore sezione ────────────────────────────────────────
  const Divider = ({ label }) => (
    <div style={{ display:"flex",alignItems:"center",gap:12,margin:"8px 0 4px" }}>
      <div style={{ flex:1,height:2,background:"linear-gradient(90deg,#1a365d,#e2e8f0)",borderRadius:99 }} />
      <span style={{ fontSize:11,fontWeight:800,color:"#1a365d",letterSpacing:1,whiteSpace:"nowrap",textTransform:"uppercase" }}>{label}</span>
      <div style={{ flex:1,height:2,background:"linear-gradient(270deg,#1a365d,#e2e8f0)",borderRadius:99 }} />
    </div>
  );

  // ── Componente card aiuto ─────────────────────────────────────────────────
  const HelpCard = ({ icon, title, desc, items, tip }) => (
    <div style={{ background:"white",borderRadius:12,padding:"16px 18px",boxShadow:"0 1px 4px rgba(0,0,0,.07)",display:"flex",flexDirection:"column",gap:8 }}>
      <div style={{ display:"flex",alignItems:"center",gap:10 }}>
        <span style={{ fontSize:26,flexShrink:0 }}>{icon}</span>
        <div style={{ fontWeight:800,fontSize:14,color:"#1a365d" }}>{title}</div>
      </div>
      {desc && <div style={{ fontSize:12,color:"#4a5568",lineHeight:1.6 }}>{desc}</div>}
      {items && (
        <div style={{ display:"flex",flexDirection:"column",gap:5,marginTop:2 }}>
          {items.map(([label, detail], i) => (
            <div key={i} style={{ display:"flex",gap:8,alignItems:"flex-start",padding:"6px 10px",background:"#f7fafc",borderRadius:8 }}>
              <span style={{ fontSize:11,fontWeight:700,color:"#2b6cb0",flexShrink:0,minWidth:24 }}>→</span>
              <div>
                <span style={{ fontSize:12,fontWeight:700,color:"#2d3748" }}>{label}: </span>
                <span style={{ fontSize:12,color:"#718096" }}>{detail}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {tip && (
        <div style={{ background:"#fffaf0",border:"1px solid #fbd38d",borderRadius:8,padding:"7px 11px",fontSize:11,color:"#b7791f",display:"flex",gap:6 }}>
          <span>💡</span><span>{tip}</span>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ maxWidth:760,margin:"0 auto",display:"flex",flexDirection:"column",gap:10 }}>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#1a365d,#2d3748)",borderRadius:14,padding:"24px 28px",color:"white" }}>
        <div style={{ fontSize:22,fontWeight:800,marginBottom:5 }}>❓ {t.helpTitulo}</div>
        <div style={{ color:"#a0aec0",fontSize:13 }}>{t.helpBienvenida}</div>
        <div style={{ color:"#90cdf4",fontSize:12,marginTop:6 }}>
          Guía completa de todas las secciones — léela una vez y tendrás todo claro.
        </div>
      </div>

      {/* ─── FLUJO BÁSICO ─────────────────────────────────────────────── */}
      <Divider label="Flujo básico" />

      <HelpCard icon="📋" title="1. Proyecto — datos generales"
        desc="Aquí defines toda la información del proyecto: cliente, descripción, dirección, fechas y condiciones de pago."
        items={[
          ["Cliente / Propietario", "Nombre completo del cliente o empresa"],
          ["Fechas estimadas", "Inicio y término ayudan a calcular plazos en el PDF"],
          ["Validez", "Días que tiene vigencia el presupuesto antes de vencer"],
          ["Condición de pago", "Contado, cuotas, crédito o personalizado — aparece en el PDF"],
          ["Estado", "Cambia el estado (Borrador → Enviado → Aceptado) desde la barra superior"],
        ]}
        tip="Guarda automáticamente cada vez que modificas un campo — el indicador 'Guardado ✓' lo confirma."
      />

      <HelpCard icon="🏗️" title="2. Costos directos — partidas"
        desc="Ingresa todas las partidas de la obra. Cada fila es un ítem de costo con categoría, descripción, unidad, cantidad y precio."
        items={[
          ["Categoría", "Agrupa los ítems (Materiales, Mano de obra, Subcontratos...) — puedes crear categorías propias"],
          ["Unidad", "m², m³, ml, kg, un, hr, etc."],
          ["Precio unitario", "Puedes buscar el precio en MercadoLibre directamente con el botón 🛒"],
          ["👁️ Visibilidad", "Oculta partidas que no quieres mostrar al cliente en el PDF"],
          ["Proveedor / Nota interna", "Campos opcionales visibles con el botón '▼ Más'"],
        ]}
        tip="Filtra por categoría para trabajar más rápido en obras grandes. El total se calcula automáticamente en tiempo real."
      />

      <HelpCard icon="📊" title="3. Resumen — márgenes y porcentajes"
        desc="Configura los porcentajes de overhead y utilidad. El sistema calcula todo automáticamente sobre los costos directos."
        items={[
          ["CI — Costos Indirectos", "Gastos de administración, herramientas, transporte (ej. 10%)"],
          ["GF — Gastos Fijos", "Arriendos, sueldos fijos, seguros de la empresa (ej. 5%)"],
          ["Imprevistos", "Margen de seguridad para imprevistos en obra (ej. 5%)"],
          ["Utilidad", "Tu margen de ganancia sobre el subtotal (ej. 20%)"],
          ["IVA 19%", "Actívalo con el toggle — aparece desglosado en el PDF"],
        ]}
        tip="Un margen total sobre el 15% es saludable. Si está en rojo, revisa tus costos directos o sube la utilidad."
      />

      <HelpCard icon="🖨️" title="4. Vista Cliente — PDF y firma"
        desc="Configura qué ve el cliente en el presupuesto antes de imprimir o enviar para firma digital."
        items={[
          ["Visibilidad por categoría", "Activa/desactiva cada categoría — el cliente solo ve las activas"],
          ["Detalle vs Solo total", "Elige si el cliente ve el desglose de ítems o solo el total por categoría"],
          ["Firma digital", "Genera un enlace que el cliente puede abrir desde su celular para firmar"],
          ["Imprimir PDF", "Usa el botón 🖨️ del header — se imprime solo la vista cliente, sin controles"],
        ]}
        tip="Oculta los costos de materiales y muestra solo el total por categoría para presupuestos más 'limpios'."
      />

      {/* ─── SECCIONES CORE ───────────────────────────────────────────── */}
      <Divider label="Secciones principales" />

      <HelpCard icon="📦" title="Lista de Precios — tu catálogo de materiales"
        desc="Guarda materiales con precio de compra, precio al cliente y margen calculado automáticamente. Reutilízalos en cualquier proyecto."
        items={[
          ["Agregar material", "Botón '+ Agregar' — ingresa nombre, categoría, unidad y precios"],
          ["Precio compra vs cliente", "El margen % se calcula solo: (cliente - compra) / cliente"],
          ["Buscar precio ML", "Botón 🛒 dentro del formulario — busca en MercadoLibre y usa el precio"],
          ["Usar en proyecto", "Botón '+ Costos' en cada fila — agrega el material directo a las partidas"],
          ["Categorías", "Comparte las mismas categorías que los costos directos"],
        ]}
        tip="Mantén el listino actualizado con los precios reales — así los presupuestos futuros serán más precisos."
      />

      <HelpCard icon="🏭" title="Bodega — gestión de stock"
        desc="Controla el inventario de materiales en obra: stock actual, stock mínimo y alertas automáticas cuando hay que reponer."
        items={[
          ["Nuevo artículo", "Define nombre, categoría, unidad, stock actual y stock mínimo"],
          ["Stock mínimo", "Cuando el stock baja de este valor aparece ⚠️ y una alerta roja en el panel"],
          ["Registrar movimiento 🔄", "Carga (entrada), Descarga (salida), Transferencia o Rectificación"],
          ["Valor bodega", "Stock × precio/unidad — visible en el KPI superior"],
          ["Filtros", "Filtra por categoría o usa '⚠️ Solo alertas' para ver solo lo que falta"],
        ]}
        tip="Vincula los movimientos de descarga a un proyecto específico para tener trazabilidad completa."
      />

      <HelpCard icon="📈" title="Histórico de Materiales"
        desc="Registro automático de todos los materiales usados en todos los proyectos, con evolución de precios."
        items={[
          ["Última compra", "Precio más reciente pagado por ese material"],
          ["Tendencia", "📈 Subió / 📉 Bajó vs primera compra registrada"],
          ["Proyectos", "En cuántos proyectos apareció ese material"],
          ["Últimas compras", "Historial de las últimas 5 compras con fecha y proveedor"],
        ]}
        tip="Útil para detectar inflación en materiales específicos y ajustar presupuestos futuros."
      />

      <HelpCard icon="🧾" title="Facturas — facturación a clientes"
        desc="Convierte presupuestos aceptados en facturas. Gestiona cobros, fechas de vencimiento y estado de pago."
        items={[
          ["Crear factura", "Solo desde presupuestos con estado Aceptado"],
          ["Estados", "⏳ Pendiente → ✅ Pagada — cambia con un clic"],
          ["Vencimiento", "Si pasa la fecha sin marcar como pagada aparece 🔴 Vencida"],
          ["PDF factura", "Botón 🖨️ en cada fila — genera PDF listo para enviar al cliente"],
        ]}
        tip="Revisa el panel superior para ver el total cobrado vs pendiente en tiempo real."
      />

      <HelpCard icon="🇨🇱" title="SII — Documentos Tributarios Electrónicos"
        desc="Genera el XML del DTE a partir de los presupuestos aceptados para cargar directamente en el portal del SII."
        items={[
          ["Tipos de DTE", "33 Factura, 39 Boleta, 61 Nota de Crédito, 56 Nota de Débito"],
          ["Folio", "Número correlativo del documento — debes llevar el control tú mismo"],
          ["RUT receptor", "RUT del cliente en formato 12345678-9"],
          ["Descargar XML", "Descarga el archivo y súbelo manualmente en mipyme.sii.cl"],
          ["Historial", "Todos los DTE generados quedan guardados con fecha y cliente"],
        ]}
        tip="El XML generado es un borrador — debes completar RUT emisor y CAF real antes de enviar al SII."
      />

      {/* ─── HERRAMIENTAS ─────────────────────────────────────────────── */}
      <Divider label="Herramientas" />

      <HelpCard icon="🔍" title="Búsqueda global — Ctrl+K"
        desc="Busca en todos los proyectos, clientes y materiales al mismo tiempo. Abre con Ctrl+K o el botón 🔍 del header."
        items={[
          ["Buscar cliente", "Encuentra proyectos por nombre de cliente"],
          ["Buscar material", "Encuentra proyectos que contienen una partida específica"],
          ["Clic en resultado", "Abre directamente el proyecto seleccionado"],
        ]}
      />

      <HelpCard icon="📸" title="Fotos con GPS"
        desc="Agrega fotos a cada proyecto. Al agregar una foto se guarda automáticamente la ubicación GPS."
        items={[
          ["Badge 📍", "Aparece en cada foto con GPS — clic para abrir en Google Maps"],
          ["Galería global", "Ve todas las fotos de todos los proyectos desde la tab Galería"],
          ["PDF", "Controla qué fotos aparecen en el PDF con el toggle 📄 ON/OFF"],
        ]}
      />

      <HelpCard icon="👥" title="Multi-usuario — workspace"
        desc="Invita a colaboradores a tu workspace. Cada uno tiene su rol con permisos diferentes."
        items={[
          ["Admin", "Acceso total — puede invitar, editar y eliminar"],
          ["Editor", "Puede crear y editar proyectos"],
          ["Viewer", "Solo lectura — ve los proyectos pero no puede modificar"],
          ["Invitar", "Desde ⚙️ Ajustes → ingresa el email del colaborador"],
        ]}
      />

    </div>
  );
}
