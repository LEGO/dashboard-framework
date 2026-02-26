import { createContext, useState } from 'react';

export const DashboardContext = createContext({
    dashboardName: '',
    features: {},
    dashboardDescription: '',
    metrics: [{ name: '', isSli: false, query: '', querySuccess: '', queryErrors: '' }],
    logs: {},
    errors: {},
});

export const CtxProvider = ({ children }) => {
  const [featuresData, setFormData] = useState({});
  const [formData, setFormData] = useState({});
  return (
    <DataContext.Provider value={{formData, setFormData}}>
      {children}
    </DataContext.Provider>
  );
};
