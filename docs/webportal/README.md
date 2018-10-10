# Web Portal

## Goal

The web portal is the entrance for job and cluster management. User can submit, monitor, or kill the job through the web UI. Cluster operator can also see and manage cluster state through web portal.

## Architecture

An [express](https://expressjs.com/) served, [AdminLTE](https://adminlte.io/) themed, and [EJS](http://ejs.co/) rendered static web application.

## Dependencies

Since [job toturial](../job_tutorial.md) is included in the document tab, make sure **`docs`** directory is exists as a sibling of `web-portal` directory.

To run web portal, the following services should be started, and url of services should be correctly configured:

* [REST Server](../rest-server)
* [Prometheus](../../src/prometheus)
* [Grafana](../grafana)
* YARN
* Kubernetes

## Build

For deployment

1. Run `npm run yarn install` to install dependencies.
2. Run `npm run build` to bundle the JavaScript/CSS modules and generate HTML pages.

---

For development

1. Run `npm run yarn install` to install dependencies.
2. Run `npm run build:dev` to bundle the JavaScript/CSS modules and generate HTML pages,
   also watch the related source file, re-bundle them when file is mofified.
3. Another `npm start` is also needed to keep the server running, see [Deployment](#deployment)

## Configuration

If web portal is deployed within PAI cluster, the following config field could be change in the `webportal` section in [services-configuration.yaml](../../examples/cluster-configuration/services-configuration.yaml) file:

* `server-port`: Integer. The network port to access the web portal. The default value is 9286.

---

If web portal is deployed as a standalone service, the following envioronment variables must be configured:

* `REST_SERVER_URI`: URI of [REST Server](../rest-server)
* `PROMETHEUS_URI`: URI of [Prometheus](../../src/prometheus)
* `YARN_WEB_PORTAL_URI`: URI of YARN's web portal
* `GRAFANA_URI`: URI of [Grafana](../grafana)
* `K8S_DASHBOARD_URI`: URI of Kubernetes' dashboard
* `K8S_API_SERVER_URI`: URI of Kubernetes' api server
* `EXPORTER_PORT`: Port of node exporter

And the following field could be configured optionally:

* `LOG_LEVEL`: The log level of the service, default value is `debug`, could be
    * `error`
    * `warn`
    * `info`
    * `debug`
    * `silly`
* `SERVER_PORT`: The network port to access the web portal. The default value is 9286.

## Deployment

The deployment of web portal goes with the bootstrapping process of the whole PAI cluster, which is described in detail in [Tutorial: Booting up the cluster](../pai-management/doc/cluster-bootup.md).

---

If web portal is need to be deplyed as a standalone service, follow these steps:

1. Go into the `webportal` directory.
2. Make sure the environment variables is fully configured.
   They will be injected to `dist/env.js` for browser use.
3. Run `npm start` to start server.

## Upgrading

Web portal is a stateless service, so it could be upgraded without any extra operation.

## Service Metrics

N/A

## Service Monitoring

N/A

## High Availability

Web portal is a stateless service, so it could be extended for high availability without any extra operation.

## Runtime Requirements

To run web portal on system, a [Node.js](https://nodejs.org/) 6+ runtime is required, with [npm](https://www.npmjs.com/) and [yarn](https://yarnpkg.com/)(JavaScript package manager) installed.

## Usage

### Submit a job

Click the tab "Submit Job" to show a button asking you to select a json file for the submission. The job config file must follow the format shown in [job tutorial](../job_tutorial.md).

### View job status

Click the tab "Job View" to see the list of all jobs. Click on each job to see its status in detail and in real time.

### View cluster status

Click the tab "Cluster View" to see the status of the whole cluster. Specifically:

* Services: Status of all services of each machine.
* Hardware: Hardware metrics of each machine.
* K8s Dashboard: The Kubernetes Dashboard.

### Read documents

Click the tab "Documents" to read the tutorial of submitting a job.

## Trouble Shooting and Q&A

TBD
