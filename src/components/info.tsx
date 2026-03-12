import{ useState } from 'react';

export default function Component({ dashboardData, goBack, goForward, setDashboardData }){
  const [errors, setErrors] = useState({
    name: "",
    description: "",
  });

  const [dashboardInfo, setDashboardInfo] = useState({
    name: "",
    description: "",
  });

  // Reload data from the global state
  if (!dashboardInfo.name) {
    dashboardInfo.name = dashboardData.name;
  }

  if (!dashboardInfo.description) {
    dashboardInfo.description = dashboardData.description;
  }

  const validate = () => {
    const newErrors = {};
    if (dashboardInfo.name.length < 3) {
      newErrors.name = 'Consider a human readable, longer name (3 letters min)';
    }

    if (dashboardInfo.description.length < 20) {
      newErrors.description = 'Consider a human readable, longer description (20 letters min)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0
  }

  const onSubmit = () => {
    if (!validate()) return;
    setDashboardData({...dashboardData, ...dashboardInfo});
    goForward();
  }

  return (
    <>
      <div className="wizard-content">
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
            className={`form-input ${errors.name ? 'error' : ''}`}
            placeholder="e.g., Customers Order and Availability"
            value={dashboardInfo.name}
            onChange={(e) => setDashboardInfo({...dashboardInfo, name: e.target.value})}
          />
          {errors.name && <div className="form-error">⚠️ {errors.name}</div>}
        </div>

        <div className="form-group">
          <label className="form-label">Dasbhoard Description</label>
          <textarea
            className={`form-input ${errors.description ? 'error' : ''}`}
            placeholder="Optional: Describe what this dashboard monitors and what info people can find inside..."
            value={dashboardInfo.description}
            onChange={(e) =>  setDashboardInfo({...dashboardInfo, description: e.target.value})}
          />
          {errors.description && <div className="form-error">⚠️ {errors.description}</div>}
        </div>
      </div>

      <div className="wizard-footer">
        {goBack && <button className="btn btn-secondary" onClick={goBack}>
          ← Previous
        </button>}
        {goForward && <button className="btn btn-primary" onClick={onSubmit}>
          Next →
        </button>}
      </div>
    </>
  );
};
