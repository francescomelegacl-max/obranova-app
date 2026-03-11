// ─── functions/index.js ──────────────────────────────────────────────────────
// TASK 5.6 — Backup automatico Firestore
// TASK 5.7 — Rate limiting Cloud Functions
// TASK 4.2 — Webhook MercadoPago → attivazione automatica piano Pro/Team
// ─────────────────────────────────────────────────────────────────────────────

const { onSchedule }    = require("firebase-functions/v2/scheduler");
const { onRequest }     = require("firebase-functions/v2/https");
const { defineSecret }  = require("firebase-functions/params");
const { logger }        = require("firebase-functions");
const { GoogleAuth }    = require("google-auth-library");
const fetch             = require("node-fetch");
const admin             = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// ─── Secrets (firebase functions:secrets:set <NAME>) ─────────────────────────
const MP_ACCESS_TOKEN      = defineSecret("MP_ACCESS_TOKEN");       // Access Token produzione MP
const MP_WEBHOOK_SECRET    = defineSecret("MP_WEBHOOK_SECRET");     // Segreto per verificare firma webhook MP

// ─── TASK 5.7 — Rate Limiter in-memory ───────────────────────────────────────
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

// ─── Costanti ────────────────────────────────────────────────────────────────
const PROJECT_ID = "obra-nova-spa";
const LOCATION   = "us-central1";
const OUTPUT_URI = `gs://${PROJECT_ID}-backups`;

// Mappa prezzo MP → piano Obra Nova
// Chiave: prezzo in centesimi CLP (MP usa centesimi)
// Aggiorna questi valori se cambi i prezzi
const PRICE_TO_PLAN = {
  1990000: "pro",   // $19.900 CLP mensile Pro
  3990000: "team",  // $39.900 CLP mensile Team
  2990000: "pro",   // $29.900 CLP attivazione Pro (una tantum → attiva pro)
  4990000: "team",  // $49.900 CLP attivazione Team
  1990001: "pro",   // fallback se MP arrotonda
};

// ─── TASK 5.6 — Backup Firestore ─────────────────────────────────────────────
async function eseguiBackupFirestore() {
  const auth      = new GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] });
  const client    = await auth.getClient();
  const token     = await client.getAccessToken();
  const timestamp = new Date().toISOString().slice(0, 10);
  const outputUri = `${OUTPUT_URI}/${timestamp}`;
  const url       = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default):exportDocuments`;

  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token.token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ outputUriPrefix: outputUri }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Firestore Export fallito: ${JSON.stringify(data)}`);
  logger.info("✅ Backup avviato", { operationName: data.name, outputUri, timestamp });
  return { operationName: data.name, outputUri, timestamp };
}

exports.backupNotturnoFirestore = onSchedule(
  { schedule: "0 5 * * *", timeZone: "America/Santiago", region: LOCATION, memory: "256MiB", timeoutSeconds: 120 },
  async (event) => {
    logger.info("🕐 Backup notturno avviato", { scheduledTime: event.scheduleTime });
    try {
      const result = await eseguiBackupFirestore();
      logger.info("🎉 Backup completato", result);
    } catch (error) {
      logger.error("❌ Backup fallito", { error: error.message });
      throw error;
    }
  }
);

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

// ─── TASK 4.2 — Webhook MercadoPago ──────────────────────────────────────────
//
// FLUSSO:
//   1. Cliente paga su MP → MP chiama questo endpoint
//   2. Verifichiamo la firma MP_WEBHOOK_SECRET
//   3. Chiamiamo l'API MP per ottenere i dettagli del pagamento
//   4. Troviamo il workspace dall'email del pagante (external_reference)
//   5. Aggiorniamo workspace.plan = 'pro' | 'team'
//
// CONFIGURAZIONE su MercadoPago Developers:
//   Webhooks → URL: https://us-central1-obra-nova-spa.cloudfunctions.net/webhookMercadoPago
//   Eventi da abilitare: ✅ Pagos  ✅ Suscripciones
//   Copia il "Secret" che MP genera → firebase functions:secrets:set MP_WEBHOOK_SECRET
//
// EXTERNAL REFERENCE:
//   Quando crei i link di pagamento su MP, imposta "external_reference" = workspaceId
//   Questo ci permette di trovare il workspace senza query sull'email.
//   Se non riesci a impostarlo dal pannello MP, useremo l'email come fallback.
//
exports.webhookMercadoPago = onRequest(
  {
    region:         LOCATION,
    memory:         "256MiB",
    timeoutSeconds: 60,
    secrets:        [MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET],
  },
  withRateLimit("webhookMP", 100, 60 * 1000, async (req, res) => {

    // ── 1. Solo POST ──────────────────────────────────────────────────────
    if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

    // ── 2. Verifica firma MP (x-signature header) ─────────────────────────
    // MP invia: x-signature: ts=<timestamp>,v1=<hmac>
    // Docs: https://www.mercadopago.cl/developers/es/docs/your-integrations/notifications/webhooks
    const xSignature = req.headers["x-signature"] || "";
    const xRequestId = req.headers["x-request-id"] || "";
    const secret     = MP_WEBHOOK_SECRET.value();

    if (secret && xSignature) {
      try {
        const crypto  = require("crypto");
        const parts   = Object.fromEntries(xSignature.split(",").map(p => p.split("=")));
        const ts      = parts["ts"] || "";
        const v1      = parts["v1"] || "";
        // Stringa da firmare: id del body + timestamp + request-id
        const dataId  = req.body?.data?.id || "";
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
      // In sviluppo/test MP non invia sempre la firma — logghiamo ma non blocchiamo
      logger.warn("⚠️ Webhook senza firma — accettato solo in test");
    }

    // ── 3. Leggi tipo evento ──────────────────────────────────────────────
    const { type, data } = req.body || {};
    logger.info("📨 Webhook MP ricevuto", { type, dataId: data?.id });

    // Gestiamo solo "payment" e "subscription_authorized_payment"
    if (!["payment", "subscription_authorized_payment"].includes(type)) {
      return res.status(200).json({ skipped: true, reason: `tipo '${type}' ignorato` });
    }

    const paymentId = data?.id;
    if (!paymentId) return res.status(400).json({ error: "data.id mancante" });

    // ── 4. Recupera dettagli pagamento da API MP ──────────────────────────
    let payment;
    try {
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${MP_ACCESS_TOKEN.value()}`,
          "Content-Type": "application/json",
        },
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

    logger.info("💳 Dettagli pagamento MP", {
      id:                 payment.id,
      status:             payment.status,
      transactionAmount:  payment.transaction_amount,
      payerEmail:         payment.payer?.email,
      externalReference:  payment.external_reference,
    });

    // ── 5. Solo pagamenti approvati ───────────────────────────────────────
    if (payment.status !== "approved") {
      logger.info("⏭️ Pagamento non approvato — ignorato", { status: payment.status });
      return res.status(200).json({ skipped: true, reason: `status: ${payment.status}` });
    }

    // ── 6. Determina il piano dall'importo ────────────────────────────────
    const amountCentavos = Math.round((payment.transaction_amount || 0) * 100);
    const nuovoPiano     = PRICE_TO_PLAN[amountCentavos];

    if (!nuovoPiano) {
      logger.warn("⚠️ Importo non corrisponde a nessun piano", { amountCentavos });
      // Non blocchiamo — potrebbe essere un pagamento legittimo con importo diverso
      // Logghiamo per analisi manuale
      return res.status(200).json({ skipped: true, reason: `importo ${amountCentavos} non mappato` });
    }

    // ── 7. Trova il workspace ─────────────────────────────────────────────
    // Strategia 1: external_reference = workspaceId (preferita)
    // Strategia 2: cerca workspace dove il proprietario ha questa email
    let workspaceId   = payment.external_reference || null;
    let workspaceRef  = null;

    if (workspaceId) {
      workspaceRef = db.collection("workspaces").doc(workspaceId);
      const snap   = await workspaceRef.get();
      if (!snap.exists) {
        logger.warn("⚠️ external_reference non trovato come workspaceId", { workspaceId });
        workspaceRef  = null;
        workspaceId   = null;
      }
    }

    // Fallback: cerca per email pagante
    if (!workspaceRef) {
      const payerEmail = payment.payer?.email;
      if (!payerEmail) {
        logger.error("❌ Nessun workspaceId né email pagante — impossibile attivare", { paymentId });
        return res.status(200).json({ skipped: true, reason: "nessun riferimento workspace" });
      }

      // Cerca nei members di tutti i workspace
      const usersSnap = await db.collection("users").where("email", "==", payerEmail).limit(1).get();
      if (usersSnap.empty) {
        logger.warn("⚠️ Nessun utente con email pagante", { payerEmail });
        return res.status(200).json({ skipped: true, reason: "utente non trovato" });
      }

      const uid = usersSnap.docs[0].id;
      // Cerca workspace di cui è owner
      const wsSnap = await db.collection("workspaces").where("ownerId", "==", uid).limit(1).get();
      if (wsSnap.empty) {
        logger.warn("⚠️ Nessun workspace per utente", { uid, payerEmail });
        return res.status(200).json({ skipped: true, reason: "workspace non trovato" });
      }

      workspaceRef = wsSnap.docs[0].ref;
      workspaceId  = wsSnap.docs[0].id;
    }

    // ── 8. Aggiorna il piano nel workspace ────────────────────────────────
    const ora         = new Date().toISOString();
    const scadenza    = new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(); // +32 giorni buffer

    await workspaceRef.update({
      plan:              nuovoPiano,
      planActivatedAt:   ora,
      planExpiresAt:     scadenza,
      lastPaymentId:     String(payment.id),
      lastPaymentAmount: payment.transaction_amount,
      trialEndsAt:       null,  // azzera il trial se era attivo
    });

    logger.info("🎉 Piano aggiornato con successo", {
      workspaceId,
      nuovoPiano,
      paymentId: payment.id,
      amount:    payment.transaction_amount,
    });

    return res.status(200).json({
      success:     true,
      workspaceId,
      plan:        nuovoPiano,
      activatedAt: ora,
    });
  })
);
