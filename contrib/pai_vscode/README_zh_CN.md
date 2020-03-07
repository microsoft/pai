# OpenPAI VS Code Client

OpenPAI VS Code Client 是一个 Visual Studio Code 的扩展组件，可以连接 OpenPAI 集群，提交 Job，在本地模拟运行 Job，管理文件等等。

- [OpenPAI VS Code Client](#openpai-vs-code-client)
  - [连接到 OpenPAI 集群](#%e8%bf%9e%e6%8e%a5%e5%88%b0-openpai-%e9%9b%86%e7%be%a4)
  - [提交 Job](#%e6%8f%90%e4%ba%a4-job)
  - [本机模拟](#%e6%9c%ac%e6%9c%ba%e6%a8%a1%e6%8b%9f)
    - [先决条件](#%e5%85%88%e5%86%b3%e6%9d%a1%e4%bb%b6)
    - [步骤](#%e6%ad%a5%e9%aa%a4)
    - [局限性](#%e5%b1%80%e9%99%90%e6%80%a7)
  - [任务代码自动上传](#%e4%bb%bb%e5%8a%a1%e4%bb%a3%e7%a0%81%e8%87%aa%e5%8a%a8%e4%b8%8a%e4%bc%a0)
  - [参考](#%e5%8f%82%e8%80%83)
    - [GUI](#gui)
    - [命令面板](#%e5%91%bd%e4%bb%a4%e9%9d%a2%e6%9d%bf)
    - [PAI 集群浏览器](#pai-%e9%9b%86%e7%be%a4%e6%b5%8f%e8%a7%88%e5%99%a8)
    - [设置](#%e8%ae%be%e7%bd%ae)
  - [问题和建议](#%e9%97%ae%e9%a2%98%e5%92%8c%e5%bb%ba%e8%ae%ae)
  - [贡献](#%e8%b4%a1%e7%8c%ae)
  - [许可证](#%e8%ae%b8%e5%8f%af%e8%af%81)

## 连接到 OpenPAI 集群

使用 OpenPAI VS Code Client 之前，按照以下步骤连接到 OpenPAI 集群。

注意， OpenPAI 集群的版本必须大于或等于 0.8.0。

1. 使用快捷键 <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> 打开命令面板。
2. 如下输入并查找 *PAI: 添加 PAI 集群*。
  
      ![添加集群](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/add_cluster.png)
      

3. 按下 <kbd>Enter</kbd>，并输入 OpenPAI 集群的地址。 可以是域名或者 IP 地址。 然后，再次按下 <kbd>Enter</kbd>。
  
      ![添加集群](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/add_cluster.png)
      

4. 配置文件将会被打开，至少需要填入 username 和 password 字段。 完成后，点击右下角的 *完成* 按钮。 注意，如果直接保存并关闭文件，则无法生效。
  
      ![添加集群配置](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/add-cluster-finish.png)
      

如果有多个 OpenPAI 集群，可以多次按照上述步骤进行。

## 提交 Job

添加完集群配置后，可以在*PAI 集群浏览器* 面板找到该集群。

![pai cluster explorer](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/pai_cluster_explorer.png)

提交 v2 Job (OpenPAI >= v0.13.0)：

可通过以下步骤创建 v2 Job 配置，并提交到 OpenPAI。

1. 创建 Job 配置文件:
    1. 在 `PAI 集群浏览器` 中双击 `创建任务配置文件...`, 并指定文件名和路径来创建 Job 配置文件(请确保集群配置中的 `protocol_version` 属性的值为 `'2'`)。
    2. 在 `VSCode 资源管理器` 中右击 python 或 cntk 文件，并选取 `创建 PAI 任务配置文件 V2`, 并指定文件名和路径来创建 Job 配置文件。
2. 根据需要更新 Job 配置。 如果不熟悉配置文件，可参考[这里](https://github.com/microsoft/pai/blob/master/docs/zh_CN/marketplace-and-submit-job-v2/marketplace-and-submit-job-v2.md#introduction-to-yaml-file)。
3. 右击创建的 Job v2 配置文件，然后点击 `在 PAI 集群上提交任务`。 客户端会将文件上传到 OpenPAI 并创建 Job。 完成后，在右下角会有通知，可点击打开 Job 详情页面。
  
      如果有多个 OpenPAI 集群，需要选择其中一个。
      
      此动画显示了上述步骤。
      ![提交 Job](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/submit-job-v2.gif)

提交 v1 Job (deprecating, OpenPAI < 0.13.0)：

可通过以下步骤创建 Job 配置，并提交到 OpenPAI。

1. 创建 Job 配置文件：
    1. 在 `PAI 集群浏览器` 中双击 `创建任务配置文件...`, 并指定文件名和路径来创建 Job 配置文件(请确保集群配置中的 `protocol_version` 属性的值为 `'1'`)。
    2. 在 `VSCode 资源管理器` 中右击 python 或 cntk 文件，并选取 `创建 PAI 任务配置文件 V1`, 并指定文件名和路径来创建 Job 配置文件。
2. 根据需要更新 Job 配置。 如果不熟悉配置文件，可参考[这里](https://github.com/Microsoft/pai/blob/master/docs/zh_CN/user/training.md)。
3. 右击创建的 Job 配置文件，然后点击 `Submit Job to PAI Cluster`。 客户端会将文件上传到 OpenPAI 并创建 Job。 完成后，在右下角会有通知，可点击打开 Job 详情页面。
  
      如果有多个 OpenPAI 集群，需要选择其中一个。
      
      此动画显示了上述步骤。
      ![提交 Job](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/submit-job.gif)
      

## 本机模拟

在 OpenPAI 集群中运行 Job 需要额外花费一些时间，因此在本机模拟可以更快的找到代码，以及环境和配置的问题。

### 先决条件

必须安装 [Docker](https://docs.docker.com/install/) 才能使用本机模拟。

### 步骤

1. 与提交 Job 一样，可右击配置文件来找到本机模拟功能。
2. 点击 *Simulate PAI Job Running*，过一小会儿，就会看到如下的通知。
  
      ![simulate running](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/simulate_running.png)
      

3. 可点击 *Simulate first task in VS Code terminal* 直接模拟运行，或点击 *Reveal in Explorer* 来查看创建的 Docker 文件，并手动运行模拟。

此动画显示了上述步骤。 ![simulate job](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/simulate-job.gif)

### 局限性

本机模拟与在 OpenPAI 集群中运行相近，但仍有些区别，因此有些问题无法通过模拟来发现。 比如：

- Job 可能需要大量的内存或分布式的环境。 无法在本机进行模拟。
- Job 可能需要 GPU，但本机可能没有。 同时，可能需要更多的代码逻辑来处理这种情况。 如果使用 TensorFlow，可能还需要不同的 Docker 映像。 这是因为 TensorFlow 在 GPU 和非 GPU 场景下需要不同的运行包。
- Job 可能会在本地运行很长的时间。 在大多数情况下，本机的算力都远低于 OpenPAI 集群中的服务器。 如果需要端到端的模拟 Job，则需要减少迭代次数来更快的获得结果。
- 本机可能无法访问一些存储。 OpenPAI 集群有可能部署在私有环境中，因此本机可能无法访问一些集群的存储。

## 任务代码自动上传

请参考 [Auto Upload](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/documentation/storage_explorer_and_auto_upload.md#Auto-Upload).

## 参考

### GUI

客户端有两部分用户界面。 首先是资源管理器中的 *PAI CLUSTER EXPLORER*，在上述章节已介绍过。 可通过活动栏中图标打开第二部分。

![activity bar](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/activity_bar.png)

打开后可看到两个部分。

- 存储浏览器 (PAI > 0.14.0)
  
    请参考 [Storage Explorer](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/documentation/storage_explorer_and_auto_upload.md#Storage-Explorer).

- HDFS 浏览器 (PAI <= 0.14.0)
  
      可查看、上传或下载 OpenPAI 集群存储中的文件。
      
- PAI 任务列表
  
      可查看 OpenPAI 集群中的 Job。 列表会定期刷新，前面的图标显示了 Job 的状态。 可双击 Job 在浏览器中查看。
      
![job list](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/job-list.png)

### 命令面板

| 名称                              | 说明                  |
| ------------------------------- | ------------------- |
| PAI: Add PAI Cluster            | 添加新的 OpenPAI 集群     |
| PAI: Open Website               | 在浏览器中查看 OpenPAI 集群  |
| PAI: Submit Job to PAI Cluster  | 提交 OpenPAI Job      |
| PAI: Create PAI Job Config File | 创建 OpenPAI 配置文件     |
| PAI: Simulate PAI Job Running   | 生成 Docker 文件并进行本机模拟 |

### PAI 集群浏览器

| 名称                      | 说明                        |
| ----------------------- | ------------------------- |
| Open Web Portal...      | 浏览 OpenPAI 的门户网站          |
| List Jobs...            | 列出 Job                    |
| Create Job Config...    | 创建 OpenPAI 配置文件           |
| Submit Job...           | 提交 OpenPAI Job            |
| Simulate Job Running... | 生成 Docker 文件并进行本机模拟       |
| Edit Configuration...   | 编辑 OpenPAI 集群配置           |
| Open HDFS...            | 打开 OpenPAI 集群的 HDFS 存储管理器 |

### 设置

| 标识                               | 说明                                         |
| -------------------------------- | ------------------------------------------ |
| pai.job.upload.enabled           | 是否将文件上载到配置的 codeDir                        |
| pai.job.upload.exclude           | 上载时排除的文件和文件夹                               |
| pai.job.upload.include           | 上载时包含的文件和文件夹                               |
| pai.job.generateJobName.enabled  | 是否在提交时为 Job 名称添加随机后缀                       |
| pai.job.jobList.recentJobsLength | *Recent Submitted Jobs from VS Code* 显示的数量 |
| pai.job.jobList.allJobsPageSize  | *All Jobs* 的页面条数                           |
| pai.job.jobList.refreshInterval  | Job 列表的刷新间隔（秒）                             |
| pai.hdfs.location                | 显示 HDFS 存储的位置                              |

## 问题和建议

提交到 [GitHub](https://github.com/Microsoft/pai/issues)

## 贡献

https://github.com/microsoft/pai/blob/master/README_zh_CN.md#参与贡献

## 许可证

MIT
