import {
  DashboardBuilder,
  DatasourceVariableBuilder,
  RowBuilder,
  ThresholdsConfigBuilder,
  ThresholdsMode,
  TimePickerBuilder,
  VariableHide,
} from '@grafana/grafana-foundation-sdk/dashboard';

import { DataqueryBuilder as PrometheusDataqueryBuilder } from '@grafana/grafana-foundation-sdk/prometheus';
import { DataqueryBuilder as LokiDataqueryBuilder } from '@grafana/grafana-foundation-sdk/loki';
import { PanelBuilder as TimeSeriesPanelBuilder } from '@grafana/grafana-foundation-sdk/timeseries';
import { PanelBuilder as LogsPanelBuilder } from '@grafana/grafana-foundation-sdk/logs';
import { PanelBuilder as StatusHistoryPanelBuilder } from '@grafana/grafana-foundation-sdk/statushistory';
import { AxisPlacement, LogsDedupStrategy, VizLegendOptionsBuilder } from '@grafana/grafana-foundation-sdk/common';

export function Step5Output({ formData }) {
  const generateGrafanaDashboard = () => {
    let dashboard = new DashboardBuilder(formData.dashboardName)
      .refresh('1m')
      .description(formData.dashboardDescription)
      .time({ from: 'now-6h', to: 'now' })
      .timezone('browser')
      .timepicker(
        new TimePickerBuilder()
          .refreshIntervals(["30s", "1m", "5m", "15m", "30m", "1h", "6h", "1d", "7d"])
      )
      .withRow(new RowBuilder('Overview'))
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
      )

    // Metrics Panels
    const panelSpan = 24 / formData.metrics.length;
    formData.metrics.forEach((metric: any) => {
      if (metric.isSli && formData.sreEnabled) {
        dashboard = dashboard.withPanel(
          new StatusHistoryPanelBuilder()
            .title(metric.name)
            .height(8)
            .span(panelSpan)
            .interval("1h")
            .thresholds(
              new ThresholdsConfigBuilder()
                .mode(ThresholdsMode.Percentage)
                .steps([
                  { value: (parseFloat(formData.sliTarget) / 100), color: "red" },
                  // Set orange halfway to burnt budget
                  { value: ((parseFloat(formData.sliTarget) / 100) + 1) / 2, color: "orange" },
                  { value: 1, color: "green" },
                ])
            )
            .legend(new VizLegendOptionsBuilder().isVisible(false))
            .axisPlacement(AxisPlacement.Hidden)
            .unit("percentunit")
            .withTarget(
              new PrometheusDataqueryBuilder()
                .datasource({ uid: "$prometheus" })
                .expr(`(${metric.querySuccess})/((${metric.queryErrors})+(${metric.querySuccess}))`)
            )
        );

      } else {
        dashboard = dashboard.withPanel(
          new TimeSeriesPanelBuilder()
            .title(metric.name)
            .height(8)
            .span(panelSpan)
            .legend(new VizLegendOptionsBuilder().isVisible(false))
            .withTarget(
              new PrometheusDataqueryBuilder()
                .datasource({ uid: "$prometheus" })
                .expr(metric.query)
            )
        );
      }
    });

    dashboard = dashboard.withRow(new RowBuilder('Logs'))

    // Logs Panel
    if (formData.logsServiceName) {

      let filters = ""
      if (formData.logsIsJson) {
        filters += "| json";
      };
      if (formData.logsFilters.length > 0) {
        formData.logsFilters.forEach((filter: any) => {
          filters += `| ${filter.key}="${filter.value}"`
        });
      }

      dashboard = dashboard.withPanel(
        new LogsPanelBuilder()
          .title("")
          .transparent(true)
          .height(12)
          .span(24)
          .enableInfiniteScrolling(true)
          .showTime(true)
          .enableLogDetails(true)
          .prettifyLogMessage(true)
          .wrapLogMessage(false)
          .dedupStrategy(LogsDedupStrategy.Exact)
          .withTarget(
            new LokiDataqueryBuilder()
              .datasource({ uid: "$loki" })
              .expr(`{service_name="${formData.logsServiceName}"} ${filters}`)
          )
      );
    }

    return JSON.stringify(dashboard.build(), null, 2);
  };

  const dashboardJson = generateGrafanaDashboard();
  const downloadDashboard = () => {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(dashboardJson));
    element.setAttribute('download', formData.dashboardName.toLowerCase().replace(/\s+/g, '-') + '-dashboard.json');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div>
      <h3 style={{ marginBottom: '20px', color: '#1e293b' }}>📊 Grafana Dashboard Generated</h3>

      <div style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-md)', background: '#f0f9ff', borderRadius: 'var(--radius-md)', border: '1px solid #bfdbfe' }}>
        <div style={{ color: '#1e3a8a', fontSize: '14px' }}>
          <strong>✓ Your Grafana dashboard is ready!</strong>
          <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>Download the JSON and import it into your Grafana instance:</p>
          <ol style={{ margin: '8px 0 0 16px', paddingLeft: 0 }}>
            <li>Copy or download the dashboard JSON file</li>
            <li>Go to Grafana → Dashboards → Import</li>
            <li>Paste the JSON or upload the file</li>
            <li>Select your Prometheus/Loki datasources</li>
            <li>Click Import</li>
          </ol>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(dashboardJson);
            alert('Dashboard JSON copied to clipboard!');
          }}
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
      </div>
    </div>
  );
};
