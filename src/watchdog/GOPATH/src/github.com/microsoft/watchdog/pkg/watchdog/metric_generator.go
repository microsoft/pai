// MIT License
//
// Copyright (c) Microsoft Corporation. All rights reserved.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE

package watchdog

import (
	"math"
	"strings"

	v1 "k8s.io/api/core/v1"
	"k8s.io/klog"
)

type metricGenerator struct{}

type nodeMetric struct {
	name               string
	ip                 string
	gpuTotal           int
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
	ready  bool
}

type podMetric struct {
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
	bound              bool
	serviceName        string
	jobName            string
	gpuUsed            int
	containers         []containerMetric
}

func (mg *metricGenerator) generatePodMetrics(podList *v1.PodList) []podMetric {
	var metrics []podMetric
	for _, pod := range podList.Items {
		podMetric := mg.generatePodMetric(&pod)
		metrics = append(metrics, podMetric)
	}
	return metrics
}

func (mg *metricGenerator) generatePodMetric(pod *v1.Pod) podMetric {
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

	bound := false
	if pod.Spec.NodeName != "" {
		bound = true
	}

	labels := pod.ObjectMeta.Labels
	serviceName := labels["app"]
	jobName := labels["jobName"]

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
		status.ready = cStatus.Ready
		containerStatuses = append(containerStatuses, status)
	}

	var gpuUsed int
	for _, c := range pod.Spec.Containers {
		limit := mg.getGpuNumber(c.Resources.Limits)
		request := mg.getGpuNumber(c.Resources.Requests)
		gpuUsed = int(math.Max(float64(limit), float64(request)))
	}

	return podMetric{
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
		bound:              bound,
		serviceName:        serviceName,
		jobName:            jobName,
		containers:         containerStatuses,
		gpuUsed:            gpuUsed,
	}
}

func (mg *metricGenerator) generateNodeToPodsMap(podMetrics []podMetric) map[string][]podMetric {
	m := make(map[string][]podMetric)
	for _, podMetric := range podMetrics {
		m[podMetric.nodeName] = append(m[podMetric.nodeName], podMetric)
	}
	return m
}

func (mg *metricGenerator) generateNodeMetrics(nodeList *v1.NodeList) []nodeMetric {
	var metrics []nodeMetric
	for _, node := range nodeList.Items {
		nodeMetric := mg.generateNodeMetric(&node)
		metrics = append(metrics, nodeMetric)
	}
	return metrics
}

func (mg *metricGenerator) getGpuNumber(resourceList v1.ResourceList) int {
	if resourceList == nil {
		return 0
	}
	gpuNumber, ok := resourceList["nvidia.com/gpu"]
	if !ok {
		gpuNumber = resourceList["alpha.kubernetes.io/nvidia-gpu"]
	}
	return int(gpuNumber.Value())
}

func (mg *metricGenerator) generateNodeMetric(node *v1.Node) nodeMetric {
	var ip string
	var gpuTotal int
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

	return nodeMetric{
		name:               node.ObjectMeta.Name,
		ip:                 ip,
		gpuTotal:           gpuTotal,
		diskPressure:       diskPressure,
		memoryPressure:     memoryPressure,
		pidPressure:        pidPressure,
		networkUnavailable: networkUnavailable,
		ready:              ready,
		unschedulable:      node.Spec.Unschedulable,
		isConditionUnknown: isConditionUnknown,
	}
}
