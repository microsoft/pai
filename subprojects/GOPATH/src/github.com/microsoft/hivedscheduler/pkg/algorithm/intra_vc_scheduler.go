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

// intraVCScheduler is an interface for scheduling pods inside a VC.
// It stores two maps of ChainCellList, one for reserved cells, the other for non-reserved ones.
// It should be able to return a set of GPU placements in the VC for a scheduling request.
type intraVCScheduler interface {
	getNonReservedCellList() map[CellChain]ChainCellList
	getReservedCellList() map[api.ReservationId]ChainCellList

	// Scheduling a series of pods inside a VC. We use topologyAwareScheduler by default.
	schedule(schedulingRequest) map[int32][]CellList
}

type defaultIntraVCScheduler struct {
	virtualNonReservedCellList map[CellChain]ChainCellList
	virtualReservedCellList    map[api.ReservationId]ChainCellList
	schedulersNonReserved      map[CellChain]*topologyAwareScheduler
	schedulersReserved         map[api.ReservationId]*topologyAwareScheduler
}

func newDefaultIntraVCScheduler(
	nonReservedVcl map[CellChain]ChainCellList,
	reservedVcl map[api.ReservationId]ChainCellList) *defaultIntraVCScheduler {

	snr := map[CellChain]*topologyAwareScheduler{}
	sr := map[api.ReservationId]*topologyAwareScheduler{}
	for chain, ccl := range nonReservedVcl {
		snr[chain] = newTopologyAwareScheduler(ccl, true)
	}
	for rid, ccl := range reservedVcl {
		sr[rid] = newTopologyAwareScheduler(ccl, true)
	}
	return &defaultIntraVCScheduler{
		virtualNonReservedCellList: nonReservedVcl,
		virtualReservedCellList:    reservedVcl,
		schedulersNonReserved:      snr,
		schedulersReserved:         sr,
	}
}

func (s *defaultIntraVCScheduler) getNonReservedCellList() map[CellChain]ChainCellList {
	return s.virtualNonReservedCellList
}

func (s *defaultIntraVCScheduler) getReservedCellList() map[api.ReservationId]ChainCellList {
	return s.virtualReservedCellList
}

func (s *defaultIntraVCScheduler) schedule(sr schedulingRequest) map[int32][]CellList {
	var scheduler *topologyAwareScheduler
	if sr.reservationId != "" {
		scheduler = s.schedulersReserved[sr.reservationId]
	} else {
		scheduler = s.schedulersNonReserved[sr.chain]
	}
	var result map[int32][]CellList
	if scheduler != nil {
		result = scheduler.schedule(sr.podGpuNumbers, sr.priority)
	}
	if scheduler == nil || result == nil {
		var str string
		if sr.reservationId != "" {
			str = fmt.Sprintf("reservation %v", sr.reservationId)
		} else {
			str = fmt.Sprintf("chain %v", sr.chain)
		}
		klog.Infof("Insufficient quota in VC %v for scheduling request: %v, GPU numbers %v, priority %v",
			sr.vc, str, sr.podGpuNumbers, sr.priority)
	}
	klog.Infof("%v", result)
	return result
}
