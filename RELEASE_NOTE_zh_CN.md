# OpenPAI Release Note

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