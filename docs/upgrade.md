# A Guide for Upgrading PAI

Since the release v0.10, PAI will support upgrading from previously release, please refer to the [Support Plan](#support-plan).

PAI includes Kubernetes cluster and the PAI services running on the Kubernetes.
The upgrade may relate to Kuberentes or the PAI services, idealy they should be able to upgrade separately.

## Assumptions

- The Kubernetes and PAI Services are loosely coupled, please refer the compatibility table below for details.
- Kubernetes upgrade may interrupt the running jobs.
- PAI Services upgrade won't interrupt the running jobs.
- PAI Services are forward-compatible with the configurations. (New configuration always works.)

## Support Plan

Below is a compatibility table of Kubernetes and PAI Services.

| release | PAI Services | PAI upgradable since | Kubernetes | Compatibility Kubernetes | Kubernetes upgradeable since |
| :-----: | :----------: | :------------------: | :--------: | :----------------------: | :--------------------------: |
| v0.10   | v0.10        | v0.9                 | v0.10      | since v0.10              | since v0.9                   |

Take the release v0.10 as example, it says:

- The release v0.10 include PAI Service v0.10 and Kuberentes v0.10.
- The oldest Kubernetes version compatibility with the release is v0.10.
- The PAI Service could upgrade from v0.9.
- The Kubernetes could upgrade from v0.9.

## Kubernetes Cluster Upgrade

Warning! Kubernetes upgrade may interrupt running jobs, please check the release notes carefully.

Simply the upgrade include the below steps:

- Upgrade Kubernetes config
- Upgrade kubernetes components

## PAI Services Update

Idealy, the PAI service update won't interrupt running jobs, please double check the release notes.

Simple the upgrade include the below steps:

- Upgrade PAI services config(Migrate and push to cluster)
- Stop the PAI services
- Start the PAI services

## Implementation

TODO. Uncompatiable upgrade may need additional effort. For example, may need to destroy old cluster using the tools in old release and manually migrate configurations.
