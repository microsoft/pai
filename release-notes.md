# Release v0.7.1

## New features
* Add [alert manager](https://github.com/Microsoft/pai/blob/pai-0.7.y/cluster-configuration/services-configuration.yaml#L106), defined [several rules](https://github.com/Microsoft/pai/tree/pai-0.7.y/prometheus/prometheus-alert) for alert. Operator will receive email notification if cluster has some problem.

## Improvements
* [Optimize](https://github.com/Microsoft/pai/pull/1021) boot speed of web portal.
* Do [not delete](https://github.com/Microsoft/pai/pull/1038) etcd data by default when upgrading kubernetes.
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
* Fix nginx reverse proxy [issue](https://github.com/Microsoft/pai/pull/1009) in webhdfs.
* Fix pylon UI [issue](https://github.com/Microsoft/pai/issues/916).
* Fix webportal data table [bug](https://github.com/Microsoft/pai/pull/734).

## Known issues
* kubelet is [vulnerable](https://github.com/Microsoft/pai/pull/1088) to cyber attacks in pai's default setting, please do not deploy kubelet insecurely in public network for now. We will fix this issue in later release.

# Break changes
* `killOnAnyComplete` is [now](https://github.com/Microsoft/pai/pull/879) obsolete, any json files that specify this field will not work in this version. Please use `minFailedTaskCount` and `minSucceededTaskCount`, see [job tutorial](https://github.com/Microsoft/pai/blob/pai-0.7.y/docs/job_tutorial.md) for more information.


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
