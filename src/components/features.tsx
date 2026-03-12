export function Component({ dashboardData, goBack, goForward, setDashboardData }){
  
  return (
    <>
      <div className="wizard-content">
        <h3 style={{marginBottom: '20px', color: '#1e293b'}}>Dashboard Features</h3>
        <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '14px' }}>
          Select here the features that you would like to use in the dashboards.
          These will add friendly panels to extend the dashboard with
          telemetry data from platforms, tools or adding extra features.
        </p>

        {
          dashboardData.features.map(renderFeatureToggle)
        }
      </div>

      <div className="wizard-footer">
        {goBack && <button className="btn btn-secondary" onClick={goBack}>
          ← Previous
        </button>}
        {goForward && <button className="btn btn-primary" onClick={goForward}>
          Next →
        </button>}
      </div>
    </>
  );
};

function renderFeatureToggle(feat){
  return (
    <div className="form-group">
        <label style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', cursor: 'pointer'}}>
          <div className="toggle-switch">
            <input
              type="checkbox"
              checked={feat.enabled}
              onChange={(e) => toggleFeature({...feat, enable: e.target.checked})}
            />
            <span className="toggle-slider"></span>
          </div>
          <span style={{fontWeight: '500'}}>{feat.name}</span>
        </label>
        <div className="form-hint"></div>
      </div>

  )
}
