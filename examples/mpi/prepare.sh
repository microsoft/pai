#mpi cntk prepare
echo "Prepare for the mpi example!"

function mpi_cntk_prepare_data(){

    #download data
	echo "Downloading mpi cntk data, waiting..."
    mkdir mpi_cntk_data && cd mpi_cntk_data
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
	cd ..

    #upload data to HDFS
	echo "Uploading mpi cntk data, waiting..."
	for i in `ls mpi_cntk_data`
    do
        hdfs dfs -put mpi_cntk_data/$i hdfs://$1/$2/examples/cntk/data
    done
}


function mpi_cntk_prepare_code(){
    #code
    #G2P.cntk
	echo "Downloading mpi cntk code, waiting..."
    wget https://github.com/Microsoft/pai/raw/master/examples/mpi/cntk-mpi.sh

    #upload code to HDFS
	echo "Uploading mpi cntk code, waiting..."
    hdfs dfs -put cntk-mpi.sh hdfs://$1/$2/examples/mpi/cntk/code
}

if [ $# != 2 ]; then
    echo "You must input hdfs socket and username as the only two parameters! Or you cannot run this script correctly!"
    exit 1
fi

#make directory on HDFS
echo "Make mpi cntk directory, waiting..."
hdfs dfs -mkdir -p hdfs://$1/$2/examples/mpi/cntk/code
hdfs dfs -mkdir -p hdfs://$1/$2/examples/mpi/cntk/output
hdfs dfs -mkdir -p hdfs://$1/$2/examples/cntk/data

hdfs dfs -test -e hdfs://$1/$2/examples/mpi/cntk/code/*
if [ $? -eq 0 ] ;then
    echo "Code exists on HDFS!"
else
    mpi_cntk_prepare_code $1 $2
    echo "Have prepared code!"
fi

hdfs dfs -test -e hdfs://$1/$2/examples/cntk/data/*
if [ $? -eq 0 ] ;then
    echo "Data exists on HDFS!"
else
    mpi_cntk_prepare_data $1 $2
    echo "Have prepared data"
fi

#delete the files
rm -rf cntk-mpi.sh* G2P.cntk* mpi_cntk_data/
echo "Removed local mpi cntk code and data succeeded!"
