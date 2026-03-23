import {
  DashboardBuilder,
  DashboardCursorSync,
  DatasourceVariableBuilder,
  RowBuilder,
  TimePickerBuilder,
} from '@grafana/grafana-foundation-sdk/dashboard';

import {
  PanelBuilder as TextPanelBuilder,
  TextMode
} from '@grafana/grafana-foundation-sdk/text';


export default function Component({ goBack, goForward, dashboardData }) {
  const generateGrafanaDashboard = () => {
    let dashboard = new DashboardBuilder(dashboardData.name)
      .refresh('1m')
      .description(dashboardData.description)
      .time({ from: 'now-6h', to: 'now' })
      .timezone('browser')
      .tooltip(DashboardCursorSync.Crosshair)
      .timepicker(
        new TimePickerBuilder()
          .refreshIntervals(["1m", "5m", "15m", "30m", "1h", "6h", "1d", "7d"])
      )
      .withVariable(
        new DatasourceVariableBuilder("prometheus")
          .label("Metrics Data source")
          .type("prometheus")
          .regex("(?!grafanacloud-usage|grafanacloud-ml-metrics).+")
          .multi(false)
      )
      .withVariable(
        new DatasourceVariableBuilder("loki")
          .label("Logs Data source")
          .type("loki")
          .regex("(?!grafanacloud.+usage-insights|grafanacloud.+alert-state-history).+")
          .multi(false)
      );

    // Inject variables contributed by enabled features
    dashboardData.features.forEach((feat) => {
      if (!feat.enabled) return;
      feat.variables.forEach((variable) => {
        dashboard = dashboard.withVariable(variable);
      });
    });

    dashboard = dashboard.withRow(new RowBuilder("Overview"));

    dashboard = dashboard.withPanel(
      new TextPanelBuilder()
        .title("")
        .transparent(true)
        .mode(TextMode.HTML)
        .span(24) // biiig one
        .height(4)
        .content(`
            <!-- Header -->
            <div style="display: flex; height:100%; background: linear-gradient(135deg, #780000 0%, #003049 50%); color: white; border-radius: 12px; align-items: center; text-align: center;">
              <div style="width: 100%;">
                <h1 style="margin: 0; font-size: 2.5em; font-weight: 700;">${dashboardData.name}</h1>
                <p style="margin: 0; font-size: 1.1em; opacity: 0.95;">
                 ${dashboardData.description}
                </p>
              </div>
            </div>
          `)
    );

    // Extract panells for the overview
    const overviewPanels = dashboardData.features.map((feat) => {
      if (!feat.enabled) return [];
      return feat.overviewPanels
    }).flat();

    // max 6 panels per row in the overview
    let overviewPanelsSpan = 24 / overviewPanels.length;
    if(overviewPanelsSpan < 4) overviewPanelsSpan = 4;

    overviewPanels.forEach((panel) => {
      panel = panel.span(overviewPanelsSpan);
      dashboard = dashboard.withPanel(panel);
    });

    // Extratc panels from the features
    dashboardData.features.forEach((feat) => {
      if (!feat.enabled) return;

      dashboard = dashboard.withRow(new RowBuilder(feat.name));
      feat.panels.forEach((panel) => {
        dashboard = dashboard.withPanel(panel);
      })
    });

    return JSON.stringify(dashboard.build(), null, 2);
  };

  const copyDashboard = () => {
    const dashboardJson = generateGrafanaDashboard();
    navigator.clipboard.writeText(dashboardJson);
    alert('Dashboard JSON copied to clipboard!');
  }

  const downloadDashboard = () => {
    const dashboardJson = generateGrafanaDashboard();
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(dashboardJson));
    element.setAttribute('download', dashboardData.name.toLowerCase().replace(/\s+/g, '-') + '-dashboard.json');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const openGrafanaImport = () => {
    window.open('https://grafana.istar.thelegogroup.com/dashboard/import', '_blank');
  }

  return (
    <>
      <div className="wizard-content">
        <h3 style={{ marginBottom: '20px', color: '#1e293b' }}>Done! 🎉</h3>

        <div style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-md)', background: '#f0f9ff', borderRadius: 'var(--radius-md)', border: '1px solid #bfdbfe' }}>
          <div style={{ color: '#1e3a8a', fontSize: '14px' }}>
            <strong>✓ Your Grafana dashboard is ready!</strong>
            <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>Download the JSON and import it into your Grafana instance:</p>
            <ol style={{ margin: '8px 0 0 16px', paddingLeft: 0 }}>
              <li>Copy or download the dashboard JSON file</li>
              <li>Go to Grafana → Dashboards → Import</li>
              <li>Paste the JSON or upload the file</li>
              <li>Click Import</li>
            </ol>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
          <button
            type="button"
            onClick={copyDashboard}
            className="btn btn-secondary"
          >
            📋 Copy to Clipboard
          </button>
          <button
            type="button"
            onClick={downloadDashboard}
            className="btn btn-primary"
          >
            ⬇️ Download JSON
          </button>
          <button
            type="button"
            onClick={openGrafanaImport}
            className="btn btn-secondary"
            style={{ gridColumn: 'span 2' }}
          >
            🚀 Open Grafana Import Page
          </button>
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
