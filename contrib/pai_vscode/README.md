# OpenPAI VS Code Client

OpenPAI VS Code Client is an extension to connect OpenPAI clusters, submit AI jobs, simulate jobs locally, manage files, and so on.

- [OpenPAI VS Code Client](#openpai-vs-code-client)
  - [Connect to an OpenPAI cluster](#connect-to-an-openpai-cluster)
  - [Submit job](#submit-job)
  - [Local simulation](#local-simulation)
    - [Prerequisites](#prerequisites)
    - [Steps](#steps)
    - [Limitations](#limitations)
  - [Reference](#reference)
    - [GUI](#gui)
    - [Command Palette](#command-palette)
    - [PAI Cluster Explorer](#pai-cluster-explorer)
    - [Settings](#settings)
  - [Issue and suggestions](#issue-and-suggestions)
  - [Contribution](#contribution)
  - [License](#license)

## Connect to an OpenPAI cluster

Before using OpenPAI VS Code Client, follow below steps connecting to an OpenPAI cluster.

### Basic login

Notice, the version of OpenPAI cluster must equal or greater than 0.8.0, and the `authn_type` of the cluster should be `basic`.

1. Use shortcut key <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> to open command palette.
2. Input and look for *PAI: Add PAI Cluster* as below.

    ![add cluster](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/add_cluster.png)

3. Press <kbd>Enter</kbd>, and input the host of an OpenPAI cluster. It can be domain name or IP Address. After that, press <kbd>Enter</kbd> again.

    ![add cluster host](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/add_cluster_host.png)

4. A configuration file is opened, and username and password fields are needed at least. Once it completes, click *Finish* button at right bottom corner. Notice, it won't be effect, if you save and close the file directly.

    ![add cluster configuration](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/add-cluster-finish.png)

If there are multiple OpenPAI clusters, you can follow above steps again to connect with them.

### AAD login

Notice, the version of OpenPAI cluster must equal or greater than 0.14.0, and the `authn_type` of the cluster should be `OIDC`.

1. Use shortcut key <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> to open command palette.
2. Input and look for *PAI: Add PAI Cluster* as below.

    ![add cluster](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/add_cluster.png)

3. Press <kbd>Enter</kbd>, and input the host of an OpenPAI cluster. It can be domain name or IP Address. After that, press <kbd>Enter</kbd> again.

    ![add cluster host](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/add_cluster_host.png)

4. If the `authn_type` of the cluster is `OIDC`, a webside will be open and ask you to login, after that a configuration file is opened, and if your login was successful the username and token fields are auto filled, you can change it if needed. Once it completes, click *Finish* button at right bottom corner. Notice, it won't be effect, if you save and close the file directly.

    ![add cluster configuration](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/add_aad_cluster.gif)

If there are multiple OpenPAI clusters, you can follow above steps again to connect with them.

## Submit job

After added a cluster configuration, you can find the cluster in *PAI CLUSTER EXPLORER* pane as below.

![pai cluster explorer](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/pai_cluster_explorer.png)

Submit V1 job:

You can create a job configuration and submit to OpenPAI as below steps.

1. Make sure the value of `protocol_version` property in cluster configuration is `'1'`. Double click `Create Job Config...` in OpenPAI cluster Explorer, and then specify file name and location to create a job configuration file.
2. Update job configuration as needed. If you are not familiar with this configuration file, learn from [here](https://github.com/Microsoft/pai/blob/master/docs/user/training.md#learn-hello-world-job).
3. Right click on the created job configuration file, then click on `Submit Job to PAI Cluster`. The client will upload files to OpenPAI and create a job. Once it's done, there is a notification at right bottom corner, you can click to open the job detail page.

    If there are multiple OpenPAI clusters, you need to choose one.

    This animation shows above steps.
    ![submit job](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/submit-job.gif)

Submit V2 job:

You can create a job v2 configuration and submit to OpenPAI as below steps.

1. Make sure the value of `protocol_version` property in cluster configuration is `'2'`. Double click `Create Job Config...` in OpenPAI cluster Explorer, and then specify file name and location to create a job configuration file.
2. Update job configuration as needed. If you are not familiar with this configuration file, learn from [here](https://github.com/microsoft/pai/blob/master/docs/marketplace-and-submit-job-v2/marketplace-and-submit-job-v2.md#introduction-to-yaml-file).
3. Right click on the created job v2 configuration file, then click on `Submit Job to PAI Cluster`. The client will upload files to OpenPAI and create a job. Once it's done, there is a notification at right bottom corner, you can click to open the job detail page.

    If there are multiple OpenPAI clusters, you need to choose one.

    This animation shows above steps.
    ![submit job](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/submit-job-v2.gif)

## Local simulation

As it needs sometime to wait job starting in OpenPAI cluster, local simulation can help identifying and debugging most code, environment and configuration issues quickly.

### Prerequisites

[Docker](https://docs.docker.com/install/) MUST be installed to use local simulation.

### Steps

1. As submit a job, you can right click a configuration file to find local simulation.
2. Click *Simulate PAI Job Running*, after a while below notification shows.

    ![simulate running](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/simulate_running.png)

3. you can click on *Simulate first task in VS Code terminal* to simulate directly, or *Reveal in Explorer* to view created docker files and start simulation manually.

This animation shows above steps.
![simulate job](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/simulate-job.gif)

### Limitations

As local simulation is a close but still different environment with OpenPAI cluster, there are some issues cannot be found by simulation. Some examples,

- The job may need much more memory or distributed environments. It cannot be simulated locally.
- The job may need GPU, but local computer may not have one. It may need code logic to handle this situation. It also needs a different docker image if you are using TensorFlow. As TensorFlow has different package for GPU and non-GPU runtime.
- The job may run much more time locally. In most case, the computing power of local computer is much lower than servers in the OpenPAI cluster. If you need to simulate a job end-to-end, it may need to reduce iterations to get result faster.
- Local machine may not be able to access some storage. The OpenPAI cluster may be deployed in a private environment, so that local computer may not able to access resource of cluster.

## Reference

### GUI

The client has two GUI parts. First is the *PAI CLUSTER EXPLORER* in explorer and used in above introduction. Second can be opened by the icon in activity bar.

![activity bar](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/activity_bar.png)

There are two parts in the side bar.

- HDFS Explorer

    You can view, upload and download folder and files of the OpenPAI cluster storage.

- Job List

    You can view jobs in OpenPAI cluster. The lists refresh periodically, and the icon shows the status of each job. You can open a job in browser with double clicking it.

![job list](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/job-list.png)

### Command Palette

| Name                            | Description                               |
| ------------------------------- | ----------------------------------------- |
| PAI: Add PAI Cluster            | Add a new OpenPAI cluster                 |
| PAI: Open Website               | View OpenPAI cluster in browser           |
| PAI: Submit Job to PAI Cluster  | Submit an OpenPAI job                     |
| PAI: Create PAI Job Config File | Create an OpenPAI configuration file      |
| PAI: Simulate PAI Job Running   | Generate Docker file for local simulation |

### PAI Cluster Explorer

| Name                    | Description                                   |
| ----------------------- | --------------------------------------------- |
| Open Web Portal...      | Browse to OpenPAI's web portal                |
| List Jobs...            | Open PAI's job list page in VS Code           |
| Create Job Config...    | Create an OpenPAI configuration file          |
| Submit Job...           | Submit an OpenPAI job                         |
| Simulate Job Running... | Generate Docker file for local simulation     |
| Edit Configuration...   | Edit OpenPAI cluster configuration            |
| Open HDFS...            | Open HDFS storage explorer of OpenPAI cluster |

### Settings

| ID                               | Description                                             |
| -------------------------------- | ------------------------------------------------------- |
| pai.job.upload.enabled           | Whether will upload files to codeDir of configuration   |
| pai.job.upload.exclude           | Excluded files and folders for uploading                |
| pai.job.upload.include           | Included files and folders for uploading                |
| pai.job.generateJobName.enabled  | Whether add a random suffix to job name when submitting |
| pai.job.jobList.recentJobsLength | The number in *Recent Submitted Jobs from VS Code*      |
| pai.job.jobList.allJobsPageSize  | The page size of the *All Jobs* list                    |
| pai.job.jobList.refreshInterval  | The refresh interval of job list (in seconds)           |
| pai.hdfs.location                | Where HDFS storage will be shown                        |

## Issue and suggestions

Submit at [GitHub](https://github.com/Microsoft/pai/issues)

## Contribution

https://github.com/Microsoft/pai#how-to-contribute

## License

MIT
