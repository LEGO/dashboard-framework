import moment from 'moment';

export const FeatureID = "slo";
export const FeatureName = "Service Level Objective";

export function SetupComponent({formData, updateField, errors}){
  const calculateDowntime = (percentage, period) => {
    if(percentage === 100) return "impossible! 😅";
    const downtimePercentage = (100 - percentage);

    let hours = 0;
    if (period === 'year') hours = 365 * 24;
    else if (period === 'month') hours = 30 * 24;
    else hours = 7 * 24;

    const downtimeHours = (hours * downtimePercentage) / 100;
    return moment.duration(downtimeHours, "hours").humanize(false);
  };

  return (
    <div>
      <h3 style={{marginBottom: '20px', color: '#1e293b'}}>Service Level Objective</h3>
      <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '14px' }}>
        Service Level Objectives (SLO) are useful in many different ways. They
        can be used to calculate alerts, health of services to users, prioritize
        stability vs features, and more! If you are not interested into Site
        Reliability Engineering you can disable this feature.
      </p>

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
          <span style={{fontWeight: '500'}}>Calculate Service Level Objective</span>
        </label>
        <div className="form-hint">
          By enabling the SLO, the dashboard can include availability and error budgets
          when specifying metrics.
        </div>
      </div>

      {formData.sreEnabled && (
        <>
          <div className="form-group">
            <label className="form-label">SLO / Availability Target *</label>
            <input
              type="number"
              className={`form-input ${errors.sliTarget ? 'error' : ''}`}
              placeholder="e.g. 99.9"
              step="0.001"
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
                Your Error Budget with {formData.sliTarget}% availability:
              </div>
              <div style={{marginBottom: 'var(--spacing-md)', fontSize: '13px', color: 'var(--color-text-secondary)', fontStyle: 'italic'}}>
                This shows you the maximum amount of time when your service is unavailable, before it disrupts
                the user experience/expectations. For example: How much time can my application be down before a user
                really complains about the it?
              </div>
              <div className="calculation-item">
                <span className="calculation-label">Unavailability allowed in a Year:</span>
                <span className="calculation-value">{calculateDowntime(parseFloat(formData.sliTarget), 'year')}</span>
              </div>
              <div className="calculation-item">
                <span className="calculation-label">Unavailability allowed in a Month:</span>
                <span className="calculation-value">{calculateDowntime(parseFloat(formData.sliTarget), 'month')}</span>
              </div>
              <div className="calculation-item">
                <span className="calculation-label">Unavailability allowed in a Week:</span>
                <span className="calculation-value">{calculateDowntime(parseFloat(formData.sliTarget), 'week')}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};


