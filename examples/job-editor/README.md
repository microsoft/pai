# Launcher a jupyter job-editor

## Setup

You will need to figure out the ENVs below:

- PAI_USER_NAME: your_pai_user #your user name on PAI

## HDFS (optional)

In order to use hdfs in job-editor, you will need to figure the ENVs below:

- HDFS_FS_DEFAULT: hdfs://ip:9000/ #hdfs://hdfs_name_node_ip:hdfs_port/
- WEBHDFS_FS_DEFAULT: http://ip:5070/ #http://hdfs_name_node_ip:webhdfs_port/

## Run the jupyter job-editor on PAI

Using the config template below, **change** the `jobEnvs` according to your PAI config.

```json
{
  "jobName": "job-editor",
  "image": "docker.io/openpai/job-editor",
  "retryCount": 0,
  "jobEnvs": {
      "PAI_URL": "your_pai_cluster_url",
      "PAI_USER_NAME": "your_pai_user",
      "HDFS_FS_DEFAULT": "hdfs://your_hdfs_name_node_ip:9000/",
      "WEBHDFS_FS_DEFAULT": "http://your_hdfs_name_node_ip:5070/",
      "JUPYTER_TOKEN": "choose_your_jupyter_token"
  },
  "taskRoles": [
    {
      "name": "editor",
      "taskNumber": 1,
      "cpuNumber": 4,
      "memoryMB": 4096,
      "shmMB": 64,
      "gpuNumber": 1,
      "minFailedTaskCount": 1,
      "command": "bash -c /root/setup_hdfs.sh && start-notebook.sh --ip $JUPYTER_HOST_IP --port=$PAI_CONTAINER_HOST_jupyter_PORT_LIST --NotebookApp.token=${JUPYTER_TOKEN}",
      "portList": [
        {
          "label": "jupyter",
          "beginAt": 0,
          "portNumber": 1
        }
      ]
    }
  ]
}
```

Refer to the screenshots below.
![image](https://user-images.githubusercontent.com/1547343/48335823-d0119c80-e699-11e8-960a-1e6aa97d567e.png)
![image](https://user-images.githubusercontent.com/1547343/48335887-fc2d1d80-e699-11e8-89e4-b6b15a261cc3.png)
![image](https://user-images.githubusercontent.com/1547343/48335988-3eeef580-e69a-11e8-851a-5415a9aee8a6.png)

## Testing: Run the job-editor out of PAI

Correct the ENVs according to your cluster, then launcher the job-editor as below:

```bash
sudo docker run \
  --env "PAI_URL=your_pai_cluster_url" \
  --env "PAI_USER_NAME=your_pai_user" \
  --env "HDFS_FS_DEFAULT=hdfs://your_hdfs_name_node_ip:9000/" \
  --env "WEBHDFS_FS_DEFAULT=http://your_hdfs_name_node_ip:5070/" \
  -it \
  --network=host \
  openpai/job-editor
```