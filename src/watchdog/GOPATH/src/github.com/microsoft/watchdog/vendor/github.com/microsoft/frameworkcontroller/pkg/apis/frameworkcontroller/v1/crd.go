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
	"github.com/microsoft/frameworkcontroller/pkg/common"
	apiExtensions "k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1beta1"
	meta "k8s.io/apimachinery/pkg/apis/meta/v1"
)

const (
	// Names in CRD should be up to 63 lower case alphanumeric characters.
	NamingConvention = "^[a-z0-9]{1,63}$"
)

func BuildFrameworkCRD() *apiExtensions.CustomResourceDefinition {
	crd := &apiExtensions.CustomResourceDefinition{
		ObjectMeta: meta.ObjectMeta{
			Name: FrameworkCRDName,
		},
		Spec: apiExtensions.CustomResourceDefinitionSpec{
			Group:   GroupName,
			Version: SchemeGroupVersion.Version,
			Scope:   apiExtensions.NamespaceScoped,
			Names: apiExtensions.CustomResourceDefinitionNames{
				Plural: FrameworkPlural,
				Kind:   FrameworkKind,
			},
			Validation: buildFrameworkValidation(),
			// TODO: Enable CRD Subresources after ApiServer has supported it.
			//Subresources: &apiExtensions.CustomResourceSubresources{
			//	Status: &apiExtensions.CustomResourceSubresourceStatus{
			//	},
			//},
		},
	}

	return crd
}

func buildFrameworkValidation() *apiExtensions.CustomResourceValidation {
	return &apiExtensions.CustomResourceValidation{
		OpenAPIV3Schema: &apiExtensions.JSONSchemaProps{
			Properties: map[string]apiExtensions.JSONSchemaProps{
				"metadata": {
					Properties: map[string]apiExtensions.JSONSchemaProps{
						"name": {
							Type:    "string",
							Pattern: NamingConvention,
						},
					},
				},
				"spec": {
					Properties: map[string]apiExtensions.JSONSchemaProps{
						"executionType": {
							Enum: []apiExtensions.JSON{
								{Raw: []byte(common.Quote(string(ExecutionStart)))},
								{Raw: []byte(common.Quote(string(ExecutionStop)))},
							},
						},
						"retryPolicy": {
							Properties: map[string]apiExtensions.JSONSchemaProps{
								"maxRetryCount": {
									Type:    "integer",
									Minimum: common.PtrFloat64(ExtendedUnlimitedValue),
								},
							},
						},
						"taskRoles": {
							// TODO: names in array should not duplicate
							Type: "array",
							Items: &apiExtensions.JSONSchemaPropsOrArray{
								Schema: &apiExtensions.JSONSchemaProps{
									Properties: map[string]apiExtensions.JSONSchemaProps{
										"name": {
											Type:    "string",
											Pattern: NamingConvention,
										},
										"taskNumber": {
											Type:    "integer",
											Minimum: common.PtrFloat64(0),
											Maximum: common.PtrFloat64(10000),
										},
										"frameworkAttemptCompletionPolicy": {
											Properties: map[string]apiExtensions.JSONSchemaProps{
												"minFailedTaskCount": {
													Type: "integer",
													// TODO: should not allow 0
													Minimum: common.PtrFloat64(UnlimitedValue),
												},
												"minSucceededTaskCount": {
													Type: "integer",
													// TODO: should not allow 0
													Minimum: common.PtrFloat64(UnlimitedValue),
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	}
}
