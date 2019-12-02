# OpenPAI Release Note

## Nov 2019 (version 0.16.0)

Welcome to the Nov 2019 release of OpenPAI. There are a number of updates in this version that we hope you will like, some of the key highlights include:

- Kubespray - Deploy Kubernetes with kubespray
    - Kubernetes Deployment, GPU drivers installation, Nvidia docker runtime [#3757](https://github.com/microsoft/pai/pull/3757), [#3842](https://github.com/microsoft/pai/pull/3842), [#3873](https://github.com/microsoft/pai/pull/3873)
    - Add new worker node [#3846](https://github.com/microsoft/pai/pull/3846)
    - Clean up cluster environment where OpenPAI is deployed before [#3879](https://github.com/microsoft/pai/pull/3879), [#3883](https://github.com/microsoft/pai/pull/3883)
    - Ansible playbooks to uninstall GPU drivers installed by apt [#3899](https://github.com/microsoft/pai/pull/3899)

- OpenPAI on RBAC enabled kubernetes cluster
    - RBAC for Prometheus [#3716](https://github.com/microsoft/pai/pull/3716), [#3799](https://github.com/microsoft/pai/pull/3799), [#3844](https://github.com/microsoft/pai/pull/3844), [#3865](https://github.com/microsoft/pai/pull/3865), [#3896](https://github.com/microsoft/pai/pull/3896) 
    - RBAC for framework-controller, hived-scheduler, kube-runtime [#3709](https://github.com/microsoft/pai/pull/3709), [#3739](https://github.com/microsoft/pai/pull/3739)
    - RBAC for watchdog [#3721](https://github.com/microsoft/pai/pull/3721)
    - RBAC for rest-server [#3719](https://github.com/microsoft/pai/pull/3719), [#3433](https://github.com/microsoft/pai/pull/3433), [#3750](https://github.com/microsoft/pai/pull/3750)
    
- HiveD
    - Hived scheduler deployment [#3495](https://github.com/microsoft/pai/pull/3495), [#3579](https://github.com/microsoft/pai/pull/3579)
    - Hived as the default k8s scheduler [#3599](https://github.com/microsoft/pai/pull/3599)
    - [Job Near FIFO scheduling](https://github.com/microsoft/pai/issues/3704) [#3726](https://github.com/microsoft/pai/pull/3726), [#3731](https://github.com/microsoft/pai/pull/3731)
    - [Expose LazyPreemptionStatus](https://github.com/microsoft/pai/issues/3850) [#3917](https://github.com/microsoft/pai/pull/3917)
    - Disable leader election [#3928](https://github.com/microsoft/pai/pull/3928)
    
- Kube-runtime
    - Port kube runtime [#3013](https://github.com/microsoft/pai/pull/3013)
    - Job ssh for kube-runtime [#3153](https://github.com/microsoft/pai/pull/3153), [#3729](https://github.com/microsoft/pai/pull/3729)
    - Add PAI env variables in init scripts [#3154](https://github.com/microsoft/pai/pull/3154)
    - Generate random ports for scheduling [#3224](https://github.com/microsoft/pai/pull/3224)
    - Refine init and runtime script in k8s pods [#3245](https://github.com/microsoft/pai/pull/3245)
    - Port conflict check [#3259](https://github.com/microsoft/pai/pull/3259)
    - Clean ```${PAI_WORK_DIR}``` before mv content to this folder [#3695](https://github.com/microsoft/pai/pull/3695)
    - Force to flush after user command finished [#3794](https://github.com/microsoft/pai/pull/3794)
    - Decompress the framework when the size is large [#3820](https://github.com/microsoft/pai/pull/3820)

- k8s launcher
    - Foreground stop all frameworks [#3664](https://github.com/microsoft/pai/pull/3664)

- Device plugin
    - [InfiniBand device plugin in HCA mode for k8s](https://github.com/Mellanox/k8s-rdma-sriov-dev-plugin) [#3732](https://github.com/microsoft/pai/pull/3732)
    - GPU device plugin [#3744](https://github.com/microsoft/pai/pull/3744)
    - Host device plugin [#3792](https://github.com/microsoft/pai/pull/3792)

- Job history
    - EFK deployment to support job history [#3626](https://github.com/microsoft/pai/pull/3626), [#3789](https://github.com/microsoft/pai/pull/3789), [#3815](https://github.com/microsoft/pai/pull/3815), [#3832](https://github.com/microsoft/pai/pull/3832), [#3881](https://github.com/microsoft/pai/pull/3881), [#3887](https://github.com/microsoft/pai/pull/3887)
    - API endpoint and webportal page for job history [#3831](https://github.com/microsoft/pai/pull/3831), [#3889](https://github.com/microsoft/pai/pull/3889)
    
- User profile page [#3804](https://github.com/microsoft/pai/pull/3804), [#3853](https://github.com/microsoft/pai/pull/3853), [#3884](https://github.com/microsoft/pai/pull/3884)

- Token API
    - Apllication Token API [#3774](https://github.com/microsoft/pai/pull/3774)
    - Revoke browser tokens when changing password/logout [#3834](https://github.com/microsoft/pai/pull/3834), [#3835](https://github.com/microsoft/pai/pull/3835)
    
## July 2019 (version 0.14.0)

Welcome to the July 2019 release of OpenPAI. There are a number of updates in this version that we hope you will like, some of the key highlights include:

- [New webportal job submission experience](./docs/user/job_submission.md) - Update submit job UI to version 2.
- [Python sdk of openpai is now ready!](https://github.com/microsoft/pai/tree/master/contrib/python-sdk) - You can config, submit and debug your job easily with python sdk.
- [New yarn schedular to improve resource efficiency](./docs/tools/dedicated_vc.md) - Admin can bind dedicated Virtual Cluster to 1 or more physical nodes.
- [vscode extension now supports submitting v2 job](https://github.com/microsoft/pai/tree/master/contrib/pai_vscode).
- [Provide team storage plugin to manage data shared by team](https://github.com/microsoft/pai/tree/master/contrib/storage_plugin).
- [How to upgrade to OpenPAI v-0.14.0?](./docs/upgrade/upgrade_to_v0.14.0.md)

For more details about this release, please refer to [detailed release note](https://github.com/microsoft/pai/releases/tag/v0.14.0).

## June 2019 (version 0.13.0)

- OpenPAI protocol:
  - Introduce OpenPAI protocol and job submission v2 (#2260)
  - Add new job submission v2 plugin (#2461)
- Web portal:
  - Add login page for guests (#2544)
  - Add user home page (#2614)
  - Add new user management page (#2726, #2796)
  - User Management UX refactoring with new layout and themes (#2726, #2796)

For more details about this release, please refer to [detailed release note](https://github.com/microsoft/pai/releases/tag/v0.13.0).

## April 2019 (version 0.12.0)

- Web portal:
  - Display error message in job detail page #2456
  - Import users from CSV file directly and show the final results #2495
  - Add TotalGpuCount and TotalTaskCount into job list #2499
- Deployment
  - Add cluster version info #2528
  - Check if the nodes are ubuntu 16.04 #2520
  - Check duplicate hostname #2403

For more details about this release, please refer to [detailed release note](https://github.com/microsoft/pai/releases/tag/v0.12.0).

## April 2019 (version 0.11.0)

- Support team wise NFS storage, including:
  - An NFS configuration plug-in and a commandline tool. #2346
  - A simple NFS-job submit plug-in. #2358
- Refer to Simplified Job Submission for OpenPAI + NFS deployment for more details.
- New alerts for unhealthy GPUs, currently including following alerts #2209:
- Admin could know all running jobs on a node. #2197
- Filter supports in Job List View. #302
- Hold the Env for failed jobs which are casued by user error. #2272

For more details about this release, please refer to [detailed release note](https://github.com/microsoft/pai/releases/tag/v0.11.0).

## Mar 2019 (version 0.10.1)

- Admin can configure MaxCapacity through REST API for a given Virtual Cluster so that the virtual cluster can use iddle resources as bonus. #2147
- Support Azure RDMA. #2091; how-to doc
- New Disk Cleaner for abnormal disk usage: The disk cleaner will check disk usage every 60 second(configurable), and if the disk usage is above 94%(configurable), it will kill the container that uses largest disk space using specific signal(10), the container will exit with code 1, and the related job will fail. Admin/User can track the reason in job logs. #2119
- Web portal: add "My jobs" filter button. #2111
- "Submit Simple Job" web portal plugin. #2131

For more details about this release, please refer to [detailed release note](https://github.com/microsoft/pai/releases/tag/v0.10.1).

## Feb 2019 (version 0.9.1)

[minor release with hot fix](https://github.com/microsoft/pai/releases/tag/v0.9.1).

## Feb 2019 (version 0.9.0)

- Add pai service dashboard to grafana, cluster admin can get pai services resource consumption from paiServiceMetrics page. #1694
- Support to add custom web pages to the web portal of PAI deployments with WebPortal Plugin, refer to Plugins Doc for how to use the new feature, and refer to PR 1700 for how PAI Marketplace is using it as an example.
- Support update virtual cluster dynamically from webportal. Please refer to virtual cluster management for how to use this new feature. #1831 #1974
- Support customized job environment variables. #1544
- Add VS Code client for PAI, please refer to OpenPAI VS Code Client for more detail.

For more details about this release, please refer to [detailed release note](https://github.com/microsoft/pai/releases/tag/v0.9.0).

## Dec 2018 (version 0.8.3)

[minor release with hot fix](https://github.com/microsoft/pai/releases/tag/v0.8.3).

## Nov 2018 (version 0.8.2)

[minor release with hot fix](https://github.com/microsoft/pai/releases/tag/v0.8.2).

## Nov 2018 (version 0.8.1)

[minor release with hot fix](https://github.com/microsoft/pai/releases/tag/v0.8.1).

## Oct 2018 (version 0.8.0)

- All user submitted jobs can be cloned and resubmitted in Job detail page #1448.
- The new designed Marketplace and Submit Job V2 are under public review. Please refer to the instruction for more information Marketplace and Submit job v2. Any feedback and suggestions are appreciated.
- Alerting service supports to mute alerts. The instructions can be found via alert-manager.
- New Feedback Button: users are allowed to submit GitHub Issues with appended OpenPAI version directly from WebUI #1289.

For more details about this release, please refer to [detailed release note](https://github.com/microsoft/pai/releases/tag/v0.8.0).

## Sep 2018 (version 0.7.2)

[minor release with hot fix](https://github.com/microsoft/pai/releases/tag/v0.7.2).

## Aug 2018 (version 0.7.1)

- Administrators can receive email notifications on cluster problems after set up the new supported "Alert Manager". Please read more about how to set up Alert Manager and the notification Rules.

For more details about this release, please refer to [detailed release note](https://github.com/microsoft/pai/releases/tag/v0.7.1).

## July 2018 (version 0.6.1)

- The 'paictl' tool: Introducing paictl, the deployment/management tool with the functionalities of image building, service start/stop, k8s bootup/clean, and configuration generation.
- Single-box deployment: Support single-box deployment for evaluation purpose.
- New UI for user management: Now the console for administrators to manage PAI users has got a new UI.
- Documentation: Significant changes on documents -- more comprehensive, more structured, and easier to follow.

For more details about this release, please refer to [detailed release note](https://github.com/microsoft/pai/releases/tag/v0.6.1).
