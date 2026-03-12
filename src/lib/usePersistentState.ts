// From: https://dev.to/hexshift/how-to-persist-react-component-state-across-page-reloads-with-zero-external-libraries-3gdm
import { useState, useEffect } from "react";

export function usePersistentState(key:string, defaultValue:any) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored !== null ? JSON.parse(stored) : defaultValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
