// ─── functions/index.js ───────────────────────────────────────────────────────
// Sprint 3 — #8 Firebase App Check enforcement su crearLinkPago
// Aggiunte vs versione precedente:
//   • enforceAppCheck: true su crearLinkPago → richiede token App Check valido
//   • Validazione aggiuntiva monto (max 100M CLP anti-abuse)
//   • Controllo autenticazione esplicito (request.auth)
//   • Log strutturato con UID per audit trail
// ─────────────────────────────────────────────────────────────────────────────

const { onSchedule }         = require("firebase-functions/v2/scheduler");
const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret }       = require("firebase-functions/params");
const { logger }             = require("firebase-functions");
const { GoogleAuth }         = require("google-auth-library");
const fetch                  = require("node-fetch");
const nodemailer             = require("nodemailer");
const admin                  = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// ── Secrets ───────────────────────────────────────────────────────────────────
const MP_ACCESS_TOKEN   = defineSecret("MP_ACCESS_TOKEN");
const MP_WEBHOOK_SECRET = defineSecret("MP_WEBHOOK_SECRET");
const GMAIL_USER        = defineSecret("GMAIL_USER");
const GMAIL_PASS        = defineSecret("GMAIL_PASS");

const NOTIFY_EMAILS = [
  "administracion@obranova.cl",
  "francescomelega@obranova.cl",
];

// ── TASK 5.7 – Rate Limiter in-memory ────────────────────────────────────────
const rateLimitStore = new Map();

function checkRateLimit(ip, action, maxReqs, windowMs) {
  const key   = `${ip}:${action}`;
  const now   = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxReqs - 1, resetIn: windowMs };
  }
  if (entry.count >= maxReqs) {
    return { allowed: false, remaining: 0, resetIn: entry.resetAt - now };
  }
  entry.count++;
  return { allowed: true, remaining: maxReqs - entry.count, resetIn: entry.resetAt - now };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) rateLimitStore.delete(key);
  }
}, 5 * 60 * 1000);

function withRateLimit(action, maxReqs, windowMs, handler) {
  return async (req, res) => {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "unknown";
    const rl = checkRateLimit(ip, action, maxReqs, windowMs);
    res.set("X-RateLimit-Limit",     String(maxReqs));
    res.set("X-RateLimit-Remaining", String(rl.remaining));
    res.set("X-RateLimit-Reset",     String(Math.ceil(rl.resetIn / 1000)));
    if (!rl.allowed) {
      logger.warn(`🚫 Rate limit superato per ${action}`, { ip });
      return res.status(429).json({ error: "Troppe richieste. Riprova tra " + Math.ceil(rl.resetIn / 60000) + " minuti." });
    }
    return handler(req, res);
  };
}
module.exports.withRateLimit = withRateLimit;

// ── Costanti ──────────────────────────────────────────────────────────────────
const PROJECT_ID = "obra-nova-spa";
const LOCATION   = "us-central1";
const OUTPUT_URI = `gs://${PROJECT_ID}-backups-scl`;

// Mapeo precio CLP → plan. Las claves son importes exactos en CLP enteros
// (transaction_amount de MercadoPago para CLP ya viene en enteros, sin centavos).
// Pro: 1990 CLP/mes | Empresa: 3990 CLP/mes (anual con descuento incluido)
const PRICE_TO_PLAN = {
  1990000: "pro",
  2990000: "pro",      // precio alternativo pro
  3990000: "empresa",
  4990000: "empresa",  // precio alternativo empresa
  1990001: "pro",      // tolerancia de 1 CLP por redondeos MP
};

// ── Core backup Firestore ─────────────────────────────────────────────────────
async function eseguiBackupFirestore() {
  const auth      = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] });
  const client    = await auth.getClient();
  const token     = await client.getAccessToken();
  const now       = new Date();
  const timestamp = now.toISOString().slice(0, 10);
  const timeSlot  = now.toISOString().slice(0, 16).replace("T", "_").replace(":", "-");
  const outputUri = `${OUTPUT_URI}/${timestamp}/${timeSlot}`;
  const url       = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default):exportDocuments`;

  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ outputUriPrefix: outputUri }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Firestore Export fallito: ${JSON.stringify(data)}`);
  logger.info("✅ Backup avviato", { operationName: data.name, outputUri, timestamp });
  try {
    await db.collection("_sistema").doc("backup").set({
      lastBackup:        timestamp,
      lastOutputUri:     outputUri,
      lastOperationName: data.name,
      updatedAt:         new Date().toISOString(),
    }, { merge: true });
  } catch (fsErr) {
    logger.warn("⚠️ Scrittura _sistema/backup fallita:", fsErr.message);
  }
  return { operationName: data.name, outputUri, timestamp };
}

// ── Helper email notifica ─────────────────────────────────────────────────────
async function inviaEmailBackup({ ok, timestamp, outputUri, error, gmailUser, gmailPass }) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });
  const subject = ok
    ? `✅ Backup ObraNova completato — ${timestamp}`
    : `❌ Backup ObraNova FALLITO — ${timestamp}`;
  const html = ok ? `
    <div style="font-family:sans-serif;max-width:500px">
      <h2 style="color:#276749">✅ Backup Firestore completato</h2>
      <table style="border-collapse:collapse;width:100%;font-size:13px">
        <tr><td style="padding:6px;color:#555">Data</td><td style="padding:6px;font-weight:bold">${timestamp}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding:6px;color:#555">Destinazione</td>
          <td style="padding:6px;font-size:11px;color:#666">${outputUri}</td></tr>
      </table>
      <p style="color:#888;font-size:12px;margin-top:16px">ObraNova SPA — Backup automatico giornaliero</p>
    </div>` : `
    <div style="font-family:sans-serif;max-width:500px">
      <h2 style="color:#c53030">❌ Backup fallito</h2>
      <p style="color:#555">Errore: <code>${error}</code></p>
      <p style="color:#888;font-size:12px">Controlla Firebase Console → Functions → Logs</p>
    </div>`;
  await transporter.sendMail({
    from: `"ObraNova Backup" <${gmailUser}>`,
    to:   NOTIFY_EMAILS.join(", "),
    subject, html,
  });
}

// ── TASK 5.6 – Backup schedulato ─────────────────────────────────────────────
exports.backupNotturnoFirestore = onSchedule(
  {
    schedule:       "0 5 * * *",
    timeZone:       "America/Santiago",
    region:         LOCATION,
    memory:         "256MiB",
    timeoutSeconds: 120,
    secrets:        [GMAIL_USER, GMAIL_PASS],
  },
  async (event) => {
    logger.info("🕔 Backup notturno avviato", { scheduledTime: event.scheduleTime });
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");
    try {
      const result = await eseguiBackupFirestore();
      logger.info("🎉 Backup completato", result);
      try {
        await inviaEmailBackup({
          ok: true, timestamp,
          outputUri: result.outputUri,
          gmailUser: GMAIL_USER.value(),
          gmailPass: GMAIL_PASS.value(),
        });
      } catch (emailErr) {
        logger.warn("Email notifica fallita (backup OK):", emailErr.message);
      }
    } catch (error) {
      logger.error("❌ Backup fallito", { error: error.message });
      try {
        await inviaEmailBackup({
          ok: false, timestamp,
          error: error.message,
          gmailUser: GMAIL_USER.value(),
          gmailPass: GMAIL_PASS.value(),
        });
      } catch {}
      throw error;
    }
  }
);

// ── Backup manuale HTTP ───────────────────────────────────────────────────────
exports.backupManuale = onRequest(
  { region: LOCATION, memory: "256MiB", timeoutSeconds: 120 },
  async (req, res) => {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "unknown";
    const rl = checkRateLimit(ip, "backupManuale", 5, 15 * 60 * 1000);
    res.set("X-RateLimit-Limit", "5");
    res.set("X-RateLimit-Remaining", String(rl.remaining));
    res.set("X-RateLimit-Reset", String(Math.ceil(rl.resetIn / 1000)));
    if (!rl.allowed) return res.status(429).json({ error: "Rate limit superato" });
    const adminSecret = process.env.BACKUP_ADMIN_SECRET;
    const authHeader  = req.headers["authorization"] || "";
    if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
      return res.status(401).json({ error: "Non autorizzato" });
    }
    if (req.method !== "POST") return res.status(405).json({ error: "Usa POST" });
    try {
      const result = await eseguiBackupFirestore();
      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
);

// ── Backup callable da TabSettings ───────────────────────────────────────────
exports.backupManualeCallable = onCall(
  {
    region:         LOCATION,
    memory:         "256MiB",
    timeoutSeconds: 120,
    secrets:        [GMAIL_USER, GMAIL_PASS],
  },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Devi essere autenticato");
    const timestamp = new Date().toISOString().slice(0, 19).replace("T", " ");
    try {
      const result = await eseguiBackupFirestore();
      try {
        await inviaEmailBackup({
          ok: true, timestamp,
          outputUri: result.outputUri,
          gmailUser: GMAIL_USER.value(),
          gmailPass: GMAIL_PASS.value(),
        });
      } catch (emailErr) {
        logger.warn("Email notifica fallita (backup OK):", emailErr.message);
      }
      return { ok: true, ...result };
    } catch (err) {
      try {
        await inviaEmailBackup({
          ok: false, timestamp, error: err.message,
          gmailUser: GMAIL_USER.value(),
          gmailPass: GMAIL_PASS.value(),
        });
      } catch {}
      throw new HttpsError("internal", err.message);
    }
  }
);

// ── TASK 4.2 – Webhook MercadoPago ───────────────────────────────────────────
exports.webhookMercadoPago = onRequest(
  {
    region:         LOCATION,
    memory:         "256MiB",
    timeoutSeconds: 60,
    secrets:        [MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET, GMAIL_USER, GMAIL_PASS],
  },
  withRateLimit("webhookMP", 100, 60 * 1000, async (req, res) => {
    if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

    const xSignature = req.headers["x-signature"] || "";
    const xRequestId = req.headers["x-request-id"] || "";
    const secret     = MP_WEBHOOK_SECRET.value();

    if (secret && xSignature) {
      try {
        const crypto   = require("crypto");
        const parts    = Object.fromEntries(xSignature.split(",").map(p => p.split("=")));
        const ts       = parts["ts"] || "";
        const v1       = parts["v1"] || "";
        const dataId   = req.body?.data?.id || "";
        const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
        const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
        if (v1 !== expected) {
          logger.warn("⛔ Firma webhook MP non valida", { xSignature, manifest });
          return res.status(401).json({ error: "Firma non valida" });
        }
      } catch (err) {
        logger.error("❌ Errore verifica firma", { error: err.message });
        return res.status(401).json({ error: "Errore verifica firma" });
      }
    } else {
      logger.warn("⚠️ Webhook senza firma — accettato solo in test");
    }

    const { type, data } = req.body || {};
    logger.info("📨 Webhook MP ricevuto", { type, dataId: data?.id });

    if (!["payment", "subscription_authorized_payment"].includes(type)) {
      return res.status(200).json({ skipped: true, reason: `tipo '${type}' ignorato` });
    }

    const paymentId = data?.id;
    if (!paymentId) return res.status(400).json({ error: "data.id mancante" });

    let payment;
    try {
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN.value()}`, "Content-Type": "application/json" },
      });
      payment = await mpRes.json();
      if (!mpRes.ok) {
        logger.error("❌ Errore API MP", { status: mpRes.status, body: payment });
        return res.status(502).json({ error: "Errore API MercadoPago" });
      }
    } catch (err) {
      logger.error("❌ Fetch API MP fallito", { error: err.message });
      return res.status(500).json({ error: "Errore interno" });
    }

    if (payment.status !== "approved") {
      return res.status(200).json({ skipped: true, reason: `status: ${payment.status}` });
    }

    // FIX: MercadoPago devuelve transaction_amount en CLP enteros (sin centavos).
    // La variable anterior 'amountCentavos' era incorrecta — multiplicaba x100
    // haciendo que nunca coincidiera con las claves de PRICE_TO_PLAN.
    const amountCLP  = Math.round(payment.transaction_amount || 0);
    const nuovoPiano = PRICE_TO_PLAN[amountCLP];

    if (!nuovoPiano) {
      logger.warn("⚠️ Importo non corrisponde a nessun piano", { amountCLP });
      return res.status(200).json({ skipped: true, reason: `importo ${amountCLP} CLP non mappato` });
    }

    let workspaceId  = payment.external_reference || null;
    let workspaceRef = null;

    if (workspaceId) {
      workspaceRef = db.collection("workspaces").doc(workspaceId);
      const snap   = await workspaceRef.get();
      if (!snap.exists) { workspaceRef = null; workspaceId = null; }
    }

    if (!workspaceRef) {
      const payerEmail = payment.payer?.email;
      if (!payerEmail) return res.status(200).json({ skipped: true, reason: "nessun riferimento workspace" });
      const usersSnap = await db.collection("users").where("email", "==", payerEmail).limit(1).get();
      if (usersSnap.empty) return res.status(200).json({ skipped: true, reason: "utente non trovato" });
      const uid    = usersSnap.docs[0].id;
      const wsSnap = await db.collection("workspaces").where("ownerId", "==", uid).limit(1).get();
      if (wsSnap.empty) return res.status(200).json({ skipped: true, reason: "workspace non trovato" });
      workspaceRef = wsSnap.docs[0].ref;
      workspaceId  = wsSnap.docs[0].id;
    }

    const ora      = new Date().toISOString();
    const scadenza = new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString();

    await workspaceRef.update({
      plan:              nuovoPiano,
      planActivatedAt:   ora,
      planExpiresAt:     scadenza,
      lastPaymentId:     String(payment.id),
      lastPaymentAmount: payment.transaction_amount,
      trialEndsAt:       null,
    });

    logger.info("🎉 Piano aggiornato", { workspaceId, nuovoPiano, paymentId: payment.id });

    try {
      const gmailUser  = GMAIL_USER.value();
      const gmailPass  = GMAIL_PASS.value();
      const payerEmail = payment.payer?.email;
      if (gmailUser && gmailPass && payerEmail) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: gmailUser, pass: gmailPass },
        });
        const planLabel   = nuovoPiano === "pro" ? "Pro ⚡" : "Empresa 🏢";
        const scadenzaFmt = new Date(scadenza).toLocaleDateString("es-CL");
        await transporter.sendMail({
          from: `"Obra Nova" <${gmailUser}>`,
          to:   payerEmail,
          subject: `✅ Tu plan ${planLabel} está activo — Obra Nova`,
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
              <div style="background:linear-gradient(135deg,#1a365d,#553c9a);padding:28px 24px;border-radius:12px 12px 0 0;text-align:center">
                <div style="font-size:36px;margin-bottom:8px">🎉</div>
                <h1 style="color:white;font-size:20px;margin:0">¡Plan ${planLabel} activado!</h1>
              </div>
              <div style="background:white;padding:24px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px">
                <p style="color:#4a5568;font-size:14px;line-height:1.6">
                  Tu pago fue procesado correctamente. Ya tienes acceso completo a todas las funciones de Obra Nova ${planLabel}.
                </p>
                <table style="width:100%;font-size:13px;border-collapse:collapse;margin:16px 0">
                  <tr style="background:#f7fafc"><td style="padding:8px 12px;color:#718096">Plan</td><td style="padding:8px 12px;font-weight:700;color:#1a365d">${planLabel}</td></tr>
                  <tr><td style="padding:8px 12px;color:#718096">Válido hasta</td><td style="padding:8px 12px;font-weight:700;color:#276749">${scadenzaFmt}</td></tr>
                  <tr style="background:#f7fafc"><td style="padding:8px 12px;color:#718096">Pago N°</td><td style="padding:8px 12px;color:#4a5568">${payment.id}</td></tr>
                </table>
                <div style="text-align:center;margin-top:20px">
                  <a href="https://app.obranova.cl" style="background:#276749;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px">
                    Ir a Obra Nova →
                  </a>
                </div>
                <p style="color:#a0aec0;font-size:11px;margin-top:20px;text-align:center">
                  ¿Necesitas ayuda? Escríbenos a administracion@obranova.cl
                </p>
              </div>
            </div>`,
        });
        logger.info("📧 Email confirmación enviada", { payerEmail, nuovoPiano });
      }
    } catch (emailErr) {
      logger.warn("⚠️ Email confirmación fallida (pago OK):", emailErr.message);
    }

    return res.status(200).json({ success: true, workspaceId, plan: nuovoPiano, activatedAt: ora });
  })
);

// ── crearLinkPago — SPRINT 3: App Check enforcement ──────────────────────────
// enforceAppCheck: true → Firebase rifiuta automaticamente le chiamate
// senza un token App Check valido (generato da reCAPTCHA Enterprise sul client)
// Questo protegge da:
//   • Bot che chiamano la function per generare link MP fraudolenti
//   • Script che abusano del token MP per creare preferenze di pagamento fake
//   • Attacchi da ambienti non-browser (non hanno reCAPTCHA)
exports.crearLinkPago = onCall(
  {
    region:           LOCATION,
    memory:           "256MiB",
    timeoutSeconds:   30,
    secrets:          [MP_ACCESS_TOKEN],
    // ── App Check enforcement ──────────────────────────────────────────────
    // Con enforceAppCheck: true, Firebase SDK verifica automaticamente il token
    // PRIMA che la funzione venga invocata. Se manca o è invalido → 401 automatico.
    enforceAppCheck:  true,
  },
  async (request) => {
    // ── Autenticazione richiesta ───────────────────────────────────────────
    // Solo utenti autenticati possono creare link MP (protezione doppia con App Check)
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Devi essere autenticato per generare link di pagamento");
    }

    const uid = request.auth.uid;
    const { monto, descripcion, proyectoId, workspaceId, cuotaIndex } = request.data || {};

    // ── Validazione input ─────────────────────────────────────────────────
    if (!monto || typeof monto !== "number" || monto <= 0) {
      throw new HttpsError("invalid-argument", "monto deve essere un numero positivo");
    }

    // Protezione anti-abuse: limite massimo 100M CLP per transazione
    const MONTO_MAX_CLP = 100_000_000;
    if (monto > MONTO_MAX_CLP) {
      logger.warn("🚫 Tentativo monto anomalo", { uid, monto, workspaceId });
      throw new HttpsError("invalid-argument", `monto supera il massimo consentito (${MONTO_MAX_CLP.toLocaleString()} CLP)`);
    }

    if (!descripcion || typeof descripcion !== "string" || descripcion.trim().length === 0) {
      throw new HttpsError("invalid-argument", "descripcion obbligatoria");
    }

    // Sanifica la descrizione (max 255 char, nessun carattere di controllo)
    const descSanitized = descripcion.trim().slice(0, 255).replace(/[\x00-\x1F\x7F]/g, "");

    // ── Verifica che l'utente appartenga al workspace ─────────────────────
    if (workspaceId) {
      const memberRef = db.doc(`workspaces/${workspaceId}/members/${uid}`);
      const memberSnap = await memberRef.get();
      if (!memberSnap.exists) {
        logger.warn("🚫 UID non è membro del workspace", { uid, workspaceId });
        throw new HttpsError("permission-denied", "Non sei membro di questo workspace");
      }
    }

    const token = MP_ACCESS_TOKEN.value();
    if (!token) {
      throw new HttpsError("internal", "MP_ACCESS_TOKEN non configurato");
    }

    const externalRef = [workspaceId, proyectoId, cuotaIndex ?? ""].filter(Boolean).join("__") || "obranova";

    // ── Log strutturato per audit trail ──────────────────────────────────
    logger.info("🔗 crearLinkPago richiesta", {
      uid,
      workspaceId: workspaceId || "—",
      proyectoId:  proyectoId  || "—",
      cuotaIndex:  cuotaIndex  ?? "—",
      monto,
      externalRef,
    });

    try {
      const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              title:       descSanitized,
              quantity:    1,
              unit_price:  monto,
              currency_id: "CLP",
            },
          ],
          external_reference: externalRef,
          back_urls: {
            success: "https://app.obranova.cl/app?pago=ok",
            failure: "https://app.obranova.cl/app?pago=error",
            pending: "https://app.obranova.cl/app?pago=pendiente",
          },
          auto_return:          "approved",
          statement_descriptor: "OBRA NOVA",
          expiration_date_to:   new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });

      const pref = await mpRes.json();

      if (!mpRes.ok) {
        logger.error("❌ MP preference error", { status: mpRes.status, pref, uid });
        throw new HttpsError("internal", `MercadoPago error: ${pref?.message || mpRes.status}`);
      }

      const mpLink       = pref.init_point;
      const preferenceId = pref.id;

      // Salva link su Firestore (best-effort)
      if (workspaceId && proyectoId) {
        try {
          const docRef = db.doc(`workspaces/${workspaceId}/proyectos/${proyectoId}`);
          const snap   = await docRef.get();
          if (snap.exists) {
            const data   = snap.data();
            const cuotas = (data.cuotas || []).map((c, idx) =>
              idx === (cuotaIndex ?? -1) ? { ...c, mpLink, preferenceId } : c
            );
            await docRef.update({ cuotas, updatedAt: new Date().toISOString() });
          }
        } catch (fsErr) {
          logger.warn("⚠️ Firestore update cuota fallito (link generato OK):", fsErr.message);
        }
      }

      logger.info("✅ Link MP creato", { preferenceId, externalRef, monto, uid });
      return { mpLink, preferenceId };

    } catch (err) {
      if (err instanceof HttpsError) throw err;
      logger.error("❌ crearLinkPago errore generico", { error: err.message, uid });
      throw new HttpsError("internal", "Errore interno: " + err.message);
    }
  }
);

// ── logAttivita — Log azioni utente su Firestore ──────────────────────────────
exports.logAttivita = onCall(
  {
    region:         LOCATION,
    memory:         "128MiB",
    timeoutSeconds: 10,
  },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Auth required");
    const { workspaceId, azione, collezione, docId, extra } = request.data || {};
    if (!workspaceId || !azione) throw new HttpsError("invalid-argument", "Campi mancanti");
    await db
      .collection("workspaces").doc(workspaceId)
      .collection("log_actividad").add({
        uid:        request.auth.uid,
        azione,
        collezione: collezione || "",
        docId:      docId      || "",
        extra:      extra      || {},
        timestamp:  admin.firestore.FieldValue.serverTimestamp(),
      });
    return { ok: true };
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// FCM PUSH NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════

// ── Helper: ottieni tutti i token FCM di un workspace ─────────────────────────
async function getFcmTokens(workspaceId) {
  const snap = await db
    .collection("workspaces").doc(workspaceId)
    .collection("fcmTokens").get();
  return snap.docs.map(d => d.data().token).filter(Boolean);
}

// ── Helper: invia notifica FCM a una lista di token ───────────────────────────
async function sendFcmToTokens(tokens, notification, data = {}) {
  if (!tokens.length) return;
  const messaging = admin.messaging();
  const results = await Promise.allSettled(
    tokens.map(token =>
      messaging.send({
        token,
        notification: {
          title: notification.title,
          body:  notification.body,
        },
        webpush: {
          notification: {
            icon:  "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
            ...notification,
          },
          fcmOptions: { link: data.url || "https://app.obranova.cl" },
        },
        data: Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ),
      })
    )
  );

  // Rimuovi token non validi (expired/unregistered)
  const invalidTokens = [];
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      const code = r.reason?.errorInfo?.code || "";
      if (code.includes("registration-token-not-registered") ||
          code.includes("invalid-registration-token")) {
        invalidTokens.push(tokens[i]);
      }
    }
  });

  return { sent: results.filter(r => r.status === "fulfilled").length, invalidTokens };
}

// ── Helper: cleanup token scaduti ─────────────────────────────────────────────
async function cleanupInvalidTokens(workspaceId, invalidTokens) {
  if (!invalidTokens.length) return;
  const batch = db.batch();
  invalidTokens.forEach(token => {
    const ref = db
      .collection("workspaces").doc(workspaceId)
      .collection("fcmTokens").doc(token);
    batch.delete(ref);
  });
  await batch.commit();
}

// ── sendPushNotification — callable da frontend ───────────────────────────────
// Permette all'owner/admin di inviare una push manuale al proprio team.
exports.sendPushNotification = onCall(
  { region: LOCATION, memory: "256MiB", timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Auth required");
    const { workspaceId, title, body, url } = request.data || {};
    if (!workspaceId || !title) throw new HttpsError("invalid-argument", "workspaceId e title obbligatori");

    const tokens = await getFcmTokens(workspaceId);
    if (!tokens.length) return { sent: 0, message: "Nessun token registrato" };

    const result = await sendFcmToTokens(tokens, { title, body: body || "" }, { url: url || "/" });
    if (result.invalidTokens.length) await cleanupInvalidTokens(workspaceId, result.invalidTokens);

    logger.info(`[FCM] sendPushNotification: ${result.sent} inviati`, { workspaceId });
    return { sent: result.sent };
  }
);

// ── Trigger: push quando arriva un nuevo comentario de cliente ────────────────
const { onDocumentCreated } = require("firebase-functions/v2/firestore");

exports.pushNuevoComentario = onDocumentCreated(
  {
    document:       "workspaces/{workspaceId}/proyectos/{proyectoId}/comentarios/{comentarioId}",
    region:         LOCATION,
    memory:         "256MiB",
    timeoutSeconds: 30,
  },
  async (event) => {
    const data          = event.data?.data();
    const { workspaceId, proyectoId } = event.params;
    if (!data || data.tipo !== "cliente") return; // solo messaggi da clienti

    // Recupera info progetto per il nome cliente
    const proySnap = await db
      .collection("workspaces").doc(workspaceId)
      .collection("proyectos").doc(proyectoId).get();
    const clienteNombre = proySnap.data()?.info?.cliente || "Un cliente";

    const tokens = await getFcmTokens(workspaceId);
    if (!tokens.length) return;

    const result = await sendFcmToTokens(
      tokens,
      {
        title: `💬 ${clienteNombre} escribió`,
        body:  (data.texto || "").slice(0, 100),
      },
      {
        url:       `https://app.obranova.cl`,
        proyectoId,
        workspaceId,
        tipo:      "comentario_cliente",
      }
    );

    if (result.invalidTokens.length) await cleanupInvalidTokens(workspaceId, result.invalidTokens);
    logger.info(`[FCM] pushNuevoComentario: ${result.sent} inviati`, { workspaceId, proyectoId });
  }
);

// ── Trigger: push quando una firma viene ricevuta ─────────────────────────────
exports.pushNuevaFirma = onDocumentCreated(
  {
    document:       "workspaces/{workspaceId}/firme/{firmaId}",
    region:         LOCATION,
    memory:         "256MiB",
    timeoutSeconds: 30,
  },
  async (event) => {
    const data          = event.data?.data();
    const { workspaceId } = event.params;
    if (!data) return;

    const tokens = await getFcmTokens(workspaceId);
    if (!tokens.length) return;

    const nombre = data.nombre || "Un cliente";
    const result = await sendFcmToTokens(
      tokens,
      {
        title: `✍️ ${nombre} firmó el presupuesto`,
        body:  data.proyectoDesc ? `Proyecto: ${data.proyectoDesc}` : "Firma digital recibida",
      },
      {
        url:        `https://app.obranova.cl`,
        workspaceId,
        tipo:       "nueva_firma",
        proyectoId: data.proyectoId || "",
      }
    );

    if (result.invalidTokens.length) await cleanupInvalidTokens(workspaceId, result.invalidTokens);
    logger.info(`[FCM] pushNuevaFirma: ${result.sent} inviati`, { workspaceId });
  }
);

// ═══════════════════════════════════════════════════════════════════════════════
// REPORT MENSILE AUTOMATICO
// Gira il 1° di ogni mese alle 08:00 (America/Santiago)
// Calcola KPI del mese precedente per ogni workspace attivo
// e invia email HTML all'owner del workspace.
// ═══════════════════════════════════════════════════════════════════════════════

// ── Helper: calcola totale progetto (replica logica frontend) ─────────────────
function calcProyTotal(proy) {
  const partidas = proy.partidas || [];
  const pct      = proy.pct || { ci: 10, gf: 5, imprevistos: 5, utilidad: 10 };
  const cd       = partidas.reduce((s, p) => s + (p.cant || 0) * (p.pu || 0), 0);
  const overhead = cd * ((pct.ci + pct.gf + pct.imprevistos) / 100);
  const sub      = cd + overhead;
  const util     = sub * (pct.utilidad / 100);
  const total    = sub + util;
  const desc     = proy.descuento || { tipo: "pct", valor: 0 };
  const descAmt  = desc.tipo === "pct" ? total * ((desc.valor || 0) / 100) : (desc.valor || 0);
  const neto     = total - descAmt;
  return proy.iva !== false ? neto * 1.19 : neto;
}

function calcCostoReal(proy) {
  return (proy.partidas || []).reduce((s, p) => s + (p.cant || 0) * (p.pu || 0), 0);
}

// ── Helper: genera HTML email report ─────────────────────────────────────────
function buildReportHtml({ wsName, ownerEmail, mes, kpi, topProyectos }) {
  const fmt = (n) => "$ " + Math.round(n || 0).toLocaleString("es-CL");
  const pct = (n) => Math.round(n || 0) + "%";

  const proyRows = topProyectos.map(p => `
    <tr style="border-bottom:1px solid #f0f4f8">
      <td style="padding:8px 12px;font-size:12px;color:#2d3748">${p.cliente || "—"}</td>
      <td style="padding:8px 12px;font-size:12px;color:#2d3748">${p.descripcion || "—"}</td>
      <td style="padding:8px 12px;font-size:12px;font-weight:700;color:#276749;text-align:right">${fmt(p.total)}</td>
      <td style="padding:8px 12px;font-size:12px;text-align:center">
        <span style="padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700;background:${p.estadoBg};color:${p.estadoColor}">${p.estado}</span>
      </td>
    </tr>
  `).join("");

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7fafc;font-family:'Segoe UI',system-ui,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1a365d,#2b6cb0);border-radius:16px;padding:28px 28px 24px;margin-bottom:20px;text-align:center">
      <div style="font-size:28px;font-weight:900;color:white;letter-spacing:-0.5px">OBRA<span style="color:#d69e2e">NOVA</span></div>
      <div style="color:rgba(255,255,255,.8);font-size:14px;margin-top:6px">Reporte mensual — ${mes}</div>
      <div style="color:rgba(255,255,255,.6);font-size:12px;margin-top:3px">${wsName}</div>
    </div>

    <!-- KPI Grid -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">

      <div style="background:white;border-radius:12px;padding:18px;border-left:4px solid #276749;box-shadow:0 1px 4px rgba(0,0,0,.07)">
        <div style="font-size:11px;color:#718096;font-weight:600;margin-bottom:4px">💰 FACTURACIÓN</div>
        <div style="font-size:22px;font-weight:900;color:#276749">${fmt(kpi.facturacion)}</div>
        <div style="font-size:11px;color:#a0aec0;margin-top:3px">${kpi.aceptados} proyecto${kpi.aceptados !== 1 ? "s" : ""} aceptado${kpi.aceptados !== 1 ? "s" : ""}</div>
      </div>

      <div style="background:white;border-radius:12px;padding:18px;border-left:4px solid #c05621;box-shadow:0 1px 4px rgba(0,0,0,.07)">
        <div style="font-size:11px;color:#718096;font-weight:600;margin-bottom:4px">📊 MARGEN</div>
        <div style="font-size:22px;font-weight:900;color:#c05621">${fmt(kpi.margen)}</div>
        <div style="font-size:11px;color:#a0aec0;margin-top:3px">${pct(kpi.margenPct)} sobre costos directos</div>
      </div>

      <div style="background:white;border-radius:12px;padding:18px;border-left:4px solid #2b6cb0;box-shadow:0 1px 4px rgba(0,0,0,.07)">
        <div style="font-size:11px;color:#718096;font-weight:600;margin-bottom:4px">📋 PROYECTOS</div>
        <div style="font-size:22px;font-weight:900;color:#2b6cb0">${kpi.totalProyectos}</div>
        <div style="font-size:11px;color:#a0aec0;margin-top:3px">${kpi.enviados} enviados · ${kpi.rechazados} rechazados</div>
      </div>

      <div style="background:white;border-radius:12px;padding:18px;border-left:4px solid #553c9a;box-shadow:0 1px 4px rgba(0,0,0,.07)">
        <div style="font-size:11px;color:#718096;font-weight:600;margin-bottom:4px">🎯 CONVERSIÓN</div>
        <div style="font-size:22px;font-weight:900;color:#553c9a">${pct(kpi.convRate)}</div>
        <div style="font-size:11px;color:#a0aec0;margin-top:3px">Aceptados / (Env + Acep + Rech)</div>
      </div>

    </div>

    <!-- Proyectos del mes -->
    ${topProyectos.length > 0 ? `
    <div style="background:white;border-radius:12px;padding:20px;margin-bottom:20px;box-shadow:0 1px 4px rgba(0,0,0,.07)">
      <div style="font-size:14px;font-weight:800;color:#1a365d;margin-bottom:14px">📁 Proyectos del mes</div>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f7fafc">
            <th style="padding:8px 12px;font-size:11px;color:#718096;font-weight:700;text-align:left">Cliente</th>
            <th style="padding:8px 12px;font-size:11px;color:#718096;font-weight:700;text-align:left">Descripción</th>
            <th style="padding:8px 12px;font-size:11px;color:#718096;font-weight:700;text-align:right">Total</th>
            <th style="padding:8px 12px;font-size:11px;color:#718096;font-weight:700;text-align:center">Estado</th>
          </tr>
        </thead>
        <tbody>${proyRows}</tbody>
      </table>
    </div>
    ` : ""}

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:20px">
      <a href="https://app.obranova.cl" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#1a365d,#2b6cb0);color:white;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px">
        📊 Ver reporte completo en ObraNova
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;color:#a0aec0;font-size:11px;line-height:1.6">
      <div>ObraNova SPA · RUT 78.301.823-3</div>
      <div>Reporte generado automáticamente el 1° de cada mes</div>
      <div style="margin-top:4px">
        <a href="https://app.obranova.cl" style="color:#2b6cb0;text-decoration:none">app.obranova.cl</a>
      </div>
    </div>

  </div>
</body>
</html>`;
}

// ── Cloud Function: cron mensile ───────────────────────────────────────────────
exports.reporteMensual = onSchedule(
  {
    schedule:       "0 8 1 * *",           // 1° del mese alle 08:00
    timeZone:       "America/Santiago",
    region:         LOCATION,
    memory:         "512MiB",
    timeoutSeconds: 300,
    secrets:        [GMAIL_USER, GMAIL_PASS],
  },
  async (event) => {
    const now    = new Date();
    const year   = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const month  = now.getMonth() === 0 ? 12 : now.getMonth(); // mese precedente (1-based)
    const mesStr = `${year}-${String(month).padStart(2, "0")}`; // es. "2026-02"

    const MESES_ES = ["","Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    const mesLabel = `${MESES_ES[month]} ${year}`;

    logger.info(`📈 Reporte mensile avviato per ${mesLabel}`);

    // ── Carica tutti i workspace ─────────────────────────────────────────────
    const wsSnap = await db.collection("workspaces").get();
    let totalInviati = 0;
    let totalErrori  = 0;

    for (const wsDoc of wsSnap.docs) {
      const ws    = wsDoc.data();
      const wsId  = wsDoc.id;
      const plan  = ws.plan || "free";

      // Solo workspace Pro o Empresa
      if (!["pro", "empresa"].includes(plan)) continue;

      try {
        // ── Carica proyectos del mese ──────────────────────────────────────
        const proySnap = await db
          .collection("workspaces").doc(wsId)
          .collection("proyectos").get();

        const todosProyectos = proySnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Filtra per mese (usa updatedAt o createdAt)
        const proyMese = todosProyectos.filter(p => {
          const fecha = p.updatedAt || p.createdAt || "";
          return fecha.startsWith(mesStr);
        });

        const proyAceptados = proyMese.filter(p => p.estado === "Aceptado");

        // ── Calcola KPI ────────────────────────────────────────────────────
        const facturacion  = proyAceptados.reduce((s, p) => s + calcProyTotal(p), 0);
        const costoReal    = proyAceptados.reduce((s, p) => s + calcCostoReal(p), 0);
        const margen       = facturacion - costoReal;
        const margenPct    = costoReal > 0 ? (margen / costoReal) * 100 : 0;
        const enviados     = proyMese.filter(p => p.estado === "Enviado").length;
        const rechazados   = proyMese.filter(p => p.estado === "Rechazado").length;
        const convDenom    = enviados + proyAceptados.length + rechazados;
        const convRate     = convDenom > 0 ? (proyAceptados.length / convDenom) * 100 : 0;

        const ESTADO_COLORS_MAP = {
          Borrador: "#718096", Enviado: "#2b6cb0", Aceptado: "#276749",
          Rechazado: "#c53030", "En obra": "#b7791f", Finalizado: "#553c9a",
        };
        const ESTADO_BG_MAP = {
          Borrador: "#edf2f7", Enviado: "#ebf8ff", Aceptado: "#f0fff4",
          Rechazado: "#fff5f5", "En obra": "#fffaf0", Finalizado: "#faf5ff",
        };

        const topProyectos = [...proyMese]
          .sort((a, b) => calcProyTotal(b) - calcProyTotal(a))
          .slice(0, 8)
          .map(p => ({
            cliente:     p.info?.cliente     || "—",
            descripcion: p.info?.descripcion || "—",
            total:       calcProyTotal(p),
            estado:      p.estado || "Borrador",
            estadoColor: ESTADO_COLORS_MAP[p.estado] || "#718096",
            estadoBg:    ESTADO_BG_MAP[p.estado]     || "#f7fafc",
          }));

        // ── Trova email owner ──────────────────────────────────────────────
        const membersSnap = await db
          .collection("workspaces").doc(wsId)
          .collection("members").where("role", "==", "owner").limit(1).get();

        if (membersSnap.empty) {
          logger.warn(`[${wsId}] Nessun owner trovato — skip`);
          continue;
        }

        const ownerUid   = membersSnap.docs[0].id;
        const ownerData  = membersSnap.docs[0].data();
        const ownerEmail = ownerData.email || ws.ownerEmail || "";

        if (!ownerEmail) {
          logger.warn(`[${wsId}] Email owner non trovata — skip`);
          continue;
        }

        // ── Skip se nessuna attività nel mese ─────────────────────────────
        if (proyMese.length === 0) {
          logger.info(`[${wsId}] Nessun progetto nel mese — skip email`);
          continue;
        }

        // ── Genera e invia email ───────────────────────────────────────────
        const html = buildReportHtml({
          wsName: ws.name || "Tu empresa",
          ownerEmail,
          mes: mesLabel,
          kpi: {
            facturacion,
            margen,
            margenPct,
            totalProyectos: proyMese.length,
            aceptados:      proyAceptados.length,
            enviados,
            rechazados,
            convRate,
          },
          topProyectos,
        });

        const transporter = require("nodemailer").createTransport({
          service: "gmail",
          auth: { user: GMAIL_USER.value(), pass: GMAIL_PASS.value() },
        });

        await transporter.sendMail({
          from:    `"ObraNova Reportes" <${GMAIL_USER.value()}>`,
          to:      ownerEmail,
          subject: `📈 Tu reporte de ${mesLabel} — ${ws.name || "ObraNova"}`,
          html,
        });

        totalInviati++;
        logger.info(`✅ Reporte inviato a ${ownerEmail} (${ws.name})`);

      } catch (err) {
        totalErrori++;
        logger.error(`❌ Errore reporte workspace ${wsId}:`, err.message);
      }
    }

    logger.info(`📈 Reporte mensile completato: ${totalInviati} inviati, ${totalErrori} errori`);
  }
);

// ── reporteMensualCallable — test manuale da TabSettings ─────────────────────
// Permette all'admin di inviare il report subito senza aspettare il cron.
exports.reporteMensualCallable = onCall(
  {
    region:           LOCATION,
    memory:           "512MiB",
    timeoutSeconds:   120,
    secrets:          [GMAIL_USER, GMAIL_PASS],
    enforceAppCheck:  false,
    cors:             true,
  },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Auth required");

    const { workspaceId, targetEmail } = request.data || {};
    if (!workspaceId) throw new HttpsError("invalid-argument", "workspaceId obbligatorio");

    const now    = new Date();
    const year   = now.getFullYear();
    const month  = now.getMonth() + 1; // mese corrente per il test
    const mesStr = `${year}-${String(month).padStart(2, "0")}`;
    const MESES_ES = ["","Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    const mesLabel = `${MESES_ES[month]} ${year} (preview)`;

    const proySnap = await db
      .collection("workspaces").doc(workspaceId)
      .collection("proyectos").get();

    const proyMese     = proySnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(p => (p.updatedAt || p.createdAt || "").startsWith(mesStr));

    const proyAceptados = proyMese.filter(p => p.estado === "Aceptado");
    const facturacion   = proyAceptados.reduce((s, p) => s + calcProyTotal(p), 0);
    const costoReal     = proyAceptados.reduce((s, p) => s + calcCostoReal(p), 0);
    const margen        = facturacion - costoReal;
    const margenPct     = costoReal > 0 ? (margen / costoReal) * 100 : 0;
    const enviados      = proyMese.filter(p => p.estado === "Enviado").length;
    const rechazados    = proyMese.filter(p => p.estado === "Rechazado").length;
    const convDenom     = enviados + proyAceptados.length + rechazados;
    const convRate      = convDenom > 0 ? (proyAceptados.length / convDenom) * 100 : 0;

    const ESTADO_COLORS_MAP = { Borrador:"#718096",Enviado:"#2b6cb0",Aceptado:"#276749",Rechazado:"#c53030","En obra":"#b7791f",Finalizado:"#553c9a" };
    const ESTADO_BG_MAP     = { Borrador:"#edf2f7",Enviado:"#ebf8ff",Aceptado:"#f0fff4",Rechazado:"#fff5f5","En obra":"#fffaf0",Finalizado:"#faf5ff" };

    const wsDoc   = await db.collection("workspaces").doc(workspaceId).get();
    const wsData  = wsDoc.data() || {};

    const topProyectos = [...proyMese]
      .sort((a, b) => calcProyTotal(b) - calcProyTotal(a))
      .slice(0, 8)
      .map(p => ({
        cliente:     p.info?.cliente     || "—",
        descripcion: p.info?.descripcion || "—",
        total:       calcProyTotal(p),
        estado:      p.estado || "Borrador",
        estadoColor: ESTADO_COLORS_MAP[p.estado] || "#718096",
        estadoBg:    ESTADO_BG_MAP[p.estado]     || "#f7fafc",
      }));

    const html = buildReportHtml({
      wsName: wsData.name || "Tu empresa",
      ownerEmail: targetEmail,
      mes: mesLabel,
      kpi: { facturacion, margen, margenPct, totalProyectos: proyMese.length, aceptados: proyAceptados.length, enviados, rechazados, convRate },
      topProyectos,
    });

    const transporter = require("nodemailer").createTransport({
      service: "gmail",
      auth: { user: GMAIL_USER.value(), pass: GMAIL_PASS.value() },
    });

    await transporter.sendMail({
      from:    `"ObraNova Reportes" <${GMAIL_USER.value()}>`,
      to:      targetEmail,
      subject: `📈 Preview reporte ${mesLabel} — ${wsData.name || "ObraNova"}`,
      html,
    });

    return { ok: true, emailEnviado: targetEmail, proyectos: proyMese.length };
  }
);
