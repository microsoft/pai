import os
import time
import numpy as np
import tensorflow as tf
from random import randint

from utils import pprint

print_interval = 5


def run(ntm, seq_length, sess, print_=True):
    start_symbol = np.zeros([ntm.cell.input_dim], dtype=np.float32)
    start_symbol[0] = 1
    end_symbol = np.zeros([ntm.cell.input_dim], dtype=np.float32)
    end_symbol[1] = 1

    seq = generate_copy_sequence(seq_length, ntm.cell.input_dim - 2)

    feed_dict = {input_: vec for vec, input_ in zip(seq, ntm.inputs)}
    feed_dict.update(
        {true_output: vec for vec, true_output in zip(seq, ntm.true_outputs)}
    )
    feed_dict.update({
        ntm.start_symbol: start_symbol,
        ntm.end_symbol: end_symbol
    })

    input_states = [state['write_w'][0] for state in ntm.input_states[seq_length]]
    output_states = [state['read_w'][0] for state in ntm.get_output_states(seq_length)]

    result = sess.run(
        ntm.get_outputs(seq_length) +
        input_states + output_states +
        [ntm.get_loss(seq_length)],
        feed_dict=feed_dict)

    is_sz = len(input_states)
    os_sz = len(output_states)

    outputs = result[:seq_length]
    read_ws = result[seq_length:seq_length + is_sz]
    write_ws = result[seq_length + is_sz:seq_length + is_sz + os_sz]
    loss = result[-1]

    if print_:
        np.set_printoptions(suppress=True)
        print(" true output : ")
        pprint(seq)
        print(" predicted output :")
        pprint(np.round(outputs))
        print(" Loss : %f" % loss)
        np.set_printoptions(suppress=False)
    else:
        return seq, outputs, read_ws, write_ws, loss


def train(ntm, config, sess):
    if not os.path.isdir(config.checkpoint_dir):
        raise Exception(" [!] Directory %s not found" % config.checkpoint_dir)

    # delimiter flag for start and end
    start_symbol = np.zeros([config.input_dim], dtype=np.float32)
    start_symbol[0] = 1
    end_symbol = np.zeros([config.input_dim], dtype=np.float32)
    end_symbol[1] = 1

    print(" [*] Initialize all variables")
    tf.global_variables_initializer().run()
    print(" [*] Initialization finished")

    if config.continue_train is not False:
        ntm.load(config.checkpoint_dir, config.task, strict=config.continue_train is True)

    start_time = time.time()
    for idx in range(config.epoch):
        seq_length = randint(config.min_length, config.max_length)
        seq = generate_copy_sequence(seq_length, config.input_dim - 2)

        feed_dict = {input_: vec for vec, input_ in zip(seq, ntm.inputs)}
        feed_dict.update(
            {true_output: vec for vec, true_output in zip(seq, ntm.true_outputs)}
        )
        feed_dict.update({
            ntm.start_symbol: start_symbol,
            ntm.end_symbol: end_symbol
        })

        _, cost, step = sess.run([ntm.optims[seq_length],
                                  ntm.get_loss(seq_length),
                                  ntm.global_step], feed_dict=feed_dict)

        if idx % 100 == 0:
            ntm.save(config.checkpoint_dir, config.task, step)

        if idx % print_interval == 0:
            print(
                "[%5d] %2d: %.2f (%.1fs)"
                % (idx, seq_length, cost, time.time() - start_time))

    ntm.save(config.checkpoint_dir, config.task, step)

    print("Training %s task finished" % config.task)


def generate_copy_sequence(length, bits):
    seq = np.zeros([length, bits + 2], dtype=np.float32)
    for idx in range(length):
        seq[idx, 2:bits+2] = np.random.rand(bits).round()
    return list(seq)
