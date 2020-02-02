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

type k8sClient struct {
	client *kubernetes.Clientset
	config *rest.Config
}

func (c *k8sClient) initK8sClient() error {
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
	c.config = kConfig
	c.client, err = kubernetes.NewForConfig(kConfig)
	return err
}

func (c *k8sClient) listPods() (*v1.PodList, error) {
	return c.client.CoreV1().Pods("").List(metav1.ListOptions{})
}

func (c *k8sClient) getServerHealth() (string, error) {
	resp := c.client.RESTClient().Get().Suffix("healthz").Do()
	err := resp.Error()
	if resp.Error() != nil {
		return "", err
	}
	body, _ := resp.Raw()
	return string(body), nil
}

func (c *k8sClient) listNodes() (*v1.NodeList, error) {
	return c.client.CoreV1().Nodes().List(metav1.ListOptions{})
}

func (c *k8sClient) listPriorityClasses() (*shedulev1.PriorityClassList, error) {
	return c.client.SchedulingV1().PriorityClasses().List(metav1.ListOptions{})
}

func (c *k8sClient) getAPIServerHostName() string {
	return c.config.Host
}

func newK8sClient() (*k8sClient, error) {
	k8sClient := k8sClient{}
	err := k8sClient.initK8sClient()
	if err != nil {
		return nil, err
	}
	return &k8sClient, nil
}
