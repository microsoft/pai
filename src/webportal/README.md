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

## Build and Start Webportal Service

Webportal use webpack to bundle the source code. To build a webportal, run ```yarn install``` to install all dependent packages, and then```yarn build```.

Weportal use express as a static server. To start a webportal service, run ```yarn start``` to start a express server and render all the static files.

## Webportal Plugins

Webportal supports custom plugins for extension. Please refer to [plugin doc](https://github.com/microsoft/pai/blob/master/docs/webportal/PLUGINS.md) for more details.

## How to contribute

### Pull Request Checklist

Before sending your pull requests, make sure you followed this list.

- Read contributing guidlines of Open PAI
- Ensure you have signed the [Contributor License Agreement (CLA)](https://cla.developers.google.com/).
- Ensure your code passes the code style check.
- Start a development environment to debug your feature.
- Start a production environment to test your feature.
- Push your branch to github and make a pull request.
- Ensure your pull request passed all the CI checks and has at least one approve from reviewer.

### The overall contributing guildlines of Open PAI

Please refer to [how to contribute to Open PAI](https://github.com/microsoft/pai#how-to-contribute)

### Code style check of webportal

Webportal use [eslint](https://eslint.org/docs/user-guide/getting-started) with [standard config](https://github.com/standard/eslint-config-standard) as linter and [prettier](https://prettier.io/docs/en/index.html) as code formatter.

Pleae refer to [eslint config file](./.eslintrc.js) and [prettier config file](./prettier.config.js) for details. Make sure to run ```yarn lint``` command every time before you push your code, and resolve all the errors and warnings. Otherwise it will break the CI check when you submit your pull request.

If you use modern editors like VS Code. It is highly recommends to install [eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) and [prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) extensions.

> How to do code format with prettier?
> You could use cli like ```prettier --write 'src/**/*.js' 'src/**/*.jsx'``` or use prettier extension in vscode.

### Start a development environment to debug your feature

To run web portal locally, the following services should be started:

- REST Server
- Prometheus
- Grafana
- YARN
- Kubernetes
- Other services your feature requires

Create a ```.env``` file and fill the url of all above services, for example:

```text
REST_SERVER_URI=<urlxxx>
PROMETHEUS_URI=<urlyyy>
YARN_WEB_PORTAL_URI=<urlzzz>
GRAFANA_URI=<urlaaa>
K8S_DASHBOARD_URI=<urlbbb>
K8S_API_SERVER_URI=<urlccc>
WEBHDFS_URI=<urlddd>
EXPORTER_PORT=9100
PROM_SCRAPE_TIME=300s
WEBPORTAL_PLUGINS=[]
AUTHN_METHOD=basic
```

All these values in .env file will be imported as environment variables when running webportal and could be fetched by code.

Next, run ```yarn install``` to install all the dependencies.

Finally, run ```yarn dev``` to start a webpack dev server. And go to ```localhost:9286``` to debug your feature.

### Deploy a production environment to test your feature

Deploy the webportal service into a cluster to test your feature because it will be some trivial differences between development environment and production environment. Refer to [deployment doc](https://github.com/microsoft/pai/blob/master/docs/upgrade/upgrade_to_v0.14.0.md) for more details.
