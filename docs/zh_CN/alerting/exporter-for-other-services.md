# Background

OpenPai is a complex distributed system, its operational cost increase as cluster size increase. Currently OpenPai have 15 services. It is difficult, even impossible, for operator to know every single detail of all services. Metrics is a great way for program to expose its running status and errors. They provided a easy and unified way to monitor system, alert operator, find root cause if something bad happened.

OpenPai leverage [prometheus](https://prometheus.io/) to collect/store/visualize metrics, also use it to define a set of rules to alerting.

We only collected some basic metrics such as node/OS/job metrics and OpenPai service's healthy statuses now. So service internal is still a blackbox to operator, We need to collect more metrics from each service in OpenPai. The first step is to define a general way for each service exposing its metrics, this can easy code maintenance and the way for metrics collecting.

## Current metrics and alerts

See [exporter metrics](./exporter-metrics.md) and [watchdog metrics](./watchdog-metrics.md) for metrics we are exposing and see [prometheus-alert](../../../src/prometheus/deploy/alerting) for alerts we already defined.

# Goal

Recommend some best practices to follow to improve service observability.

# Liveness & readniess probes

These two probes are provided by k8s to cope with failure:

* liveness
* readniess

Liveness probe determine if the process encountered some unrecoverable failure, such as deadlock or out of memory. If liveness probe failed, k8s will restart container, and hopefully the service will back to work again.

Readiness probe determine if frontend can send traffic to this pod through service abstraction. This is helpful in rolling update and cache server to prefill its caches before serving.

# Runtime metrics

Readiness probe can help operator know if service is healthy or not directly. We defined an alert rule for readiness status. But operator and other still do not know what happened to service if something wrong. To be more observable, service needs expose its runtime metrics.

## What to collect

* CPU/Memory usage.
* Request count/latency.
* Connection/fd count/duration.
* Important function call duration.
* GC duration, GC times.
* Heap/queue/thead-pool/connection-pool size.
* Error log count.
* Cache hit/miss count.
* Persisted data size.
* Other metrics recommended by [prometheus](https://prometheus.io/docs/practices/instrumentation/)

## Plan

There are two ways for process to expose metrics, one is using thread, another is using independent process.

Thead can access variables directly from memory, but requires code modification. This suits modules written by ourself such as `frameworklauncher` & `rest-server` etc.

For those modules not maintained by ourself, it would be easier to write an independent program to expose metrics from main process.

Also some metrics can not collected easily from main process, for example, java vm heap size can be obtained via `jstat`. If service want to collect those metrics, it has start another process to do it.

### Deployment

We only have to care about deployment if we choose using independent process for exporting metrics.

For those modules not maintained by ourself such as hadoop, we can create another process to collect from main process and expose to prometheus. If using this method, it is kubernetes's best practice to adopt [sidecar pattern](https://kubernetes.io/docs/tasks/access-application-cluster/communicate-containers-same-pod-shared-volume/), instead of deploy two processes in same container. As illustrated blow:

![sidecar pattern](./sidecar.png)

This have several pros compare to deploying in same pod:

* Two processes can have different image.
* Two processes are isolated in resource usage, and can be restarted independently.
* Two processes can have independent liveness/healthy probe.

It also have advantages over deploying using different pod:

* Monitor process can use localhost or local file to exchange infos with main process, no too much network overhead incurs.
* Do not have to having two set of deployment requirement.
* Do not have to think about service discovery.

## Options for exporting

There are two possible ways for exporting metrics to prometheus:

* Leverage node-exporter.
* Open a port and config prometheus to scrape.

They have pros and cons:

<table>

<tr>
    <td>Method</td>
    <td>Pros</td>
    <td>Cons</td>
</tr>
<tr>
    <td>Use node-exporter</td>
    <td>
        <ul>
            <li>No management for connection</li>
        </ul>
    </td>
    <td>
        <ul>
            <li>The textfile module is for metrics that are tied to a machine</li>
            <li>No easy way for other to check if exporter process is still live</li>
            <li>Dead exporter's old metrics can still being exposed by node-exporter</li>
        </ul>
    </td>
</tr>
<tr>
    <td>Use port</td>
    <td>
        <ul>
            <li>prometheus client can generate many useful metrics automatically such as cpu/memory/fd usage</li>
            <li>prometheus client also provide many useful class to keep track of count/gauge</li>
            <li>Can use port check as liveness check</li>
            <li>Prometheus will generate <i>up</i> metric for the exporter</li>
        </ul>
    </td>
    <td>
        <ul>
            <li>Writer should get familiar with <a href="https://prometheus.io/docs/instrumenting/clientlibs/">prometheus client</a></li>
        </ul>
    </td>
</tr>
</table>

As [this demo](https://gist.github.com/xudifsd/4643baef3a2938bde559fefdc557aeb1) demostrated, it would not cost too much effort to write an exporter, also textfile in node-exporter is for metrics that tied to a machine. It should be best practice to write an exporter instead of using node-exporter.

## Configuration for exporting

If service decide to leverage node-exporter to expose metrics, service should mount host path volume located in `/datastorage/prometheus` and write file with extension `.prom`.

For expose using port, service should annotate pod with `prometheus.io/scrape`, `prometheus.io/path`

and `prometheus.io/port`. For service with label key `app`, prometheus will generate `pai_service_name` label for generated metrics.

Prometheus will list all pods and get those pods with `prometheus.io/scrape` is true, and then, prometheus will issue request to `http://${pod_host_ip}:${prometheus.io/port}${prometheus.io/path}` to get metrics.

For example, following deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: foo
spec:
  selector:
    matchLabels:
      app: foo
  template:
    metadata:
      name: foo
      labels:
        app: foo
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/path: "/"
        prometheus.io/port: "80"
    spec:
      containers:
      - name: nginx
        image: nginx
        ports:
        - containerPort: 80
        volumeMounts:
        - name: workdir
          mountPath: /usr/share/nginx/html
      initContainers:
        - name: install
          image: busybox
          command: ["sh", "-c", "echo pai_service_count 1 > /work-dir/index.html"]
          volumeMounts:
          - name: workdir
            mountPath: "/work-dir"
      volumes:
        - name: workdir
          emptyDir: {}
      hostNetwork: true
```

will generate metrics like:

`pai_service_count{instance="10.151.40.4:80",job="pai_serivce_exporter",k8s_pod_name="foo-69869cc4d6",pai_service_name="foo"} 1`

metric labels `k8s_pod_name` and `pai_service_name` are generated from pod name and pod label value which has key `app`.

In above example, we use nginx to accept requests from prometheus and expose metrics we write in initContainers. It is best for service owner to use [prometheus client](https://prometheus.io/docs/instrumenting/clientlibs/) to expose metrics.

Note that, currently pai do not assume [kubernetes network model](https://kubernetes.io/docs/concepts/cluster-administration/networking/) enabled, so service has to use hostNetwork, this implies service owner should carefully choose port number to avoid port conflict, it is best to configure port through pai service configuration.