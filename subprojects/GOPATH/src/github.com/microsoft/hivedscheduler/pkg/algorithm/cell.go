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
	"k8s.io/klog"
)

// A Cell represents a set of GPUs affinitized by their interconnection topology.
// Cells are organized as a tree through pointers to their parents / children.
type Cell interface {
	GetChain() CellChain
	GetLevel() CellLevel
	GetPriority() CellPriority
	SetPriority(CellPriority)
	GetAddress() string
	GetParent() Cell
	SetParent(Cell)
	GetChildren() CellList
	SetChildren(CellList)
	AtOrHigherThanNode() bool

	GetTotalGpuNum() int32
	GetUsedGpuNumAtPriorities() map[CellPriority]int32
	IncreaseUsedGpuNumAtPriority(CellPriority, int32)
}

func CellEqual(c1 Cell, c2 Cell) bool {
	if c1 == nil || c2 == nil {
		return c1 == nil && c2 == nil
	} else {
		return c1.GetAddress() == c2.GetAddress()
	}
}

type GenericCell struct {
	chain              CellChain
	level              CellLevel
	priority           CellPriority
	address            string
	parent             Cell     // pointer to its parent cell
	children           CellList // pointer to its children cells
	atOrHigherThanNode bool     // true if the cell is at or higher than node level

	totalGpuNum            int32                  // total GPU number of a cell
	usedGpuNumAtPriorities map[CellPriority]int32 // GPU number used by each priority
}

func (c *GenericCell) GetChain() CellChain {
	return c.chain
}

func (c *GenericCell) GetLevel() CellLevel {
	return c.level
}

func (c *GenericCell) GetAddress() string {
	return c.address
}

func (c *GenericCell) GetPriority() CellPriority {
	return c.priority
}

func (c *GenericCell) GetParent() Cell {
	return c.parent
}

func (c *GenericCell) SetParent(p Cell) {
	c.parent = p
}

func (c *GenericCell) GetChildren() CellList {
	return c.children
}

func (c *GenericCell) AtOrHigherThanNode() bool {
	return c.atOrHigherThanNode
}

func (c *GenericCell) GetTotalGpuNum() int32 {
	return c.totalGpuNum
}

func (c *GenericCell) GetUsedGpuNumAtPriorities() map[CellPriority]int32 {
	return c.usedGpuNumAtPriorities
}

func (c *GenericCell) IncreaseUsedGpuNumAtPriority(p CellPriority, delta int32) {
	c.usedGpuNumAtPriorities[p] += delta
	if c.usedGpuNumAtPriorities[p] == 0 {
		delete(c.usedGpuNumAtPriorities, p)
	}
}

// PhysicalCell defines a cell in the physical cluster.
type PhysicalCell struct {
	GenericCell
	nodes               []string                // node names inside the cell
	gpuIndices          []int32                 // [-1] for cells at levels higher than node
	affinityGroup       *AlgoAffinityGroup      // affinity group using this cell
	virtualCell         *VirtualCell            // points to the bound virtual cell
	preBoundVirtualCell *VirtualCell            // points to the temporarily bound virtual cell (before the binding is confirmed)
	split               bool                    // true when the cell has been split
	reserved            bool                    // true when this is a reserved cell
	status              *api.PhysicalCellStatus // json representation of the status of this cell to expose to users
}

func NewPhysicalCell(c CellChain, l CellLevel, g bool, n int32, cellType string, address string) *PhysicalCell {
	return &PhysicalCell{
		GenericCell: GenericCell{
			chain:                  c,
			level:                  l,
			priority:               freePriority,
			address:                address,
			atOrHigherThanNode:     g,
			totalGpuNum:            n,
			usedGpuNumAtPriorities: map[CellPriority]int32{},
		},
		status: &api.PhysicalCellStatus{
			CellStatus: api.CellStatus{
				CellType:    cellType,
				CellAddress: address,
				State:       api.FreeState,
				Priority:    int32(freePriority),
			},
		},
	}
}

func (c *PhysicalCell) SetPriority(p CellPriority) {
	c.priority = p
	c.status.Priority = int32(p)
	state := api.UsedState
	if p == freePriority {
		state = api.FreeState
	}
	c.status.State = state
	if c.status.VirtualCell != nil {
		c.status.VirtualCell.Priority = int32(p)
		c.status.VirtualCell.State = state
	}
}

func (c *PhysicalCell) SetChildren(children CellList) {
	c.children = children
	for _, cc := range children {
		child := cc.(*PhysicalCell)
		c.status.Children = append(c.status.Children, child.status)
	}
}

func (c *PhysicalCell) GetPhysicalPlacement() ([]string, []int32) {
	return c.nodes, c.gpuIndices
}

func (c *PhysicalCell) GetPhysicalPlacementString() string {
	return fmt.Sprintf("%v:%v", c.nodes, c.gpuIndices)
}

func (c *PhysicalCell) SetPhysicalResources(nodes []string, gpuIndices []int32) {
	c.nodes = nodes
	c.gpuIndices = gpuIndices
}

func (c *PhysicalCell) AddAffinityGroup(g *AlgoAffinityGroup) {
	if c.affinityGroup != nil {
		klog.Errorf("Error when adding affinity group %v to cell %v: cell already has group %v",
			g.name, c.GetAddress(), c.affinityGroup.name)
	}
	c.affinityGroup = g
}

func (c *PhysicalCell) DeleteAffinityGroup(g *AlgoAffinityGroup) {
	if c.affinityGroup == nil || c.affinityGroup.name != g.name {
		klog.Errorf("Error when deleting affinity group %v from cell %v: not found", g.name, c.GetAddress())
	}
	c.affinityGroup = nil
}

func (c *PhysicalCell) GetAffinityGroup() *AlgoAffinityGroup {
	return c.affinityGroup
}

func (c *PhysicalCell) GetVirtualCell() *VirtualCell {
	return c.virtualCell
}

func (c *PhysicalCell) SetVirtualCell(virtual *VirtualCell) {
	c.virtualCell = virtual
	if virtual == nil {
		c.status.VirtualCell = nil
		c.status.Vc = ""
	} else {
		vcs := &api.VirtualCellStatus{}
		// shallow copy the status, clear the pointers to avoid reference
		*vcs = *(virtual.status)
		vcs.Children = nil
		vcs.PhysicalCell = nil
		c.status.VirtualCell = vcs
		c.status.Vc = string(virtual.vc)
	}
}

func (c *PhysicalCell) GetPreBoundVirtualCell() *VirtualCell {
	return c.preBoundVirtualCell
}

func (c *PhysicalCell) SetPreBoundVirtualCell(vc *VirtualCell) {
	c.preBoundVirtualCell = vc
}

func (c *PhysicalCell) IsSplit() bool {
	return c.split
}

func (c *PhysicalCell) SetSplit(split bool) {
	c.split = split
}

func (c *PhysicalCell) IsReserved() bool {
	return c.reserved
}

func (c *PhysicalCell) SetReserved(reserved bool) {
	c.reserved = reserved
}

func (c *PhysicalCell) GetStatus() *api.PhysicalCellStatus {
	return c.status
}

func (c *PhysicalCell) SetAddress(address string) {
	c.address = address
	c.status.CellAddress = address
}

// VirtualCell defines a cell in a VC.
type VirtualCell struct {
	GenericCell
	vc                   api.VirtualClusterName // name of its VC
	rid                  api.ReservationId      // reservation ID
	preAssignedCell      *VirtualCell           // top level cell of this cell chain
	physicalCell         *PhysicalCell          // points to the bound physical cell
	preBoundPhysicalCell *PhysicalCell          // points to the temporarily bound physical cell (before the binding is confirmed)
	status               *api.VirtualCellStatus // json representation of the status of this cell to expose to users
}

func NewVirtualCell(
	vc api.VirtualClusterName,
	c CellChain,
	l CellLevel,
	g bool,
	n int32,
	pac *VirtualCell,
	cellType string,
	address string) *VirtualCell {

	return &VirtualCell{
		GenericCell: GenericCell{
			chain:                  c,
			level:                  l,
			priority:               freePriority,
			address:                address,
			atOrHigherThanNode:     g,
			totalGpuNum:            n,
			usedGpuNumAtPriorities: map[CellPriority]int32{},
		},
		vc:              vc,
		preAssignedCell: pac,
		status: &api.VirtualCellStatus{
			CellStatus: api.CellStatus{
				CellType:    cellType,
				CellAddress: address,
				State:       api.FreeState,
				Priority:    int32(freePriority),
			},
		},
	}
}

func (c *VirtualCell) SetPriority(p CellPriority) {
	c.priority = p
	c.status.Priority = int32(p)
	state := api.UsedState
	if p == freePriority {
		state = api.FreeState
	}
	c.status.State = state
	if c.status.PhysicalCell != nil {
		c.status.PhysicalCell.Priority = int32(p)
		c.status.PhysicalCell.State = state
	}
}

func (c *VirtualCell) SetChildren(children CellList) {
	c.children = children
	for _, cc := range children {
		child := cc.(*VirtualCell)
		c.status.Children = append(c.status.Children, child.status)
	}
}

func (c *VirtualCell) SetReservation(rid api.ReservationId) {
	c.rid = rid
}

func (c *VirtualCell) GetPreAssignedCell() *VirtualCell {
	return c.preAssignedCell
}

func (c *VirtualCell) SetPreAssignedCell(vc *VirtualCell) {
	c.preAssignedCell = vc
}

func (c *VirtualCell) GetPhysicalCell() *PhysicalCell {
	return c.physicalCell
}

func (c *VirtualCell) SetPhysicalCell(pc *PhysicalCell) {
	c.physicalCell = pc
	if pc == nil {
		c.status.PhysicalCell = nil
	} else {
		pcs := &api.PhysicalCellStatus{}
		// shallow copy the status, clear the pointers to avoid reference
		*pcs = *(pc.status)
		pcs.Children = nil
		pcs.VirtualCell = nil
		c.status.PhysicalCell = pcs
	}
}

func (c *VirtualCell) GetPreBoundPhysicalCell() *PhysicalCell {
	return c.preBoundPhysicalCell
}

func (c *VirtualCell) SetPreBoundPhysicalCell(pc *PhysicalCell) {
	c.preBoundPhysicalCell = pc
}

func (c *VirtualCell) GetStatus() *api.VirtualCellStatus {
	return c.status
}
