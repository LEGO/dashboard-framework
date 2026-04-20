import { useCallback, useEffect, useState } from "react";
import { queryPrometheus } from "../lib/prometheusQuerier.ts";
import { useAuth } from "react-oidc-context";
import { AutoComplete } from "primereact/autocomplete";
import { PanelBuilder as TimeSeriesPanelBuilder } from "@grafana/grafana-foundation-sdk/timeseries";
import { DataqueryBuilder as PrometheusDataqueryBuilder } from "@grafana/grafana-foundation-sdk/prometheus";
import { useEnv } from "../components/env.tsx";
import { obfuscate } from "../lib/obfuscator.ts";

export const FeatureID = "rabbitmq";
export const FeatureName = "Edge RabbitMQ";
export const FeatureIcon = "https://www.rabbitmq.com/assets/files/rabbitmq-logo-e91cacd38fcef5219149bc5cfa10b384.svg";

// ---- Types ----

interface Rabbit {
  rabbitmq_cluster: string;
  novus_region: string;
  obfuscated: string;
}

interface Queue {
  queue: string;
  obfuscated: string;
}

interface Props {
  goBack?: () => void;
  goForward?: () => void;
  setDashboardPanels: (id: string, overview: any[], panels: any[]) => void;
}

// ---- Data hook ----

function useRabbitData(
  host: string | undefined,
  token: string | undefined,
  isAuthenticated: boolean,
  selectedCluster: Rabbit | undefined,
) {
  const [clusters, setClusters] = useState<Rabbit[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    queryPrometheus(
      host,
      "group(rabbitmq_identity_info{}) by (rabbitmq_cluster, novus_region)",
      token,
    ).then((result) =>
      setClusters(
        result.data.result.map((item: any) => ({
          rabbitmq_cluster: item.metric.rabbitmq_cluster,
          novus_region: item.metric.novus_region,
          obfuscated: obfuscate(item.metric.rabbitmq_cluster)
        })),
      ),
    );
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !selectedCluster) {
      setQueues([]);
      return;
    }
    queryPrometheus(
      host,
      `group(rabbitmq_detailed_queue_messages{service="${selectedCluster.rabbitmq_cluster}"}) by (queue)`,
      token,
    ).then((result) =>
      setQueues(
        result.data.result.map((item: any) => ({ queue: item.metric.queue, obfuscated: obfuscate(item.metric.queue) })),
      ),
    );
  }, [isAuthenticated, selectedCluster]);

  return { clusters, queues };
}

// ---- Panel builders (pure, no React) ----

function buildPanels(cluster: string, queueFilter: string, demoMode: boolean) {
  return [
    new TimeSeriesPanelBuilder()
      .title("Queues")
      .height(8)
      .span(8)
      .withTarget(
        new PrometheusDataqueryBuilder()
          .datasource({ uid: "$prometheus" })
          .expr(
            `sum(rabbitmq_detailed_queue_messages{service="${cluster}", queue=~"${queueFilter}"}) by (queue)`,
          )
          .legendFormat(demoMode ? `secret-queue` : `{{ queue }}`),
      ),
  ];
}

// ---- Component ----

export function Component({ goBack, goForward, setDashboardPanels }: Props) {
  const auth = useAuth();
  const env = useEnv();
  const host = env?.["BUN_PUBLIC_PROMETHEUS_ENDPOINT"];
  const demoMode = !!env?.["BUN_PUBLIC_DEMO_MODE"];
  const token = auth?.user?.id_token;

  const [clusterValue, setClusterValue] = useState<Rabbit | string | undefined>();
  const [filteredClusters, setFilteredClusters] = useState<Rabbit[]>([]);
  const [queueFilter, setQueueFilter] = useState(".*");

  const selectedCluster = typeof clusterValue === "object" ? clusterValue : undefined;

  const { clusters, queues } = useRabbitData(host, token, !!auth?.isAuthenticated, selectedCluster);

  const filteredQueues = queues.filter((q) => q.queue.match(queueFilter));

  const searchClusters = useCallback(
    (event: { query: string }) => {
      if (!event.query.trim()) {
        setFilteredClusters(clusters);
        return;
      }
      const terms = event.query.trim().split(/[-_\s]/);
      setFilteredClusters(
        clusters.filter((r) =>
          terms.every(
            (t) =>
              r.rabbitmq_cluster.toLowerCase().includes(t) ||
              r.novus_region.toLowerCase().includes(t) ||
              r.obfuscated.includes(t),
          ),
        ),
      );
    },
    [clusters],
  );

  const clusterTemplate = (rabbit: Rabbit) => {
    return (
    <div>
      [{rabbit.novus_region.split("-")[0]?.toUpperCase()}] {demoMode ? obfuscate(rabbit.rabbitmq_cluster) : rabbit.rabbitmq_cluster}
    </div>
  )};

  const onSubmit = () => {
    if (!selectedCluster) return;
    setDashboardPanels(FeatureID, [], buildPanels(selectedCluster.rabbitmq_cluster, queueFilter, demoMode));
    goForward?.();
  };

  return (
    <>
      <div className="wizard-content">
        <h3 style={{ marginBottom: "20px", color: "#1e293b" }}>RabbitMQ Configuration</h3>
        <p style={{ color: "#64748b", marginBottom: "20px", fontSize: "14px" }}>
          RabbitMQ running on Edge, our stateful services platform. This feature
          adds pre-built panels scoped to a RabbitMQ cluster instance.
        </p>
        <div className="form-group">
          <label className="form-label">RabbitMQ Cluster</label>
          <AutoComplete<Rabbit>
            field={demoMode ? "obfuscated" : "rabbitmq_cluster"}
            value={clusterValue}
            suggestions={filteredClusters}
            completeMethod={searchClusters}
            onChange={(e) => setClusterValue(e.value)}
            itemTemplate={clusterTemplate}
            selectedItemTemplate={(rabbit: Rabbit) => demoMode ? rabbit.obfuscated : rabbit.rabbitmq_cluster}
            dropdown
          />
        </div>
        {selectedCluster && (
          <div className="form-group">
            <div id="queue-filter-container">
              <input
                id="queue-filter-input"
                className="form-input"
                value={queueFilter}
                onChange={(e) => setQueueFilter(e.target.value)}
              />
              <div id="queue-sum">queues: {filteredQueues.length}</div>
            </div>
            <div className="queuecontainer">
              <div className="queuelist">
                {filteredQueues.map((q) => (
                  <div key={q.queue}>{demoMode ? q.obfuscated : q.queue}</div>
                ))}
              </div>
            </div>
          </div>
        )}
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
