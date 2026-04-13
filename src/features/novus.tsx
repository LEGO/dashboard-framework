import { useState, useEffect } from "react";
import { useAuth } from "react-oidc-context";
import { useEnv } from '../components/env.tsx';

import { AutoComplete } from 'primereact/autocomplete';

import {
  PanelBuilder,
  ConstantVariableBuilder,
  AdHocVariableBuilder,
  VariableHide,
  ThresholdsConfigBuilder,
  ThresholdsMode
} from "@grafana/grafana-foundation-sdk/dashboard";

import { DataqueryBuilder as PrometheusDataqueryBuilder } from '@grafana/grafana-foundation-sdk/prometheus';
import { PanelBuilder as StatsPanelBuilder } from '@grafana/grafana-foundation-sdk/stat';

import {
  PanelBuilder as TextPanelBuilder,
  TextMode
} from '@grafana/grafana-foundation-sdk/text';

import { usePersistentState } from "../lib/usePersistentState.ts";

import { queryPrometheus } from "../lib/prometheusQuerier.ts";

export const FeatureID = "novus";
export const FeatureName = "Novus Runtime Information";
export const FeatureIcon = "https://raw.githubusercontent.com/kubernetes/kubernetes/refs/heads/master/logo/logo.svg";

// Boilerplate library panel definitions for Novus.
// Replace UIDs with the actual library panel UIDs from your Grafana instance.
const NOVUS_LIBRARY_PANELS = [
  { name: "Novus Deployment timeline", uid: "cffw1fuyo9x4wb" },
  { name: "Novus CPU Usage", uid: "affw0w9ciuw3kf" },
  { name: "Novus Memory Usage", uid: "affw0vxt0u03kd" },
  { name: "Novus Policy Alerts", uid: "ffee6egctyio0e" },
  { name: "CPU Requests Recommendations", uid: "bfio81viwd4hse", height: 11, span: 24, enabledBy: "showRecommendations" },
  { name: "Memory Requests Recommendations", uid: "afio83xesz08wf", height: 11, span: 24, enabledBy: "showRecommendations" },
];

// A banner aded before every other panel to introduce people to that specific
// section.
const NOVUS_BANNER = new TextPanelBuilder()
  .title("")
  .transparent(true)
  .mode(TextMode.HTML)
  .span(24)
  .height(3)
  .content(`
    <div style="display: flex; height:100%; background: linear-gradient(135deg, #780000 0%, #003049 50%); color: white; border-radius: 12px; align-items: center; text-align: center;">
      <div style="width: 100%;">
        <h2 style="margin: 0; font-size: 2em; font-weight: 700;">
          <img src="https://raw.githubusercontent.com/kubernetes/kubernetes/refs/heads/master/logo/logo.svg" style="height: 1em; width: auto;" alt="Kubernetes Logo">
          Novus Telemetry
        </h2>
        <p style="margin: 0; font-size: 1em; opacity: 0.95;">
         Telemetry data for workloads running in Novus, Kubernetes Container Platform
        </p>
      </div>
    </div>
  `)


export function Component({ goBack, goForward, setDashboardPanels }) {
  const [errors, setErrors] = useState({});
  const [runtimes, setRuntimes] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [deployments, setDeployments] = useState([]);
  const auth = useAuth();
  const env = useEnv();
  const [formData, setFormData] = usePersistentState("feat_novus_formData", {
    runtime: "",
    deployments: [],
    showRecommendations: false,
  });

  const host = env?.["BUN_PUBLIC_PROMETHEUS_ENDPOINT"];

  const getTeams = () => {
    return queryPrometheus(
      host,
      'group(kube_namespace_labels{label_novus_legogroup_io_namespace_type="managed-customer-runtime", label_novus_legogroup_io_team_name!=""}) by (label_novus_legogroup_io_team_name)',
      auth?.user?.id_token,
    ).then((result) => {
      return result.data.result.map((item: any) => item.metric.label_novus_legogroup_io_team_name);
    });
  };

  const getAllRuntimes = () => {
    let query = `group(kube_namespace_labels{label_novus_legogroup_io_namespace_type="managed-customer-runtime", label_novus_legogroup_io_team_name!=""}) by (namespace, label_novus_legogroup_io_team_name)`;
    return queryPrometheus(
      host, query, auth?.user?.id_token).then((result) => {
      return result.data.result.map((item: any) => ({
        namespace: item.metric.namespace,
        team: item.metric.label_novus_legogroup_io_team_name,
      }));
    });
  }

  const getFirstTeam = () => {
    let query = `group(novus_user_team_membership{user="${auth?.user?.profile?.upn.toLowerCase()}"}) by (team)`
    return queryPrometheus(host, query, auth?.user?.id_token).then((result) => {
      return result.data.result[0].metric.team
    })
  }

  const [allTeams, setAllTeams] = useState<Promise<string[]>>(Promise.resolve([]));
  const [allRuntimes, setAllRuntimes] = useState<Promise<{namespace: string, team: string}[]>>(Promise.resolve([]));

  useEffect(() => {
    if (!auth?.isAuthenticated) return;
    setAllTeams(getTeams());
    setAllRuntimes(getAllRuntimes());
  }, [auth?.isAuthenticated]);

  useEffect(() => {
    getFirstTeam().then(res => setSelectedTeam(res))
  }, [auth?.isAuthenticated]);

  const searchTeams = (event) => {
    let ts: any[] = [];
    allTeams.then((items: Array<string>) => {
      items.forEach((team) => {
        if (team.toLowerCase().includes(event.query.toLowerCase())) {
          ts.push(team);
        }
      });
      setTeams(ts);
    })
  }

  const searchRuntimes = (event) => {
    let rts: any[] = [];
    allRuntimes.then((items: Array<{namespace: string, team: string}>) => {
      items.forEach((r) => {
        if (r.namespace.toLowerCase().includes(event.query.toLowerCase()) && (!selectedTeam || r.team === selectedTeam)) {
          rts.push(r.namespace);
        }
      });
      setRuntimes(rts);
    })
  }

  useEffect(() => {
    if (!auth?.isAuthenticated || formData.runtime === "") return;
    formData.deployments = [];
    queryPrometheus(
      host,
      `group(kube_deployment_spec_replicas{namespace="${formData.runtime}"}) by (deployment)`,
      auth?.user?.id_token,
    ).then((result) => {
      setDeployments(result.data.result.map((item: any) => item.metric.deployment));
    });
  }, [host, auth?.isAuthenticated, formData.runtime])

  const genVariables = () => {
    const podFilter = new AdHocVariableBuilder("novus_pod_filter")
      .hide(VariableHide.HideVariable)
      .datasource({ uid: "$prometheus" })
      .build();
    podFilter.filters = [
      { key: "pod", operator: "!~", value: "novus-.*" },
    ];

    return [
      new ConstantVariableBuilder("namespace")
        .label("Novus Runtime / namespace")
        .value(formData.runtime),
      { build: () => podFilter },
          ];
  };

  const genOverviewPanels = () => {
    let overviewPanels = [];

    overviewPanels = overviewPanels.concat([
      // Shows Pods Running
      new StatsPanelBuilder()
        .title("Novus: Pods Ready")
        .description(`
          Kubernetes Pods that are healthy, ready to work, and accept
          requests. If this number is correct, and the app has errors,
          then the issue does not involve with the container platform.
        `.replace(/\s+/g, ' ').trim())
        .height(4)
        .thresholds(new ThresholdsConfigBuilder().mode(ThresholdsMode.Absolute).steps([{value: 0.0, color: "green"}]))
        .interval("5m")
        .withTarget(
          new PrometheusDataqueryBuilder()
            .datasource({ uid: "$prometheus" })
            .expr(`sum(kube_pod_status_phase{phase="Running", namespace="$namespace"})`)
            .instant()
        ),
      // Shows Pods Pending, errors
      new StatsPanelBuilder()
        .title("Novus: Pods not Ready")
        .thresholds(new ThresholdsConfigBuilder().mode(ThresholdsMode.Absolute).steps([{value: 0.0, color: "red"}]))
        .description(`
          Kubernetes Pods that are either pending, with errors or uknown
          state. Might signal an upgrade or errors. If this number is not 0,
          and the app has errors, then the issue might involve container
          platform, or a botched released! Oppsie!
        `.replace(/\s+/g, ' ').trim())
        .height(4)
        .interval("5m")
        .withTarget(
          new PrometheusDataqueryBuilder()
            .datasource({ uid: "$prometheus" })
            .expr(`sum(kube_pod_status_phase{phase=~"(Failed|Unknown|Pending)", namespace="$namespace"})`)
            .instant()
          )
    ]);

    formData.deployments.forEach((deployment) => {
      overviewPanels.push(
        new StatsPanelBuilder()
          .title(`Novus: ${deployment} Pods Ready`)
          .description(`
            Kubernetes Pods for deployment ${deployment} that are healthy, ready to work, and accept
            requests. If this number is correct, and the app has errors,
            then the issue does not involve with the container platform.
          `.replace(/\s+/g, ' ').trim())
          .height(4)
          .thresholds(new ThresholdsConfigBuilder().mode(ThresholdsMode.Absolute).steps([{value: 0.0, color: "green"}]))
          .interval("5m")
          .withTarget(
            new PrometheusDataqueryBuilder()
              .datasource({ uid: "$prometheus" })
              .expr(`max(kube_deployment_status_replicas_available{deployment="${deployment}", namespace="$namespace"})`)
              .instant()
          )
      );
    })

    return overviewPanels;
  };

  const genPanels = () => {
    const panels = NOVUS_LIBRARY_PANELS.filter((panel) =>
      !panel.enabledBy || formData[panel.enabledBy]
    );
    return [NOVUS_BANNER].concat(panels.map((panel) =>
      new PanelBuilder()
        .title(panel.name)
        .height(panel.height || 8)
        .span(panel.span || 12)
        .libraryPanel({ name: panel.name, uid: panel.uid })
    ));
  };

  const validate = () => {
    const newErrors = {};
    if (formData.runtime.trim().length === 0) {
      newErrors.runtime = "A runtime name is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = () => {
    if (!validate()) return;
    setDashboardPanels(FeatureID, genOverviewPanels(), genPanels(), genVariables());
    goForward();
  };

  return (
    <>
      <div className="wizard-content">
        <h3 style={{ marginBottom: "20px", color: "#1e293b" }}>Novus Configuration</h3>
        <p style={{ color: "#64748b", marginBottom: "20px", fontSize: "14px" }}>
          Novus is our internal Kubernetes platform. This feature adds pre-built
          library panels scoped to your runtime.
        </p>

        <div className="form-group">
          <label className="form-label">Team</label>
          <AutoComplete
            value={selectedTeam}
            suggestions={teams}
            completeMethod={searchTeams}
            onChange={(e) => setSelectedTeam(e.value)}
            dropdown
          />
        </div>

        <div className="form-group">
          <label className="form-label">Runtime *</label>
          <AutoComplete
            value={formData.runtime}
            suggestions={runtimes}
            completeMethod={searchRuntimes}
            onChange={(e) => setFormData({ ...formData, runtime: e.value })}
            className={`form-input ${errors.runtime ? "error" : ""}`}
            dropdown
          />
          {errors.runtime && (
            <div className="form-error">⚠️ {errors.runtime}</div>
          )}
          <div className="form-hint">
            The Novus runtime name used to scope the dashboard panels.
          </div>
        </div>

        {formData.runtime != "" && deployments.length > 0 && (
          <ul>
            {deployments.map((deployment) => (
              <li key={deployment}>
                <input
                  type="checkbox"
                  checked={formData.deployments?.includes(deployment)}
                  onChange={_ => {
                    formData.deployments = formData.deployments || [];
                    if (formData.deployments.includes(deployment)) {
                      formData.deployments = formData.deployments.filter(d => d != deployment);
                    } else {
                      formData.deployments.push(deployment);
                    }
                    setFormData({...formData});
                  }}
                />
                {deployment}
              </li>
            ))}
          </ul>
        )}
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', cursor: 'pointer' }}>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={!!formData.showRecommendations}
                onChange={(e) => setFormData({...formData, showRecommendations: !formData.showRecommendations})}
              />
              <span className="toggle-slider"></span>
            </div>
            <span style={{ fontWeight: '500' }}>CPU & Memory Request Recommendations</span>
          </label>
          <div className="form-hint">Include CPU and Memory request recommendation tables in the dashboard</div>
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
