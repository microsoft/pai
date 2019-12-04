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

package algorithm

import (
	"fmt"
	"github.com/microsoft/hivedscheduler/pkg/api"
	"github.com/microsoft/hivedscheduler/pkg/common"
	"github.com/microsoft/hivedscheduler/pkg/internal"
	core "k8s.io/api/core/v1"
	meta "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"net/http"
	"sort"
	"testing"
)

var allPods = map[string]*core.Pod{}

func init() {
	common.InitAll()
	for i := 1; i <= 25; i++ {
		podName := fmt.Sprintf("pod%v", i)
		allPods[podName] = &core.Pod{
			ObjectMeta: meta.ObjectMeta{
				Name:        podName,
				Namespace:   "test",
				UID:         types.UID(podName),
				Annotations: map[string]string{},
			},
		}
	}
}

var allNodes []string

func initNodes(h *HivedAlgorithm) {
	for _, ccl := range h.fullCellList {
		for _, c := range ccl[CellLevel(len(ccl))] {
			allNodes = append(allNodes, c.(*PhysicalCell).nodes...)
		}
	}
}

var group1, group2, group3, group4, group5, group6, group7, group8, group9, group10, group11, group12, group13, group14, group15, group16, group17 = &api.AffinityGroupSpec{
	Name:    "group1",
	Members: []api.AffinityGroupMemberSpec{{PodNumber: 1, GpuNumber: 1}},
}, &api.AffinityGroupSpec{
	Name:    "group2",
	Members: []api.AffinityGroupMemberSpec{{PodNumber: 1, GpuNumber: 1}},
}, &api.AffinityGroupSpec{
	Name:    "group3",
	Members: []api.AffinityGroupMemberSpec{{PodNumber: 1, GpuNumber: 8}},
}, &api.AffinityGroupSpec{
	Name:    "group4",
	Members: []api.AffinityGroupMemberSpec{{PodNumber: 1, GpuNumber: 1}},
}, &api.AffinityGroupSpec{
	Name:    "group5",
	Members: []api.AffinityGroupMemberSpec{{PodNumber: 2, GpuNumber: 16}},
}, &api.AffinityGroupSpec{
	Name:    "group6",
	Members: []api.AffinityGroupMemberSpec{{PodNumber: 1, GpuNumber: 1}},
}, &api.AffinityGroupSpec{
	Name:    "group7",
	Members: []api.AffinityGroupMemberSpec{{PodNumber: 3, GpuNumber: 8}},
}, &api.AffinityGroupSpec{
	Name:    "group8",
	Members: []api.AffinityGroupMemberSpec{{PodNumber: 1, GpuNumber: 8}},
}, &api.AffinityGroupSpec{
	Name:    "group9",
	Members: []api.AffinityGroupMemberSpec{{PodNumber: 1, GpuNumber: 7}, {PodNumber: 1, GpuNumber: 5}},
}, &api.AffinityGroupSpec{
	Name:    "group10",
	Members: []api.AffinityGroupMemberSpec{{PodNumber: 1, GpuNumber: 1}},
}, &api.AffinityGroupSpec{
	Name:    "group11",
	Members: []api.AffinityGroupMemberSpec{{PodNumber: 2, GpuNumber: 16}},
}, &api.AffinityGroupSpec{
	Name:    "group12",
	Members: []api.AffinityGroupMemberSpec{{PodNumber: 2, GpuNumber: 16}},
}, &api.AffinityGroupSpec{
	Name:    "group13",
	Members: []api.AffinityGroupMemberSpec{{PodNumber: 2, GpuNumber: 16}},
}, &api.AffinityGroupSpec{
	Name:    "group14",
	Members: []api.AffinityGroupMemberSpec{{PodNumber: 2, GpuNumber: 16}},
}, &api.AffinityGroupSpec{
	Name:    "group15",
	Members: []api.AffinityGroupMemberSpec{{PodNumber: 1, GpuNumber: 2}},
}, &api.AffinityGroupSpec{
	Name:    "group16",
	Members: []api.AffinityGroupMemberSpec{{PodNumber: 1, GpuNumber: 2}},
}, &api.AffinityGroupSpec{
	Name:    "group17",
	Members: []api.AffinityGroupMemberSpec{{PodNumber: 1, GpuNumber: 2}},
}

var pss = map[types.UID]api.PodSchedulingSpec{
	"pod1": {
		VirtualCluster:       "VC1",
		Priority:             0,
		LazyPreemptionEnable: true,
		ReservationId:        "",
		GpuType:              "DGX2-V100",
		GpuNumber:            1,
		AffinityGroup:        group1,
	}, "pod2": { // buddy of pod1
		VirtualCluster:       "VC1",
		Priority:             1,
		LazyPreemptionEnable: true,
		ReservationId:        "",
		GpuType:              "DGX2-V100",
		GpuNumber:            1,
		AffinityGroup:        group2,
	}, "pod3": { // non-buddy of pod 1 & 2 (avoidance of preemption)
		VirtualCluster:       "VC1",
		Priority:             2,
		LazyPreemptionEnable: true,
		ReservationId:        "",
		GpuType:              "DGX2-V100",
		GpuNumber:            8,
		AffinityGroup:        group3,
	}, "pod4": { // opportunistic pod (will stay away from the guaranteed pods)
		VirtualCluster:       "VC1",
		Priority:             -1,
		LazyPreemptionEnable: true,
		ReservationId:        "",
		GpuType:              "DGX2-V100",
		GpuNumber:            1,
		AffinityGroup:        group4,
	}, "pod5": { // use reservation
		VirtualCluster:       "VC1",
		Priority:             1,
		LazyPreemptionEnable: true,
		ReservationId:        "VC1-YQW-DGX2",
		GpuType:              "DGX2-V100",
		GpuNumber:            16,
		AffinityGroup:        group5,
	}, "pod6": { // use reservation
		VirtualCluster:       "VC1",
		Priority:             1,
		LazyPreemptionEnable: true,
		ReservationId:        "VC1-YQW-DGX2",
		GpuType:              "DGX2-V100",
		GpuNumber:            16,
		AffinityGroup:        group5,
	}, "pod7": { // out of quota; should return PodWaitInfo
		VirtualCluster:       "VC2",
		Priority:             1,
		LazyPreemptionEnable: true,
		ReservationId:        "",
		GpuType:              "DGX1-P100",
		GpuNumber:            8,
		AffinityGroup:        group7,
	}, "pod8": { // any GPU type; heterogeneous affinity group
		VirtualCluster:       "VC2",
		Priority:             1,
		LazyPreemptionEnable: true,
		ReservationId:        "",
		GpuType:              "",
		GpuNumber:            7,
		AffinityGroup:        group9,
	}, "pod9": { // any GPU type; heterogeneous affinity group
		VirtualCluster:       "VC2",
		Priority:             1,
		LazyPreemptionEnable: true,
		ReservationId:        "",
		GpuType:              "",
		GpuNumber:            5,
		AffinityGroup:        group9,
	}, "pod10": { // use a GPU type that the VC does not have; should User Error Panic
		VirtualCluster:       "VC2",
		Priority:             1,
		LazyPreemptionEnable: true,
		ReservationId:        "",
		GpuType:              "DGX2-V100",
		GpuNumber:            1,
		AffinityGroup:        group6,
	}, "pod11": { // invalid affinity group configuration
		VirtualCluster:       "VC2",
		Priority:             1,
		LazyPreemptionEnable: true,
		ReservationId:        "",
		GpuType:              "DGX1-P100",
		GpuNumber:            2,
		AffinityGroup:        group8,
	}, "pod12": { // invalid affinity group configuration
		VirtualCluster:       "VC2",
		Priority:             1,
		LazyPreemptionEnable: true,
		ReservationId:        "",
		GpuType:              "DGX1-P100",
		GpuNumber:            2,
		AffinityGroup:        group8,
	}, "pod13": { // invalid VC
		VirtualCluster:       "surprise!",
		Priority:             1,
		LazyPreemptionEnable: true,
		ReservationId:        "",
		GpuType:              "DGX1-P100",
		GpuNumber:            1,
		AffinityGroup:        group10,
	}, "pod14": { // invalid reservation
		VirtualCluster:       "VC2",
		Priority:             1,
		LazyPreemptionEnable: true,
		ReservationId:        "surprise!",
		GpuType:              "DGX1-P100",
		GpuNumber:            1,
		AffinityGroup:        group10,
	}, "pod15": { // invalid priority
		VirtualCluster:       "VC2",
		Priority:             1001,
		LazyPreemptionEnable: true,
		ReservationId:        "",
		GpuType:              "DGX1-P100",
		GpuNumber:            1,
		AffinityGroup:        group10,
	}, "pod16": { // trigger preemption
		VirtualCluster:       "VC1",
		Priority:             2,
		LazyPreemptionEnable: true,
		ReservationId:        "VC1-YQW-DGX2",
		GpuType:              "DGX2-V100",
		GpuNumber:            16,
		AffinityGroup:        group11,
	}, "pod17": { // trigger preemption
		VirtualCluster:       "VC1",
		Priority:             2,
		LazyPreemptionEnable: true,
		ReservationId:        "VC1-YQW-DGX2",
		GpuType:              "DGX2-V100",
		GpuNumber:            16,
		AffinityGroup:        group11,
	}, "pod18": { // used for test splitting physical cell hierarchies in reconfiguration
		VirtualCluster:       "VC1",
		Priority:             1,
		LazyPreemptionEnable: true,
		ReservationId:        "",
		GpuType:              "DGX2-V100",
		GpuNumber:            16,
		AffinityGroup:        group12,
	}, "pod19": { // used for test splitting physical cell hierarchies in reconfiguration
		VirtualCluster:       "VC1",
		Priority:             1,
		LazyPreemptionEnable: true,
		ReservationId:        "",
		GpuType:              "DGX2-V100",
		GpuNumber:            16,
		AffinityGroup:        group12,
	}, "pod20": { // guaranteed pod in splitting physical cell hierarchies
		VirtualCluster:       "VC1",
		Priority:             1,
		LazyPreemptionEnable: true,
		ReservationId:        "",
		GpuType:              "DGX2-V100",
		GpuNumber:            16,
		AffinityGroup:        group13,
	}, "pod21": { // guaranteed pod in splitting physical cell hierarchies
		VirtualCluster:       "VC1",
		Priority:             1,
		LazyPreemptionEnable: true,
		ReservationId:        "",
		GpuType:              "DGX2-V100",
		GpuNumber:            16,
		AffinityGroup:        group13,
	}, "pod22": { // opportunistic pod in splitting physical cell hierarchies
		VirtualCluster:       "VC1",
		Priority:             -1,
		LazyPreemptionEnable: true,
		ReservationId:        "",
		GpuType:              "DGX2-V100",
		GpuNumber:            16,
		AffinityGroup:        group14,
	}, "pod23": { // opportunistic pod in splitting physical cell hierarchies
		VirtualCluster:       "VC1",
		Priority:             -1,
		LazyPreemptionEnable: true,
		ReservationId:        "",
		GpuType:              "DGX2-V100",
		GpuNumber:            16,
		AffinityGroup:        group14,
	}, "pod24": { // used for triggering intra-VC preemption
		VirtualCluster:       "VC2",
		Priority:             0,
		LazyPreemptionEnable: true,
		ReservationId:        "",
		GpuType:              "CT1",
		GpuNumber:            2,
		AffinityGroup:        group15,
	}, "pod25": { // trigger intra-VC preemption
		VirtualCluster:       "VC2",
		Priority:             1,
		LazyPreemptionEnable: false,
		ReservationId:        "",
		GpuType:              "CT1",
		GpuNumber:            2,
		AffinityGroup:        group16,
	}, "pod26": { // will preempt pod25 immediately (as lazy preemption is not enabled)
		VirtualCluster:       "VC2",
		Priority:             2,
		LazyPreemptionEnable: false,
		ReservationId:        "",
		GpuType:              "CT1",
		GpuNumber:            2,
		AffinityGroup:        group17,
	},
}

var casesThatShouldSucceed = []string{
	"pod1", "pod2", "pod3", "pod4", "pod5", "pod6", "pod7", "pod8", "pod9", "pod16", "pod17", "pod18", "pod19", "pod20", "pod21", "pod22", "pod23", "pod24", "pod25",
}

var casesThatShouldFail = [][]string{
	{"pod10"}, {"pod11", "pod12"}, {"pod13"}, {"pod14"}, {"pod15"},
}

var casesThatShouldBeLazyPreempted = []string{
	"pod8", "pod9", "pod20", "pod21", "pod24",
}

type result struct {
	node         string
	gpuIsolation []int32
}

var expectedBindInfos = map[string]result{
	"pod1":  {node: "0.0.1.0", gpuIsolation: []int32{0}},
	"pod2":  {node: "0.0.1.0", gpuIsolation: []int32{1}},
	"pod3":  {node: "0.0.1.0", gpuIsolation: []int32{8, 9, 10, 11, 12, 13, 14, 15}},
	"pod4":  {node: "0.0.5.0", gpuIsolation: []int32{0}},
	"pod5":  {node: "0.0.3.0", gpuIsolation: []int32{0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15}},
	"pod6":  {node: "0.0.3.1", gpuIsolation: []int32{0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15}},
	"pod8":  {node: "1.0.0.1", gpuIsolation: []int32{0, 1, 2, 3, 4, 5, 6}},
	"pod9":  {node: "1.0.0.2", gpuIsolation: []int32{0, 1, 2, 3, 4}},
	"pod18": {node: "0.0.3.2", gpuIsolation: []int32{0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15}},
	"pod19": {node: "0.0.3.3", gpuIsolation: []int32{0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15}},
	"pod20": {node: "0.0.4.0", gpuIsolation: []int32{0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15}},
	"pod21": {node: "0.0.4.1", gpuIsolation: []int32{0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15}},
	"pod22": {node: "0.0.4.2", gpuIsolation: []int32{0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15}},
	"pod23": {node: "0.0.4.3", gpuIsolation: []int32{0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15}},
	"pod24": {node: "0.0.0.0", gpuIsolation: []int32{0, 1}},
	"pod25": {node: "0.0.0.1", gpuIsolation: []int32{0, 1}},
}

var expectedPreemptInfos = map[string]common.Set{
	"pod16": common.NewSet("pod5", "pod6"),
	"pod17": common.NewSet("pod5", "pod6"),
	"pod26": common.NewSet("pod25"),
}

var allocatedPods []*core.Pod

func TestHivedAlgorithm(t *testing.T) {
	configFilePath := "../../example/config/design/hivedscheduler.yaml"
	sConfig := api.NewConfig(&configFilePath)
	h := NewHivedAlgorithm(sConfig)
	initNodes(h)
	// sort chains of each GPU type for stability of the test
	for _, chains := range h.chains {
		sortChains(chains)
	}

	printConfig(t, h)
	testNormalOperations(t, h)
	testReconfiguration(t, sConfig)
	testInvalidInitialAssignment(t, sConfig)
}

func sortChains(chains []CellChain) {
	var chainsTemp []string
	for _, c := range chains {
		chainsTemp = append(chainsTemp, string(c))
	}
	sort.Strings(chainsTemp)
	for i := range chains {
		chains[i] = CellChain(chainsTemp[len(chainsTemp)-i-1])
	}
}

func printConfig(t *testing.T, h *HivedAlgorithm) {
	for chain, ccl := range h.fullCellList {
		t.Logf("%v", chain)
		t.Logf("%v", ccl)
	}
	for vc, vcs := range h.vcSchedulers {
		t.Logf("%v", vc)
		for chain, ccl := range vcs.getNonReservedCellList() {
			t.Logf("%v", chain)
			t.Logf("%v", ccl)
		}
		t.Logf("Reservation")
		for rid, ccl := range vcs.getReservedCellList() {
			t.Logf(string(rid))
			t.Logf("%v", ccl)
		}
	}
	for gpuType, chains := range h.chains {
		t.Logf("%v: %v", gpuType, chains)
	}
}

func testNormalOperations(t *testing.T, h *HivedAlgorithm) {
	testCasesThatShouldSucceed(t, h)
	testCasesThatShouldFail(t, h)
	testDeleteAllocatedPods(t, h)
}

func testCasesThatShouldSucceed(t *testing.T, h *HivedAlgorithm) {
	allocatedPods = []*core.Pod{}
	var psr internal.PodScheduleResult
	for _, podName := range casesThatShouldSucceed {
		pod := allPods[podName]
		pod.Annotations[api.AnnotationKeyPodSchedulingSpec] = common.ToYaml(pss[pod.UID])
		psr = h.Schedule(pod, allNodes)
		compareSchedulingResult(t, pod, psr)
		if psr.PodBindInfo != nil {
			allocatedPod := internal.NewBindingPod(pod, psr.PodBindInfo)
			h.AddAllocatedPod(allocatedPod)
			allocatedPods = append(allocatedPods, allocatedPod)
		}
	}
}

func testOneCaseThatShouldFail(t *testing.T, h *HivedAlgorithm, podNames []string) {
	defer func() {
		if r := recover(); r != nil {
			if err, ok := r.(*api.WebServerError); ok &&
				err.Code >= http.StatusBadRequest &&
				err.Code < http.StatusInternalServerError {
				t.Logf("Got User Error Panic as expected: %v", err)
			} else {
				t.Errorf("Expected User Error Panic, but got %v", r)
			}
		} else {
			t.Errorf("Expected User Error Panic, but got none")
		}
	}()
	var psr internal.PodScheduleResult
	for _, podName := range podNames {
		pod := allPods[podName]
		pod.Annotations[api.AnnotationKeyPodSchedulingSpec] = common.ToYaml(pss[pod.UID])
		psr = h.Schedule(pod, allNodes)
		allocatedPod := internal.NewBindingPod(pod, psr.PodBindInfo)
		h.AddAllocatedPod(allocatedPod)
		allocatedPods = append(allocatedPods, allocatedPod)
	}
}

func testCasesThatShouldFail(t *testing.T, h *HivedAlgorithm) {
	for _, pods := range casesThatShouldFail {
		testOneCaseThatShouldFail(t, h, pods)
	}
}

func testDeleteAllocatedPods(t *testing.T, h *HivedAlgorithm) {
	for i := len(allocatedPods) - 1; i >= 0; i-- {
		h.DeleteAllocatedPod(allocatedPods[i])
	}
	for _, pod := range allocatedPods {
		if g, ok := h.allocatedAffinityGroups[pss[pod.UID].AffinityGroup.Name]; ok {
			t.Errorf("Group %v is expected to be deleted in scheduler, but not", g.name)
		}
	}
}

func testReconfiguration(t *testing.T, sConfig *api.Config) {
	h := NewHivedAlgorithm(sConfig)
	for _, chains := range h.chains {
		sortChains(chains)
	}
	testCasesThatShouldSucceed(t, h)

	// case: physical cell not found
	(*sConfig.PhysicalCluster).PhysicalCells[7].CellChildren[0].CellChildren[0].CellAddress = "0.0.3.100"
	// case: insufficient VC quota
	(*sConfig.VirtualClusters)["VC2"].VirtualCells[0].CellNumber = 1
	// case: physical cells are split to smaller ones in the spec so that
	// they cannot be bound to the virtual cells previously allocated
	originalCell := (*sConfig.PhysicalCluster).PhysicalCells[8]
	(*sConfig.PhysicalCluster).PhysicalCells[8] = originalCell.CellChildren[0].CellChildren[0]
	(*sConfig.PhysicalCluster).PhysicalCells = append((*sConfig.PhysicalCluster).PhysicalCells, originalCell.CellChildren[0].CellChildren[1])
	(*sConfig.PhysicalCluster).PhysicalCells = append((*sConfig.PhysicalCluster).PhysicalCells, originalCell.CellChildren[1].CellChildren[0])
	(*sConfig.PhysicalCluster).PhysicalCells = append((*sConfig.PhysicalCluster).PhysicalCells, originalCell.CellChildren[1].CellChildren[1])
	h = NewHivedAlgorithm(sConfig)
	for _, chains := range h.chains {
		sortChains(chains)
	}
	for _, pod := range allocatedPods {
		h.AddAllocatedPod(pod)
	}
	for _, podName := range casesThatShouldBeLazyPreempted {
		pod := allPods[podName]
		g := h.allocatedAffinityGroups[pss[pod.UID].AffinityGroup.Name]
		if g.virtualGpuPlacement != nil {
			t.Errorf("Group %v is expected to be lazy preempted, but not", g.name)
		}
	}
	testDeleteAllocatedPods(t, h)
}

func testInvalidInitialAssignment(t *testing.T, sConfig *api.Config) {
	defer func() {
		if err := recover(); err != nil {
			t.Logf("Initial assignment validation failed as expected: %v", err)
		} else {
			t.Errorf("Expected error in initial assignment validation, but got none")
		}
	}()
	(*sConfig.VirtualClusters)["VC1"].VirtualCells[0].CellType = "CT1-NODE"
	(*sConfig.VirtualClusters)["VC1"].VirtualCells[1].CellType = "CT1-NODE.CT1"
	(*sConfig.VirtualClusters)["VC1"].VirtualCells[1].CellNumber = 2
	NewHivedAlgorithm(sConfig)
}

func compareGpuIsolation(a []int32, b []int32) bool {
	if len(a) == len(b) {
		for i := 0; i < len(a); i++ {
			if a[i] != b[i] {
				return false
			}
		}
		return true
	}
	return false
}

func containsPods(a []*core.Pod, b common.Set) bool {
	for _, p := range a {
		if !b.Contains(p.Name) {
			return false
		}
	}
	return true
}

func compareSchedulingResult(t *testing.T, pod *core.Pod, psr internal.PodScheduleResult) {
	if expected, ok := expectedBindInfos[pod.Name]; !ok {
		if psr.PodBindInfo != nil {
			t.Errorf("[%v]: wrong pod scheduling result: expected empty, but got %v:%v",
				internal.Key(pod), psr.PodBindInfo.Node, psr.PodBindInfo.GpuIsolation)
		}
		if !expectedPreemptInfos[pod.Name].IsEmpty() && !containsPods(psr.PodPreemptInfo.VictimPods, expectedPreemptInfos[pod.Name]) {
			t.Errorf("[%v]: wrong preempt victims: expected %v, but got %v",
				internal.Key(pod), expectedPreemptInfos[pod.Name], psr.PodPreemptInfo.VictimPods)
		}
	} else if psr.PodBindInfo.Node != expected.node ||
		!compareGpuIsolation(psr.PodBindInfo.GpuIsolation, expected.gpuIsolation) {
		t.Errorf("[%v]: wrong pod bind info: expected %v:%v, but got %v:%v",
			internal.Key(pod), expected.node, expected.gpuIsolation, psr.PodBindInfo.Node, psr.PodBindInfo.GpuIsolation)
	}
}
