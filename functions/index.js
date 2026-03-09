// ─── functions/index.js ───────────────────────────────────────────────────────
// Cloud Functions para Obra Nova
//
// 4.2  webhookMercadoPago  — procesa notificaciones IPN de MP y actualiza plan
// 5.6  backupFirestore     — exporta Firestore a GCS cada 24h (Cloud Scheduler)
//
// Deploy:
//   firebase deploy --only functions
//
// Variables de entorno requeridas (firebase functions:config:set):
//   mp.access_token   = tu Access Token de MercadoPago
//   mp.webhook_secret = clave secreta para validar firma (opcional pero recomendado)
//   backup.bucket     = nombre del bucket GCS para backups (ej: obra-nova-backups)

const { onRequest, onSchedule } = require("firebase-functions/v2/https");
const { onSchedule: onSched }   = require("firebase-functions/v2/scheduler");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getStorage }            = require("firebase-admin/storage");
const admin                     = require("firebase-admin");
const crypto                    = require("crypto");

admin.initializeApp();
const db = getFirestore();

// ── Precios de los planes (CLP) ───────────────────────────────────────────────
const PLAN_PRICES = {
  19900:  "pro",
  39900:  "team",
  79900:  "enterprise",
};

// ── Mapeo MP status → acción ──────────────────────────────────────────────────
const MP_STATUS_MAP = {
  approved:    "activate",
  cancelled:   "cancel",
  refunded:    "cancel",
  charged_back:"cancel",
  rejected:    null,      // no hacer nada
  in_process:  null,
  pending:     null,
};

// ─────────────────────────────────────────────────────────────────────────────
// 4.2  webhookMercadoPago
// URL a configurar en MP: https://<region>-<project>.cloudfunctions.net/webhookMercadoPago
// ─────────────────────────────────────────────────────────────────────────────
exports.webhookMercadoPago = onRequest(
  { region: "southamerica-east1", cors: false },
  async (req, res) => {
    // Solo POST
    if (req.method !== "POST") { res.status(405).send("Method Not Allowed"); return; }

    // ── Validar firma x-signature (recomendado en producción) ────────────────
    const mpSecret = process.env.MP_WEBHOOK_SECRET;
    if (mpSecret) {
      const xSig = req.headers["x-signature"] || "";
      const xReq = req.headers["x-request-id"] || "";
      const dataId = req.query["data.id"] || req.body?.data?.id || "";
      const manifest = `id:${dataId};request-id:${xReq};ts:${xSig.match(/ts=(\d+)/)?.[1] || ""}`;
      const expected = crypto.createHmac("sha256", mpSecret).update(manifest).digest("hex");
      const received = xSig.match(/v1=([a-f0-9]+)/)?.[1] || "";
      if (received !== expected) {
        console.warn("MP signature mismatch", { received, expected: expected.slice(0, 8) + "..." });
        res.status(401).send("Unauthorized");
        return;
      }
    }

    const body = req.body;
    const type = body?.type || body?.topic;

    // ── Solo procesar pagos ───────────────────────────────────────────────────
    if (type !== "payment") { res.status(200).send("OK"); return; }

    const paymentId = body?.data?.id || body?.id;
    if (!paymentId) { res.status(400).send("No payment id"); return; }

    try {
      // ── Obtener detalle del pago desde la API de MP ───────────────────────
      const mpToken = process.env.MP_ACCESS_TOKEN;
      if (!mpToken) throw new Error("MP_ACCESS_TOKEN not configured");

      const mpRes  = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${mpToken}` },
      });
      if (!mpRes.ok) throw new Error(`MP API error: ${mpRes.status}`);

      const payment = await mpRes.json();
      const status  = payment.status;          // "approved" | "cancelled" ...
      const amount  = payment.transaction_amount;
      const email   = payment.payer?.email || payment.metadata?.email;
      const wsId    = payment.metadata?.workspace_id || payment.external_reference;

      console.log("MP payment", { paymentId, status, amount, email, wsId });

      // ── Log del pago en Firestore ─────────────────────────────────────────
      await db.collection("mp_payments").doc(String(paymentId)).set({
        paymentId: String(paymentId),
        status,
        amount,
        email:    email || null,
        wsId:     wsId  || null,
        payload:  payment,
        createdAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      const action = MP_STATUS_MAP[status];
      if (!action) { res.status(200).send("OK – status ignored"); return; }

      // ── Busca el workspace ────────────────────────────────────────────────
      let workspaceRef = null;

      if (wsId) {
        workspaceRef = db.collection("workspaces").doc(wsId);
      } else if (email) {
        // Busca por email del owner
        const snap = await db.collection("workspaces")
          .where("ownerEmail", "==", email)
          .limit(1).get();
        if (!snap.empty) workspaceRef = snap.docs[0].ref;
      }

      if (!workspaceRef) {
        console.warn("No workspace found for payment", { paymentId, email, wsId });
        res.status(200).send("OK – no workspace matched");
        return;
      }

      if (action === "activate") {
        // Determina plan según monto
        const plan = PLAN_PRICES[Math.round(amount)] || "pro";

        // Calcula próxima renovación (+30 días desde hoy)
        const renewAt = new Date();
        renewAt.setDate(renewAt.getDate() + 30);

        await workspaceRef.update({
          plan,
          planActivatedAt: new Date().toISOString(),
          planRenewAt:     renewAt.toISOString(),
          lastPaymentId:   String(paymentId),
          trialEndsAt:     null,  // cancella trial se attivo
          updatedAt:       FieldValue.serverTimestamp(),
        });

        console.log(`✅ Workspace upgraded to ${plan}`, wsId || email);

      } else if (action === "cancel") {
        await workspaceRef.update({
          plan:      "free",
          planCancelledAt: new Date().toISOString(),
          lastPaymentId:   String(paymentId),
          updatedAt:       FieldValue.serverTimestamp(),
        });

        console.log("⬇️ Workspace downgraded to free", wsId || email);
      }

      res.status(200).send("OK");

    } catch (err) {
      console.error("webhookMercadoPago error:", err);
      // Risponde 200 comunque per evitare che MP riprovi all'infinito
      res.status(200).send("Error logged");
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// 5.6  backupFirestore — ogni giorno alle 03:00 America/Santiago
// Requisito: abilita Cloud Firestore Export API + permesso al service account
//   gcloud projects add-iam-policy-binding <PROJECT_ID> \
//     --member=serviceAccount:<PROJECT_ID>@appspot.gserviceaccount.com \
//     --role=roles/datastore.importExportAdmin
//   gsutil iam ch serviceAccount:<PROJECT_ID>@appspot.gserviceaccount.com:objectAdmin gs://<BUCKET>
// ─────────────────────────────────────────────────────────────────────────────
exports.backupFirestore = onSched(
  {
    schedule:  "0 3 * * *",            // ogni giorno alle 03:00
    timeZone:  "America/Santiago",
    region:    "southamerica-east1",
    memory:    "256MiB",
    timeoutSeconds: 120,
  },
  async (event) => {
    const bucket  = process.env.BACKUP_BUCKET;
    if (!bucket) { console.error("BACKUP_BUCKET not set"); return; }

    const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const outputUri = `gs://${bucket}/firestore-backups/${timestamp}`;

    try {
      const client = new admin.firestore.v1.FirestoreAdminClient();
      const name   = client.databasePath(projectId, "(default)");

      const [operation] = await client.exportDocuments({
        name,
        outputUriPrefix: outputUri,
        collectionIds: [],  // [] = tutte le collezioni
      });

      console.log(`✅ Firestore backup avviato → ${outputUri}`, operation.name);

      // ── Pulisci backup più vecchi di 30 giorni ────────────────────────────
      const storage    = getStorage();
      const bucketRef  = storage.bucket(bucket);
      const [files]    = await bucketRef.getFiles({ prefix: "firestore-backups/" });

      const thirtyDaysAgo = Date.now() - 30 * 24 * 3600 * 1000;
      const toDelete = files.filter(f => {
        const created = new Date(f.metadata.timeCreated).getTime();
        return created < thirtyDaysAgo;
      });

      await Promise.all(toDelete.map(f => f.delete().catch(() => {})));
      if (toDelete.length) console.log(`🗑️ Eliminati ${toDelete.length} backup vecchi`);

    } catch (err) {
      console.error("backupFirestore error:", err);
      throw err; // rilancia per far fallire la funzione e ricevere alert
    }
  }
);
