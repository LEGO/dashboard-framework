import { createContext, useContext, useEffect, useState } from 'react';

type EnvConfig = Record<string, string>;

const EnvContext = createContext(null);

export function useEnv() {
  return useContext(EnvContext);
}

export function EnvProvider({ children }) {
  const [env, setEnv] = useState<EnvConfig | null>(null);

  useEffect(() => {
    fetch('/api/env')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch /api/env');
        return res.json();
      })
      .then(setEnv)
      .catch(err => console.error('Error loading env config:', err));
  }, []);

  if (!env) {
    return <div>Loading...</div>;
  }

  return (
    <EnvContext.Provider value={env}>
      {children}
    </EnvContext.Provider>
  );
}
