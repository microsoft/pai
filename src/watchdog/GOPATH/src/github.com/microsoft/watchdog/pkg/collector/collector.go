package collector

import (
	"os"

	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
)

const kubeAPIServerAddress = "KUBE_APISERVER_ADDRESS"

// K8sCollector is a collector
type K8sCollector struct {
	client *kubernetes.Clientset
}

func (c *K8sCollector) InitK8sCollector() {
	var apiServerAddress = os.Getenv(kubeAPIServerAddress)
	if len(apiServerAddress) > 0 {
		kConfig, error := clientcmd.BuildConfigFromFlags(apiServerAddress, "")
	}
}
