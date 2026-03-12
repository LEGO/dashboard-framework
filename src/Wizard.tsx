import{ useState } from 'react';

import IntroComponent from "./components/intro.tsx";
import InfoComponent from "./components/info.tsx";
import FeaturesComponent from "./components/features.tsx";
import * as FeatureSLO from "./features/slo.tsx";
// import * as FeatureNovus from "./features/novus.tsx";
// import * as FeatureLogs from "./features/logs.tsx";
// import * as FeatureCustomMetrics from "./features/custom_metrics.tsx";

// Hard coded list of features that the users can tunr on/off
const FEATURES = [
  FeatureSLO,
];

const DEFAULT_STEPS = [
  IntroComponent,
  InfoComponent,
  FeaturesComponent,
];

export function DashboardGenerator() {
  const [stepIndx, setStepIndx] = useState(0);
  const [steps, setSteps] = useState(DEFAULT_STEPS);

  const [dashboardData, setDashboardData] = useState({
    name: "",
    description: "",
    features: {},
  });

  let newSteps = DEFAULT_STEPS;
  FEATURES.forEach(
    feat => {
      // pre-populate the features based
      if(!(feat.FeatureID in dashboardData.features)) {
        let newFeatureSetup = {...dashboardData.features}
        newFeatureSetup[feat.FeatureID] = {
          enabled: false,
          name: feat.FeatureName,
          panels: [],
        };
        setDashboardData({...dashboardData, features: newFeatureSetup});
      } else {
        // If a feature was added, append the component
        if(dashboardData.features[feat.FeatureID].enabled) {
          newSteps.push(feat.Component);
        }
      }
    }
  )

  // Update only if it has changed... meh, there might be a better way
  if(steps != newSteps){
    setSteps(newSteps)
  }

  const goForward = () => {
    let next = stepIndx+1;
    if(next > steps.length) next = 0;
    setStepIndx(next)
  };

  const goBack = () => {
    let prev = stepIndx-1;
    if(prev < 0) prev  = 0;
    setStepIndx(prev)
  };

  const setPanels = (featId, newPanels) => {
    let newFeatures = dashboardData.features;
    newFeatures[featId] = {...dashboardData.features[featId], panels: newPanels};
    setDashboardData({...dashboardData, features: newFeatures});
  }

  console.log("step", stepIndx);
  console.log("features", dashboardData.features);

  const getCurrentComponent = () => {
    let Component = steps[stepIndx];
    return <Component
      dashboardData={dashboardData}
      setDashboardData={setDashboardData}
      setPanels={setPanels}
      goForward={stepIndx == steps.length ? null : goForward}
      goBack={stepIndx == 0 ? null : goBack}
    />
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

