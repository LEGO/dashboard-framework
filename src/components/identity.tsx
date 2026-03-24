import { useAuth } from "react-oidc-context";

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
