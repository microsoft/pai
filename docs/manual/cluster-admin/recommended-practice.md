# Recommended Practice

Managing one or more clusters is not an easy task. In most cases, the manager should have good knowledge about Linux, Kubernetes, and OpenPAI system. Here we recommend some practice experience for your reference.

## Team Shared Practice

There are mainly two kinds of resource in OpenPAI, namely virtual cluster and storage, and they are managed by groups. All users are in the `default` group. So every one should have access to the `default` virtual cluster and one or more storages which are set for `default` group. Besides `default` group, you can set up different groups for different users. **In practice, we recommend you to assign each team with a single group.**

For example, if you have two teams: team A working on project A; and team B working on project B. You can set up group A and group B for team A and B, correspondingly. Thus each team can share computing and storage resource internally. If a user joins a team, just add him into the corresponding group.

By default, OpenPAI uses basic authentication mode: Virtual cluster is exactly bound to groups. Setting up a group means set up a virtual cluster in basic authentication mode. In AAD mode, group and virtual cluster are different concepts. Please refer to [How to Set Up Virtual Clusters](./how-to-set-up-virtual-clusters.md) for details.

## Onboarding Practice

For new user onboarding, the PAI admin should create this user manually in the backend, and notify the user of some instructions and guidelines. In our practice, we will send an e-mail to the new user. Besides account information, we also include the following content in the e-mail:

  - Let the user read the [user manual](../cluster-user/) to learn how to submit job, debug job, and use client tool.
  - Let the user know their completed jobs will be deleted after 30 days.
  - Let the user know he/she shouldn't always run low-efficiency job (e.g. sleep for several days in the container). Otherwise the administrator may kill the job.
  - Let the user know how to contact the administrator in case they find any problem or have any question. 

## DRI Practice

DRI stands for Designated Responsible Individual. In our context, we don't have one specific manager for PAI clusters. Instead, we assign one or two DRIs every week. He/she will become the designated responsible individual for cluster management this week. The assignment is based on rotation so everyone in the team has an equal chance to become a DRI.

The duty of a DRI includes:

- Solve live site issues of internal deployments, which from alerts and human reported, including cluster alerts and user questions.
- Upgrade PAI services.

The DRI should be aware of different severities: 

  - Severity 0: Impact a whole prod cluster, and it's unavailable totally.
  - Severity 1: Impact important features like cannot submit new jobs, API failures totally, or web UI is down.
  - Severity 2: Some jobs fail consistently, or some users hit problems frequently.
  - Severity 3: Random job failures with low probability.

In addition, if there are multiple clusters, he/she should also be aware of the different priorities of different clusters.

Based on severity and priority, we can make an SLA for the cluster management. Here is an example:

|     Severity    |     Cluster               |     Acknowledge    |     Update frequency    |     Monitoring hours    |
|-----------------|---------------------------|--------------------|-------------------------|-------------------------|
|     0, 1        |     production cluster    |     30 minutes     |     2 hour              |     Working hours       |
|     2           |     production cluster    |     2 hours        |     24 hours            |     Working hours       |
|     3           |     all                   |     4 hours        |     24 hours            |     Working hours       |


If an issue is raised, the DRI should follow these steps to address it:

1. All questions or notification sent to DRIs should be updated by the DRI owner proactively.
2. DRI owner should send ACK to each incident of PAI alerts. As there are many duplicated alerts, so that it doesn't need to ACK on each one.
3. Besides ACK, the DRI owner should reply to the questions/notification/alerts, if there are updates or it is resolved. Further more, the DRI owner should think about why this incident happens, how to avoid it in the next time, after it is resolved. If it's applicable, create issues on Github.