# OpenPAI VS Code Client

OpenPAI Client is an extension to connect PAI clusters, submit AI jobs, and manage files on HDFS.

## Get Started

1. Run command 'PAI: Add PAI Cluster' from command palette (Ctrl+Shift+P)
2. Fill in username, password and other fields and press "finish" button.

![](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/add-cluster-finish.png)

3. Your cluster will be shown in PAI CLUSTER EXPLORER (at the bottom of VS Code's file explorer by default)
4. Expand the tree node and double click the command you like.

## Submit Job

The extension uses a job config file (in json format) to describe a traing job. You can create multiple job config files for your code so that you can choose proper settings upon job submission.

1. Generate a PAI job config file by:
    
    - Double click "Create Job Config..."
    
    or
    
    - Right click a source code file and click "Create PAI Job Config JSON"
2. Fill the created PAI job config JSON's command and job name fields.
3. Right click the created JSON file and select "Submit Job to PAI Cluster"
4. The job will be submitted to PAI cluster

![](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/submit-job.gif)

## Simulate Job Running

The extension has a useful feature called "Simulate Job Running". It enables the users to run and debug their AI jobs in local environment without really submitting the job to PAI cluster. This is helpful when the users want to verify the docker image, start up command, and the code quickly.

1. Right click a job config file and click "Simulate PAI Job Running" The extension will prepare necessary files and create a docker file in local folder for later use.
2. A message box pops up, users have two options:
    
    - Simulate first task in VS Code terminal
    
    This will execute the simulation command within VS Code terminal window.
    
    - Reveal in Explorer
    
    This will pops up the OS's file explorer and navigates to the simulation folder. Users can manually execute the simulation command. (run-docker.cmd on Windows, or run-docker.sh on Linux).

![](https://raw.githubusercontent.com/Microsoft/pai/master/contrib/pai_vscode/assets/simulate-job.gif)

## Commands

### Command Pallete

| Name                            | Description                                               |
| ------------------------------- | --------------------------------------------------------- |
| PAI: Add PAI Cluster            | Add a new cluster to PAI Cluster Explorer                 |
| PAI: Open Dashboard             | Open dashboard pages in VS Code                           |
| PAI: Submit Job to PAI Cluster  | Select a PAI job config file and submit it to PAI cluster |
| PAI: Create PAI Job Config File | Create an empty PAI job config file                       |
| PAI: Simulate PAI Job Running   | Generate Dockerfile to simulate PAI job running           |

### PAI Cluster Explorer

| Name                    | Description                                                            |
| ----------------------- | ---------------------------------------------------------------------- |
| Open Web Portal...      | Open PAI's web portal page in VS Code (right click to open in browser) |
| List Jobs...            | Open PAI's job list page in VS Code (right click to open in browser)   |
| Create Job Config...    | Create an empty PAI job config file                                    |
| Submit Job...           | Submit job to selected cluster                                         |
| Simulate Job Running... | Generate Dockerfile to simulate PAI job running                        |
| Edit Configuration...   | Edit cluster configuration                                             |
| Open HDFS...            | Open selected cluster's HDFS as a VS Code workspace folder             |

## Settings

| ID                              | Description                                                                                              |
| ------------------------------- | -------------------------------------------------------------------------------------------------------- |
| pai.job.upload.enabled          | Controls whether the extension will upload your project files to PAI job config's code dir automatically |
| pai.job.upload.exclude          | Glob pattern for excluding files and folders                                                             |
| pai.job.upload.include          | Glob pattern for including files and folders                                                             |
| pai.job.generateJobName.enabled | Controls whether the extension will add a random suffix to your job name when submitting job             |

## Requirements

PAI Cluster Version >= 0.8.0

## Contributing

https://github.com/Microsoft/pai#how-to-contribute

**Report an issue**:

If you have issue/ bug/ new feature request, please submit it at [GitHub](https://github.com/Microsoft/pai/issues)

## License

MIT