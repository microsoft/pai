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
	"github.com/microsoft/hivedscheduler/pkg/common"
	"sort"
)

type topologyAwareScheduler struct {
	clusterView              CellList
	podGpuNumbers            []int32
	currentSolutionIndices   []int32
	currentLCA               CellList
	lowestLCASolution        CellList
	lowestLCASolutionIndices []int32
	lowestLCALevel           CellLevel
	crossPriorityPack        bool
}

func newTopologyAwareScheduler(ccl ChainCellList, crossPriorityPack bool) *topologyAwareScheduler {
	var l CellLevel
	for l = CellLevel(1); l <= CellLevel(len(ccl)); l++ {
		if ccl[l][0].AtOrHigherThanNode() {
			break
		}
	}
	clusterView := make(CellList, len(ccl[l]))
	copy(clusterView, ccl[l])
	cellSets := common.NewSet()
	for ; l > CellLevel(1); l-- {
		for _, c := range ccl[l-1] {
			if r := findRootCell(c); r.GetLevel() < l {
				cellSets.Add(r)
			}
		}
	}
	for item := range cellSets.Items() {
		c := item.(Cell)
		clusterView = append(clusterView, c)
	}
	return &topologyAwareScheduler{
		clusterView:clusterView,
		crossPriorityPack: crossPriorityPack}
}

func findRootCell(c Cell) Cell {
	for c.GetParent() != nil {
		c = c.GetParent()
	}
	return c
}

func (t *topologyAwareScheduler) schedule(
	podGpuNumbers map[int32]int32,
	p CellPriority) map[int32][]CellList {

	t.podGpuNumbers = []int32{}
	for gpuNum, podNum := range podGpuNumbers {
		for i := int32(0); i < podNum; i++ {
			t.podGpuNumbers = append(t.podGpuNumbers, gpuNum)
		}
	}
	sortGpuNumbers(t.podGpuNumbers)
	priority := opportunisticPriority
	t.updateClusterView(priority)
	success := t.findNodesForPods(priority)
	if !success && p > opportunisticPriority {
		priority = p
		t.updateClusterView(priority)
		success = t.findNodesForPods(priority)
	}
	if success {
		selectedNodes := make(CellList, len(t.podGpuNumbers))
		for i := 0; i < len(t.currentSolutionIndices); i++ {
			selectedNodes[i] = t.clusterView[t.currentSolutionIndices[i]]
		}
		nodeGpus := map[Cell]CellList{}
		podPlacements := map[int32][]CellList{}
		for podIndex := 0; podIndex < len(t.podGpuNumbers); podIndex++ {
			gpuNumber := t.podGpuNumbers[podIndex]
			node := selectedNodes[podIndex]
			nodeGpus[node] = t.findGpusInNode(node, gpuNumber, priority, nodeGpus[node])
			if podPlacements[gpuNumber] == nil {
				podPlacements[gpuNumber] = []CellList{}
			}
			podPlacements[gpuNumber] = append(podPlacements[gpuNumber], t.lowestLCASolution)
		}
		return podPlacements
	}
	return nil
}

func (t *topologyAwareScheduler) findNodesForPods(p CellPriority) bool {
	sort.Sort(t.clusterView)
	t.currentSolutionIndices = make([]int32, len(t.podGpuNumbers))
	podIndex := 0
	pickedGpuNum := int32(0)
	var node Cell
	for nodeIndex := 0; nodeIndex < len(t.clusterView); {
		node = t.clusterView[nodeIndex]
		if node.GetFreeGpuNumForPriority(p) - pickedGpuNum >= t.podGpuNumbers[podIndex] {
			t.currentSolutionIndices[podIndex] = int32(nodeIndex)
			pickedGpuNum += t.podGpuNumbers[podIndex]
			podIndex++
			if podIndex == len(t.podGpuNumbers) {
				return true
			}
		} else {
			pickedGpuNum = 0
			nodeIndex++
		}
	}
	return false
}

func (t *topologyAwareScheduler) findGpusInNode(
	node Cell,
	gpuNumber int32,
	p CellPriority,
	availableGpus CellList) CellList {

	t.currentSolutionIndices = make([]int32, gpuNumber)
	t.currentLCA = make(CellList, gpuNumber)
	t.lowestLCASolution = make(CellList, gpuNumber)
	t.lowestLCASolutionIndices = make([]int32, gpuNumber)
	t.lowestLCALevel = highestLevel

	if availableGpus == nil {
		availableGpus = CellList{}
		preemptibleGpus := CellList{}
		availableGpus, preemptibleGpus = getGpusFromNode(node, p, availableGpus, preemptibleGpus)
		availableGpus = append(availableGpus, preemptibleGpus...)
	}
	availableGpuIndex := int32(0)
	searchGpuIndex := int32(0)
	var gpu Cell
	for {
		for availableGpuIndex < int32(len(availableGpus)) {
			gpu = availableGpus[availableGpuIndex]
			t.currentSolutionIndices[searchGpuIndex] = availableGpuIndex
			if searchGpuIndex == 0 {
				t.currentLCA[searchGpuIndex] = gpu
			} else {
				t.currentLCA[searchGpuIndex] = findLCA(gpu, t.currentLCA[searchGpuIndex-1])
				if (t.currentLCA[searchGpuIndex] == nil && t.lowestLCALevel < highestLevel) ||
					(t.currentLCA[searchGpuIndex].GetLevel() > t.lowestLCALevel) {
					availableGpuIndex++
					continue
				}
			}
			if searchGpuIndex == gpuNumber-1 {
				if t.checkCurrentGpus(availableGpus) {
					availableGpus = t.removePickedGpus(availableGpus)
					return availableGpus
				}
			} else {
				searchGpuIndex++
			}
			availableGpuIndex++
		}
		searchGpuIndex--
		if searchGpuIndex < 0 {
			if t.lowestLCALevel == highestLevel {
				panic(fmt.Sprintf("failed to allocate %v GPUs in picked node %v", gpuNumber, node.GetName()))
			}
			availableGpus = t.removePickedGpus(availableGpus)
			return availableGpus
		}
		availableGpuIndex = t.currentSolutionIndices[searchGpuIndex] + 1
	}
}

func (t *topologyAwareScheduler) checkCurrentGpus(gpus CellList) bool {
	currentLCALevel := t.currentLCA[len(t.currentLCA)-1].GetLevel()
	if currentLCALevel < t.lowestLCALevel {
		copy(t.lowestLCASolutionIndices, t.currentSolutionIndices)
		for i := 0; i < len(t.currentSolutionIndices); i++ {
			t.lowestLCASolution[i] = gpus[t.currentSolutionIndices[i]]
		}
		t.lowestLCALevel = currentLCALevel
		if t.lowestLCALevel == t.lowestLCASolution[0].GetLevel() + 1 {
			return true
		}
	}
	return false
}

func (t *topologyAwareScheduler) removePickedGpus(gpus CellList) CellList {
	for i, index := range t.lowestLCASolutionIndices {
		offset := int32(i)
		if i < len(t.lowestLCASolutionIndices)-1 {
			nextIndex := t.lowestLCASolutionIndices[i+1]
			copy(gpus[index-offset:nextIndex-offset-1], gpus[index+1:nextIndex])
		} else {
			copy(gpus[index-offset:], gpus[index+1:])
		}
	}
	return gpus[:len(gpus)-len(t.currentSolutionIndices)]
}

func sortGpuNumbers(n []int32) {
	tmp := make([]int, len(n))
	for i := 0; i < len(n); i++ {
		tmp[i] = int(n[i])
	}
	sort.Ints(tmp)
	for i := 0; i < len(tmp); i++ {
		n[i] = int32(tmp[i])
	}
}

func findLCA(lower Cell, higher Cell) Cell {
	for lower.GetLevel() < higher.GetLevel() {
		if lower.GetParent() == nil {
			return nil
		}
		lower = lower.GetParent()
	}
	if lower == higher {
		return lower
	}
	for lower.GetParent() != higher.GetParent() {
		if lower.GetParent() == nil || higher.GetParent() == nil {
			return nil
		}
		lower = lower.GetParent()
		higher = higher.GetParent()
	}
	return lower.GetParent()
}

func (t *topologyAwareScheduler) updateClusterView(p CellPriority) {
	for _, c := range t.clusterView {
		if t.crossPriorityPack {
			c.SetUsedGpuNumAllPriority(p)
		} else {
			c.SetUsedGpuNumForPriority(p)
		}
	}
}

func (t *topologyAwareScheduler) getNodeViewFromCells(ccl ChainCellList, p CellPriority) CellList {
	var l CellLevel
	for l = CellLevel(1); l <= CellLevel(len(ccl)); l++ {
		if ccl[l][0].AtOrHigherThanNode() {
			break
		}
	}
	for _, c := range ccl[l] {
		if t.crossPriorityPack {
			c.SetUsedGpuNumAllPriority(p)
		} else {
			c.SetUsedGpuNumForPriority(p)
		}
	}
	return ccl[l]
}

func getGpusFromNode(c Cell, p CellPriority, freeGpus CellList, preemptibleGpus CellList) (CellList, CellList) {
	if c.GetLevel() > 1 {
		for _, cc := range c.GetChildren() {
			freeGpus, preemptibleGpus = getGpusFromNode(cc, p, freeGpus, preemptibleGpus)
		}
	} else if c.GetPriority() == freePriority {
		freeGpus = append(freeGpus, c)
	} else if c.GetPriority() < p {
		preemptibleGpus = append(preemptibleGpus, c)
	}
	return freeGpus, preemptibleGpus
}
