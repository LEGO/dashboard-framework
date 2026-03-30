import { useState } from "react";
import { useAuth } from "react-oidc-context";

import { usePersistentState } from "./lib/usePersistentState.ts";

import IdentityComponent from "./components/identity.tsx";
import IntroComponent from "./components/intro.tsx";
import InfoComponent from "./components/info.tsx";
import FeaturesComponent from "./components/features.tsx";
import OutputComponent from "./components/output.tsx";

import * as FeatureSLO from "./features/slo.tsx";
import * as FeatureLogs from "./features/logs.tsx";
import * as FeatureMetrics from "./features/metrics.tsx";
import * as FeatureNovus from "./features/novus.tsx";
import * as FeatureEdge from "./features/edge.tsx";

// Hard coded list of features that the users can tunr on/off
const FEATURES = [
  FeatureNovus,
  FeatureSLO,
  FeatureMetrics,
  FeatureLogs,
  FeatureEdge,
];

const DEFAULT_STEPS = [
  IntroComponent,
  InfoComponent,
  FeaturesComponent,
];

const DEFAULT_DASHBOARD_DATA = {
  name: "",
  description: "",
  features: FEATURES.map((feat) => ({
      enabled: false,
      id: feat.FeatureID,
      name: feat.FeatureName,
      component: feat.Component,
      overviewPanels: [],
      panels: [],
      variables: [],
    }))
};


export function DashboardGenerator() {
  const [stepIndx, setStepIndx] = useState(0);
  const [dashboardData, setDashboardData] = useState(DEFAULT_DASHBOARD_DATA);

  const steps = DEFAULT_STEPS.concat(
    dashboardData.features
      .filter((feat) => feat.enabled)
      .map((feat) => feat.component)
  ).filter((step) => step !== undefined);

  const goForward = () => {
    let next = stepIndx+1;
    if(next > steps.length) {
      next = 0;
    };
    setStepIndx(next)
  };

  const goBack = () => {
    let prev = stepIndx-1;
    if(prev < 0) prev  = 0;
    setStepIndx(prev)
  };

  const setDashboardPanels = (featId, newOverviewPanels, newPanels, newVariables = []) => {
    let newFeatures = dashboardData.features.map((feat, i) => {
      if (feat.id == featId) {
        return {...dashboardData.features[i], panels: newPanels, overviewPanels: newOverviewPanels, variables: newVariables}
      }
      return feat
    });
    setDashboardData({...dashboardData, features: newFeatures});
  }

  const getCurrentComponent = () => {
    let Component = null;
    // If it is the last step
    if (stepIndx == steps.length) {
      Component = OutputComponent;
    } else {
      Component = steps[stepIndx];
    }
    return <Component
      dashboardData={dashboardData}
      setDashboardData={setDashboardData}
      setDashboardPanels={setDashboardPanels}

      goForward={stepIndx == steps.length ? null : goForward}
      goBack={stepIndx == 0 ? null : goBack}
    />
  }

  return (
    <div className="wizard-container">
      <IdentityComponent />
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

