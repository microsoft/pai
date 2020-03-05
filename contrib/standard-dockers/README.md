## Standard Deep Learning Environment Dockers for OpenPAI

`Standard dockers` provide basic deep learning environment docker images for `OpenPAI`. The images feature:

  - Based on `Ubuntu 18.04` and `Python 3.6`.
  - Fixed version number for different deep learning frameworks.
  - Different dockers for `CPU` and `CUDA (GPU)`.
  - Built-in `SSH` and `Jupyter Notebook` support.

The following table shows all provided images. The tag indicates the version of the built-in deep learning framework and whether it supports GPU. Some GPU-supported dockers require a high version of your NVIDIA driver, because of the requirement of using different versions of `CUDA`.

|       image      |                tag               | CUDA version | required Driver version |
|:----------------:|:--------------------------------:|:------------:|:-----------------------:|
| openpai/standard |   python_3.6-pytorch_1.1.0-gpu   |     10.0     |        >= 410.48        |
| openpai/standard |   python_3.6-pytorch_1.2.0-gpu   |     10.0     |        >= 410.48        |
| openpai/standard |   python_3.6-pytorch_1.3.1-gpu   |     10.1     |        >= 418.39        |
| openpai/standard |   python_3.6-pytorch_1.4.0-gpu   |     10.1     |        >= 418.39        |
| openpai/standard | python_3.6-tensorflow_1.14.0-gpu |     10.0     |        >= 410.48        |
| openpai/standard | python_3.6-tensorflow_1.15.0-gpu |     10.0     |        >= 410.48        |
| openpai/standard |  python_3.6-tensorflow_2.0.0-gpu |     10.0     |        >= 410.48        |
| openpai/standard |  python_3.6-tensorflow_2.1.0-gpu |     10.1     |        >= 418.39        |
| openpai/standard |    python_3.6-mxnet_1.5.1-gpu    |     10.1     |        >= 418.39        |
| openpai/standard |      python_3.6-cntk_2.7-gpu     |     10.1     |        >= 418.39        |
| openpai/standard |   python_3.6-pytorch_1.1.0-cpu   |       -      |            -            |
| openpai/standard |   python_3.6-pytorch_1.2.0-cpu   |       -      |            -            |
| openpai/standard |   python_3.6-pytorch_1.3.1-cpu   |       -      |            -            |
| openpai/standard |   python_3.6-pytorch_1.4.0-cpu   |       -      |            -            |
| openpai/standard | python_3.6-tensorflow_1.14.0-cpu |       -      |            -            |
| openpai/standard | python_3.6-tensorflow_1.15.0-cpu |       -      |            -            |
| openpai/standard |  python_3.6-tensorflow_2.0.0-cpu |       -      |            -            |
| openpai/standard |  python_3.6-tensorflow_2.1.0-cpu |       -      |            -            |
| openpai/standard |    python_3.6-mxnet_1.5.1-cpu    |       -      |            -            |
| openpai/standard |      python_3.6-cntk_2.7-cpu     |       -      |            -            |



## How to Use

You can directly use the image `openpai/standard:<tag>`, such as `openpai/standard:python_3.6-pytorch_1.1.0-gpu`, in OpenPAI's job submission page for quick validation.

Also, you can launch them locally, in your terminal. If you are using a GPU docker, make sure you have installed the correct GPU driver and set [`nvidia-container-runtime`](https://github.com/NVIDIA/nvidia-container-runtime) as your default runtime.

```bash
docker run -it openpai/standard:python_3.6-pytorch_1.1.0-gpu python
```

Using the docker images to start a `Jupyter Notebook` is also feasible:

```bash
# you can access the notebook from <your-server-ip>:8888
docker run -p 8888:8888 -it openpai/standard:python_3.6-pytorch_1.1.0-gpu jupyter-notebook
```

## Build and Push

You can build all the images from scratch by the following commands. Please replace the name `openpai/standard` to your customized docker image name, such as `<your-username-in-dockerhub>/<docker-image-name>`.

```bash
# build images
bash -x script/build.sh openpai/standard

# push images to docker hub or other registry
bash -x script/push.sh openpai/standard
```
