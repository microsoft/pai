# Introduction

These is a Keras solution contains several visual studio projects.

## List of Projects

1. **cifar10_tf:**

The example is used to train a simple deep CNN model on the cifar10 small images dataset, with TensorFlow backend.

2. **DenseNet:**

This project is an implementation of the paper [Densely Connected Convolutional Networks](https://arxiv.org/pdf/1608.06993v3.pdf) in Keras.

Now supports the more efficient DenseNet-BC (DenseNet-Bottleneck-Compressed) networks. Using the DenseNet-BC-190-40 model,
it obtaines state of the art performance on CIFAR-10 and CIFAR-100

3. **acgan_tf:**

This is a Keras implementation of Conditional Image Synthesis With Auxiliary Classifier GANs. Train an ACGAN on MNIST dataset.

4. **capsnet_tf:**

This is a Keras implementation of NIPS 2017 Paper: "Dynamic Routing Between Capsules". Train a simple Capsule Network on the CIFAR10 small images dataset.

5. **dcgan_tf:**

This is a project of using DCGAN (Deep Convolution Generative Adversarial Networks) to generate handwritten digits.
Implement the network and the results of it can be visualized and saved as pictures.

6  **infogan_tf:**

This is a Keras implementation of InfoGAN (Information-theoretic extension to the Generative Adversarial Network), which can generates handwritten digits througth training.

7. **wgan_tf:**

This is a Keras implementation of WGAN (Wasserstein Generative Adversarial Network), which can generates handwritten digits througth training.

# How to Run

## Runing samples on Visual Studio

1. Open the solution.(It will open with Visual Studio 2017 by default.)

2. Right click the project name to set the project want to run as "Startup Project"

3. Right click the script name to set the script want to run as "Startup File"

4. Right-click the script -> Start without Debugging

## Submit samples to Microsoft PAI through Visual Studio Tools for AI

- Right-Click project name -> "Submit Job...".

- In the pop-up dialog window, select your OpenPAI cluster.

- Write your own configuration or "Import" json file.

    - If you want use example json file as configuration: Click "Import..." button, select one json file

- Click "Submit".


# Contributors

These projects are contributed by University Students from Microsoft Student Club. Below is the detail information.

1. Project acgan_tf, capsnet_tf, dcgan_tf

    - Contributors: Xin Fu, Yi Rong, Runnan Cao, Wenjun Lin, Zihan Chen
    - University: Wuhan University

2. Project infogan_tf, wgan_tf

    - Contributors: Wu Zhifan, Zhao Jiawei, He Hao
    - University: Nanjing University of Aeronautics and Astronautics

3. Project DenseNet

    - Contributors: Secone Liu, Zou Ji, Yaxuan Dai, Jie Lin
    - University: Beijing University of Post and Telecommunications