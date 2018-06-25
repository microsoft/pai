# PAI Examples

  - [Contributing](#contributing)
  - [List of workload](#list-of-workload)
  - [Off-the-shelf examples](#off-the-shelf-examples)


## Contributing

If you want to contribute to run new workload on PAI or add more PAI examples, please open a new pull request.


## List of workload

* [Open MPI](./mpi/README.md)
* [Model Serving](./serving/README.md)
* [CNTK](./cntk/README.md)
* [TensorFlow](./tensorflow/README.md)
* [PyTorch](./pytorch/README.md)
* [MXNet](./mxnet/README.md)
* [Keras](./keras/README.md)
* [scikit-learn](./scikit-learn/README.md)
* [Jupyter](./jupyter/README.md)


## Off-the-shelf examples

Examples which can be run by submitting the json straightly without any modification.

* [serving.tensorflow.json](./serving/serving.tensorflow.json): TensorFlow model serving.
* [tensorflow.cifar10.json](./tensorflow/tensorflow.cifar10.json): Single GPU trainning on CIFAR-10 using TensorFlow.
* [pytorch.mnist.json](./pytorch/pytorch.mnist.json): Single GPU trainning on MNIST using PyTorch.
* [pytorch.regression.json](./pytorch/pytorch.regression.json): Regression using PyTorch.
* [mxnet.autoencoder.json](./mxnet/mxnet.autoencoder.json): Autoencoder using MXNet.
* [mxnet.image-classification.json](./mxnet/mxnet.image-classification.json): Image classification on MNIST using MXNet.
