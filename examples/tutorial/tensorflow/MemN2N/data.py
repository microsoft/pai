import os
import re
from collections import Counter

#from smart_open import smart_open

# Change hdfs url to webhdfs and change port
#def UrlConvert(hdfspath):
#    regex=re.compile('^hdfs://')
#    if re.match(regex, hdfspath):
#        webhdfs = hdfspath.replace('hdfs', 'webhdfs', 1).replace(':9000', ':50070', 1)
#    return webhdfs

#def write_data_to_local(hdfspath, localdir, fname):
#    localpath = os.path.join(localdir, fname)
#    lines = list()
#    for line in smart_open(UrlConvert(hdfspath) + '/' + fname):
#        lines.append(line)
#    if not os.path.exists(localdir):
#        os.makedirs(localdir)
#    if os.path.isfile(localpath):
#        os.remove(localpath)
#    with open(localpath, 'w+') as f:
#        f.writelines(lines)

def read_data(fname, count, word2idx, hdfs=False):
    if os.path.exists(fname):
        with open(fname) as f:
            lines = f.readlines()
    else:
        raise Exception("[!] Data %s not found" % fname)

    words = []
    for line in lines:
        words.extend(line.split())

    if len(count) == 0:
        count.append(['<eos>', 0])

    count[0][1] += len(lines)
    count.extend(Counter(words).most_common())

    if len(word2idx) == 0:
        word2idx['<eos>'] = 0

    for word, _ in count:
        if word not in word2idx:
            word2idx[word] = len(word2idx)

    data = list()
    for line in lines:
        for word in line.split():
            index = word2idx[word]
            data.append(index)
        data.append(word2idx['<eos>'])

    print("Read %s words from %s" % (len(data), fname))
    return data
