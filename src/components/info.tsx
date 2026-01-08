export function Step1Basics({ formData, updateField, errors }){
  return (
    <div>
      <h3 style={{ marginBottom: '20px', color: '#1e293b' }}>Dashboard Basics</h3>

      <div className="form-group">
        <label className="form-label">Dashboarda Name *</label>
        <input
          type="text"
          className={`form-input ${errors.dashboardName ? 'error' : ''}`}
          placeholder="e.g., API Server Availability"
          value={formData.dashboardName}
          onChange={(e) => updateField('dashboardName', e.target.value)}
        />
        {errors.dashboardName && <div className="form-error">⚠️ {errors.dashboardName}</div>}
      </div>

      <div className="form-group">
        <label className="form-label">Dashboard Description</label>
        <textarea
          className="form-textarea"
          placeholder="Optional: Describe what this dashboard monitors..."
          value={formData.dashboardDescription}
          onChange={(e) => updateField('dashboardDescription', e.target.value)}
        />
      </div>
    </div>
  );
};
