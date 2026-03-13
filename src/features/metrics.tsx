import {
  ThresholdsConfigBuilder,
  ThresholdsMode,
} from '@grafana/grafana-foundation-sdk/dashboard';

import { DataqueryBuilder as PrometheusDataqueryBuilder } from '@grafana/grafana-foundation-sdk/prometheus';
import { PanelBuilder as StatusHistoryPanelBuilder } from '@grafana/grafana-foundation-sdk/statushistory';
import { AxisPlacement, VizLegendOptionsBuilder } from '@grafana/grafana-foundation-sdk/common';

import { useState } from 'react';

import { usePersistentState } from '../lib/usePersistentState.ts';

export const FeatureID = "metrics";
export const FeatureName = "Custom Metrics";

export function Component({ goBack, goForward, setDashboardPanels }){
  const [errors, setErrors] = useState({});

  const [metrics, setMetrics] = usePersistentState("feat_metrics_metrics", []);


  const genPanels = () => {
    const panelSpan = 24 / metrics.length
    return metrics.map(
      (metric) => new TimeSeriesPanelBuilder()
          .title(metric.name)
          .height(8)
          .span(panelSpan)
          .legend(new VizLegendOptionsBuilder().isVisible(false))
          .withTarget(
            new PrometheusDataqueryBuilder()
              .datasource({ uid: "$prometheus" })
              .expr(metric.query)
          )
        );
  };

  const validate = () => {
    const newErrors = {};
    metrics.forEach((metric, idx) => {
      if (metric.name.length == 0) {
        newErrors[`metric_${idx}_name`] =  "The name is missing"
      }
      if (metric.query.length == 0) {
        newErrors[`metric_${idx}_query`] =  "The promql query is missing"
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0
  }

  const onSubmit = () => {
    if (!validate()) return;
    setDashboardPanels(FeatureID, genPanels());
    goForward();
  }

  const removeMetric = (idx) => setMetrics(metrics.filter((_, i) => i !== idx));
  const addMetric = () => setMetrics([...metrics, { name: '', query: ''}])
  const updateMetric = (idx, field, value) => {
    let newMetrics = [...metrics]
    newMetrics[idx] = {...metrics[idx], [field]: value };
    setMetrics(newMetrics);
  };

  return (
    <>
      <div className="wizard-content">
        <h3 style={{ marginBottom: 'var(--spacing-md)', color: '#1e293b' }}>Custom Metrics</h3>
        <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '14px' }}>
          Metrics can be more than latency, CPU/Memory usage, and uptime: you
          can use custom metrics to understand at a glance what is the status of
          you application. &nbsp;
          <i>
            What are the most important metrics that will help you know if something is wrong?
          </i>
        </p>
        <p style={{ color: '#64748b', marginBottom: 'var(--spacing-md)', fontSize: '13px', fontStyle: 'italic' }}>
          Add Custom Metrics: Pick the most important ones!
        </p>

        {metrics && metrics.map((metric, idx) => (
          <div key={idx} className="metric-card">
            <div className="metric-header">
              {metrics.length > 1 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '4px 12px', fontSize: '12px' }}
                  onClick={() => removeMetric(idx)}
                >
                  Remove
                </button>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">What is this measuring? *</label>
              <input
                type="text"
                className={`form-input ${errors[`metric_${idx}_name`] ? 'error' : ''}`}
                placeholder="e.g., Checkout Orders Status, Server Requests latency, Error Rate, CPU Usage..."
                value={metric.name}
                onChange={(e) => updateMetric(idx, 'name', e.target.value)}
              />
              {errors[`metric_${idx}_name`] && <div className="form-error">⚠️ {errors[`metric_${idx}_name`]}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">PromQL Query *</label>
              <textarea
                className={`form-textarea ${errors[`metric_${idx}_query`] ? 'error' : ''}`}
                placeholder="e.g., sum(rate(metric_name[5m]))"
                value={metric.query}
                onChange={(e) => updateMetric(idx, 'query', e.target.value)}
                style={{ minHeight: '70px' }}
              />
              {errors[`metric_${idx}_query`] && <div className="form-error">⚠️ {errors[`metric_${idx}_query`]}</div>}
            </div>
          </div>
        ))}

        <button
          type="button"
          className="btn btn-secondary"
          onClick={addMetric}
          style={{ width: '100%' }}
        >
          + Add Metric
        </button>
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
};
