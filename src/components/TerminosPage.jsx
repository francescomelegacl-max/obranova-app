// ─── components/TerminosPage.jsx ──────────────────────────────────────────────
// Página estática — Términos y Condiciones de Uso
// Accesible en /terminos (sin login requerido)
// ─────────────────────────────────────────────────────────────────────────────

export default function TerminosPage() {
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
        <span style={{ color: "rgba(255,255,255,.75)", fontSize: 13 }}>Términos y Condiciones</span>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px 80px" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1a365d", marginBottom: 6 }}>
          Términos y Condiciones de Uso
        </h1>
        <p style={{ color: "#718096", fontSize: 13, marginBottom: 32 }}>
          ObraNova SPA · app.obranova.cl · Última actualización: Marzo 2026
        </p>

        <div style={{ borderTop: "2px solid #1a365d", marginBottom: 32 }} />

        <p style={styles.body}>
          Estos Términos y Condiciones ("Términos") regulan el acceso y uso de la plataforma
          ObraNova, operada por ObraNova SPA, disponible en app.obranova.cl.
          Al registrarse o utilizar el servicio, el usuario acepta íntegramente estos Términos.
        </p>

        <Section n="1" title="Descripción del Servicio">
          <p style={styles.body}>
            ObraNova es una plataforma SaaS de gestión de presupuestos, proyectos, clientes y
            facturación para empresas y profesionales del sector construcción y remodelación.
            El servicio incluye herramientas de inteligencia artificial, generación de documentos PDF,
            firma digital, integración de pagos y gestión de equipos.
          </p>
        </Section>

        <Section n="2" title="Registro y Cuenta de Usuario">
          <p style={styles.body}>Para acceder al servicio, el usuario debe:</p>
          <Li>Registrarse con un correo electrónico válido y una contraseña segura</Li>
          <Li>Proporcionar información veraz y actualizada</Li>
          <Li>Ser mayor de 18 años o representante legal de una empresa</Li>
          <Li>Mantener la confidencialidad de sus credenciales de acceso</Li>
          <p style={styles.body}>
            El usuario es responsable de todas las actividades realizadas desde su cuenta.
          </p>
        </Section>

        <Section n="3" title="Planes y Precios">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
            {[
              { plan: "Free", precio: "Gratuito", desc: "Hasta 3 proyectos, 15 partidas, con marca de agua en PDF." },
              { plan: "Pro", precio: "$19.900 CLP/mes", desc: "Ilimitado para 1 usuario. Firma digital, Render AI (15/mes), Nova AI, Export Excel." },
              { plan: "Empresa", precio: "$39.900 CLP/mes", desc: "Todo lo de Pro + 5 usuarios, renders ilimitados, CRM completo, export contable." },
            ].map(({ plan, precio, desc }) => (
              <div key={plan} style={{
                background: "white", border: "1px solid #e2e8f0", borderRadius: 10,
                padding: "14px 16px",
              }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1a365d", marginBottom: 4 }}>{plan}</div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#2d6a9f", marginBottom: 8 }}>{precio}</div>
                <div style={{ fontSize: 12, color: "#718096", lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
          <p style={styles.body}>
            Los precios pueden modificarse con un aviso previo de <b>30 días</b> por correo electrónico.
            El cambio aplicará al siguiente ciclo de facturación.
          </p>
        </Section>

        <Section n="4" title="Pago y Facturación">
          <p style={styles.body}>
            El pago se realiza mensualmente a través de <b>MercadoPago</b>.
            El servicio se activa automáticamente tras la confirmación del pago.
            ObraNova no almacena datos de tarjetas de crédito o débito.
          </p>
          <p style={styles.body}>
            En caso de falta de pago, el plan se revertirá al plan Free al vencimiento del período pagado.
            Los datos permanecerán accesibles en modalidad Free durante 90 días.
          </p>
        </Section>

        <Section n="5" title="Política de Cancelación y Reembolso">
          <p style={styles.body}>
            El usuario puede cancelar su suscripción en cualquier momento desde la sección
            Ajustes de la plataforma o enviando un correo a administracion@obranova.cl.
          </p>
          <div style={{ background: "#EAF3DE", border: "1px solid #3B6D11", borderRadius: 8,
            padding: "12px 16px", marginTop: 8 }}>
            <p style={{ fontSize: 14, color: "#27500A", margin: 0, lineHeight: 1.6 }}>
              <b>Reembolso garantizado:</b> ObraNova ofrece reembolso total dentro de los primeros{" "}
              <b>7 días calendario</b> desde la primera contratación de un plan de pago,
              si el usuario no ha generado más de 3 presupuestos.
            </p>
          </div>
        </Section>

        <Section n="6" title="Propiedad Intelectual">
          <p style={styles.body}>
            ObraNova y todos sus componentes (código, diseño, marca, logotipos, documentación)
            son propiedad exclusiva de ObraNova SPA, protegidos por la{" "}
            <b>Ley N° 17.336 sobre Propiedad Intelectual</b> de Chile.
          </p>
          <p style={styles.body}>
            El usuario conserva todos los derechos sobre los datos que introduce en la plataforma
            (proyectos, presupuestos, información de clientes). ObraNova no reivindica propiedad
            sobre el contenido generado por el usuario.
          </p>
        </Section>

        <Section n="7" title="Uso Permitido y Prohibiciones">
          <p style={styles.body}>Está expresamente prohibido:</p>
          <Li>Usar la plataforma para actividades ilegales o fraudulentas</Li>
          <Li>Intentar acceder a cuentas o datos de otros usuarios</Li>
          <Li>Realizar ingeniería inversa o copiar el código fuente</Li>
          <Li>Usar bots, scrapers o mecanismos automatizados no autorizados</Li>
          <Li>Cargar contenido malicioso, virus o código dañino</Li>
          <Li>Revender o sublicenciar el servicio sin autorización expresa</Li>
          <Li>Usar el servicio para generar spam o comunicaciones no solicitadas</Li>
        </Section>

        <Section n="8" title="Inteligencia Artificial — Nova">
          <p style={styles.body}>
            El servicio incluye un asistente de IA denominado Nova, basado en modelos de lenguaje
            de terceros (Anthropic Claude). Las respuestas generadas por Nova son orientativas y{" "}
            <b>no constituyen asesoramiento legal, contable o profesional vinculante</b>.
          </p>
          <p style={styles.body}>
            El usuario es responsable de verificar la exactitud de los presupuestos y datos
            generados o sugeridos por Nova antes de utilizarlos con clientes.
          </p>
        </Section>

        <Section n="9" title="Disponibilidad del Servicio">
          <p style={styles.body}>
            ObraNova se compromete a mantener una disponibilidad objetivo del <b>99% mensual</b>,
            excluyendo mantenimientos programados (notificados con 24h de anticipación)
            y causas de fuerza mayor.
          </p>
        </Section>

        <Section n="10" title="Limitación de Responsabilidad">
          <p style={styles.body}>En la máxima medida permitida por la ley, ObraNova no será responsable por:</p>
          <Li>Pérdidas de negocio o daños indirectos derivados del uso del servicio</Li>
          <Li>Errores en presupuestos generados con IA que el usuario no verificó</Li>
          <Li>Interrupciones causadas por terceros (Google Firebase, Cloudflare, etc.)</Li>
          <Li>Pérdida de datos por causas de fuerza mayor o negligencia del usuario</Li>
          <p style={styles.body}>
            La responsabilidad máxima de ObraNova no excederá el valor de las cuotas pagadas
            en los últimos <b>3 meses</b> anteriores al evento que origina la reclamación.
          </p>
        </Section>

        <Section n="11" title="Suspensión y Terminación">
          <p style={styles.body}>
            ObraNova puede suspender una cuenta ante incumplimiento de estos Términos.
            Tras la terminación, el usuario tendrá <b>30 días</b> para exportar sus datos.
          </p>
        </Section>

        <Section n="12" title="Ley Aplicable y Jurisdicción">
          <p style={styles.body}>
            Estos Términos se rigen por las leyes de la <b>República de Chile</b>.
            Cualquier disputa se someterá a los{" "}
            <b>Tribunales Ordinarios de Justicia de Coquimbo, Chile</b>.
          </p>
        </Section>

        <Section n="13" title="Contacto">
          <p style={styles.body}>
            <b>Email:</b>{" "}
            <a href="mailto:administracion@obranova.cl" style={{ color: "#2d6a9f" }}>
              administracion@obranova.cl
            </a>
          </p>
        </Section>

        <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 40, paddingTop: 20, textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "#a0aec0" }}>
            ObraNova SPA · Coquimbo, Chile · app.obranova.cl · © 2026
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

// ── Helper components ─────────────────────────────────────────────────────────
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
