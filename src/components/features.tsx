export default function Component({ dashboardData, goBack, goForward, setDashboardData }){

  const toggleFeature = (featId, feat) => {
    feat.enabled = !feat.enabled;
    let newFeatures = {...dashboardData.features}
    newFeatures[featId] = feat
    setDashboardData({...dashboardData, features: newFeatures})
  }
  
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
          Object.keys(dashboardData.features).map(k => {
            let feat = dashboardData.features[k];
            return renderFeatureToggle(k, feat, toggleFeature);
          })
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

function renderFeatureToggle(featId, feat, toggleFeature){
  return (
    <div className="form-group">
      <label style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', cursor: 'pointer'}}>
        <div className="toggle-switch">
          <input
            type="checkbox"
            checked={feat.enabled}
            onChange={_ => toggleFeature(featId, feat)}
          />
          <span className="toggle-slider"></span>
        </div>
        <span style={{fontWeight: '500'}}>{feat.name}</span>
      </label>
      <div className="form-hint"></div>
    </div>
  )
}
