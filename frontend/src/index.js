/**
 * ============================================================
 * index.js - Point d'entrée avec polyfills universels
 * Garantit compatibilité sur tous les navigateurs
 * ============================================================
 */

// Polyfills universels (chargés AVANT tout le reste)
import "core-js/stable"; // Promise, Array.includes, Object.entries, etc.
import "regenerator-runtime/runtime"; // async/await universel
import "whatwg-fetch"; // fetch API universel (fallback XHR)

// Normalize CSS - uniformise le rendu entre navigateurs
import "normalize.css";

// Notre CSS global
import "./index.css";

// React
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Détection des capacités du navigateur (graceful degradation)
if (!window.Promise) {
  console.warn("⚠️ Promise non supporté - polyfill core-js appliqué");
}

if (!window.fetch) {
  console.warn("⚠️ Fetch non supporté - polyfill whatwg-fetch appliqué");
}

// Support Intl (dates, nombres, devises multi-langue)
// Intl est supporté nativement dans tous les navigateurs modernes
// if (!window.Intl) {
//   import("intl").then(() => {
//     import("intl/locale-data/jsonp/fr"); // pour France
//   });
// }

// Initialiser React 18
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Service worker (optionnel - pour PWA)
if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch((err) => {
      console.warn("Service Worker registration failed:", err);
    });
  });
}
