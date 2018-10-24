import sys
import pprint
import numpy as np
import tensorflow as tf

eps = 1e-12
pp = pprint.PrettyPrinter()

try:
    xrange
except NameError:
    xrange = range

def progress(progress):
    barLength = 20 # Modify this to change the length of the progress bar
    status = ""
    if isinstance(progress, int):
        progress = float(progress)
    if not isinstance(progress, float):
        progress = 0
        status = "error: progress var must be float\r\n"
    if progress < 0:
        progress = 0
        status = "Halt...\r\n"
    if progress >= 1:
        progress = 1
        status = "Finished.\r\n"
    block = int(round(barLength*progress))
    text = "\rPercent: [%s] %.2f%% %s" % ("#"*block + " "*(barLength-block), progress*100, status)
    sys.stdout.write(text)
    sys.stdout.flush()

def pprint(seq):
    seq = np.array(seq)
    seq = np.char.mod('%d', np.around(seq))
    seq[seq == '1'] = '#'
    seq[seq == '0'] = ' '
    print("\n".join(["".join(x) for x in seq.tolist()]))

def gather(m_or_v, idx):
    if len(m_or_v.get_shape()) > 1:
        return tf.gather(m_or_v, idx)
    else:
        assert idx == 0, "Error: idx should be 0 but %d" % idx
        return m_or_v

def argmax(x):
    index = 0
    max_num = x[index]
    for idx in xrange(1, len(x)-1):
        if x[idx] > max_num:
            index = idx
            max_num = x[idx]
    return index, max_num

def softmax(x):
    """Compute softmax.

    Args:
        x: a 2-D `Tensor` (matrix) or 1-D `Tensor` (vector)
    """
    try:
        return tf.nn.softmax(x + eps)
    except:
        return tf.reshape(tf.nn.softmax(tf.reshape(x + eps, [1, -1])), [-1])

def matmul(x, y):
    """Compute matrix multiplication.

    Args:
        x: a 2-D `Tensor` (matrix)
        y: a 2-D `Tensor` (matrix) or 1-D `Tensor` (vector)
    """
    try:
        return tf.matmul(x, y)
    except:
        return tf.reshape(tf.matmul(x, tf.reshape(y, [-1, 1])), [-1])
