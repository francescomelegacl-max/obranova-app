// netlify/functions/ml-search.js
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
    const token = process.env.ML_ACCESS_TOKEN;
    if (!token) throw new Error("ML_ACCESS_TOKEN non configurato");

    let url = `https://api.mercadolibre.com/sites/${site}/search?q=${encodeURIComponent(q)}&limit=${limit}`;
    if (categoria) url += `&category=${categoria}`;

    const res = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      }
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`ML search error ${res.status}: ${errBody}`);
    }
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