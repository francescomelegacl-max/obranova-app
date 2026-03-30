# ObraNova — Guida Pubblicazione Play Store (TWA)

## Prerequisiti
1. Account Google Play Developer ($25 USD una tantum)
2. Android Studio installato
3. Java JDK 11+

## Step 1: Genera il progetto TWA con Bubblewrap

```bash
npm install -g @nickvision/nickvision-cli
npx @nickvision/nickvision-cli init
# Oppure usa Bubblewrap:
npm i -g @nickvision/nickvision-cli
npx bubblewrap init --manifest=https://app.obranova.cl/manifest.webmanifest
```

## Step 2: Configurazione

Quando chiede i parametri:
- **Package name:** `cl.obranova.app`
- **App name:** `Obra Nova`
- **Launcher name:** `Obra Nova`
- **Display mode:** `standalone`
- **Status bar color:** `#1a365d`
- **Navigation bar color:** `#1a365d`
- **Start URL:** `https://app.obranova.cl/`
- **Host:** `app.obranova.cl`

## Step 3: Genera la signing key

```bash
keytool -genkey -v -keystore obranova-upload.keystore -alias obranova -keyalg RSA -keysize 2048 -validity 10000
```

## Step 4: Ottieni SHA256 fingerprint

```bash
keytool -list -v -keystore obranova-upload.keystore -alias obranova
```

Copia il SHA256 fingerprint e inseriscilo in `public/.well-known/assetlinks.json`
(sostituisci PLACEHOLDER_SHA256_FINGERPRINT)

## Step 5: Digital Asset Links

Il file `assetlinks.json` deve essere accessibile a:
`https://app.obranova.cl/.well-known/assetlinks.json`

Per Firebase Hosting, metti il file in: `public/.well-known/assetlinks.json`

E aggiungi in `firebase.json` dentro `hosting.headers`:
```json
{
  "source": "/.well-known/assetlinks.json",
  "headers": [
    { "key": "Content-Type", "value": "application/json" }
  ]
}
```

## Step 6: Build APK/AAB

```bash
npx bubblewrap build
```

Genera `app-release-signed.aab` nella cartella del progetto.

## Step 7: Upload su Play Console

1. Vai su play.google.com/console
2. Crea nuova app
3. Nome: "Obra Nova — Presupuestos de Construcción"
4. Categoria: Business / Productivity
5. Upload AAB in Production track
6. Compila listing: screenshots, descrizione, icone

## Descrizione Play Store (Español)

### Titolo
Obra Nova — Presupuestos de Construcción con IA

### Descripción corta
Software de presupuestos para constructores con IA, firma digital y renders fotorealísticos.

### Descripción completa
Obra Nova es el software #1 para constructores y maestros en Chile.

✅ Genera presupuestos profesionales en minutos
🤖 Nova AI crea partidas con precios reales del mercado chileno
🎨 Renders fotorealísticos de tus proyectos con IA
✍️ Firma digital — el cliente firma desde su celular
💳 Cobro integrado con MercadoPago y QR
📊 Control de márgenes, costos e imprevistos en tiempo real
🌐 Portal del cliente con avance de obra
📋 CRM, planificación Kanban y agenda integrados
⚡ /cotiza — responde al cliente en 30 segundos

Prueba 14 días gratis del plan Pro. Sin tarjeta de crédito.

Obra Nova SPA — app.obranova.cl

### Keywords
presupuesto construcción, cotización obra, software constructora, maestro obra chile, render AI construcción
