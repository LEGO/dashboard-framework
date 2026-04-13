# Deploying Dashboard Framework

You can run the Dashboard Framework locally on a container
(docker or podman) by running:

```shell
podman run -d \
  -p 3000:3000 \
  ghcr.io/LEGO/dashboard-framework:latest
```

Open a browser to [localhost:3000](http://localhost:3000).

## Compose file

This is an example on using docker-compose.

```yaml
services:
  dashboard-framework:
    image: ghcr.io/LEGO/dashboard-framework:latest
    ports:
      - "3000:3000"
    environment:
      # Read more about various URL
      BUN_PUBLIC_GRAFANA_BASEURL: "https://example.grafana.com"
    restart: unless-stopped
```

## Environment Variables
All runtime configuration is passed to the app via environment variables
prefixed with `BUN_PUBLIC_`. These are **not secrets**. They are served
to the browser through the `/api/env` endpoint. Do not put credentials or
tokens in these variables.

All the variables are optional, setting them up will enable specific features.

| variable | example | description |
| --- | --- | --- |
| `BUN_PUBLIC_GRAFANA_BASEURL` | `https://example.grafana.com` | The base URL of your Grafana Instance, used for import shortcuts  |
| `BUN_PUBLIC_PROMETHEUS_ENDPOINT` | `https://prom.company.com` | The base URL of your Prometheus instance. Features use this to pre-fill datasource references in generated Grafana dashboards. Used for autocomplete |
| `BUN_PUBLIC_OIDC_AUTHORITY` | `https://sso.company.com` | (see SSO/OIDC Setup below ) |
| `BUN_PUBLIC_ODIC_CLIENT_ID` | `dashboard-framework` | (see SSO/OIDC Setup below ) |

## SSO / OIDC setup

To enable SSO you need to set the following env variables:

* `BUN_PUBLIC_OIDC_AUTHORITY`, ex: `https://sso.company.com`
* `BUN_PUBLIC_ODIC_CLIENT_ID`, ex: `dashboard-framework`

The app uses the **authorization code flow** and sets its redirect URI
automatically to `window.location.origin`, so register that as an allowed
redirect URI in your identity provider.

Omitting these two variables disables authentication entirely, the app remains
fully functional without it.

The Dashboard Framework will use SSO to get a toke for various queries if
requred by different dashboard features, like prometheus autocomplete.

