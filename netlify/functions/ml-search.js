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
    let url = `https://api.mercadolibre.com/sites/${site}/search?q=${encodeURIComponent(q)}&limit=${limit}&condition=new`;
    if (categoria) url += `&category=${categoria}`;

    const res  = await fetch(url);
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