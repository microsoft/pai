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
	"github.com/microsoft/hivedscheduler/pkg/internal"
	core "k8s.io/api/core/v1"
)

// A Cell represents a set of GPUs affinitized by their interconnection topology.
// Cells are organized as a tree through pointers to their parents / children.
type Cell interface {
	GetChain() CellChain
	GetLevel() CellLevel
	GetPriority() CellPriority
	SetPriority(CellPriority)
	GetName() string
	GetParent() Cell
	SetParent(Cell)
	GetChildren() CellList
	SetChildren(CellList)
	AtOrHigherThanNode() bool

	IncreaseFreeGpuNum(int32)
	GetFreeGpuNumForPriority(CellPriority) int32
	GetUsedGpuNumAtPriority(CellPriority) int32
	IncreaseUsedGpuNumAtPriority(CellPriority, int32)
	GetUsedGpuNumSamePriority() int32
	GetUsedGpuNumOtherPriority() int32
	SetUsedGpuNumForPriority(CellPriority)
	SetUsedGpuNumAllPriority(CellPriority)
}

type GenericCell struct {
	chain                  CellChain
	level                  CellLevel
	priority               CellPriority // priority of a cell is max of those of its children and itself
	parent                 Cell         // pointer to its parent cell
	children               CellList     // pointer to its children cells
	atOrHigherThanNode     bool

	totalGpuNum int32
	freeGpuNum int32
	freeGpuNumForPriority int32
	usedGpuNumAtPriority   map[CellPriority]int32
	usedGpuNumSamePriority int32
	usedGpuNumOtherPriority int32
}

func (c *GenericCell) GetChain() CellChain {
	return c.chain
}

func (c *GenericCell) GetLevel() CellLevel {
	return c.level
}

func (c *GenericCell) GetPriority() CellPriority {
	return c.priority
}

func (c *GenericCell) SetPriority(p CellPriority) {
	c.priority = p
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

func (c *GenericCell) SetChildren(children CellList) {
	c.children = children
}

func (c *GenericCell) AtOrHigherThanNode() bool {
	return c.atOrHigherThanNode
}

func (c *GenericCell) IncreaseFreeGpuNum(delta int32) {
	c.freeGpuNum += delta
}

func (c *GenericCell) GetFreeGpuNumForPriority(p CellPriority) int32 {
	return c.freeGpuNumForPriority
}

func (c *GenericCell) GetUsedGpuNumAtPriority(p CellPriority) int32 {
	return c.usedGpuNumAtPriority[p]
}

func (c *GenericCell) IncreaseUsedGpuNumAtPriority(p CellPriority, delta int32) {
	c.usedGpuNumAtPriority[p] += delta
	if c.usedGpuNumAtPriority[p] == 0 {
		delete(c.usedGpuNumAtPriority, p)
	}
}

func (c *GenericCell) GetUsedGpuNumSamePriority() int32 {
	return c.usedGpuNumSamePriority
}

func (c *GenericCell) GetUsedGpuNumOtherPriority() int32 {
	return c.usedGpuNumOtherPriority
}

func (c *GenericCell) SetUsedGpuNumForPriority(p CellPriority) {
	c.usedGpuNumSamePriority = c.usedGpuNumAtPriority[p]
	c.usedGpuNumOtherPriority = 0
	c.freeGpuNumForPriority = c.totalGpuNum
	for priority, n := range c.usedGpuNumAtPriority {
		if priority != p {
			c.usedGpuNumOtherPriority += n
		}
		if priority >= p {
			c.freeGpuNumForPriority -= n
		}
	}
}

func (c *GenericCell) SetUsedGpuNumAllPriority(p CellPriority) {
	c.usedGpuNumSamePriority = c.totalGpuNum - c.freeGpuNum
	c.freeGpuNumForPriority = c.totalGpuNum
	for priority, n := range c.usedGpuNumAtPriority {
		if priority >= p {
			c.freeGpuNumForPriority -= n
		}
	}
}

// PhysicalCell defines a cell in the physical cluster.
type PhysicalCell struct {
	GenericCell
	nodes       []string     // node names inside the cell
	gpuIndices  []int32      // [-1] for cells at levels higher than node
	pods        []*core.Pod  // pods running in this cell or its children
	virtualCell *VirtualCell // points to the bound virtual cell
	tmpVirtualCell *VirtualCell // points to the temporarily bound virtual cell (before the binding is confirmed)
	split bool
	reserved    bool         // true when this is a reserved cell
}

func NewPhysicalCell(c CellChain, l CellLevel, g bool, n int32) *PhysicalCell {
	return &PhysicalCell{
		GenericCell: GenericCell{
			chain:              c,
			level:              l,
			priority:           freePriority,
			atOrHigherThanNode: g,
			totalGpuNum:n,
			freeGpuNum:n,
			usedGpuNumAtPriority: map[CellPriority]int32{},
		},
		pods: []*core.Pod{},
	}
}

func (c *PhysicalCell) GetName() string {
	return fmt.Sprintf("physical.%v.L%d.%v", c.chain, c.level, c.GetPhysicalPlacementString())
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

func (c *PhysicalCell) AddPod(pod *core.Pod) {
	c.pods = append(c.pods, pod)
}

func (c *PhysicalCell) DeletePod(pod *core.Pod) {
	idx := -1
	for i, p := range c.pods {
		if pod == p {
			idx = i
			break
		}
	}
	if idx == -1 {
		panic(fmt.Sprintf("Error when deleting pod %v: not exist in cell %v!", internal.Key(pod), c.GetName()))
	} else {
		c.pods = append(c.pods[:idx], c.pods[idx+1:]...)
	}
}

func (c *PhysicalCell) HasPod() bool {
	return len(c.pods) != 0
}

func (c *PhysicalCell) GetPods() []*core.Pod {
	return c.pods
}

func (c *PhysicalCell) GetVirtualCell() *VirtualCell {
	return c.virtualCell
}

func (c *PhysicalCell) SetVirtualCell(vc *VirtualCell) {
	c.virtualCell = vc
}

func (c *PhysicalCell) GetTmpVirtualCell() *VirtualCell {
	return c.tmpVirtualCell
}

func (c *PhysicalCell) SetTmpVirtualCell(vc *VirtualCell) {
	c.tmpVirtualCell = vc
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

// VirtualCell defines a cell in a VC.
type VirtualCell struct {
	GenericCell
	vc              api.VirtualClusterName // name of its VC
	rid             api.ReservationId      // reservation ID
	indexInChain    int32                  // index of the cell in the ChainCellList it belongs to (assigned in initialization)
	preAssignedCell *VirtualCell           // top level cell of this cell chain
	physicalCell    *PhysicalCell          // points to the bound physical cell
	tmpPhysicalCell *PhysicalCell // points to the temporarily bound physical cell (before the binding is confirmed)
}

func NewVirtualCell(vc api.VirtualClusterName,
	c CellChain,
	l CellLevel,
	g bool,
	n int32,
	i int32,
	pac *VirtualCell) *VirtualCell {

	return &VirtualCell{
		GenericCell: GenericCell{
			chain:              c,
			level:              l,
			priority:           freePriority,
			atOrHigherThanNode: g,
			totalGpuNum:n,
			usedGpuNumAtPriority: map[CellPriority]int32{},
		},
		vc:              vc,
		indexInChain:    i,
		preAssignedCell: pac,
	}
}

func (c *VirtualCell) GetName() string {
	str := string(c.chain)
	if c.rid != "" {
		str = string(c.rid)
	}
	return fmt.Sprintf("virtual-%v-%v.L%d.%d", c.vc, str, c.level, c.indexInChain)
}

func (c *VirtualCell) SetReservation(rid api.ReservationId) {
	c.rid = rid
}

func (c *VirtualCell) GetIndex() int32 {
	return c.indexInChain
}

func (c *VirtualCell) SetIndex(i int32) {
	c.indexInChain = i
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
}

func (c *VirtualCell) GetTmpPhysicalCell() *PhysicalCell {
	return c.tmpPhysicalCell
}

func (c *VirtualCell) SetTmpPhysicalCell(pc *PhysicalCell) {
	c.tmpPhysicalCell = pc
}
