echo "Prepare for the cntk example!"

function prepare_data(){
    
    #download data
	echo "Downloading cntk data, waiting..."
    mkdir cntk_data && cd cntk_data
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
	echo "Uploading cntk data, waiting..."
	for i in `ls cntk_data`
	do
		hdfs dfs -put cntk_data/$i hdfs://$1/$2/examples/cntk/data
	done
}

function prepare_code(){
    #code
	echo "Downloading cntk code, waiting..."
    #cntk-g2p.sh
    wget https://github.com/Microsoft/pai/raw/master/examples/cntk/cntk-g2p.sh

    #G2P.cntk
    wget https://github.com/Microsoft/CNTK/raw/master/Examples/SequenceToSequence/CMUDict/BrainScript/G2P.cntk

    #upload code to HDFS
	echo "Uploading cntk code, waiting..."
    hdfs dfs -put cntk-g2p.sh hdfs://$1/$2/examples/cntk/code
    hdfs dfs -put G2P.cntk hdfs://$1/$2/examples/cntk/code
}

if [ $# != 2 ]; then
	echo "You must input hdfs socket and username as the only two parameters! Or you cannot run this script correctly!"
	exit 1
fi

#make directory on HDFS
echo "Make cntk directory, waiting..."
hdfs dfs -mkdir -p hdfs://$1/$2/examples/cntk/code
hdfs dfs -mkdir -p hdfs://$1/$2/examples/cntk/data
hdfs dfs -mkdir -p hdfs://$1/$2/examples/cntk/output

hdfs dfs -test -e hdfs://$1/$2/examples/cntk/code/*
if [ $? -eq 0 ] ;then
    echo "Code exists on HDFS!"
else
    prepare_code $1 $2
    echo "Have prepared code!"
fi

hdfs dfs -test -e hdfs://$1/$2/examples/cntk/data/*
if [ $? -eq 0 ] ;then
    echo "Data exists on HDFS!"
else
    prepare_data $1 $2
    echo "Have prepared data"
fi

#delete the files
rm -rf cntk-g2p.sh* G2P.cntk* cntk_data/
echo "Prepare for the cntk example done!"
