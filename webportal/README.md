# WebPortal
WebPortal is the entrance for users to see the cluster, view job status and operate jobs. You very easily use it to submit, delete and see details of jobs.

## Installation
You only need to config several parameters in clusterconfig.yaml, and then it will automatically install WebPortal.
* REST_SERVER_ADDR: String, the address of the rest server, for example, http://10.0.0.3:9273
* K8S_DASHBOARD_ADDR: String, the address of the kubernetes dashboard, for example, http://10.0.0.4:9090
* WEBPORTAL_PORT: Int, the port to use when launching WebPortal, for example, 6969

## Usage

### Documentation
When you click the tab "Documentation", you can view the documentation of our platform. It will instruct you to use the platform properly.

### View cluster status
When you click the tab "Cluster Status", it will direct to the dashboard of kubernetes. Then you can see all components running on the cluster.

### View job status
When you click the tab "View Jobs", it will display the list of jobs. But you can only see some simple information in this page.
* If you want to see more, you can click the name of the job, then it will direct to a hadoop website. You can see the detail information here.
* If you want to delete a job, you can just click the "DELETE" button of the job. It will refresh the page after deleting successfully.

### Submit job
When you click the tab "Submit Job", you can see a button asking you to select a file to submit. The job config file must follow the format shown in "documentation -> job guide".

### Download
When you click the tab "Download", it will show you the list you can download. You can download it by clicking its name.