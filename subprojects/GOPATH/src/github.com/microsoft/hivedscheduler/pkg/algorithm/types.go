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
	core "k8s.io/api/core/v1"
	"k8s.io/klog"
	"strings"
)

type (
	CellChain    string // name of a cell chain (type of the top-level cell)
	CellLevel    int32  // starts from 1
	CellPriority int32
)

type schedulingRequest struct {
	vc                   api.VirtualClusterName
	reservationId        api.ReservationId
	chain                CellChain
	affinityGroupName    string
	affinityGroupPodNums map[int32]int32 // gpu number -> pod number
	priority             CellPriority
}

// CellList is a list of cells at a certain level of a chain.
type CellList []Cell

func (cl CellList) String() string {
	names := make([]string, len(cl))
	for i, c := range cl {
		if cc, ok := c.(*PhysicalCell); ok {
			names[i] = fmt.Sprintf("%v(%v)(%v)", cc.GetName(), cc.GetPriority(), cc.GetPhysicalPlacementString())
		} else {
			names[i] = fmt.Sprintf("%v(%v)", c.GetName(), c.GetPriority())
		}
	}
	return strings.Join(names, ", ")
}

func (cl CellList) remove(c Cell) CellList {
	index := -1
	for i, cc := range cl {
		if CellEqual(cc, c) {
			index = i
			break
		}
	}
	if index < 0 {
		panic(fmt.Sprintf("Cell not not found in list when removing: %v",
			c.GetName()))
	}
	length := len(cl)
	cl[index] = cl[length-1]
	cl[length-1] = nil
	return cl[:length-1]
}

// ChainCellList maps each level in a chain to a CellList.
type ChainCellList map[CellLevel]CellList

func NewChainCellList(top CellLevel) ChainCellList {
	ccl := ChainCellList{}
	for i := CellLevel(1); i <= top; i++ {
		ccl[i] = CellList{}
	}
	return ccl
}

func (ccl ChainCellList) String() string {
	str := ""
	for i := 1; i <= len(ccl); i++ {
		str += fmt.Sprintf("level %v: %v\n", i, ccl[CellLevel(i)])
	}
	return str
}

func (ccl ChainCellList) remove(c Cell, l CellLevel) {
	ccl[l] = ccl[l].remove(c)
	klog.Infof("Cell removed from cell list: %v", c.GetName())
}

// AlgoAffinityGroup is the algorithm-internal representation of an affinity group.
type AlgoAffinityGroup struct {
	name                 string
	lazyPreemptionEnable bool
	totalPodNums         map[int32]int32       // GpuNum -> PodNum
	allocatedPods        map[int32][]*core.Pod // GpuNum -> a list of allocated pods and node addresses
	physicalGpuPlacement map[int32][]CellList  // GpuNum -> a list of pods -> a list of physical GPUs of each pod
	virtualGpuPlacement  map[int32][]CellList  // GpuNum -> a list of pods -> a list of virtual GPUs of each pod
	lazyPreemptionStatus *api.LazyPreemptionStatus
}

func newAlgoAffinityGroup(g *api.AffinityGroupSpec, lazyPreemptionEnable bool) *AlgoAffinityGroup {
	podNums := make(map[int32]int32)
	for _, m := range g.Members {
		podNums[m.GpuNumber] += m.PodNumber
	}
	group := &AlgoAffinityGroup{
		name:                 g.Name,
		lazyPreemptionEnable: lazyPreemptionEnable,
		totalPodNums:         podNums,
		allocatedPods:        map[int32][]*core.Pod{},
		physicalGpuPlacement: map[int32][]CellList{},
		virtualGpuPlacement:  map[int32][]CellList{},
	}
	for gpuNum, podNum := range podNums {
		group.physicalGpuPlacement[gpuNum] = make([]CellList, podNum)
		group.virtualGpuPlacement[gpuNum] = make([]CellList, podNum)
		for i := int32(0); i < podNum; i++ {
			group.physicalGpuPlacement[gpuNum][i] = make(CellList, gpuNum)
			group.virtualGpuPlacement[gpuNum][i] = make(CellList, gpuNum)
		}
	}
	return group
}

func (aag *AlgoAffinityGroup) ToAffinityGroup() api.AffinityGroup {
	ag := api.AffinityGroup{}
	ag.Name = aag.name
	ag.Status.LazyPreemptionStatus = aag.lazyPreemptionStatus
	return ag
}
