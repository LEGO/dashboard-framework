import { useState } from 'react';

import { PanelBuilder, ConstantVariableBuilder, AdHocVariableBuilder, VariableHide } from '@grafana/grafana-foundation-sdk/dashboard';

import { usePersistentState } from '../lib/usePersistentState.ts';

export const FeatureID = "novus";
export const FeatureName = "Novus (Kubernetes)";

// Boilerplate library panel definitions for Novus.
// Replace UIDs with the actual library panel UIDs from your Grafana instance.
const NOVUS_LIBRARY_PANELS = [
  { name: "Novus Deployment timeline", uid: "cffw1fuyo9x4wb" },
  { name: "Novus CPU Usage", uid: "affw0w9ciuw3kf" },
  { name: "Novus Memory Usage", uid: "affw0vxt0u03kd" },
  { name: "Novus Policy Alerts", uid: "ffee6egctyio0e" },
];

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

  const genPanels = () => {
    return NOVUS_LIBRARY_PANELS.map((panel) =>
      new PanelBuilder()
        .title(panel.name)
        .height(8)
        .span(12)
        .libraryPanel({ name: panel.name, uid: panel.uid })
    );
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
    setDashboardPanels(FeatureID, [], genPanels(), genVariables());
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
