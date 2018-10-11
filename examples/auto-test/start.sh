echo "Run with 6 parameters: ci/release/normal, rest_server_url, hdfs_url, webhdfs_url, PAI_username, PAI_password."
echo "During the runtime, you should select the jobs you want to run, you can also input the jobs' name you want to run."
cd /tmp
if [ ! -d "pai/" ]; then
    git clone https://github.com/Microsoft/pai.git
    mv pai/examples/ . && rm -rf pai/
    mv examples/ ~/
    cd ~/
    if [ $1 == "ci" ]; then
        threshold=10
    elif [ $1 == "release" ]; then
        threshold=60
    else
        threshold=30
    fi
    full="cntk-mpi,tensorflow-mpi,sklearn-mnist,sklearn-text-vectorizers,tensorflow-cifar10,tensorflow-tensorboard,tensorflow-distributed-cifar10,kafka,mxnet-image-classification,mxnet-autoencoder,jupyter_example,tensorflow-serving,xgboost_gpu_hist,cntk-g2p,keras_cntk_backend_mnist,keras_tensorflow_backend_mnist,caffe-mnist,pytorch-regression,pytorch-mnist,chainer-cifar,caffe2-resnet50"
    stable="sklearn-mnist,sklearn-text-vectorizers,tensorflow-cifar10,tensorflow-tensorboard,tensorflow-distributed-cifar10,kafka,mxnet-image-classification,mxnet-autoencoder,jupyter_example,tensorflow-serving,xgboost_gpu_hist,cntk-g2p,keras_cntk_backend_mnist,keras_tensorflow_backend_mnist,caffe-mnist,pytorch-regression,pytorch-mnist,chainer-cifar,caffe2-resnet50"
    echo "There are some error within the mpi example, so, just ignore them!"
    read -p "Please input name of the examples you want to run with ',' between two names, or you can just input F/S to run full jobs or only stable jobs:" mode
    if [[ $mode =~ ^[a-zA-Z0-9_,]+$ ]]; then
        echo "Run the job of "$mode
    else
        echo "Input jobs' name error!"
        exit 1
    fi
    if [ $mode == "F" ]; then
        jobs=$full
    elif [ $mode == "S" ]; then
        jobs=$stable
    else
        jobs=$mode
    fi
    abspath=`pwd`/pai_tmp/examples/auto-test
    python3 $abspath/start_all_test.py --path ./examples --threshold $threshold --rest_server_url $2 --hdfs_url $3 --webhdfs_url $4 --PAI_username $5 --PAI_password $6 --jobs $jobs
    rm -rf ./examples/
else
    echo "Pai folder already exist! Please remove it or run this project in another folder!"
fi
