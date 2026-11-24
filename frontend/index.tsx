// =============================================================================
// LexPortal Frontend - Główny Plik Wejściowy (Entrypoint)
// =============================================================================
//
// Ten plik jest punktem startowym dla całej aplikacji frontendowej React.
// Jego głównym zadaniem jest "zamontowanie" głównego komponentu <App />
// w drzewie DOM.
//
// Kluczowe Funkcje:
//   - Inicjalizuje korzeń aplikacji React (`createRoot`).
//   - Obejmuje całą aplikację w `<AuthProvider>`, dostarczając globalny
//     kontekst uwierzytelniania do wszystkich komponentów.
//   - Włącza `StrictMode` Reacta, który pomaga wykrywać potencjalne problemy
//     w aplikacji podczas developmentu.
//   - Importuje główny arkusz stylów (`index.css`).
//
// =============================================================================
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { reportWebVitals } from "./utils/vitals";


const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Failed to find the root element");
}

reportWebVitals();

createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
