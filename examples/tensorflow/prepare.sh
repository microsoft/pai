#TensorFlow ImageNet image classification prepare
echo "Prepare tensorflow imageNet example!"

function imageNet_prepare_data(){
    #download the data
    echo "Downloading imageNet data, waiting..."
	chmod u+x slim/datasets/download_and_convert_imagenet.sh
    abspath=`pwd`/data
    echo -e "openpai\nopenpai\n" | ./slim/datasets/download_and_convert_imagenet.sh $abspath

    #upload the data to HDFS
    echo "Uploading imageNet data, waiting..."
    for i in `ls data`
    do
        hdfs dfs -put data/$i hdfs://$1/examples/tensorflow/imageNet/data
    done
}

function imageNet_prepare_code(){
    #download the code
	echo "Downloading imageNet code, waiting..."
    git clone https://github.com/tensorflow/models.git && mv models/research/slim . && rm -rf models
    
    #edit download_and_convert_imagenet.sh
    sed -i "s/^WORK_DIR=.*$/WORK_DIR=.\/slim/g" slim/datasets/download_and_convert_imagenet.sh

    #upload the code to HDFS
    echo "Uploading imageNet code, waiting..."
    for i in `ls slim`
    do
        hdfs dfs -put slim/$i hdfs://$1/examples/tensorflow/imageNet/code
    done
}

echo "You must input hdfs socket as the only parameter! Or you cannot run this script correctly!"

#make directory on HDFS
echo "Make imageNet directory, waiting..."
hdfs dfs -mkdir -p hdfs://$1/examples/
hdfs dfs -mkdir -p hdfs://$1/examples/tensorflow/
hdfs dfs -mkdir -p hdfs://$1/examples/tensorflow/imageNet/
hdfs dfs -mkdir -p hdfs://$1/examples/tensorflow/imageNet/data/
hdfs dfs -mkdir -p hdfs://$1/examples/tensorflow/imageNet/code/
hdfs dfs -mkdir -p hdfs://$1/examples/tensorflow/imageNet/output/

echo "We have to ignore imageNet example now due to its big input data!"
echo "If you want to run the imageNet preparing script, just remove the # of #imageNet_prepare_code \$1 and #imageNet_prepare_data \$1"
hdfs dfs -test -e hdfs://$1/examples/tensorflow/imageNet/code/*
if [ $? -eq 0 ] ;then
    echo "Code exists on HDFS!"
else
    #imageNet_prepare_code $1
    echo "Have prepared code!"
fi

hdfs dfs -test -e hdfs://$1/examples/tensorflow/imageNet/data/*
if [ $? -eq 0 ] ;then
    echo "Data exists on HDFS!"
else
    #imageNet_prepare_data $1
    echo "Have prepared data"
fi

rm -rf data* slim*
echo "Removed local imageNet code and data succeeded!"
echo "Prepare tensorflow imageNet example done!"


#Distributed TensorFlow CIFAR-10 image classification prepare
echo "Prepare tensorflow cifar-10 example!"

function distributed_prepare_data(){
    #download the data
    wget http://www.cs.toronto.edu/~kriz/cifar-10-python.tar.gz && tar zxvf cifar-10-python.tar.gz && rm cifar-10-python.tar.gz

    #upload the data to HDFS
    echo "Uploading cifar-10 data, waiting..."
    for i in `ls cifar-10-batches-py`
    do
        hdfs dfs -put cifar-10-batches-py/$i hdfs://$1/examples/tensorflow/distributed-cifar-10/data
    done
}

function distributed_prepare_code(){
    #download the code
    git clone -b tf_benchmark_stage https://github.com/tensorflow/benchmarks.git

    #upload the code to HDFS
    echo "Uploading benchmarks code, waiting..."
    hdfs dfs -put benchmarks/ hdfs://$1/examples/tensorflow/distributed-cifar-10/code
}

#make directory on HDFS
echo "Make distributed cifar-10 directory, waiting..."
hdfs dfs -mkdir -p hdfs://$1/examples/tensorflow/distributed-cifar-10/
hdfs dfs -mkdir -p hdfs://$1/examples/tensorflow/distributed-cifar-10/code/
hdfs dfs -mkdir -p hdfs://$1/examples/tensorflow/distributed-cifar-10/data/
hdfs dfs -mkdir -p hdfs://$1/examples/tensorflow/distributed-cifar-10/output/

hdfs dfs -test -e hdfs://$1/examples/tensorflow/distributed-cifar-10/code/*
if [ $? -eq 0 ] ;then
    echo "Code exists on HDFS!"
else
    distributed_prepare_code $1
    echo "Have prepared code!"
fi

hdfs dfs -test -e hdfs://$1/examples/tensorflow/distributed-cifar-10/data/*
if [ $? -eq 0 ] ;then
    echo "Data exists on HDFS!"
else
    distributed_prepare_data $1
    echo "Have prepared data"
fi

rm -rf cifar-10-batches-py*/ benchmarks*/
echo "Removed local cifar-10 code and data succeeded!"
echo "Prepare tensorflow cifar-10 example done!"

#Tensorboard prepare

function tensorboard_prepare_code(){
    #download the code
    wget https://github.com/Microsoft/pai/raw/master/examples/tensorflow/tensorflow-tensorboard.sh

    #upload the code to HDFS
    echo "Uploading tensorboard code, waiting..."
    hdfs dfs -put tensorflow-tensorboard.sh hdfs://$1/examples/tensorflow/tensorboard/code/
}


echo "Prepare tensorboard example!"
echo "Make tensorboard directory, waiting..."
hdfs dfs -test -e hdfs://$1/examples/tensorflow/tensorboard/code/tensorflow-tensorboard.sh
if [ $? -eq 0 ] ;then
    echo "Code exists on HDFS!"
else
    hdfs dfs -mkdir -p hdfs://$1/examples/tensorflow/tensorboard/code/
    tensorboard_prepare_code $1
    echo "Have prepared code!"
fi

