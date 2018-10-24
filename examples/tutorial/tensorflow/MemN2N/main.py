import os
import pprint
import tensorflow as tf

from data import read_data
# from data import write_data_to_local
from model import MemN2N

pp = pprint.PrettyPrinter()

flags = tf.app.flags

flags.DEFINE_integer("edim", 150, "internal state dimension [150]")
flags.DEFINE_integer("lindim", 75, "linear part of the state [75]")
flags.DEFINE_integer("nhop", 6, "number of hops [6]")
flags.DEFINE_integer("mem_size", 100, "memory size [100]")
flags.DEFINE_integer("batch_size", 128, "batch size to use during training [128]")
flags.DEFINE_integer("nepoch", 100, "number of epoch to use during training [100]")
flags.DEFINE_float("init_lr", 0.01, "initial learning rate [0.01]")
flags.DEFINE_float("init_hid", 0.1, "initial internal state value [0.1]")
flags.DEFINE_float("init_std", 0.05, "weight initialization std [0.05]")
flags.DEFINE_float("max_grad_norm", 50, "clip gradients to this norm [50]")
flags.DEFINE_string("data_dir", "data", "data directory [data]")
flags.DEFINE_string("checkpoint_dir", "checkpoints", "checkpoint directory [checkpoints]")
flags.DEFINE_string("data_name", "ptb", "data set name [ptb]")
flags.DEFINE_boolean("is_test", False, "True for testing, False for Training [False]")
flags.DEFINE_boolean("show", False, "print progress [False]")
flags.DEFINE_integer("nwords", 0 , "number of words")
# Submit job to microsoft PAI cluster
# Read/Write WebHDFS
flags.DEFINE_string("pai_data_dir", "", "PAI data directory")
flags.DEFINE_boolean("hdfs", False, "True if read/write files on webhdfs")

FLAGS = flags.FLAGS

def main(_):
    count = []
    word2idx = {}

    if not os.path.exists(FLAGS.checkpoint_dir):
        os.makedirs(FLAGS.checkpoint_dir)

    #if FLAGS.hdfs:
    #    write_data_to_local(FLAGS.pai_data_dir, FLAGS.data_dir, FLAGS.data_name + '.train.txt')
    #    write_data_to_local(FLAGS.pai_data_dir, FLAGS.data_dir, FLAGS.data_name + '.valid.txt')
    #    write_data_to_local(FLAGS.pai_data_dir, FLAGS.data_dir, FLAGS.data_name + '.test.txt')

    train_data = read_data(os.path.join(FLAGS.data_dir, FLAGS.data_name + '.train.txt'), count, word2idx, FLAGS.hdfs)
    valid_data = read_data(os.path.join(FLAGS.data_dir, FLAGS.data_name + '.valid.txt'), count, word2idx, FLAGS.hdfs)
    test_data = read_data(os.path.join(FLAGS.data_dir, FLAGS.data_name + '.test.txt'), count, word2idx, FLAGS.hdfs)

    idx2word = dict(zip(word2idx.values(), word2idx.keys()))
    FLAGS.nwords = len(word2idx)

    pp.pprint(flags.FLAGS.__flags)

    with tf.Session() as sess:
        model = MemN2N(FLAGS, sess)
        model.build_model()

        if FLAGS.is_test:
            model.run(valid_data, test_data)
        else:
            model.run(train_data, valid_data)

if __name__ == '__main__':
    tf.app.run()
