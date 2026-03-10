import{ useState } from 'react';

import { Component as InfoComponent } from "./components/info.tsx";
import * as FeatureSLO from "./features/slo.tsx";


export function DashboardGenerator() {
  const [step, setStep] = useState(0);

  const [dashboardData, setDashboardData] = useState({
    name: "",
    description: "",
    features: [],
    panels: [],
  });

  const goForward = () => {
    let next = step+1;
    if(next > 1)  next = 1;
    setStep(next )
  };

  const goBack = () => {
    let prev = step-1;
    if(prev < 0)  prev  = 0;

    setStep(prev)
  };

  const getCurrentComponent = () => {
    switch(step) {
      case 0:
        return <InfoComponent giveData={console.log} goForward={goForward} />
      case 1:
        return <FeatureSLO.Component goBack={goBack} goForward={goForward} />
    }
  }

  return (
    <div className="wizard-container">
      <div className="wizard-header">
        <h1>📊 Grafana Dashboard Wizard</h1>
        <p>Create your observability dashboard configuration</p>
      </div>
      <div className="wizard-content">
        {getCurrentComponent()}
      </div>
    </div>
  );
}

