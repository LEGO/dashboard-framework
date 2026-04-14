import { useState, useEffect, type ReactNode } from "react";
import { useAuth } from "react-oidc-context";
import { useEnv } from "../components/env.tsx";

import { AutoComplete } from "primereact/autocomplete";

import {
  PanelBuilder,
  ConstantVariableBuilder,
  AdHocVariableBuilder,
  VariableHide,
  ThresholdsConfigBuilder,
  ThresholdsMode,
  MappingType,
  FieldColorModeId,
} from "@grafana/grafana-foundation-sdk/dashboard";

import { DataqueryBuilder as PrometheusDataqueryBuilder } from "@grafana/grafana-foundation-sdk/prometheus";
import { PanelBuilder as StatsPanelBuilder } from "@grafana/grafana-foundation-sdk/stat";
import { PanelBuilder as TextPanelBuilder, TextMode } from "@grafana/grafana-foundation-sdk/text";

import { usePersistentState } from "../lib/usePersistentState.ts";
import { queryPrometheus } from "../lib/prometheusQuerier.ts";

export const FeatureID = "novus";
export const FeatureName = "Novus Runtime Information";
export const FeatureIcon =
  "https://raw.githubusercontent.com/kubernetes/kubernetes/refs/heads/master/logo/logo.svg";

// ---- Types ----

interface Resources {
  deployments: string[];
  statefulsets: string[];
  nginxHosts: string[];
  haproxyIngresses: string[];
}

interface FormData {
  runtime: string;
  showRecommendations: boolean;
  resources: Resources;
}

// ---- Constants ----

const NOVUS_LIBRARY_PANELS = [
  { name: "Novus Deployment timeline", uid: "cffw1fuyo9x4wb" },
  { name: "Novus CPU Usage", uid: "affw0w9ciuw3kf" },
  { name: "Novus Memory Usage", uid: "affw0vxt0u03kd" },
  { name: "Novus Policy Alerts", uid: "ffee6egctyio0e" },
  { name: "CPU Requests Recommendations", uid: "bfio81viwd4hse", height: 11, span: 24, enabledBy: "showRecommendations" },
  { name: "Memory Requests Recommendations", uid: "afio83xesz08wf", height: 11, span: 24, enabledBy: "showRecommendations" },
];

const EMPTY_RESOURCES: Resources = {
  deployments: [],
  statefulsets: [],
  nginxHosts: [],
  haproxyIngresses: [],
};

// A banner aded before every other panel to introduce people to that specific
// section.
const NOVUS_BANNER = new TextPanelBuilder()
  .title("")
  .transparent(true)
  .mode(TextMode.HTML)
  .span(24)
  .height(3).content(`
    <div style="display: flex; height:100%; background: linear-gradient(135deg, #780000 0%, #003049 50%); color: white; border-radius: 12px; align-items: center; text-align: center;">
      <div style="width: 100%;">
        <h2 style="margin: 0; font-size: 2em; font-weight: 700;">
          <img src="https://raw.githubusercontent.com/kubernetes/kubernetes/refs/heads/master/logo/logo.svg" style="height: 1em; width: auto;" alt="Kubernetes Logo">
          <a href="https://grafana.istar.thelegogroup.com/d/fdwat7xhijda8b/novus-runtime-overview?orgId=1&from=now-2d&to=now&timezone=browser&var-namespace=\${namespace}&var-no_runtimes=455&var-no_onpremise_runtimes=311&var-is_openshift=0&refresh=auto">Novus Telemetry</a>
        </h2>
        <p style="margin: 0; font-size: 1em; opacity: 0.95;">
         Telemetry data for workloads running in Novus, Kubernetes Container Platform
        </p>
      </div>
    </div>
  `);

// ---- Panel builders (pure, no React) ----

const normalizeDesc = (s: string) => s.replace(/\s+/g, " ").trim();

function buildVariables(runtime: string) {
  const podFilter = new AdHocVariableBuilder("novus_pod_filter")
    .hide(VariableHide.HideVariable)
    .datasource({ uid: "$prometheus" })
    .build();
  podFilter.filters = [{ key: "pod", operator: "!~", value: "novus-.*" }];

  return [
    new ConstantVariableBuilder("namespace")
      .label("Novus Runtime / namespace")
      .value(runtime),
    { build: () => podFilter },
  ];
}

function buildOverviewPanels(resources: Resources) {
  const panels: any[] = [
    new StatsPanelBuilder()
      .title("Novus: Unready Pods")
      .thresholds(
        new ThresholdsConfigBuilder()
          .mode(ThresholdsMode.Absolute)
          .steps([{ value: 1.0, color: "red" }]),
      )
      .description(normalizeDesc(`
        Kubernetes Pods that are either pending, with errors or unknown state.
        Might signal an upgrade or errors. If this number is not 0 and the app
        has errors, the issue might involve container platform or a botched release.
      `))
      .height(4)
      .interval("5m")
      .withTarget(
        new PrometheusDataqueryBuilder()
          .datasource({ uid: "$prometheus" })
          .expr(`sum(kube_pod_status_phase{phase=~"(Failed|Unknown|Pending)", namespace="$namespace"})`)
          .instant(),
      ),
  ];

  const deployRegex = resources.deployments.join("|");
  if (deployRegex) {
    panels.push(
      new StatsPanelBuilder()
        .title("Novus Deployments")
        .description("Kubernetes deployments statuses")
        .height(4)
        .withTarget(
          new PrometheusDataqueryBuilder()
            .datasource({ uid: "$prometheus" })
            .expr(`max(kube_deployment_status_condition{namespace=~"$namespace", condition="Available", deployment=~"${deployRegex}", status="true"}) by (deployment)`)
            .legendFormat("{{deployment}}")
            .instant()
        )
        .wideLayout(false)
        .mappings([{
          type: MappingType.ValueToText,
          options: {
            "0": { text: "Unhealthy", color: "red" },
            "1": { text: "Healthy", color: "green" },
          },
        }])
    );
  }

  resources.nginxHosts.forEach((nginxHost) => {
    const promTarget = (expr: string, legend: string) =>
      new PrometheusDataqueryBuilder()
        .datasource({ uid: "$prometheus" })
        .expr(expr)
        .legendFormat(legend);

    panels.push(
      new StatsPanelBuilder()
        .title(nginxHost)
        .description("Overview of response codes for this ingress host over the dashboard time range")
        .height(4)
        .withTarget(promTarget(
          `floor(sum(increase(nginx_ingress_controller_requests{namespace="$namespace", host="${nginxHost}", status=~"[1-3].."}[$__range])))`,
          "Successes"
        ))
        .withTarget(promTarget(
          `floor(sum(increase(nginx_ingress_controller_requests{namespace="$namespace", host="${nginxHost}", status=~"4.."}[$__range])))`,
          "4xx's"
        ))
        .withTarget(promTarget(
          `floor(sum(increase(nginx_ingress_controller_requests{namespace="$namespace", host="${nginxHost}", status=~"5.."}[$__range])))`,
          "5xx's"
        ))
        .overrideByQuery("A", [{ id: "color", value: { mode: FieldColorModeId.Fixed, fixedColor: "green" } }])
        .overrideByQuery("B", [{ id: "color", value: { mode: FieldColorModeId.Fixed, fixedColor: "orange" } }])
        .overrideByQuery("C", [{ id: "color", value: { mode: FieldColorModeId.Fixed, fixedColor: "red" } }])
    );
  });

  return panels;
}

function buildPanels(showRecommendations: boolean) {
  const panels = NOVUS_LIBRARY_PANELS.filter((p) => !p.enabledBy || showRecommendations);
  return [NOVUS_BANNER].concat(
    panels.map((p) =>
      new PanelBuilder()
        .title(p.name)
        .height(p.height || 8)
        .span(p.span || 12)
        .libraryPanel({ name: p.name, uid: p.uid })
    )
  );
}

// ---- Sub-components ----

function K8sIcon({ type, height }: { type: string; height: number }) {
  return (
    <img
      height={height}
      src={`https://raw.githubusercontent.com/kubernetes/community/refs/heads/main/icons/svg/resources/unlabeled/${type}.svg`}
      alt={type}
    />
  );
}

interface ResourceListProps {
  title: string;
  icon: ReactNode;
  resources: string[];
  selected: string[];
  onToggle: (resource: string) => void;
}

function ResourceList({ title, icon, resources, selected, onToggle }: ResourceListProps) {
  if (resources.length === 0) return null;
  return (
    <div className="form-group">
      <h3>{icon} {title}</h3>
      <ul className="novus-resources">
        {resources.map((resource) => (
          <li className="novus-resource" key={resource}>
            <input
              type="checkbox"
              checked={selected.includes(resource)}
              onChange={() => onToggle(resource)}
            />
            <span>{resource}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---- Data hook ----

interface NovusData {
  allTeams: string[];
  allRuntimes: { namespace: string; team: string }[];
  selectedTeam: string;
  setSelectedTeam: (team: string) => void;
  deployments: string[];
  statefulsets: string[];
  nginxIngresses: string[];
}

function useNovusData(
  host: string | undefined,
  token: string | undefined,
  upn: string | undefined,
  isAuthenticated: boolean,
  runtime: string,
): NovusData {
  const [allTeams, setAllTeams] = useState<string[]>([]);
  const [allRuntimes, setAllRuntimes] = useState<{ namespace: string; team: string }[]>([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [deployments, setDeployments] = useState<string[]>([]);
  const [statefulsets, setStatefulsets] = useState<string[]>([]);
  const [nginxIngresses, setNginxIngresses] = useState<string[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;

    queryPrometheus(
      host,
      'group(kube_namespace_labels{label_novus_legogroup_io_namespace_type="managed-customer-runtime", label_novus_legogroup_io_team_name!=""}) by (label_novus_legogroup_io_team_name)',
      token,
    ).then((r) => setAllTeams(r.data.result.map((i: any) => i.metric.label_novus_legogroup_io_team_name)));

    queryPrometheus(
      host,
      `group(kube_namespace_labels{label_novus_legogroup_io_namespace_type="managed-customer-runtime", label_novus_legogroup_io_team_name!=""}) by (namespace, label_novus_legogroup_io_team_name)`,
      token,
    ).then((r) => setAllRuntimes(r.data.result.map((i: any) => ({
      namespace: i.metric.namespace,
      team: i.metric.label_novus_legogroup_io_team_name,
    }))));

    queryPrometheus(
      host,
      `group(novus_user_team_membership{user="${upn?.toLowerCase()}"}) by (team)`,
      token,
    ).then((r) => setSelectedTeam(r.data.result[0]?.metric.team ?? ""));
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !runtime) return;

    queryPrometheus(host, `group(kube_deployment_spec_replicas{namespace="${runtime}"}) by (deployment)`, token)
      .then((r) => setDeployments(r.data.result.map((i: any) => i.metric.deployment)));

    queryPrometheus(host, `group(nginx_ingress_controller_requests{namespace="${runtime}"}) by (host)`, token)
      .then((r) => setNginxIngresses(r.data.result.map((i: any) => i.metric.host)));

    queryPrometheus(host, `group(kube_statefulset_status_replicas{namespace="${runtime}"}) by (statefulset)`, token)
      .then((r) => setStatefulsets(r.data.result.map((i: any) => i.metric.statefulset)));
  }, [host, isAuthenticated, runtime]);

  return { allTeams, allRuntimes, selectedTeam, setSelectedTeam, deployments, statefulsets, nginxIngresses };
}

// ---- Component ----

interface Props {
  goBack?: () => void;
  goForward?: () => void;
  setDashboardPanels: (id: string, overview: any[], panels: any[], variables: any[]) => void;
}

export function Component({ goBack, goForward, setDashboardPanels }: Props) {
  const auth = useAuth();
  const env = useEnv();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [teams, setTeams] = useState<string[]>([]);
  const [runtimes, setRuntimes] = useState<string[]>([]);
  const [formData, setFormData] = usePersistentState<FormData>("feat_novus_formData", {
    runtime: "",
    showRecommendations: false,
    resources: EMPTY_RESOURCES,
  });

  const host = env?.["BUN_PUBLIC_PROMETHEUS_ENDPOINT"];
  const token = auth?.user?.id_token;
  const upn = auth?.user?.profile?.upn as string | undefined;

  const { allTeams, allRuntimes, selectedTeam, setSelectedTeam, deployments, statefulsets, nginxIngresses } =
    useNovusData(host, token, upn, !!auth?.isAuthenticated, formData.runtime);

  // Clear selected resources when runtime changes
  useEffect(() => {
    if (!formData.runtime) return;
    setFormData({ ...formData, resources: EMPTY_RESOURCES });
  }, [formData.runtime]);

  const searchTeams = (event: { query: string }) => {
    const q = event.query.toLowerCase();
    setTeams(allTeams.filter((t) => t.toLowerCase().includes(q)));
  };

  const searchRuntimes = (event: { query: string }) => {
    const q = event.query.toLowerCase();
    setRuntimes(
      allRuntimes
        .filter((r) => r.namespace.toLowerCase().includes(q) && (!selectedTeam || r.team === selectedTeam))
        .map((r) => r.namespace)
    );
  };

  const toggleResource = (key: keyof Resources, resource: string) => {
    const arr = formData.resources[key];
    setFormData({
      ...formData,
      resources: {
        ...formData.resources,
        [key]: arr.includes(resource) ? arr.filter((r) => r !== resource) : [...arr, resource],
      },
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.runtime.trim()) newErrors.runtime = "A runtime name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = () => {
    if (!validate()) return;
    setDashboardPanels(
      FeatureID,
      buildOverviewPanels(formData.resources),
      buildPanels(formData.showRecommendations),
      buildVariables(formData.runtime),
    );
    goForward?.();
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
          <div className="form-hint">Name of the team owning the runtime. Defaults to your team</div>
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
          {errors.runtime && <div className="form-error">⚠️ {errors.runtime}</div>}
          <div className="form-hint">The Novus runtime name used to scope the dashboard panels.</div>
        </div>

        <div className="form-group">
          <label style={{ display: "flex", alignItems: "center", gap: "var(--spacing-md)", cursor: "pointer" }}>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={formData.showRecommendations}
                onChange={() => setFormData({ ...formData, showRecommendations: !formData.showRecommendations })}
              />
              <span className="toggle-slider" />
            </div>
            <span style={{ fontWeight: "500" }}>CPU & Memory Request Recommendations</span>
          </label>
          <div className="form-hint">Include CPU and Memory request recommendation tables in the dashboard</div>
        </div>

        {formData.runtime && (
          <>
            <ResourceList
              title="Ingresses"
              icon={<K8sIcon type="ing" height={25} />}
              resources={nginxIngresses}
              selected={formData.resources.nginxHosts}
              onToggle={(r) => toggleResource("nginxHosts", r)}
            />
            <ResourceList
              title="Deployments"
              icon={<K8sIcon type="deploy" height={25} />}
              resources={deployments}
              selected={formData.resources.deployments}
              onToggle={(r) => toggleResource("deployments", r)}
            />
            <ResourceList
              title="Statefulsets"
              icon={<K8sIcon type="sts" height={25} />}
              resources={statefulsets}
              selected={formData.resources.statefulsets}
              onToggle={(r) => toggleResource("statefulsets", r)}
            />
          </>
        )}
      </div>

      <div className="wizard-footer">
        {goBack && <button className="btn btn-secondary" onClick={goBack}>← Previous</button>}
        {goForward && <button className="btn btn-primary" onClick={onSubmit}>Next →</button>}
      </div>
    </>
  );
}
