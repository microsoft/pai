# Webportal of Open PAI

## Introduction

Webportal is the front end of Open PAI cluster. It has several functions, such as:

- Home page. Overview of cluster jobs and resources.
- Dashboard. Include some metrics about cluster, like resource percent, node condition etc.
- Submit Job. A main entrance of submitting job to Open PAI.
- Jobs. Includes job list and job details.
- Virtual Clusters. Manage virtual clusters.
- Administration. Some management operation of admin.
- Plugins. Custom plugins configured by cluster.

## Infrastructure

- Bundler: Webpack. [config file](./config/webpack.common.js)
- Linter & Formatter: ESLint + Prettier
- Pages
  - Framework: AdminLTE
  - Content
    - Legacy: jquery + ejs template
    - Modern: react + css modules + office-ui-fabric-react

## Build and Start Webportal Service

### Prerequisites

To run web portal, the following services should be started:

- REST Server
- Prometheus
- Grafana
- YARN
- Kubernetes
- Other services your feature requires

Create a ```.env``` file and fill the url of all above services, for example:

```text
REST_SERVER_URI=<hostname>/rest-server
PROMETHEUS_URI=<hostname>
YARN_WEB_PORTAL_URI=<hostname>/yarn
GRAFANA_URI=<hostname>/grafana
K8S_DASHBOARD_URI=<hostname>/kubernetes-dashboard
WEBHDFS_URI=<hostname>/webhdfs
EXPORTER_PORT=9100
PROM_SCRAPE_TIME=300s
AUTHN_METHOD=basic
WEBPORTAL_PLUGINS=[]
```

All these values in .env file will be imported as global object [`window.ENV`](./src/app/env.js.template) when running webportal.

### Devlopment Mode

- Run ```yarn install``` to install all the dependencies
- Run ```yarn dev``` to start a webpack dev server

### Production Mode

- Run ```yarn install``` to install all dependencies
- Run ```yarn build``` to build static files
- Run ```yarn start``` to start webportal's static file host server

## Code style check of webportal

Webportal use [eslint](https://eslint.org/docs/user-guide/getting-started) with [standard config](https://github.com/standard/eslint-config-standard) as linter and [prettier](https://prettier.io/docs/en/index.html) as code formatter.

Pleae refer to [eslint config file](./.eslintrc.js) and [prettier config file](./prettier.config.js) for details. Make sure to run ```yarn lint``` command every time before you push your code, and resolve all the errors and warnings. Otherwise it will break the CI check when you submit your pull request.

If you use modern editors like VS Code. It is highly recommends to install [eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) and [prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) extensions.

> How to do code format with prettier?
> You could use cli like ```prettier --write 'src/**/*.js' 'src/**/*.jsx'``` or use prettier extension in vscode.

## Webportal Plugins

Webportal supports custom plugins for extension. Please refer to [plugin doc](https://github.com/microsoft/pai/blob/master/docs/webportal/PLUGINS.md) for more details.

## How to contribute

Please refer to [how to contribute to Open PAI](https://github.com/microsoft/pai#how-to-contribute)
