// Run Queries against a proxy
export function queryPrometheus(host: string, query: string, token?: string) {
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
