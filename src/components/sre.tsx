export function Step2SRE({formData, updateField, errors}){
  const calculateDowntime = (percentage, period) => {
    const uptime = percentage / 100;
    const downtimePercentage = (100 - percentage);

    let hours = 0;
    if (period === 'year') hours = 365 * 24;
    else if (period === 'month') hours = 30 * 24;
    else hours = 7 * 24;

    const downtimeHours = (hours * downtimePercentage) / 100;
    const minutes = (downtimeHours % 1) * 60;

    return `${Math.floor(downtimeHours)}h ${Math.round(minutes)}m`;
  };

  return (
    <div>
      <h3 style={{marginBottom: '20px', color: '#1e293b'}}>SRE/SLO Configuration</h3>

      <div className="form-group">
        <label style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', cursor: 'pointer'}}>
          <div className="toggle-switch">
            <input
              type="checkbox"
              checked={formData.sreEnabled}
              onChange={(e) => updateField('sreEnabled', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </div>
          <span style={{fontWeight: '500'}}>Enable SRE/SLO Practices</span>
        </label>
        <div className="form-hint">Use SLI targets to calculate availability and error budgets</div>
      </div>

      {formData.sreEnabled && (
        <>
          <div className="form-group">
            <label className="form-label">SLI Target (Availability %) *</label>
            <input
              type="number"
              className={`form-input ${errors.sliTarget ? 'error' : ''}`}
              placeholder="99.9"
              step="0.01"
              min="0"
              max="100"
              value={formData.sliTarget}
              onChange={(e) => updateField('sliTarget', e.target.value)}
            />
            {errors.sliTarget && <div className="form-error">⚠️ {errors.sliTarget}</div>}
            <div className="form-hint">Enter your target availability percentage (e.g., 99.9 for three nines)</div>
          </div>

          {formData.sliTarget && !isNaN(parseFloat(formData.sliTarget)) && parseFloat(formData.sliTarget) > 0 && parseFloat(formData.sliTarget) <= 100 && (
            <div className="calculation-box">
              <div style={{marginBottom: 'var(--spacing-md)', fontWeight: '600', color: 'var(--color-text-primary)'}}>
                Your Error Budget @ {formData.sliTarget}% availability:
                                </div>
              <div style={{marginBottom: 'var(--spacing-md)', fontSize: '13px', color: 'var(--color-text-secondary)', fontStyle: 'italic'}}>
                Users will start complaining hard if your app goes down for more than:
                                </div>
              <div className="calculation-item">
                <span className="calculation-label">In a Year:</span>
                <span className="calculation-value">{calculateDowntime(parseFloat(formData.sliTarget), 'year')}</span>
              </div>
              <div className="calculation-item">
                <span className="calculation-label">In a Month:</span>
                <span className="calculation-value">{calculateDowntime(parseFloat(formData.sliTarget), 'month')}</span>
              </div>
              <div className="calculation-item">
                <span className="calculation-label">In a Week:</span>
                <span className="calculation-value">{calculateDowntime(parseFloat(formData.sliTarget), 'week')}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

