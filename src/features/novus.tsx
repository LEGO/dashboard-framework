import { useState } from 'react';

import {
  PanelBuilder,
  ConstantVariableBuilder,
  AdHocVariableBuilder,
  VariableHide,
  ThresholdsConfigBuilder,
  ThresholdsMode
} from '@grafana/grafana-foundation-sdk/dashboard';

import { DataqueryBuilder as PrometheusDataqueryBuilder } from '@grafana/grafana-foundation-sdk/prometheus';
import { PanelBuilder as StatsPanelBuilder } from '@grafana/grafana-foundation-sdk/stat';

import {
  PanelBuilder as TextPanelBuilder,
  TextMode
} from '@grafana/grafana-foundation-sdk/text';

import { usePersistentState } from '../lib/usePersistentState.ts';
import { TypeThresholdBuilder } from '@grafana/grafana-foundation-sdk/expr';

export const FeatureID = "novus";
export const FeatureName = "Novus Runtime Information";

// Boilerplate library panel definitions for Novus.
// Replace UIDs with the actual library panel UIDs from your Grafana instance.
const NOVUS_LIBRARY_PANELS = [
  { name: "Novus Deployment timeline", uid: "cffw1fuyo9x4wb" },
  { name: "Novus CPU Usage", uid: "affw0w9ciuw3kf" },
  { name: "Novus Memory Usage", uid: "affw0vxt0u03kd" },
  { name: "Novus Policy Alerts", uid: "ffee6egctyio0e" },
];

// A banner aded before every other panel to introduce people to that specific
// section.
const NOVUS_BANNER = new TextPanelBuilder()
  .title("")
  .transparent(true)
  .mode(TextMode.HTML)
  .span(24)
  .height(3)
  .content(`
    <div style="display: flex; height:100%; background: linear-gradient(135deg, #780000 0%, #003049 50%); color: white; border-radius: 12px; align-items: center; text-align: center;">
      <div style="width: 100%;">
        <h2 style="margin: 0; font-size: 2em; font-weight: 700;">
          <img src="https://raw.githubusercontent.com/kubernetes/kubernetes/refs/heads/master/logo/logo.svg" style="height: 1em; width: auto;" alt="Kubernetes Logo">
          Novus Telemetry
        </h2>
        <p style="margin: 0; font-size: 1em; opacity: 0.95;">
         Telemetry data for workloads running in Novus, Kubernetes Container Platform
        </p>
      </div>
    </div>
  `)


export function Component({ goBack, goForward, setDashboardPanels }) {
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = usePersistentState("feat_novus_formData", {
    runtime: "",
  });

  const genVariables = () => {
    const podFilter = new AdHocVariableBuilder("novus_pod_filter")
      .hide(VariableHide.HideVariable)
      .datasource({ uid: "$prometheus" })
      .build();
    podFilter.filters = [
      { key: "pod", operator: "!~", value: "novus-.*" },
    ];

    return [
      new ConstantVariableBuilder("namespace")
        .label("Novus Runtime / namespace")
        .value(formData.runtime),
      { build: () => podFilter },
    ];
  };

  const genOverviewPanels = () => {
    return [
      // Shows Pods Running
      new StatsPanelBuilder()
        .title("Novus: Pods Ready")
        .description(`
          Kubernetes Pods that are healthy, ready to work, and accept
          requests. If this number is correct, and the app has errors,
          then the issue does not involve with the container platform.
        `.replace(/\s+/g, ' ').trim())
        .height(4)
        .thresholds(new ThresholdsConfigBuilder().mode(ThresholdsMode.Absolute).steps([{value: 0.0, color: "green"}]))
        .interval("5m")
        .withTarget(
          new PrometheusDataqueryBuilder()
            .datasource({ uid: "$prometheus" })
            .expr(`sum(kube_pod_status_phase{phase="Running", namespace="$namespace"})`)
            .instant()
        ),
      // Shows Pods Pending, errors
      new StatsPanelBuilder()
        .title("Novus: Pods not Ready")
        .thresholds(new ThresholdsConfigBuilder().mode(ThresholdsMode.Absolute).steps([{value: 0.0, color: "red"}]))
        .description(`
          Kubernetes Pods that are either pending, with errors or uknown
          state. Might signal an upgrade or errors. If this number is not 0,
          and the app has errors, then the issue might involve container
          platform, or a botched released! Oppsie!
        `.replace(/\s+/g, ' ').trim())
        .height(4)
        .interval("5m")
        .withTarget(
          new PrometheusDataqueryBuilder()
            .datasource({ uid: "$prometheus" })
            .expr(`sum(kube_pod_status_phase{phase=~"(Failed|Uknown|Pending)", namespace="$namespace"})`)
            .instant()
          )
      ];
  };

  const genPanels = () => {
    return [NOVUS_BANNER].concat(NOVUS_LIBRARY_PANELS.map((panel) =>
      new PanelBuilder()
        .title(panel.name)
        .height(8)
        .span(12)
        .libraryPanel({ name: panel.name, uid: panel.uid })
    ));
  };

  const validate = () => {
    const newErrors = {};
    if (formData.runtime.trim().length === 0) {
      newErrors.runtime = "A runtime name is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = () => {
    if (!validate()) return;
    setDashboardPanels(FeatureID, genOverviewPanels(), genPanels(), genVariables());
    goForward();
  };

  return (
    <>
      <div className="wizard-content">
        <h3 style={{ marginBottom: '20px', color: '#1e293b' }}>Novus Configuration</h3>
        <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '14px' }}>
          Novus is our internal Kubernetes platform. This feature adds pre-built
          library panels scoped to your runtime.
        </p>

        <div className="form-group">
          <label className="form-label">Runtime *</label>
          <input
            type="text"
            className={`form-input ${errors.runtime ? 'error' : ''}`}
            placeholder="e.g., super-service-bll-prod"
            value={formData.runtime}
            onChange={(e) => setFormData({ ...formData, runtime: e.target.value })}
          />
          {errors.runtime && <div className="form-error">⚠️ {errors.runtime}</div>}
          <div className="form-hint">
            The Novus runtime name used to scope the dashboard panels.
          </div>
        </div>
      </div>

      <div className="wizard-footer">
        {goBack && (
          <button className="btn btn-secondary" onClick={goBack}>
            ← Previous
          </button>
        )}
        {goForward && (
          <button className="btn btn-primary" onClick={onSubmit}>
            Next →
          </button>
        )}
      </div>
    </>
  );
}
