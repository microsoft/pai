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

// intraVCScheduler is an interface for allocating cells inside a VC.
// It stores two maps of ChainCellList, one for reserved cells, the other
// for non-reserved ones. It should be able to return a virtual cell
// on receiving a cell request.
type intraVCScheduler interface {
	getNonReservedCellList() map[CellChain]ChainCellList
	getReservedCellList() map[api.ReservationId]ChainCellList

	// Cell allocation inside a VC. We use buddy alloc for default
	// (see defaultIntraVCScheduler).
	allocateCell(CellRequest) *VirtualCell
}

type defaultIntraVCScheduler struct {
	virtualNonReservedCellList map[CellChain]ChainCellList
	virtualReservedCellList    map[api.ReservationId]ChainCellList
}

func (s *defaultIntraVCScheduler) getNonReservedCellList() map[CellChain]ChainCellList {
	return s.virtualNonReservedCellList
}

func (s *defaultIntraVCScheduler) getReservedCellList() map[api.ReservationId]ChainCellList {
	return s.virtualReservedCellList
}

func (s *defaultIntraVCScheduler) allocateCell(cr CellRequest) *VirtualCell {
	var fullCellList ChainCellList
	if cr.ReservationId != "" {
		fullCellList = s.virtualReservedCellList[cr.ReservationId]
	} else {
		fullCellList = s.virtualNonReservedCellList[cr.Chain]
	}

	vcCellView := getCellViewWithPriority(fullCellList, cr.Priority)
	c := buddyAlloc(vcCellView, cr.Level)
	if c != nil {
		return c.(*VirtualCell) // downgrade pod running on c
	} else {
		var str string
		if cr.ReservationId != "" {
			str = fmt.Sprintf("reservation %v", cr.ReservationId)
		} else {
			str = fmt.Sprintf("chain %v", cr.Chain)
		}
		klog.Infof("Insufficient quota in VC %v for cell request: %v, level %v, priority %v",
			cr.VC, str, cr.Level, cr.Priority)
		return nil
	}
}
