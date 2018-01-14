# Web Portal

The web portal is the entrance for job and cluster management.
User can submit, monitor, or kill the job through the web UI.
Cluster operator can also see and manage cluster state through web portal. 

## Deployment

The [readme](../service-deployment/README.md) in service deployment introduces the overall installation process, including that of the web portal. 
The following parameters in the [clusterconfig.yaml](../service-deployment/clusterconfig-example.yaml) are of interest to web portal:

* `REST_SERVER_URI`: String, root url of the rest server, for example, http://10.0.3.9:9186
* `GRAFANA_URI`: String, root url of the grafana portal, for example, http://10.0.3.9:9090
* `K8S_DASHBOARD_URI`: String, root url of the kubernetes dashboard. For example, http://10.0.3.9:9090
* `SERVER_PORT`: Int, the port to use when launching WebPortal, for example, 9286 for default

## Usage

### Submit job

Click the tab "Submit Job" to show a button asking you to select a json file for the submission. The job config file must follow the format shown in [job tutorial](../job-tutorial/README.md).

### View job status

Click the tab "Job View" to see the list of all jobs. Click on each job to see its status in detail and in real time.

### View cluster status

Click the tab "Cluster View" to see the status of the whole cluster. Specifically:

* Services: Status of all services of each machine.
* Hardware: Hardware metrics of each machine.
* K8s Dashboard: The Kubernetes Dashboard.

### Read documents

Click the tab "Documents" to read a tutorial of submitting a job, or to download the `pai-fs` tool.