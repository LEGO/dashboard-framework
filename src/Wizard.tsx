import{ useState } from 'react';

import { Component as InfoComponent } from "./components/info.tsx";
import * as FeatureSLO from "./features/slo.tsx";
// import * as FeatureNovus from "./features/novus.tsx";
// import * as FeatureLogs from "./features/logs.tsx";
// import * as FeatureCustomMetrics from "./features/custom_metrics.tsx";

const enabledFeatures = [
  FeatureSLO,
];

export function DashboardGenerator() {
  const [step, setStep] = useState(0);

  const [dashboardData, setDashboardData] = useState({
    name: "",
    description: "",
    features: {},
    panels: [],
  });

  enabledFeatures.forEach(
    feat => {
      if(dashboardData.features[feat.FeatureID] === undefined) {
        let newFeatureSetup = {...dashboardData.features}
        newFeatureSetup[feat.FeatureID] = {enabled: false, name: feat.Name};
        setDashboardData({...dashboardData, features: newFeatureSetup});
      }
    }
  )

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
  console.log(dashboardData);

  const getCurrentComponent = () => {
    switch(step) {
      case 0:
        return <InfoComponent dashboardData={dashboardData} setDashboardData={setDashboardData} goForward={goForward} />
      case 1:
        return <FeatureSLO.Component dashboardData={dashboardData} setDashboardData={setDashboardData} goBack={goBack} goForward={goForward} />
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

