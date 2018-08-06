#! /bin/bash
${SPARK_HOME}/bin/spark-submit --class org.apache.spark.examples.SparkPi \
    --master yarn \
    --deploy-mode cluster \
    --driver-memory 4g \
    --executor-memory 2g \
    --executor-cores 1 \
    --queue default \
    ${SPARK_HOME}/examples/jars/spark-examples*.jar \
    10

