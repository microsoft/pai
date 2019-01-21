# OpenPAI VS Code Client
[![Build Status](https://openpai.visualstudio.com/PAIexp/_apis/build/status/pai_vscode?branchName=master)](https://openpai.visualstudio.com/PAIexp/_build/latest?definitionId=9?branchName=master)

## Get Started
1. Run command 'PAI: Add PAI Cluster' from command palette (Ctrl+Shift+P)
2. Fill in username, password and other fields and press "finish" button.

![](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/add-cluster-finish.png)

3. Your cluster will be shown in PAI CLUSTER EXPLORER (at the bottom of VS Code's file explorer by default)
4. Expand the tree node and double click the command you like.

## Submit Job
1. Double click "Create Job Config..." to generate a PAI job config file.
2. Fill the created PAI job config JSON's command and job name fields.
3. Right click the created JSON file and select "Submit Job to PAI Cluster"
4. The job will be submitted to PAI cluster

## Commands
### Command Pallete
|Name|Description|
|-|-|
|PAI: Add PAI Cluster|Add a new cluster to PAI Cluster Explorer|
|PAI: Open Dashboard|Open dashboard pages in VS Code|
|PAI: Submit Job to PAI Cluster|Select a PAI job config file and submit it to PAI cluster|
|PAI: Create PAI Job Config File|Create an empty PAI job config file|
|PAI: Simulate PAI Job Running|Generate Dockerfile to simulate PAI job running|

### PAI Cluster Explorer
|Name|Description|
|-|-|
|Open Web Portal...|Open PAI's web portal page in VS Code (right click to open in browser)|
|List Jobs...|Open PAI's job list page in VS Code (right click to open in browser)|
|Create Job Config...|Create an empty PAI job config file|
|Submit Job...|Submit job to selected cluster|
|Simulate Job Running...|Generate Dockerfile to simulate PAI job running|
|Edit Configuration...|Edit cluster configuration|
|Open HDFS...|Open selected cluster's HDFS as a VS Code workspace folder|

## Settings
|ID|Description|
|-|-|
|pai.job.upload.enabled|Controls whether the extension will upload your project files to PAI job config's code dir automatically|
|pai.job.upload.exclude|Glob pattern for excluding files and folders|
|pai.job.upload.include|Glob pattern for including files and folders|
|pai.job.generateJobName.enabled|Controls whether the extension will add a random suffix to your job name when submitting job|

## Requirements
PAI Cluster Version >= 0.8.0

## Contributing
https://github.com/Microsoft/pai#how-to-contribute

## License
MIT