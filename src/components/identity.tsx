import { useAuth } from "react-oidc-context";
import { AuthProvider } from "react-oidc-context";
import { PrimeReactProvider } from "primereact/api";

import { useEnv } from './env.tsx';

const DEFAULT_OIDC_DATA = {
  authority: "", // Loaded from env variable BUN_PUBLIC_ODIC_AUTHORITY
  client_id: "", // Loaded from env variable BUN_PUBLIC_ODIC_CLIENT_ID

  redirect_uri: window.location.origin,
  response_type: "code",
  scope: "openid profile email",
  onSigninCallback: (_user: User | void): void => {
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};


// Provides identity features to other components
export default function IdentityComponent() {
  const auth = useAuth();

  switch (auth.activeNavigator) {
    case "signinSilent":
      return <div>Signing you in...</div>;
    case "signoutRedirect":
      return <div>Signing you out...</div>;
  }

  if (auth.isLoading) {
    return <div className="identity-container">Loading...</div>;
  }

  if (auth.error) {
    return (
      <div className="identity-container error">
        <div className="error">
          Oops... {auth.error.source} caused {auth.error.message}
        </div>
      </div>
    );
  }

  if (auth.isAuthenticated) {
    return (
      <div className="identity-container">
        <button onClick={() => void auth.removeUser()}>Log out</button>
        <p>Hello {auth.user?.profile.given_name}</p>
      </div>
    );
  }

  return (
    <div className="identity-container">
      <button onClick={() => void auth.signinRedirect()}>Log in</button>
    </div>
  );
 }

// Wrapper to add authentication to allow OIDC
export function OIDCAuthProvider({ children }) {
  const env = useEnv();

  const authority = env?.["BUN_PUBLIC_OIDC_AUTHORITY"];
  const client_id = env?.["BUN_PUBLIC_ODIC_CLIENT_ID"];
  const oidcEnabled = authority && client_id;

  if (!oidcEnabled) {
    return (
      <PrimeReactProvider unstyled={true}>
        <div className="app">{ children }</div>
      </PrimeReactProvider>
    );
  }

  return (
    <AuthProvider {...DEFAULT_OIDC_DATA} authority={authority} client_id={client_id}>
      <PrimeReactProvider unstyled={true}>
        <div className="app">
          <IdentityComponent />
          { children }
        </div>
      </PrimeReactProvider>
    </AuthProvider>
  )
}
