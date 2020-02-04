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
	core "k8s.io/api/core/v1"
	"os"
)

///////////////////////////////////////////////////////////////////////////////////////
// General Constants
///////////////////////////////////////////////////////////////////////////////////////
const (
	// For controller
	ComponentName      = "frameworkcontroller"
	GroupName          = "frameworkcontroller.microsoft.com"
	Version            = "v1"
	FrameworkPlural    = "frameworks"
	FrameworkCRDName   = FrameworkPlural + "." + GroupName
	FrameworkKind      = "Framework"
	ConfigMapKind      = "ConfigMap"
	PodKind            = "Pod"
	ObjectUIDFieldPath = "metadata.uid"

	ConfigFilePath                    = "./frameworkcontroller.yaml"
	UnlimitedValue                    = -1
	ExtendedUnlimitedValue            = -2
	LargeFrameworkCompressionMinBytes = 100 * 1024

	// For all managed objects
	// Predefined Annotations
	AnnotationKeyFrameworkNamespace = "FC_FRAMEWORK_NAMESPACE"
	AnnotationKeyFrameworkName      = "FC_FRAMEWORK_NAME"
	AnnotationKeyTaskRoleName       = "FC_TASKROLE_NAME"
	AnnotationKeyTaskIndex          = "FC_TASK_INDEX"
	AnnotationKeyConfigMapName      = "FC_CONFIGMAP_NAME"
	AnnotationKeyPodName            = "FC_POD_NAME"

	AnnotationKeyFrameworkAttemptID          = "FC_FRAMEWORK_ATTEMPT_ID"
	AnnotationKeyFrameworkAttemptInstanceUID = "FC_FRAMEWORK_ATTEMPT_INSTANCE_UID"
	AnnotationKeyConfigMapUID                = "FC_CONFIGMAP_UID"
	AnnotationKeyTaskAttemptID               = "FC_TASK_ATTEMPT_ID"

	// Predefined Labels
	LabelKeyFrameworkName = AnnotationKeyFrameworkName
	LabelKeyTaskRoleName  = AnnotationKeyTaskRoleName

	// For all managed containers
	// Predefined Environment Variables
	// It can be referred by other environment variables specified in the Container Env,
	// i.e. specify its value to include "$(AnyPredefinedEnvName)".
	// If the reference is predefined, it will be replaced to its target value when
	// start the Container, otherwise it will be unchanged.
	EnvNameFrameworkNamespace = AnnotationKeyFrameworkNamespace
	EnvNameFrameworkName      = AnnotationKeyFrameworkName
	EnvNameTaskRoleName       = AnnotationKeyTaskRoleName
	EnvNameTaskIndex          = AnnotationKeyTaskIndex
	EnvNameConfigMapName      = AnnotationKeyConfigMapName
	EnvNamePodName            = AnnotationKeyPodName

	EnvNameFrameworkAttemptID          = AnnotationKeyFrameworkAttemptID
	EnvNameFrameworkAttemptInstanceUID = AnnotationKeyFrameworkAttemptInstanceUID
	EnvNameConfigMapUID                = AnnotationKeyConfigMapUID
	EnvNameTaskAttemptID               = AnnotationKeyTaskAttemptID
	EnvNameTaskAttemptInstanceUID      = "FC_TASK_ATTEMPT_INSTANCE_UID"
	EnvNamePodUID                      = "FC_POD_UID"

	// For Pod Spec
	// Predefined Pod Template Placeholders
	// It can be referred in any string value specified in the Pod Spec,
	// i.e. specify the value to include "{{AnyPredefinedPlaceholder}}".
	// If the reference is predefined, it will be replaced to its target value when
	// create the Pod object, otherwise it will be unchanged.
	PlaceholderFrameworkNamespace = AnnotationKeyFrameworkNamespace
	PlaceholderFrameworkName      = AnnotationKeyFrameworkName
	PlaceholderTaskRoleName       = AnnotationKeyTaskRoleName
	PlaceholderTaskIndex          = AnnotationKeyTaskIndex
	PlaceholderConfigMapName      = AnnotationKeyConfigMapName
	PlaceholderPodName            = AnnotationKeyPodName
)

var FrameworkGroupVersionKind = SchemeGroupVersion.WithKind(FrameworkKind)
var ConfigMapGroupVersionKind = core.SchemeGroupVersion.WithKind(ConfigMapKind)
var PodGroupVersionKind = core.SchemeGroupVersion.WithKind(PodKind)

var ObjectUIDEnvVarSource = &core.EnvVarSource{
	FieldRef: &core.ObjectFieldSelector{FieldPath: ObjectUIDFieldPath},
}

var EnvValueKubeApiServerAddress = os.Getenv("KUBE_APISERVER_ADDRESS")
var EnvValueKubeConfigFilePath = os.Getenv("KUBECONFIG")
var DefaultKubeConfigFilePath = os.Getenv("HOME") + "/.kube/config"
