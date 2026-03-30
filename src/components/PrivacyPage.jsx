// ─── components/PrivacyPage.jsx ───────────────────────────────────────────────
// Página estática — Política de Privacidad
// Accesible en /privacy (sin login requerido)
// ─────────────────────────────────────────────────────────────────────────────

export default function PrivacyPage() {
  return (
    <div style={{
      minHeight: "100vh", background: "#f8fafc",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* Header */}
      <div style={{ background: "#1a365d", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <a href="/" style={{ color: "white", textDecoration: "none", fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px" }}>
          ObraNova
        </a>
        <span style={{ color: "rgba(255,255,255,.4)", fontSize: 14 }}>·</span>
        <span style={{ color: "rgba(255,255,255,.75)", fontSize: 13 }}>Política de Privacidad</span>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px 80px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1a365d", marginBottom: 6 }}>
          Política de Privacidad
        </h1>
        <p style={{ color: "#718096", fontSize: 13, marginBottom: 32 }}>
          ObraNova SPA · app.obranova.cl · Última actualización: Marzo 2026
        </p>

        <div style={{ borderTop: "2px solid #1a365d", marginBottom: 32 }} />

        <p style={styles.body}>
          Esta Política de Privacidad describe cómo ObraNova SPA ("ObraNova", "nosotros" o "la empresa")
          recopila, utiliza, almacena y protege la información personal de los usuarios que acceden y utilizan
          la plataforma ObraNova, disponible en app.obranova.cl y sus subdominios.
        </p>
        <p style={styles.body}>
          El uso de la plataforma implica la aceptación de esta política. Si no está de acuerdo con
          sus términos, debe abstenerse de utilizar el servicio.
        </p>

        <Section n="1" title="Responsable del Tratamiento de Datos">
          <p style={styles.body}><b>Razón social:</b> ObraNova SPA</p>
          <p style={styles.body}><b>Domicilio:</b> Coquimbo, IV Región, Chile</p>
          <p style={styles.body}><b>Email de contacto:</b> administracion@obranova.cl</p>
          <p style={styles.body}><b>Sitio web:</b> app.obranova.cl</p>
        </Section>

        <Section n="2" title="Datos que Recopilamos">
          <SubSection title="2.1 Datos proporcionados directamente por el usuario">
            <Li>Nombre, apellido y correo electrónico (registro y autenticación)</Li>
            <Li>Nombre del workspace o empresa constructora</Li>
            <Li>Datos de proyectos: cliente, descripción, partidas, precios, condiciones de pago</Li>
            <Li>Imágenes subidas para renders o documentos (almacenadas en Firebase Storage)</Li>
            <Li>Firma digital del cliente (canvas PNG embebido en PDF)</Li>
            <Li>Notas de seguimiento en CRM y comentarios de proyecto</Li>
          </SubSection>
          <SubSection title="2.2 Datos recopilados automáticamente">
            <Li>Dirección IP y tipo de dispositivo (para rate limiting y seguridad)</Li>
            <Li>Eventos de uso de la plataforma (Firebase Analytics — anonimizados)</Li>
            <Li>Tokens FCM para notificaciones push (almacenados por dispositivo)</Li>
            <Li>Logs de errores via Sentry (sin datos personales identificables)</Li>
            <Li>Registro de uso del servicio de IA (tokens consumidos, sin contenido de mensajes)</Li>
          </SubSection>
        </Section>

        <Section n="3" title="Finalidad del Tratamiento">
          <p style={styles.body}>Los datos recopilados se utilizan exclusivamente para:</p>
          <Li>Prestar el servicio de gestión de presupuestos, proyectos y clientes</Li>
          <Li>Autenticar y autorizar el acceso a la plataforma</Li>
          <Li>Generar PDFs de presupuestos con los datos del proyecto</Li>
          <Li>Enviar notificaciones push y correos relacionados con el servicio</Li>
          <Li>Procesar pagos a través de MercadoPago (los datos de pago no transitan por servidores de ObraNova)</Li>
          <Li>Mejorar la plataforma mediante análisis de uso anonimizado</Li>
          <Li>Responder consultas de soporte técnico</Li>
          <Li>Enviar el reporte mensual de actividad del workspace (plan Pro y Empresa)</Li>
          <p style={{ ...styles.body, fontWeight: 700, marginTop: 12, background: "#EBF5FB", padding: "10px 14px", borderRadius: 8, borderLeft: "3px solid #2d6a9f" }}>
            No vendemos, cedemos ni comercializamos datos personales a terceros.
            Los datos no se utilizan para publicidad ni perfilamiento fuera del servicio.
          </p>
        </Section>

        <Section n="4" title="Base Legal del Tratamiento">
          <p style={styles.body}>
            El tratamiento de datos personales se realiza conforme a la <b>Ley N° 19.628 sobre
            Protección de la Vida Privada</b> de Chile y sus modificaciones, en particular la{" "}
            <b>Ley N° 21.719</b> (nueva Ley de Protección de Datos Personales). Las bases legales son:
          </p>
          <Li>Ejecución del contrato de servicio entre el usuario y ObraNova</Li>
          <Li>Consentimiento del usuario al aceptar estos términos</Li>
          <Li>Interés legítimo para la seguridad y mejora del servicio</Li>
        </Section>

        <Section n="5" title="Almacenamiento y Seguridad">
          <p style={styles.body}>
            Los datos se almacenan en <b>Google Firebase</b> (Firestore, Storage y Auth),
            en la región <b>southamerica-west1 (Santiago, Chile)</b>. Google Cloud cuenta con
            certificaciones ISO 27001, SOC 2 y estándares de seguridad internacionales.
          </p>
          <p style={styles.body}>Las medidas de seguridad implementadas incluyen:</p>
          <Li>Aislamiento total de datos por workspace mediante Firestore Security Rules</Li>
          <Li>Autenticación con Firebase Auth y tokens JWT verificados server-side</Li>
          <Li>App Check con reCAPTCHA v3 en funciones críticas de pago</Li>
          <Li>Cifrado en tránsito (HTTPS/TLS) y en reposo (Google Cloud KMS)</Li>
          <Li>Backup nocturno automatizado en Google Cloud Storage</Li>
          <Li>Secrets y API keys gestionados exclusivamente via Firebase Secret Manager</Li>
        </Section>

        <Section n="6" title="Compartición de Datos con Terceros">
          <p style={styles.body}>ObraNova utiliza los siguientes proveedores de servicios:</p>
          <Li><b>Google Firebase</b> — infraestructura, almacenamiento, autenticación</Li>
          <Li><b>Anthropic</b> — modelo de IA Nova (mensajes cifrados, sin almacenamiento permanente)</Li>
          <Li><b>Fal.ai</b> — generación de renders AI (imágenes eliminadas a los 20 minutos)</Li>
          <Li><b>MercadoPago</b> — procesamiento de pagos (ObraNova no almacena datos de tarjetas)</Li>
          <Li><b>Sentry</b> — monitoreo de errores (datos anonimizados)</Li>
          <Li><b>Google Analytics / Firebase Analytics</b> — datos de uso agregados y anonimizados</Li>
        </Section>

        <Section n="7" title="Derechos del Usuario">
          <p style={styles.body}>Conforme a la legislación chilena vigente, el usuario tiene derecho a:</p>
          <Li><b>Acceso:</b> solicitar información sobre los datos que ObraNova conserva</Li>
          <Li><b>Rectificación:</b> corregir datos inexactos o incompletos</Li>
          <Li><b>Cancelación/Eliminación:</b> solicitar la eliminación de sus datos personales</Li>
          <Li><b>Oposición:</b> oponerse al tratamiento para fines específicos</Li>
          <Li><b>Portabilidad:</b> recibir sus datos en formato estructurado y legible</Li>
          <p style={styles.body}>
            Para ejercer estos derechos, envíe una solicitud a{" "}
            <a href="mailto:administracion@obranova.cl" style={{ color: "#2d6a9f" }}>
              administracion@obranova.cl
            </a>{" "}
            indicando su nombre, correo registrado y el derecho que desea ejercer.
            Responderemos en un plazo máximo de <b>30 días hábiles</b>.
          </p>
        </Section>

        <Section n="8" title="Cookies y Tecnologías de Seguimiento">
          <p style={styles.body}>
            ObraNova es una Progressive Web App (PWA). No utilizamos cookies de terceros
            ni tecnologías de seguimiento para publicidad. Utilizamos almacenamiento local
            del navegador exclusivamente para el funcionamiento de la aplicación.
            Firebase Analytics utiliza identificadores de instancia anonimizados.
          </p>
        </Section>

        <Section n="9" title="Retención de Datos">
          <p style={styles.body}>
            Los datos personales se conservan mientras la cuenta esté activa.
            Tras la cancelación o solicitud de eliminación, los datos se eliminan en un plazo
            máximo de <b>90 días</b>. Los backups automatizados se conservan por <b>90 días</b>.
          </p>
        </Section>

        <Section n="10" title="Menores de Edad">
          <p style={styles.body}>
            ObraNova es un servicio dirigido exclusivamente a personas mayores de 18 años y empresas.
            No recopilamos intencionalmente datos de menores de edad.
          </p>
        </Section>

        <Section n="11" title="Modificaciones">
          <p style={styles.body}>
            ObraNova puede modificar esta política notificando los cambios con al menos{" "}
            <b>15 días de anticipación</b> por correo electrónico y/o aviso en la plataforma.
          </p>
        </Section>

        <Section n="12" title="Contacto">
          <p style={styles.body}>
            <b>Email:</b>{" "}
            <a href="mailto:administracion@obranova.cl" style={{ color: "#2d6a9f" }}>
              administracion@obranova.cl
            </a>
          </p>
          <p style={styles.body}>
            Si considera que el tratamiento de sus datos vulnera sus derechos, puede presentar
            una reclamación ante el <b>Consejo para la Transparencia</b> (consejotransparencia.cl).
          </p>
        </Section>

        <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 40, paddingTop: 20, textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "#a0aec0" }}>
            ObraNova SPA · Coquimbo, Chile · app.obranova.cl
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 8 }}>
            <a href="/privacy" style={{ fontSize: 12, color: "#2d6a9f" }}>Política de Privacidad</a>
            <a href="/terminos" style={{ fontSize: 12, color: "#2d6a9f" }}>Términos de Uso</a>
            <a href="/" style={{ fontSize: 12, color: "#2d6a9f" }}>Volver a ObraNova</a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Componenti helper ─────────────────────────────────────────────────────────
function Section({ n, title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1a365d", marginBottom: 12,
        paddingBottom: 6, borderBottom: "1px solid #e2e8f0" }}>
        {n}. {title}
      </h2>
      {children}
    </div>
  );
}

function SubSection({ title, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, color: "#2d6a9f", marginBottom: 8 }}>{title}</h3>
      {children}
    </div>
  );
}

function Li({ children }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 6, paddingLeft: 4 }}>
      <span style={{ color: "#2d6a9f", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>·</span>
      <span style={{ fontSize: 14, color: "#2D3748", lineHeight: 1.6 }}>{children}</span>
    </div>
  );
}

const styles = {
  body: { fontSize: 14, color: "#2D3748", lineHeight: 1.7, marginBottom: 10 },
};
