# Web Portal

The web portal is the entrance for job and cluster management.
User can submit, monitor, or kill the job through the web UI.
Cluster operator can also see and manage cluster state through web portal. 

## Deployment

The [readme](../service-deployment/README.md) in service deployment introduces the overall installation process, including that of the web portal. 
The following parameters in the [clusterconfig.yaml](../service-deployment/clusterconfig-example.yaml) are of interest to web portal:
* REST_SERVER_URI: String, uri of the rest server, for example, http://10.0.3.9:9186
* CLUSTER_STATUS_URI: String, uri of the prometheus monitoring dashboard, for example, http://10.0.3.9:9090
* SERVER_PORT: Int, the port to use when launching WebPortal, for example, 9286 for default

## Usage

### Documentation

Click the tab "Documentation" to view the documentation of our system.

### View cluster status

Click the tab "Cluster Status" to go to the dashboard of prometheus, where it shows all components running on the cluster.

### View job status

Click the tab "View Jobs" to display the list of jobs. 
* Click the name of a job to go to a page that shows more details of the job.
* Click the "DELETE" button to delete the job.

### Submit job

Click the tab "Submit Job" to show a button asking you to select a json file for the submission. The job config file must follow the format shown in [job tutorial](../job-tutorial/README.md).

### Download

Click the tab "Download" to show a list of files can be downloaded.