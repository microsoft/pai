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

// topologyAwareScheduler can schedule a set of pods on a cluster view.
// It first tries to place pods to nodes with fewer free GPUs (i.e., packing), while trying to avoid preemptions.
// Then inside each node, it tries to allocate GPUs with better affinity.
type topologyAwareScheduler struct {
	// a list of node level cells (top level cells that are lower than node level will be treated as nodes)
	clusterView CellList
	// pack pods cross different priorities, or inside each priority. the former is for intra-VC scheduling,
	// because high-priority can avoid preemption in the whole cluster view,
	// and hence we can pack pods with different priorities.
	// the latter is for opportunistic pod scheduling (stay away from regular pods),
	// because regular pods can avoid preempting opportunistic pods only among buddy cells (this is decided
	// by the buddy cell allocation algorithm).
	crossPriorityPack bool
}

// NewTopologyAwareScheduler initializes the scheduler by extracting node-level cells
// (lower-level if no node-level) from a chain cell list.
func NewTopologyAwareScheduler(ccl ChainCellList, crossPriorityPack bool) *topologyAwareScheduler {
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

func (t *topologyAwareScheduler) Schedule(
	podGpuNumbers map[int32]int32,
	p CellPriority) map[int32][]CellList {

	// GPU numbers of the pods to schedule
	sortedPodGpuNumbers := []int32{}
	for gpuNum, podNum := range podGpuNumbers {
		for i := int32(0); i < podNum; i++ {
			sortedPodGpuNumbers = append(sortedPodGpuNumbers, gpuNum)
		}
	}
	common.SortInt32(sortedPodGpuNumbers)

	// disable preemption first (reduce preemption)
	priority := opportunisticPriority
	t.updateClusterView(priority)
	// try to fit the pods to a set of nodes
	selectedNodeIndices := findNodesForPods(t.clusterView, sortedPodGpuNumbers, priority)
	// enable preemption if scheduling failed
	if selectedNodeIndices == nil && p > opportunisticPriority {
		priority = p
		t.updateClusterView(priority)
		selectedNodeIndices = findNodesForPods(t.clusterView, sortedPodGpuNumbers, priority)
	}
	if selectedNodeIndices == nil {
		return nil
	}
	// find GPUs inside the selected node for each pod
	selectedNodes := make(CellList, len(sortedPodGpuNumbers))
	for i := 0; i < len(selectedNodeIndices); i++ {
		selectedNodes[i] = t.clusterView[selectedNodeIndices[i]]
	}
	selectedGpus := CellList{}
	nodeAvailableGpus := map[Cell]CellList{}
	podPlacements := map[int32][]CellList{}
	for podIndex := 0; podIndex < len(sortedPodGpuNumbers); podIndex++ {
		gpuNumber := sortedPodGpuNumbers[podIndex]
		node := selectedNodes[podIndex]
		selectedGpus, nodeAvailableGpus[node] = findGpusInNode(node, gpuNumber, priority, nodeAvailableGpus[node])
		if podPlacements[gpuNumber] == nil {
			podPlacements[gpuNumber] = []CellList{}
		}
		podPlacements[gpuNumber] = append(podPlacements[gpuNumber], selectedGpus)
	}
	return podPlacements
}

// findNodesForPods finds a set of nodes that can accommodate the GPU requirements of the pods.
func findNodesForPods(clusterView CellList, n []int32, p CellPriority) []int32 {
	// sort the nodes according to gpu numbers in each node.
	// this is achieved through the Less method defined in type CellList.
	sort.Sort(clusterView)
	currentNodeIndices := make([]int32, len(n)) // indices of the currently picked nodes
	podIndex := 0
	pickedGpuNum := int32(0)
	var node Cell
	for nodeIndex := 0; nodeIndex < len(clusterView); {
		node = clusterView[nodeIndex]
		if node.GetFreeGpuNumAtPriority(p)-pickedGpuNum >= n[podIndex] {
			currentNodeIndices[podIndex] = int32(nodeIndex)
			pickedGpuNum += n[podIndex]
			podIndex++
			if podIndex == len(n) {
				return currentNodeIndices
			}
		} else {
			pickedGpuNum = 0
			nodeIndex++
		}
	}
	return nil
}

// findGpusInNode finds a set of GPUs with the best affinity in a node for a pod.
func findGpusInNode(
	node Cell,
	gpuNumber int32,
	p CellPriority,
	availableGpus CellList) (CellList, CellList) {

	// indices of the currently picked GPUs
	currentGpuIndices := make([]int32, gpuNumber)
	// affinity of the currently picked GPUs, defined as the lowest common ancestor
	// of the GPUs in the cell hierarchy (lower level means better affinity)
	currentAffinity := make(CellList, gpuNumber)
	// GPUs with the best affinity ever seen
	bestAffinityGpus := make(CellList, gpuNumber)
	// indices of the GPUs with the best affinity ever seen
	bestAffinityGpuIndices := make([]int32, gpuNumber)
	// the best affinity ever seen (i.e., lowest level of lowest common ancestor of a set of GPUs)
	bestAffinity := highestLevel

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
			currentGpuIndices[searchGpuIndex] = availableGpuIndex
			if searchGpuIndex == 0 {
				currentAffinity[searchGpuIndex] = gpu
			} else {
				currentAffinity[searchGpuIndex] = findLCA(gpu, currentAffinity[searchGpuIndex-1])
				// pruning: if the current LCA has been higher than the lowest ever,
				// the node will be skipped
				if (currentAffinity[searchGpuIndex] == nil && bestAffinity < highestLevel) ||
					(currentAffinity[searchGpuIndex].GetLevel() > bestAffinity) {
					availableGpuIndex++
					continue
				}
			}
			if searchGpuIndex == gpuNumber-1 {
				foundOptimalAffinity := false
				bestAffinity, foundOptimalAffinity = checkCurrentGpus(
					currentAffinity[len(currentAffinity)-1].GetLevel(),
					availableGpus,
					currentGpuIndices,
					bestAffinity,
					bestAffinityGpus,
					bestAffinityGpuIndices)
				if foundOptimalAffinity {
					// early stop: return if the solution is optimal (i.e., all buddies)
					availableGpus = removePickedGpus(availableGpus, bestAffinityGpuIndices)
					return bestAffinityGpus, availableGpus
				}
			} else {
				searchGpuIndex++
			}
			availableGpuIndex++
		}
		searchGpuIndex--
		if searchGpuIndex < 0 {
			if bestAffinity == highestLevel {
				panic(fmt.Sprintf("failed to allocate %v GPUs in picked node %v", gpuNumber, node.GetName()))
			}
			availableGpus = removePickedGpus(availableGpus, bestAffinityGpuIndices)
			return bestAffinityGpus, availableGpus
		}
		availableGpuIndex = currentGpuIndices[searchGpuIndex] + 1
	}
}

// checkCurrentGpus checks if the currently picked GPUs have the lowest LCA. It also checks if the solution
// is optimal (if the GPUs are all buddies).
func checkCurrentGpus(
	affinity CellLevel,
	gpus CellList,
	currentIndices []int32,
	bestAffinity CellLevel,
	bestAffinityGpus CellList,
	bestAffinityGpuIndices []int32) (CellLevel, bool) {

	if affinity < bestAffinity {
		copy(bestAffinityGpuIndices, currentIndices)
		for i := 0; i < len(currentIndices); i++ {
			bestAffinityGpus[i] = gpus[currentIndices[i]]
		}
		if affinity == bestAffinityGpus[0].GetLevel()+1 {
			return affinity, true
		} else {
			return affinity, false
		}
	}
	return bestAffinity, false
}

// removePickedGpus remove picked GPUs from the available GPU list.
func removePickedGpus(gpus CellList, indices []int32) CellList {
	for i, index := range indices {
		offset := int32(i)
		if i < len(indices)-1 {
			nextIndex := indices[i+1]
			copy(gpus[index-offset:nextIndex-offset-1], gpus[index+1:nextIndex])
		} else {
			copy(gpus[index-offset:], gpus[index+1:])
		}
	}
	return gpus[:len(gpus)-len(indices)]
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
			c.UpdateUsedGpuNumAllPriority(p)
		} else {
			// otherwise set c.usedGpuNumSamePriority as the number of GPUs used by the same priority, and
			// c.usedGpuNumLowerPriority as that of the lower priorities, so that a pod will be packed to the node
			// with the most GPUs used by the same priority, and the fewest GPUs used by the lower priorities.
			c.UpdateUsedGpuNumForPriority(p)
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
