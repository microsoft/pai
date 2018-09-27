#mpi cntk prepare
echo "Prepare for the mpi example!"

function prepare_data(){

    #download data
	echo "Downloading mpi cntk data, waiting..."
    wget https://github.com/Microsoft/CNTK/raw/master/Examples/SequenceToSequence/CMUDict/Data/cmudict-0.7b
    wget https://github.com/Microsoft/CNTK/raw/master/Examples/SequenceToSequence/CMUDict/Data/cmudict-0.7b.mapping
    wget https://github.com/Microsoft/CNTK/raw/master/Examples/SequenceToSequence/CMUDict/Data/cmudict-0.7b.test
    wget https://github.com/Microsoft/CNTK/raw/master/Examples/SequenceToSequence/CMUDict/Data/cmudict-0.7b.test.ctf
    wget https://github.com/Microsoft/CNTK/raw/master/Examples/SequenceToSequence/CMUDict/Data/cmudict-0.7b.test.txt
    wget https://github.com/Microsoft/CNTK/raw/master/Examples/SequenceToSequence/CMUDict/Data/cmudict-0.7b.train
    wget https://github.com/Microsoft/CNTK/raw/master/Examples/SequenceToSequence/CMUDict/Data/cmudict-0.7b.train-dev-1-21
    wget https://github.com/Microsoft/CNTK/raw/master/Examples/SequenceToSequence/CMUDict/Data/cmudict-0.7b.train-dev-1-21.ctf
    wget https://github.com/Microsoft/CNTK/raw/master/Examples/SequenceToSequence/CMUDict/Data/cmudict-0.7b.train-dev-1-21.txt
    wget https://github.com/Microsoft/CNTK/raw/master/Examples/SequenceToSequence/CMUDict/Data/cmudict-0.7b.train-dev-20-21
    wget https://github.com/Microsoft/CNTK/raw/master/Examples/SequenceToSequence/CMUDict/Data/cmudict-0.7b.train-dev-20-21.ctf
    wget https://github.com/Microsoft/CNTK/raw/master/Examples/SequenceToSequence/CMUDict/Data/cmudict-0.7b.train-dev-20-21.txt
    wget https://github.com/Microsoft/CNTK/raw/master/Examples/SequenceToSequence/CMUDict/Data/tiny.ctf

    #upload data to HDFS
	echo "Uploading mpi cntk data, waiting..."
    hdfs dfs -put cmudict-0.7b hdfs://$1/examples/cntk/data
    hdfs dfs -put cmudict-0.7b.mapping hdfs://$1/examples/cntk/data
    hdfs dfs -put cmudict-0.7b.test hdfs://$1/examples/cntk/data
    hdfs dfs -put cmudict-0.7b.test.ctf hdfs://$1/examples/cntk/data
    hdfs dfs -put cmudict-0.7b.test.txt hdfs://$1/examples/cntk/data
    hdfs dfs -put cmudict-0.7b.train hdfs://$1/examples/cntk/data
    hdfs dfs -put cmudict-0.7b.train-dev-1-21 hdfs://$1/examples/cntk/data
    hdfs dfs -put cmudict-0.7b.train-dev-1-21.ctf hdfs://$1/examples/cntk/data
    hdfs dfs -put cmudict-0.7b.train-dev-1-21.txt hdfs://$1/examples/cntk/data
    hdfs dfs -put cmudict-0.7b.train-dev-20-21 hdfs://$1/examples/cntk/data
    hdfs dfs -put cmudict-0.7b.train-dev-20-21.ctf hdfs://$1/examples/cntk/data
    hdfs dfs -put cmudict-0.7b.train-dev-20-21.txt hdfs://$1/examples/cntk/data
    hdfs dfs -put tiny.ctf hdfs://$1/examples/cntk/data
}


function prepare_code(){
    #code
    #G2P.cntk
	echo "Downloading mpi cntk code, waiting..."
    wget https://github.com/Microsoft/pai/raw/master/examples/mpi/cntk-mpi.sh

    #upload code to HDFS
	echo "Uploading mpi cntk code, waiting..."
    hdfs dfs -put cntk-mpi.sh hdfs://$1/examples/mpi/cntk/code
}

if [ $# != 1 ]; then
    echo "You must input hdfs socket as the only parameter! Or you cannot run this script correctly!"
    exit 1
fi

#make directory on HDFS
echo "Make mpi cntk directory, waiting..."
hdfs dfs -mkdir -p hdfs://$1/examples/
hdfs dfs -mkdir -p hdfs://$1/examples/mpi
hdfs dfs -mkdir -p hdfs://$1/examples/mpi/cntk
hdfs dfs -mkdir -p hdfs://$1/examples/mpi/cntk/code
hdfs dfs -mkdir -p hdfs://$1/examples/mpi/cntk/data
hdfs dfs -mkdir -p hdfs://$1/examples/mpi/cntk/output

hdfs dfs -test -e hdfs://$1/examples/mpi/cntk/code/*
if [ $? -eq 0 ] ;then
    echo "Code exists on HDFS!"
else
    prepare_code $1
    echo "Have prepared code!"
fi

hdfs dfs -test -e hdfs://$1/examples/cntk/data/*
if [ $? -eq 0 ] ;then
    echo "Data exists on HDFS!"
else
    prepare_data $1
    echo "Have prepared data"
fi

#delete the files
rm cntk-mpi.sh* G2P.cntk* cmudict* tiny.ctf*
echo "Removed local mpi cntk code and data succeeded!"

#mpi tensorflow cifar-10 prepare
echo "Make mpi tensorflow directory, waiting..."
hdfs dfs -mkdir -p hdfs://$1/examples/mpi/tensorflow
hdfs dfs -mkdir -p hdfs://$1/examples/mpi/tensorflow/output

echo "Prepare for the mpi example done!"
