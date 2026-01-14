export function Step1Basics({ formData, updateField, errors }){
  return (
    <div>
      <h3 style={{ marginBottom: '20px', color: '#1e293b' }}>Dashboard Basics</h3>
      <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '14px' }}>
        Having a good name and a good description is important: this is how people
        can find dashboard and to know what is its purpose.&nbsp;
        <i>
          How is this dashboard used?
          What info will I get by opening it?
        </i>
      </p>
      <div className="form-group">
        <label className="form-label">Dashboarda Name *</label>
        <input
          type="text"
          className={`form-input ${errors.dashboardName ? 'error' : ''}`}
          placeholder="e.g., Customers Order and Availability"
          value={formData.dashboardName}
          onChange={(e) => updateField('dashboardName', e.target.value)}
        />
        {errors.dashboardName && <div className="form-error">⚠️ {errors.dashboardName}</div>}
      </div>

      <div className="form-group">
        <label className="form-label">Dasbhoard Description</label>
        <textarea
          className="form-textarea"
          placeholder="Optional: Describe what this dashboard monitors and what info people can find inside..."
          value={formData.dashboardDescription}
          onChange={(e) => updateField('dashboardDescription', e.target.value)}
        />
      </div>
    </div>
  );
};
