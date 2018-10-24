from __future__ import print_function
from __future__ import absolute_import

from keras.preprocessing import image

from densenet import DenseNetImageNet121, DenseNetImageNet169, DenseNetImageNet161, preprocess_input, decode_predictions

import numpy as np

if __name__ == '__main__':
    size = 224

    model = DenseNetImageNet121(input_shape=(size, size, 3))
    model.summary()


    img_path = 'images/elephant.jpg'
    img = image.load_img(img_path, target_size=(size, size))
    x = image.img_to_array(img)
    x = np.expand_dims(x, axis=0)

    x = preprocess_input(x)

    preds = model.predict(x)

    print('Predicted:', decode_predictions(preds))

