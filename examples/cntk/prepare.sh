#code
#cntk-g2p.sh
wget https://github.com/Microsoft/pai/raw/master/examples/cntk/cntk-g2p.sh

#G2P.cntk
wget https://github.com/Microsoft/CNTK/raw/master/Examples/SequenceToSequence/CMUDict/BrainScript/G2P.cntk


#data
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


#make directory on HDFS
hdfs dfs -mkdir -p hdfs://$1/examples/
hdfs dfs -mkdir -p hdfs://$1/examples/cntk
hdfs dfs -mkdir -p hdfs://$1/examples/cntk/code
hdfs dfs -mkdir -p hdfs://$1/examples/cntk/data
hdfs dfs -mkdir -p hdfs://$1/examples/cntk/output


#upload to hdfs
hdfs dfs -put cntk-g2p.sh hdfs://$1/examples/cntk/code
hdfs dfs -put G2P.cntk hdfs://$1/examples/cntk/code
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


#delete the files
rm cntk-g2p.sh* G2P.cntk* cmudict* tiny.ctf*
