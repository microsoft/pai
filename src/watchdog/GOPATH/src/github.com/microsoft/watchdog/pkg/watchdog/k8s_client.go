package watchdog

import (
	"os"

	fc "github.com/microsoft/frameworkcontroller/pkg/apis/frameworkcontroller/v1"
	frameworkClient "github.com/microsoft/frameworkcontroller/pkg/client/clientset/versioned"
	v1 "k8s.io/api/core/v1"
	shedulev1 "k8s.io/api/scheduling/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/klog"

	"k8s.io/client-go/rest"

	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
)

const kubeAPIServerAddress = "KUBE_APISERVER_ADDRESS"

type kubeClientInterface interface {
	kubernetes.Interface
	RESTClient() rest.Interface
}

// K8sClient used to query k8s api server
type K8sClient struct {
	kClient kubeClientInterface
	fClient frameworkClient.Interface
	config  *rest.Config
}

func (c *K8sClient) initK8sClient() error {
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
	c.kClient, err = kubernetes.NewForConfig(kConfig)
	if err != nil {
		klog.Errorf("Failed to init kube client")
		return err
	}
	c.fClient, err = frameworkClient.NewForConfig(kConfig)
	if err != nil {
		klog.Error("Failed to create framework client")
	}
	return err
}

func (c *K8sClient) listPods() (*v1.PodList, error) {
	return c.kClient.CoreV1().Pods("").List(metav1.ListOptions{})
}

func (c *K8sClient) getServerHealth() (string, error) {
	resp := c.kClient.RESTClient().Get().Suffix("healthz").Do()
	err := resp.Error()
	if resp.Error() != nil {
		return "", err
	}
	body, _ := resp.Raw()
	return string(body), nil
}

func (c *K8sClient) listNodes() (*v1.NodeList, error) {
	return c.kClient.CoreV1().Nodes().List(metav1.ListOptions{})
}

func (c *K8sClient) listPriorityClasses() (*shedulev1.PriorityClassList, error) {
	return c.kClient.SchedulingV1().PriorityClasses().List(metav1.ListOptions{})
}

func (c *K8sClient) deletePriorityClass(name string) error {
	return c.kClient.SchedulingV1().PriorityClasses().Delete(name, nil)
}

func (c *K8sClient) listSecrets(namespace string) (*v1.SecretList, error) {
	return c.kClient.CoreV1().Secrets(namespace).List(metav1.ListOptions{})
}

func (c *K8sClient) deleteSecret(namespace string, name string) error {
	return c.kClient.CoreV1().Secrets(namespace).Delete(name, nil)
}

func (c *K8sClient) listFrameworks(namespace string) (*fc.FrameworkList, error) {
	return c.fClient.FrameworkcontrollerV1().Frameworks(namespace).List(metav1.ListOptions{})
}

func (c *K8sClient) getAPIServerHostName() string {
	return c.config.Host
}

// NewK8sClient used to create k8s instance
func NewK8sClient() (*K8sClient, error) {
	k8sClient := K8sClient{}
	err := k8sClient.initK8sClient()
	if err != nil {
		return nil, err
	}
	return &k8sClient, nil
}
