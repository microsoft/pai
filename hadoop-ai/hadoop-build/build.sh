#!/bin/bash

cd /

wget https://issues.apache.org/jira/secure/attachment/12897424/hadoop-2.7.2-gpu.patch

git clone https://github.com/apache/hadoop.git

cd hadoop

git checkout branch-2.7.2

cp /hadoop-2.7.2-gpu.patch /hadoop

git apply hadoop-2.7.2-gpu.patch

mvn package -Pdist,native -DskipTests -Dtar

cp /hadoop/hadoop-dist/target/hadoop-2.7.2.tar.gz /hadoop-binary

echo "Successfully build hadoop 2.7.2 AI"

