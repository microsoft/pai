package watchdog

import (
	"strings"

	v1 "k8s.io/api/core/v1"
	"k8s.io/klog"
)

type MetricGenerator struct{}

type NodeMetric struct {
	ip                 string
	gpuTotal           int
	gpuAvaliable       int
	gpuReserved        int
	diskPressure       string
	memoryPressure     string
	ready              string
	pidPressure        string
	networkUnavailable string
	unschedulable      bool
	isConditionUnknown bool
}

type containerMetric struct {
	name   string
	status string
}

type PodMetric struct {
	name               string
	namespace          string
	nodeName           string
	hostIP             string
	phase              string
	initialized        string
	scheduled          string
	ready              string
	containersReady    string
	isConditionUnknown bool
	podBound           bool
	isService          bool
	serviceName        string // valid if isService is True
	jobName            string // valid if isService is False
	containers         []containerMetric
}

func (mg *MetricGenerator) GeneratePodMetrics(podList *v1.PodList) []PodMetric {
	var metrics []PodMetric
	for _, pod := range podList.Items {
		podMetric := mg.generatePodMetric(&pod)
		metrics = append(metrics, podMetric)
	}
	return metrics
}

func (mg *MetricGenerator) generatePodMetric(pod *v1.Pod) PodMetric {
	hostIP := pod.Status.HostIP
	if hostIP == "" {
		hostIP = "unscheduled"
	}
	phase := strings.ToLower(string(pod.Status.Phase))
	if phase == "" {
		phase = "unknown"
	}

	initialized, scheduled, ready, containersReady := "unknown", "unknown", "unknown", "unknown"
	isConditionUnknown := false
	conditions := pod.Status.Conditions
	for _, cond := range conditions {
		status := strings.ToLower(string(cond.Status))
		switch t := cond.Type; t {
		case v1.PodReady:
			ready = status
		case v1.PodInitialized:
			initialized = status
		case v1.PodScheduled:
			scheduled = status
		case v1.ContainersReady:
			containersReady = status
		default:
			isConditionUnknown = true
			klog.Warningf("Unknown pod condition type: %v %v", cond, status)
		}
	}

	podBound := false
	if pod.Spec.NodeName != "" {
		podBound = true
	}

	labels := pod.ObjectMeta.Labels
	serviceName := labels["app"]
	jobName := labels["jobName"]
	isService := false
	if serviceName != "" {
		isService = true
	}

	var containerStatuses []containerMetric
	for _, cStatus := range pod.Status.ContainerStatuses {
		status := containerMetric{name: cStatus.Name}
		if cStatus.State.Running != nil {
			status.status = "running"
		} else if cStatus.State.Waiting != nil {
			status.status = "waiting"
		} else if cStatus.State.Terminated != nil {
			status.status = "terminated"
		} else {
			status.status = "unknown"
		}
		containerStatuses = append(containerStatuses, status)
	}

	return PodMetric{
		name:               pod.ObjectMeta.Name,
		namespace:          pod.ObjectMeta.Namespace,
		nodeName:           pod.Spec.NodeName,
		hostIP:             hostIP,
		phase:              phase,
		initialized:        initialized,
		scheduled:          scheduled,
		ready:              ready,
		containersReady:    containersReady,
		isConditionUnknown: isConditionUnknown,
		podBound:           podBound,
		isService:          isService,
		serviceName:        serviceName,
		jobName:            jobName,
		containers:         containerStatuses,
	}
}

func (mg *MetricGenerator) GenerateNodeToPodsMap(podMetrics []PodMetric) map[string][]PodMetric {
	m := make(map[string][]PodMetric)
	for _, podMetric := range podMetrics {
		m[podMetric.nodeName] = append(m[podMetric.nodeName], podMetric)
	}
	return m
}

func (mg *MetricGenerator) GenerateNodeMetrics(nodeList *v1.NodeList) []NodeMetric {
	var metrics []NodeMetric
	for _, node := range nodeList.Items {
		nodeMetric := mg.generateNodeMetric(&node)
		metrics = append(metrics, nodeMetric)
	}
	return metrics
}

func (mg *MetricGenerator) getGpuNumber(resourceList v1.ResourceList) int {
	if resourceList == nil {
		return 0
	}
	gpuNumber, ok := resourceList["nvidia.com/gpu"]
	if !ok {
		gpuNumber = resourceList["alpha.kubernetes.io/nvidia-gpu"]
	}
	return int(gpuNumber.Value())
}

func (mg *MetricGenerator) generateNodeMetric(node *v1.Node) NodeMetric {
	var ip string
	var gpuTotal, gpuAvaliable, gpuReserved int
	var diskPressure, memoryPressure, ready, pidPressure,
		networkUnavailable = "unknown", "unknown", "unknown", "unknown", "unknown"
	for _, v := range node.Status.Addresses {
		if v.Type == v1.NodeInternalIP {
			ip = v.Address
		}
	}
	if ip == "" {
		ip = node.ObjectMeta.Name
	}

	conditions := node.Status.Conditions
	isConditionUnknown := false
	for _, cond := range conditions {
		status := strings.ToLower(string(cond.Status))
		switch t := cond.Type; t {
		case v1.NodeReady:
			ready = status
		case v1.NodeDiskPressure:
			diskPressure = status
		case v1.NodeMemoryPressure:
			memoryPressure = status
		case v1.NodePIDPressure:
			pidPressure = status
		case v1.NodeNetworkUnavailable:
			networkUnavailable = status
		default:
			isConditionUnknown = true
			klog.Warningf("Unknown node condition: %v, %v", t, status)
		}
	}

	// https://github.com/kubernetes/community/blob/master/contributors/design-proposals/node/node-allocatable.md
	// [Allocatable] = [Node Capacity] - [Kube-Reserved] - [System-Reserved] - [Hard-Eviction-Threshold]
	allocatable := node.Status.Allocatable
	if allocatable != nil {
		gpuTotal = mg.getGpuNumber(allocatable)
	} else {
		gpuTotal = mg.getGpuNumber(node.Status.Capacity)
	}

	return NodeMetric{
		ip:                 ip,
		gpuTotal:           gpuTotal,
		gpuAvaliable:       gpuAvaliable,
		gpuReserved:        gpuReserved,
		diskPressure:       diskPressure,
		memoryPressure:     memoryPressure,
		pidPressure:        pidPressure,
		networkUnavailable: networkUnavailable,
		ready:              ready,
		unschedulable:      node.Spec.Unschedulable,
		isConditionUnknown: isConditionUnknown,
	}
}
