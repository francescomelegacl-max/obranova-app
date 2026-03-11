import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import * as Sentry from "@sentry/react"  // ← DISABILITATO: causa TDZ crash con Vite 5
import './index.css'
import App from './App.jsx'

// Sentry.init({
//   dsn: "https://c955b29398ba7790f3ec0e62d59ecad1@o4511015101333504.ingest.sentry.io/4511015103692800",
//   environment: import.meta.env.MODE,
//   tracesSampleRate: 0.2,
// });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
