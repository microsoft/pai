#!/usr/bin/env python

# Copyright (c) Microsoft Corporation
# All rights reserved.
#
# MIT License
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
# documentation files (the "Software"), to deal in the Software without restriction, including without limitation
# the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
# to permit persons to whom the Software is furnished to do so, subject to the following conditions:
# The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
# BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
# NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
# DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import argparse


class Tester(object):

    def __init__(self, package, version, type):
        self.package = package
        self.version = version
        self.type = type

    def test(self):
        if self.package == 'tensorflow':
            self.tf_general()
            if self.type == 'gpu':
                self.tf_gpu()
        elif self.package == 'pytorch':
            if self.type == 'cpu':
                self.pytorch_cpu()
            elif self.type == 'gpu':
                self.pytorch_gpu()
            else:
                raise NotImplementedError
        elif self.package == 'mxnet':
            if self.type == 'cpu':
                self.mxnet_cpu()
            elif self.type == 'gpu':
                self.mxnet_gpu()
            else:
                raise NotImplementedError
        elif self.package == 'cntk':
            if self.type == 'cpu':
                self.cntk_cpu()
            elif self.type == 'gpu':
                self.cntk_gpu()
            else:
                raise NotImplementedError
        else:
            raise NotImplementedError

    def tf_general(self):
        import tensorflow as tf
        assert str(tf.__version__).startswith(self.version)
        if str(tf.__version__).startswith('1'):
            a = tf.constant(1)
            b = tf.constant(1)
            with tf.Session() as sess:
                assert sess.run(a + b) == 2
        else:
            a = tf.constant(1)
            b = tf.constant(1)
            assert (a + b).numpy() == 2

    def tf_gpu(self):
        import tensorflow as tf
        assert tf.test.is_gpu_available() is True

    def pytorch_cpu(self):
        import torch
        assert str(torch.__version__).startswith(self.version)
        assert torch.cuda.is_available() is False
        a = torch.tensor(1)
        b = torch.tensor(1)
        assert (a + b).numpy() == 2

    def pytorch_gpu(self):
        import torch
        from torch.backends import cudnn
        assert str(torch.__version__).startswith(self.version)
        assert torch.cuda.is_available() is True
        a = torch.tensor(1).cuda()
        b = torch.tensor(1).cuda()
        assert cudnn.is_available() is True
        c = torch.tensor(1.0).cuda()
        assert cudnn.is_acceptable(c) is True
        assert (a + b).cpu().numpy() == 2

    def mxnet_cpu(self):
        import mxnet as mx
        import numpy as np
        assert str(mx.__version__).startswith(self.version)

        a = mx.nd.ones(shape=(1,), dtype=np.int32)
        b = mx.nd.ones(shape=(1,), dtype=np.int32)
        assert (a + b).asnumpy()[0] == 2

    def mxnet_gpu(self):
        import mxnet as mx
        import numpy as np
        assert str(mx.__version__).startswith(self.version)

        a = mx.nd.ones(shape=(1,), dtype=np.int32, ctx=mx.gpu(0))
        b = mx.nd.ones(shape=(1,), dtype=np.int32, ctx=mx.gpu(0))
        assert (a + b).asnumpy()[0] == 2

    def cntk_cpu(self):
        import cntk as C
        assert str(C.__version__).startswith(self.version)
        a = C.constant(value=1)
        b = C.constant(value=1)

        assert (a + b).eval() == 2.

    def cntk_gpu(self):
        import cntk as C
        assert str(C.__version__).startswith(self.version)
        a = C.constant(value=1, device=C.device.gpu(0))
        b = C.constant(value=1, device=C.device.gpu(0))

        assert (a + b).eval() == 2.


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--package', type=str)
    parser.add_argument('--version', type=str)
    parser.add_argument('--type', type=str)
    return parser.parse_args()


if __name__ == '__main__':
    args = parse_args()
    tester = Tester(args.package, args.version, args.type)
    tester.test()
