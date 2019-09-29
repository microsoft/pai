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
	"sort"
)

// topologyAwareScheduler can schedule a set of pods on a cluster view.
type topologyAwareScheduler struct {
	clusterView              CellList  // a list of node- (or lower-)level cells
	podGpuNumbers            []int32   // GPU number of each pod to schedule
	currentSolutionIndices   []int32   // indices of currently picked nodes (or GPUs)
	currentLCA               CellList  // current LCA (lowest common ancestor) of currently picked GPUs
	lowestLCASolution        CellList  // GPUs with the lowest LCA
	lowestLCASolutionIndices []int32   // Indices of the GPUs with the lowest LCA
	lowestLCALevel           CellLevel // level of the lowest LCA
	// pack pods cross different priorities, or inside each priority. the former is for opportunistic
	// pod scheduling (stay away from regular pods), because regular pods can avoid preempting opportunistic pods
	// only among buddy cells. the latter is for intra-VC scheduling, because high-priority can avoid preemption
	// in the whole cluster view, and hence we can pack pods with different priorities.
	crossPriorityPack bool
}

// newTopologyAwareScheduler initializes the scheduler by extracting node-level cells
// (lower-level if no node-level) from a chain cell list.
func newTopologyAwareScheduler(ccl ChainCellList, crossPriorityPack bool) *topologyAwareScheduler {
	var l CellLevel
	for l = CellLevel(1); l <= CellLevel(len(ccl)); l++ {
		if ccl[l][0].AtOrHigherThanNode() {
			break
		}
	}
	clusterView := make(CellList, len(ccl[l]))
	copy(clusterView, ccl[l])
	return &topologyAwareScheduler{
		clusterView:       clusterView,
		crossPriorityPack: crossPriorityPack}
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

	// disable preemption first (reduce preemption)
	priority := opportunisticPriority
	t.updateClusterView(priority)
	// try to fit the pods to a set of nodes
	success := t.findNodesForPods(priority)
	// enable preemption if scheduling failed
	if !success && p > opportunisticPriority {
		priority = p
		t.updateClusterView(priority)
		success = t.findNodesForPods(priority)
	}
	if !success {
		return nil
	}
	// find GPUs inside the selected node for each pod
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

// findNodesForPods finds a set of nodes that can accommodate the GPU requirements of the pods.
func (t *topologyAwareScheduler) findNodesForPods(p CellPriority) bool {
	sort.Sort(t.clusterView)
	t.currentSolutionIndices = make([]int32, len(t.podGpuNumbers))
	podIndex := 0
	pickedGpuNum := int32(0)
	var node Cell
	for nodeIndex := 0; nodeIndex < len(t.clusterView); {
		node = t.clusterView[nodeIndex]
		if node.GetFreeGpuNumForPriority(p)-pickedGpuNum >= t.podGpuNumbers[podIndex] {
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

// findGpusInNode finds a set of GPUs with the best affinity (i.e., with the lowest LCA) in a node for a pod.
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
		// free GPUs will be used first (before preemptible GPUs)
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
				// pruning: if the current LCA has been higher than the lowest ever,
				// the node will be skipped
				if (t.currentLCA[searchGpuIndex] == nil && t.lowestLCALevel < highestLevel) ||
					(t.currentLCA[searchGpuIndex].GetLevel() > t.lowestLCALevel) {
					availableGpuIndex++
					continue
				}
			}
			if searchGpuIndex == gpuNumber-1 {
				if t.checkCurrentGpus(availableGpus) {
					// early stop: return if the solution is optimal (i.e., all buddies)
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

// checkCurrentGpus checks if the currently picked GPUs have the lowest LCA. It also checks if the solution
// is optimal (if the GPUs are all buddies).
func (t *topologyAwareScheduler) checkCurrentGpus(gpus CellList) bool {
	currentLCALevel := t.currentLCA[len(t.currentLCA)-1].GetLevel()
	if currentLCALevel < t.lowestLCALevel {
		copy(t.lowestLCASolutionIndices, t.currentSolutionIndices)
		for i := 0; i < len(t.currentSolutionIndices); i++ {
			t.lowestLCASolution[i] = gpus[t.currentSolutionIndices[i]]
		}
		t.lowestLCALevel = currentLCALevel
		if t.lowestLCALevel == t.lowestLCASolution[0].GetLevel()+1 {
			return true
		}
	}
	return false
}

// removePickedGpus remove picked GPUs from the available GPU list.
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

// findLCA finds the lowest common ancestor of two cells (nil if they have no LCA).
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

// updateClusterView updates the GPU numbers of the nodes for the sorting.
func (t *topologyAwareScheduler) updateClusterView(p CellPriority) {
	for _, c := range t.clusterView {
		if t.crossPriorityPack {
			// if crossPriorityPack is enabled, set c.usedGpuNumSamePriority as the total number of used GPUs
			// in the cell, so that a pod will be packed to the node with the most used GPUs
			c.SetUsedGpuNumAllPriority(p)
		} else {
			// otherwise set c.usedGpuNumSamePriority as the number of GPUs used by the same priority, and
			// c.usedGpuNumOtherPriority as that of the other priorities, so that a pod will be packed to the node
			// with the most GPUs used by the same priority, and the fewest GPUs used by the other priorities.
			c.SetUsedGpuNumForPriority(p)
		}
	}
}

// getGpusFromNode collects free GPUs and preemptible GPUs according to the priority.
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
