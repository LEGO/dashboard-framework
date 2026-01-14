export function Step4Logs({ formData, updateField, errors, addLogsFilter, removeLogsFilter }) {
  return (
    <div>
      <h3 style={{ marginBottom: '20px', color: '#1e293b' }}>Logs Configuration</h3>

      <div className="form-group">
        <label className="form-label">Service Name *</label>
        <input
          type="text"
          className={`form-input ${errors.logsServiceName ? 'error' : ''}`}
          placeholder="e.g., api-server, frontend-app"
          value={formData.logsServiceName}
          onChange={(e) => updateField('logsServiceName', e.target.value)}
        />
        {errors.logsServiceName && <div className="form-error">⚠️ {errors.logsServiceName}</div>}
        <div className="form-hint">This will be used to fill the <code>service_name</code> label/attribute</div>
      </div>

      <div className="form-group">
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', cursor: 'pointer' }}>
          <div className="toggle-switch">
            <input
              type="checkbox"
              checked={formData.logsIsJson}
              onChange={(e) => updateField('logsIsJson', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </div>
          <span style={{ fontWeight: '500' }}>JSON Formatted Logs</span>
        </label>
        <div className="form-hint">Enable if your logs are structured as JSON</div>
      </div>

      <div style={{ paddingTop: 'var(--spacing-md)', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Label Filters (Optional)</label>
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '4px 12px', fontSize: '12px' }}
            onClick={addLogsFilter}
          >
            + Add Filter
          </button>
        </div>

        {formData.logsFilters && formData.logsFilters.map((filter, filterIdx) => (
          <div key={filterIdx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)', alignItems: 'flex-end' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Key (e.g., level, component)"
              value={filter.key}
              onChange={(e) => {
                const newFilters = [...formData.logsFilters];
                newFilters[filterIdx].key = e.target.value;
                updateField('logsFilters', newFilters);
              }}
            />
            <input
              type="text"
              className="form-input"
              placeholder="Value (e.g., ERROR, payment)"
              value={filter.value}
              onChange={(e) => {
                const newFilters = [...formData.logsFilters];
                newFilters[filterIdx].value = e.target.value;
                updateField('logsFilters', newFilters);
              }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '12px' }}
              onClick={() => removeLogsFilter(filterIdx)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
