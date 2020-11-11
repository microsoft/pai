# 使用VSCode扩展

[OpenPAI VS Code Client](https://github.com/microsoft/openpaivscode) 是一个VSCode扩展，用于连接OpenPAI集群、提交任务、本地模拟任务、管理文件等。请使用[这个页面上](https://github.com/microsoft/openpaivscode/releases) 发布的vsix文件来安装它。

## 连接OpenPAI集群

在使用OpenPAI VS Code Client之前，请按照以下步骤连接到OpenPAI集群。 如果您使用用户名和密码登录集群，则应遵循`在基础认证模式下登录`。 如果您使用AAD登录到群集， 请遵循`在AAD模式下登录`。

### 在基础认证模式下登录

1. 使用快捷键<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd>打开命令面板。
2. 如下所示，输入并查找 *PAI: Add PAI Cluster* ：

    ![add cluster](https://raw.githubusercontent.com/Microsoft/openpaivscode/0.3.0/assets/add_cluster.png)

3. 按 <kbd>Enter</kbd>, 然后输入OpenPAI集群的主机地址。 它可以是域名或IP地址。 之后，再次按 <kbd>Enter</kbd>。

    ![add cluster host](https://raw.githubusercontent.com/Microsoft/openpaivscode/0.3.0/assets/add_cluster_host.png)

4. 修改配置文件，至少需要添加用户名和密码字段。 完成后，单击右下角的`Finish`按钮。 请注意，如果直接保存并关闭文件，设置将不会生效。

    ![add cluster configuration](https://raw.githubusercontent.com/Microsoft/openpaivscode/0.3.0/assets/add-cluster-finish.png)

如果有多个OpenPAI集群，可以再次按照上述步骤进行添加。

### 在AAD模式下登录

1. 使用快捷键 <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> 打开命令面板。
2. 如下所示，输入并查找 *PAI: Add PAI Cluster* ：

    ![add cluster](https://raw.githubusercontent.com/Microsoft/openpaivscode/0.3.0/assets/add_cluster.png)

3. 按 <kbd>Enter</kbd>，然后输入OpenPAI集群的主机。它可以是域名或IP地址。之后，再次按 <kbd>Enter</kbd> 。

    ![add cluster host](https://raw.githubusercontent.com/Microsoft/openpaivscode/0.3.0/assets/add_cluster_host.png)

4. 程序会打开一个网站，并要求您登录。如果登录成功，程序会自动填充用户名和token字段。完成后，单击右下角的*Finish*按钮。请注意，如果直接保存并关闭文件，设置将不会生效。

    ![add cluster configuration](https://raw.githubusercontent.com/Microsoft/openpaivscode/0.3.0/assets/add_aad_cluster.gif)

如果有多个OpenPAI集群，可以再次按照上述步骤进行添加。

## 提交任务

添加集群配置后，您可以在*PAI CLUSTER EXPLORER* 窗格中找到集群，如下所示：

![pai cluster explorer](https://raw.githubusercontent.com/Microsoft/openpaivscode/0.3.0/assets/pai_cluster_explorer.png)

请按照以下步骤操作来提交任务Yaml文件：

1. 在*PAI CLUSTER EXPLORER*中双击`Create Job Config...`，然后指定文件名和位置以创建任务配置文件。
2. 根据需要更新任务配置。
3. 右键单击创建的任务配置文件，然后单击`Submit Job to PAI Cluster`。 客户端会将文件上传到OpenPAI并创建任务。 完成后，右下角会显示一条通知，您可以单击它来打开任务页面。

    在提交时，如果有多个OpenPAI集群，则需要选择一个。

    下面的动画展示了以上步骤：
    ![submit job](https://raw.githubusercontent.com/Microsoft/openpaivscode/0.3.0/assets/submit-job-v2.gif)


## 参考

  - [VSCode扩展的完整文档](https://github.com/microsoft/openpaivscode/blob/master/README.md): 请注意，此完整文档中提到了两种任务：V1和V2任务。 由于V1任务已弃用，因此您可以跳过有关V1任务的内容。
