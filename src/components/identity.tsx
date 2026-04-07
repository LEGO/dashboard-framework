import { useAuth } from "react-oidc-context";
import { AuthProvider } from "react-oidc-context";
import { PrimeReactProvider } from "primereact/api";


const oidcConfig = {
  authority: "https://login.microsoftonline.com/1d063515-6cad-4195-9486-ea65df456faa",
  client_id: "3e0642f0-e0de-4a20-bf67-1f66d39863c0",
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

// Wrapper to add authentication to The LEGO Group SSO
export function LEGOAuthProvider({ children }) {
  return (
    <AuthProvider {...oidcConfig}>
      <PrimeReactProvider unstyled={true}>
        <div className="app">
          { children }
        </div>
      </PrimeReactProvider>
    </AuthProvider>
  )
}
