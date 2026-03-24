export function queryPrometheus(query: string, token?: string) {
  const host =
    "https://istar-proxy.novus-cloud-tools.prod.novus.legogroup.io/api/datasources/proxy/uid/APP-02358-mimir-prod";
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${host}/api/v1/query?query=${encodeURIComponent(query)}`;
  return fetch(url, { headers })
    .then((res) => res.text())
    .then((text) => {
      try {
        const data = JSON.parse(text);
        return data;
      } catch (error) {
        console.error("Error parsing JSON:", error);
        throw error;
      }
    });
}
