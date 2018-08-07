# Spark on PAI

This example demonstrate howto run Spark job on PAI.

## Off-the-shelf example

Below is a job config running the `SparkPi` example on PAI.

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




