#!/bin/bash
# This project uses cifar10 dataset to show how to run a training job on CPU/ a single GPU/ multiple GPUs
# in OpenPAI. Because the models in torchvision.models are for imagenet, so this project is based on 
# https://github.com/kuangliu/pytorch-cifar, which has good implementations of the common models on cifar10.
# 
commitid=e8637ce53cebd1e213dfb2966c5e346ece6bc200 
if [ -d "pytorch-cifar" ]; then
    echo "pytorch-cifar already downloaded!"
    exit 1
fi
if [ ! -f "pytorch-cifar.zip" ]; then
    echo "Dowloading models..."
    wget -O pytorch-cifar.zip https://github.com/kuangliu/pytorch-cifar/archive/${commitid}.zip
fi
unzip pytorch-cifar.zip
rm pytorch-cifar.zip
mv pytorch-cifar-${commitid} pytorch-cifar