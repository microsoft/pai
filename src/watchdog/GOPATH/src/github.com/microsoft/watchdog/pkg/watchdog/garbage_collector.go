package watchdog

import (
	"regexp"
	"strings"
	"time"

	fc "github.com/microsoft/frameworkcontroller/pkg/apis/frameworkcontroller/v1"
	v1 "k8s.io/api/core/v1"
	shedulev1 "k8s.io/api/scheduling/v1"
	"k8s.io/klog"
)

const (
	priorityClassNameSuffix  = "-priority"
	registrySecretNameSuffix = "-regcred"
	jobConfigSecretSuffix    = "-configcred"
)

type GarbageCollector struct {
	k8sClient                *K8sClient
	frameworkMap             map[string]fc.Framework
	priorityClasses          []shedulev1.PriorityClass
	secrets                  []v1.Secret
	collectionInterval       time.Duration
	stopCh                   chan bool
	finishCh                 chan bool
	priorityClassNameRegex   *regexp.Regexp
	registrySecretNameRegex  *regexp.Regexp
	jobConfigSecretNameRegex *regexp.Regexp
}

func NewGarbageCollector(c *K8sClient, interval time.Duration) *GarbageCollector {
	// The priorityClass/Secret name will be frameworkName-{priority|regcred|configcred}
	// And frameworkName = hex(md5(realName))
	return &GarbageCollector{
		k8sClient:                c,
		collectionInterval:       interval,
		stopCh:                   make(chan bool),
		finishCh:                 make(chan bool),
		frameworkMap:             make(map[string]fc.Framework),
		priorityClassNameRegex:   regexp.MustCompile("^[0-9a-f]{32}" + priorityClassNameSuffix),
		registrySecretNameRegex:  regexp.MustCompile("^[0-9a-f]{32}-regcred" + registrySecretNameSuffix),
		jobConfigSecretNameRegex: regexp.MustCompile("^[0-9a-f]{32}-configcred" + jobConfigSecretSuffix),
	}
}

func (gc *GarbageCollector) Start() {
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

func (gc *GarbageCollector) Stop() {
	gc.stopCh <- true
	<-gc.finishCh
}

func (gc *GarbageCollector) removeOrphanPriorityClasses() {
	for _, pc := range gc.priorityClasses {
		if !gc.priorityClassNameRegex.MatchString(pc.Name) {
			klog.Infof("Unknown priority class: %v", pc.Name)
			continue
		}
		frameworkName := strings.TrimSuffix(pc.Name, priorityClassNameSuffix)
		_, exist := gc.frameworkMap[frameworkName]
		if !exist {
			klog.Infof("Delete orphan priority class %v", pc.Name)
			err := gc.k8sClient.deletePriorityClass(pc.Name)
			if err != nil {
				klog.Warningf("Failed to delete priority class, err: %v", err)
			}
		}
	}
}

func (gc *GarbageCollector) removeOrphanSecrets() {
	for _, s := range gc.secrets {
		var frameworkName string
		if gc.registrySecretNameRegex.MatchString(s.Name) {
			frameworkName = strings.TrimSuffix(s.Name, registrySecretNameSuffix)
		} else if gc.jobConfigSecretNameRegex.MatchString(s.Name) {
			frameworkName = strings.TrimSuffix(s.Name, jobConfigSecretSuffix)
		} else {
			klog.V(3).Infof("Unkown secret: %v", s.Name)
			continue
		}

		for _, owner := range s.OwnerReferences {
			if owner.Kind == "Framework" && owner.Name == frameworkName {
				klog.V(4).Infof("Skip delete secret: %v since it has owner, leave it to k8s", s.Name)
				continue
			}
		}

		_, exist := gc.frameworkMap[frameworkName]
		if !exist {
			klog.Infof("Delete orphan secret %v", s.Name)
			err := gc.k8sClient.deleteSecret("default", s.Name)
			if err != nil {
				klog.Warningf("Failed to delete priority class, err: %v", err)
			}
		}
	}
}

func (gc *GarbageCollector) collect() {
	namespace := "default"
	gc.frameworkMap, gc.priorityClasses, gc.secrets = make(map[string]fc.Framework), nil, nil
	fList, err := gc.k8sClient.listFrameworks(namespace)
	if err != nil {
		klog.Warningf("Failed to get frameworks, err: %v", err)
		return
	}
	for _, f := range fList.Items {
		gc.frameworkMap[f.Name] = f
	}

	var pcList *shedulev1.PriorityClassList
	pcList, err = gc.k8sClient.listPriorityClasses()
	if err != nil {
		klog.Warningf("Failed to get priority classes, err %v", err)
	}
	gc.priorityClasses = pcList.Items

	var sList *v1.SecretList
	sList, err = gc.k8sClient.listSecrets(namespace)
	if err != nil {
		klog.Warningf("Failed to get secrets from, err %v", err)
	}
	gc.secrets = sList.Items
}
