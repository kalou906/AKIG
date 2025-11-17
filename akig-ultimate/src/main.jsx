import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import "./i18n.js";
import { UIStoreProvider } from "./store/uiStore";
import { AuthProvider } from "./store/authStore";

ReactDOM.createRoot(document.getElementById("root")).render(
  <UIStoreProvider>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </UIStoreProvider>
);
