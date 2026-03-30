import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DashboardGenerator } from "./Wizard.tsx";
import { AuthProvider } from "react-oidc-context";
import { PrimeReactProvider, PrimeReactContext } from "primereact/api";

// import "primereact/resources/themes/lara-light-cyan/theme.css";

import "./index.css";

const oidcConfig = {
  authority:
    "https://login.microsoftonline.com/1d063515-6cad-4195-9486-ea65df456faa",
  client_id: "3e0642f0-e0de-4a20-bf67-1f66d39863c0",
  redirect_uri: window.location.origin,
  response_type: "code",
  scope: "openid profile email",
  onSigninCallback: (_user: User | void): void => {
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};

const elem = document.getElementById("root")!;
const app = (
  <StrictMode>
    <AuthProvider {...oidcConfig}>
      <PrimeReactProvider unstyled={true}>
        <div className="app">
          <DashboardGenerator />
        </div>
      </PrimeReactProvider>
    </AuthProvider>
  </StrictMode>
);

if (import.meta.hot) {
  const root = (import.meta.hot.data.root ??= createRoot(elem));
  root.render(app);
} else {
  createRoot(elem).render(app);
}
