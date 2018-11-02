# Detest the files touched on HDFS when the containers start
PAI_HDFS_PREFIX=${PAI_DEFAULT_FS_URI}/Container
sshConnectInfoFolder=${PAI_HDFS_PREFIX}/${PAI_USER_NAME}/${PAI_JOB_NAME}/ssh/${APP_ID}
echo $sshConnectInfoFolder
res=`hdfs dfs -count $sshConnectInfoFolder`

# Split the result and get the number of existing files
fileNum=`echo $res | awk -F ' ' '{print $2}'`
while [ $fileNum != $PAI_JOB_TASK_ROLE_COUNT ]
do
    sleep 30
done
sleep 30

# Run mpi work
mpirun -np 4 -H worker-0:2,main-0:2 -bind-to none -map-by slot -x NCCL_DEBUG=INFO -x LD_LIBRARY_PATH -x PATH -x NCCL_SOCKET_IFNAME=eth0 -x NCCL_IB_DISABLE=1 -x CLASSPATH=$($HADOOP_HDFS_HOME/bin/hadoop classpath --glob) -mca pml ob1 -mca btl ^openib -mca btl_tcp_if_exclude docker0,lo,eth1  python code/benchmarks/scripts/tf_cnn_benchmarks/tf_cnn_benchmarks.py --model resnet20 --batch_size 32 --data_dir=$PAI_DATA_DIR  --data_name=cifar10 --train_dir=$PAI_OUTPUT_DIR --variable_update horovod

