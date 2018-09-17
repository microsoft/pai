# OpenPAI Job Examples

## Table of Contents
- [Quick start: how to write and submit a CIFAR-10 job](#quickstart)
- [List of off-the-shelf examples](#offtheshelf)
- [List of customized job template](#customize)
- [Contributing](#contributing)
  
## Quick start: how to write and submit a CIFAR-10 job <a name="quickstart"></a>

####  (1) Prepare a job json file

In this section, we will use CIFAR-10 training job as an example to explain how to write and submit a job in OpenPAI.

[CIFAR-10](http://www.cs.toronto.edu/~kriz/cifar.html) is an established computer-vision dataset used for image classification.

- Full example for tensorflow cifar10 image classification training on OpenPAI: 

```js
{
  // Name for the job, need to be unique
  "jobName": "tensorflow-cifar10",
  // URL pointing to the Docker image for all tasks in the job
  "image": "openpai/pai.example.tensorflow",
  // Data directory existing on HDFS
  "dataDir": "/tmp/data",
  // Output directory on HDFS, 
  "outputDir": "/tmp/output",
  // List of taskRole, one task role at least
  "taskRoles": [
    {
      // Name for the task role
      "name": "cifar_train",
      // Number of tasks for the task role, no less than 1
      "taskNumber": 1,
      // CPU number for one task in the task role, no less than 1
      "cpuNumber": 8,
      // Memory for one task in the task role, no less than 100
      "memoryMB": 32768,
      // GPU number for one task in the task role, no less than 0
      "gpuNumber": 1,
      // Executable command for tasks in the task role, can not be empty
      "command": "git clone https://github.com/tensorflow/models && cd models/research/slim && python download_and_convert_data.py --dataset_name=cifar10 --dataset_dir=$PAI_DATA_DIR && python train_image_classifier.py --batch_size=64 --model_name=inception_v3 --dataset_name=cifar10 --dataset_split_name=train --dataset_dir=$PAI_DATA_DIR --train_dir=$PAI_OUTPUT_DIR"
    }
  ]
}
```

- Save content to a file. Name this file as cifar10.json

- [Job configuration items introduction](../docs/job_tutorial.md#json-config-file-for-job-submission)

####  (2) Submit job json file from OpenPAI webportal

Users can refer to this tutorial [submit a job in web portal](https://github.com/Microsoft/pai/blob/master/docs/submit_from_webportal.md) for job submission from OpenPAI webportal.

## List of off-the-shelf examples <a name="offtheshelf"></a>

Examples which can be run by submitting the json straightly without any modification.

* [tensorflow.cifar10.json](./tensorflow/tensorflow.cifar10.json): Single GPU trainning on CIFAR-10 using TensorFlow.
* [pytorch.mnist.json](./pytorch/pytorch.mnist.json): Single GPU trainning on MNIST using PyTorch.
* [pytorch.regression.json](./pytorch/pytorch.regression.json): Regression using PyTorch.
* [mxnet.autoencoder.json](./mxnet/mxnet.autoencoder.json): Autoencoder using MXNet.
* [mxnet.image-classification.json](./mxnet/mxnet.image-classification.json): Image 
* [serving.tensorflow.json](./serving/serving.tensorflow.json): TensorFlow model serving.
classification on MNIST using MXNet.

## List of customized job template <a name="customize"></a>

These user could customize and run these jobs over OpenPAI.

* [TensorFlow](./tensorflow): 

  1. [TensorFlow CIFAR-10 image classification](./tensorflow#tensorflow-cifar-10-image-classification)
  2. [TensorFlow ImageNet image classification](./tensorflow#tensorflow-imagenet-image-classification)
  3. [Distributed TensorFlow CIFAR-10 image classification](./tensorflow#distributed-tensorflow-cifar-10-image-classification )
  4. [TensorFlow Tensorboard](./tensorflow#tensorflow-tensorboard)

* [Keras](./keras): 
  1. [MNIST training job over keras.](./keras/README.md)
* [Jupyter](./jupyter): 
  1. [MNIST over Jupyter Notebook. User can also treat this job as an example how to use Jupyter over OpenPAI](./jupyter/README.md)
* [Model Serving](./serving): 
  1. [MNIST model serving over Tensorflow](./serving/README.md)
* [Scikit-Learn](./scikit-learn): 
  1. [Scikit-Learn MNIST digit recognition](./scikit-learn/#scikit-learn-mnist-digit-recognition-example)
  2. [Scikit-Learn text-vectorizers](./scikit-learn/#scikit-learn-text-vectorizers-example)
* [CNTK](./cntk): 
  1. [CNTK grapheme-to-phoneme](./cntk/README.md)
* [PyTorch](./pytorch): 
  1. [PyTorch MNIST digit recognition](./pytorch/#pytorch-mnist-digit-recognition-examples)
  2. [PyTorch regression](./pytorch/#pytorch-regression-examples)
* [MXNet](./mxnet): 
  1. [MXNet autoencoder](./mxnet#mxnet-autoencoder-examples)
  2. [MXNet image classification](./mxnet#mxnet-image-classification-examples)
* [Open MPI](./mpi): 
  1. [Open MPI TensorFlow CIFAR-10](./mpi#open-mpi-tensorflow-cifar-10-example)
  2. [Open MPI CNTK grapheme-to-phoneme conversion](./mpi#open-mpi-cntk-grapheme-to-phoneme-conversion-example)

## Contributing <a name="contributing"></a>

If you want to contribute a job example that can be run on PAI, please open a new pull request.

- Prepare a folder under pai/examples folder, for example create pai/examples/caffe2/

- Prepare example files:

  Under [Caffe2 example](./caffe2) dir, user should prepare these files for an example's contribution PR:

![PAI_caffe2_dir](./images/PAI_caffe2_dir.png)

1.  README.md: Example's introductions
2.	Dockerfile: Example's dependencies
3.	Pai job json file: Example's OpenPAI job json template
4.	[Optional] Code file: Example's code file




