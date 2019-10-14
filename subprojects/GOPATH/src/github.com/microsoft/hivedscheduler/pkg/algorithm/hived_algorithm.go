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
	"math"
	"sync"
)

type HivedAlgorithm struct {
	// scheduler in each VC
	vcSchedulers map[api.VirtualClusterName]intraVCScheduler
	// scheduler for opportunistic pods
	opportunisticSchedulers map[CellChain]*topologyAwareScheduler
	// ChainCellLists of physical cells of each cell chain
	fullCellList map[CellChain]ChainCellList
	// ChainCellLists of free physical cells of each cell chain (used in buddy alloc)
	freeCellList map[CellChain]ChainCellList
	// map each GPU type to all chains that contain this type
	chains map[string][]CellChain
	// all affinity groups that have been allocated cells
	allocatedAffinityGroups map[string]*AlgoAffinityGroup
	// all reserved physical cells (VC -> reservation ID -> cells)
	reservedCells map[api.VirtualClusterName]map[api.ReservationId]*PhysicalCell
	// lock
	algorithmLock sync.RWMutex
}

// NewHivedAlgorithm initializes a HivedAlgorithm from the config file
func NewHivedAlgorithm(sConfig *api.Config) *HivedAlgorithm {
	pcl, gpuTypeToChain, nonReservedVcl, reservedVcl, reservedPc := ParseConfig(sConfig)
	h := &HivedAlgorithm{
		vcSchedulers:            make(map[api.VirtualClusterName]intraVCScheduler),
		opportunisticSchedulers: map[CellChain]*topologyAwareScheduler{},
		fullCellList:            pcl,
		freeCellList:            make(map[CellChain]ChainCellList),
		chains:                  gpuTypeToChain,
		allocatedAffinityGroups: make(map[string]*AlgoAffinityGroup),
		reservedCells:           reservedPc,
	}
	for vc := range nonReservedVcl {
		h.vcSchedulers[vc] = newDefaultIntraVCScheduler(nonReservedVcl[vc], reservedVcl[vc])
	}
	for chain, ccl := range h.fullCellList {
		h.opportunisticSchedulers[chain] = NewTopologyAwareScheduler(ccl, false)
	}
	h.validateInitialAssignment()
	h.initFreeCellList()
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
	var (
		// gpu number -> a set of pods -> a set of GPUs of each pod
		groupPhysicalPlacement map[int32][]CellList
		groupVcPlacement       map[int32][]CellList
		podIndex               int32
		newGroup               bool
	)
	if group := h.allocatedAffinityGroups[s.AffinityGroup.Name]; group == nil {
		newGroup = true
		klog.Infof("Scheduling new affinity group %v", s.AffinityGroup.Name)
		groupPhysicalPlacement, groupVcPlacement = h.scheduleNewAffinityGroup(pod, s)
		if groupPhysicalPlacement != nil {
			podIndex = int32(len(groupPhysicalPlacement[s.GpuNumber])) - 1
		}
	} else {
		newGroup = false
		if h.allocatedAffinityGroups[s.AffinityGroup.Name].unallocatedPodNums[s.GpuNumber] <= 0 {
			panic(internal.NewBadRequestError(fmt.Sprintf(
				"Requesting more pods than the configured number for %v GPUs in affinity group %v",
				s.GpuNumber, s.AffinityGroup.Name)))
		}
		klog.Infof("Pod from existing affinity group: %v", s.AffinityGroup.Name)
		groupPhysicalPlacement = h.allocatedAffinityGroups[s.AffinityGroup.Name].physicalGpuPlacement
		groupVcPlacement = h.allocatedAffinityGroups[s.AffinityGroup.Name].vcGpuPlacement
		podIndex = h.allocatedAffinityGroups[s.AffinityGroup.Name].unallocatedPodNums[s.GpuNumber] - 1
	}
	return generatePodScheduleResult(
		groupPhysicalPlacement, groupVcPlacement, podIndex, suggestedNodes, pod, newGroup)
}

// TODO: reconfig; suggestedNodes (failure)
func (h *HivedAlgorithm) AddAllocatedPod(pod *core.Pod) {
	h.algorithmLock.Lock()
	defer h.algorithmLock.Unlock()

	klog.Infof("[%v]: adding allocated pod...", internal.Key(pod))
	s := internal.ExtractPodSchedulingSpec(pod)
	info := internal.ExtractPodBindInfo(pod)

	chain := CellChain(info.CellChain)
	if group := h.allocatedAffinityGroups[s.AffinityGroup.Name]; group == nil {
		newGroup := newAlgoAffinityGroup(s.AffinityGroup)
		for _, gms := range info.AffinityGroupBindInfo {
			gpuNumber := int32(len(gms.PodPlacements[0].PhysicalGpuIndices))
			newGroup.physicalGpuPlacement[gpuNumber] = make([]CellList, len(gms.PodPlacements))
			newGroup.vcGpuPlacement[gpuNumber] = make([]CellList, len(gms.PodPlacements))
			for i := int32(0); i < int32(len(gms.PodPlacements)); i++ {
				newGroup.physicalGpuPlacement[gpuNumber][i] = make(
					CellList, len(gms.PodPlacements[i].PhysicalGpuIndices))
				newGroup.vcGpuPlacement[gpuNumber][i] = make(
					CellList, len(gms.PodPlacements[i].PhysicalGpuIndices))
				node := gms.PodPlacements[i].PhysicalNode
				for j := int32(0); j < int32(len(gms.PodPlacements[i].PhysicalGpuIndices)); j++ {
					physicalGpuIndex := gms.PodPlacements[i].PhysicalGpuIndices[j]
					pGpu := h.findPhysicalGpu(chain, node, physicalGpuIndex)
					if pGpu == nil {
						panic(fmt.Sprintf("[%v]: physical GPU cell not found when adding pod: node %v, GPU index %v",
							internal.Key(pod), node, physicalGpuIndex))
					}
					virtualCellIndex := gms.PodPlacements[i].VirtualCellIndices[j]
					vGpu := h.findVirtualGpu(
						s.VirtualCluster, chain, s.ReservationId, virtualCellIndex)
					if virtualCellIndex >= 0 && vGpu == nil {
						panic(fmt.Sprintf("[%v]: virtual GPU cell not found when adding pod: virtual cell index %v",
							internal.Key(pod), virtualCellIndex))
					}
					newGroup.physicalGpuPlacement[gpuNumber][i][j] = pGpu
					newGroup.vcGpuPlacement[gpuNumber][i][j] = vGpu
					h.confirmAllocatedGpu(pGpu, vGpu, CellPriority(s.Priority))
				}
			}
		}
		h.allocatedAffinityGroups[s.AffinityGroup.Name] = newGroup
		klog.Infof("New affinity group created: %v", s.AffinityGroup.Name)
	}
	for _, gpuIndex := range info.GpuIsolation {
		h.findPhysicalGpu(chain, info.Node, gpuIndex).AddPod(pod)
	}
	h.allocatedAffinityGroups[s.AffinityGroup.Name].unallocatedPodNums[s.GpuNumber]--
}

func (h *HivedAlgorithm) DeleteAllocatedPod(pod *core.Pod) {
	h.algorithmLock.Lock()
	defer h.algorithmLock.Unlock()

	klog.Infof("[%v]: deleting allocated pod...", internal.Key(pod))
	s := internal.ExtractPodSchedulingSpec(pod)
	info := internal.ExtractPodBindInfo(pod)

	chain := CellChain(info.CellChain)
	if group := h.allocatedAffinityGroups[s.AffinityGroup.Name]; group == nil {
		panic(fmt.Sprintf(
			"[%v]: group %v not exists when deleting pod", internal.Key(pod), s.AffinityGroup.Name))
	} else {
		h.allocatedAffinityGroups[s.AffinityGroup.Name].unallocatedPodNums[s.GpuNumber]++
		for _, gpuIndex := range info.GpuIsolation {
			h.findPhysicalGpu(chain, info.Node, gpuIndex).DeletePod(pod)
		}
		allPodsDeleted := true
		for gpuNum, unallocatedPodNum := range h.allocatedAffinityGroups[s.AffinityGroup.Name].unallocatedPodNums {
			if unallocatedPodNum != int32(
				len(h.allocatedAffinityGroups[s.AffinityGroup.Name].physicalGpuPlacement[gpuNum])) {
				allPodsDeleted = false
				break
			}
		}
		if allPodsDeleted {
			for _, podPlacements := range h.allocatedAffinityGroups[s.AffinityGroup.Name].physicalGpuPlacement {
				for _, podPlacement := range podPlacements {
					for _, podGpu := range podPlacement {
						h.confirmReleasedGpu(podGpu.(*PhysicalCell))
					}
				}
			}
			delete(h.allocatedAffinityGroups, s.AffinityGroup.Name)
			klog.Infof("Affinity group deleted: %v", s.AffinityGroup.Name)
		}
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

// initFreeCellList initializes the free cell list (i.e., top level cells in each chain).
func (h *HivedAlgorithm) initFreeCellList() {
	for chain, ccl := range h.fullCellList {
		topLevel := CellLevel(len(ccl))
		h.freeCellList[chain] = NewChainCellList(topLevel - 1)
		h.freeCellList[chain][topLevel] = make(CellList, len(ccl[topLevel]))
		copy(h.freeCellList[chain][topLevel], ccl[topLevel])
	}
}

// initReservations creates static bindings for the reserved cells, and removes the
// reserved physical cells from the free cell list.
func (h *HivedAlgorithm) initReservations() {
	for vc, vcReservation := range h.reservedCells {
		for rid, physical := range vcReservation {
			h.removeCellFromFreeList(physical)
			virtualList := h.vcSchedulers[vc].getReservedCellList()[rid]
			virtual := virtualList[CellLevel(len(virtualList))][0].(*VirtualCell)
			virtual.SetPhysicalCell(physical)
			physical.SetVirtualCell(virtual)
			klog.Infof("Cells bound: %v and %v (reservation)", virtual.GetName(), physical.GetName())
		}
	}
}

// scheduleNewAffinityGroup schedules each pod of a new affinity group to a set of GPUs
// (in both the physical cluster and the VC).
func (h *HivedAlgorithm) scheduleNewAffinityGroup(
	pod *core.Pod,
	s *api.PodSchedulingSpec) (map[int32][]CellList, map[int32][]CellList) {

	var (
		physicalPlacement map[int32][]CellList
		vcPlacement       map[int32][]CellList
		priority          CellPriority
	)
	if s.Priority < api.RegularPriority {
		priority = opportunisticPriority
	} else {
		priority = CellPriority(s.Priority)
	}
	sr := schedulingRequest{
		vc:            s.VirtualCluster,
		reservationId: s.ReservationId,
		priority:      priority,
		affinityGroup: map[int32]int32{},
	}
	for _, m := range s.AffinityGroup.Members {
		sr.affinityGroup[m.GpuNumber] = m.PodNumber
	}
	h.validateSchedulingRequest(sr, pod)
	if sr.reservationId != "" {
		klog.Infof("Use reservation %v", s.ReservationId)
		sr.chain = h.reservedCells[sr.vc][sr.reservationId].GetChain()
		physicalPlacement, vcPlacement = h.processSchedulingRequest(sr)
	} else {
		physicalPlacement, vcPlacement = h.scheduleAffinityGroupForGpuType(sr, s.GpuType, pod)
	}
	if physicalPlacement != nil {
		klog.Infof("Succeed scheduling group %v", s.AffinityGroup.Name)
	} else {
		klog.Infof("Failed to schedule group %v", s.AffinityGroup.Name)
	}
	return physicalPlacement, vcPlacement
}

// scheduleAffinityGroupForGpuType schedules an affinity group in a certain cell chain.
// If a GPU type is specified, it will be scheduled to a chain that contains this GPU type.
// Otherwise any GPU type will be tried.
func (h *HivedAlgorithm) scheduleAffinityGroupForGpuType(
	sr schedulingRequest,
	gpuType string,
	pod *core.Pod) (map[int32][]CellList, map[int32][]CellList) {

	if gpuType != "" {
		if chains := h.chains[gpuType]; chains == nil {
			panic(internal.NewBadRequestError(fmt.Sprintf(
				"[%v]: pod requesting an invalid GPU type: %v", internal.Key(pod), gpuType)))
		} else {
			vcHasType := false
			for _, chain := range chains {
				if h.vcSchedulers[sr.vc].getNonReservedCellList()[chain] != nil {
					vcHasType = true
				}
				sr.chain = chain
				if physicalPlacement, vcPlacement := h.processSchedulingRequest(sr); physicalPlacement != nil {
					return physicalPlacement, vcPlacement
				}
			}
			if sr.priority >= regularPriority && !vcHasType {
				panic(internal.NewBadRequestError(fmt.Sprintf(
					"[%v]: pod requesting GPU type %v which VC %v does not have",
					internal.Key(pod), gpuType, sr.vc)))
			}
		}
	} else {
		for _, chains := range h.chains {
			for _, chain := range chains {
				sr.chain = chain
				if physicalPlacement, vcPlacement := h.processSchedulingRequest(sr); physicalPlacement != nil {
					return physicalPlacement, vcPlacement
				}
			}
		}
	}
	return nil, nil
}

// validateSchedulingRequest checks the existence of VC and reservation ID, and the legality of priority.
func (h *HivedAlgorithm) validateSchedulingRequest(sr schedulingRequest, pod *core.Pod) {
	var message string
	if h.vcSchedulers[sr.vc] == nil {
		message = fmt.Sprintf("VC %v does not exists!", sr.vc)
	} else if sr.reservationId != "" {
		if h.vcSchedulers[sr.vc].getReservedCellList()[sr.reservationId] == nil {
			message = fmt.Sprintf("VC %v does not have reservation %v", sr.vc, sr.reservationId)
		} else if sr.priority < regularPriority {
			message = fmt.Sprintf("opportunistic pod not supported to use reservation %v", sr.reservationId)
		}
	} else if sr.priority > highestPriority {
		message = fmt.Sprintf("priority %v exceeds highest priority", sr.priority)
	}
	if message != "" {
		panic(internal.NewBadRequestError(fmt.Sprintf("[%v]: %v", internal.Key(pod), message)))
	}
}

// processSchedulingRequest feeds a request to a VC scheduler
// or the opportunistic scheduler according to its priority.
func (h *HivedAlgorithm) processSchedulingRequest(sr schedulingRequest) (map[int32][]CellList, map[int32][]CellList) {
	if sr.priority >= regularPriority {
		return h.scheduleRegularAffinityGroup(sr)
	} else {
		return h.scheduleOpportunisticAffinityGroup(sr), nil
	}
}

// scheduleRegularAffinityGroup schedules an affinity group in its VC, and
// then maps the placement in VC to the physical cluster.
func (h *HivedAlgorithm) scheduleRegularAffinityGroup(sr schedulingRequest) (map[int32][]CellList, map[int32][]CellList) {
	// schedule in VC
	vcPlacement := h.vcSchedulers[sr.vc].schedule(sr)
	if vcPlacement == nil {
		return nil, nil
	}
	// map the vc placement to the physical cluster
	physicalPlacement := map[int32][]CellList{}
	for podGpuNum, podPlacements := range vcPlacement {
		physicalPlacement[podGpuNum] = make([]CellList, len(podPlacements))
		for i, podGpus := range podPlacements {
			physicalPlacement[podGpuNum][i] = make(CellList, len(podGpus))
			for j, gpu := range podGpus {
				vGpu := gpu.(*VirtualCell)
				pac := vGpu.GetPreAssignedCell()
				// check if the preassigned cell has been (temporarily) bound to a physical cell
				preassignedPhysical := pac.GetPhysicalCell()
				if preassignedPhysical == nil {
					preassignedPhysical = pac.GetPreBoundVirtualCell()
				}
				if preassignedPhysical == nil {
					// allocate a new physical cell to the preassigned cell. input a copy of the free cell list
					// because during the scheduling we should not make in-place change to the data structures
					c := buddyAlloc(h.getTmpFreeCellList(sr.chain), pac.GetLevel())
					if c == nil {
						panic(fmt.Sprintf(
							"Cannot find physical cell for a VC cell: %v", pac.GetName()))
					} else {
						preassignedPhysical = c
						// create binding (which is temporary and will be cleared after the scheduling,
						// same reason as above)
						pac.SetPreBoundVirtualCell(preassignedPhysical)
						preassignedPhysical.SetPreBoundVirtualCell(pac)
					}
				}
				physicalPlacement[podGpuNum][i][j] = mapNonPreassignedCellToPhysical(vGpu)
			}
		}
	}
	clearTmpBindings(vcPlacement)
	return physicalPlacement, vcPlacement
}

// scheduleOpportunisticAffinityGroup calls the opportunistic pod scheduler to schedule an affinity group.
func (h *HivedAlgorithm) scheduleOpportunisticAffinityGroup(sr schedulingRequest) map[int32][]CellList {
	return h.opportunisticSchedulers[sr.chain].Schedule(sr.affinityGroup, opportunisticPriority)
}

// getTmpFreeCellList returns a copy of the free cell list.
func (h *HivedAlgorithm) getTmpFreeCellList(chain CellChain) ChainCellList {
	ccl := ChainCellList{}
	for l := CellLevel(1); l <= CellLevel(len(h.freeCellList[chain])); l++ {
		ccl[l] = make(CellList, len(h.freeCellList[chain][l]))
		copy(ccl[l], h.freeCellList[chain][l])
	}
	return ccl
}

// confirmAllocatedGpu creates the cell bindings, removes the physical cell from the free list
// (if necessary), and sets the priority.
func (h *HivedAlgorithm) confirmAllocatedGpu(pc *PhysicalCell, vc *VirtualCell, p CellPriority) {
	physicalPriority := p
	if vc != nil {
		preassignedNewlyBound := vc.GetPreAssignedCell().GetPhysicalCell() == nil
		bindCells(pc, vc)
		if preassignedNewlyBound {
			// remove the allocated cell from the free list (possibly splitting cells)
			h.removeCellFromFreeList(vc.GetPreAssignedCell().GetPhysicalCell())
		}
		vc.SetPriority(p)
		updateUsedGpuNumAtPriority(vc, p, true)
	} else {
		physicalPriority = opportunisticPriority
	}
	pc.SetPriority(physicalPriority)
	updateUsedGpuNumAtPriority(pc, physicalPriority, true)
}

// confirmReleasedGpu destroys the cell bindings, adds the physical cell back to the free list
// (if necessary), and resets the priority.
func (h *HivedAlgorithm) confirmReleasedGpu(c *PhysicalCell) {
	if vc := c.GetVirtualCell(); vc != nil {
		preassignedPhysical := vc.GetPreAssignedCell().GetPhysicalCell()
		unbindCells(c)
		if vc.GetPreAssignedCell().GetPhysicalCell() == nil {
			// add the released cell back to the free list (possibly merging cells)
			h.addCellToFreeList(preassignedPhysical)
		}
		updateUsedGpuNumAtPriority(vc, vc.GetPriority(), false)
		vc.SetPriority(freePriority)
	}
	updateUsedGpuNumAtPriority(c, c.GetPriority(), false)
	c.SetPriority(freePriority)
}

// removeCellFromFreeList removes a cell from the free cell list and splits its parent recursively if needed.
func (h *HivedAlgorithm) removeCellFromFreeList(c *PhysicalCell) {
	chain := c.GetChain()
	terminate := false
	for {
		l := c.GetLevel()
		parent := c.GetParent()
		if parent != nil {
			pp := parent.(*PhysicalCell)
			if pp.IsSplit() {
				terminate = true
			} else {
				h.freeCellList[chain][l] = append(h.freeCellList[chain][l], pp.GetChildren()...)
				pp.SetSplit(true)
			}
		} else {
			terminate = true
		}
		h.freeCellList[chain].remove(c, l)
		if terminate {
			break
		} else {
			c = parent.(*PhysicalCell)
		}
	}
}

// addCellToFreeList adds a cell to the free cell list and merges its buddies recursively if needed.
func (h *HivedAlgorithm) addCellToFreeList(c *PhysicalCell) {
	chain := c.GetChain()
	terminate := false
	for {
		l := c.GetLevel()
		parent := c.GetParent()
		if parent != nil {
			allBuddyFree := true
			for _, buddy := range parent.GetChildren() {
				if buddy.(*PhysicalCell).GetVirtualCell() != nil {
					allBuddyFree = false
					break
				}
			}
			if !allBuddyFree {
				terminate = true
			} else {
				for _, buddy := range parent.GetChildren() {
					if buddy != c {
						h.freeCellList[chain].remove(buddy, l)
					}
				}
				parent.(*PhysicalCell).SetSplit(false)
			}
		} else {
			terminate = true
		}
		if terminate {
			h.freeCellList[chain][l] = append(h.freeCellList[chain][l], c)
			break
		} else {
			c = parent.(*PhysicalCell)
		}
	}
}

// findPhysicalGpu finds a physical GPU cell in the full list. This search is based on *one* node
// and *one* GPU index, assuming there is no resource overlapping among cells at the same level.
func (h *HivedAlgorithm) findPhysicalGpu(
	chain CellChain,
	node string,
	gpuIndex int32) *PhysicalCell {

	for _, c := range h.fullCellList[chain][1] {
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

// findVirtualGpu finds a virtual GPU cell according to the cell index.
func (h *HivedAlgorithm) findVirtualGpu(
	vc api.VirtualClusterName,
	chain CellChain,
	rid api.ReservationId,
	index int32) *VirtualCell {

	if index >= 0 {
		var searchList CellList
		if rid == "" {
			searchList = h.vcSchedulers[vc].getNonReservedCellList()[chain][1]
		} else {
			searchList = h.vcSchedulers[vc].getReservedCellList()[rid][1]
		}

		for _, c := range searchList {
			cc := c.(*VirtualCell)
			if cc.GetIndex() == index {
				return cc
			}
		}
	}
	return nil
}

// generatePodScheduleResult writes the scheduling result into a PodScheduleResult.
func generatePodScheduleResult(
	groupPhysicalPlacement map[int32][]CellList,
	groupVcPlacement map[int32][]CellList,
	podIndex int32,
	suggestedNodes []string,
	pod *core.Pod,
	newGroup bool) internal.PodScheduleResult {

	if groupPhysicalPlacement == nil {
		return internal.PodScheduleResult{
			PodWaitInfo: &internal.PodWaitInfo{
				FailedNodeReasons: map[string]string{},
			},
		}
	} else {
		var (
			selectedNode       string
			selectedGpuIndices []int32
			chain              string
		)
		preemptionVictims := common.NewSet()
		gsi := make([]api.AffinityGroupMemberBindInfo, len(groupPhysicalPlacement))
		groupMemberIndex := 0
		for podGpuNum, podPhysicalPlacements := range groupPhysicalPlacement {
			gms := api.AffinityGroupMemberBindInfo{
				PodPlacements: make([]api.PodPlacementInfo, len(podPhysicalPlacements)),
			}
			for podIndex := int32(0); podIndex < int32(len(podPhysicalPlacements)); podIndex++ {
				gms.PodPlacements[podIndex].PhysicalGpuIndices = make(
					[]int32, len(podPhysicalPlacements[podIndex]))
				gms.PodPlacements[podIndex].VirtualCellIndices = make(
					[]int32, len(podPhysicalPlacements[podIndex]))
				for gpuIndex := 0; gpuIndex < len(podPhysicalPlacements[podIndex]); gpuIndex++ {
					pGpu := podPhysicalPlacements[podIndex][gpuIndex].(*PhysicalCell)
					nodes, gpuIndices := pGpu.GetPhysicalPlacement()
					if gms.PodPlacements[podIndex].PhysicalNode == "" {
						gms.PodPlacements[podIndex].PhysicalNode = nodes[0]
					}
					gms.PodPlacements[podIndex].PhysicalGpuIndices[gpuIndex] = gpuIndices[0]
					if newGroup && pGpu.HasPod() {
						preemptionVictims.Add(pGpu.GetPods()[0])
					}
					if groupVcPlacement != nil {
						vGpu := groupVcPlacement[podGpuNum][podIndex][gpuIndex].(*VirtualCell)
						gms.PodPlacements[podIndex].VirtualCellIndices[gpuIndex] = vGpu.GetIndex()
					} else {
						gms.PodPlacements[podIndex].VirtualCellIndices[gpuIndex] = -1
					}
				}
				if podIndex == podIndex {
					selectedNode = gms.PodPlacements[podIndex].PhysicalNode
					selectedGpuIndices = gms.PodPlacements[podIndex].PhysicalGpuIndices
					chain = string(podPhysicalPlacements[podIndex][0].GetChain())
				}
			}
			gsi[groupMemberIndex] = gms
			groupMemberIndex++
		}
		if !common.StringsContains(suggestedNodes, selectedNode) {
			panic(fmt.Sprintf("[%v]: node %v picked by algorithm but not in K8S candidates",
				internal.Key(pod), selectedNode))
		}
		if preemptionVictims.IsEmpty() {
			klog.Infof("[%v]: scheduled to node %v, GPUs %v",
				internal.Key(pod), selectedNode, selectedGpuIndices)
			return internal.PodScheduleResult{
				PodBindInfo: &api.PodBindInfo{
					Node:                  selectedNode,
					GpuIsolation:          selectedGpuIndices,
					CellChain:             chain,
					AffinityGroupBindInfo: gsi,
				},
			}
		} else {
			return internal.PodScheduleResult{
				PodPreemptInfo: &internal.PodPreemptInfo{},
			}
		}
	}
}

// buddyAlloc allocates a free cell at a certain level from a free list.
// It splits a higher-level cell when there is no free cell at the current level.
// As the input cell list is a copy of the real free list and hence is one-off,
// we won't remove a returned cell from it.
func buddyAlloc(freeList ChainCellList, level CellLevel) *PhysicalCell {
	if len(freeList[level]) == 0 && level < CellLevel(len(freeList)) {
		higherCell := buddyAlloc(freeList, level+1)
		if higherCell != nil {
			freeList[level] = append(freeList[level], higherCell.GetChildren()...)
		}
	}
	if len(freeList[level]) == 0 {
		return nil
	}
	return minOpportunisticCell(freeList[level])
}

// minOpportunisticCell selects a cell with the minimum number of opportunistic pods from a cell list.
func minOpportunisticCell(cl CellList) *PhysicalCell {
	mo := int32(math.MaxInt32)
	var moc *PhysicalCell
	for _, c := range cl {
		if pc := c.(*PhysicalCell); pc.GetVirtualCell() == nil && pc.GetPreBoundVirtualCell() == nil &&
			pc.GetUsedGpuNumAtPriority(opportunisticPriority) < mo {
			mo = pc.GetUsedGpuNumAtPriority(opportunisticPriority)
			moc = pc
		}
	}
	return moc
}

// mapNonPreassignedCellToPhysical maps a virtual cell (possibly inside a preassigned one) to the
// physical cell of the preassigned cell. This operation keeps the inner-cell topology equivalent,
// by recursively binding the cells inside the preassigned one.
func mapNonPreassignedCellToPhysical(c *VirtualCell) *PhysicalCell {
	if c.GetPhysicalCell() != nil {
		return c.GetPhysicalCell()
	} else if c.GetPreBoundVirtualCell() != nil {
		return c.GetPreBoundVirtualCell()
	} else {
		parentPhysical := mapNonPreassignedCellToPhysical(c.GetParent().(*VirtualCell))
		pc := minOpportunisticCell(parentPhysical.GetChildren())
		if pc == nil || pc.GetPriority() > opportunisticPriority {
			panic(fmt.Sprintf("Cannot find physical cell for %v", c.GetName()))
		}
		c.SetPreBoundVirtualCell(pc)
		pc.SetPreBoundVirtualCell(c)
		return pc
	}
}

// clearTmpBindings clears the temporary bindings created during scheduling.
func clearTmpBindings(vcPlacement map[int32][]CellList) {
	for _, podPlacements := range vcPlacement {
		for _, podGpus := range podPlacements {
			for _, gpu := range podGpus {
				for gpu != nil {
					vGpu := gpu.(*VirtualCell)
					if pGpu := vGpu.GetPreBoundVirtualCell(); pGpu != nil {
						pGpu.SetPreBoundVirtualCell(nil)
						vGpu.SetPreBoundVirtualCell(nil)
						gpu = gpu.GetParent()
					} else {
						break
					}
				}
			}
		}
	}
}

// bindCells binds a virtual cell to a physical cell and its parent recursively.
func bindCells(pc *PhysicalCell, vc *VirtualCell) {
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
}

// unbindCells unbinds a virtual cell with a physical cell and its parent recursively.
func unbindCells(c *PhysicalCell) {
	boundVirtual := c.GetVirtualCell()
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
}

// updateUsedGpuNumAtPriority updates the number of used GPUs at a priority for a cell
// and its parent recursively.
func updateUsedGpuNumAtPriority(c Cell, p CellPriority, increase bool) {
	for c != nil {
		if increase {
			c.IncreaseUsedGpuNumAtPriority(p, 1)
			c.IncreaseFreeGpuNum(-1)
		} else {
			c.IncreaseUsedGpuNumAtPriority(p, -1)
			c.IncreaseFreeGpuNum(1)
		}
		c = c.GetParent()
	}
}
