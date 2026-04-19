import { useCallback, useEffect, useState } from "react";
import { queryPrometheus } from "../lib/prometheusQuerier.ts";
import { useAuth } from "react-oidc-context";
import { AutoComplete } from "primereact/autocomplete";
import { PanelBuilder as TimeSeriesPanelBuilder } from "@grafana/grafana-foundation-sdk/timeseries";
import { DataqueryBuilder as PrometheusDataqueryBuilder } from "@grafana/grafana-foundation-sdk/prometheus";
import { useEnv } from '../components/env.tsx';

export const FeatureID = "edge";
export const FeatureName = "Edge Services";
export const FeatureIcon = "https://www.rabbitmq.com/assets/files/rabbitmq-logo-e91cacd38fcef5219149bc5cfa10b384.svg";

// ---- Types ----

interface Rabbit {
  rabbitmq_cluster: string;
  novus_region: string;
}

interface Queue {
  queue: string;
}

interface Props {
  goBack?: () => void;
  goForward?: () => void;
  setDashboardPanels: (id: string, overview: any[], panels: any[]) => void;
}

// ---- Data hook ----

function useEdgeData(
  host: string | undefined,
  token: string | undefined,
  isAuthenticated: boolean,
  selectedRabbitCluster: Rabbit | undefined,
) {
  const [rabbits, setRabbits] = useState<Rabbit[]>([]);
  const [queues, setQueues] = useState<Queue[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    queryPrometheus(
      host,
      "group(rabbitmq_identity_info{}) by (rabbitmq_cluster, novus_region)",
      token,
    ).then((result) =>
      setRabbits(
        result.data.result.map((item: any) => ({
          rabbitmq_cluster: item.metric.rabbitmq_cluster,
          novus_region: item.metric.novus_region,
        })),
      ),
    );
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !selectedRabbitCluster) {
      setQueues([]);
      return;
    }
    queryPrometheus(
      host,
      `group(rabbitmq_detailed_queue_messages{service="${selectedRabbitCluster.rabbitmq_cluster}"}) by (queue)`,
      token,
    ).then((result) =>
      setQueues(
        result.data.result.map((item: any) => ({ queue: item.metric.queue })),
      ),
    );
  }, [isAuthenticated, selectedRabbitCluster]);

  return { rabbits, queues };
}

// ---- Panel builders (pure, no React) ----

function buildPanels(cluster: string, queueFilter: string) {
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
          .legendFormat(`{{ queue }}`),
      ),
  ];
}

// ---- Component ----

export function Component({ goBack, goForward, setDashboardPanels }: Props) {
  const auth = useAuth();
  const env = useEnv();
  const host = env?.["BUN_PUBLIC_PROMETHEUS_ENDPOINT"];
  const token = auth?.user?.id_token;

  const [selectedRabbitCluster, setSelectedRabbitCluster] = useState<Rabbit | undefined>();
  const [filteredRabbitClusters, setFilteredRabbitClusters] = useState<Rabbit[]>([]);
  const [queueFilter, setQueueFilter] = useState(".*");

  const { rabbits, queues } = useEdgeData(host, token, !!auth?.isAuthenticated, selectedRabbitCluster);

  const filteredQueues = queues.filter((q) => q.queue.match(queueFilter));

  const searchRabbitClusters = useCallback(
    (event: { query: string }) => {
      if (!event.query.trim()) {
        setFilteredRabbitClusters(rabbits);
        return;
      }
      const terms = event.query.trim().split(/[-_\s]/);
      setFilteredRabbitClusters(
        rabbits.filter((r) =>
          terms.every(
            (t) =>
              r.rabbitmq_cluster.toLowerCase().includes(t) ||
              r.novus_region.toLowerCase().includes(t),
          ),
        ),
      );
    },
    [rabbits],
  );

  const rabbitTemplate = (rabbit: Rabbit) => (
    <div>
      [{rabbit.novus_region.split("-")[0].toUpperCase()}] {rabbit.rabbitmq_cluster}
    </div>
  );

  const onSubmit = () => {
    if (!selectedRabbitCluster) return;
    setDashboardPanels(FeatureID, [], buildPanels(selectedRabbitCluster.rabbitmq_cluster, queueFilter));
    goForward?.();
  };

  return (
    <>
      <div className="wizard-content">
        <h3 style={{ marginBottom: "20px", color: "#1e293b" }}>Edge Configuration</h3>
        <p style={{ color: "#64748b", marginBottom: "20px", fontSize: "14px" }}>
          Edge is our stateful services platform. This feature adds pre-built
          panels scoped to edge service instances.
        </p>
        <div className="form-group">
          <label className="form-label">What RabbitMQ Cluster are you using?</label>
          <AutoComplete<Rabbit>
            field="rabbitmq_cluster"
            value={selectedRabbitCluster}
            suggestions={filteredRabbitClusters}
            completeMethod={searchRabbitClusters}
            onChange={(e) => setSelectedRabbitCluster(e.value?.rabbitmq_cluster ? e.value : undefined)}
            itemTemplate={rabbitTemplate}
            selectedItemTemplate={(rabbit: Rabbit) => rabbit.rabbitmq_cluster}
            dropdown
          />
        </div>
        {selectedRabbitCluster && (
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
                  <div key={q.queue}>{q.queue}</div>
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
