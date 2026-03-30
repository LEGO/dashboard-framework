import { useEffect, useState } from "react";
import { queryPrometheus } from "../lib/prometheusQuerier.ts";
import { useAuth } from "react-oidc-context";
import { AutoComplete } from "primereact/autocomplete";

export const FeatureID = "edge";
export const FeatureName = "Edge Services";

export function Component({ goBack, goForward, setDashboardPanels }) {
  type Rabbit = {
    rabbitmq_cluster: string;
    novus_region: string;
  };

  const auth = useAuth();
  const [rabbits, setRabbits] = useState<Rabbit[]>();
  const [selectedRegion, setSelectedRegion] = useState<string>();

  const [selectedRabbitCluster, setSelectedRabbitCluster] = useState<Rabbit>();
  const [filteredRabbitClusters, setFilteredRabbitClusters] = useState<
    Rabbit[]
  >([]);

  const getRabbitClusters = () => {
    return queryPrometheus(
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

  const searchRabbitClusters = (event) => {
    let _filtered: Rabbit[];
    if (!event.query.trim().length) {
      _filtered = rabbits ?? [];
    } else {
      let terms = event.query.trim().split(/[-_\s]/);
      console.log(terms);
      _filtered =
        rabbits?.filter((r) => {
          return terms.some(
            (t) =>
              r.rabbitmq_cluster.toLowerCase().includes(t) ||
              r.novus_region.toLowerCase().includes(t),
          );
        }) ?? [];
    }

    setFilteredRabbitClusters(_filtered);
  };

  useEffect(() => {
    getRabbitClusters().then((res) => setRabbits(res));
  }, [auth]);

  const onSubmit = () => {
    // if (!validate()) return;
    // setDashboardPanels(FeatureID, genOverviewPanels(), genPanels(), genVariables());
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

  // const panelFooterTemplate = () => {
  //       const isCountrySelected = (filteredCountries || []).some( country => country['name'] === selectedCountry );
  //          return (
  //           <div className="py-2 px-3">
  //               {isCountrySelected ? (
  //                   <span>
  //                       <b>{selectedCountry}</b> selected.
  //                   </span>
  //               ) : (
  //                   'No country selected.'
  //               )}
  //           </div>
  //       );
  //   };

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
        <div>
          <AutoComplete<Rabbit>
            field="rabbitmq_cluster"
            value={selectedRabbitCluster}
            suggestions={filteredRabbitClusters}
            completeMethod={searchRabbitClusters}
            onChange={(e) => setSelectedRabbitCluster(e.value)}
            itemTemplate={rabbitTemplate}
            selectedItemTemplate={selectedRabbitTemplate}
            dropdown
          ></AutoComplete>
        </div>
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
