# Dense Net in Keras

[简体中文](/zh-hans/examples/keras/DenseNet/README.md)

DenseNet implementation of the paper [Densely Connected Convolutional Networks](https://arxiv.org/pdf/1608.06993v3.pdf) in Keras

Now supports the more efficient DenseNet-BC (DenseNet-Bottleneck-Compressed) networks. Using the DenseNet-BC-190-40 model, 
it obtaines state of the art performance on CIFAR-10 and CIFAR-100

# Architecture
DenseNet is an extention to Wide Residual Networks. According to the paper: <br>
```
The lth layer has l inputs, consisting of the feature maps of all preceding convolutional blocks. 
Its own feature maps are passed on to all L − l subsequent layers. This introduces L(L+1) / 2 connections 
in an L-layer network, instead of just L, as in traditional feed-forward architectures. 
Because of its dense connectivity pattern, we refer to our approach as Dense Convolutional Network (DenseNet).
```

It features several improvements such as :

1. Dense connectivity : Connecting any layer to any other layer.
2. Growth Rate parameter Which dictates how fast the number of features increase as the network becomes deeper.
3. Consecutive functions : BatchNorm - Relu - Conv which is from the Wide ResNet paper and improvement from the ResNet paper.

The Bottleneck - Compressed DenseNets offer further performance benefits, such as reduced number of parameters, with similar or better performance. 

- Take into consideration the DenseNet-100-12 model, with nearly 7 million parameters against with the DenseNet-BC-100-12, with just 0.8 million parameters.
The BC model acheives 4.51 % error in comparison to the original models' 4.10 % error

- The best original model, DenseNet-100-24 (27.2 million parameters) acheives 3.74 % error, whereas the DenseNet-BC-190-40 (25.6 million parameters) acheives
3.46 % error which is a new state of the art performance on CIFAR-10.

Dense Nets have an architecture which can be shown in the following image from the paper: <br>
<img src="https://github.com/titu1994/DenseNet/blob/master/images/dense_net.JPG?raw=true">

# Performance
The accuracy of DenseNet has been provided in the paper, beating all previous benchmarks in CIFAR 10, CIFAR 100 and SVHN <br>
<img src="https://github.com/titu1994/DenseNet/blob/master/images/accuracy_densenet.JPG?raw=true">

# Usage

Import the `densenet.py` script and use the `DenseNet(...)` method to create a custom DenseNet model with a variety of parameters.

Examples : 

```
import densenet

# 'th' dim-ordering or 'tf' dim-ordering
image_dim = (3, 32, 32) or image_dim = (32, 32, 3)

model = densenet.DenseNet(classes=10, input_shape=image_dim, depth=40, growth_rate=12, 
			  bottleneck=True, reduction=0.5)
```

Or, Import a pre-built DenseNet model for ImageNet, with some of these models having pre-trained weights (121, 161 and 169).

Example : 
```
import densenet

# 'th' dim-ordering or 'tf' dim-ordering
image_dim = (3, 224, 224) or image_dim = (224, 224, 3)

model = densenet.DenseNetImageNet121(input_shape=image_dim)
```

Weights for the DenseNetImageNet121, DenseNetImageNet161 and DenseNetImageNet169 models are provided ([in the release tab](https://github.com/titu1994/DenseNet/releases)) and will be automatically downloaded when first called. They have been trained on ImageNet. The weights were ported from the repository https://github.com/flyyufelix/DenseNet-Keras.



# Requirements

- Keras
- Theano (weights not tested) / Tensorflow (tested) / CNTK (weights not tested)
- h5Py
