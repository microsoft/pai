# Autoscaler

Autoscaler is an independent tool to monitor the status of your PAI cluster and adjust the cluster size as needed. It will take into account the three levels of application (PAI, ITP, etc.), infrastructure (K8s), and cloud service (Azure, AWS, Aliyun, etc.) at the same time.

We have built a general auto-scaler structure, defined abstract classes for each part, and provided a default `OpenPaiSimpleScaler` for common use. If you are running a K8s-based PAI cluster on Azure VMs, just go through [Quick Start](#quick-start). To implement your own Autoscaler for other applications and cloud services, refer to [Autoscaler Structure](https://github.com/microsoft/pai/tree/master/contrib/autoscaler#3-structure).

# Quick Start

- Change directory to the autoscaler folder:

    ```bash
    cd contrib/autoscaler
    ```

- Create your config file:

    ```bash
    cp config_example.yaml config.yaml
    vim config.yaml
    ```

- Fill in necessary information about your PAI cluster:

    ```yaml
    pai_rest_server_uri: <URL to Your OpenPAI Rest Server>
    pai_bearer_token: <Bearer Token to Access Your OpenPAI Service>
    resource_group: <Name of Your Resource Group on Azure>
    ```

- Log in Azure

    ```bash
    az login
    ```

- Start Autoscaler in the background:

    ```bash
    nohup python3 ./scaler.py &!
    ```