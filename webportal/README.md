# Web Portal

The web portal is the entrance for job and cluster management.
User can submit, monitor, or kill the job through the web UI.
Cluster operator can also see and manage cluster state through web portal. 

## Deployment

The deployment of web portal goes with the bootstrapping process of the whole PAI cluster, which is described in detail in [Tutorial: Booting up the cluster](https://github.com/Microsoft/pai/blob/master/pai-management/doc/cluster-bootup.md). To configure web portal, change the following field(s) in the `webportal` section in [services-configuration.yaml](../cluster-configuration/services-configuration.yaml) file:

* `server-port`: Integer. The network port to access the web portal. The default value is 9286.

## Usage

### Submit a job

Click the tab "Submit Job" to show a button asking you to select a json file for the submission. The job config file must follow the format shown in [job tutorial](../docs/job_tutorial.md).

### View job status

Click the tab "Job View" to see the list of all jobs. Click on each job to see its status in detail and in real time.

### View cluster status

Click the tab "Cluster View" to see the status of the whole cluster. Specifically:

* Services: Status of all services of each machine.
* Hardware: Hardware metrics of each machine.
* K8s Dashboard: The Kubernetes Dashboard.

### Read documents

Click the tab "Documents" to read the tutorial of submitting a job.
