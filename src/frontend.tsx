import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DashboardGenerator } from "./Wizard.tsx";
import { LEGOAuthProvider } from "./components/identity.tsx"
// import "primereact/resources/themes/lara-light-cyan/theme.css";

import "./index.css";

const elem = document.getElementById("root")!;
const app = (
  <StrictMode>
    <LEGOAuthProvider>
      <div className="app">
        <DashboardGenerator />
      </div>
    </LEGOAuthProvider>
  </StrictMode>
);

if (import.meta.hot) {
  const root = (import.meta.hot.data.root ??= createRoot(elem));
  root.render(app);
} else {
  createRoot(elem).render(app);
}
