import { fmt, calcTotals } from "./helpers";
import { EMPRESA }         from "./constants";

// ─── utils/contratoTemplates.js ───────────────────────────────────────────────
// 5 templates de contratos para el mercado de construcción chileno.
// Cada template recibe un objeto `datos` con los campos del proyecto
// y retorna el texto del contrato listo para PDF.
// Conformes a legislación chilena: Código Civil, Ley 19.472 (OGUC),
// Ley 20.703 (contratistas), y prácticas estándar del sector.
// ─────────────────────────────────────────────────────────────────────────────

export const TIPOS_CONTRATO = [
  { id: "obra",        label: "Contrato de Obra",         emoji: "🏗️", desc: "Ristrutturazione o costruzione completa" },
  { id: "suministro",  label: "Contrato de Suministro",   emoji: "📦", desc: "Fornitura di materiali" },
  { id: "subcontrato", label: "Contrato de Subcontrato",  emoji: "👷", desc: "Lavori specializzati (elettrico, idraulico...)" },
  { id: "encargo",     label: "Carta de Encargo",         emoji: "✍️", desc: "Incarico semplice pre-contratto" },
  { id: "mantencion",  label: "Contrato de Mantención",   emoji: "🔧", desc: "Manutenzione programmata post-obra" },
];

// ── Helper formattazione ──────────────────────────────────────────────────────
const fmtCLP = (n) => fmt(n) + (n ? " CLP" : "");

function hoy() {
  return new Date().toLocaleDateString("es-CL", {
    day: "numeric", month: "long", year: "numeric"
  });
}

function ciudadFecha(ciudad) {
  return `${ciudad || "Coquimbo"}, ${hoy()}`;
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. CONTRATO DE OBRA
// ══════════════════════════════════════════════════════════════════════════════
export function generarContratoObra(datos) {
  const {
    contratista = "[NOMBRE CONTRATISTA]",
    rutContratista = "[RUT]",
    domicilioContratista = "[DOMICILIO]",
    cliente = "[NOMBRE CLIENTE]",
    rutCliente = "[RUT CLIENTE]",
    domicilioCliente = "[DOMICILIO CLIENTE]",
    descripcionObra = "[DESCRIPCIÓN DE LA OBRA]",
    direccionObra = "[DIRECCIÓN DE LA OBRA]",
    ciudad = "Coquimbo",
    montoTotal = 0,
    plazo = 30,
    formaPago = "Al contado",
    cuotas = [],
    garantia = 6,
    workspace = "",
  } = datos;

  const cuotasTexto = cuotas.length > 0
    ? cuotas.map((c, i) =>
        `  ${i + 1}. ${c.label || `Cuota ${i+1}`}: ${fmtCLP(c.monto)} — ${c.condicion || "según avance"}`
      ).join("\n")
    : `  • Monto total: ${fmtCLP(montoTotal)}\n  • Forma de pago: ${formaPago}`;

  return `CONTRATO DE EJECUCIÓN DE OBRA
${ciudadFecha(ciudad)}

PARTES

CONTRATISTA: ${contratista}, RUT ${rutContratista}, domiciliado en ${domicilioContratista}, en adelante "el Contratista".

MANDANTE: ${cliente}, RUT ${rutCliente}, domiciliado en ${domicilioCliente}, en adelante "el Mandante".

ANTECEDENTES

Las partes, mayores de edad, capaces de contratar, han convenido celebrar el presente Contrato de Ejecución de Obra, sujeto a las siguientes cláusulas y condiciones:

CLÁUSULA PRIMERA — OBJETO DEL CONTRATO

El Contratista se obliga a ejecutar, por su cuenta y riesgo, la siguiente obra:

  Descripción: ${descripcionObra}
  Dirección: ${direccionObra}

De acuerdo al presupuesto detallado elaborado por el Contratista${workspace ? ` a través de ObraNova (workspace: ${workspace})` : ""}, que forma parte integrante del presente contrato.

CLÁUSULA SEGUNDA — PRECIO Y FORMA DE PAGO

El precio total por la ejecución de la obra es de ${fmtCLP(montoTotal)} (${montoTotal > 0 ? "pesos chilenos" : "según presupuesto adjunto"}).

Las condiciones de pago son las siguientes:
${cuotasTexto}

Los pagos se realizarán mediante transferencia bancaria, cheque o MercadoPago, contra recibo conforme emitido por el Contratista.

CLÁUSULA TERCERA — PLAZO DE EJECUCIÓN

El Contratista se compromete a ejecutar la totalidad de la obra en un plazo de ${plazo} días hábiles, contados desde la fecha de inicio efectivo de los trabajos, previa disponibilidad del sitio y primer pago acordado.

El plazo podrá prorrogarse por causas de fuerza mayor, caso fortuito, o modificaciones solicitadas por el Mandante, debiendo formalizarse por escrito.

CLÁUSULA CUARTA — OBLIGACIONES DEL CONTRATISTA

El Contratista se obliga a:
a) Ejecutar la obra conforme a las especificaciones técnicas acordadas y a la normativa vigente (OGUC, NCh).
b) Proveer la mano de obra calificada necesaria para la correcta ejecución.
c) Mantener el sitio de trabajo en condiciones de orden y seguridad.
d) Contar con los seguros y permisos exigidos por la ley.
e) Informar al Mandante de cualquier imprevisto que afecte el plazo o el costo.

CLÁUSULA QUINTA — OBLIGACIONES DEL MANDANTE

El Mandante se obliga a:
a) Proporcionar acceso oportuno al sitio de obra.
b) Realizar los pagos en las fechas acordadas.
c) No contratar directamente al personal del Contratista durante la vigencia del contrato.
d) Definir y comunicar oportunamente cualquier cambio al proyecto.

CLÁUSULA SEXTA — GARANTÍA DE LA OBRA

El Contratista otorga una garantía de ${garantia} meses sobre los trabajos ejecutados, contados desde la recepción conforme de la obra, para defectos constructivos imputables a su ejecución. Quedan excluidos de la garantía los daños por mal uso, modificaciones no autorizadas o causas externas.

CLÁUSULA SÉPTIMA — RECEPCIÓN DE OBRA

La obra se entregará mediante acta de recepción suscrita por ambas partes. Si el Mandante no concurre a la recepción en la fecha acordada sin justificación, la obra se entenderá recibida conforme.

CLÁUSULA OCTAVA — MODIFICACIONES

Cualquier modificación al alcance, especificaciones o precio del contrato deberá acordarse por escrito mediante un Anexo firmado por ambas partes, previo a su ejecución.

CLÁUSULA NOVENA — INCUMPLIMIENTO

En caso de incumplimiento del Mandante en los pagos, el Contratista podrá suspender los trabajos hasta regularizar la situación, sin que ello implique responsabilidad de su parte. En caso de incumplimiento del Contratista en el plazo sin causa justificada, se aplicará una multa de 0,1% del valor del contrato por cada día hábil de atraso, con un tope del 5%.

CLÁUSULA DÉCIMA — LEGISLACIÓN APLICABLE Y JURISDICCIÓN

El presente contrato se rige por las leyes de la República de Chile. Para todos los efectos legales, las partes fijan su domicilio en la ciudad de ${ciudad} y se someten a la jurisdicción de sus Tribunales Ordinarios de Justicia.

CLÁUSULA UNDÉCIMA — EJEMPLARES

El presente contrato se firma en dos ejemplares de un mismo tenor y valor, quedando uno en poder de cada parte.

─────────────────────────────────────────────────────────────────────────────

  ___________________________         ___________________________
  ${contratista.slice(0, 28).padEnd(28)}    ${cliente.slice(0, 28).padEnd(28)}
  RUT: ${rutContratista.padEnd(20)}         RUT: ${rutCliente}
  EL CONTRATISTA                      EL MANDANTE

${ciudadFecha(ciudad)}`;
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. CONTRATO DE SUMINISTRO
// ══════════════════════════════════════════════════════════════════════════════
export function generarContratoSuministro(datos) {
  const {
    proveedor = "[NOMBRE PROVEEDOR]",
    rutProveedor = "[RUT]",
    cliente = "[NOMBRE CLIENTE]",
    rutCliente = "[RUT CLIENTE]",
    descripcionMateriales = "[DESCRIPCIÓN DE LOS MATERIALES]",
    montoTotal = 0,
    plazoEntrega = 15,
    lugarEntrega = "[LUGAR DE ENTREGA]",
    ciudad = "Coquimbo",
    garantiaMateriales = 12,
  } = datos;

  return `CONTRATO DE SUMINISTRO DE MATERIALES
${ciudadFecha(ciudad)}

PARTES

PROVEEDOR: ${proveedor}, RUT ${rutProveedor}, en adelante "el Proveedor".
COMPRADOR: ${cliente}, RUT ${rutCliente}, en adelante "el Comprador".

CLÁUSULA PRIMERA — OBJETO

El Proveedor se obliga a suministrar al Comprador los materiales y productos detallados en el presupuesto adjunto:

  ${descripcionMateriales}

CLÁUSULA SEGUNDA — PRECIO

Precio total: ${fmtCLP(montoTotal)}. Incluye IVA cuando corresponda según la normativa del SII.

CLÁUSULA TERCERA — PLAZO Y LUGAR DE ENTREGA

El Proveedor se compromete a entregar los materiales en un plazo de ${plazoEntrega} días hábiles desde la confirmación del pedido, en ${lugarEntrega}.

CLÁUSULA CUARTA — CALIDAD Y GARANTÍA

Los materiales suministrados deberán cumplir con las normas técnicas chilenas (NCh) aplicables. El Proveedor otorga garantía de ${garantiaMateriales} meses por defectos de fabricación.

CLÁUSULA QUINTA — RECEPCIÓN

El Comprador revisará los materiales al momento de la entrega. Cualquier disconformidad deberá informarse al Proveedor dentro de las 48 horas siguientes.

CLÁUSULA SEXTA — LEY APLICABLE

Este contrato se rige por la legislación chilena vigente. Jurisdicción: ${ciudad}.

─────────────────────────────────────────────────────────────────────────────

  ___________________________         ___________________________
  ${proveedor.slice(0,28).padEnd(28)}    ${cliente.slice(0,28).padEnd(28)}
  EL PROVEEDOR                        EL COMPRADOR

${ciudadFecha(ciudad)}`;
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. CONTRATO DE SUBCONTRATO
// ══════════════════════════════════════════════════════════════════════════════
export function generarContratoSubcontrato(datos) {
  const {
    contratistaPrincipal = "[CONTRATISTA PRINCIPAL]",
    rutPrincipal = "[RUT]",
    subcontratista = "[SUBCONTRATISTA]",
    rutSubcontratista = "[RUT]",
    especialidad = "[ESPECIALIDAD: eléctrica / gasfitería / pintura / etc.]",
    descripcionTrabajo = "[DESCRIPCIÓN DEL TRABAJO]",
    montoTotal = 0,
    plazo = 15,
    ciudad = "Coquimbo",
    obraReferencia = "[OBRA PRINCIPAL]",
  } = datos;

  return `CONTRATO DE SUBCONTRATO
${ciudadFecha(ciudad)}

PARTES

CONTRATISTA PRINCIPAL: ${contratistaPrincipal}, RUT ${rutPrincipal}, en adelante "el Contratista".
SUBCONTRATISTA: ${subcontratista}, RUT ${rutSubcontratista}, especialista en ${especialidad}, en adelante "el Subcontratista".

ANTECEDENTES

El Contratista tiene suscrito un contrato de obra con un tercero para la ejecución de: ${obraReferencia}. Para la realización de trabajos de especialidad, contrata los servicios del Subcontratista.

CLÁUSULA PRIMERA — OBJETO

El Subcontratista se obliga a ejecutar los siguientes trabajos de especialidad:
  ${descripcionTrabajo}

CLÁUSULA SEGUNDA — PRECIO Y PAGO

Monto total acordado: ${fmtCLP(montoTotal)}.
El pago se realizará dentro de los 5 días hábiles siguientes a la recepción conforme de cada etapa.

CLÁUSULA TERCERA — PLAZO

Los trabajos deberán completarse en ${plazo} días hábiles desde el inicio efectivo, coordinado con el avance de la obra principal.

CLÁUSULA CUARTA — RESPONSABILIDADES

El Subcontratista es responsable de:
a) La calidad técnica de los trabajos ejecutados conforme a normativa vigente (SEC, SISS, OGUC según corresponda).
b) Contar con los permisos, seguros y certificaciones exigidos por su especialidad.
c) El personal a su cargo: cotizaciones previsionales, seguros de accidentes.
d) Los daños causados a terceros o a la obra principal por negligencia propia.

El Contratista es responsable de:
a) Proporcionar acceso oportuno a las áreas de trabajo.
b) Coordinar los plazos con el avance de la obra principal.
c) Realizar los pagos en las fechas acordadas.

CLÁUSULA QUINTA — NORMAS APLICABLES

Los trabajos deberán ejecutarse conforme a: Reglamento de Instalaciones Eléctricas (SEC), Normas NCh aplicables, OGUC y normativas municipales vigentes en ${ciudad}.

CLÁUSULA SEXTA — CONFIDENCIALIDAD

El Subcontratista se compromete a mantener confidencialidad sobre los datos del cliente final y del proyecto durante y después de la ejecución.

CLÁUSULA SÉPTIMA — LEY APLICABLE

Rige la legislación laboral y civil chilena. Jurisdicción: ${ciudad}.

─────────────────────────────────────────────────────────────────────────────

  ___________________________         ___________________________
  ${contratistaPrincipal.slice(0,28).padEnd(28)}    ${subcontratista.slice(0,28).padEnd(28)}
  CONTRATISTA PRINCIPAL               SUBCONTRATISTA

${ciudadFecha(ciudad)}`;
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. CARTA DE ENCARGO
// ══════════════════════════════════════════════════════════════════════════════
export function generarCartaEncargo(datos) {
  const {
    contratista = "[NOMBRE CONTRATISTA]",
    rutContratista = "[RUT]",
    cliente = "[NOMBRE CLIENTE]",
    rutCliente = "[RUT CLIENTE]",
    descripcionObra = "[DESCRIPCIÓN]",
    direccionObra = "[DIRECCIÓN]",
    montoTotal = 0,
    plazo = 30,
    ciudad = "Coquimbo",
    validez = 30,
  } = datos;

  return `CARTA DE ENCARGO
${ciudadFecha(ciudad)}

Estimado/a ${cliente}:

Por medio de la presente, ${contratista} (RUT ${rutContratista}) confirma el encargo recibido de su parte para la ejecución de los trabajos descritos a continuación, conforme al presupuesto presentado:

DESCRIPCIÓN DEL TRABAJO:
  ${descripcionObra}
  Dirección: ${direccionObra}

CONDICIONES ECONÓMICAS:
  Monto total presupuestado: ${fmtCLP(montoTotal)}
  Plazo estimado de ejecución: ${plazo} días hábiles
  Validez de esta carta de encargo: ${validez} días corridos desde su fecha

CONDICIONES GENERALES:
  • El inicio de los trabajos quedará sujeto al pago del anticipo acordado.
  • Cualquier modificación al alcance del trabajo requerirá acuerdo escrito previo.
  • Los precios no incluyen IVA salvo indicación expresa.
  • Esta carta de encargo constituye un acuerdo de intención. Para obras de mayor envergadura, las partes podrán formalizar un contrato de obra.

Para confirmar su aceptación, le solicitamos firmar y devolver esta carta, o bien confirmar por escrito (correo electrónico o WhatsApp).

Agradecemos su confianza y quedamos a su disposición para cualquier consulta.

Atentamente,

  ___________________________         ___________________________
  ${contratista.slice(0,28).padEnd(28)}    ${cliente.slice(0,28).padEnd(28)}
  RUT: ${rutContratista}
  EL CONTRATISTA                      ACEPTA EL CLIENTE

${ciudadFecha(ciudad)}`;
}

// ══════════════════════════════════════════════════════════════════════════════
// 5. CONTRATO DE MANTENCIÓN
// ══════════════════════════════════════════════════════════════════════════════
export function generarContratoMantencion(datos) {
  const {
    contratista = "[NOMBRE CONTRATISTA]",
    rutContratista = "[RUT]",
    cliente = "[NOMBRE CLIENTE]",
    rutCliente = "[RUT CLIENTE]",
    descripcionServicio = "[DESCRIPCIÓN DEL SERVICIO DE MANTENCIÓN]",
    direccionInmueble = "[DIRECCIÓN]",
    montoMensual = 0,
    duracionMeses = 12,
    frecuencia = "mensual",
    ciudad = "Coquimbo",
  } = datos;

  return `CONTRATO DE MANTENCIÓN
${ciudadFecha(ciudad)}

PARTES

PRESTADOR: ${contratista}, RUT ${rutContratista}, en adelante "el Prestador".
CLIENTE: ${cliente}, RUT ${rutCliente}, en adelante "el Cliente".

CLÁUSULA PRIMERA — OBJETO

El Prestador se obliga a prestar los servicios de mantención ${frecuencia} del inmueble ubicado en ${direccionInmueble}, que incluyen:
  ${descripcionServicio}

CLÁUSULA SEGUNDA — PRECIO Y DURACIÓN

  • Tarifa ${frecuencia}: ${fmtCLP(montoMensual)}
  • Duración del contrato: ${duracionMeses} meses, renovable automáticamente salvo aviso con 30 días de anticipación.
  • El precio podrá reajustarse anualmente según la variación del IPC.

CLÁUSULA TERCERA — VISITAS Y HORARIOS

Las visitas de mantención se coordinarán con 48 horas de anticipación, en horario hábil (lunes a viernes 08:00–18:00), salvo emergencias.

CLÁUSULA CUARTA — TRABAJOS ADICIONALES

Los trabajos no incluidos en el alcance de este contrato se cotizarán por separado y requerirán aprobación escrita del Cliente antes de su ejecución.

CLÁUSULA QUINTA — OBLIGACIONES DEL CLIENTE

El Cliente deberá:
a) Proporcionar acceso oportuno al inmueble en las fechas acordadas.
b) Informar oportunamente de cualquier desperfecto detectado.
c) Realizar los pagos en los plazos convenidos.

CLÁUSULA SEXTA — TERMINACIÓN ANTICIPADA

Cualquier parte podrá poner término al contrato con 30 días de aviso escrito. El Cliente deberá pagar los servicios prestados hasta la fecha de término efectivo.

CLÁUSULA SÉPTIMA — LEY APLICABLE

Rige la legislación chilena. Jurisdicción: ${ciudad}.

─────────────────────────────────────────────────────────────────────────────

  ___________________________         ___________________________
  ${contratista.slice(0,28).padEnd(28)}    ${cliente.slice(0,28).padEnd(28)}
  EL PRESTADOR                        EL CLIENTE

${ciudadFecha(ciudad)}`;
}

// ── Dispatcher principale ──────────────────────────────────────────────────────
export function generarContrato(tipo, datos) {
  switch (tipo) {
    case "obra":        return generarContratoObra(datos);
    case "suministro":  return generarContratoSuministro(datos);
    case "subcontrato": return generarContratoSubcontrato(datos);
    case "encargo":     return generarCartaEncargo(datos);
    case "mantencion":  return generarContratoMantencion(datos);
    default:            return generarContratoObra(datos);
  }
}

// ── Mappa dati progetto → dati contratto ──────────────────────────────────────
export function mapProyectoToContrato(proyState, workspace, user) {
  const info     = proyState?.info     || {};
  const partidas = proyState?.partidas || [];
  const pct      = proyState?.pct      || { ci: 10, gf: 5, imprevistos: 5, utilidad: 10 };

  // Usa calcTotals da helpers.js — unica fonte di verità
  const totals = calcTotals(
    partidas.map(p => ({ cant: parseFloat(p.cant||1), pu: parseFloat(p.pu||0) })),
    { ci: parseFloat(pct.ci||0), gf: parseFloat(pct.gf||0),
      imprevistos: parseFloat(pct.imprevistos||0), utilidad: parseFloat(pct.utilidad||0) },
    null
  );
  const total = totals.total;

  // Usa dati EMPRESA come fallback per il contratista
  const ws = workspace || {};

  // Cuotas da condPago
  const cuotas = Array.isArray(proyState?.cuotas) ? proyState.cuotas : [];

  return {
    contratista:          ws.name     || EMPRESA.nombre,
    rutContratista:       ws.rut      || EMPRESA.rut,
    domicilioContratista: ws.domicilio|| EMPRESA.direccion + ", " + EMPRESA.ciudad,
    cliente:              info.cliente             || "",
    rutCliente:           info.rutCliente          || "XX.XXX.XXX-X",
    domicilioCliente:     info.domicilioCliente    || "",
    descripcionObra:      info.descripcion         || proyState?.nombre || "",
    direccionObra:        info.direccion           || info.ciudad || "",
    ciudad:               info.ciudad              || ws.ciudad || EMPRESA.ciudad,
    montoTotal:           total,
    plazo:                proyState?.plazo         || 30,
    formaPago:            proyState?.condPago      || "Según cuotas",
    cuotas,
    garantia:             6,
    validez:              proyState?.validez       || 30,
    workspace:            ws.name || EMPRESA.nombre,
    // Suministro
    proveedor:            ws.name || EMPRESA.nombre,
    rutProveedor:         ws.rut  || EMPRESA.rut,
    descripcionMateriales: partidas.slice(0,5).map(p => `${p.nombre} (${p.cant} ${p.unidad})`).join(", "),
    plazoEntrega:         15,
    lugarEntrega:         info.direccion || info.ciudad || "obra",
    garantiaMateriales:   12,
    // Subcontrato
    contratistaPrincipal: ws.name || EMPRESA.nombre,
    rutPrincipal:         ws.rut  || EMPRESA.rut,
    subcontratista:       "",
    rutSubcontratista:    "XX.XXX.XXX-X",
    especialidad:         "",
    descripcionTrabajo:   info.descripcion         || "",
    obraReferencia:       proyState?.nombre        || info.descripcion || "",
    // Mantención
    descripcionServicio:  info.descripcion         || "",
    direccionInmueble:    info.direccion           || "",
    montoMensual:         Math.round(total / 12),
    duracionMeses:        12,
    frecuencia:           "mensual",
  };
}
