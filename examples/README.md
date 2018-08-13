# OpenPAI Job Examples

## Table of Contents
- [Off-the-shelf examples](#off-the-shelf-examples)
- [List of customized job template](#list-of-customized-job-template)
- [Contributing](#contributing)
  

## Off-the-shelf examples

### How to write and submit a job:

####  (1) Login PAI job webportal

Enter username and password:

![PAI_example_login](./images/PAI_example_login.png)

####  (2) Write a job json file

We use CIFAR-10 training job as an example. 

[CIFAR-10](http://www.cs.toronto.edu/~kriz/cifar.html) is a common job in machine learning for image recognition.

- Full example for Cifar10 tensorflow training on OpenPAI: 

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

- Copy these content to a file, named cifar10.json

- [Job configuration items introduction](../docs/job_tutorial.md#json-config-file-for-job-submission)


####  (3) Submit job json file

- Click choose file.
- Select cifar10.json.
- Click Submit.

![PAI_example_submit](./images/PAI_example_submit.png)

- Show success.

![PAI_example_success](./images/PAI_example_success.png)

- Click job tab, view job progress:

![PAI_example_job_status](./images/PAI_example_job_status.png)


### List of off-the-shelf examples

Examples which can be run by submitting the json straightly without any modification.

* [tensorflow.cifar10.json](./tensorflow/tensorflow.cifar10.json): Single GPU trainning on CIFAR-10 using TensorFlow.
* [serving.tensorflow.json](./serving/serving.tensorflow.json): TensorFlow model serving.
* [pytorch.mnist.json](./pytorch/pytorch.mnist.json): Single GPU trainning on MNIST using PyTorch.
* [pytorch.regression.json](./pytorch/pytorch.regression.json): Regression using PyTorch.
* [mxnet.autoencoder.json](./mxnet/mxnet.autoencoder.json): Autoencoder using MXNet.
* [mxnet.image-classification.json](./mxnet/mxnet.image-classification.json): Image classification on MNIST using MXNet.

## List of customized job template

These user could customize and run these jobs over OpenPAI.

* [TensorFlow](./tensorflow/README.md): CIFAR-10 training job over Tensorflow
* [Keras](./keras/README.md): MNIST training job over keras.
* [Jupyter](./jupyter/README.md): MNIST over Jupyter Notebook. User can also treat this job as an example how to use Jupyter over OpenPAI
* [Model Serving](./serving/README.md): MNIST model serving over Tensorflow
* [Scikit-learn](./scikit-learn/README.md): Text vectorizers over Scikit-learn
* [CNTK](./cntk/README.md): Grapheme-to-phoneme (letter-to-sound) conversion over CNTK
* [PyTorch](./pytorch/README.md): Regression / MNIST training job over PyTorch
* [MXNet](./mxnet/README.md): Image classification training job over MXNet
* [Open MPI](./mpi/README.md): CIFAR-10 training job over Tensorflow MPI


## Contributing

- If you want to contribute to run new workload on PAI or add more PAI examples, please open a new pull request.

- Prepare a folder under pai/examples folder, for example create pai/examples/caffe2/

- Prepare example dependencies:

  Under [Caffe2 example](./caffe2/README.md) folder, user should prepare these files for an example's contribution PR:

1.  README.md: Example's introductions
2.	Dockerfile: Example's dependencies
3.	Pai job json file: Example's OpenPAI job json template
4.	[Optional] Code file: Example's code file




