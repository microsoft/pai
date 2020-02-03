package watchdog

import (
	"math"
	"strconv"
	"sync"

	v1 "k8s.io/api/core/v1"
	"k8s.io/klog"

	"github.com/prometheus/client_golang/prometheus"
)

func createMetric(name, help string, labels []string) *prometheus.Desc {
	return prometheus.NewDesc(name, help, labels, nil)
}

type promMetrics map[string]*prometheus.Desc

var (
	paiMetrics = promMetrics{
		"paiPodCount": createMetric(
			"pai_pod_count",
			"count of pai pod",
			[]string{
				"service_name", "name", "namespace", "phase", "host_ip", "initialized", "pod_scheduled", "ready",
			},
		),
		"jobPodCount": createMetric(
			"pai_job_pod_count",
			"count of pai job pod",
			[]string{
				"job_name", "name", "phase", "host_ip", "initialized", "pod_bound", "pod_scheduled", "ready",
			},
		),
		"paiContainerCount": createMetric(
			"pai_container_count",
			"count of container pod",
			[]string{
				"service_name", "pod_name", "name", "namespace", "state", "host_ip", "ready",
			},
		),
		"paiNodeCount": createMetric(
			"pai_node_count",
			"count of pai node",
			[]string{
				"name", "disk_pressure", "memory_pressure", "ready", "unschedulable",
			},
		),
	}
	k8sMetrics = promMetrics{
		"apiServerCount": createMetric(
			"k8s_api_server_count",
			"count of k8s api server",
			[]string{"error", "host_ip"},
		),
		"nodeGpuAvailable": createMetric(
			"k8s_node_gpu_available",
			"gpu available on k8s node",
			[]string{"host_ip"},
		),
		"nodeGpuReserved": createMetric(
			"k8s_node_gpu_reserved",
			"gpu reserved on k8s node",
			[]string{"host_ip"},
		),
		"nodeGpuTotal": createMetric(
			"k8s_node_gpu_total",
			"gpu total on k8s node",
			[]string{"host_ip"},
		),
	}
)

var (
	errorTyeParse           = "parse"
	errorTypeUnkownPodCond  = "unknown_pod_cond"
	errorTypeUnkownNodeCond = "unknown_node_cond"
)

func observeTime(h prometheus.Histogram, f func()) {
	timer := prometheus.NewTimer(h)
	defer timer.ObserveDuration()
	f()
}

type PromMetricCollector struct {
	mutex              sync.Mutex
	k8sClient          *k8sClient
	metricGenerator    *metricGenerator
	collectErrorTypes  []string
	collectErrors      *prometheus.CounterVec
	healthzHistogram   prometheus.Histogram
	listPodsHistogram  prometheus.Histogram
	listNodesHistogram prometheus.Histogram
	metrics            []prometheus.Metric
}

func NewPromMetricCollector() (*PromMetricCollector, error) {
	k8sClient, err := newK8sClient()
	if err != nil {
		klog.Errorf("Failed to create exporter")
		return nil, err
	}
	return &PromMetricCollector{
		k8sClient: k8sClient,
		collectErrors: prometheus.NewCounterVec(prometheus.CounterOpts{
			Name: "process_error_log_total",
			Help: "total count of error log",
		}, []string{"type"}),
		metricGenerator: &metricGenerator{},
		healthzHistogram: prometheus.NewHistogram(prometheus.HistogramOpts{
			Name: "k8s_api_healthz_resp_latency_seconds",
			Help: "Response latency for requesting k8s api healthz (seconds)",
		}),
		listNodesHistogram: prometheus.NewHistogram(prometheus.HistogramOpts{
			Name: "k8s_api_list_pods_latency_seconds",
			Help: "Response latency for list pods from k8s api (seconds)",
		}),
		listPodsHistogram: prometheus.NewHistogram(prometheus.HistogramOpts{
			Name: "k8s_api_list_nodes_latency_seconds",
			Help: "Response latency for list nodes from k8s api (seconds)",
		}),
		collectErrorTypes: []string{errorTyeParse, errorTypeUnkownPodCond, errorTypeUnkownNodeCond},
	}, nil
}

func (p *PromMetricCollector) Collect() {
	p.mutex.Lock() // To protect metrics from concurrent collects.
	defer p.mutex.Unlock()

	p.metrics = nil
	var err error
	var f func()

	var health string
	f = func() { health, err = p.k8sClient.getServerHealth() }
	observeTime(p.healthzHistogram, f)
	if err != nil {
		p.collectErrors.WithLabelValues(errorTyeParse).Inc()
		klog.Errorf("Failed to check api server health, error %v", err.Error())
	}

	var nodeList *v1.NodeList
	f = func() { nodeList, err = p.k8sClient.listNodes() }
	observeTime(p.listNodesHistogram, f)
	if err != nil {
		p.collectErrors.WithLabelValues(errorTyeParse).Inc()
		klog.Errorf("Failed to list nodes, error %v", err.Error())
	}

	var podList *v1.PodList
	f = func() { podList, err = p.k8sClient.listPods() }
	observeTime(p.listPodsHistogram, f)
	if err != nil {
		p.collectErrors.WithLabelValues(errorTyeParse).Inc()
		klog.Errorf("Failed to list pods, error %v", err.Error())
	}

	p.metrics = append(p.metrics, prometheus.MustNewConstMetric(
		k8sMetrics["apiServerCount"],
		prometheus.GaugeValue,
		1,
		health,
		p.k8sClient.getAPIServerHostName(),
	))

	nodeMetrics := p.metricGenerator.generateNodeMetrics(nodeList)
	podMetrics := p.metricGenerator.generatePodMetrics(podList)
	npMap := p.metricGenerator.generateNodeToPodsMap(podMetrics)

	for _, nodeMetric := range nodeMetrics {
		if nodeMetric.isConditionUnknown {
			p.collectErrors.WithLabelValues(errorTypeUnkownNodeCond).Inc()
		}

		p.metrics = append(p.metrics, p.getNodeGpuMetrics(nodeMetric, npMap)...)
		p.metrics = append(p.metrics, p.getPaiNodeMetrics(nodeMetric)...)
	}

	for _, podMetric := range podMetrics {
		if podMetric.isConditionUnknown {
			p.collectErrors.WithLabelValues(errorTypeUnkownPodCond).Inc()
		}

		if podMetric.serviceName == "" && podMetric.jobName == "" {
			klog.V(2).Infof("Unknown pod %v", podMetric.name)
			continue
		}
		p.metrics = append(p.metrics, p.getPodMetrics(podMetric)...)
	}

	for _, t := range p.collectErrorTypes {
		p.metrics = append(p.metrics, p.collectErrors.WithLabelValues(t))
	}
	p.metrics = append(p.metrics, p.healthzHistogram)
	p.metrics = append(p.metrics, p.listNodesHistogram)
	p.metrics = append(p.metrics, p.listPodsHistogram)
}

// Please do not modify the element in returned slice. It will change
// the content of promMetricCollector.metrics elements
func (p *PromMetricCollector) getMetrics() []prometheus.Metric {
	p.mutex.Lock()
	defer p.mutex.Unlock()
	dst := make([]prometheus.Metric, len(p.metrics))
	copy(dst, p.metrics)
	return dst
}

func (p *PromMetricCollector) getPaiNodeMetrics(nodeMetric nodeMetric) []prometheus.Metric {
	metrics := make([]prometheus.Metric, 0, 1)
	metrics = append(metrics, prometheus.MustNewConstMetric(
		paiMetrics["paiNodeCount"],
		prometheus.GaugeValue,
		1,
		nodeMetric.ip,
		nodeMetric.diskPressure,
		nodeMetric.memoryPressure,
		nodeMetric.ready,
		strconv.FormatBool(nodeMetric.unschedulable),
	))
	return metrics
}

func (p *PromMetricCollector) getNodeGpuMetrics(
	nodeMetric nodeMetric, npMap map[string][]podMetric) []prometheus.Metric {
	podMetrics := npMap[nodeMetric.name]
	var gpuUsed int

	metrics := make([]prometheus.Metric, 0, 3)

	for _, podMetric := range podMetrics {
		gpuUsed += podMetric.gpuUsed
	}

	gpuLeft := math.Max(0, float64(nodeMetric.gpuTotal-gpuUsed))
	if nodeMetric.unschedulable {
		metrics = append(metrics, prometheus.MustNewConstMetric(
			k8sMetrics["nodeGpuAvailable"],
			prometheus.GaugeValue,
			0,
			nodeMetric.ip,
		))
		metrics = append(metrics, prometheus.MustNewConstMetric(
			k8sMetrics["nodeGpuReserved"],
			prometheus.GaugeValue,
			gpuLeft,
			nodeMetric.ip,
		))
	} else {
		metrics = append(metrics, prometheus.MustNewConstMetric(
			k8sMetrics["nodeGpuAvailable"],
			prometheus.GaugeValue,
			gpuLeft,
			nodeMetric.ip,
		))
		metrics = append(metrics, prometheus.MustNewConstMetric(
			k8sMetrics["nodeGpuReserved"],
			prometheus.GaugeValue,
			0,
			nodeMetric.ip,
		))
	}

	metrics = append(metrics, prometheus.MustNewConstMetric(
		k8sMetrics["nodeGpuTotal"],
		prometheus.GaugeValue,
		float64(nodeMetric.gpuTotal),
		nodeMetric.ip,
	))
	return metrics
}

func (p *PromMetricCollector) getPodMetrics(podMetric podMetric) []prometheus.Metric {
	var metrics []prometheus.Metric
	if podMetric.serviceName != "" {
		metrics = append(metrics, prometheus.MustNewConstMetric(
			paiMetrics["paiPodCount"],
			prometheus.GaugeValue,
			1,
			podMetric.serviceName,
			podMetric.name,
			podMetric.namespace,
			podMetric.phase,
			podMetric.hostIP,
			podMetric.initialized,
			podMetric.scheduled,
			podMetric.ready,
		))
		for _, c := range podMetric.containers {
			metrics = append(metrics, prometheus.MustNewConstMetric(
				paiMetrics["paiContainerCount"],
				prometheus.GaugeValue,
				1,
				podMetric.serviceName,
				podMetric.name,
				c.name,
				podMetric.namespace,
				c.status,
				podMetric.hostIP,
				strconv.FormatBool(c.ready),
			))
		}
	} else if podMetric.jobName != "" {
		metrics = append(metrics, prometheus.MustNewConstMetric(
			paiMetrics["jobPodCount"],
			prometheus.GaugeValue,
			1,
			podMetric.jobName,
			podMetric.name,
			podMetric.phase,
			podMetric.hostIP,
			podMetric.initialized,
			strconv.FormatBool(podMetric.bound),
			podMetric.scheduled,
			podMetric.ready,
		))
	}
	return metrics
}
