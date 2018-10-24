# Introduction

This is a PyTorch example solution which has four projects.

## List of Projects

1. **cifar10:**

CIFAR-10 is a common benchmark in machine learning for image recognition. (http://www.cs.toronto.edu/~kriz/cifar.html) 

The code is a simple example to train and evaluate a convolutional neural network(CNN) on CPU.


2. **mnist:**

This is a simple handwritten digits recognition project with MNIST dataset. 
MNIST is a popular dataset for handwritten digits recognition. It contains 60000 examples as training set and 10000 examkples as test set.


3. **sentiment_analysis:**

This project used a RNN model to train a document sentimenet analysis classifier on IMDB dataset. Then used the model to do inference.


4. **transfer_learning:**

This is a transfer learning project. It trained a cifar10 classifier using resnet model on imagenet dataset.


# License

The PyTorch is released under [BSD license](https://github.com/pytorch/pytorch/blob/master/LICENSE)

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

1. Project Image_Captioning

    - Contributors: Cunxiang Wang, Linfeng Zhang, Linfeng Zhao, Yuecheng Fang, Daikun Zhang
    - University: Northeastern University

