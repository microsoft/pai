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
	"reflect"
	"regexp"
	"time"
)

func init() {
	initCompletionCodeInfos()
}

///////////////////////////////////////////////////////////////////////////////////////
// CompletionCodeInfos Constants
///////////////////////////////////////////////////////////////////////////////////////
// Represent [Min, Max]
type CompletionCodeRange struct {
	Min CompletionCode
	Max CompletionCode
}

// Reserved CompletionCodes
// It is Reserved for the Contract between Container and FrameworkController,
// so Container should avoid unintendedly exit within the range.
var CompletionCodeReservedPositive = CompletionCodeRange{200, 219}
var CompletionCodeReservedNonPositive = CompletionCodeRange{-999, 0}

// Predefined CompletionCodes
// The predefined ones must be within the reserved ones.
const (
	// [200, 219]: Predefined Container ExitCode
	CompletionCodeContainerTransientFailed         CompletionCode = 200
	CompletionCodeContainerTransientConflictFailed CompletionCode = 201
	CompletionCodeContainerPermanentFailed         CompletionCode = 210

	// [0, 0]: Succeeded
	CompletionCodeSucceeded CompletionCode = 0

	// [-999, -1]: Predefined Framework Error
	// -1XX: Transient Error
	CompletionCodeConfigMapExternalDeleted CompletionCode = -100
	CompletionCodePodExternalDeleted       CompletionCode = -101
	CompletionCodeConfigMapCreationTimeout CompletionCode = -110
	CompletionCodePodCreationTimeout       CompletionCode = -111
	// -2XX: Permanent Error
	CompletionCodePodSpecInvalid             CompletionCode = -200
	CompletionCodeStopFrameworkRequested     CompletionCode = -210
	CompletionCodeFrameworkAttemptCompletion CompletionCode = -220
	// -3XX: Unknown Error
	CompletionCodePodFailedWithoutFailedContainer CompletionCode = -300
)

var completionCodeInfoList = []*CompletionCodeInfo{}
var completionCodeInfoMap = map[CompletionCode]*CompletionCodeInfo{}

var completionCodeInfoContainerUnrecognizedFailed = &CompletionCodeInfo{
	Phrase: "ContainerUnrecognizedFailed",
	Type:   CompletionType{CompletionTypeNameFailed, []CompletionTypeAttribute{}},
}

func initCompletionCodeInfos() {
	AppendCompletionCodeInfos([]*CompletionCodeInfo{
		{
			Code:   CompletionCodeContainerTransientFailed.Ptr(),
			Phrase: "ContainerTransientFailed",
			Type: CompletionType{
				CompletionTypeNameFailed, []CompletionTypeAttribute{
					CompletionTypeAttributeTransient}},
			PodPatterns: []*PodPattern{{
				Containers: []*ContainerPattern{{
					CodeRange: CompletionCodeRange{
						CompletionCodeContainerTransientFailed,
						CompletionCodeContainerTransientFailed}.Int32Range(),
					NameRegex:    NewRegex("(?ms).*"),
					MessageRegex: NewRegex("(?ms).*"),
				}},
			}},
		},
		{
			Code:   CompletionCodeContainerTransientConflictFailed.Ptr(),
			Phrase: "ContainerTransientConflictFailed",
			Type: CompletionType{CompletionTypeNameFailed, []CompletionTypeAttribute{
				CompletionTypeAttributeTransient, CompletionTypeAttributeConflict}},
			PodPatterns: []*PodPattern{{
				Containers: []*ContainerPattern{{
					CodeRange: CompletionCodeRange{
						CompletionCodeContainerTransientConflictFailed,
						CompletionCodeContainerTransientConflictFailed}.Int32Range(),
					NameRegex:    NewRegex("(?ms).*"),
					MessageRegex: NewRegex("(?ms).*"),
				}},
			}},
		},
		{
			Code:   CompletionCodeContainerPermanentFailed.Ptr(),
			Phrase: "ContainerPermanentFailed",
			Type: CompletionType{CompletionTypeNameFailed,
				[]CompletionTypeAttribute{CompletionTypeAttributePermanent}},
			PodPatterns: []*PodPattern{{
				Containers: []*ContainerPattern{{
					CodeRange: CompletionCodeRange{
						CompletionCodeContainerPermanentFailed,
						CompletionCodeContainerPermanentFailed}.Int32Range(),
					NameRegex:    NewRegex("(?ms).*"),
					MessageRegex: NewRegex("(?ms).*"),
				}},
			}},
		},
		{
			Code:   CompletionCodeSucceeded.Ptr(),
			Phrase: "Succeeded",
			Type: CompletionType{CompletionTypeNameSucceeded,
				[]CompletionTypeAttribute{}},
		},
		{
			Code:   CompletionCodeConfigMapExternalDeleted.Ptr(),
			Phrase: "ConfigMapExternalDeleted",
			Type: CompletionType{CompletionTypeNameFailed,
				[]CompletionTypeAttribute{CompletionTypeAttributeTransient}},
		},
		{
			// Possibly due to Pod Eviction or Preemption.
			Code:   CompletionCodePodExternalDeleted.Ptr(),
			Phrase: "PodExternalDeleted",
			Type: CompletionType{CompletionTypeNameFailed,
				[]CompletionTypeAttribute{CompletionTypeAttributeTransient}},
		},
		{
			Code:   CompletionCodeConfigMapCreationTimeout.Ptr(),
			Phrase: "ConfigMapCreationTimeout",
			Type: CompletionType{CompletionTypeNameFailed,
				[]CompletionTypeAttribute{CompletionTypeAttributeTransient}},
		},
		{
			Code:   CompletionCodePodCreationTimeout.Ptr(),
			Phrase: "PodCreationTimeout",
			Type: CompletionType{CompletionTypeNameFailed,
				[]CompletionTypeAttribute{CompletionTypeAttributeTransient}},
		},
		{
			Code:   CompletionCodePodSpecInvalid.Ptr(),
			Phrase: "PodSpecInvalid",
			Type: CompletionType{CompletionTypeNameFailed,
				[]CompletionTypeAttribute{CompletionTypeAttributePermanent}},
		},
		{
			Code:   CompletionCodeStopFrameworkRequested.Ptr(),
			Phrase: "StopFrameworkRequested",
			Type: CompletionType{CompletionTypeNameFailed,
				[]CompletionTypeAttribute{CompletionTypeAttributePermanent}},
		},
		{
			Code:   CompletionCodeFrameworkAttemptCompletion.Ptr(),
			Phrase: "FrameworkAttemptCompletion",
			Type: CompletionType{CompletionTypeNameFailed,
				[]CompletionTypeAttribute{CompletionTypeAttributePermanent}},
		},
		{
			Code:   CompletionCodePodFailedWithoutFailedContainer.Ptr(),
			Phrase: "PodFailedWithoutFailedContainer",
			Type: CompletionType{CompletionTypeNameFailed,
				[]CompletionTypeAttribute{}},
		},
	})
}

func AppendCompletionCodeInfos(codeInfos []*CompletionCodeInfo) {
	for _, codeInfo := range codeInfos {
		if existingCodeInfo, ok := completionCodeInfoMap[*codeInfo.Code]; ok {
			// Unreachable
			panic(fmt.Errorf(
				"Failed to append CompletionCodeInfo due to duplicated CompletionCode:"+
					"\nExisting CompletionCodeInfo:\n%v,\nAppending CompletionCodeInfo:\n%v",
				common.ToYaml(existingCodeInfo), common.ToYaml(codeInfo)))
		}

		completionCodeInfoList = append(completionCodeInfoList, codeInfo)
		completionCodeInfoMap[*codeInfo.Code] = codeInfo
	}
}

///////////////////////////////////////////////////////////////////////////////////////
// CompletionCodeInfos Matching
///////////////////////////////////////////////////////////////////////////////////////
type PodMatchResult struct {
	// CodeInfo and its Code should be not nil
	CodeInfo    *CompletionCodeInfo
	Diagnostics string
}

// Field name should be consistent with PodCompletionStatus
type MatchedPod struct {
	Name       *string             `json:"name,omitempty"`
	Reason     string              `json:"reason,omitempty"`
	Message    string              `json:"message,omitempty"`
	Containers []*MatchedContainer `json:"containers,omitempty"`
}

// Field name should be consistent with ContainerCompletionStatus
type MatchedContainer struct {
	Name    *string `json:"name,omitempty"`
	Reason  string  `json:"reason,omitempty"`
	Message string  `json:"message,omitempty"`
	Signal  int32   `json:"signal,omitempty"`
	Code    *int32  `json:"code,omitempty"`
}

// Match ANY CompletionCodeInfo
func MatchCompletionCodeInfos(pod *core.Pod) PodMatchResult {
	for _, codeInfo := range completionCodeInfoList {
		for _, podPattern := range codeInfo.PodPatterns {
			if matchedPod := matchPodPattern(pod, podPattern); matchedPod != nil {
				diag := fmt.Sprintf("PodPattern matched: %v", common.ToJson(matchedPod))
				return PodMatchResult{
					CodeInfo:    codeInfo,
					Diagnostics: diag,
				}
			}
		}
	}

	// ALL CompletionCodeInfos cannot be matched, fall back to unmatched result.
	return generatePodUnmatchedResult(pod)
}

// Match ENTIRE PodPattern
func matchPodPattern(pod *core.Pod, podPattern *PodPattern) *MatchedPod {
	matchedPod := &MatchedPod{}

	if !podPattern.NameRegex.IsZero() {
		if ms := podPattern.NameRegex.FindString(pod.Name); ms != nil {
			matchedPod.Name = ms
		} else {
			return nil
		}
	}
	if !podPattern.ReasonRegex.IsZero() {
		if ms := podPattern.ReasonRegex.FindString(pod.Status.Reason); ms != nil {
			matchedPod.Reason = *ms
		} else {
			return nil
		}
	}
	if !podPattern.MessageRegex.IsZero() {
		if ms := podPattern.MessageRegex.FindString(pod.Status.Message); ms != nil {
			matchedPod.Message = *ms
		} else {
			return nil
		}
	}

	if len(podPattern.Containers) > 0 {
		containers := GetAllContainerStatuses(pod)
		for _, containerPattern := range podPattern.Containers {
			if mc := matchContainers(containers, containerPattern); mc != nil {
				if !reflect.DeepEqual(mc, &MatchedContainer{}) {
					matchedPod.Containers = append(matchedPod.Containers, mc)
				}
			} else {
				return nil
			}
		}
	}

	return matchedPod
}

// Match ANY Container
func matchContainers(
	containers []core.ContainerStatus,
	containerPattern *ContainerPattern) *MatchedContainer {
	for _, container := range containers {
		if mc := matchContainerPattern(container, containerPattern); mc != nil {
			return mc
		}
	}

	return nil
}

// Match ENTIRE ContainerPattern
func matchContainerPattern(
	container core.ContainerStatus,
	containerPattern *ContainerPattern) *MatchedContainer {
	term := container.State.Terminated
	matchedContainer := &MatchedContainer{}

	if !containerPattern.NameRegex.IsZero() {
		if ms := containerPattern.NameRegex.FindString(container.Name); ms != nil {
			matchedContainer.Name = ms
		} else {
			return nil
		}
	}

	if !containerPattern.ReasonRegex.IsZero() {
		if term == nil {
			return nil
		}
		if ms := containerPattern.ReasonRegex.FindString(term.Reason); ms != nil {
			matchedContainer.Reason = *ms
		} else {
			return nil
		}
	}
	if !containerPattern.MessageRegex.IsZero() {
		if term == nil {
			return nil
		}
		if ms := containerPattern.MessageRegex.FindString(term.Message); ms != nil {
			matchedContainer.Message = *ms
		} else {
			return nil
		}
	}
	if !containerPattern.SignalRange.IsZero() {
		if term == nil {
			return nil
		}
		if containerPattern.SignalRange.Contains(term.Signal) {
			matchedContainer.Signal = term.Signal
		} else {
			return nil
		}
	}
	if !containerPattern.CodeRange.IsZero() {
		if term == nil {
			return nil
		}
		if containerPattern.CodeRange.Contains(term.ExitCode) {
			matchedContainer.Code = &term.ExitCode
		} else {
			return nil
		}
	}

	return matchedContainer
}

func generatePodUnmatchedResult(pod *core.Pod) PodMatchResult {
	// Take the last failed Container ExitCode as CompletionCode and full failure
	// info as Diagnostics.
	lastContainerExitCode := common.NilInt32()
	lastContainerCompletionTime := time.Time{}
	for _, container := range GetAllContainerStatuses(pod) {
		term := container.State.Terminated
		if term != nil && term.ExitCode != 0 {
			if lastContainerExitCode == nil ||
				lastContainerCompletionTime.Before(term.FinishedAt.Time) {
				lastContainerExitCode = &term.ExitCode
				lastContainerCompletionTime = term.FinishedAt.Time
			}
		}
	}

	unmatchedPod := ExtractPodCompletionStatus(pod)
	diag := fmt.Sprintf("PodPattern unmatched: %v", common.ToJson(unmatchedPod))
	if lastContainerExitCode == nil {
		return PodMatchResult{
			CodeInfo:    completionCodeInfoMap[CompletionCodePodFailedWithoutFailedContainer],
			Diagnostics: diag,
		}
	} else {
		return PodMatchResult{
			CodeInfo: &CompletionCodeInfo{
				Code:   (*CompletionCode)(lastContainerExitCode),
				Phrase: completionCodeInfoContainerUnrecognizedFailed.Phrase,
				Type:   completionCodeInfoContainerUnrecognizedFailed.Type,
			},
			Diagnostics: diag,
		}
	}
}

///////////////////////////////////////////////////////////////////////////////////////
// Completion Utils
///////////////////////////////////////////////////////////////////////////////////////
func (ct CompletionType) IsSucceeded() bool {
	return ct.Name == CompletionTypeNameSucceeded
}

func (ct CompletionType) IsFailed() bool {
	return ct.Name == CompletionTypeNameFailed
}

func (ct CompletionType) ContainsAttribute(attr CompletionTypeAttribute) bool {
	for i := range ct.Attributes {
		if ct.Attributes[i] == attr {
			return true
		}
	}
	return false
}

func (cc CompletionCode) Ptr() *CompletionCode {
	return &cc
}

// The CompletionCode should only be the predefined ones.
func (cc CompletionCode) newCompletionStatus(diag string) *CompletionStatus {
	cci := completionCodeInfoMap[cc]
	return &CompletionStatus{
		Code:        cc,
		Phrase:      cci.Phrase,
		Type:        cci.Type,
		Diagnostics: diag,
	}
}

// The CompletionCode should only be the predefined ones.
func (cc CompletionCode) NewTaskAttemptCompletionStatus(
	diag string, pcs *PodCompletionStatus) *TaskAttemptCompletionStatus {
	return &TaskAttemptCompletionStatus{
		CompletionStatus: cc.newCompletionStatus(diag),
		Pod:              pcs,
	}
}

// The CompletionCode should only be the predefined ones.
func (cc CompletionCode) NewFrameworkAttemptCompletionStatus(
	diag string, cpts *CompletionPolicyTriggerStatus) *FrameworkAttemptCompletionStatus {
	return &FrameworkAttemptCompletionStatus{
		CompletionStatus: cc.newCompletionStatus(diag),
		Trigger:          cpts,
	}
}

func (ccr CompletionCodeRange) Int32Range() Int32Range {
	return Int32Range{(*int32)(&ccr.Min), (*int32)(&ccr.Max)}
}

func (ccr CompletionCodeRange) Contains(cc CompletionCode) bool {
	return ccr.Int32Range().Contains(int32(cc))
}

func (ccr CompletionCodeRange) String() string {
	return ccr.Int32Range().String()
}

func (ir Int32Range) Contains(i int32) bool {
	if ir.Min == nil && ir.Max == nil {
		return true
	}
	if ir.Min == nil {
		return *ir.Max >= i
	}
	if ir.Max == nil {
		return *ir.Min <= i
	}
	return *ir.Min <= i && *ir.Max >= i
}

func (ir Int32Range) String() string {
	if ir.Min == nil && ir.Max == nil {
		return fmt.Sprintf("[nil, nil]")
	}
	if ir.Min == nil {
		return fmt.Sprintf("[nil, %v]", *ir.Max)
	}
	if ir.Max == nil {
		return fmt.Sprintf("[%v, nil]", *ir.Min)
	}
	return fmt.Sprintf("[%v, %v]", *ir.Min, *ir.Max)
}

func (ir Int32Range) IsZero() bool {
	return ir.Min == nil && ir.Max == nil
}

func NewRegex(pattern string) Regex {
	return Regex{Regexp: regexp.MustCompile(pattern)}
}

func (re *Regex) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var s string
	var err error
	if err = unmarshal(&s); err != nil {
		return err
	}
	if re.Regexp, err = regexp.Compile(s); err != nil {
		return err
	}
	return nil
}

func (re Regex) MarshalYAML() (interface{}, error) {
	if re.Regexp == nil {
		return nil, nil
	}
	return re.String(), nil
}

// Override generated code.
func (re *Regex) DeepCopyInto(out *Regex) {
	common.FromYaml(common.ToYaml(re), out)
}

func (re Regex) IsZero() bool {
	return re.Regexp == nil
}

func (re Regex) FindString(s string) *string {
	if re.IsZero() {
		// Default to match entire string
		return &s
	}
	if loc := re.Regexp.FindStringIndex(s); loc != nil {
		return common.PtrString(s[loc[0]:loc[1]])
	}
	return nil
}

func ExtractPodCompletionStatus(pod *core.Pod) *PodCompletionStatus {
	pcs := &PodCompletionStatus{
		Reason:  pod.Status.Reason,
		Message: pod.Status.Message,
	}

	for _, container := range GetAllContainerStatuses(pod) {
		ccs := &ContainerCompletionStatus{
			Name: container.Name,
		}
		term := container.State.Terminated
		if term != nil {
			ccs.Reason = term.Reason
			ccs.Message = term.Message
			ccs.Signal = term.Signal
			ccs.Code = term.ExitCode
		}
		pcs.Containers = append(pcs.Containers, ccs)
	}

	return pcs
}
