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

func init() {
	common.InitAll()
}

var allNodes []string

func initNodes(h *HivedAlgorithm) {
	for _, ccl := range h.fullCellList {
		for _, c := range ccl[CellLevel(len(ccl))] {
			allNodes = append(allNodes, c.(*PhysicalCell).nodes...)
		}
	}
}

var pod1, pod2, pod3, pod4, pod5, pod6, pod7, pod8, pod9, pod10, pod11, pod12, pod13, pod14, pod15 = &core.Pod{
	ObjectMeta: meta.ObjectMeta{
		Name:        "pod1",
		Namespace:   "test",
		UID:         "pod1",
		Annotations: map[string]string{},
	},
}, &core.Pod{
	ObjectMeta: meta.ObjectMeta{
		Name:        "pod2",
		Namespace:   "test",
		UID:         "pod2",
		Annotations: map[string]string{},
	},
}, &core.Pod{
	ObjectMeta: meta.ObjectMeta{
		Name:        "pod3",
		Namespace:   "test",
		UID:         "pod3",
		Annotations: map[string]string{},
	},
}, &core.Pod{
	ObjectMeta: meta.ObjectMeta{
		Name:        "pod4",
		Namespace:   "test",
		UID:         "pod4",
		Annotations: map[string]string{},
	},
}, &core.Pod{
	ObjectMeta: meta.ObjectMeta{
		Name:        "pod5",
		Namespace:   "test",
		UID:         "pod5",
		Annotations: map[string]string{},
	},
}, &core.Pod{
	ObjectMeta: meta.ObjectMeta{
		Name:        "pod6",
		Namespace:   "test",
		UID:         "pod6",
		Annotations: map[string]string{},
	},
}, &core.Pod{
	ObjectMeta: meta.ObjectMeta{
		Name:        "pod7",
		Namespace:   "test",
		UID:         "pod7",
		Annotations: map[string]string{},
	},
}, &core.Pod{
	ObjectMeta: meta.ObjectMeta{
		Name:        "pod8",
		Namespace:   "test",
		UID:         "pod8",
		Annotations: map[string]string{},
	},
}, &core.Pod{
	ObjectMeta: meta.ObjectMeta{
		Name:        "pod9",
		Namespace:   "test",
		UID:         "pod9",
		Annotations: map[string]string{},
	},
}, &core.Pod{
	ObjectMeta: meta.ObjectMeta{
		Name:        "pod10",
		Namespace:   "test",
		UID:         "pod10",
		Annotations: map[string]string{},
	},
}, &core.Pod{
	ObjectMeta: meta.ObjectMeta{
		Name:        "pod11",
		Namespace:   "test",
		UID:         "pod11",
		Annotations: map[string]string{},
	},
}, &core.Pod{
	ObjectMeta: meta.ObjectMeta{
		Name:        "pod12",
		Namespace:   "test",
		UID:         "pod12",
		Annotations: map[string]string{},
	},
}, &core.Pod{
	ObjectMeta: meta.ObjectMeta{
		Name:        "pod13",
		Namespace:   "test",
		UID:         "pod13",
		Annotations: map[string]string{},
	},
}, &core.Pod{
	ObjectMeta: meta.ObjectMeta{
		Name:        "pod14",
		Namespace:   "test",
		UID:         "pod14",
		Annotations: map[string]string{},
	},
}, &core.Pod{
	ObjectMeta: meta.ObjectMeta{
		Name:        "pod15",
		Namespace:   "test",
		UID:         "pod15",
		Annotations: map[string]string{},
	},
}

var group1, group2, group3, group4, group5, group6, group7, group8, group9, group10 = &api.AffinityGroup{
	Name:    "group1",
	Members: []api.AffinityGroupMember{{PodNumber: 1, GpuNumber: 1}},
}, &api.AffinityGroup{
	Name:    "group2",
	Members: []api.AffinityGroupMember{{PodNumber: 1, GpuNumber: 1}},
}, &api.AffinityGroup{
	Name:    "group3",
	Members: []api.AffinityGroupMember{{PodNumber: 2, GpuNumber: 1}},
}, &api.AffinityGroup{
	Name:    "group4",
	Members: []api.AffinityGroupMember{{PodNumber: 1, GpuNumber: 1}},
}, &api.AffinityGroup{
	Name:    "group5",
	Members: []api.AffinityGroupMember{{PodNumber: 2, GpuNumber: 1}},
}, &api.AffinityGroup{
	Name:    "group6",
	Members: []api.AffinityGroupMember{{PodNumber: 1, GpuNumber: 1}},
}, &api.AffinityGroup{
	Name:    "group7",
	Members: []api.AffinityGroupMember{{PodNumber: 2, GpuNumber: 8}},
}, &api.AffinityGroup{
	Name:    "group8",
	Members: []api.AffinityGroupMember{{PodNumber: 1, GpuNumber: 8}},
}, &api.AffinityGroup{
	Name:    "group9",
	Members: []api.AffinityGroupMember{{PodNumber: 1, GpuNumber: 1}},
}, &api.AffinityGroup{
	Name:    "group10",
	Members: []api.AffinityGroupMember{{PodNumber: 1, GpuNumber: 1}},
}

var pss = map[types.UID]api.PodSchedulingSpec{
	"pod1": {
		VirtualCluster: "VC1",
		Priority:       0,
		ReservationId:  "",
		GpuType:        "DGX2-V100",
		GpuNumber:      1,
		AffinityGroup:  group1,
	}, "pod2": { // shouldn't be buddy of pod1 (due to preemption-avoidance)
		VirtualCluster: "VC1",
		Priority:       1,
		ReservationId:  "",
		GpuType:        "DGX2-V100",
		GpuNumber:      1,
		AffinityGroup:  group2,
	}, "pod3": { // share the same cell with pod4
		VirtualCluster: "VC1",
		Priority:       1,
		ReservationId:  "",
		GpuType:        "DGX2-V100",
		GpuNumber:      1,
		AffinityGroup:  group3,
	}, "pod4": { // share the same cell with pod3
		VirtualCluster: "VC1",
		Priority:       1,
		ReservationId:  "",
		GpuType:        "DGX2-V100",
		GpuNumber:      1,
		AffinityGroup:  group3,
	}, "pod5": { // low-priority pod
		VirtualCluster: "VC1",
		Priority:       -1,
		ReservationId:  "",
		GpuType:        "DGX2-V100",
		GpuNumber:      1,
		AffinityGroup:  group4,
	}, "pod6": { // use reservation
		VirtualCluster: "VC1",
		Priority:       1,
		ReservationId:  "VC1-YQW-DGX2",
		GpuType:        "DGX2-V100",
		GpuNumber:      1,
		AffinityGroup:  group5,
	}, "pod7": { // use reservation
		VirtualCluster: "VC1",
		Priority:       1,
		ReservationId:  "VC1-YQW-DGX2",
		GpuType:        "DGX2-V100",
		GpuNumber:      1,
		AffinityGroup:  group5,
	}, "pod8": { // out of quota; should return PodWaitInfo
		VirtualCluster: "VC2",
		Priority:       1,
		ReservationId:  "",
		GpuType:        "DGX1-P100",
		GpuNumber:      8,
		AffinityGroup:  group7,
	}, "pod9": { // any GPU type
		VirtualCluster: "VC2",
		Priority:       1,
		ReservationId:  "",
		GpuType:        "",
		GpuNumber:      1,
		AffinityGroup:  group9,
	}, "pod10": { // use a GPU type that the VC does not have; should panic BadRequest
		VirtualCluster: "VC2",
		Priority:       1,
		ReservationId:  "",
		GpuType:        "DGX2-V100",
		GpuNumber:      1,
		AffinityGroup:  group6,
	}, "pod11": { // invalid affinity group configuration
		VirtualCluster: "VC2",
		Priority:       1,
		ReservationId:  "",
		GpuType:        "DGX1-P100",
		GpuNumber:      8,
		AffinityGroup:  group8,
	}, "pod12": { // invalid affinity group configuration
		VirtualCluster: "VC2",
		Priority:       1,
		ReservationId:  "",
		GpuType:        "DGX1-P100",
		GpuNumber:      8,
		AffinityGroup:  group8,
	}, "pod13": { // invalid VC
		VirtualCluster: "surprise!",
		Priority:       1,
		ReservationId:  "",
		GpuType:        "DGX1-P100",
		GpuNumber:      1,
		AffinityGroup:  group10,
	}, "pod14": { // invalid reservation
		VirtualCluster: "VC2",
		Priority:       1,
		ReservationId:  "surprise!",
		GpuType:        "DGX1-P100",
		GpuNumber:      1,
		AffinityGroup:  group10,
	}, "pod15": { // invalid priority
		VirtualCluster: "VC2",
		Priority:       1001,
		ReservationId:  "",
		GpuType:        "DGX1-P100",
		GpuNumber:      1,
		AffinityGroup:  group10,
	},
}

var casesThatShouldSucceed = []*core.Pod{
	pod1, pod2, pod3, pod4, pod5, pod6, pod7, pod8, pod9,
}

var casesThatShouldFail = [][]*core.Pod{
	{pod10}, {pod11, pod12}, {pod13}, {pod14}, {pod15},
}

type result struct {
	node         string
	gpuIsolation []int32
}

var expectedResult = map[*core.Pod]result{
	pod1: {node: "0.0.1.0", gpuIsolation: []int32{0}},
	pod2: {node: "0.0.5.0", gpuIsolation: []int32{0}},
	pod3: {node: "0.0.5.0", gpuIsolation: []int32{2}},
	pod4: {node: "0.0.5.0", gpuIsolation: []int32{3}},
	pod5: {node: "0.0.1.0", gpuIsolation: []int32{1}},
	pod6: {node: "0.0.3.0", gpuIsolation: []int32{0}},
	pod7: {node: "0.0.3.0", gpuIsolation: []int32{1}},
	pod9: {node: "1.0.0.2", gpuIsolation: []int32{0}},
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

	testCasesThatShouldSucceed(t, h)
	testCasesThatShouldFail(t, h)
	for i := len(allocatedPods) - 1; i >= 0; i-- {
		h.DeleteAllocatedPod(allocatedPods[i])
	}

	testInvalidInitialAssignment(t, sConfig)
}

func testCasesThatShouldSucceed(t *testing.T, h *HivedAlgorithm) {
	var psr internal.PodScheduleResult
	for _, pod := range casesThatShouldSucceed {
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

func testOneCaseThatShouldFail(t *testing.T, h *HivedAlgorithm, pods []*core.Pod) {
	defer func() {
		if r := recover(); r != nil {
			if err, ok := r.(*api.WebServerError); ok && err.Code == http.StatusBadRequest {
				t.Logf("Got BadRequest as expected: %v", err)
			} else {
				t.Errorf("Expected BadRequest error, but got %v", r)
			}
		} else {
			t.Errorf("Expected BadRequest error, but got none")
		}
	}()
	var psr internal.PodScheduleResult
	for _, pod := range pods {
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

func testInvalidInitialAssignment(t *testing.T, sConfig *api.Config) {
	defer func() {
		if err := recover(); err != nil {
			t.Logf("Initial assignment validation failed as expected: %v", err)
		} else {
			t.Errorf("Expected error in initial assignment validation, but got none")
		}
	}()
	(*sConfig.VirtualClusters)["VC2"].VirtualCells[0].CellNumber = 1000
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

func compareSchedulingResult(t *testing.T, pod *core.Pod, psr internal.PodScheduleResult) {
	expected := expectedResult[pod]
	if expected.node == "" {
		if psr.PodBindInfo != nil {
			t.Errorf("[%v]: wrong pod scheduling result: expected empty, but got %v:%v",
				internal.Key(pod), psr.PodBindInfo.Node, psr.PodBindInfo.GpuIsolation)
		}
	} else if psr.PodBindInfo.Node != expected.node ||
		!compareGpuIsolation(psr.PodBindInfo.GpuIsolation, expected.gpuIsolation) {
		t.Errorf("[%v]: wrong pod scheduling result: expected %v:%v, but got %v:%v",
			internal.Key(pod), expected.node, expected.gpuIsolation, psr.PodBindInfo.Node, psr.PodBindInfo.GpuIsolation)
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
	for chain, levelNums := range h.gpuNums {
		t.Logf("%v", chain)
		for level, num := range levelNums {
			t.Logf("%v: %v GPUs", level, num)
		}
	}
	for gpuType, chains := range h.chains {
		t.Logf("%v: %v", gpuType, chains)
	}
}

func TestBuddyAlloc(t *testing.T) {
	chain := CellChain("test")
	spec := map[CellLevel]int32{1: 0, 2: 2, 3: 2, 4: 2, 5: 1}
	fullCellList := constructChainCellList("vc1", chain, 5, 2, spec)

	requestCell(t, fullCellList, -1, 1)
	requestCell(t, fullCellList, 2, 1)
	requestCell(t, fullCellList, 3, 3)
	requestCell(t, fullCellList, 2, 1)
}

func constructChainCellList(
	vc string,
	chain CellChain,
	topLevel CellLevel,
	numTop int32,
	spec map[CellLevel]int32) ChainCellList {

	isVirtual := true
	if len(vc) == 0 {
		isVirtual = false
		vc = "physical"
	}

	ccl := NewChainCellList(topLevel)
	for i := int32(0); i < numTop; i++ {
		if isVirtual {
			constructVirtualCellListForOneTop(vc, chain, topLevel, nil, spec, ccl)
		} else {
			constructPhysicalCellListForOneTop(chain, topLevel, spec, ccl)
		}
	}
	return ccl
}

func constructPhysicalCellListForOneTop(
	chain CellChain,
	l CellLevel,
	spec map[CellLevel]int32,
	ccl ChainCellList) *PhysicalCell {

	c := NewPhysicalCell(chain, l)
	if spec[l] > 0 {
		children := make(CellList, spec[l])
		for i := int32(0); i < spec[l]; i++ {
			child := constructPhysicalCellListForOneTop(chain, l-1, spec, ccl)
			child.SetParent(c)
			children[i] = child
		}
		c.SetChildren(children)
	}
	ccl[l] = append(ccl[l], c)
	return c
}

func constructVirtualCellListForOneTop(
	vc string,
	chain CellChain,
	l CellLevel,
	pac *VirtualCell,
	spec map[CellLevel]int32,
	ccl ChainCellList) *VirtualCell {

	c := NewVirtualCell(api.VirtualClusterName(vc), chain, l, int32(0), pac)
	if pac == nil {
		c.SetPreAssignedCell(c)
	}
	if spec[l] > 0 {
		children := make(CellList, spec[l])
		for i := int32(0); i < spec[l]; i++ {
			child := constructVirtualCellListForOneTop(vc, chain, l-1, c.GetPreAssignedCell(), spec, ccl)
			child.SetParent(c)
			children[i] = child
		}
		c.SetChildren(children)
	}
	ccl[l] = append(ccl[l], c)
	return c
}

func requestCell(t *testing.T, fullCellList ChainCellList, p CellPriority, l CellLevel) Cell {
	t.Logf("Requesting: level %v with priority %v", l, p)
	cellView := getCellViewWithPriority(fullCellList, p)
	t.Logf("==== Before allocation ====")
	t.Logf("%v", cellView)
	c := buddyAlloc(cellView, l)
	if c != nil {
		setSelfAndParentPriority(c, p, unlimitedLevel)
		setChildrenPriority(c, freePriority)
		t.Logf("Return cell %v", c.GetName())
	} else {
		t.Logf("No cell returned")
	}
	t.Logf("==== After allocation ====")
	t.Logf("%v", cellView)
	t.Logf("")
	return c
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
