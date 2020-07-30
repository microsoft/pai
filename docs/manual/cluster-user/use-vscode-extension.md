# Use VSCode Extension

1. [Quick Start](./quick-start.md)
2. [Docker Images and Job Examples](./docker-images-and-job-examples.md)
3. [How to Manage Data](./how-to-manage-data.md)
4. [How to Debug Jobs](./how-to-debug-jobs.md)
5. [Advanced Jobs](./advanced-jobs.md)
6. [Use Marketplace](./use-marketplace.md)
7. [Use VSCode Extension](./use-vscode-extension.md) (this document)
    - [Connect to an OpenPAI cluster](#connect-to-an-openpai-cluster)
    - [Submit job](#submit-job)
    - [Reference](#reference)
8. [Use Jupyter Notebook Extension](./use-jupyter-notebook-extension.md)


[OpenPAI VS Code Client](https://github.com/microsoft/openpaivscode) is a VSCode extension to connect OpenPAI clusters, submit AI jobs, simulate jobs locally, manage files, and so on. Please use the released vsix file on [this page](https://github.com/microsoft/openpaivscode/releases) to install it.

## Connect to an OpenPAI cluster

Before using OpenPAI VS Code Client, follow below steps connecting to an OpenPAI cluster. If you are using username and password to login to the cluster, then you should follow `Basic login`. If you are using AAD to login to the cluster, please follow `AAD login`.

### Basic login

1. Use shortcut key <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> to open command palette.
2. Input and look for *PAI: Add PAI Cluster* as below.

    ![add cluster](https://raw.githubusercontent.com/Microsoft/openpaivscode/0.3.0/assets/add_cluster.png)

3. Press <kbd>Enter</kbd>, and input the host of an OpenPAI cluster. It can be domain name or IP Address. After that, press <kbd>Enter</kbd> again.

    ![add cluster host](https://raw.githubusercontent.com/Microsoft/openpaivscode/0.3.0/assets/add_cluster_host.png)

4. A configuration file is opened, and username and password fields are needed at least. Once it completes, click *Finish* button at right bottom corner. Notice, it won't be effect, if you save and close the file directly.

    ![add cluster configuration](https://raw.githubusercontent.com/Microsoft/openpaivscode/0.3.0/assets/add-cluster-finish.png)

If there are multiple OpenPAI clusters, you can follow above steps again to connect with them.

### AAD login

1. Use shortcut key <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> to open command palette.
2. Input and look for *PAI: Add PAI Cluster* as below.

    ![add cluster](https://raw.githubusercontent.com/Microsoft/openpaivscode/0.3.0/assets/add_cluster.png)

3. Press <kbd>Enter</kbd>, and input the host of an OpenPAI cluster. It can be domain name or IP Address. After that, press <kbd>Enter</kbd> again.

    ![add cluster host](https://raw.githubusercontent.com/Microsoft/openpaivscode/0.3.0/assets/add_cluster_host.png)

4. If the `authn_type` of the cluster is `OIDC`, a webside will be open and ask you to login, after that a configuration file is opened, and if your login was successful the username and token fields are auto filled, you can change it if needed. Once it completes, click *Finish* button at right bottom corner. Notice, it won't be effect, if you save and close the file directly.

    ![add cluster configuration](https://raw.githubusercontent.com/Microsoft/openpaivscode/0.3.0/assets/add_aad_cluster.gif)

If there are multiple OpenPAI clusters, you can follow above steps again to connect with them.

## Submit job

After added a cluster configuration, you can find the cluster in *PAI CLUSTER EXPLORER* pane as below.

![pai cluster explorer](https://raw.githubusercontent.com/Microsoft/openpaivscode/0.3.0/assets/pai_cluster_explorer.png)

To submit a job yaml, please follow the steps below:

1. Double click `Create Job Config...` in OpenPAI cluster Explorer, and then specify file name and location to create a job configuration file.
2. Update job configuration as needed.
3. Right click on the created job configuration file, then click on `Submit Job to PAI Cluster`. The client will upload files to OpenPAI and create a job. Once it's done, there is a notification at right bottom corner, you can click to open the job detail page.

    If there are multiple OpenPAI clusters, you need to choose one.

    This animation shows above steps.
    ![submit job](https://raw.githubusercontent.com/Microsoft/openpaivscode/0.3.0/assets/submit-job-v2.gif)


## Reference

  - [Full documentation of VSCode Extension](https://github.com/microsoft/openpaivscode/blob/master/README.md): Please note two kinds of jobs are mentioned in this full documentation: V1 and V2 job. You can safely skip contents about V1 job since it is deprecated.
