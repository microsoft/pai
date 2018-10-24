End-To-End Memory Networks in Tensorflow
========================================

Tensorflow implementation of [End-To-End Memory Networks](http://arxiv.org/abs/1503.08895v4) for language modeling (see Section 5). The original torch code from Facebook can be found [here](https://github.com/facebook/MemNN/tree/master/MemN2N-lang-model).

![alt tag](http://i.imgur.com/nv89JLc.png)


Prerequisites
-------------

This code requires [Tensorflow](https://www.tensorflow.org/). There is a set of sample Penn Tree Bank (PTB) corpus in `data` directory, which is a popular benchmark for measuring quality of these models. But you can use your own text data set which should be formated like [this](data/).


When you use docker image tensorflw/tensorflow:latest-gpu, you need to python package future.

    $ pip install future

If you want to use `--show True` option, you need to install python package `progress`.

    $ pip install progress

Usage
-----

To train a model with 6 hops and memory size of 100, run the following command:

    $ python main.py --nhop 6 --mem_size 100

To see all training options, run:

    $ python main.py --help

which will print:

    usage: main.py [-h] [--edim EDIM] [--lindim LINDIM] [--nhop NHOP]
                  [--mem_size MEM_SIZE] [--batch_size BATCH_SIZE]
                  [--nepoch NEPOCH] [--init_lr INIT_LR] [--init_hid INIT_HID]
                  [--init_std INIT_STD] [--max_grad_norm MAX_GRAD_NORM]
                  [--data_dir DATA_DIR] [--data_name DATA_NAME] [--show SHOW]
                  [--noshow]
    
    optional arguments:
      -h, --help            show this help message and exit
      --edim EDIM           internal state dimension [150]
      --lindim LINDIM       linear part of the state [75]
      --nhop NHOP           number of hops [6]
      --mem_size MEM_SIZE   memory size [100]
      --batch_size BATCH_SIZE
                            batch size to use during training [128]
      --nepoch NEPOCH       number of epoch to use during training [100]
      --init_lr INIT_LR     initial learning rate [0.01]
      --init_hid INIT_HID   initial internal state value [0.1]
      --init_std INIT_STD   weight initialization std [0.05]
      --max_grad_norm MAX_GRAD_NORM
                            clip gradients to this norm [50]
      --checkpoint_dir CHECKPOINT_DIR
                            checkpoint directory [checkpoints]
      --data_dir DATA_DIR   data directory [data]
      --data_name DATA_NAME
                            data set name [ptb]
      --is_test IS_TEST     True for testing, False for Training [False]
      --nois_test
      --show SHOW           print progress [False]
      --noshow

(Optional) If you want to see a progress bar, install `progress` with `pip`:

    $ pip install progress
    $ python main.py --nhop 6 --mem_size 100 --show True

After training is finished, you can test and validate with:

    $ python main.py --is_test True --show True

The training output looks like:

    $ python main.py --nhop 6 --mem_size 100 --show True
    Read 929589 words from data/ptb.train.txt
    Read 73760 words from data/ptb.valid.txt
    Read 82430 words from data/ptb.test.txt
    {'batch_size': 128,
    'data_dir': 'data',
    'data_name': 'ptb',
    'edim': 150,
    'init_hid': 0.1,
    'init_lr': 0.01,
    'init_std': 0.05,
    'lindim': 75,
    'max_grad_norm': 50,
    'mem_size': 100,
    'nepoch': 100,
    'nhop': 6,
    'nwords': 10000,
    'show': True}
    I tensorflow/core/common_runtime/local_device.cc:25] Local device intra op parallelism threads: 12
    I tensorflow/core/common_runtime/direct_session.cc:45] Direct session inter op parallelism threads: 12
    Training |################################| 100.0% | ETA: 0s
    Testing |################################| 100.0% | ETA: 0s
    {'perplexity': 507.3536108810464, 'epoch': 0, 'valid_perplexity': 285.19489755719286, 'learning_rate': 0.01}
    Training |################################| 100.0% | ETA: 0s
    Testing |################################| 100.0% | ETA: 0s
    {'perplexity': 218.49577035468886, 'epoch': 1, 'valid_perplexity': 231.73457031084268, 'learning_rate': 0.01}
    Training |################################| 100.0% | ETA: 0s
    Testing |################################| 100.0% | ETA: 0s
    {'perplexity': 163.5527845871247, 'epoch': 2, 'valid_perplexity': 175.38771414841014, 'learning_rate': 0.01}
    Training |################################| 100.0% | ETA: 0s
    Testing |################################| 100.0% | ETA: 0s
    {'perplexity': 136.1443535538306, 'epoch': 3, 'valid_perplexity': 161.62522958776597, 'learning_rate': 0.01}
    Training |################################| 100.0% | ETA: 0s
    Testing |################################| 100.0% | ETA: 0s
    {'perplexity': 119.15373237680929, 'epoch': 4, 'valid_perplexity': 149.00768378137946, 'learning_rate': 0.01}
    Training |##############                  | 44.0% | ETA: 378s

Performance
-----------

The perplexity on the test sets of Penn Treebank corpora.

| # of hidden | # of hops | memory size | MemN2N (Sukhbaatar 2015) |  This repo. |
|:-----------:|:---------:|:-----------:|:------------------------:|:-----------:|
|     150     |     3     |     100     |            122           |     129     |
|     150     |     6     |     150     |            114           | in progress |


Author
------

Taehoon Kim / [@carpedm20](http://carpedm20.github.io/)



## License

MIT License