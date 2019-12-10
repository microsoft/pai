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
	"github.com/microsoft/hivedscheduler/pkg/common"
	core "k8s.io/api/core/v1"
	meta "k8s.io/apimachinery/pkg/apis/meta/v1"
	kubeClient "k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/cache"
	"k8s.io/klog"
	"net/http"
)

func CreateClient(kConfig *rest.Config) kubeClient.Interface {
	kClient, err := kubeClient.NewForConfig(kConfig)
	if err != nil {
		panic(fmt.Errorf("Failed to create KubeClient: %v", err))
	}

	return kClient
}

func GetKey(obj interface{}) (string, error) {
	return cache.DeletionHandlingMetaNamespaceKeyFunc(obj)
}

func SplitKey(key string) (namespace, name string, err error) {
	return cache.SplitMetaNamespaceKey(key)
}

// obj could be *core.Pod or cache.DeletedFinalStateUnknown.
func ToPod(obj interface{}) *core.Pod {
	pod, ok := obj.(*core.Pod)

	if !ok {
		deletedFinalStateUnknown, ok := obj.(cache.DeletedFinalStateUnknown)
		if !ok {
			klog.Errorf(
				"Failed to convert obj to Pod or DeletedFinalStateUnknown: %#v",
				obj)
			return nil
		}

		pod, ok = deletedFinalStateUnknown.Obj.(*core.Pod)
		if !ok {
			klog.Errorf(
				"Failed to convert DeletedFinalStateUnknown.Obj to Pod: %#v",
				deletedFinalStateUnknown)
			return nil
		}
	}

	return pod
}

// obj could be *core.Node or cache.DeletedFinalStateUnknown.
func ToNode(obj interface{}) *core.Node {
	node, ok := obj.(*core.Node)

	if !ok {
		deletedFinalStateUnknown, ok := obj.(cache.DeletedFinalStateUnknown)
		if !ok {
			klog.Errorf(
				"Failed to convert obj to Node or DeletedFinalStateUnknown: %#v",
				obj)
			return nil
		}

		node, ok = deletedFinalStateUnknown.Obj.(*core.Node)
		if !ok {
			klog.Errorf(
				"Failed to convert DeletedFinalStateUnknown.Obj to Node: %#v",
				deletedFinalStateUnknown)
			return nil
		}
	}

	return node
}

func Key(p *core.Pod) string {
	return fmt.Sprintf("%v(%v/%v)", p.UID, p.Namespace, p.Name)
}

func IsCompleted(pod *core.Pod) bool {
	return pod.Status.Phase == core.PodSucceeded ||
		pod.Status.Phase == core.PodFailed
}

func IsLive(pod *core.Pod) bool {
	return !IsCompleted(pod)
}

func isHivedEnabledForContainers(containers []core.Container) bool {
	for _, container := range containers {
		// No need to check Requests, since extended resource must set Limits.
		for resourceName, resourceQuantity := range container.Resources.Limits {
			if resourceName == si.ResourceNamePodSchedulingEnable &&
				resourceQuantity.Sign() > 0 {
				return true
			}
		}
	}

	return false
}

func IsHivedEnabled(pod *core.Pod) bool {
	if isHivedEnabledForContainers(pod.Spec.InitContainers) {
		return true
	}
	if isHivedEnabledForContainers(pod.Spec.Containers) {
		return true
	}

	return false
}

// Aligned with K8S HTTPExtender, so that Informer is also aligned with WebServer.
func IsInterested(pod *core.Pod) bool {
	// A completed Pod is the same as a deleted Pod from the scheduler view, so only
	// track live Pod.
	return IsLive(pod) && IsHivedEnabled(pod)
}

// Scheduler only can see live Pod, so the IsLive() check is usually redundant.
// A bound Pod means it is currently holding its requested resources.
func IsBound(pod *core.Pod) bool {
	return pod.Spec.NodeName != "" && IsLive(pod)
}

// An unbound Pod means it is currently waiting on its requested resources.
func IsUnbound(pod *core.Pod) bool {
	return pod.Spec.NodeName == "" && IsLive(pod)
}

func NewBindingPod(pod *core.Pod, podBindInfo *si.PodBindInfo) *core.Pod {
	bindingPod := pod.DeepCopy()

	bindingPod.Spec.NodeName = podBindInfo.Node

	if bindingPod.Annotations == nil {
		bindingPod.Annotations = map[string]string{}
	}
	bindingPod.Annotations[si.AnnotationKeyPodGpuIsolation] =
		common.ToIndicesString(podBindInfo.GpuIsolation)
	bindingPod.Annotations[si.AnnotationKeyPodBindInfo] =
		common.ToYaml(podBindInfo)

	return bindingPod
}

// PodBindInfo comes from internal, so just need to assert when deserialization.
func ExtractPodBindInfo(allocatedPod *core.Pod) *si.PodBindInfo {
	podBindInfo := si.PodBindInfo{}

	annotation := allocatedPod.Annotations[si.AnnotationKeyPodBindInfo]
	if annotation == "" {
		panic(fmt.Errorf(
			"Pod does not contain or contains empty annotation: %v",
			si.AnnotationKeyPodBindInfo))
	}

	common.FromYaml(annotation, &podBindInfo)
	return &podBindInfo
}

func ExtractPodBindAnnotations(allocatedPod *core.Pod) map[string]string {
	return map[string]string{
		si.AnnotationKeyPodGpuIsolation: allocatedPod.Annotations[si.AnnotationKeyPodGpuIsolation],
		si.AnnotationKeyPodBindInfo:     allocatedPod.Annotations[si.AnnotationKeyPodBindInfo],
	}
}

// PodSchedulingSpec comes from external, so need more Defaulting and Validation
// when deserialization.
func ExtractPodSchedulingSpec(pod *core.Pod) *si.PodSchedulingSpec {
	// Consider all panics are BadRequestPanic.
	defer AsBadRequestPanic()
	errPfx := fmt.Sprintf("Pod annotation %v: ", si.AnnotationKeyPodSchedulingSpec)

	podSchedulingSpec := si.PodSchedulingSpec{}

	annotation := pod.Annotations[si.AnnotationKeyPodSchedulingSpec]
	if annotation == "" {
		panic(fmt.Errorf(errPfx + "Annotation does not exist or is empty"))
	}

	common.FromYaml(annotation, &podSchedulingSpec)

	// Defaulting
	if podSchedulingSpec.AffinityGroup == nil {
		podSchedulingSpec.AffinityGroup = &si.AffinityGroupSpec{
			Name: fmt.Sprintf("%v/%v", pod.Namespace, pod.Name),
			Members: []si.AffinityGroupMemberSpec{{
				PodNumber: 1,
				GpuNumber: podSchedulingSpec.GpuNumber},
			},
		}
	}

	// Validation
	if podSchedulingSpec.VirtualCluster == "" {
		panic(fmt.Errorf(errPfx + "VirtualCluster is empty"))
	}
	if podSchedulingSpec.Priority < si.OpportunisticPriority {
		panic(fmt.Errorf(errPfx+"Priority is less than %v", si.OpportunisticPriority))
	}
	if podSchedulingSpec.Priority > si.MaxGuaranteedPriority {
		panic(fmt.Errorf(errPfx+"Priority is greater than %v", si.MaxGuaranteedPriority))
	}
	if podSchedulingSpec.GpuNumber <= 0 {
		panic(fmt.Errorf(errPfx + "GpuNumber is non-positive"))
	}
	if podSchedulingSpec.AffinityGroup.Name == "" {
		panic(fmt.Errorf(errPfx + "AffinityGroup.Name is empty"))
	}

	isPodInGroup := false
	for _, member := range podSchedulingSpec.AffinityGroup.Members {
		if member.PodNumber <= 0 {
			panic(fmt.Errorf(errPfx + "AffinityGroup.Members has non-positive PodNumber"))
		}
		if member.GpuNumber <= 0 {
			panic(fmt.Errorf(errPfx + "AffinityGroup.Members has non-positive GpuNumber"))
		}
		if member.GpuNumber == podSchedulingSpec.GpuNumber {
			isPodInGroup = true
		}
	}
	if !isPodInGroup {
		panic(fmt.Errorf(errPfx + "AffinityGroup.Members does not contains current Pod"))
	}

	return &podSchedulingSpec
}

func BindPod(kClient kubeClient.Interface, bindingPod *core.Pod) {
	// The K8S Bind is atomic and can only succeed at most once.
	err := kClient.CoreV1().Pods(bindingPod.Namespace).Bind(&core.Binding{
		ObjectMeta: meta.ObjectMeta{
			Namespace:   bindingPod.Namespace,
			Name:        bindingPod.Name,
			UID:         bindingPod.UID,
			Annotations: ExtractPodBindAnnotations(bindingPod),
		},
		Target: core.ObjectReference{
			Kind: "Node",
			Name: bindingPod.Spec.NodeName,
		},
	})

	if err != nil {
		panic(fmt.Errorf("Failed to bind Pod: %v", err))
	}

	klog.Infof("[%v]: Succeeded to bind Pod on node %v, gpus %v",
		Key(bindingPod),
		bindingPod.Spec.NodeName,
		bindingPod.Annotations[si.AnnotationKeyPodGpuIsolation])
}

func NewBadRequestError(message string) *si.WebServerError {
	return si.NewWebServerError(http.StatusBadRequest, message)
}

// Wrap and Rethrow Panic as BadRequestError Panic
func AsBadRequestPanic() {
	if r := recover(); r != nil {
		panic(NewBadRequestError(fmt.Sprintf("%v", r)))
	}
}

// Recover User Error Panic
// Rethrow Platform Error Panic
func HandleInformerPanic(logPfx string, logOnSucceeded bool) {
	if r := recover(); r != nil {
		if err, ok := r.(*si.WebServerError); ok {
			if err.Code >= http.StatusBadRequest &&
				err.Code < http.StatusInternalServerError {
				klog.Warningf(logPfx+"Skipped due to User Error: %v", err.Error())
				return
			}
		}

		panic(fmt.Errorf(logPfx+"Failed: %v", r))
	} else if logOnSucceeded {
		klog.Infof(logPfx + "Succeeded")
	}
}

// Wrap and Rethrow Panic
func HandleRoutinePanic(logPfx string) {
	if r := recover(); r != nil {
		if err, ok := r.(*si.WebServerError); ok {
			panic(si.NewWebServerError(
				err.Code,
				fmt.Sprintf(logPfx+"Failed: %v", err.Message)))
		} else {
			panic(fmt.Errorf(logPfx+"Failed: %v", r))
		}
	} else {
		klog.Infof(logPfx + "Succeeded")
	}
}

// Log and Recover Panic
func HandleWebServerPanic(handler func(*si.WebServerError)) {
	if r := recover(); r != nil {
		err, ok := r.(*si.WebServerError)
		if !ok {
			err = si.NewWebServerError(
				http.StatusInternalServerError,
				fmt.Sprintf("%v", r))
		}

		if err.Code >= http.StatusInternalServerError {
			klog.Warningf("%v%v", err.Message, common.GetPanicDetails(r))
			err.Message = fmt.Sprintf(si.ComponentName+": Platform Error: %v", err.Message)
		} else if err.Code >= http.StatusBadRequest {
			klog.Infof("%v", err.Message)
			err.Message = fmt.Sprintf(si.ComponentName+": User Error: %v", err.Message)
		}

		if handler != nil {
			handler(err)
		}
	}
}
