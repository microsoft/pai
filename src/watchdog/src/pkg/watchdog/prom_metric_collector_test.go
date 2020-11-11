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
	"encoding/json"
	"io/ioutil"
	"net/http"
	"os"
	"reflect"
	"testing"
	"time"

	dto "github.com/prometheus/client_model/go"
	"github.com/stretchr/testify/assert"
	v1 "k8s.io/api/core/v1"
)

type mockObjectType int

const (
	mockPodListType mockObjectType = iota
	mockNodeListType
)

type mockObject struct {
	podList  *v1.PodList
	nodeList *v1.NodeList
	pc       *PromMetricCollector
}

func newMockObject(filename string, t mockObjectType) *mockObject {
	list, _ := ioutil.ReadFile(filename)
	mo := mockObject{}
	if t == mockPodListType {
		podList := v1.PodList{}
		json.Unmarshal(list, &podList)
		mo.podList = &podList
	} else if t == mockNodeListType {
		nodeList := v1.NodeList{}
		json.Unmarshal(list, &nodeList)
		mo.nodeList = &nodeList
	}
	mo.pc = &PromMetricCollector{}
	return &mo
}

func TestGeneratePodsMetrics(t *testing.T) {
	mo := newMockObject("../../testdata/pod_list.json", mockPodListType)

	mg := metricGenerator{}
	podMetrics := mg.generatePodMetrics(mo.podList)
	assert.Equal(t, 3, len(podMetrics))

	expectLables := [][]map[string]string{
		{
			{
				"host_ip": "10.151.41.8", "node_name": "test_node_0", "initialized": "true", "name": "log-manager-ds-nxm2k", "namespace": "default",
				"phase": "running", "pod_scheduled": "true", "ready": "true", "service_name": "log-manager",
			}, {
				"host_ip": "10.151.41.8", "node_name": "test_node_0",  "name": "log-manager-logrotate", "namespace": "default",
				"pod_name": "log-manager-ds-nxm2k", "state": "running", "ready": "true", "service_name": "log-manager",
			},
			{
				"host_ip": "10.151.41.8", "node_name": "test_node_0", "name": "log-manager-nginx", "namespace": "default",
				"pod_name": "log-manager-ds-nxm2k", "state": "running", "ready": "true", "service_name": "log-manager",
			},
		},
		{},
		{
			{
				"host_ip": "10.1.3.29", "node_name": "test_node_1", "initialized": "true", "job_name": "it_it_batch052_infer_80-159_bs2_V1",
				"name": "f1up4zk9ehfpjx2zc9gq8rv860uk4qv9dtk6awjz70r2uc9n75fp4wtjbxb32-taskrole-28", "namespace": "default",
				"phase": "pending", "pod_bound": "true", "pod_scheduled": "true", "ready": "false",
			},
		},
	}
	for i, podMetric := range podMetrics {
		promMetrics := mo.pc.getPodMetrics(podMetric)
		for j, m := range promMetrics {
			dm := &dto.Metric{}
			m.Write(dm)
			assert.Equal(t, float64(1), dm.GetGauge().GetValue())
			for _, l := range dm.Label {
				assert.Equal(t, expectLables[i][j][l.GetName()], l.GetValue())
			}
		}
	}
}

func TestGenerateNodesMetrics(t *testing.T) {
	mo := newMockObject("../../testdata/node_list.json", mockNodeListType)

	mg := metricGenerator{}
	nodeMetrics := mg.generateNodeMetrics(mo.nodeList)
	assert.Equal(t, 1, len(nodeMetrics))

	metrics := mo.pc.getPaiNodeMetrics(nodeMetrics[0])
	expectLables := []map[string]string{
		{
			"host_ip": "10.151.41.8", "node_name": "test_node_0", "disk_pressure": "false", "memory_pressure": "false",
			"ready": "true", "unschedulable": "false",
		},
	}
	for i, m := range metrics {
		dm := &dto.Metric{}
		m.Write(dm)
		assert.Equal(t, float64(1), dm.GetGauge().GetValue())
		for _, l := range dm.Label {
			assert.Equal(t, expectLables[i][l.GetName()], l.GetValue())
		}
	}

	mo = newMockObject("../../testdata/pod_list.json", mockPodListType)

	podMetrics := mg.generatePodMetrics(mo.podList)
	npMap := mg.generateNodeToPodsMap(podMetrics)
	gpuMetrics := mo.pc.getNodeGpuMetrics(nodeMetrics[0], npMap)
	assert.Equal(t, 3, len(gpuMetrics))

	type pair struct {
		name string
		num  float64
	}
	expectValue := []pair{
		{
			name: "k8s_node_gpu_available",
			num:  4,
		},
		{
			name: "k8s_node_gpu_reserved",
			num:  0,
		},
		{
			name: "k8s_node_gpu_total",
			num:  4,
		},
	}
	for i, m := range gpuMetrics {
		dm := &dto.Metric{}
		m.Write(dm)
		v := reflect.ValueOf(m.Desc())
		n := reflect.Indirect(v).FieldByName("fqName").String()
		assert.Equal(t, expectValue[i].name, n)
		assert.Equal(t, expectValue[i].num, dm.GetGauge().GetValue())
	}
}

func TestParseNoConditionPods(t *testing.T) {
	mo := newMockObject("../../testdata/no_condition_pod.json", mockPodListType)

	mg := metricGenerator{}
	podMetrics := mg.generatePodMetrics(mo.podList)
	assert.True(t, len(podMetrics) > 0)

	promMetrics := mo.pc.getPodMetrics(podMetrics[0])
	expectLables := []map[string]string{
		{
			"host_ip": "unscheduled", "node_name": "test_node_0", "initialized": "unknown", "name": "yarn-frameworklauncher-ds-2684q", "namespace": "default",
			"phase": "failed", "pod_scheduled": "unknown", "ready": "unknown", "service_name": "frameworklauncher",
		},
	}
	for i, m := range promMetrics {
		dm := &dto.Metric{}
		m.Write(dm)
		for _, l := range dm.Label {
			assert.Equal(t, expectLables[i][l.GetName()], l.GetValue())
		}
	}
}

func TestParseDLWSUnschedulableNodes(t *testing.T) {
	mo := newMockObject("../../testdata/dlws_node_list_with_unschedulable.json", mockNodeListType)
	mg := metricGenerator{}

	nodeMetrics := mg.generateNodeMetrics(mo.nodeList)
	promMetrics := mo.pc.getPaiNodeMetrics(nodeMetrics[0])
	expectLables := []map[string]string{
		{
			"host_ip": "192.168.255.1", "node_name": "dltsp40-infra01", "disk_pressure": "false", "memory_pressure": "false",
			"ready": "true", "unschedulable": "true",
		},
	}

	for i, m := range promMetrics {
		dm := &dto.Metric{}
		m.Write(dm)
		for _, l := range dm.Label {
			assert.Equal(t, expectLables[i][l.GetName()], l.GetValue())
		}
	}
}

func TestCollectMetrics(t *testing.T) {
	m := newMockK8sServer()
	m.addResponseByFile("/api/v1/pods", "../../testdata/pod_list.json", http.MethodGet)
	m.addResponseByFile("/api/v1/nodes", "../../testdata/node_list.json", http.MethodGet)
	m.addResponse("/healthz", "ok", http.MethodGet)

	url := m.start()
	defer m.stop()

	os.Setenv("KUBE_APISERVER_ADDRESS", url)
	c, _ := NewK8sClient()
	pc := NewPromMetricCollector(c, time.Minute)

	pc.collect()
	metrics := pc.getMetrics()

	// 3 gpu metrics + 1 api server metric + 1 pai node metric +
	//  4 pod/container related metrics + 5 error metrics + 3 histogram metrics
	assert.Equal(t, 17, len(metrics))
}
