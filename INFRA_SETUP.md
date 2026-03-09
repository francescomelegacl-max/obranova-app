# Obra Nova — Guía de Infraestructura

## 1. Firebase Hosting (5.1)

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar (si no está listo)
firebase use --add obra-nova-prod

# Build y deploy
npm run build
firebase deploy --only hosting
```

El archivo `firebase.json` ya incluye:
- SPA rewrites (todas las rutas → index.html, incluyendo /firma/*)
- Cache inmutable para assets JS/CSS
- Security headers (X-Frame-Options, CSP, etc.)

---

## 2. Firestore Indexes (5.3)

```bash
# Deploar los índices definidos en firestore.indexes.json
firebase deploy --only firestore:indexes
```

Índices incluidos:
- `members` (collectionGroup): uid + workspaceId — requerido para Security Rules
- `members` (collectionGroup): email + status — para invitaciones pendientes
- `proyectos`: estado + updatedAt
- `dte`: workspaceId + creadoAt

---

## 3. Firestore Security Rules (1.4 / 5.2)

```bash
firebase deploy --only firestore:rules
```

⚠️ **Antes de deployar**: verificar que todos los documentos
`workspaces/{wsId}/members/{uid}` tengan el campo `uid` (string).
De lo contrario la función `isMember()` fallará.

---

## 4. Cloud Functions (4.2 + 5.6)

### Prerequisitos

```bash
cd functions
npm install
```

### Variables de entorno

```bash
# MercadoPago (4.2)
firebase functions:secrets:set MP_ACCESS_TOKEN
firebase functions:secrets:set MP_WEBHOOK_SECRET   # opcional pero recomendado

# Backup Firestore (5.6)
firebase functions:secrets:set BACKUP_BUCKET
# Valor: nombre del bucket GCS (ej: obra-nova-backups)
```

### Permisos para el backup (5.6)

```bash
PROJECT_ID="obra-nova-prod"
BUCKET="obra-nova-backups"

# Crear bucket si no existe
gsutil mb -l southamerica-east1 gs://$BUCKET

# Dar permisos al service account de App Engine
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$PROJECT_ID@appspot.gserviceaccount.com" \
  --role="roles/datastore.importExportAdmin"

gsutil iam ch \
  serviceAccount:$PROJECT_ID@appspot.gserviceaccount.com:objectAdmin \
  gs://$BUCKET
```

### Deploy

```bash
firebase deploy --only functions
```

### Configurar webhook MercadoPago (4.2)

1. Ir a [MercadoPago Developers](https://www.mercadopago.cl/developers/panel)
2. Tu aplicación → Webhooks
3. URL: `https://southamerica-east1-obra-nova-prod.cloudfunctions.net/webhookMercadoPago`
4. Eventos: `payment`
5. Copiar la **clave secreta** y configurarla como `MP_WEBHOOK_SECRET`

### Pasar workspace_id en el pago

En el frontend, al crear la preferencia de pago, incluir en `metadata`:

```javascript
// En la función que crea la preferencia MP
const preference = {
  items: [{ title: "Obra Nova Pro", unit_price: 19900, quantity: 1, currency_id: "CLP" }],
  payer: { email: user.email },
  metadata: {
    workspace_id: workspaceId,   // ← clave para el webhook
    email: user.email,
  },
  external_reference: workspaceId,
  back_urls: {
    success: `${window.location.origin}/?payment=success`,
    failure: `${window.location.origin}/?payment=failure`,
  },
  auto_return: "approved",
};
```

---

## 5. Verificación

```bash
# Ver logs de las funciones
firebase functions:log --only webhookMercadoPago
firebase functions:log --only backupFirestore

# Probar webhook localmente
firebase emulators:start --only functions
curl -X POST http://localhost:5001/obra-nova-prod/southamerica-east1/webhookMercadoPago \
  -H "Content-Type: application/json" \
  -d '{"type":"payment","data":{"id":"test-123"}}'
```

---

## Resumen de archivos

| Archivo | Descripción |
|---------|-------------|
| `firebase.json` | Hosting + Functions + Emulators config |
| `.firebaserc` | Alias de proyectos (prod/staging) |
| `firestore.rules` | Security Rules con isMember() |
| `firestore.indexes.json` | Índices Firestore incluyendo collectionGroup |
| `functions/index.js` | Webhook MP + Backup automático |
| `functions/package.json` | Dependencias de las Cloud Functions |
