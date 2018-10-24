from __future__ import print_function

import sys
sys.setrecursionlimit(10000)

import densenet
import numpy as np
import sklearn.metrics as metrics

from keras.datasets import cifar100
from keras.utils import np_utils
from keras.preprocessing.image import ImageDataGenerator
from keras.optimizers import Adam
from keras.callbacks import ModelCheckpoint, ReduceLROnPlateau, EarlyStopping
from keras import backend as K

batch_size = 64
nb_classes = 100
nb_epoch = 15

img_rows, img_cols = 32, 32
img_channels = 3

img_dim = (img_channels, img_rows, img_cols) if K.image_dim_ordering() == "th" else (img_rows, img_cols, img_channels)
depth = 40
nb_dense_block = 3
growth_rate = 12
nb_filter = 12
bottleneck = False
reduction = 0.0
dropout_rate = 0.0 # 0.0 for data augmentation


model = densenet.DenseNet(img_dim, classes=nb_classes, depth=depth, nb_dense_block=nb_dense_block,
                          growth_rate=growth_rate, nb_filter=nb_filter, dropout_rate=dropout_rate,
                          bottleneck=bottleneck, reduction=reduction, weights=None)
print("Model created")

model.summary()
optimizer = Adam(lr=1e-4) # Using Adam instead of SGD to speed up training
model.compile(loss='categorical_crossentropy', optimizer=optimizer, metrics=["accuracy"])
print("Finished compiling")
print("Building model...")

(trainX, trainY), (testX, testY) = cifar100.load_data()

trainX = trainX.astype('float32')
testX = testX.astype('float32')

trainX /= 255.
testX /= 255.

Y_train = np_utils.to_categorical(trainY, nb_classes)
Y_test = np_utils.to_categorical(testY, nb_classes)

generator = ImageDataGenerator(rotation_range=15,
                               width_shift_range=5./32,
                               height_shift_range=5./32)

generator.fit(trainX, seed=0)

# Load model
# model.load_weights("weights/DenseNet-BC-100-12-CIFAR100.h5")
# print("Model loaded.")

lr_reducer      = ReduceLROnPlateau(monitor='val_loss', factor=np.sqrt(0.1),
                                    cooldown=0, patience=10, min_lr=0.5e-6)
early_stopper   = EarlyStopping(monitor='val_acc', min_delta=0.0001, patience=20)
model_checkpoint= ModelCheckpoint("weights/DenseNet-BC-100-12-CIFAR100.h5", monitor="val_acc", save_best_only=True,
                                  save_weights_only=True)

callbacks=[lr_reducer, early_stopper, model_checkpoint]


model.fit_generator(generator.flow(trainX, Y_train, batch_size=batch_size), samples_per_epoch=len(trainX), nb_epoch=nb_epoch,
                   callbacks=callbacks,
                   validation_data=(testX, Y_test),
                   nb_val_samples=testX.shape[0], verbose=1)

yPreds = model.predict(testX)
yPred = np.argmax(yPreds, axis=1)
yTrue = testY

accuracy = metrics.accuracy_score(yTrue, yPred) * 100
error = 100 - accuracy
print("Accuracy : ", accuracy)
print("Error : ", error)

