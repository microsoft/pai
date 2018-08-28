# Release v0.7.1

## New features
* Administrators can receive email notifications on cluster problems after set up the new supported "Alert Manager". Please read more about how to set up [Alert Manager](prometheus/doc/alert-manager.md) and the notification [Rules](https://github.com/Microsoft/pai/tree/pai-0.7.y/prometheus/prometheus-alert).

## Improvements
* Optimized the boot speed of web portal - [PR 1021](https://github.com/Microsoft/pai/pull/1021);
* Improved the Kubernetes upgrade experience, PAI admin is no more required to delete ETCD data when upgrading Kubernetes - [PR 1038](https://github.com/Microsoft/pai/pull/1038)
* Upgrade hadoop from 2.7.2 to 2.9.0 - [PR 923](https://github.com/Microsoft/pai/pull/923)
* Enable docker log rotationn by default - [PR 995](https://github.com/Microsoft/pai/pull/995)
* Documentation
  * Restructured and refined README to provide a better experiences for new users.
  * Documentation improvement for:
    * [OpenPai deployment](https://github.com/Microsoft/pai/blob/pai-0.7.y/pai-management/doc/cluster-bootup.md)
    * [REST Server](https://github.com/Microsoft/pai/blob/pai-0.7.y/rest-server/README.md)
    * [Zookeeper](https://github.com/Microsoft/pai/blob/pai-0.7.y/zookeeper/zookeeper.md)
    * [exporter](https://github.com/Microsoft/pai/blob/pai-0.7.y/prometheus/doc/README.md)
    * [paictl design](https://github.com/Microsoft/pai/blob/pai-0.7.y/pai-management/doc/paictl-design.md)
    * [kubernetes deployment Q&A](https://github.com/Microsoft/pai/blob/pai-0.7.y/pai-management/doc/kubernetes-deploy-qna.md)
    * [pai-build](https://github.com/Microsoft/pai/blob/pai-0.7.y/pai-management/doc/pai-build.md)
    * [Etcd maintenance](https://github.com/Microsoft/pai/blob/pai-0.7.y/pai-management/doc/etcd.md)
    * [hdfs](https://github.com/Microsoft/pai/blob/pai-0.7.y/pai-management/doc/hdfs.md)
* More examples:
  * [caffe](https://github.com/Microsoft/pai/tree/pai-0.7.y/examples/caffe)
  * [caffe2](https://github.com/Microsoft/pai/tree/pai-0.7.y/examples/caffe2)
  * [chainer](https://github.com/Microsoft/pai/tree/pai-0.7.y/examples/chainer)
  * [kafka](https://github.com/Microsoft/pai/tree/pai-0.7.y/examples/kafka)
  * [Spark](https://github.com/Microsoft/pai/tree/pai-0.7.y/examples/spark)
  * [XGBoost](https://github.com/Microsoft/pai/tree/pai-0.7.y/examples/XGBoost)

## Bug fixes
* Fixed nginx reverse proxy issue in webhdfs - [PR 1009](https://github.com/Microsoft/pai/pull/1009)
* Fixed pylon UI issue - [PR 916](https://github.com/Microsoft/pai/issues/916)
* Fixed webportal data table issue - [PR 734](https://github.com/Microsoft/pai/pull/734)

## Known issues
* Currently, OpenPai start user's job using hostNetwork and leverge `docker stats` to generate job's running metrics including network usage. This will render 0 network usage in job/task metrics page, because `docker stats` will return 0 network usage if container uses hostNetwork. We will fix this issue in future release.

# Break changes
* Replace `killOnAnyComplete` with more powerful options `minFailedTaskCount` and `minSucceededTaskCount`. `killOnAnyComplete` is now obsolete, any json files that specify this field will not work in this version. Please see [job tutorial](https://github.com/Microsoft/pai/blob/pai-0.7.y/docs/job_tutorial.md) for more information. - [PR 879](https://github.com/Microsoft/pai/pull/879)


# Release v0.6.1

## New features
* The 'paictl' tool: Introducing paictl, the deployment/management tool with the functionalities of image building, service start/stop, k8s bootup/clean, and configuration generation.
* Single-box deployment: Support single-box deployment for evaluation purpose.
* New UI for user management: Now the console for administrators to manage PAI users has got a new UI.
* Documentation: Significant changes on documents -- more comprehensive, more structured, and easier to follow.

## Improvements
Faster loading of the job list UI: Now the page gets 5x faster than before when loading its content.

# Known issues:
* #827 Deploy PAI master and worker on the same node may lead to resource competition.
* #813 Still in investigation. Install PAI on some old kernel may fail.
* #713 Yarn may not use all the resource shown on the PAI dashboard, due to configuration issues.
