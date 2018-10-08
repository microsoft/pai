import pyspark
from pyspark import SparkContext
from pyspark import SparkConf

def reverse(str):
    str = list(str)
    begin = 0
    end = len(str) - 1
    while begin < end:
        str[begin], str[end] = str[end], str[begin]
        begin += 1
        end -= 1
    return ''.join(str) + '\n'

conf=SparkConf().setAppName("miniProject").setMaster("yarn-cluster")  # you must use "yarn-cluster" if you want to submit the job on yarn with cluster mode
sc = SparkContext.getOrCreate(conf)
rdd = sc.textFile('hdfs://10.20.30.40:9000/data/test.txt')  # here just an example, you must use your own url
text = rdd.map(reverse)
data = text.collect()
with open('result.txt', 'w') as fp:  # write the result into local file, then you can upload it onto HDFS
    fp.writelines(data)
