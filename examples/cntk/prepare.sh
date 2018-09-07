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


#upload to hdfs
hdfs dfs -put cntk-g2p.sh hdfs://10.151.40.179:9000/examples/cntk/code
hdfs dfs -put G2P.cntk hdfs://10.151.40.179:9000/examples/cntk/code
hdfs dfs -put cmudict-0.7b hdfs://10.151.40.179:9000/examples/cntk/data
hdfs dfs -put cmudict-0.7b.mapping hdfs://10.151.40.179:9000/examples/cntk/data
hdfs dfs -put cmudict-0.7b.test hdfs://10.151.40.179:9000/examples/cntk/data
hdfs dfs -put cmudict-0.7b.test.ctf hdfs://10.151.40.179:9000/examples/cntk/data
hdfs dfs -put cmudict-0.7b.test.txt hdfs://10.151.40.179:9000/examples/cntk/data
hdfs dfs -put cmudict-0.7b.train hdfs://10.151.40.179:9000/examples/cntk/data
hdfs dfs -put cmudict-0.7b.train-dev-1-21 hdfs://10.151.40.179:9000/examples/cntk/data
hdfs dfs -put cmudict-0.7b.train-dev-1-21.ctf hdfs://10.151.40.179:9000/examples/cntk/data
hdfs dfs -put cmudict-0.7b.train-dev-1-21.txt hdfs://10.151.40.179:9000/examples/cntk/data
hdfs dfs -put cmudict-0.7b.train-dev-20-21 hdfs://10.151.40.179:9000/examples/cntk/data
hdfs dfs -put cmudict-0.7b.train-dev-20-21.ctf hdfs://10.151.40.179:9000/examples/cntk/data
hdfs dfs -put cmudict-0.7b.train-dev-20-21.txt hdfs://10.151.40.179:9000/examples/cntk/data
hdfs dfs -put tiny.ctf hdfs://10.151.40.179:9000/examples/cntk/data


#delete the files
rm cntk-g2p.sh G2P.cntk cmudict-0.7b cmudict-0.7b.mapping cmudict-0.7b.test cmudict-0.7b.test.ctf cmudict-0.7b.test.txt cmudict-0.7b.train cmudict-0.7b.train-dev-1-21 cmudict-0.7b.train-dev-1-21.ctf cmudict-0.7b.train-dev-1-21.txt cmudict-0.7b.train-dev-20-21 cmudict-0.7b.train-dev-20-21.ctf cmudict-0.7b.train-dev-20-21.txt tiny.ctf
