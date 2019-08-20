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
	"k8s.io/klog"
	"sync"
)

type HivedAlgorithm struct {
	// intra-VC scheduler for each VC
	vcSchedulers map[api.VirtualClusterName]intraVCScheduler
	// ChainCellLists of physical cells of each cell chain
	fullCellList map[CellChain]ChainCellList
	// map each cell type (chain + level) to the number of GPUs in such a cell
	gpuNums map[CellChain]map[CellLevel]int32
	// map each GPU type to all chains that contain this type
	chains map[string][]CellChain
	// all affinity groups that have been allocated cells
	allocatedAffinityGroups map[string]*AlgoAffinityGroup
	// all reserved physical cells (VC -> reservation ID -> cells)
	reservedCells map[api.VirtualClusterName]map[api.ReservationId]*PhysicalCell
	// lock
	algorithmLock sync.RWMutex
}

func NewHivedAlgorithm(sConfig *api.Config) *HivedAlgorithm {
	pcl, gpuNums, gpuTypeToChain, nonReservedVcl, reservedVcl, reservedPc := ParseConfig(sConfig)
	h := &HivedAlgorithm{
		vcSchedulers:            make(map[api.VirtualClusterName]intraVCScheduler),
		fullCellList:            pcl,
		gpuNums:                 gpuNums,
		chains:                  gpuTypeToChain,
		allocatedAffinityGroups: make(map[string]*AlgoAffinityGroup),
		reservedCells:           reservedPc,
	}
	for vc := range nonReservedVcl {
		h.vcSchedulers[vc] = &defaultIntraVCScheduler{
			virtualNonReservedCellList: nonReservedVcl[vc],
			virtualReservedCellList:    reservedVcl[vc],
		}
	}
	h.validateInitialAssignment()
	h.initReservations()
	return h
}

func (h *HivedAlgorithm) AddNode(node *core.Node) {
	// TODO
}

func (h *HivedAlgorithm) UpdateNode(oldNode, newNode *core.Node) {
	// TODO
}

func (h *HivedAlgorithm) DeleteNode(node *core.Node) {
	// TODO
}

func (h *HivedAlgorithm) Schedule(pod *core.Pod, suggestedNodes []string) internal.PodScheduleResult {
	h.algorithmLock.Lock()
	defer h.algorithmLock.Unlock()

	klog.Infof("[%v]: Scheduling pod...", internal.Key(pod))
	s := internal.ExtractPodSchedulingSpec(pod)

	// Differences between group cells and pod cells:
	// A group cell is allocated by the HiveD algorithm to an affinity group,
	// and is the unit of HiveD's cell allocation.
	// A pod cell is *only* for finding a GPU placement in a group cell for a specific pod.
	// Pod placement operates on cells because this way we can use buddy alloc to avoid
	// placing a pod cross multiple nodes.
	// A pod cell is NOT for the cell allocation process!
	if groupPhysical, groupVirtual := h.getOrRequestGroupCell(pod, s); groupPhysical != nil {
		if podCell := h.requestPodCell(s, groupPhysical); podCell == nil {
			return internal.PodScheduleResult{
				PodPreemptInfo: &internal.PodPreemptInfo{},
			}
		} else {
			nodes, gpuIndices := podCell.GetPhysicalPlacement()
			if len(nodes) > 1 {
				// TODO: request larger group cell (when scheduling the first pod),
				//  or prove this is an impossibility
				panic(fmt.Sprintf("pod placed across nodes: %v", podCell.GetName()))
			}
			selectedNode := nodes[0]
			if !common.StringsContains(suggestedNodes, selectedNode) {
				if !groupPhysical.HasPod() {
					panic(fmt.Sprintf(
						"[%v]: node %v picked by algorithm but not in K8S candidates", internal.Key(pod), selectedNode))
				}
			}
			groupNodes, groupGpu := groupPhysical.GetPhysicalPlacement()
			vcl, vci := int32(-1), int32(-1)
			if groupVirtual != nil {
				vcl = int32(groupVirtual.GetLevel())
				vci = groupVirtual.GetIndex()
			}
			return internal.PodScheduleResult{
				PodBindInfo: &api.PodBindInfo{
					Node:         selectedNode,
					GpuIsolation: gpuIndices[:s.GpuNumber],
					CellChain:    string(groupPhysical.GetChain()),
					PodCellLevel: int32(podCell.GetLevel()),
					PodCellGpuPlacement: api.Range{
						Start: gpuIndices[0],
						End:   gpuIndices[len(gpuIndices)-1]},
					GroupCellLevel: int32(groupPhysical.GetLevel()),
					GroupCellNodes: groupNodes,
					GroupCellGpuPlacement: api.Range{
						Start: groupGpu[0],
						End:   groupGpu[len(groupGpu)-1],
					},
					VirtualCellLevel: vcl,
					VirtualCellIndex: vci,
				},
			}
		}
	} else {
		return internal.PodScheduleResult{
			PodWaitInfo: &internal.PodWaitInfo{
				FailedNodeReasons: map[string]string{},
			},
		}
	}
}

func (h *HivedAlgorithm) AddAllocatedPod(pod *core.Pod) {
	h.algorithmLock.Lock()
	defer h.algorithmLock.Unlock()

	klog.Infof("[%v]: adding allocated pod...", internal.Key(pod))
	s := internal.ExtractPodSchedulingSpec(pod)
	info := internal.ExtractPodBindInfo(pod)

	chain := CellChain(info.CellChain)
	podCell := h.findPhysicalCell(
		chain,
		CellLevel(info.PodCellLevel),
		info.Node,
		info.PodCellGpuPlacement.Start)
	if podCell == nil {
		panic(fmt.Sprintf(
			"[%v]: pod cell not found when adding pod: chain %v, level %v, node %v, GPU range %v ~ %v",
			internal.Key(pod), chain, info.PodCellLevel, info.Node,
			info.PodCellGpuPlacement.Start, info.PodCellGpuPlacement.End))
	}
	podCell.AddPod(pod.UID)

	firstPod := false
	var groupCell *PhysicalCell
	if group := h.allocatedAffinityGroups[s.AffinityGroup.Name]; group == nil {
		firstPod = true
		groupCell = h.findPhysicalCell(
			chain,
			CellLevel(info.GroupCellLevel),
			info.GroupCellNodes[0],
			info.GroupCellGpuPlacement.Start)
		if groupCell == nil {
			panic(fmt.Sprintf(
				"[%v]: group cell of %v not found when adding pod: chain %v, level %v, node %v, GPU range %v ~ %v",
				internal.Key(pod), s.AffinityGroup.Name, chain, info.GroupCellLevel, info.Node,
				info.GroupCellGpuPlacement.Start, info.GroupCellGpuPlacement.End))
		}
		newGroup := newAlgoAffinityGroup(s.AffinityGroup)
		newGroup.cell = groupCell
		h.allocatedAffinityGroups[s.AffinityGroup.Name] = newGroup
	}
	h.allocatedAffinityGroups[s.AffinityGroup.Name].unallocatedPodNums[s.GpuNumber]--

	if firstPod {
		klog.Infof("[%v]: first pod of group %v", internal.Key(pod), s.AffinityGroup.Name)
		virtualCell := h.findVirtualCell(
			s.VirtualCluster, chain, s.ReservationId, CellLevel(info.VirtualCellLevel), info.VirtualCellIndex)
		if info.VirtualCellIndex >= 0 && virtualCell == nil {
			var str string
			if s.ReservationId != "" {
				str = fmt.Sprintf("reservation %v", s.ReservationId)
			} else {
				str = fmt.Sprintf("chain %v", chain)
			}
			panic(fmt.Sprintf(
				"[%v]: virtual cell of %v not found when adding pod: VC %v, %v, level %v, index %v",
				internal.Key(pod), s.AffinityGroup.Name, s.VirtualCluster, str,
				info.VirtualCellLevel, info.VirtualCellIndex))
		}
		confirmAllocatedCell(groupCell, virtualCell, CellPriority(s.Priority))
	}
}

func (h *HivedAlgorithm) DeleteAllocatedPod(pod *core.Pod) {
	h.algorithmLock.Lock()
	defer h.algorithmLock.Unlock()

	klog.Infof("[%v]: deleting allocated pod...", internal.Key(pod))
	s := internal.ExtractPodSchedulingSpec(pod)
	info := internal.ExtractPodBindInfo(pod)

	chain := CellChain(info.CellChain)
	podCell := h.findPhysicalCell(
		chain,
		CellLevel(info.PodCellLevel),
		info.Node,
		info.PodCellGpuPlacement.Start)
	if podCell == nil {
		panic(fmt.Sprintf(
			"[%v]: pod cell not exists when deleting pod: chain %v, level %v, node %v, GPU range %v ~ %v",
			internal.Key(pod), chain, info.PodCellLevel, info.Node,
			info.PodCellGpuPlacement.Start, info.PodCellGpuPlacement.End))
	}
	podCell.DeletePod(pod.UID)

	if group := h.allocatedAffinityGroups[s.AffinityGroup.Name]; group == nil {
		panic(fmt.Sprintf(
			"[%v]: group %v not exists when deleting pod", internal.Key(pod), s.AffinityGroup.Name))
	} else if !group.cell.HasPod() {
		delete(h.allocatedAffinityGroups, s.AffinityGroup.Name)
		group.cell.ClearPhysicalCellList()
		confirmReleasedCell(group.cell)
	}
}

// validateInitialAssignment makes sure that the initial cell assignments
// to all VCs can be fit into the configured physical cells.
func (h *HivedAlgorithm) validateInitialAssignment() {
	totalQuota := map[CellChain]map[CellLevel]int32{}
	for _, vcs := range h.vcSchedulers {
		for chain, ccl := range vcs.getNonReservedCellList() {
			if totalQuota[chain] == nil {
				totalQuota[chain] = map[CellLevel]int32{}
			}
			l := CellLevel(len(ccl))
			totalQuota[chain][l] += int32(len(ccl[l]))
		}
	}
	for chain, chainQuota := range totalQuota {
		ccl := h.fullCellList[chain]
		top := CellLevel(len(ccl))
		available := int32(len(ccl[top]))
		for l := top; l >= lowestLevel; l-- {
			left := available - chainQuota[l]
			if left < 0 {
				panic(fmt.Sprintf(
					"Insufficient physical cells at chain %v level %v: %v needed, %v available",
					chain, l, chainQuota[l], available))
			}
			if l > lowestLevel {
				available = left * int32(len(ccl[l][0].GetChildren()))
			}
		}
	}
}

// initReservations creates bindings and sets priorities for the reserved cells.
func (h *HivedAlgorithm) initReservations() {
	for vc, vcReservation := range h.reservedCells {
		for rid, physical := range vcReservation {
			// set priority to hold the reserved cell in the physical cluster
			setPriority(physical, regularPriority, unlimitedLevel)
			virtualList := h.vcSchedulers[vc].getReservedCellList()[rid]
			virtual := virtualList[CellLevel(len(virtualList))][0].(*VirtualCell)
			virtual.SetPhysicalCell(physical)
			physical.SetVirtualCell(virtual)
			klog.Infof("Cells bound: %v and %v (reservation)", virtual.GetName(), physical.GetName())
		}
	}
}

// getOrRequestGroupCell gets the cell for a pod in an affinity group. If no cell has been
// allocated to the group, then request a new one. Otherwise, return the allocated cell.
func (h *HivedAlgorithm) getOrRequestGroupCell(
	pod *core.Pod, s *api.PodSchedulingSpec) (*PhysicalCell, *VirtualCell) {

	var groupPhysical *PhysicalCell
	var groupVirtual *VirtualCell

	if group := h.allocatedAffinityGroups[s.AffinityGroup.Name]; group == nil {
		klog.Infof("Requesting new cell for group %v", s.AffinityGroup.Name)
		var priority CellPriority
		if s.Priority < api.RegularPriority {
			priority = opportunisticPriority
		} else {
			priority = CellPriority(s.Priority)
		}
		cr := CellRequest{
			VC:            s.VirtualCluster,
			Priority:      priority,
			ReservationId: s.ReservationId,
		}
		h.validateCellRequest(cr)

		if cr.ReservationId != "" {
			if cr.Priority < regularPriority {
				panic(internal.NewBadRequestError(fmt.Sprintf(
					"[%v]: opportunistic pod not supported to use reservation %v",
					internal.Key(pod), cr.ReservationId)))
			}
			klog.Infof("Use reservation %v", s.ReservationId)
			cr.Chain = h.reservedCells[cr.VC][cr.ReservationId].GetChain()
			cr.Level = h.getLevelByGpuNum(getGroupCellSize(s.AffinityGroup), cr.Chain)
			if cr.Level < lowestLevel || cr.Level > h.reservedCells[cr.VC][cr.ReservationId].GetLevel() {
				panic(internal.NewBadRequestError(fmt.Sprintf(
					"[%v]: pod requesting more GPUs in reservation %v",
					internal.Key(pod), cr.ReservationId)))
			}
			groupPhysical, groupVirtual = h.requestGroupCell(cr)
		} else if s.GpuType != "" {
			if chains := h.chains[s.GpuType]; chains == nil {
				panic(internal.NewBadRequestError(fmt.Sprintf(
					"[%v]: pod requesting an invalid GPU type: %v", internal.Key(pod), s.GpuType)))
			} else {
				var vcHasType bool
				groupPhysical, groupVirtual, vcHasType = h.requestGroupCellForGpuType(
					cr, chains, getGroupCellSize(s.AffinityGroup))
				if cr.Priority > opportunisticPriority && !vcHasType {
					panic(internal.NewBadRequestError(fmt.Sprintf(
						"[%v]: pod requesting GPU type %v which VC %v does not have",
						internal.Key(pod), s.GpuType, s.VirtualCluster)))
				}
			}
		} else {
			for _, chains := range h.chains {
				groupPhysical, groupVirtual, _ = h.requestGroupCellForGpuType(
					cr, chains, getGroupCellSize(s.AffinityGroup))
				if groupPhysical != nil {
					break
				}
			}
		}
		if groupPhysical != nil {
			klog.Infof("Allocated cell for group %v: %v", s.AffinityGroup.Name, groupPhysical.GetName())
		} else {
			klog.Infof("Cannot allocate cell for group %v", s.AffinityGroup.Name)
		}
	} else {
		groupPhysical = group.cell
		groupVirtual = groupPhysical.GetVirtualCell()
	}
	return groupPhysical, groupVirtual
}

// requestGroupCellForGpuType requests a group cell for a specific GPU type.
func (h *HivedAlgorithm) requestGroupCellForGpuType(
	cr CellRequest,
	chains []CellChain,
	gpuNum int32) (*PhysicalCell, *VirtualCell, bool) {

	vcHasType := false
	for _, chain := range chains {
		if h.vcSchedulers[cr.VC].getNonReservedCellList()[chain] != nil {
			vcHasType = true
			cr.Chain = chain
			if cr.Level = h.getLevelByGpuNum(gpuNum, chain); cr.Level >= lowestLevel {
				if physicalCell, virtualCell := h.requestGroupCell(cr); physicalCell != nil {
					return physicalCell, virtualCell, vcHasType
				}
			}
		}
	}
	return nil, nil, vcHasType
}

// validateCellRequest checks the existence of VC and reservation ID, and the legality of priority.
// Cell chain and level has been guaranteed valid before requestGroupCell is called.
func (h *HivedAlgorithm) validateCellRequest(cr CellRequest) {
	var message string
	if h.vcSchedulers[cr.VC] == nil {
		message = fmt.Sprintf("VC %v does not exists!", cr.VC)
	} else if cr.ReservationId != "" &&
		h.vcSchedulers[cr.VC].getReservedCellList()[cr.ReservationId] == nil {
		message = fmt.Sprintf("VC %v does not have reservation %v", cr.VC, cr.ReservationId)
	} else if cr.Priority > highestPriority {
		message = fmt.Sprintf("priority %v exceeds highest priority", cr.Priority)
	}
	if message != "" {
		panic(internal.NewBadRequestError(message))
	}
}

// requestGroupCell requests a new cell for an affinity group in the physical cluster.
func (h *HivedAlgorithm) requestGroupCell(cr CellRequest) (*PhysicalCell, *VirtualCell) {
	if cr.Priority >= regularPriority {
		var vcCell *VirtualCell
		vcCell = h.vcSchedulers[cr.VC].allocateCell(cr)
		if vcCell != nil {
			pac := vcCell.GetPreAssignedCell()

			preassignedPhysical := pac.GetPhysicalCell()
			// allocate physical cell for the preassigned cell
			if preassignedPhysical == nil {
				physicalCellView := getCellViewWithPriority(h.fullCellList[cr.Chain], regularPriority)
				c := buddyAlloc(physicalCellView, pac.GetLevel())
				if c == nil {
					panic(fmt.Sprintf(
						"Cannot find physical cell for a VC cell: %v", pac.GetName()))
				} else {
					preassignedPhysical = c.(*PhysicalCell)
				}
			}
			return allocatePhysicalInsidePreassigned(preassignedPhysical, vcCell), vcCell
		} else {
			return nil, nil
		}
	} else {
		physicalCellView := getCellViewWithPriority(h.fullCellList[cr.Chain], opportunisticPriority)
		c := buddyAlloc(physicalCellView, cr.Level)
		if c == nil {
			klog.Infof(fmt.Sprintf(
				"Insufficient resource for opportunistic cell request: chain %v, level %v", cr.Chain, cr.Level))
			return nil, nil
		} else {
			return c.(*PhysicalCell), nil
		}
	}
}

// requestPodCell places a pod in an allocated group cell using buddy alloc.
// TODO: collect preemption victims
func (h *HivedAlgorithm) requestPodCell(s *api.PodSchedulingSpec, groupCell *PhysicalCell) *PhysicalCell {
	if group := h.allocatedAffinityGroups[s.AffinityGroup.Name]; group != nil &&
		group.unallocatedPodNums[s.GpuNumber] <= 0 {
		panic(internal.NewBadRequestError(fmt.Sprintf(
			"Requesting more pods than the configured number for %v GPUs in affinity group %v",
			s.GpuNumber, s.AffinityGroup.Name)))
	}
	level := h.getLevelByGpuNum(getPodCellSize(s.GpuNumber), groupCell.GetChain())
	if groupCell.internalCellList == nil {
		groupCell.InitPhysicalCellList()
	}
	cellView := getCellViewForPodPlacement(groupCell.GetPhysicalCellList())
	c := buddyAlloc(cellView, level)
	if c == nil {
		return nil
	} else {
		return c.(*PhysicalCell)
	}
}

func (h *HivedAlgorithm) getLevelByGpuNum(gpuNum int32, chain CellChain) CellLevel {
	for l := CellLevel(1); l <= CellLevel(len(h.gpuNums[chain])); l++ {
		if h.gpuNums[chain][l] >= gpuNum {
			return l
		}
	}
	return unlimitedLevel
}

// findPhysicalCell finds a physical cell in the full list. This search is based on *one* node
// and *one* GPU index, assuming there is no resource overlapping among cells at the same level.
func (h *HivedAlgorithm) findPhysicalCell(
	chain CellChain,
	level CellLevel,
	node string,
	gpuIndex int32) *PhysicalCell {

	for _, c := range h.fullCellList[chain][level] {
		success := false
		cc := c.(*PhysicalCell)
		nodes, gpuIndices := cc.GetPhysicalPlacement()
		for _, n := range nodes {
			if n == node {
				success = true
				break
			}
		}
		if success {
			if gpuIndex < 0 {
				return cc
			} else {
				for _, g := range gpuIndices {
					if g == gpuIndex {
						return cc
					}
				}
			}
		}
	}
	return nil
}

// findVirtualCell finds a virtual cell according to the index.
func (h *HivedAlgorithm) findVirtualCell(
	vc api.VirtualClusterName,
	chain CellChain,
	rid api.ReservationId,
	level CellLevel,
	index int32) *VirtualCell {

	var searchList CellList
	if rid == "" {
		searchList = h.vcSchedulers[vc].getNonReservedCellList()[chain][level]
	} else {
		searchList = h.vcSchedulers[vc].getReservedCellList()[rid][level]
	}

	if index >= 0 {
		for _, c := range searchList {
			cc := c.(*VirtualCell)
			if cc.GetIndex() == index {
				return cc
			}
		}
	}
	return nil
}

// confirmAllocatedCell confirms a cell allocation by creating cell bindings and setting priorities.
func confirmAllocatedCell(physicalCell *PhysicalCell, virtualCell *VirtualCell, priority CellPriority) {
	if virtualCell != nil {
		// create cell bindings
		pac := virtualCell.GetPreAssignedCell()
		preassignedBound := pac.GetPhysicalCell() != nil
		vc := virtualCell
		pc := physicalCell
		for vc.GetPhysicalCell() == nil {
			vc.SetPhysicalCell(pc)
			pc.SetVirtualCell(vc)
			klog.Infof("Cells bound: %v and %v", vc.GetName(), pc.GetName())
			if vc.GetParent() == nil {
				break
			}
			vc = vc.GetParent().(*VirtualCell)
			pc = pc.GetParent().(*PhysicalCell)
		}

		// set priority
		setPriority(virtualCell, priority, unlimitedLevel)
		// first hold the physical cell of the preassigned (set its priority to regularPriority)
		if !preassignedBound {
			setPriority(pac.GetPhysicalCell(), regularPriority, unlimitedLevel)
		}
		// set the priority of the physical cell to regularNonPreassignedPriority
		// so that other cells inside the preassigned one can still be used by opportunistic pods
		if virtualCell != pac {
			setSelfAndParentPriority(physicalCell, regularNonPreassignedPriority, unlimitedLevel)
		}
	} else {
		setPriority(physicalCell, opportunisticPriority, unlimitedLevel)
	}
}

// confirmReleasedCell releases an allocated cell by destroying cell bindings and reset priorities.
func confirmReleasedCell(c *PhysicalCell) {
	var preassignedPhysical *PhysicalCell
	if vc := c.GetVirtualCell(); vc != nil {
		// destroy bindings
		boundVirtual := vc
		for !boundVirtual.GetPhysicalCell().IsReserved() {
			boundPhysical := boundVirtual.GetPhysicalCell()
			klog.Infof("Cells unbound: %v and %v", boundVirtual.GetName(), boundPhysical.GetName())
			boundPhysical.SetVirtualCell(nil)
			boundVirtual.SetPhysicalCell(nil)
			if boundVirtual.GetParent() == nil {
				break
			} else {
				unbindParent := true
				for _, cc := range boundVirtual.GetParent().GetChildren() {
					if child := cc.(*VirtualCell); child.GetPhysicalCell() != nil {
						unbindParent = false
						break
					}
				}
				if !unbindParent {
					break
				}
				boundVirtual = boundVirtual.GetParent().(*VirtualCell)
			}
		}
		// reset priority
		setSelfAndParentPriority(vc, freePriority, unlimitedLevel)
		preassignedPhysical = vc.GetPreAssignedCell().GetPhysicalCell()
	} else {
		// check if the cell is inside a physical cell of a preassigned virtual cell
		for cc := c; ; {
			if boundVirtual := cc.GetVirtualCell(); boundVirtual != nil {
				preassignedPhysical = boundVirtual.GetPreAssignedCell().GetPhysicalCell()
				break
			}
			if cc.GetParent() != nil {
				cc = cc.GetParent().(*PhysicalCell)
			} else {
				break
			}
		}
	}
	// if preassignedPhysical is not released, should not change its priority
	if preassignedPhysical != nil {
		setSelfAndParentPriority(c, freePriority, preassignedPhysical.GetLevel())
	} else {
		setSelfAndParentPriority(c, freePriority, unlimitedLevel)
	}
}

// allocatePhysicalInsidePreassigned allocates a physical cell to a virtual cell (possible split from a
// preassigned one) according to the cell topology in the preassigned virtual cell.
func allocatePhysicalInsidePreassigned(preassignedPhysical *PhysicalCell, vcCell *VirtualCell) *PhysicalCell {
	// traverse the cell hierarchy to find the highest-level virtual cell
	// that has not been bound to any physical cell
	var boundCell *PhysicalCell
	for c := vcCell; ; {
		if c.GetPhysicalCell() != nil {
			boundCell = c.GetPhysicalCell()
			break
		} else if c == vcCell.preAssignedCell {
			break
		} else {
			c = c.GetParent().(*VirtualCell)
		}
	}
	if boundCell == nil {
		boundCell = preassignedPhysical
	}

	for boundCell.GetLevel() > vcCell.GetLevel() {
		boundCell = selectCellFromBuddies(boundCell.GetChildren()).(*PhysicalCell)
	}
	if boundCell.GetPriority() > opportunisticPriority {
		panic(fmt.Sprintf("Cannot find physical cell for %v", vcCell.GetName()))
	}
	return boundCell
}

// getCellViewWithPriority returns a free cell list of a chain given a priority.
// A cell will be invisible if it is with a equal-or-higher priority, or all of its buddies and itself
// are with lower priorities. In the latter case, all of the buddies are masked and effectively "merged".
func getCellViewWithPriority(fullCellList ChainCellList, p CellPriority) ChainCellList {
	top := CellLevel(len(fullCellList))
	cellView := NewChainCellList(top)
	for l := CellLevel(1); l <= top; l++ {
		for _, c := range fullCellList[l] {
			if c.GetPriority() < p &&
				(c.GetParent() == nil || maxPriority(c.GetParent().GetChildren()) >= p) {
				cellView[l] = append(cellView[l], c)
			}
		}
	}
	return cellView
}

// getCellViewForPodPlacement returns a free cell list inside a physical cell,
// where a cell is free if it has no pod running (on itself or its children).
// Similar to getCellViewWithPriority, buddy cells that are all free will be invisible ("merged").
// This function is used for pod placement with buddy alloc.
func getCellViewForPodPlacement(fullCellList ChainCellList) ChainCellList {
	top := CellLevel(len(fullCellList))
	cellView := NewChainCellList(top)
	for l := CellLevel(1); l <= top; l++ {
		for _, c := range fullCellList[l] {
			cc := c.(*PhysicalCell)
			if !cc.HasPod() {
				if p := cc.GetParent(); p == nil || l == top || p.(*PhysicalCell).HasPod() {
					cellView[l] = append(cellView[l], cc)
				}
			}
		}
	}
	return cellView
}

// buddyAlloc allocates a free cell at a certain level from a cellView.
// It splits a higher-level cell when there is no free cell at the current level.
// Note that cellView is one-off: we will calculate it every time we call this function
// (except recursive calls from it self). So we won't remove a returned cell from cellView.
func buddyAlloc(cellView ChainCellList, level CellLevel) Cell {
	if len(cellView[level]) == 0 && level < CellLevel(len(cellView)) {
		higherCell := buddyAlloc(cellView, level+1)
		if higherCell != nil {
			cellView[level] = append(cellView[level], higherCell.GetChildren()...)
		}
	}
	if len(cellView[level]) == 0 {
		return nil
	}
	return minPriorityCell(cellView[level])
}

func getGroupCellSize(a *api.AffinityGroup) int32 {
	n := int32(0)
	for _, m := range a.Members {
		n += common.NextPowerOf2(m.GpuNumber) * m.PodNumber
	}
	return common.NextPowerOf2(n)
}

func getPodCellSize(n int32) int32 {
	return common.NextPowerOf2(n)
}

func selectCellFromBuddies(cl []Cell) Cell {
	return minPriorityCell(cl)
}

func maxPriority(cl CellList) CellPriority {
	mp := freePriority
	for _, c := range cl {
		if c.GetPriority() > mp {
			mp = c.GetPriority()
		}
	}
	return mp
}

func minPriorityCell(cl CellList) Cell {
	mp := highestPriority + 1
	var mpc Cell
	for _, c := range cl {
		if c.GetPriority() < mp {
			mp = c.GetPriority()
			mpc = c
		}
	}
	return mpc
}

func setPriority(c Cell, p CellPriority, maxLevel CellLevel) {
	setSelfAndParentPriority(c, p, maxLevel)
	setChildrenPriority(c, freePriority)
}

// setSelfAndParentPriority updates a cell's priority, and also that of its parent
// to make sure parent's priority is not smaller than the max of those of children.
// This operation will terminate after reaching a certain level (if specified).
func setSelfAndParentPriority(c Cell, p CellPriority, maxLevel CellLevel) {
	if maxLevel >= lowestLevel && c.GetLevel() >= maxLevel {
		return
	}
	op := c.GetPriority()
	c.SetPriority(p)
	if parent := c.GetParent(); parent != nil {
		if p > parent.GetPriority() {
			setSelfAndParentPriority(parent, p, maxLevel)
		} else if p < op {
			setSelfAndParentPriority(parent, maxPriority(parent.GetChildren()), maxLevel)
		}
	}
}

// setChildrenPriority sets all children's priorities. Currently we always set to freePriority;
// this is to enable allocation of child cells of a preassigned cell to opportunistic pods.
func setChildrenPriority(c Cell, p CellPriority) {
	for _, child := range c.GetChildren() {
		child.SetPriority(p)
		setChildrenPriority(child, p)
	}
}
