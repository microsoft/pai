# The PAI benchmark

This benchmark is for measuring PAI API, capability, performance, stability and etc.

The benchmark runs on PAI as a normal job, consistents of many metric jobs. All metric jobs could be run separatly as needed.

## API & Protocol

Fully test and demostrate API & Protocol, report the supported protocols.

### User APIs

TODO we need to cover all user APIs with an automatically benchmark.

- [ ] Check all user APIs

### Job APIs

TODO we need to cover all job APIs with an automatically benchmark.

- [ ] Check all job APIs

### Metric APIs

TODO we need to cover all job APIs with an automatically benchmark.

- [ ] Each metrics works as expected

## Features, Capability and Limitations

Consistent of bunch of extrame jobs which would push PAI into crash, try to figure out the limitation.

### Azure RDMA

- [ ] Based on this knowledge(https://github.com/Microsoft/pai/blob/master/docs/pai-management/doc/azure/enable-az-rdma.md#knowledge-)， please ensure all worker machines in your cluster is rdma-capable and they are all in the same available set.
- [ ] Build the intel-mpi bench marking image. https://github.com/Microsoft/pai/tree/master/examples/azure-rdma-inte-mpi-benchmark-with-horovod-image
- [ ] Submit the job through the webportal with the json in this link. Note: Please change the "image" field with yours image url.

### Cleaner

- [ ] Go to PAI web portal, click Submit Job in left toolbar.
- [ ] Import job using src/cleaner/test/job/cleaner-test-job.json as template, change name if needed.
- [ ] Click Submit button to submit job.
- [ ] Go to Jobs page, keep monitoring the job you just submitted.
- [ ] If everything work as expected, the job will fail because it is killed by cleaner. Click "Go to Tracking Page", you will find info "Docker container killed by cleaner due to disk pressure

### Memory stress

### Disk stress

- [ ] test huge docker log (test whether PAI tolerant huge docker log, may using log rotation)
- [ ] test huge images
- [ ] test massive amount of images
- [ ] test write big file in container
- [ ] test node disk pressures behaviour

### Massive count of jobs, test the scheduler

## UI & UX

### Feedback menu

Version beside the "Feedback" menu item in web portal, can be modified in "version" field of "src/webportal/package.json"

### User management

(TODO: API test also needed)

- [ ] Login
- [ ] Sign out
- [ ] Change password
- [ ] Admin user: list users, add users, editor users

### Virtual Clusters

- [ ] Displayed VC names, capacity, memory, CPU, GPU consist with configuration
- [ ] and “Yarn Page” can be accessed and content correct

### Job views

#### submit job

- [ ] Check all job named launcher-test-* and cntk-test-* are succeeded. These jobs are submitted automaticly by end-to-end test script that will submit jobs once a half hour.
- [ ] Submit form can import job config file and fill in corresponding fields.
- [ ] Incorrect json format jobs cannot be accepted.
- [ ] Non-login user has no permission to submit job
- [ ] Submit jobs to different VCs with/without permission and check result
- [ ] Submit sample cntk/tensorflow/etc. jobs and check whether jobs can finish successfully.

#### monitor job

- [ ] Job list
- [ ] Job search
- [ ] Job sorting according to each column
- [ ] Job can be stopped by job owner and button disabled to other users
- [ ] View job config
- [ ] SSH infos
- [ ] Job logs can be accessed during job running and after job finishes.
- [ ] Yarn tracking page can be accessed
- [ ] Job level metrics (go to jobs page, and select one running job then click "Go to Job Metrics Page")
- [ ] Task level metrics (go to jobs page, and select one running job then click "Go to Job Metrics Page")
- [ ] Task role level metrics (go to jobs page, and select one running job then click "Go to Job Metrics Page")

### Dashboard

- [ ] Landing page dashboard
- [ ] The Grafana page shown correctly (e.g., no "N/A", "no data point")
- [ ] K8s dashboard: (admin user only)
- [ ] All pods and daemon sets are running well
- [ ] User can view pod's log and exec command from kubernetes dashboard
- [ ] Service view: (admin user only)
- [ ] ode name, role and count consist with configuration file
- [ ] Service status green
- [ ] Hardware view: (admin user only)
- [ ] IP address, machine name correct
- [ ] No ‘N/A’ value in CPU/Memory/GPU/GPU Mem/Disk/Ethernet status
- [ ] Grafana view: Cluster metrics, Node metrics

## Performance

- [ ] Stand training task, stand dataset, measuring the performance overhead of PAI.
- [ ] Horizontal scale distribute training task, measuring the scale factor.

## Job Examples

Run all the training examples.

## Reliability and Stress

Long run job with heavy load, watch:

- [ ] Job stablility (job retry)
- [ ] PAI stablility (service restart)
- [ ] Metrics (Both PAI and Job)
