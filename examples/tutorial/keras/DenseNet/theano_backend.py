from theano import tensor as T

from keras.backend import theano_backend as KTH
from keras.backend.common import image_data_format
from keras.backend.theano_backend import _preprocess_conv2d_input
from keras.backend.theano_backend import _postprocess_conv2d_output


py_all = all

def depth_to_space(input, scale, data_format=None):
    ''' Uses phase shift algorithm to convert channels/depth for spatial resolution '''
    if data_format is None:
        data_format = image_data_format()
    data_format = data_format.lower()
    input = _preprocess_conv2d_input(input, data_format)

    b, k, row, col = input.shape
    out_channels = k // (scale ** 2)
    x = T.reshape(input, (b, scale, scale, out_channels, row, col))
    x = T.transpose(x, (0, 3, 4, 1, 5, 2))
    out = T.reshape(x, (b, out_channels, row * scale, col * scale))

    out = _postprocess_conv2d_output(out, input, None, None, None, data_format)
    return out
