#horovod tensorflow cifar-10 prepare
function horovod_prepare_data(){
    #download the data
    wget http://www.cs.toronto.edu/~kriz/cifar-10-python.tar.gz && tar zxvf cifar-10-python.tar.gz && rm cifar-10-python.tar.gz

    #upload the data to HDFS
    echo "Uploading cifar-10 data, waiting..."
    for i in `ls cifar-10-batches-py`
    do
        hdfs dfs -put cifar-10-batches-py/$i hdfs://$1/$2/examples/tensorflow/distributed-cifar-10/data
    done
}

function horovod_prepare_code(){
    #download the code
    git clone -b cnn_tf_v1.10_compatible https://github.com/tensorflow/benchmarks.git
    wget https://github.com/Microsoft/pai/raw/master/examples/horovod/start.sh
    
    #upload the code to HDFS
    echo "Uploading benchmarks code, waiting..."
    hdfs dfs -put benchmarks/ hdfs://$1/$2/examples/horovod/code
    hdfs dfs -put start.sh hdfs://$1/$2/examples/horovod/code
}

echo "Make horovod directory, waiting..."
hdfs dfs -mkdir -p hdfs://$1/$2/examples/horovod/output
hdfs dfs -mkdir -p hdfs://$1/$2/examples/horovod/code
hdfs dfs -mkdir -p hdfs://$1/$2/examples/tensorflow/distributed-cifar-10/data

hdfs dfs -test -e hdfs://$1/$2/examples/horovod/code/*
if [ $? -eq 0 ] ;then
    echo "Code exists on HDFS!"
else
    horovod_prepare_code $1 $2
    echo "Have prepared code!"
fi

hdfs dfs -test -e hdfs://$1/$2/examples/tensorflow/distributed-cifar-10/data/*
if [ $? -eq 0 ] ;then
    echo "Data exists on HDFS!"
else
    horovod_prepare_data $1 $2
    echo "Have prepared data"
fi

rm -rf cifar-10-batches-py*/ benchmarks*/ start.sh
echo "Removed local cifar-10 code and data succeeded!"
echo "Prepare horovod example based on horovod and tensorflow done!"
