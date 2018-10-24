import tensorflow as tf

from keras.backend import tensorflow_backend as KTF
from keras.backend.common import image_data_format

py_all = all

def depth_to_space(input, scale, data_format=None):
    ''' Uses phase shift algorithm to convert channels/depth for spatial resolution '''
    if data_format is None:
        data_format = image_data_format()

    if data_format == 'channels_first':
        data_format = 'NCHW'
    else:
        data_format = 'NHWC'

    data_format = data_format.lower()
    out = tf.depth_to_space(input, scale, data_format=data_format)
    return out
