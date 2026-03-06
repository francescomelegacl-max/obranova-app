// ─── hooks/useWhatsApp.js ─────────────────────────────────────────────────────
// Nomi stati allineati a constants.js: Enviado, Aceptado, Rechazado, En obra, Finalizado
const fmt = n => n ? `$ ${Number(n).toLocaleString("es-CL", { maximumFractionDigits: 0 })}` : "";

const TEMPLATES = {
  // Borrador NON ha template (non ha senso notificare in bozza)

  "Enviado": ({ cliente, descripcion, total, empresa }) =>
    `Hola ${cliente || ""},\n\nTe enviamos el presupuesto para *${descripcion || "tu proyecto"}* por un total de *${fmt(total)} CLP*.\n\nPuedes revisarlo y consultarnos cualquier duda.\n\n_${empresa || "Obra Nova"}_`,

  "Aceptado": ({ cliente, descripcion, total, empresa }) =>
    `Hola ${cliente || ""},\n\n¡Gracias por aceptar el presupuesto de *${descripcion || "tu proyecto"}*! 🎉\n\nTotal acordado: *${fmt(total)} CLP*\n\nNos ponemos en contacto para coordinar el inicio de los trabajos.\n\n_${empresa || "Obra Nova"}_`,

  "Rechazado": ({ cliente, descripcion, empresa }) =>
    `Hola ${cliente || ""},\n\nEntendemos que el presupuesto de *${descripcion || "tu proyecto"}* no se ajustó a lo que buscabas.\n\nQuedamos disponibles si quieres que lo revisemos o si surge otro proyecto.\n\n_${empresa || "Obra Nova"}_`,

  "En obra": ({ cliente, descripcion, empresa }) =>
    `Hola ${cliente || ""},\n\n¡Comenzamos los trabajos de *${descripcion || "tu proyecto"}*! 🏗️\n\nTe iremos informando del avance. Cualquier consulta, escríbenos.\n\n_${empresa || "Obra Nova"}_`,

  "Finalizado": ({ cliente, descripcion, total, empresa }) =>
    `Hola ${cliente || ""},\n\n¡Los trabajos de *${descripcion || "tu proyecto"}* están terminados! ✅\n\nTotal final: *${fmt(total)} CLP*\n\nHa sido un placer trabajar contigo. Si necesitas algo más, aquí estamos.\n\n_${empresa || "Obra Nova"}_`,
};

export function useWhatsApp() {

  const generarLink = (telefono, estado, datos = {}) => {
    const template = TEMPLATES[estado];
    if (!template) return null;

    const mensaje = template(datos);
    const encoded = encodeURIComponent(mensaje);

    if (telefono) {
      const num = telefono.replace(/[\s\-\+\(\)]/g, "");
      const numNorm = num.startsWith("56") ? num : num.startsWith("9") ? `56${num}` : `569${num}`;
      return `https://wa.me/${numNorm}?text=${encoded}`;
    }

    return `https://wa.me/?text=${encoded}`;
  };

  const notificar = (telefono, estado, datos = {}) => {
    const link = generarLink(telefono, estado, datos);
    if (link) window.open(link, "_blank", "noopener,noreferrer");
  };

  const hasTemplate = (estado) => !!TEMPLATES[estado];

  return { generarLink, notificar, hasTemplate };
}
