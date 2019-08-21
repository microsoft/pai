# How to setup report script

Many OpenPai cluster admins are interested in how is cluster usage and performance, who used the most/least resources, etc. Developers of OpenPai system are interested in what causes job failure, how to design and implment a system that can prevent such failure and avoid wasting cluster resources.

But since not everyone is interested in this report, we do not maintain such a service, and merely provide a script for admins who interested in the report to execute. This document will provide informations about what the script will report, and how to maintain and query the result.

## What the script will report

The report consists of 4 reports `job`, `alert`, `raw_job` and `gpu`.

### job

This report will tell you uses' job statistic, this including the final status, job count and job resources, it have following columns:

* user: username in OpenPai cluster
* vc: VC name in OpenPai cluster
* total job info: sum of all jobs
* successful job info: those finished and exit code is 0
* failed job info: those finished and exit code is not 0
* stopped job info: those stopped by user
* running job info: those running
* waiting job info: those waiting

The job info is group of following subcolumns:

* count: job count of this category
* elapsed time: job running time of this category
* cpu second: how much vcore-second used by jobs of this category
* memory second: how much memory(GB)-second used by jobs of this category
* gpu second: how much gpu-second used by jobs of this category

### alert

This report will tell you what alerts was triggered in your cluster, the script can generate this report even if you didn't set an alert manager. Because the Prometheus service will delete data that's old enough, in default setup, it only retains 15 days of data, you may want to extend the retaintion date if you want an accurate number in montly report.

It have following columns:

* alert name: alert name defined in prometheus
* host_ip: from which node this alert was triggered
* source: the actual component in problem(have different meanings in different alert)
* start: start time of this alert
* durtion: how much time(seconds) this alert lasts
* labels: original label sent along with alert

### raw_job

This report is a detailed job info, the `job.csv` can be deemed as aggreated statistic of this report.

The report have following columns:

* user: username in OpenPai cluster
* vc: VC name in OpenPai cluster
* job name: job name in OpenPai cluster
* start time: when the job got started
* finished time: when the job finished, if the job is still running, this will have value `1970/01/01`
* waiting time: how much time(second) this job is in waiting status before running, this include waiting time of the retries. If the job is still running, this will have value 0
* running time: how much time this job is in running status, this include retries
* retries: the retry count of this job
* status: the status of the job, it could be `WAITING`, `RUNNING`, `SUCCEEDED`, `STOPPED`, `FAILED` and `UNKNOWN`
* exit code: the exit code of the job, if the job is still in running, it will be value `N/A`
* cpu allocated: how many vcore allocated to the job, this include the vcore allocated to app master
* memory allocated: how much memory(GB) allocated to the job, this include the memory allocated to app master
* max memory usage: maximum memory(GB) usage of this job, it will have value of `N/A` if Pai did not have record of memory usage, maybe due to running time of job is too short or system error
* gpu allocated: how many gpu card allocated to the job

### gpu

This report is about all gpu util info in cluster.

The report have following columns:

* host_ip: where this gpu installed
* gpu_id: gpu minor number in the node
* avg: avg utils during the report time frame

## Prerequisite

You should prepare a node that have access to OpenPai services, the script will need to access hadoop-resource-manager, framework-launcher and Prometheus deployed by OpenPai. This node do not need to have much memory resource and do not need to have GPU cards. You only need to make sure this node will not restart frequently. Usually the master node of the OpenPai cluster is a good choice.

After you choose a node, please make sure you have following software installed:

* python3
* requests library
* flask library

If your node is ubuntu node, you can install these software using following commands:

```sh
sudo apt-get install -y python3 python3-pip
pip3 install -r $PAI_DIR/src/tools/reports_requirements.txt
```

## How to Setup

[脚本](../../../src/tools/reports.py)有三个操作，`refresh`, `report` 和 `serve`。

The `refresh` action will tries to collect data from hadoop-resource-manager and framework-launcher, and save the data in sqlite3 DB for future process. The script needs to save data because hadoop-resource-manager will not retain job info too long, if we do not fetch them and save somewhere, we will not be able to generate correct report. We recommend admin run this script every 10 minutes using CRON job.

The `report` action will query data about vc usage and job statistic from sqlite3 DB and generate vc/job/raw_job/gpu csv files, it will also get data from Prometheus to generate alert reports. You can execute this action whenever you want the reports.

The `serve` action will start a http server so outside world can query report through web server instead of using files.

Both `serve` and `report` will need `refresh` being called periodically to fetch data from underlaying source.

首先登录到节点中，将[脚本](../../../src/tools/reports.py)上传的某处，例如：`/home/core/report`，使用命令编辑 crontab

```sh
crontab -e
```

It will prompt an editor with some documentation, you will need to paste following content at the end of the file

```crontab
*/10 * * * * python3 /home/core/report/reports.py refresh -y $yarn_url -p $prometheus_url -l $launcher_url -d /home/core/report/cluster.sqlite >> /home/core/report/cluster.log 2>&1
```

Please replace `$yarn_url`, `$prometheus_url` and `$launcher_url` with your cluster value, they are should be like `http://$master:8088`, `http://$master:9091` and `http://$master:9086` respectively where `$master` is the IP/hostname of your OpenPai master, please also make sure they are in one line. It is a good practice to execute the command before put into crontab.

After finished, you should save and exit the editor. You can then execute

```sh
crontab -l
```

to view your current crontab. It should showing what you edited.

All available arguments and meanings can be viewed by executing script with `-h` arguments.

The script will automatically delete old data, by default, it will retain 6 months of data. If this is too large for you, for example, if you only want to retain 1 months of data, you can add `-r 31` to above command to tell script delete data that's older than 31 days.

You have two options to get report: `report` or `serve` action.

### `report`

Whenever you want an report, you can log into that node again and execute following command

```sh
python3 /home/core/report/reports.py report -y $yarn_url -p $prometheus_url -l $launcher_url -d /home/core/report/cluster.sqlite
```

By default, the script will generate a monthly report, which means it will query data from one month ago until now and use these data to generate the reports, you can change the time range using `--since` and `--until` argument, for example, if you want the reports from one month ago and until one week ago, you can add these arguments:

```sh
--since `date --date='-1 month' +"%s"` --until `date --date='-1 week' +"%s"`
```

### `serve`

Some external tools can query http server directly, so you can start serve process and issue http request when you want a report, without having to login node and execute a command.

To setup serve process, execute following command

```sh
nohup python3 /home/core/report/reports.py serve -y $yarn_url -p $prometheus_url -l $launcher_url -d /home/core/report/cluster.sqlite > serve.log 2> serve.err.log &
```

This will start a process in background and listen to default 10240 port, you can specify `--port` argument to change default port.

With http server setup, you can now get those reports with the same name of csv file like:

    http://$IP:10240/job
    http://$IP:10240/raw_job
    http://$IP:10240/alert
    http://$IP:10240/gpu
    

These end point all accept `span` argument, you can provide with value: `day`, `week` or `month`, which will generate report in that time span. The default span is week. This will get jobs finished during this time or is still running.