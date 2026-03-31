// ─── utils/logo.js ───────────────────────────────────────────────────────────
// Logo Obra Nova — SVG inline come data URI
// Versione: Marzo 2026 — monogramma ON + wordmark
// ─────────────────────────────────────────────────────────────────────────────

// Icona sola (32x32 — sidebar, favicon, watermark)
export const LOGO_ICON_SVG = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="8" width="50" height="84" rx="4" fill="#1a365d"/><rect x="16" y="24" width="22" height="48" rx="2" fill="white"/><polygon points="44,8 60,8 96,92 80,92" fill="#d69e2e"/><rect x="78" y="8" width="18" height="84" rx="3" fill="#d69e2e"/></svg>`;

// Icona invertita (per fondo scuro — sidebar)
export const LOGO_ICON_LIGHT_SVG = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="8" width="50" height="84" rx="4" fill="white" opacity="0.95"/><rect x="16" y="24" width="22" height="48" rx="2" fill="#1a365d"/><polygon points="44,8 60,8 96,92 80,92" fill="#d69e2e"/><rect x="78" y="8" width="18" height="84" rx="3" fill="#d69e2e"/></svg>`;

// Data URI per uso in <img src="">
export const LOGO_URL = "data:image/svg+xml," + encodeURIComponent(LOGO_ICON_SVG);
export const LOGO_LIGHT_URL = "data:image/svg+xml," + encodeURIComponent(LOGO_ICON_LIGHT_SVG);

// Logo completo con wordmark + tagline (per landing, PDF header, login)
export const LOGO_FULL_SVG = `<svg viewBox="0 0 460 100" xmlns="http://www.w3.org/2000/svg"><g><rect x="10" y="18" width="54" height="64" rx="3" fill="#1a365d"/><rect x="22" y="32" width="24" height="36" rx="2" fill="white"/><polygon points="48,18 64,18 96,82 80,82" fill="#d69e2e"/><rect x="80" y="18" width="18" height="64" rx="2" fill="#d69e2e"/></g><text x="120" y="59" font-family="Barlow Condensed,Segoe UI,system-ui,sans-serif" font-weight="900" font-size="46" fill="#1a365d" letter-spacing="-0.5">OBRA<tspan fill="#d69e2e">NOVA</tspan></text><text x="122" y="82" font-family="system-ui,sans-serif" font-weight="600" font-size="13" fill="#718096" letter-spacing="0.3">Presupuestos que cierran contratos</text></svg>`;
export const LOGO_FULL_URL = "data:image/svg+xml," + encodeURIComponent(LOGO_FULL_SVG);
