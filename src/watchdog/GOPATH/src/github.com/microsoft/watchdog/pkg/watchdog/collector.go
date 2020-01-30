package watchdog

import (
	"os"

	v1 "k8s.io/api/core/v1"
	shedulev1 "k8s.io/api/scheduling/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/klog"

	"k8s.io/client-go/rest"

	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
)

const kubeAPIServerAddress = "KUBE_APISERVER_ADDRESS"

// K8sCollector is a collector
type K8sCollector struct {
	client *kubernetes.Clientset
}

func (c *K8sCollector) initK8sCollector() error {
	var apiServerAddress = os.Getenv(kubeAPIServerAddress)
	var kConfig *rest.Config
	var err error
	if len(apiServerAddress) > 0 {
		kConfig, err = clientcmd.BuildConfigFromFlags(apiServerAddress, "")
		if err != nil {
			klog.Errorf("Failed to init config, apiServerAddress is %v", apiServerAddress)
			return err
		}
	} else {
		kConfig, err = rest.InClusterConfig()
		if err != nil {
			klog.Errorf("Can not init config through in-cluster config")
			return err
		}
	}
	c.client, err = kubernetes.NewForConfig(kConfig)
	return err
}

func (c *K8sCollector) listPods() (*v1.PodList, error) {
	return c.client.CoreV1().Pods("").List(metav1.ListOptions{})
}

func (c *K8sCollector) getServerHealth() (string, error) {
	resp := c.client.RESTClient().Get().Suffix("healthz").Do()
	err := resp.Error()
	if resp.Error() != nil {
		return "", err
	}
	return "", nil
}

func (c *K8sCollector) listNodes() (*v1.NodeList, error) {
	return c.client.CoreV1().Nodes().List(metav1.ListOptions{})
}

func (c *K8sCollector) listPriorityClasses() (*shedulev1.PriorityClassList, error) {
	return c.client.SchedulingV1().PriorityClasses().List(metav1.ListOptions{})
}

func NewK8sCollector() (*K8sCollector, error) {
	k8sCollector := K8sCollector{}
	err := k8sCollector.initK8sCollector()
	if err != nil {
		return nil, err
	}
	return &k8sCollector, nil
}
