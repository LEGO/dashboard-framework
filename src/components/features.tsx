import * as sloFeature from "../features/slo.tsx"; 

const enabledFeatures = [
  sloFeature 
];

export function Component({formData,  errors, setFormData}){
  enabledFeatures.forEach(feat => {
    if(formData.features[feat.FeatureID] === undefined) {
      setFormData(prev => {
        let features = prev.features;
        features[feat.FeatureID] = {};
        return { ...prev, features: features}
      });
    }
  })

  
  return (
    <div>
      <h3 style={{marginBottom: '20px', color: '#1e293b'}}>Dashboard Features</h3>
      <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '14px' }}>
        Select here the features that you would like to use in the dashboards.
        These will add friendly panels to extend the dashboard with
        telemetry data from platforms, tools or adding extra features.
      </p>

      {
        enabledFeatures.map(
          feat => renderFeatureToggle(feat, formData.features[feat.FeatureID], setFormData, errors)
        )
      }
    </div>
  );
};

function renderFeatureToggle(feat, featureData, setFormData, errors){
  let updateData = (value) => {
    setFormData(prev => {
      let features = prev.features;
      features[feat.FeatureID] = value;
      return { ...prev, features: features}
    });
  }

  return (
    <div className="form-group">
        <label style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', cursor: 'pointer'}}>
          <div className="toggle-switch">
            <input
              type="checkbox"
              checked={featureData.enabled}
              onChange={(e) => updateData({...featureData, enable: e.target.checked})}
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

  )
}
