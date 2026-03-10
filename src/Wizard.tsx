import { Component as SLOFeatureComponent } from "./features/slo.tsx";

export function DashboardGenerator() {

  return (
    <div className="wizard-container">
      <div className="wizard-header">
        <h1>📊 Grafana Dashboard Wizard</h1>
        <p>Create your observability dashboard configuration</p>
      </div>

      <div className="wizard-content">
        <SLOFeatureComponent onPanelUpdate={console.log}/>
      </div>
    </div>
  );
}

