import moment from 'moment';
import { useState } from 'react';

import {
  ThresholdsConfigBuilder,
  ThresholdsMode,
} from '@grafana/grafana-foundation-sdk/dashboard';

import { DataqueryBuilder as PrometheusDataqueryBuilder } from '@grafana/grafana-foundation-sdk/prometheus';
import { PanelBuilder as StatusHistoryPanelBuilder } from '@grafana/grafana-foundation-sdk/statushistory';
import { AxisPlacement, VizLegendOptionsBuilder } from '@grafana/grafana-foundation-sdk/common';


export const FeatureID = "slo";
export const FeatureName = "Service Level Objective";


export function Component({ goBack, goForward, onPanelUpdate }:{ onSubmit:Function }){
  const [errors, setErrors] = useState({
    target: "",
  });

  const [formData, setFormData] = useState({
    enabled: false,
    metrics: [],
    target: 99.5,
  });

  const genPanels = () => {
    const panelSpan = 24 / formData.metrics.length
    return formData.metrics.map(
      (metric) => new StatusHistoryPanelBuilder()
        .title(metric.name)
        .height(8)
        .span(panelSpan)
        .interval("1h")
        .thresholds(
          new ThresholdsConfigBuilder()
            .mode(ThresholdsMode.Percentage)
            .steps([
              { value: (formData.target / 100), color: "red" },
              { value: ((formData.target / 100) + 1) / 2, color: "orange" },
              { value: 1, color: "green" },
            ])
        )
        .legend(new VizLegendOptionsBuilder().isVisible(false))
        .axisPlacement(AxisPlacement.Hidden)
        .unit("percentunit")
        .withTarget(
          new PrometheusDataqueryBuilder()
            .datasource({ uid: "$prometheus" })
            .expr(`(${metric.querySuccess})/((${metric.queryErrors})+(${metric.querySuccess}))`)
          )
        );
  };
  
  const calculateDowntime = ( percentage, period ) => {
    if(percentage === 100) return "impossible! 😅";
    const downtimePercentage = (100 - percentage);

    let hours = 0;
    if (period === 'year') hours = 365 * 24;
    else if (period === 'month') hours = 30 * 24;
    else hours = 7 * 24;

    const downtimeHours = (hours * downtimePercentage) / 100;
    return moment.duration(downtimeHours, "hours").humanize(false);
  };

  const validate = () => {
    const newErrors = {};
    if (formData.enabled && (formData.target <= 0 || formData.target > 100)) {
      newErrors.target = 'SLI target must be between 0 and 100';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0
  }

  const onSubmit = () => {
    if (!validate()) return

    onPanelUpdate(genPanels());
    goForward();
  }

  return (
    <>
      <div className="wizard-content">
        <h3 style={{marginBottom: '20px', color: '#1e293b'}}>Service Level Objective</h3>
        <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '14px' }}>
          Service Level Objectives (SLO) are useful in many different ways. They
          can be used to calculate alerts, health of services to users, prioritize
          stability vs features, and more! If you are not interested into Site
          Reliability Engineering you can disable this feature.
        </p>

        <div className="form-group">
          <label className="form-label">SLO / Availability Target *</label>
          <input
            type="number"
            className={`form-input ${errors.target ? 'error' : ''}`}
            placeholder="e.g. 99.9"
            step="0.001"
            min="0"
            max="100"
            value={formData.target}
            onChange={(e) => setFormData({...formData, target: parseFloat(e.target.value)})}
          />
          {errors.target && <div className="form-error">⚠️ {errors.target}</div>}
          <div className="form-hint">Enter your target availability percentage (e.g., 99.9 for three nines)</div>
        </div>

        {formData.target && !isNaN(formData.target) && formData.target > 0 && formData.target <= 100 && (
          <div className="calculation-box">
            <div style={{marginBottom: 'var(--spacing-md)', fontWeight: '600', color: 'var(--color-text-primary)'}}>
              Your Error Budget with {formData.target}% availability:
            </div>
            <div style={{marginBottom: 'var(--spacing-md)', fontSize: '13px', color: 'var(--color-text-secondary)', fontStyle: 'italic'}}>
              This shows you the maximum amount of time when your service is unavailable, before it disrupts
              the user experience/expectations. For example: How much time can my application be down before a user
              really complains about the it?
            </div>
            <div className="calculation-item">
              <span className="calculation-label">Unavailability allowed in a Year:</span>
              <span className="calculation-value">{calculateDowntime(formData.target, 'year')}</span>
            </div>
            <div className="calculation-item">
              <span className="calculation-label">Unavailability allowed in a Month:</span>
              <span className="calculation-value">{calculateDowntime(formData.target, 'month')}</span>
            </div>
            <div className="calculation-item">
              <span className="calculation-label">Unavailability allowed in a Week:</span>
              <span className="calculation-value">{calculateDowntime(formData.target, 'week')}</span>
            </div>
          </div>
        )}
      </div>

      <div className="wizard-footer">
        <button className="btn btn-secondary" onClick={goBack}>
          ← Previous
        </button>
        <button className="btn btn-primary" onClick={onSubmit}>
          Next →
        </button>
      </div>
    </>
  );
};


