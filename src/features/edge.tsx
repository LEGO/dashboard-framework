import { useEffect, useState } from "react";
import { queryPrometheus } from "../lib/prometheusQuerier.ts";
import { useAuth } from "react-oidc-context";
import { AutoComplete } from "primereact/autocomplete";
import { PanelBuilder as TimeSeriesPanelBuilder } from "@grafana/grafana-foundation-sdk/timeseries";
import { DataqueryBuilder as PrometheusDataqueryBuilder } from "@grafana/grafana-foundation-sdk/prometheus";
import { useEnv } from '../components/env.tsx';

export const FeatureID = "edge";
export const FeatureName = "Edge Services";

type Rabbit = {
  rabbitmq_cluster: string;
  novus_region: string;
};

type Queue = {
  queue: string;
};

export function Component({ goBack, goForward, setDashboardPanels }) {

  const auth = useAuth();
  const env = useEnv();
  const host = env?.["BUN_PUBLIC_PROMETHEUS_ENDPOINT"];

  const [rabbits, setRabbits] = useState<Rabbit[]>();
  const [selectedRegion, setSelectedRegion] = useState<string>();
  const [queues, setQueues] = useState<Queue[]>();
  const [queueFilter, setQueueFilter] = useState<string>(".*");
  const [filteredQueues, setFilteredQueues] = useState<Queue[]>();

  const [selectedRabbitCluster, setSelectedRabbitCluster] = useState<Rabbit>();
  const [filteredRabbitClusters, setFilteredRabbitClusters] = useState<
    Rabbit[]
  >([]);

  const getRabbitClusters = () => {
    return queryPrometheus(
      host,
      "group(rabbitmq_identity_info{}) by (rabbitmq_cluster, novus_region)",
      auth?.user?.id_token,
    ).then((result) => {
      return result.data.result.map((item: any) => {
        return {
          rabbitmq_cluster: item.metric.rabbitmq_cluster,
          novus_region: item.metric.novus_region,
        };
      });
    });
  };

  const getRabbitQueues = () => {
    let rabbitmq_cluster = selectedRabbitCluster?.rabbitmq_cluster;
    if (rabbitmq_cluster === undefined) {
      setQueues([]);
    }
    return queryPrometheus(
      host,
      `group(rabbitmq_detailed_queue_messages{service="${rabbitmq_cluster}"}) by (queue)`,
      auth?.user?.id_token,
    ).then((result) => {
      return result.data.result.map((item: any) => {
        return {
          queue: item.metric.queue,
        };
      });
    });
  };

  const searchRabbitClusters = (event) => {
    let _filtered: Rabbit[];
    if (!event.query.trim().length) {
      _filtered = rabbits ?? [];
    } else {
      let terms = event.query.trim().split(/[-_\s]/);
      _filtered =
        rabbits?.filter((r) => {
          return terms.every(
            (t) =>
              r.rabbitmq_cluster.toLowerCase().includes(t) ||
              r.novus_region.toLowerCase().includes(t),
          );
        }) ?? [];
    }

    setFilteredRabbitClusters(_filtered);
  };

  useEffect(() => {
    if (!auth?.isAuthenticated) return;
    getRabbitClusters().then((res) => setRabbits(res));
  }, [auth?.isAuthenticated]);

  useEffect(() => {
    if (!auth?.isAuthenticated || !selectedRabbitCluster) return;
    getRabbitQueues().then((res) => setQueues(res));
  }, [auth?.isAuthenticated, selectedRabbitCluster]);

  useEffect(() => {
    setFilteredQueues(queues?.filter((q) => q.queue.match(queueFilter)));
  }, [queues, queueFilter]);

  const genRabbitOverview = () => {
    return [new TimeSeriesPanelBuilder()
      .title("Queues")
      .height(8)
      .span(8)
      .withTarget(
        new PrometheusDataqueryBuilder()
          .datasource({ uid: "$prometheus" })
          .expr(
            `sum(rabbitmq_detailed_queue_messages{service="${selectedRabbitCluster?.rabbitmq_cluster}", queue=~"${queueFilter}"}) by (queue)`,
          ).legendFormat(`{{ queue }}`),
      )];
  };

  const onSubmit = () => {
    // if (!validate()) return;
    // setDashboardPanels(FeatureID, genOverviewPanels(), genPanels(), genVariables());
    let out = genRabbitOverview();
    setDashboardPanels(FeatureID, [], genRabbitOverview());
    goForward();
  };

  const rabbitTemplate = (rabbit) => {
    return (
      <div>
        [{rabbit.novus_region.split("-")[0].toUpperCase()}]{" "}
        {rabbit.rabbitmq_cluster}
      </div>
    );
  };

  const selectedRabbitTemplate = (rabbit) => {
    return rabbit.rabbitmq_cluster;
  };

  return (
    <>
      <div className="wizard-content">
        <h3 style={{ marginBottom: "20px", color: "#1e293b" }}>
          Edge Configuration
        </h3>
        <p style={{ color: "#64748b", marginBottom: "20px", fontSize: "14px" }}>
          Edge is our stateful services. This feature adds pre-built panels
          scoped to edge service instances
        </p>
        <div className="form-group">
          <AutoComplete<Rabbit>
            field="rabbitmq_cluster"
            value={selectedRabbitCluster}
            suggestions={filteredRabbitClusters}
            completeMethod={searchRabbitClusters}
            onChange={(e) => {
              if (e?.value?.rabbitmq_cluster != "") {
                setSelectedRabbitCluster(e.value);
              } else {
                setSelectedRabbitCluster(undefined);
              }
            }}
            itemTemplate={rabbitTemplate}
            selectedItemTemplate={selectedRabbitTemplate}
            dropdown
          ></AutoComplete>
        </div>
        {selectedRabbitCluster && (
          <div className="form-group">
            <div id="queue-filter-container">
              <input
                id="queue-filter-input"
                className="form-input"
                value={queueFilter}
                onChange={(e) => setQueueFilter(e.target.value)}
              ></input>
              <div id="queue-sum">queues: {filteredQueues?.length}</div>
            </div>
            <div className="queuecontainer">
              <div className="queuelist">
                {filteredQueues?.map((q) => {
                  return <div key={q.queue}>{q.queue}</div>;
                })}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* <div>
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
        >
          {[...new Set(rabbits?.map((rabbit) => rabbit.novus_region))].map(
            (region) => (
              <option value={region} key={region}>
                {region}
              </option>
            ),
          )}
        </select>
        <ul>
          {rabbits
            ?.filter((rabbit) => rabbit.novus_region === selectedRegion)
            .map((rabbit) => (
              <li key={rabbit.rabbitmq_cluster}>{rabbit.rabbitmq_cluster}</li>
            ))}
        </ul>
      </div> */}

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
