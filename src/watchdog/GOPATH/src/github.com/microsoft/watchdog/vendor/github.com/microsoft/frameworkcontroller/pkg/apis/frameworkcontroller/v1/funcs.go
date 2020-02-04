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

package v1

import (
	"fmt"
	"github.com/microsoft/frameworkcontroller/pkg/common"
	core "k8s.io/api/core/v1"
	meta "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	"k8s.io/klog"
	"strconv"
	"strings"
)

///////////////////////////////////////////////////////////////////////////////////////
// Utils
///////////////////////////////////////////////////////////////////////////////////////
func GetConfigMapName(frameworkName string) string {
	return strings.Join([]string{frameworkName, "attempt"}, "-")
}

func SplitConfigMapName(configMapName string) (frameworkName string) {
	parts := strings.Split(configMapName, "-")
	return parts[0]
}

func GetPodName(frameworkName string, taskRoleName string, taskIndex int32) string {
	return strings.Join([]string{frameworkName, taskRoleName, fmt.Sprint(taskIndex)}, "-")
}

func SplitPodName(podName string) (frameworkName string, taskRoleName string, taskIndex int32) {
	parts := strings.Split(podName, "-")
	i, err := strconv.ParseInt(parts[2], 10, 32)
	if err != nil {
		panic(fmt.Errorf("Failed to SplitPodName %v: %v", podName, err))
	}
	return parts[0], parts[1], int32(i)
}

func GetFrameworkAttemptInstanceUID(frameworkAttemptID int32, configMapUID *types.UID) *types.UID {
	return common.PtrUIDStr(fmt.Sprintf("%v_%v", frameworkAttemptID, *configMapUID))
}

func SplitFrameworkAttemptInstanceUID(frameworkAttemptInstanceUID *types.UID) (
	frameworkAttemptID int32, configMapUID *types.UID) {
	parts := strings.Split(string(*frameworkAttemptInstanceUID), "_")
	i, err := strconv.ParseInt(parts[0], 10, 32)
	if err != nil {
		panic(fmt.Errorf(
			"Failed to SplitFrameworkAttemptInstanceUID %v: %v",
			*frameworkAttemptInstanceUID, err))
	}
	return int32(i), common.PtrUIDStr(parts[1])
}

func GetTaskAttemptInstanceUID(taskAttemptID int32, podUID *types.UID) *types.UID {
	return common.PtrUIDStr(fmt.Sprintf("%v_%v", taskAttemptID, *podUID))
}

func SplitTaskAttemptInstanceUID(taskAttemptInstanceUID *types.UID) (
	taskAttemptID int32, podUID *types.UID) {
	parts := strings.Split(string(*taskAttemptInstanceUID), "_")
	i, err := strconv.ParseInt(parts[0], 10, 32)
	if err != nil {
		panic(fmt.Errorf(
			"Failed to SplitTaskAttemptInstanceUID %v: %v",
			*taskAttemptInstanceUID, err))
	}
	return int32(i), common.PtrUIDStr(parts[1])
}

func getObjectSnapshotLogTail(obj interface{}) string {
	return ": ObjectSnapshot: " + common.ToJson(obj)
}

func GetFrameworkSnapshotLogTail(f *Framework) string {
	if f.GroupVersionKind().Empty() {
		f = f.DeepCopy()
		f.SetGroupVersionKind(FrameworkGroupVersionKind)
	}
	return getObjectSnapshotLogTail(f)
}

func GetPodSnapshotLogTail(pod *core.Pod) string {
	if pod.GroupVersionKind().Empty() {
		pod = pod.DeepCopy()
		pod.SetGroupVersionKind(PodGroupVersionKind)
	}
	return getObjectSnapshotLogTail(pod)
}

func GetAllContainerStatuses(pod *core.Pod) []core.ContainerStatus {
	// All Container names in a Pod must be different, so we can still identify
	// a Container even after the InitContainers is merged with the AppContainers.
	return append(append([]core.ContainerStatus{},
		pod.Status.InitContainerStatuses...),
		pod.Status.ContainerStatuses...)
}

///////////////////////////////////////////////////////////////////////////////////////
// Interfaces
///////////////////////////////////////////////////////////////////////////////////////
type TaskStatusSelector func(*TaskStatus) bool

///////////////////////////////////////////////////////////////////////////////////////
// Spec Read Methods
///////////////////////////////////////////////////////////////////////////////////////
func (f *Framework) Key() string {
	return f.Namespace + "/" + f.Name
}

func (f *Framework) TaskRoleSpec(taskRoleName string) *TaskRoleSpec {
	for _, taskRole := range f.Spec.TaskRoles {
		if taskRole.Name == taskRoleName {
			return taskRole
		}
	}
	panic(fmt.Errorf("[%v]: TaskRole is not found in Spec", taskRoleName))
}

///////////////////////////////////////////////////////////////////////////////////////
// Status Read Methods
///////////////////////////////////////////////////////////////////////////////////////
func (f *Framework) FrameworkAttemptID() int32 {
	return f.Status.AttemptStatus.ID
}

func (ts *TaskStatus) TaskAttemptID() int32 {
	return ts.AttemptStatus.ID
}

func (f *Framework) FrameworkAttemptInstanceUID() *types.UID {
	return f.Status.AttemptStatus.InstanceUID
}

func (ts *TaskStatus) TaskAttemptInstanceUID() *types.UID {
	return ts.AttemptStatus.InstanceUID
}

func (f *Framework) ConfigMapName() string {
	return f.Status.AttemptStatus.ConfigMapName
}

func (ts *TaskStatus) PodName() string {
	return ts.AttemptStatus.PodName
}

func (f *Framework) ConfigMapUID() *types.UID {
	return f.Status.AttemptStatus.ConfigMapUID
}

func (ts *TaskStatus) PodUID() *types.UID {
	return ts.AttemptStatus.PodUID
}

func (f *Framework) CompletionType() CompletionType {
	return f.Status.AttemptStatus.CompletionStatus.Type
}

func (ts *TaskStatus) CompletionType() CompletionType {
	return ts.AttemptStatus.CompletionStatus.Type
}

func (f *Framework) TaskRoleStatuses() []*TaskRoleStatus {
	return f.Status.AttemptStatus.TaskRoleStatuses
}

func (f *Framework) TaskRoleStatus(taskRoleName string) *TaskRoleStatus {
	for _, taskRoleStatus := range f.TaskRoleStatuses() {
		if taskRoleStatus.Name == taskRoleName {
			return taskRoleStatus
		}
	}
	panic(fmt.Errorf("[%v]: TaskRole is not found in Status", taskRoleName))
}

func (f *Framework) TaskStatus(taskRoleName string, taskIndex int32) *TaskStatus {
	taskRoleStatus := f.TaskRoleStatus(taskRoleName)
	if 0 <= taskIndex && taskIndex < int32(len(taskRoleStatus.TaskStatuses)) {
		return taskRoleStatus.TaskStatuses[taskIndex]
	}
	panic(fmt.Errorf("[%v][%v]: Task is not found in Status", taskRoleName, taskIndex))
}

func (f *Framework) IsCompleted() bool {
	return f.Status.State == FrameworkCompleted
}

func (ts *TaskStatus) IsCompleted() bool {
	return ts.State == TaskCompleted
}

func (f *Framework) IsRunning() bool {
	return f.Status.State == FrameworkAttemptRunning
}

func (ts *TaskStatus) IsRunning() bool {
	return ts.State == TaskAttemptRunning
}

func (f *Framework) IsCompleting() bool {
	return f.Status.State == FrameworkAttemptDeletionPending ||
		f.Status.State == FrameworkAttemptDeletionRequested ||
		f.Status.State == FrameworkAttemptDeleting
}

func (ts *TaskStatus) IsCompleting() bool {
	return ts.State == TaskAttemptDeletionPending ||
		ts.State == TaskAttemptDeletionRequested ||
		ts.State == TaskAttemptDeleting
}

func (f *Framework) IsSucceeded() bool {
	return f.IsCompleted() && f.CompletionType().IsSucceeded()
}

func (ts *TaskStatus) IsSucceeded() bool {
	return ts.IsCompleted() && ts.CompletionType().IsSucceeded()
}

func (f *Framework) IsFailed() bool {
	return f.IsCompleted() && f.CompletionType().IsFailed()
}

func (ts *TaskStatus) IsFailed() bool {
	return ts.IsCompleted() && ts.CompletionType().IsFailed()
}

func (trs *TaskRoleStatus) GetTaskStatuses(selector TaskStatusSelector) []*TaskStatus {
	if selector == nil {
		return trs.TaskStatuses
	}

	taskStatuses := []*TaskStatus{}
	for _, taskStatus := range trs.TaskStatuses {
		if selector(taskStatus) {
			taskStatuses = append(taskStatuses, taskStatus)
		}
	}
	return taskStatuses
}

func (trs *TaskRoleStatus) GetTaskCount(selector TaskStatusSelector) int32 {
	return int32(len(trs.GetTaskStatuses(selector)))
}

func (f *Framework) GetTaskCount(selector TaskStatusSelector) int32 {
	taskCount := int32(0)
	for _, taskRoleStatus := range f.TaskRoleStatuses() {
		taskCount += taskRoleStatus.GetTaskCount(selector)
	}
	return taskCount
}

func (f *Framework) AreAllTasksCompleted() bool {
	return f.GetTaskCount((*TaskStatus).IsCompleted) == f.GetTaskCount(nil)
}

func (f *Framework) IsAnyTaskRunning() bool {
	return f.GetTaskCount((*TaskStatus).IsRunning) > 0
}

func (f *Framework) NewConfigMap() *core.ConfigMap {
	frameworkAttemptIDStr := fmt.Sprint(f.FrameworkAttemptID())

	cm := &core.ConfigMap{
		ObjectMeta: meta.ObjectMeta{},
	}

	// Init ConfigMap
	cm.Name = f.ConfigMapName()
	cm.Namespace = f.Namespace
	cm.OwnerReferences = []meta.OwnerReference{*meta.NewControllerRef(f, FrameworkGroupVersionKind)}
	// By default, ensure there is no timeline overlap among different FrameworkAttemptInstances.
	cm.Finalizers = []string{meta.FinalizerDeleteDependents}

	cm.Annotations = map[string]string{}
	cm.Annotations[AnnotationKeyFrameworkNamespace] = f.Namespace
	cm.Annotations[AnnotationKeyFrameworkName] = f.Name
	cm.Annotations[AnnotationKeyConfigMapName] = cm.Name
	cm.Annotations[AnnotationKeyFrameworkAttemptID] = frameworkAttemptIDStr

	cm.Labels = map[string]string{}
	cm.Labels[LabelKeyFrameworkName] = f.Name

	return cm
}

func (f *Framework) NewPod(cm *core.ConfigMap, taskRoleName string, taskIndex int32) *core.Pod {
	// Deep copy Task.Pod before modify it
	taskPodJson := common.ToJson(f.TaskRoleSpec(taskRoleName).Task.Pod)
	taskStatus := f.TaskStatus(taskRoleName, taskIndex)
	taskIndexStr := fmt.Sprint(taskIndex)
	frameworkAttemptIDStr := fmt.Sprint(f.FrameworkAttemptID())
	frameworkAttemptInstanceUIDStr := string(*f.FrameworkAttemptInstanceUID())
	configMapUIDStr := string(*f.ConfigMapUID())
	taskAttemptIDStr := fmt.Sprint(taskStatus.TaskAttemptID())
	taskAttemptInstanceUIDReferStr := string(*GetTaskAttemptInstanceUID(
		taskStatus.TaskAttemptID(),
		common.PtrUIDStr(common.ReferEnvVar(EnvNamePodUID))))

	// Replace Placeholders in Task.Pod
	podTemplate := core.PodTemplateSpec{}

	placeholderReplacer := strings.NewReplacer(
		common.ReferPlaceholder(PlaceholderFrameworkNamespace), f.Namespace,
		common.ReferPlaceholder(PlaceholderFrameworkName), f.Name,
		common.ReferPlaceholder(PlaceholderTaskRoleName), taskRoleName,
		common.ReferPlaceholder(PlaceholderTaskIndex), taskIndexStr,
		common.ReferPlaceholder(PlaceholderConfigMapName), f.ConfigMapName(),
		common.ReferPlaceholder(PlaceholderPodName), taskStatus.PodName())

	// Using Json to avoid breaking one Placeholder to multiple lines
	common.FromJson(placeholderReplacer.Replace(taskPodJson), &podTemplate)

	// Override Task.Pod
	pod := &core.Pod{
		ObjectMeta: podTemplate.ObjectMeta,
		Spec:       podTemplate.Spec,
	}

	pod.Name = taskStatus.PodName()
	pod.Namespace = f.Namespace

	// Augment Task.Pod
	// By setting the owner is also a controller, the Pod functions normally, except for
	// its detail cannot be viewed from k8s dashboard, and the dashboard shows error:
	// "Unknown reference kind ConfigMap".
	// See https://github.com/kubernetes/dashboard/issues/3158
	if pod.OwnerReferences == nil {
		pod.OwnerReferences = []meta.OwnerReference{}
	}
	pod.OwnerReferences = append(pod.OwnerReferences, *meta.NewControllerRef(cm, ConfigMapGroupVersionKind))

	if pod.Annotations == nil {
		pod.Annotations = map[string]string{}
	}
	pod.Annotations[AnnotationKeyFrameworkNamespace] = f.Namespace
	pod.Annotations[AnnotationKeyFrameworkName] = f.Name
	pod.Annotations[AnnotationKeyTaskRoleName] = taskRoleName
	pod.Annotations[AnnotationKeyTaskIndex] = taskIndexStr
	pod.Annotations[AnnotationKeyConfigMapName] = f.ConfigMapName()
	pod.Annotations[AnnotationKeyPodName] = pod.Name
	pod.Annotations[AnnotationKeyFrameworkAttemptID] = frameworkAttemptIDStr
	pod.Annotations[AnnotationKeyFrameworkAttemptInstanceUID] = frameworkAttemptInstanceUIDStr
	pod.Annotations[AnnotationKeyConfigMapUID] = configMapUIDStr
	pod.Annotations[AnnotationKeyTaskAttemptID] = taskAttemptIDStr

	if pod.Labels == nil {
		pod.Labels = map[string]string{}
	}
	pod.Labels[LabelKeyFrameworkName] = f.Name
	pod.Labels[LabelKeyTaskRoleName] = taskRoleName

	predefinedEnvs := []core.EnvVar{
		{Name: EnvNameFrameworkNamespace, Value: f.Namespace},
		{Name: EnvNameFrameworkName, Value: f.Name},
		{Name: EnvNameTaskRoleName, Value: taskRoleName},
		{Name: EnvNameTaskIndex, Value: taskIndexStr},
		{Name: EnvNameConfigMapName, Value: f.ConfigMapName()},
		{Name: EnvNamePodName, Value: pod.Name},
		{Name: EnvNameFrameworkAttemptID, Value: frameworkAttemptIDStr},
		{Name: EnvNameFrameworkAttemptInstanceUID, Value: frameworkAttemptInstanceUIDStr},
		{Name: EnvNameConfigMapUID, Value: configMapUIDStr},
		{Name: EnvNameTaskAttemptID, Value: taskAttemptIDStr},
		{Name: EnvNamePodUID, ValueFrom: ObjectUIDEnvVarSource},
		{Name: EnvNameTaskAttemptInstanceUID, Value: taskAttemptInstanceUIDReferStr},
	}

	// Prepend predefinedEnvs so that they can be referred by the environment variable
	// specified in the spec.
	// Change the default TerminationMessagePolicy to TerminationMessageFallbackToLogsOnError
	// in case the cluster-level logging has not been setup for the cluster.
	// See https://kubernetes.io/docs/concepts/cluster-administration/logging
	// It is safe to do so, since it will only fall back to the tail log if the container
	// is failed and the termination message file specified by the terminationMessagePath
	// is not found or empty.
	for i := range pod.Spec.Containers {
		pod.Spec.Containers[i].Env = append(append([]core.EnvVar{},
			predefinedEnvs...), pod.Spec.Containers[i].Env...)
		if len(pod.Spec.Containers[i].TerminationMessagePolicy) == 0 {
			pod.Spec.Containers[i].TerminationMessagePolicy = core.TerminationMessageFallbackToLogsOnError
		}
	}
	for i := range pod.Spec.InitContainers {
		pod.Spec.InitContainers[i].Env = append(append([]core.EnvVar{},
			predefinedEnvs...), pod.Spec.InitContainers[i].Env...)
		if len(pod.Spec.InitContainers[i].TerminationMessagePolicy) == 0 {
			pod.Spec.InitContainers[i].TerminationMessagePolicy = core.TerminationMessageFallbackToLogsOnError
		}
	}

	return pod
}

func (f *Framework) NewFrameworkStatus() *FrameworkStatus {
	return &FrameworkStatus{
		StartTime:      meta.Now(),
		CompletionTime: nil,
		State:          FrameworkAttemptCreationPending,
		TransitionTime: meta.Now(),
		RetryPolicyStatus: RetryPolicyStatus{
			TotalRetriedCount:       0,
			AccountableRetriedCount: 0,
			RetryDelaySec:           nil,
		},
		AttemptStatus: f.NewFrameworkAttemptStatus(0),
	}
}

func (f *Framework) NewFrameworkAttemptStatus(
	frameworkAttemptID int32) FrameworkAttemptStatus {
	return FrameworkAttemptStatus{
		ID:                         frameworkAttemptID,
		StartTime:                  meta.Now(),
		RunTime:                    nil,
		CompletionTime:             nil,
		InstanceUID:                nil,
		ConfigMapName:              GetConfigMapName(f.Name),
		ConfigMapUID:               nil,
		CompletionStatus:           nil,
		TaskRoleStatuses:           f.NewTaskRoleStatuses(),
		TaskRoleStatusesCompressed: nil,
	}
}

func (f *Framework) NewTaskRoleStatuses() []*TaskRoleStatus {
	trss := []*TaskRoleStatus{}
	for _, taskRole := range f.Spec.TaskRoles {
		trs := TaskRoleStatus{Name: taskRole.Name, TaskStatuses: []*TaskStatus{}}
		for taskIndex := int32(0); taskIndex < taskRole.TaskNumber; taskIndex++ {
			trs.TaskStatuses = append(trs.TaskStatuses, f.NewTaskStatus(taskRole.Name, taskIndex))
		}
		trss = append(trss, &trs)
	}
	return trss
}

func (f *Framework) NewTaskStatus(taskRoleName string, taskIndex int32) *TaskStatus {
	return &TaskStatus{
		Index:          taskIndex,
		StartTime:      meta.Now(),
		CompletionTime: nil,
		State:          TaskAttemptCreationPending,
		TransitionTime: meta.Now(),
		RetryPolicyStatus: RetryPolicyStatus{
			TotalRetriedCount:       0,
			AccountableRetriedCount: 0,
			RetryDelaySec:           nil,
		},
		AttemptStatus: f.NewTaskAttemptStatus(taskRoleName, taskIndex, 0),
	}
}

func (f *Framework) NewTaskAttemptStatus(
	taskRoleName string, taskIndex int32, taskAttemptID int32) TaskAttemptStatus {
	return TaskAttemptStatus{
		ID:               taskAttemptID,
		StartTime:        meta.Now(),
		RunTime:          nil,
		CompletionTime:   nil,
		InstanceUID:      nil,
		PodName:          GetPodName(f.Name, taskRoleName, taskIndex),
		PodUID:           nil,
		PodNodeName:      nil,
		PodIP:            nil,
		PodHostIP:        nil,
		CompletionStatus: nil,
	}
}

type RetryDecision struct {
	ShouldRetry bool
	// Whether the retry should be counted into AccountableRetriedCount
	IsAccountable bool
	// The retry should be executed after DelaySec.
	DelaySec int64
	Reason   string
}

func (rd RetryDecision) String() string {
	return fmt.Sprintf(
		"[ShouldRetry: %v, IsAccountable: %v, DelaySec: %v, Reason: %v]",
		rd.ShouldRetry, rd.IsAccountable, rd.DelaySec, rd.Reason)
}

func (rp RetryPolicySpec) ShouldRetry(
	rps RetryPolicyStatus,
	cs *CompletionStatus,
	minDelaySecForTransientConflictFailed int64,
	maxDelaySecForTransientConflictFailed int64) RetryDecision {
	ct := cs.Type

	// 0. Built-in Always-on RetryPolicy
	if cs.Code == CompletionCodePodSpecInvalid ||
		cs.Code == CompletionCodeStopFrameworkRequested ||
		cs.Code == CompletionCodeFrameworkAttemptCompletion {
		return RetryDecision{false, true, 0, fmt.Sprintf(
			"CompletionCode is %v, %v", cs.Code, cs.Phrase)}
	}

	// 1. FancyRetryPolicy
	if rp.FancyRetryPolicy {
		reason := fmt.Sprintf(
			"FancyRetryPolicy is %v and CompletionType is %v",
			rp.FancyRetryPolicy, ct)
		if ct.IsFailed() {
			if ct.ContainsAttribute(CompletionTypeAttributeTransient) {
				if ct.ContainsAttribute(CompletionTypeAttributeConflict) {
					return RetryDecision{true, false,
						common.RandInt64(
							minDelaySecForTransientConflictFailed,
							maxDelaySecForTransientConflictFailed),
						reason}
				} else {
					return RetryDecision{true, false, 0, reason}
				}
			} else if ct.ContainsAttribute(CompletionTypeAttributePermanent) {
				return RetryDecision{false, true, 0, reason}
			}
		}
	}

	// 2. NormalRetryPolicy
	if (rp.MaxRetryCount == ExtendedUnlimitedValue) ||
		(ct.IsFailed() && rp.MaxRetryCount == UnlimitedValue) ||
		(ct.IsFailed() && rps.AccountableRetriedCount < rp.MaxRetryCount) {
		return RetryDecision{true, true, 0, fmt.Sprintf(
			"AccountableRetriedCount %v has not reached MaxRetryCount %v",
			rps.AccountableRetriedCount, rp.MaxRetryCount)}
	} else {
		if ct.IsSucceeded() {
			return RetryDecision{false, true, 0, fmt.Sprintf(
				"CompletionType is %v", ct)}
		} else {
			return RetryDecision{false, true, 0, fmt.Sprintf(
				"AccountableRetriedCount %v has reached MaxRetryCount %v",
				rps.AccountableRetriedCount, rp.MaxRetryCount)}
		}
	}
}

///////////////////////////////////////////////////////////////////////////////////////
// Status Write Methods
///////////////////////////////////////////////////////////////////////////////////////
// This is the only interface to modify FrameworkState
func (f *Framework) TransitionFrameworkState(dstState FrameworkState) {
	srcState := f.Status.State
	if srcState == dstState {
		return
	}

	now := common.PtrNow()
	if dstState == FrameworkAttemptRunning {
		f.Status.AttemptStatus.RunTime = now
	}
	if dstState == FrameworkAttemptCompleted {
		f.Status.AttemptStatus.CompletionTime = now
	}
	if dstState == FrameworkCompleted {
		f.Status.CompletionTime = now
	}

	f.Status.State = dstState
	f.Status.TransitionTime = *now

	klog.Infof(
		"[%v]: Transitioned Framework from [%v] to [%v]",
		f.Key(), srcState, dstState)
}

// This is the only interface to modify TaskState
func (f *Framework) TransitionTaskState(
	taskRoleName string, taskIndex int32, dstState TaskState) {
	taskStatus := f.TaskStatus(taskRoleName, taskIndex)
	srcState := taskStatus.State
	if srcState == dstState {
		return
	}

	now := common.PtrNow()
	if dstState == TaskAttemptRunning {
		taskStatus.AttemptStatus.RunTime = now
	}
	if dstState == TaskAttemptCompleted {
		taskStatus.AttemptStatus.CompletionTime = now
	}
	if dstState == TaskCompleted {
		taskStatus.CompletionTime = now
	}

	taskStatus.State = dstState
	taskStatus.TransitionTime = *now

	klog.Infof(
		"[%v][%v][%v]: Transitioned Task from [%v] to [%v]",
		f.Key(), taskRoleName, taskIndex, srcState, dstState)
}

func (f *Framework) Compress() error {
	if f.Status == nil {
		return nil
	}

	if f.TaskRoleStatuses() != nil {
		f.Status.AttemptStatus.TaskRoleStatusesCompressed = nil

		jsonTaskRoleStatus := common.ToJson(f.TaskRoleStatuses())
		if len(jsonTaskRoleStatus) >= LargeFrameworkCompressionMinBytes {
			compressedTaskRoleStatus, err := common.Compress(jsonTaskRoleStatus)
			if err != nil {
				return err
			}

			f.Status.AttemptStatus.TaskRoleStatusesCompressed = compressedTaskRoleStatus
			f.Status.AttemptStatus.TaskRoleStatuses = nil
			return nil
		}
	}

	return nil
}

func (f *Framework) Decompress() error {
	if f.Status == nil {
		return nil
	}

	if f.TaskRoleStatuses() != nil {
		f.Status.AttemptStatus.TaskRoleStatusesCompressed = nil
		return nil
	}

	compressedTaskRoleStatus := f.Status.AttemptStatus.TaskRoleStatusesCompressed
	if compressedTaskRoleStatus != nil {
		jsonTaskRoleStatus, err := common.Decompress(compressedTaskRoleStatus)
		if err != nil {
			return err
		}

		rawTaskRoleStatus := []*TaskRoleStatus{}
		common.FromJson(jsonTaskRoleStatus, &rawTaskRoleStatus)

		f.Status.AttemptStatus.TaskRoleStatuses = rawTaskRoleStatus
		f.Status.AttemptStatus.TaskRoleStatusesCompressed = nil
		return nil
	}

	return nil
}
