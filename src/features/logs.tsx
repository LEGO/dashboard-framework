import { useState } from 'react';

import { DataqueryBuilder as LokiDataqueryBuilder } from '@grafana/grafana-foundation-sdk/loki';
import { PanelBuilder as LogsPanelBuilder } from '@grafana/grafana-foundation-sdk/logs';
import { LogsDedupStrategy } from '@grafana/grafana-foundation-sdk/common';
import { PanelBuilder as StatsPanelBuilder } from '@grafana/grafana-foundation-sdk/stat';
import { BigValueGraphMode } from '@grafana/grafana-foundation-sdk/common';

import {
  PanelBuilder as TextPanelBuilder,
  TextMode
} from '@grafana/grafana-foundation-sdk/text';

import { usePersistentState } from '../lib/usePersistentState.ts';

export const FeatureID = "logs";
export const FeatureName = "Logs";

export function Component({ goBack, goForward, setDashboardPanels }){
  const [errors, setErrors] = useState({
    service_name: "",
  });

  const [formData, setFormData] = usePersistentState("feat_logs_formData", {
    service_name: "",
    is_json: false,
  });

  const genOverviewPanels = () => {
    return [new StatsPanelBuilder()
      .title("Log Errors: " + formData.service_name)
      .height(4)
      .interval("1m")
      .graphMode(BigValueGraphMode.Line)
      .withTarget(
        new LokiDataqueryBuilder()
          .datasource({ uid: "$loki" })
          .expr(`sum(count_over_time({service_name="${formData.service_name}"} | json | __error__!="JSONParserErr" | detected_level="error" [$__auto] ))`)
          .instant(true)
        )
      ];
  };

  const genPanels = () => {
    return [
      new TextPanelBuilder()
      .title("")
      .transparent(true)
      .mode(TextMode.HTML)
      .span(24)
      .height(2)
      .content(`
        <div style="height:100%; background: linear-gradient(135deg, #780000 0%, #003049 50%); color: white; padding: 10px 35px; border-radius: 12px; text-align: center;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 10px;">
            <h2 style="margin: 0; font-size: 2em; font-weight: 700;">🪵 Logs</h2>
          </div>
        </div>
      `),
      new LogsPanelBuilder()
        .title("")
        .transparent(true)
        .height(12)
        .span(24)
        .enableInfiniteScrolling(true)
        .showTime(true)
        .enableLogDetails(true)
        .prettifyLogMessage(true)
        .wrapLogMessage(false)
        .dedupStrategy(LogsDedupStrategy.Exact)
        .withTarget(
          new LokiDataqueryBuilder()
            .datasource({ uid: "$loki" })
            .expr(`{service_name="${formData.service_name}"}`)
        )
    ]
  };

  const validate = () => {
    const newErrors = {};
    if (formData.service_name.length == 0) {
      newErrors.service_name = 'You need a service_name to get the logs from your application';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0
  }

  const onSubmit = () => {
    if (!validate()) return;
    setDashboardPanels(FeatureID, genOverviewPanels(), genPanels());
    goForward();
  }

  return (
    <>
      <div className="wizard-content">
        <h3 style={{ marginBottom: '20px', color: '#1e293b' }}>Logs Configuration</h3>

        <div className="form-group">
          <label className="form-label">Service Name *</label>
          <input
            type="text"
            className={`form-input ${errors.service_name ? 'error' : ''}`}
            placeholder="e.g., api-server, frontend-app"
            value={formData.service_name}
            onChange={(e) => setFormData({...formData, service_name: e.target.value})}
          />
          {errors.service_name && <div className="form-error">⚠️ {errors.service_name}</div>}
          <div className="form-hint">This will be used to fill the <code>service_name</code> label/attribute</div>
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', cursor: 'pointer' }}>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={formData.is_json}
                onChange={(e) => setFormData({...formData, is_json: !formData.is_json})}
              />
              <span className="toggle-slider"></span>
            </div>
            <span style={{ fontWeight: '500' }}>JSON Formatted Logs</span>
          </label>
          <div className="form-hint">Enable if your logs are structured as JSON</div>
        </div>
      </div>

      <div className="wizard-footer">
        {goBack && <button className="btn btn-secondary" onClick={goBack}>
          ← Previous
        </button>}
        {goForward && <button className="btn btn-primary" onClick={onSubmit}>
          Next →
        </button>}
      </div>
    </>
  );
}
