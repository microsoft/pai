# Autoscaler

Autoscaler是独立的第三方工具，用于根据任务需求实时调整集群中工作结点的数量以节省不必要的开销。Autoscaler将同时在应用(如PAI、ITP等)、管理工具(K8s)和云服务(如Azure、AWS、阿里云等)三个层面上监视集群状态，并在需要时调用对应的命令行工具打开或关闭部分结点。

在通用逻辑的基础上，我们提供了一个基础的`OpenPaiSimpleScaler`。如果您在Azure集群上运行基于K8s的PAI集群，可以尝试[快速开始](#quick-start)。如果需要将Autoscaler运行在其他应用或其他云服务上，或实现更复杂的Autoscaler逻辑，请参考[Autoscaler的结构](https://github.com/microsoft/pai/tree/master/contrib/autoscaler#3-structure)。

# <div id="quick-start">快速开始</div>

- 进入`autoscaler`文件夹：

    ```bash
    cd contrib/autoscaler
    ```

- 创建配置文件：

    ```bash
    cp config_example.yaml config.yaml
    vim config.yaml
    ```

- 在配置文件中填写必要信息：

    ```yaml
    pai_rest_server_uri: <URL to Your OpenPAI Rest Server>
    pai_bearer_token: <Bearer Token to Access Your OpenPAI Service>
    resource_group: <Name of Your Resource Group on Azure>
    ```

- 登入Azure：

    ```bash
    az login
    ```

- 在后台启动Autoscaler:

    ```bash
    nohup python3 ./scaler.py &!
    ```