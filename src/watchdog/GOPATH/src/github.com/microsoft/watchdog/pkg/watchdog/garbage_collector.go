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

package watchdog

import (
	"regexp"
	"strings"
	"time"

	v1 "k8s.io/api/core/v1"
	shedulev1 "k8s.io/api/scheduling/v1"
	"k8s.io/klog"
)

const (
	frameworkPattern         = "^[0-9a-f]{32}"
	priorityClassNameSuffix  = "-priority"
	registrySecretNameSuffix = "-regcred"
	jobConfigSecretSuffix    = "-configcred"
)

var buildInPriorityClasses = []string{
	"system-cluster-critical",
	"system-node-critical",
	"k8s-cluster-critical",
}

func isContains(arr []string, ele string) bool {
	for _, s := range arr {
		if s == ele {
			return true
		}
	}
	return false
}

// GarbageCollector a struct used to recycle k8s garbage instaces
type GarbageCollector struct {
	k8sClient                *K8sClient
	frameworkExistMap        map[string]bool
	priorityClasses          []shedulev1.PriorityClass
	secrets                  []v1.Secret
	collectionInterval       time.Duration
	stopCh                   chan bool
	finishCh                 chan bool
	priorityClassNameRegex   *regexp.Regexp
	registrySecretNameRegex  *regexp.Regexp
	jobConfigSecretNameRegex *regexp.Regexp
}

// NewGarbageCollector create GarbageCollector instance
func NewGarbageCollector(c *K8sClient, interval time.Duration) *GarbageCollector {
	// The priorityClass/Secret name will be frameworkName-{priority|regcred|configcred}
	// And frameworkName = hex(md5(realName))
	return &GarbageCollector{
		k8sClient:                c,
		collectionInterval:       interval,
		stopCh:                   make(chan bool),
		finishCh:                 make(chan bool),
		frameworkExistMap:        make(map[string]bool),
		priorityClassNameRegex:   regexp.MustCompile(frameworkPattern + priorityClassNameSuffix),
		registrySecretNameRegex:  regexp.MustCompile(frameworkPattern + registrySecretNameSuffix),
		jobConfigSecretNameRegex: regexp.MustCompile(frameworkPattern + jobConfigSecretSuffix),
	}
}

// Start used to start garbage collection
func (gc *GarbageCollector) Start() {
	klog.Info("Garbage collection starts")
	go func() {
		tick := time.Tick(gc.collectionInterval)
		for {
			select {
			case <-tick:
				klog.V(2).Infof("Start new a loop to collect garbages")
				gc.collect()
				gc.removeOrphanPriorityClasses()
				gc.removeOrphanSecrets()
			case <-gc.stopCh:
				klog.Info("Stopping garbage collector")
				gc.finishCh <- true
				return
			}
		}
	}()
}

// Stop used to stop garbage collection
func (gc *GarbageCollector) Stop() {
	gc.stopCh <- true
	<-gc.finishCh
}

func (gc *GarbageCollector) removeOrphanPriorityClasses() int {
	removedNum := 0 // used for UT
	for _, pc := range gc.priorityClasses {
		if !gc.priorityClassNameRegex.MatchString(pc.Name) {
			if !isContains(buildInPriorityClasses, pc.Name) {
				klog.V(2).Infof("Unknown priority class: %v", pc.Name)
			}
			continue
		}
		frameworkName := strings.TrimSuffix(pc.Name, priorityClassNameSuffix)
		_, exist := gc.frameworkExistMap[frameworkName]
		if !exist {
			klog.Infof("Delete orphan priority class %v", pc.Name)
			err := gc.k8sClient.deletePriorityClass(pc.Name)
			if err != nil {
				klog.Warningf("Failed to delete priority class, err: %v", err)
			} else {
				removedNum++
			}
		}
	}
	return removedNum
}

func (gc *GarbageCollector) removeOrphanSecrets() int {
	removedNum := 0 // used for UT
	for _, s := range gc.secrets {
		var frameworkName string
		if gc.registrySecretNameRegex.MatchString(s.Name) {
			frameworkName = strings.TrimSuffix(s.Name, registrySecretNameSuffix)
		} else if gc.jobConfigSecretNameRegex.MatchString(s.Name) {
			frameworkName = strings.TrimSuffix(s.Name, jobConfigSecretSuffix)
		} else {
			klog.V(3).Infof("Unknown secret: %v", s.Name)
			continue
		}

		for _, owner := range s.OwnerReferences {
			if owner.Kind == "Framework" && owner.Name == frameworkName {
				klog.V(4).Infof("Skip delete secret: %v since it has owner, leave it to k8s", s.Name)
				continue
			}
		}

		_, exist := gc.frameworkExistMap[frameworkName]
		if !exist {
			klog.Infof("Delete orphan secret %v", s.Name)
			err := gc.k8sClient.deleteSecret("default", s.Name)
			if err != nil {
				klog.Warningf("Failed to delete priority class, err: %v", err)
			} else {
				removedNum++
			}
		}
	}
	return removedNum
}

func (gc *GarbageCollector) collect() {
	namespace := "default"
	gc.frameworkExistMap, gc.priorityClasses, gc.secrets = make(map[string]bool), nil, nil
	fList, err := gc.k8sClient.listFrameworks(namespace)
	if err != nil {
		klog.Warningf("Failed to get frameworks, err: %v", err)
		return
	}
	for _, f := range fList.Items {
		gc.frameworkExistMap[f.GetName()] = true
	}

	var pcList *shedulev1.PriorityClassList
	pcList, err = gc.k8sClient.listPriorityClasses()
	if err != nil {
		klog.Warningf("Failed to get priority classes, err %v", err)
	} else {
		gc.priorityClasses = pcList.Items
	}

	var sList *v1.SecretList
	sList, err = gc.k8sClient.listSecrets(namespace)
	if err != nil {
		klog.Warningf("Failed to get secrets from, err %v", err)
	} else {
		gc.secrets = sList.Items
	}
}
