# Use VSCode Extension

[OpenPAI VS Code Client](https://github.com/microsoft/openpaivscode) is a VSCode extension to connect OpenPAI clusters, submit AI jobs, simulate jobs locally, manage files, and so on. Please use the released vsix file on [this page](https://github.com/microsoft/openpaivscode/releases) to install it.

## Connect to an OpenPAI cluster

Before using OpenPAI VS Code Client, follow these steps to connect to an OpenPAI cluster. If you are using a username and password to login into the cluster, then you should follow `Basic login`. If you are using AAD to login to the cluster, please follow `AAD login`.

### Basic login

1. Use shortcut key <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> to open command palette.
2. Input and look for *PAI: Add PAI Cluster* as below.

    ![add cluster](https://raw.githubusercontent.com/Microsoft/openpaivscode/0.3.0/assets/add_cluster.png)

3. Press <kbd>Enter</kbd>, and input the host of an OpenPAI cluster. It can be domain name or IP Address. After that, press <kbd>Enter</kbd> again.

    ![add cluster host](https://raw.githubusercontent.com/Microsoft/openpaivscode/0.3.0/assets/add_cluster_host.png)

4. A configuration file is opened, and the username and password fields are needed at least. Once it completes, click the *Finish* button at the bottom right corner. Notice, the settings will not take effect if you save and close the file directly.

    ![add cluster configuration](https://raw.githubusercontent.com/Microsoft/openpaivscode/0.3.0/assets/add-cluster-finish.png)

If there are multiple OpenPAI clusters, you can follow the above steps again to connect with them.

### AAD login

1. Use shortcut key <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> to open command palette.
2. Input and look for *PAI: Add PAI Cluster* as below.

    ![add cluster](https://raw.githubusercontent.com/Microsoft/openpaivscode/0.3.0/assets/add_cluster.png)

3. Press <kbd>Enter</kbd>, and input the host of an OpenPAI cluster. It can be domain name or IP Address. After that, press <kbd>Enter</kbd> again.

    ![add cluster host](https://raw.githubusercontent.com/Microsoft/openpaivscode/0.3.0/assets/add_cluster_host.png)


4. If the `authn_type` of the cluster is `OIDC`, a website will be open and ask you to log in. If your login was successful, the username and token fields are auto-filled, and you can change them if needed. Once it completes, click the *Finish* button at the bottom right corner. Notice, the settings will not take effect if you save and close the file directly.

    ![add cluster configuration](https://raw.githubusercontent.com/Microsoft/openpaivscode/0.3.0/assets/add_aad_cluster.gif)

If there are multiple OpenPAI clusters, you can follow the above steps again to connect with them.

## Submit jobs

After added a cluster configuration, you can find the cluster in the *PAI CLUSTER EXPLORER* pane as below.

![pai cluster explorer](https://raw.githubusercontent.com/Microsoft/openpaivscode/0.3.0/assets/pai_cluster_explorer.png)

To submit a job config YAML file, please follow the steps below:

1. Double-click `Create Job Config...` in OpenPAI cluster Explorer, and then specify file name and location to create a job configuration file.
2. Update job configuration as needed.
3. Right-click on the created job configuration file, then click on `Submit Job to PAI Cluster`. The client will then upload files to OpenPAI and create a job. Once it's done, there is a notification at the bottom right corner, you can click to open the job detail page.


    If there are multiple OpenPAI clusters, you need to choose one.

    This animation shows the above steps.
    ![submit job](https://raw.githubusercontent.com/Microsoft/openpaivscode/0.3.0/assets/submit-job-v2.gif)


## Reference

  - [Full documentation of VSCode Extension](https://github.com/microsoft/openpaivscode/blob/master/README.md): Please note two kinds of jobs are mentioned in this full documentation: V1 and V2 job. You can safely skip contents about the V1 job since it is deprecated.
