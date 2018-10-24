from __future__ import absolute_import

import importlib
import tensorflow as tf
from ntm_cell import NTMCell
from ntm import NTM
import os
import re
# import sh
# from smart_open import smart_open
import shutil

from utils import pp

flags = tf.app.flags
flags.DEFINE_string("task", "copy", "Task to run [copy, recall]")
flags.DEFINE_integer("epoch", 100000, "Epoch to train [100000]")
flags.DEFINE_integer("input_dim", 10, "Dimension of input [10]")
flags.DEFINE_integer("output_dim", 10, "Dimension of output [10]")
flags.DEFINE_integer("min_length", 1, "Minimum length of input sequence [1]")
flags.DEFINE_integer("max_length", 10, "Maximum length of output sequence [10]")
flags.DEFINE_integer("controller_layer_size", 1, "The size of LSTM controller [1]")
flags.DEFINE_integer("controller_dim", 100, "Dimension of LSTM controller [100]")
flags.DEFINE_integer("write_head_size", 1, "The number of write head [1]")
flags.DEFINE_integer("read_head_size", 1, "The number of read head [1]")
flags.DEFINE_integer("test_max_length", 120, "Maximum length of output sequence [120]")
flags.DEFINE_string("checkpoint_dir", "checkpoint", "Directory name to save the checkpoints [checkpoint]")
flags.DEFINE_boolean("is_train", False, "True for training, False for testing [False]")
flags.DEFINE_boolean("continue_train", None, "True to continue training from saved checkpoint. False for restarting. None for automatic [None]")
# Submit job to microsoft PAI cluster
# Read/Write WebHDFS
#flags.DEFINE_string("pai_data_dir", "", "PAI data directory")
#flags.DEFINE_boolean("hdfs", False, "True if read/write files on webhdfs")

FLAGS = flags.FLAGS


def create_ntm(config, sess, **ntm_args):
    cell = NTMCell(
        input_dim=config.input_dim,
        output_dim=config.output_dim,
        controller_layer_size=config.controller_layer_size,
        controller_dim=config.controller_dim,
        write_head_size=config.write_head_size,
        read_head_size=config.read_head_size)
    scope = ntm_args.pop('scope', 'NTM-%s' % config.task)
    ntm = NTM(
        cell, sess, config.min_length, config.max_length,
        test_max_length=config.test_max_length, scope=scope, **ntm_args)
    return cell, ntm

# Change hdfs url to webhdfs and change port
def UrlConvert(hdfspath):
    regex=re.compile('^hdfs://')
    if re.match(regex, hdfspath):
        webhdfs = hdfspath.replace('hdfs', 'webhdfs', 1).replace(':9000', ':50070', 1)
    return webhdfs

#def write_file_to_local(hdfspath, localpath):
#    lines = list()
#    for line in smart_open(UrlConvert(hdfspath)):
#        lines.append(line)
#    with open(localpath, 'wb+') as f:
#        f.writelines(lines)

#def write_data_to_local(src, dest):
#    if not os.path.exists(dest):
#        os.makedirs(dest)
#    files = [line.rsplit(None,1)[-1] for line in sh.hdfs('dfs','-ls',src).split('\n') if len(line.rsplit(None,1))][1:]
#    for f in files:
#        print(f)
#        write_file_to_local(f, os.path.join(dest, f.split('/')[-1]))


def main(_):
    pp.pprint(flags.FLAGS.__flags)

    with tf.device('/cpu:0'), tf.Session() as sess:
        try:
            task = importlib.import_module('tasks.%s' % FLAGS.task)
        except ImportError:
            print("task '%s' does not have implementation" % FLAGS.task)
            raise

        if FLAGS.is_train:
            cell, ntm = create_ntm(FLAGS, sess)
            task.train(ntm, FLAGS, sess)
        else:
            cell, ntm = create_ntm(FLAGS, sess, forward_only=True)

        #if FLAGS.hdfs:
        #    hdfspath = "%s/%s/%s_%s" % (FLAGS.pai_data_dir, FLAGS.checkpoint_dir, FLAGS.task, FLAGS.max_length)
        #    localpath = "%s/%s_%s" % (FLAGS.checkpoint_dir, FLAGS.task, FLAGS.max_length)
        #    write_data_to_local(hdfspath, localpath)
        ntm.load(FLAGS.checkpoint_dir, FLAGS.task)

        if FLAGS.task == 'copy':
            task.run(ntm, int(FLAGS.test_max_length * 1 / 3), sess)
            print
            task.run(ntm, int(FLAGS.test_max_length * 2 / 3), sess)
            print
            task.run(ntm, int(FLAGS.test_max_length * 3 / 3), sess)
        else:
            task.run(ntm, int(FLAGS.test_max_length), sess)


if __name__ == '__main__':
    tf.app.run()
