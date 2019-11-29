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

package internal

import (
	"fmt"
	si "github.com/microsoft/hivedscheduler/pkg/api"
	core "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/types"
	ei "k8s.io/kubernetes/pkg/scheduler/api"
)

///////////////////////////////////////////////////////////////////////////////////////
// Internal Common Types
///////////////////////////////////////////////////////////////////////////////////////

// WebServer Callbacks with K8S Default Scheduler
// Notes:
// 1. Error should be delivered by panic
// 2. Should not assume previous succeeded operation also has been successfully
//    executed by K8S Default Scheduler.
type ExtenderHandlers struct {
	FilterHandler  func(args ei.ExtenderArgs) *ei.ExtenderFilterResult
	BindHandler    func(args ei.ExtenderBindingArgs) *ei.ExtenderBindingResult
	PreemptHandler func(args ei.ExtenderPreemptionArgs) *ei.ExtenderPreemptionResult
}

type InspectHandlers struct {
	GetAffinityGroupsHandler func() si.AffinityGroupList
	GetAffinityGroupHandler  func(name string) si.AffinityGroup
}

// SchedulerAlgorithm is used to make the pod schedule decision based on its whole
// cluster scheduling view constructed from its Add/Update/Delete callbacks.
// Notes:
// 1. Error should be delivered by panic and it will not change any state.
//    For WebServer Callbacks, all Panics will be recovered as error responses,
//    see HandleInformerPanic.
//    For Informer Callbacks, only User Error Panics will be recovered as error
//    logs, other Panics will crash the whole process, see HandleWebServerPanic.
// 2. Should take all the input parameters as readonly and return pod schedule
//    decision by PodScheduleResult.
// 3. {Schedule, AddAllocatedPod, DeleteAllocatedPod} will never be executed
//    concurrently for all pods.
// 4. [Schedule -> (AddAllocatedPod) -> Schedule -> ...] is executed sequentially
//    for all pods.
//    I.e. the constructed scheduling view is already lock protected.
// 5. [START -> AddAllocatedPod -> DeleteAllocatedPod -> END] is executed
//    sequentially for one specific Pod.
//    I.e. once a specific Pod is allocated by AddAllocatedPod, its placement
//    will never be changed to another one.
type SchedulerAlgorithm interface {
	// See details in PodScheduleResult.
	Schedule(pod *core.Pod, suggestedNodes []string) PodScheduleResult

	// Track all current Nodes in the whole cluster.
	AddNode(node *core.Node)
	UpdateNode(oldNode, newNode *core.Node)
	DeleteNode(node *core.Node)

	// Track all current allocated Pods in the whole cluster.
	// Allocated Pod includes both PodBound and PodBinding Pods.
	AddAllocatedPod(pod *core.Pod)
	DeleteAllocatedPod(pod *core.Pod)

	// Expose current scheduling status
	GetAffinityGroups() si.AffinityGroupList
	GetAffinityGroup(name string) si.AffinityGroup
}

// Notes:
// 1. If the SchedulerAlgorithm found sufficient free resource, only PodBindInfo
//    should be set.
//    If the SchedulerAlgorithm found sufficient preemptable resource, only
//    PodPreemptInfo should be set.
//    Otherwise, only PodWaitInfo can be optionally set.
// 2. The selected node in PodBindInfo requires:
//    1. Must be within candidateNodes:
//       All existing nodes which can be constructed from AddNode/DeleteNode.
//       Otherwise, the Pod after bound will be probably deleted by the
//       GarbageCollectionController.
//    2. Better to be within suggestedNodes:
//       The input parameter of Schedule().
//       Otherwise, the Pod after bound will not respect previous pod schedule
//       decision from K8S Default Scheduler, i.e. this binding is incompatible
//       with K8S Default Scheduler.
type PodScheduleResult struct {
	PodWaitInfo    *PodWaitInfo
	PodPreemptInfo *PodPreemptInfo
	PodBindInfo    *si.PodBindInfo
}

// PodUID -> PodScheduleStatus
type PodScheduleStatuses map[types.UID]*PodScheduleStatus

// Used to track the PodScheduleResult
type PodScheduleStatus struct {
	// The Pod which will be used in current PodState.
	// For example, in PodBinding state, it should be a Pod used to bind,
	// i.e. with all placements set in the Pod.
	Pod      *core.Pod
	PodState PodState
	// The already tried Pod binding attempts, i.e. the scheduled times for a Pod
	// in PodBinding state.
	PodBindAttempts   int32
	PodScheduleResult *PodScheduleResult
}

type PodState string

// [VirtualState]: This state is not tracked in PodScheduleStatuses.
//
// Pod is unknown for the scheduler, such as the Pod does not exist, completed
// or has not been informed to the scheduler.
//
// A completed Pod is the same as a deleted Pod from the scheduler view and they
// will never be informed to the scheduler, thus they are rejected to be scheduled.
// However, the not yet informed not completed Pod will be eventually informed to
// the scheduler, then transition to not VirtualState, thus they are accepted
// to be scheduled.
//
// This state can be transitioned from any state, but can only transition to:
// -> PodWaiting
// -> PodBound
const PodUnknown PodState = "Unknown"

// [AllocatedState]: The Pod is considered to be allocated from the scheduler view.
const (
	// Pod is waiting for preemptable or free resource to appear.
	// [StartState]
	// -> PodPreempting
	// -> PodBinding
	PodWaiting PodState = "Waiting"

	// Pod is waiting for the appeared preemptable resource to be free by preemption.
	// -> PodBinding
	// -> PodWaiting
	PodPreempting PodState = "Preempting"

	// Pod is binding on the free resource.
	// [AllocatedState]
	// -> PodBound
	PodBinding PodState = "Binding"

	// Pod is bound on the free resource.
	// [FinalState]
	// [AllocatedState]
	PodBound PodState = "Bound"
)

func IsAllocated(state PodState) bool {
	return state == PodBinding || state == PodBound
}

// No need to use it recover scheduler waiting resource
type PodWaitInfo struct {
	// The reason why no preemptable or free resource to allocate the Pod now.
	Reason string
}

// No need to use it recover scheduler preempting resource
type PodPreemptInfo struct {
	// Only need to include the victim Pods for the current preemptor Pod.
	// Need to ensure the newly deleted victim Pods are eventually removed from here,
	// otherwise, the default scheduler refuse to execute any preemption.
	// Need to ensure the newly added victim Pods are eventually added to here,
	// otherwise, the preemption will never complete.
	// It can be empty, such as current preemptor Pod is waiting for the victim Pods
	// of other preemptor Pods in the same group to be preempted.
	// It can contain victim Pods across multiple nodes, such as a victim group may
	// contain Pods across multiple nodes.
	VictimPods []*core.Pod
}

type PodKey struct {
	Namespace string
	Name      string
	UID       types.UID
}

func NewPodKey(namespace string, name string, uid types.UID) *PodKey {
	return &PodKey{
		Namespace: namespace,
		Name:      name,
		UID:       uid,
	}
}

func (pk *PodKey) String() string {
	return fmt.Sprintf("%v(%v/%v)", pk.UID, pk.Namespace, pk.Name)
}
