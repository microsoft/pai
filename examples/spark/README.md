# Spark on PAI

This example demonstrate howto run Spark job on PAI.

## 1. Off-the-shelf example

### 1. Submit your Spark application

Below is a job config running the `SparkPi` Java example on PAI.

Note: Replace the `YOUR_PAI_MASTER_IP` with your own, before submitting the job on PAI. If you want to quit after Spark job finished, change `minSucceededTaskCount` to `1`.

```json
{
  "jobName": "spark-example",
  "image": "openpai/spark-example",
  "virtualCluster": "default",
  "retryCount": 0,
  "taskRoles": [
    {
      "name": "submitter",
      "taskNumber": 1,
      "cpuNumber": 1,
      "memoryMB": 2048,
      "shmMB": 64,
      "gpuNumber": 0,
      "minFailedTaskCount": 1,
      "minSucceededTaskCount": null,
      "command": "spark-submit --conf spark.eventLog.enabled=true --conf spark.history.fs.logDirectory=hdfs://YOUR_PAI_MASTER_IP:9000/shared/spark-logs --conf spark.eventLog.dir=hdfs://YOUR_PAI_MASTER_IP:9000/shared/spark-logs --class org.apache.spark.examples.SparkPi --master yarn --deploy-mode cluster --driver-memory 1g --executor-memory 2g --executor-cores 1 --queue default ${SPARK_HOME}/examples/jars/spark-examples*.jar 10",
      "portList": []
    },
    {
      "name": "spark_history_server",
      "taskNumber": 1,
      "cpuNumber": 1,
      "memoryMB": 1024,
      "shmMB": 64,
      "gpuNumber": 0,
      "minFailedTaskCount": 1,
      "minSucceededTaskCount": null,
      "command": "URL=http://${PAI_CURRENT_CONTAINER_IP}:${PAI_CONTAINER_HOST_history_server_PORT_LIST}/ && echo Please visit spark histroy server: ${URL} && SPARK_DAEMON_JAVA_OPTS=\"-Dspark.history.ui.port=${PAI_CONTAINER_HOST_history_server_PORT_LIST} -Dspark.history.fs.logDirectory=hdfs://YOUR_PAI_MASTER_IP:9000/shared/spark-logs -Dspark.eventLog.enabled=true -Dspark.eventLog.dir=hdfs://YOUR_PAI_MASTER_IP:9000/shared/spark-logs\" spark-class org.apache.spark.deploy.history.HistoryServer",
      "portList": [
        {
          "label": "history_server",
          "beginAt": 0,
          "portNumber": 1
        }
      ]
    }
  ]
}
```

### 2. Visit Spark history server

Your job look like below, key info is marked on red font.
![job](https://user-images.githubusercontent.com/1547343/43951079-b981c892-9cc4-11e8-8eeb-dc28a0ac0950.png)

As the previous image indicated, you can visit the Spark history server on <http://10.151.40.228:15692/>.
![history_server](https://user-images.githubusercontent.com/1547343/43951284-55719106-9cc5-11e8-92db-d0d228e547b1.png)

## 2. Run your python application

For python application, you will need to manage dependencies carefully. In the example below, we provide the dependency using `--py-files` parameter.

### 1. Prepare your data and code

Upload `sample_libsvm_data.txt` and `gradient_boosted_tree_classifier_example.py` to hdfs:

```sh
hdfs dfs -mkdir -p hdfs://YOUR_PAI_MASTER_IP:9000/user/core/data/mllib/
hdfs dfs -put sample_libsvm_data.txt hdfs://YOUR_PAI_MASTER_IP:9000/user/core/data/mllib/

hdfs dfs -mkdir -p hdfs://YOUR_PAI_MASTER_IP:9000/user/core/code
hdfs dfs -put gradient_boosted_tree_classifier_example.py hdfs://YOUR_PAI_MASTER_IP:9000/user/core/code/
```

### 2. Generate your dependencies with `conda env`

First, install conda.

```sh
sudo apt update --yes
sudo apt upgrade --yes

# Get Miniconda and make it the main Python interpreter
wget https://repo.continuum.io/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ~/miniconda.sh
bash ~/miniconda.sh -b -p ~/miniconda
rm ~/miniconda.sh

```

Then create an `spark-python` env, with `python3`, `numpy` installed.

```sh
conda create -n spark-python --copy -y -q python=3 numpy
```

At last, zip and ship your dependencies.

```sh
cd /YOUR_CONDA_HOME/envs
zip -r spark-python.zip spark-python
hdfs dfs -put spark-python.zip hdfs://YOUR_PAI_MASTER_IP:9000/user/core/
```

### 3. Submit job on PAI

Note: Replace the `YOUR_PAI_MASTER_IP` with your own, before submitting the job on PAI. If you want to quit after Spark job finished, change `minSucceededTaskCount` to `1`.

```json
{
  "jobName": "spark-python-example",
  "image": "openpai/spark-example",
  "dataDir": "hdfs://YOUR_PAI_MASTER_IP:9000/user/core/data/mllib/",
  "codeDir": "hdfs://YOUR_PAI_MASTER_IP:9000/user/core/code",
  "virtualCluster": "default",
  "retryCount": 0,
  "taskRoles": [
    {
      "name": "submitter",
      "taskNumber": 1,
      "cpuNumber": 1,
      "memoryMB": 2048,
      "shmMB": 64,
      "gpuNumber": 0,
      "minFailedTaskCount": 1,
      "minSucceededTaskCount": null,
      "command": "spark-submit --conf spark.eventLog.enabled=true --conf spark.history.fs.logDirectory=hdfs://YOUR_PAI_MASTER_IP:9000/shared/spark-logs --conf spark.eventLog.dir=hdfs://YOUR_PAI_MASTER_IP:9000/shared/spark-logs --conf spark.yarn.appMasterEnv.PYSPARK_PYTHON=MY_CONDA/spark-python/bin/python --master yarn --deploy-mode cluster --archives hdfs://YOUR_PAI_MASTER_IP:9000/user/core/spark-python.zip#MY_CONDA --queue default hdfs://YOUR_PAI_MASTER_IP:9000/user/core/code/gradient_boosted_tree_classifier_example.py hdfs://YOUR_PAI_MASTER_IP:9000/user/core/data/mllib/sample_libsvm_data.txt",
      "portList": []
    },
    {
      "name": "spark_history_server",
      "taskNumber": 1,
      "cpuNumber": 1,
      "memoryMB": 1024,
      "shmMB": 64,
      "gpuNumber": 0,
      "minFailedTaskCount": 1,
      "minSucceededTaskCount": null,
      "command": "URL=http://${PAI_CURRENT_CONTAINER_IP}:${PAI_CONTAINER_HOST_history_server_PORT_LIST}/ && echo Please visit spark histroy server: ${URL} && SPARK_DAEMON_JAVA_OPTS=\"-Dspark.history.ui.port=${PAI_CONTAINER_HOST_history_server_PORT_LIST} -Dspark.history.fs.logDirectory=hdfs://YOUR_PAI_MASTER_IP:9000/shared/spark-logs -Dspark.eventLog.enabled=true -Dspark.eventLog.dir=hdfs://YOUR_PAI_MASTER_IP:9000/shared/spark-logs\" spark-class org.apache.spark.deploy.history.HistoryServer",
      "portList": [
        {
          "label": "history_server",
          "beginAt": 0,
          "portNumber": 1
        }
      ]
    }
  ]
}

```

### 4. Visit Spark history server

As previous section.

Note: If you want to write your own pyspark code, you must set yarn-master as the master `setMaster("yarn-master")` instead of `"local[*]`. Then, you **must** upload your code to hdfs rather than build it in your docker. Finally, you should `spark-submit` the code on hdfs. You can refer to the [simple pyspark example](./simple_pyspark_example.py) and read the comment. 
