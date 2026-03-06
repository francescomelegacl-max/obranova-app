// netlify/functions/ml-search.js
// ─────────────────────────────────────────────────────────────────────────────
// Proxy sicuro per MercadoLibre — le credenziali restano sul server.
// Variabili d'ambiente da impostare in Netlify:
//   ML_CLIENT_ID     = 3180239405551745
//   ML_CLIENT_SECRET = iKTZwOH3JqzKJzbTzAO9nmiR6dkzSXZA
// ─────────────────────────────────────────────────────────────────────────────

let cachedToken = null;
let tokenExpiry  = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const res = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type:    "client_credentials",
      client_id:     process.env.ML_CLIENT_ID,
      client_secret: process.env.ML_CLIENT_SECRET,
    }),
  });

  if (!res.ok) throw new Error(`Token error ${res.status}`);
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry  = Date.now() + (data.expires_in - 60) * 1000; // 1 min di margine
  return cachedToken;
}

export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };
  if (event.httpMethod !== "GET")     return { statusCode: 405, headers, body: "Method not allowed" };

  const { q, categoria, limit = "12", site = "MLC" } = event.queryStringParameters || {};
  if (!q) return { statusCode: 400, headers, body: JSON.stringify({ error: "Parametro q richiesto" }) };

  try {
    const token = await getAccessToken();
    let url = `https://api.mercadolibre.com/sites/${site}/search?q=${encodeURIComponent(q)}&limit=${limit}&condition=new`;
    if (categoria) url += `&category=${categoria}`;

    const res  = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`ML search error ${res.status}`);
    const data = await res.json();

    return {
      statusCode: 200,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        results: (data.results || []).map(r => ({
          id:          r.id,
          titulo:      r.title,
          precio:      r.price,
          moneda:      r.currency_id,
          vendedor:    r.seller?.nickname || "—",
          thumbnail:   r.thumbnail,
          link:        r.permalink,
          disponibili: r.available_quantity,
          envioGratis: r.shipping?.free_shipping,
        })),
      }),
    };
  } catch (e) {
    console.error("ml-search error:", e);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: e.message }),
    };
  }
};
