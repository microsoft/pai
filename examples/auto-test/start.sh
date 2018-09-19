echo "Run with parameter ci/release/normal!"
if [ ! -d "pai/" ]; then
    git clone -b yuqian/examples_fix https://github.com/Microsoft/pai.git
    mv pai/examples/ . && rm -rf pai/
    if [ $1 == "ci" ]; then
        threshold=10
    elif [ $1 == "release" ]; then
        threshold=60
    else
        threshold=30
    fi
    abspath=`pwd`/pai_tmp/examples/auto-test
    python3 $abspath/start_all_test.py --path ./examples --threshold $threshold --rest_server_socket $2 --hdfs_socket $3 --webhdfs_socket $4 --PAI_username $5 --PAI_password $6
    rm -rf ./examples/
else
    echo "Pai folder already exist! Please remove it or run this project in another folder!"
fi