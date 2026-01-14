export function Step3Metrics({ formData, updateField, errors, addMetric, removeMetric, updateMetric }) {
  return (
    <div>
      <h3 style={{ marginBottom: 'var(--spacing-md)', color: '#1e293b' }}>Key Metrics</h3>
      <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '14px' }}>
        Metrics can be more than latency, CPU/Memory usage, and uptime: you
        can use custom metrics to understand at a glance what is the status of
        you application. &nbsp;
        <i>
          What are the most important metrics that will help you know if something is wrong?
        </i>
      </p>
      <p style={{ color: '#64748b', marginBottom: 'var(--spacing-md)', fontSize: '13px', fontStyle: 'italic' }}>
        Add up to 3 metrics: Pick the most important ones!
      </p>

      {formData.metrics && formData.metrics.map((metric, idx) => (
        <div key={idx} className="metric-card">
          <div className="metric-header">
            {formData.metrics.length > 1 && (
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

          {formData.sreEnabled && (
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', cursor: 'pointer' }}>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={metric.isSli}
                    onChange={(e) => updateMetric(idx, 'isSli', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </div>
                <span style={{ fontWeight: '500' }}>Calculate SLO Percentage</span>
              </label>
            </div>
          )}

          {metric.isSli && formData.sreEnabled ? (
            <>
              <div className="form-group">
                <label className="form-label">Query for Successful metric*</label>
                <textarea
                  className={`form-textarea ${errors[`metric_${idx}_querySuccess`] ? 'error' : ''}`}
                  placeholder="e.g., sum(rate(checkout_orders_successful_total[5m]))"
                  value={metric.querySuccess}
                  onChange={(e) => updateMetric(idx, 'querySuccess', e.target.value)}
                  style={{ minHeight: '70px' }}
                />
                {errors[`metric_${idx}_querySuccess`] && <div className="form-error">⚠️ {errors[`metric_${idx}_querySuccess`]}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Query for Failed metric*</label>
                <textarea
                  className={`form-textarea ${errors[`metric_${idx}_queryErrors`] ? 'error' : ''}`}
                  placeholder="e.g., sum(rate(checkout_orders_failed_total{status=~'5..'}[5m]))"
                  value={metric.queryErrors}
                  onChange={(e) => updateMetric(idx, 'queryErrors', e.target.value)}
                  style={{ minHeight: '70px' }}
                />
                {errors[`metric_${idx}_queryErrors`] && <div className="form-error">⚠️ {errors[`metric_${idx}_queryErrors`]}</div>}
              </div>

              <div style={{ padding: 'var(--spacing-md)', background: '#f0f9ff', borderRadius: 'var(--radius-md)', border: '1px solid #bfdbfe', fontSize: '12px', color: '#1e3a8a' }}>
                <strong>Availability will be calculated as:</strong> Success / (Success + Errors). You can change this later
              </div>
            </>
          ) : (
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
          )}
        </div>
      ))}

      {formData.metrics && formData.metrics.length < 3 && (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={addMetric}
          style={{ width: '100%' }}
        >
          + Add Metric
        </button>
      )}
    </div>
  );
};
