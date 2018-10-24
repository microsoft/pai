import h5py
import os

# Note : Weights obtained from https://github.com/flyyufelix/DenseNet-Keras
f = h5py.File('densenet169_weights_tf.h5')

conv_weights = []
bn_weights = []

dense_classifier_weights = None

for name in f.attrs['layer_names']:
    if 'data' in str(name):
        continue

    if 'zeropadding' in str(name):
        continue

    if 'relu' in str(name):
        continue

    if 'prob' in str(name):
        continue

    if 'pool' in str(name):
        continue

    if 'concat' in str(name):
        continue

    if 'fc' in str(name):
        v = f[name]
        v = [v[attr][:] for attr in v.attrs['weight_names']]
        dense_classifier_weights = v
        break

    if 'bn' in str(name):
        v = f[name]
        v_w = [v[attr][:] for attr in v.attrs['weight_names']]
        bn_weights.append(v_w)
        continue

    if 'scale' in str(name):
        v = f[name]
        v_w = [v[attr][:] for attr in v.attrs['weight_names']]
        bn_weights[-1][0] = v_w[0]
        bn_weights[-1][1] = v_w[1]
        continue

    v = f[name]
    v_w = v[v.attrs['weight_names'][0]][:]
    conv_weights.append(v_w)

count_layers = 1 # for dense matrix
count_layers += len(conv_weights)
count_layers += len(bn_weights)

print('Copying %d weights. (%d layers)' % (count_layers, count_layers // 2))

import densenet

model = densenet.DenseNetImageNet169((224, 224, 3), weights=None)

conv_layer_ids = []
bn_layer_ids = []

for i, layer in enumerate(model.layers):
    if layer.__class__.__name__ == 'Input':
        continue

    if layer.__class__.__name__ == 'Activation':
        continue

    if layer.__class__.__name__ == 'MaxPooling2D':
        continue

    if layer.__class__.__name__ == 'AveragePooling2D':
        continue

    if layer.__class__.__name__ == 'Concatenate':
        continue

    if layer.__class__.__name__ == 'GlobalAveragePooling2D':
        continue

    if layer.__class__.__name__ == 'Conv2D':
        conv_layer_ids.append(i)
        continue

    if layer.__class__.__name__ == 'BatchNormalization':
        bn_layer_ids.append(i)
        continue


count = 0
for i, weights in enumerate(conv_weights):
    conv_idx = conv_layer_ids[i]
    model.layers[conv_idx].set_weights([weights])
    count += 1

for i, weights in enumerate(bn_weights):
    bn_idx = bn_layer_ids[i]

    model.layers[bn_idx].set_weights(weights)
    count += 1

model.layers[-1].set_weights(dense_classifier_weights)
count += 1

print("Sanity check : %d weights loaded" % count)

model.save_weights('DenseNet-BC-169-32.h5', overwrite=True)

print("Finished saving weights")

import shutil
shutil.copy('DenseNet-BC-169-32.h5', 'DenseNet-BC-169-32-no-top.h5')

f = h5py.File('DenseNet-BC-169-32-no-top.h5')
layers = f.attrs['layer_names']
f.attrs['layer_names'] = layers[:-2]

for layer in layers[-2:]:
    del f[layer]

f.close()

print("Finished saving no-top weights")
