// Provides values from /api/env endpoint,
// useful for configuring parts without hardcoding values in the code.
// NOTE: Since /api/env is exposed, those are not for secrets, just for
// things that are not to be hard coded, so that the Dashboard Framework
// can be used by different companies/setup

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
