export default function Component({ goForward }){
  return (
    <>
      <div className="wizard-content">
        <h3 style={{ marginBottom: 'var(--spacing-md)', color: '#1e293b' }}>Dashboard Framework</h3>
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <p>Welcome to the Dashboard Framework</p>
          <p>
            This wizard will help you generate a Dashboard (as json),
            with metrics, logs, and other telemetry data that you can import in
            your Grafana instance.
          </p>
          <p>
            Follow the instructions and focus on what you would like tho show
            in the dashboard!
          </p>
        </div>
        <div style={{ padding: 'var(--spacing-md)', background: '#f0f9ff', borderRadius: 'var(--radius-md)', border: '1px solid #bfdbfe' }}>
          <div style={{ color: '#1e3a8a', fontSize: '14px' }}>
            <ul style={{ marginLeft: 'var(--spacing-md)' }}>
              <li>Clutter-free: See only what matters the most</li>
              <li>Integrated: The platforms you use provide pre-configure panels</li>
              <li>User Friendly: Helps people outside of your team to understand it</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="wizard-footer">
        {goForward && <button className="btn btn-primary" onClick={goForward}>
          Next →
        </button>}
      </div>
    </>
  );
};
