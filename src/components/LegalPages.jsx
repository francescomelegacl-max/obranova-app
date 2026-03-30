// ─── components/LegalPages.jsx ────────────────────────────────────────────────
// Política de Privacidad y Términos de Servicio — ObraNova SPA
// Cumple con Ley 19.628 (Protección de Datos Personales Chile)
// Route: /privacidad y /terminos
// ─────────────────────────────────────────────────────────────────────────────

const COMPANY = {
  name: "ObraNova SPA",
  email: "administracion@obranova.cl",
  web: "app.obranova.cl",
  date: "24 de marzo de 2026",
};

const sPage = { maxWidth: 780, margin: "0 auto", padding: "32px 20px 60px", fontFamily: "'Segoe UI',system-ui,sans-serif", color: "#2d3748", lineHeight: 1.75, background: "#fff", minHeight: "100vh" };
const sH1 = { fontSize: 26, fontWeight: 900, color: "#1a365d", marginBottom: 6 };
const sH2 = { fontSize: 17, fontWeight: 700, color: "#1a365d", marginTop: 28, marginBottom: 8 };
const sP = { fontSize: 14, marginBottom: 12 };
const sLi = { fontSize: 14, marginBottom: 6 };
const sBack = { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#1a365d", color: "white", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontSize: 13, marginBottom: 24, cursor: "pointer", border: "none" };
const sMeta = { fontSize: 12, color: "#718096", marginBottom: 20 };

// ── POLÍTICA DE PRIVACIDAD ─────────────────────────────────────────────────
export function PrivacyPolicy() {
  return (
    <div style={sPage}>
      <a href="/" style={sBack}>← Volver a ObraNova</a>
      <h1 style={sH1}>Política de Privacidad</h1>
      <p style={sMeta}>Última actualización: {COMPANY.date}</p>

      <h2 style={sH2}>1. Responsable del tratamiento</h2>
      <p style={sP}>{COMPANY.name}, con domicilio electrónico en {COMPANY.email}, es responsable del tratamiento de los datos personales recopilados a través de la plataforma {COMPANY.web} (en adelante, "ObraNova" o "la Plataforma").</p>

      <h2 style={sH2}>2. Datos que recopilamos</h2>
      <p style={sP}>Recopilamos los siguientes datos personales:</p>
      <ul style={{ paddingLeft: 24 }}>
        <li style={sLi}><strong>Datos de registro:</strong> nombre, correo electrónico, contraseña (cifrada), nombre de empresa.</li>
        <li style={sLi}><strong>Datos de uso:</strong> proyectos creados, presupuestos, partidas, renders generados, interacciones con Nova AI.</li>
        <li style={sLi}><strong>Datos de clientes:</strong> nombre, teléfono, email y firma digital de los clientes de nuestros usuarios, ingresados voluntariamente por el usuario.</li>
        <li style={sLi}><strong>Datos técnicos:</strong> dirección IP, tipo de navegador, dispositivo, páginas visitadas, fecha y hora de acceso.</li>
        <li style={sLi}><strong>Datos de pago:</strong> procesados íntegramente por MercadoPago. ObraNova NO almacena datos de tarjetas de crédito.</li>
      </ul>

      <h2 style={sH2}>3. Finalidad del tratamiento</h2>
      <p style={sP}>Los datos personales se utilizan exclusivamente para:</p>
      <ul style={{ paddingLeft: 24 }}>
        <li style={sLi}>Proveer y mantener el servicio de la Plataforma.</li>
        <li style={sLi}>Generar presupuestos, renders AI y análisis con Nova AI.</li>
        <li style={sLi}>Procesar pagos a través de MercadoPago.</li>
        <li style={sLi}>Enviar notificaciones relacionadas con el servicio (firma, pago, cambio de estado).</li>
        <li style={sLi}>Generar estadísticas anonimizadas y benchmarks de mercado.</li>
        <li style={sLi}>Mejorar el servicio y desarrollar nuevas funcionalidades.</li>
      </ul>

      <h2 style={sH2}>4. Inteligencia artificial (Nova AI y Render AI)</h2>
      <p style={sP}>ObraNova utiliza inteligencia artificial para:</p>
      <ul style={{ paddingLeft: 24 }}>
        <li style={sLi}><strong>Nova AI:</strong> Asistente conversacional que analiza presupuestos y genera partidas. Los datos del proyecto se envían a Anthropic (Claude AI) para procesar las consultas. Anthropic no almacena ni utiliza estos datos para entrenar sus modelos.</li>
        <li style={sLi}><strong>Render AI:</strong> Generación de imágenes fotorrealistas mediante fal.ai (Flux). Los prompts y fotos subidas se procesan temporalmente y se eliminan después de 20 minutos.</li>
        <li style={sLi}><strong>Benchmarks:</strong> Los datos de presupuestos se agregan de forma anónima para generar estadísticas de mercado. Ningún dato individual es identificable en los benchmarks.</li>
      </ul>

      <h2 style={sH2}>5. Base legal del tratamiento</h2>
      <p style={sP}>El tratamiento se fundamenta en: (a) el consentimiento del usuario al registrarse y aceptar estos términos; (b) la ejecución del contrato de servicio; (c) el interés legítimo de mejorar el servicio, conforme a la Ley 19.628 sobre Protección de la Vida Privada de Chile.</p>

      <h2 style={sH2}>6. Compartición de datos</h2>
      <p style={sP}>No vendemos ni compartimos datos personales con terceros para fines de marketing. Los datos se comparten únicamente con:</p>
      <ul style={{ paddingLeft: 24 }}>
        <li style={sLi}><strong>Google Firebase:</strong> Almacenamiento y autenticación (servidores en Sudamérica).</li>
        <li style={sLi}><strong>Anthropic:</strong> Procesamiento de consultas Nova AI (sin retención de datos).</li>
        <li style={sLi}><strong>fal.ai:</strong> Generación de renders (procesamiento temporal).</li>
        <li style={sLi}><strong>MercadoPago:</strong> Procesamiento de pagos.</li>
        <li style={sLi}><strong>Sentry:</strong> Monitoreo de errores técnicos (datos anónimos).</li>
      </ul>

      <h2 style={sH2}>7. Retención de datos</h2>
      <p style={sP}>Los datos se conservan mientras el usuario mantenga su cuenta activa. Al solicitar la eliminación de la cuenta, todos los datos personales serán eliminados en un plazo máximo de 30 días. Los backups cifrados se eliminan después de 90 días.</p>

      <h2 style={sH2}>8. Derechos del usuario</h2>
      <p style={sP}>Conforme a la Ley 19.628, usted tiene derecho a:</p>
      <ul style={{ paddingLeft: 24 }}>
        <li style={sLi}>Acceder a sus datos personales almacenados.</li>
        <li style={sLi}>Rectificar datos inexactos o incompletos.</li>
        <li style={sLi}>Solicitar la eliminación de sus datos.</li>
        <li style={sLi}>Oponerse al tratamiento de sus datos.</li>
        <li style={sLi}>Exportar sus datos en formato legible (Excel/CSV).</li>
      </ul>
      <p style={sP}>Para ejercer estos derechos, escriba a {COMPANY.email}.</p>

      <h2 style={sH2}>9. Seguridad</h2>
      <p style={sP}>Implementamos medidas de seguridad técnicas y organizativas: cifrado en tránsito (TLS), Firebase App Check con reCAPTCHA Enterprise, backups nocturnos cifrados, acceso restringido por roles, monitoreo con Sentry.</p>

      <h2 style={sH2}>10. Cookies y tecnologías similares</h2>
      <p style={sP}>ObraNova utiliza cookies estrictamente necesarias para el funcionamiento de la plataforma (autenticación, preferencias). No utilizamos cookies de publicidad ni de seguimiento de terceros.</p>

      <h2 style={sH2}>11. Menores de edad</h2>
      <p style={sP}>ObraNova no está dirigido a menores de 18 años. No recopilamos deliberadamente datos de menores.</p>

      <h2 style={sH2}>12. Modificaciones</h2>
      <p style={sP}>Nos reservamos el derecho de modificar esta política. Las modificaciones se notificarán por email y/o en la plataforma con 15 días de anticipación.</p>

      <h2 style={sH2}>13. Contacto</h2>
      <p style={sP}>Para consultas sobre privacidad: {COMPANY.email}</p>

      <div style={{ marginTop: 32, padding: "14px 18px", background: "#f7fafc", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12, color: "#718096" }}>
        © {new Date().getFullYear()} {COMPANY.name} — {COMPANY.web}
      </div>
    </div>
  );
}

// ── TÉRMINOS DE SERVICIO ───────────────────────────────────────────────────
export function TermsOfService() {
  return (
    <div style={sPage}>
      <a href="/" style={sBack}>← Volver a ObraNova</a>
      <h1 style={sH1}>Términos de Servicio</h1>
      <p style={sMeta}>Última actualización: {COMPANY.date}</p>

      <h2 style={sH2}>1. Aceptación de los términos</h2>
      <p style={sP}>Al registrarse y utilizar ObraNova ({COMPANY.web}), usted acepta estos Términos de Servicio y la Política de Privacidad. Si no está de acuerdo, no utilice la plataforma.</p>

      <h2 style={sH2}>2. Descripción del servicio</h2>
      <p style={sP}>ObraNova es una plataforma SaaS (Software como Servicio) de gestión de presupuestos de construcción que incluye: generación de presupuestos, firma digital, pagos con MercadoPago, renders AI, asistente Nova AI, portal del cliente, CRM, planificación de obra y facturación.</p>

      <h2 style={sH2}>3. Planes y precios</h2>
      <p style={sP}>ObraNova ofrece los siguientes planes:</p>
      <ul style={{ paddingLeft: 24 }}>
        <li style={sLi}><strong>Free:</strong> Funcionalidades básicas con límites de proyectos y partidas.</li>
        <li style={sLi}><strong>Pro ($29.900 CLP/mes):</strong> Proyectos ilimitados, Nova AI, firma digital, renders AI.</li>
        <li style={sLi}><strong>Empresa ($49.900 CLP/mes):</strong> Todo Pro más multi-usuario, CRM, export contable.</li>
      </ul>
      <p style={sP}>Los precios pueden ser modificados con 30 días de aviso previo. El período de prueba gratuito de 14 días está disponible para el plan Pro.</p>

      <h2 style={sH2}>4. Registro y cuenta</h2>
      <p style={sP}>El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso. Cada cuenta es personal e intransferible, salvo en planes Empresa con múltiples usuarios autorizados.</p>

      <h2 style={sH2}>5. Uso aceptable</h2>
      <p style={sP}>El usuario se compromete a:</p>
      <ul style={{ paddingLeft: 24 }}>
        <li style={sLi}>Utilizar la plataforma exclusivamente para fines profesionales relacionados con la construcción.</li>
        <li style={sLi}>No utilizar Nova AI o Render AI para generar contenido ilegal, ofensivo o engañoso.</li>
        <li style={sLi}>No intentar acceder a datos de otros usuarios o workspaces.</li>
        <li style={sLi}>No realizar ingeniería inversa, scraping o uso automatizado no autorizado.</li>
        <li style={sLi}>Proporcionar información veraz en sus presupuestos y datos de contacto.</li>
      </ul>

      <h2 style={sH2}>6. Propiedad intelectual</h2>
      <p style={sP}>ObraNova y todos sus componentes (código, diseño, marca, Nova AI) son propiedad de {COMPANY.name}. Los presupuestos, datos de proyectos y renders generados por el usuario son propiedad del usuario. Los renders generados con Render AI pueden incluir marca de agua en el plan Free.</p>

      <h2 style={sH2}>7. Inteligencia artificial — Limitaciones</h2>
      <p style={sP}>Los servicios de IA (Nova AI, Render AI) son herramientas de asistencia. {COMPANY.name} no garantiza la exactitud de los precios generados por Nova AI ni la fidelidad visual de los renders. El usuario es responsable de verificar todos los datos antes de enviarlos a sus clientes. Los renders AI son visualizaciones aproximadas y no constituyen compromisos de resultado.</p>

      <h2 style={sH2}>8. Pagos y facturación</h2>
      <p style={sP}>Los pagos se procesan a través de MercadoPago. La suscripción se renueva automáticamente cada mes. El usuario puede cancelar en cualquier momento desde la sección Ajustes. No se realizan reembolsos por períodos parciales, salvo disposición legal en contrario.</p>

      <h2 style={sH2}>9. Disponibilidad del servicio</h2>
      <p style={sP}>{COMPANY.name} se esfuerza por mantener un 99.5% de disponibilidad. No se garantiza disponibilidad ininterrumpida. Los mantenimientos programados serán notificados con anticipación.</p>

      <h2 style={sH2}>10. Limitación de responsabilidad</h2>
      <p style={sP}>{COMPANY.name} no será responsable por: (a) pérdidas derivadas de datos ingresados incorrectamente por el usuario; (b) decisiones comerciales basadas en sugerencias de Nova AI; (c) interrupciones del servicio por causas de fuerza mayor; (d) acciones de terceros (MercadoPago, proveedores de hosting).</p>

      <h2 style={sH2}>11. Cancelación y terminación</h2>
      <p style={sP}>El usuario puede cancelar su cuenta en cualquier momento. {COMPANY.name} se reserva el derecho de suspender o cancelar cuentas que violen estos términos. En caso de cancelación, los datos serán eliminados conforme a la Política de Privacidad.</p>

      <h2 style={sH2}>12. Modificaciones</h2>
      <p style={sP}>Estos términos pueden ser modificados. Las modificaciones serán notificadas con 30 días de anticipación. El uso continuado de la plataforma después de la notificación constituye aceptación de los nuevos términos.</p>

      <h2 style={sH2}>13. Ley aplicable y jurisdicción</h2>
      <p style={sP}>Estos términos se rigen por las leyes de la República de Chile. Cualquier controversia será sometida a la jurisdicción de los tribunales ordinarios de Santiago de Chile.</p>

      <h2 style={sH2}>14. Contacto</h2>
      <p style={sP}>Para consultas sobre estos términos: {COMPANY.email}</p>

      <div style={{ marginTop: 32, padding: "14px 18px", background: "#f7fafc", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12, color: "#718096" }}>
        © {new Date().getFullYear()} {COMPANY.name} — {COMPANY.web}
      </div>
    </div>
  );
}
