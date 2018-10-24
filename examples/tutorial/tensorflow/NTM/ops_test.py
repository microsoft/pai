"""Tests for ops."""
from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import numpy as np

from tensorflow.python.ops import constant_op
from tensorflow.python.framework import test_util
from tensorflow.python.platform import googletest

from ops import *

class SmoothCosineSimilarityTest(test_util.TensorFlowTestCase):

    def testSmoothCosineSimilarity(self):
        """Test code for torch:

            th> x=torch.Tensor{{1,2,3},{2,2,2},{3,2,1},{0,2,4}}
            th> y=torch.Tensor{2,2,2}
            th> c=nn.SmoothCosineSimilarity()
            th> c:forward{x,y}
             0.9257
             0.9999
             0.9257
             0.7745
            [torch.DoubleTensor of size 4]
        """
        m = constant_op.constant(
            [[1,2,3],
             [2,2,2],
             [3,2,1],
             [0,2,4]], dtype=np.float32)
        v = constant_op.constant([2,2,2], dtype=np.float32)
        for use_gpu in [True, False]:
            with self.test_session(use_gpu=use_gpu):
                loss = smooth_cosine_similarity(m, v).eval()
                self.assertAllClose(loss, [0.92574867671153,
                                           0.99991667361053,
                                           0.92574867671153,
                                           0.77454667246876])

class CircularConvolutionTest(test_util.TensorFlowTestCase):

    def testCircularConvolution(self):
        v = constant_op.constant([1,2,3,4,5,6,7], dtype=tf.float32)
        k = constant_op.constant([0,0,1], dtype=tf.float32)
        for use_gpu in [True, False]:
            with self.test_session(use_gpu=use_gpu):
                loss = circular_convolution(v, k).eval()
                self.assertAllEqual(loss, [7,1,2,3,4,5,6])

if __name__ == "__main__":
    googletest.main()
