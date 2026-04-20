import { useCallback, useEffect, useState } from "react";
import { queryPrometheus } from "../lib/prometheusQuerier.ts";
import { useAuth } from "react-oidc-context";
import { AutoComplete } from "primereact/autocomplete";
import { PanelBuilder as TimeSeriesPanelBuilder } from "@grafana/grafana-foundation-sdk/timeseries";
import { DataqueryBuilder as PrometheusDataqueryBuilder } from "@grafana/grafana-foundation-sdk/prometheus";
import { useEnv } from "../components/env.tsx";

export const FeatureID = "valkey";
export const FeatureName = "Edge Valkey";
export const FeatureIcon = "https://cdn.jsdelivr.net/gh/selfhst/icons@main/svg/valkey.svg"

// ---- Types ----

interface Valkey {
  valkey_cluster: string;
  novus_region: string;
}

interface Props {
  goBack?: () => void;
  goForward?: () => void;
  setDashboardPanels: (id: string, overview: any[], panels: any[]) => void;
}

// ---- Data hook ----

const valkeyRegex = /^(.*?)(?:-(?:valkey-)?metrics)$/;

function useValkeyData(
  host: string | undefined,
  token: string | undefined,
  isAuthenticated: boolean,
) {
  const [clusters, setClusters] = useState<Valkey[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    queryPrometheus(
      host,
      "group(redis_up{}) by (service, novus_region)",
      token,
    ).then((result) =>
      setClusters(
        result.data.result.map((item: any) => ({
          valkey_cluster:
            item.metric.service.match(valkeyRegex)?.[1] ??
            item.metric.service,
          novus_region: item.metric.novus_region,
        })),
      ),
    );
  }, [isAuthenticated]);

  return { clusters };
}

// ---- Panel builders (pure, no React) ----

function buildPanels(cluster: string) {
  return [
    new TimeSeriesPanelBuilder()
      .title(`${cluster}: Commands`)
      .height(8)
      .span(12)
      .withTarget(
        new PrometheusDataqueryBuilder()
          .datasource({ uid: "$prometheus" })
          .expr(`sum(rate(redis_commands_total{service=~"${cluster}(-valkey)?-metrics"}[$__rate_interval])) by (cmd)`)
          .legendFormat(`{{ cmd }}`),
      ),
    new TimeSeriesPanelBuilder()
      .title(`${cluster}: Memory`)
      .height(8)
      .span(12)
      .withTarget(
        new PrometheusDataqueryBuilder()
          .datasource({ uid: "$prometheus" })
          .expr(`redis_memory_used_bytes{service=~"${cluster}(-valkey)?-metrics"}`)
          .legendFormat(`{{ instance }}`),
      ),
  ];
}

// ---- Component ----

export function Component({ goBack, goForward, setDashboardPanels }: Props) {
  const auth = useAuth();
  const env = useEnv();
  const host = env?.["BUN_PUBLIC_PROMETHEUS_ENDPOINT"];
  const token = auth?.user?.id_token;

  const [clusterValue, setClusterValue] = useState<Valkey | string | undefined>();
  const [filteredClusters, setFilteredClusters] = useState<Valkey[]>([]);

  const selectedCluster = typeof clusterValue === "object" ? clusterValue : undefined;

  const { clusters } = useValkeyData(host, token, !!auth?.isAuthenticated);

  const searchClusters = useCallback(
    (event: { query: string }) => {
      if (!event.query.trim()) {
        setFilteredClusters(clusters);
        return;
      }
      const terms = event.query.trim().split(/[-_\s]/);
      setFilteredClusters(
        clusters.filter((v) =>
          terms.every(
            (t) =>
              v.valkey_cluster.toLowerCase().includes(t) ||
              v.novus_region.toLowerCase().includes(t),
          ),
        ),
      );
    },
    [clusters],
  );

  const clusterTemplate = (valkey: Valkey) => (
    <div>
      [{valkey.novus_region.split("-")[0]?.toUpperCase()}] {valkey.valkey_cluster}
    </div>
  );

  const onSubmit = () => {
    if (!selectedCluster) return;
    setDashboardPanels(FeatureID, [], buildPanels(selectedCluster.valkey_cluster));
    goForward?.();
  };

  return (
    <>
      <div className="wizard-content">
        <h3 style={{ marginBottom: "20px", color: "#1e293b" }}>Valkey Configuration</h3>
        <p style={{ color: "#64748b", marginBottom: "20px", fontSize: "14px" }}>
          Valkey running on Edge, our stateful services platform. This feature
          adds pre-built panels scoped to a Valkey cluster instance.
        </p>
        <div className="form-group">
          <label className="form-label">Valkey Cluster</label>
          <AutoComplete<Valkey>
            field="valkey_cluster"
            value={clusterValue}
            suggestions={filteredClusters}
            completeMethod={searchClusters}
            onChange={(e) => setClusterValue(e.value)}
            itemTemplate={clusterTemplate}
            selectedItemTemplate={(valkey: Valkey) => valkey.valkey_cluster}
            dropdown
          />
        </div>
      </div>

      <div className="wizard-footer">
        {goBack && (
          <button className="btn btn-secondary" onClick={goBack}>
            ← Previous
          </button>
        )}
        {goForward && (
          <button className="btn btn-primary" onClick={onSubmit}>
            Next →
          </button>
        )}
      </div>
    </>
  );
}
