import{ createContext, useContext } from 'react';

export const Context = createContext([]);

export function Component({errors, setErrors}) {
  const { metricsData, setMetricsData } = useContext(Context);

  const removeMetric = (idx) => setMetricsData(prev => prev.filter((_, i) => i !== idx));
  const addMetric = () => setMetricsData(prev => [...prev, { name: '', query: '', querySuccess: '', queryErrors: '' }])
  const updateMetric = (idx, field, value) => {
    setMetricsData(prev => {
      let newMetrics = [...prev]
      newMetrics[idx] = {...prev[idx], [field]: value };
      return newMetrics;
    });
    if (errors[`metric_${idx}_${field}`]) {
      setErrors(prev => ({ ...prev, [`metric_${idx}_${field}`]: '' }));
    };
  };
  
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

      {metricsData && metricsData.map((metric, idx) => (
        <div key={idx} className="metric-card">
          <div className="metric-header">
            {metricsData.length > 1 && (
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

      {metricsData && metricsData.length < 3 && (
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
