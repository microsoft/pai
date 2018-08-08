# Spark on PAI

This example demonstrate howto run Spark job on PAI.

## 1. Off-the-shelf example

Below is a job config running the `SparkPi` Java example on PAI.

```json
{
  "jobName": "spark-example",
  "image": "openpai/spark-example",
  "authFile": "",
  "dataDir": "",
  "outputDir": "",
  "codeDir": "",
  "virtualCluster": "default",
  "gpuType": "",
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
      "command": "${SPARK_HOME}/bin/spark-submit --class org.apache.spark.examples.SparkPi --master yarn --deploy-mode cluster --driver-memory 4g --executor-memory 2g --executor-cores 1 --queue default ${SPARK_HOME}/examples/jars/spark-examples*.jar 10",
      "portList": []
    }
  ]
}
```

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

  Replace the `YOUR_PAI_MASTER_IP` with your own, and submit the job on PAI.

```json
{
  "jobName": "spark-python-example",
  "image": "openpai/spark-example",
  "authFile": "",
  "dataDir": "hdfs://YOUR_PAI_MASTER_IP:9000/user/core/data/mllib/",
  "outputDir": "",
  "codeDir": "hdfs://YOUR_PAI_MASTER_IP:9000/user/core/code",
  "virtualCluster": "default",
  "gpuType": "",
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
      "command": "spark-submit --master yarn --deploy-mode cluster --archives hdfs://10.151.40.234:9000/user/core/spark-python.zip#MY_CONDA --conf spark.yarn.appMasterEnv.PYSPARK_PYTHON=MY_CONDA/spark-python/bin/python --queue default --archives hdfs://10.151.40.234:9000/user/core/spark-python.zip#MY_CONDA hdfs://10.151.40.234:9000/user/core/code/gradient_boosted_tree_classifier_example.py hdfs://YOUR_PAI_MASTER_IP:9000/user/core/data/mllib/sample_libsvm_data.txt",
      "portList": []
    }
  ]
}

```
