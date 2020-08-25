#         Distributed data parallel training in OpenPai

## Motivation
The easiest way to speed up neural network training is to use a GPU, which provides large speedups over CPUs on the types of calculations (matrix multiplies and additions) that are common in neural networks. As the model or dataset gets bigger, one GPU quickly becomes insufficient. For example, big language models such as BERT and GPT-2 are trained on hundreds of GPUs. To perform multi-GPU training, we must have a way to split the model and data between different GPUs and to coordinate the training.

## Why distributed data parallel?
Pytorch has two ways to split models and data across multiple GPUs: nn.DataParallel and nn.DistributedDataParallel. nn.DataParallel is easier to use (just wrap the model and run your training script). However, because it uses one process to compute the model weights and then distribute them to each GPU during each batch, networking quickly becomes a bottle-neck and GPU utilization is often very low. Furthermore, nn.DataParallel requires that all the GPUs be on the same node and doesn’t work with Apex for mixed-precision training.



## A tutorial on writing distributed applications using Pytorch
The tutorial on writing distributed applications in Pytorch has much more detail than necessary for a first pass and is not accessible to somebody without a strong background on multiprocessing in Python. It spends a lot of time replicating the functionality in nn.DistributedDataParallel. However, it doesn’t give a high-level overview of what it does and provides no insight on how to use it. (https://pytorch.org/tutorials/intermediate/ddp_tutorial.html)

The closest to a MWE example Pytorch provides is the Imagenet training example（https://github.com/pytorch/examples/tree/master/imagenet）   . Unfortunately, that example also demonstrates pretty much every other feature Pytorch has, so it’s difficult to pick out what pertains to distributed, multi-GPU training.





## Outline
This tutorial is really directed at people who are already familiar with training neural network models in Pytorch, and I won’t go over any of those parts of the code. I’ll begin by summarizing the big picture. I then show a minimum working example of training on Cifar10 using on GPU. I modify this example to train on multiple GPUs, possibly across multiple nodes, and explain the changes line by line. Importantly, I also explain how to run the code. As a bonus, I also demonstrate how to use Apex to do easy mixed-precision distribued training.

## DDP
Multiprocessing with DistributedDataParallel duplicates the model across multiple GPUs, each of which is controlled by one process. (A process is an instance of python running on the computer; by having multiple processes running in parallel, we can take advantage of procressors with multiple CPU cores. If you want, you can have each process control multiple GPUs, but that should be obviously slower than having one GPU per process. It’s also possible to have multiple worker processes that fetch data for each GPU, but I’m going to leave that out for the sake of simplicity.) The GPUs can all be on the same node or spread across multiple nodes. (A node is one “computer,” including all of its CPUs and GPUs. ) Every process does identical tasks, and each process communicates with all the others. Only gradients are passed between the processes/GPUs so that network communication is less of a bottleneck.

![image](289EA5072CF94054A99B9CE9414DC1C1)

During training, each process loads its own minibatches from disk and passes them to its GPU. Each GPU does its own forward pass, and then the gradients are all-reduced across the GPUs. Gradients for each layer do not depend on previous layers, so the gradient all-reduce is calculated concurrently with the backwards pass to futher alleviate the networking bottleneck. At the end of the backwards pass, every node has the averaged gradients, ensuring that the model weights stay synchronized.

All this requires that the multiple processes, possibly on multiple nodes, are synchronized and communicate. Pytorch does this through its distributed.init_process_group function. This function needs to know where to find process 0 so that all the processes can sync up and the total number of processes to expect. Each individual process also needs to know the total number of processes as well as its rank within the processes and which GPU to use. It’s common to call the total number of processes the world size. Finally, each process needs to know which slice of the data to work on so that the batches are non-overlapping. Pytorch provides nn.utils.data.DistributedSampler to accomplish this.

## Minimum working examples with explanations
To demonstrate how to do this, I’ll create an example that trains on Cifar10, and then modify it to run on multiple GPUs across multiple nodes, and finally to also allow mixed-precision training.

## Without multiprocessing
First, we import everything we need.

1. import os
1. from datetime import datetime
1. import argparse
1. import torch.multiprocessing as mp
1. import torchvision
1. import torchvision.transforms as transforms
1. import torch
1. import torch.nn as nn
1. import torch.nn.functional as F
1. import torch.distributed as dist
1. from apex.parallel import DistributedDataParallel as DDP
1. from apex import amp

We define a very simple convolutional model for predicting cifar10
~~~~
class Net(nn.Module):
    def __init__(self):
        super(Net, self).__init__()
        self.conv1 = nn.Conv2d(3, 6, 5)
        self.conv2 = nn.Conv2d(6, 16, 5)
        self.fc1 = nn.Linear(16 * 5 * 5, 120)
        self.fc2 = nn.Linear(120, 84)
        self.fc3 = nn.Linear(84, 10)
    def forward(self, x):
        x = F.max_pool2d(F.relu(self.conv1(x)), 2)
        x = F.max_pool2d(F.relu(self.conv2(x)), 2)
        x = x.view(-1, 16 * 5 * 5)
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        x = self.fc3(x)
        return x
~~~~
The main() function will take in some arguments and run the training function.
~~~~

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('-n', '--nodes', default=1, type=int, metavar='N')
    parser.add_argument('-g', '--gpus', default=1, type=int,
                        help='number of gpus per node')
    parser.add_argument('-nr', '--nr', default=0, type=int,
                        help='ranking within the nodes')
    parser.add_argument('--epochs', default=2, type=int, metavar='N',
                        help='number of total epochs to run')
    args = parser.parse_args()
    train(0, args)
~~~~
And here's the train function.
~~~~
def train(gpu, args):
    model = Net()
    torch.cuda.set_device(gpu)
    model.cuda(gpu)
    batch_size = 100
    # define loss function (criterion) and optimizer
    criterion = nn.CrossEntropyLoss().cuda(gpu)
    optimizer = torch.optim.SGD(model.parameters(), 1e-4)
    # Data loading code
    transform_train = transforms.Compose([
        transforms.RandomCrop(32, padding=4),
        transforms.RandomHorizontalFlip(),
        transforms.ToTensor(),
        transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2023, 0.1994, 0.2010)),
    ])
    train_dataset = torchvision.datasets.CIFAR10(
        root='./data', train=True, download=True, transform=transform_train)
    train_loader = torch.utils.data.DataLoader(
        dataset=train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=0,
        pin_memory=True)
    classes = ('plane', 'car', 'bird', 'cat', 'deer',
               'dog', 'frog', 'horse', 'ship', 'truck')
    start = datetime.now()
    total_step = len(train_loader)
    for epoch in range(args.epochs):
        for i, (images, labels) in enumerate(train_loader):
            images = images.cuda(non_blocking=True)
            labels = labels.cuda(non_blocking=True)
            # Forward pass
            outputs = model(images)
            loss = criterion(outputs, labels)
            # Backward and optimize
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            if (i + 1) % 100 == 0 and gpu == 0:
                print('Epoch [{}/{}], Step [{}/{}], Loss: {:.4f}'.format(epoch + 1, args.epochs, i + 1, total_step,
                                                                         loss.item()))
    if gpu == 0:
        print("Training complete in: " + str(datetime.now() - start))

~~~~
Finally, we want to make sure the main() function gets called.

if __name__ == '__main__':
    main()
There’s definitely some extra stuff in here (the number of gpus and nodes, for example) that we don’t need yet, but it’s helpful to put the whole skeleton in place.

We can run this code by opening a terminal and typing python main.py -n 1 -g 1 -nr 0, which will train on a single gpu on a single node.

## Multi - nodes multi - gpus and add to OpenPAI
To do this with multiprocessing, we need a script that will launch a process for every GPU. Each process needs to know which GPU to use, and where it ranks amongst all the processes that are running. We’ll need to run the script on each node.

Let’s take a look at the changes to each function. I’ve fenced off the new code to make it easy to find.
~~~~
1. def main():
2.     print('run main')
3.     parser = argparse.ArgumentParser()
4.     parser.add_argument('-n', '--nodes', default=1, type=int, metavar='N',
5.                         help='number of data loading workers (default: 4)')
6.     parser.add_argument('-g', '--gpus', default=1, type=int,
7.                         help='number of gpus per node')
8.     parser.add_argument('-nr', '--nr', default=0, type=int,
9.                         help='ranking within the nodes')
10.     parser.add_argument('--epochs', default=2, type=int, metavar='N',
11.                         help='number of total epochs to run')
12.     #########################################################
13.     parser.add_argument('--dist-backend',  default='nccl', type=str,
14.                         help='distributed backend')
15.     args = parser.parse_args()
16.     args.world_size = args.gpus * args.nodes
17.     print('world_size:',args.world_size)
18.     os.environ['MASTER_ADDR'] = os.environ['PAI_HOST_IP_worker_0']
19.     os.environ['MASTER_PORT'] = os.environ['PAI_worker_0_SynPort_PORT']
20.     print('master:', os.environ['MASTER_ADDR'], 'port:', os.environ['MASTER_PORT'])
21.     mp.spawn(train, nprocs=args.gpus, args=(args,))
22.     #########################################################
~~~~ 

args.nodes is the total number of nodes we’re going to use.
args.gpus is the number of gpus on each node.
args.nris the rank of the current node within all the nodes, and goes from 0 to args.nodes - 1.
Now, let’s go through the new changes line by line:

Line16：Based on the number of nodes and gpus per node, we can calculate the world_size, or the total number of processes to run, which is equal to the total number of gpus because we’re assigning one gpu to every process.

Line18：Tells the multiprocessing module which IP address to look up for process 0. It needs this address so that all processes can synchronize first, MASTER_ADDR being the master node address, and the worker_0 name of the master node machine in PAI_HOST_IP_worker_0. The master node IP is initialized by reading environment variables.

Line19：Again, this is the port of the primary node to be used when looking up process 0, initialized by python reading environment variables.

(Note: the master node address and syn port are common to the cluster and can be initialized in different ways)

Now, instead of running the train function once, we will spawn args.gpus processes, each of which runs train(i, args), where i goes from 0 to args.gpus - 1. Remember, we run the main() function on each node, so that in total there will be args.nodes * args.gpus = args.world_size processes.

Next, let’s look at the modifications to train:
~~~~
def train(gpu, args):
    ############################################################
    rank = int(os.environ['PAI_TASK_INDEX']) * args.gpus + gpu         
    dist.init_process_group(                                   
    	backend='nccl',                                         
   		init_method='env://',                                   
    	world_size=args.world_size,                              
    	rank=rank                                               
    )                                                          
    ############################################################
    
    torch.manual_seed(0)
    model = ConvNet()
    torch.cuda.set_device(gpu)
    model.cuda(gpu)
    batch_size = 100
    # define loss function (criterion) and optimizer
    criterion = nn.CrossEntropyLoss().cuda(gpu)
    optimizer = torch.optim.SGD(model.parameters(), 1e-4)
    
    ###############################################################
    # Wrap the model
    model = nn.parallel.DistributedDataParallel(model,
                                                device_ids=[gpu])
    ###############################################################
     # Data loading code
    transform_train = transforms.Compose([
        transforms.RandomCrop(32, padding=4),
        transforms.RandomHorizontalFlip(),
        transforms.ToTensor(),
        transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2023, 0.1994, 0.2010)),
    ])

    transform_test = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2023, 0.1994, 0.2010)),
    ])

    trainset = torchvision.datasets.CIFAR10(
        root='./data', train=True, download=True, transform=transform_train)

    trainsampler = torch.utils.data.distributed.DistributedSampler(
        trainset,
        num_replicas=args.world_size,
        rank=rank,
        shuffle=True,
    )
    trainloader = torch.utils.data.DataLoader(
        trainset, batch_size=batch_size, shuffle=False, num_workers=2, sampler=trainsampler)

    testset = torchvision.datasets.CIFAR10(
        root='./data', train=False, download=True, transform=transform_test)
    testloader = torch.utils.data.DataLoader(
        testset, batch_size=batch_size, shuffle=False, num_workers=0, pin_memory=True, sampler=trainsampler)

    classes = ('plane', 'car', 'bird', 'cat', 'deer',
               'dog', 'frog', 'horse', 'ship', 'truck')
    start = datetime.now()
    total_step = len(trainloader)
    for epoch in range(args.epochs):
        for i, (images, labels) in enumerate(trainloader):
            images = images.cuda(non_blocking=True)
            labels = labels.cuda(non_blocking=True)
            # Forward pass
            outputs = model(images)
            loss = criterion(outputs, labels)

            # Backward and optimize
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            #if (i + 1) % 100 == 0 and gpu == 0:
            print('Epoch [{}/{}], Step [{}/{}], Loss: {:.4f}'.format(epoch + 1, args.epochs, i + 1, total_step,
                                                                         loss.item()))
    if gpu == 0:
        print("Training complete in: " + str(datetime.now() - start))
~~~~

rank = int(os.environ['PAI_TASK_INDEX']) * args.gpus + gpu来替代 rank = args.nr * args.gpus + gpu：This is the global rank of the process within all of the processes (one process per GPU). PAI_TASK_INDEX is the serial number of the node in the cluster, replacing the parameter nr.

dist.init_process_group：Initialize the process and join up with the other processes. This is “blocking,” meaning that no process will continue until all processes have joined. I’m using the nccl backend here because the pytorch docs say it’s the fastest of the available ones. The init_method tells the process group where to look for some settings. In this case, it’s looking at environment variables for the MASTER_ADDR and MASTER_PORT, which we set within main. I could have set the world_size there as well as WORLD_SIZE, but I’m choosing to set it here as a keyword argument, along with the global rank of the current process.

nn.parallel.DistributedDataParallel(model,
                                                device_ids=[gpu])：Wrap the model as a DistributedDataParallel model. This reproduces the model onto the GPU for the process.

nn.utils.data.DistributedSampler:The nn.utils.data.DistributedSampler makes sure that each process gets a different slice of the training data.

torch.utils.data.DataLoader Use the nn.utils.data.DistributedSampler instead of shuffling the usual way.

To run this on, say, 4 nodes with 4 GPUs each, we need 4 terminals (one on each node).On node 0 (Master node)：

python cifar10-distributed.py -n 4 -g 4

Then, on the other nodes:

python cifar10-distributed.py -n 4 -g 4

for i∈1,2,3. In other words, we run this script on each node, telling it to launch args.gpus processes that sync with each other before training begins.

Note that the effective batchsize is now the per/GPU batchsize (the value in the script) * the total number of GPUs (the worldsize).

## With Apex for mixed precision
Mixed precision training (training in a combination of float (FP32) and half (FP16) precision) allows us to use larger batch sizes and take advantage of NVIDIA Tensor Cores for faster computation.For the sake of concision, I’ve taken out the data loading code and the code after the backwards pass from the example here.
~~~~
def train(gpu, args):
    print("start train")
    rank = int(os.environ['PAI_TASK_INDEX']) * args.gpus + gpu
    dist.init_process_group(backend=args.dist_backend, init_method='env://', world_size=args.world_size, rank=rank)
    torch.manual_seed(0)
    model=Net()
    torch.cuda.set_device(gpu)
    model.cuda(gpu)
    batch_size = 100
    # define loss function (criterion) and optimizer
    criterion = nn.CrossEntropyLoss().cuda(gpu)
    optimizer = torch.optim.SGD(model.parameters(), 1e-4)
    # Wrap the model
    model, optimizer = amp.initialize(model, optimizer, opt_level='O2')
    model = DDP(model)
    # Data loading code
    transform_train = transforms.Compose([
        transforms.RandomCrop(32, padding=4),
        transforms.RandomHorizontalFlip(),
        transforms.ToTensor(),
        transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2023, 0.1994, 0.2010)),
    ])

    transform_test = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2023, 0.1994, 0.2010)),
    ])

    trainset = torchvision.datasets.CIFAR10(
        root='./data', train=True, download=True, transform=transform_train)
    trainsampler = torch.utils.data.distributed.DistributedSampler(
        trainset,
        num_replicas=args.world_size,
        rank=rank,
        shuffle=True,
    )
    trainloader = torch.utils.data.DataLoader(
        trainset, batch_size=batch_size, shuffle=False, num_workers=2, sampler=trainsampler)

    testset = torchvision.datasets.CIFAR10(
        root='./data', train=False, download=True, transform=transform_test)
    testloader = torch.utils.data.DataLoader(
        testset, batch_size=batch_size, shuffle=False, num_workers=0, pin_memory=True, sampler=trainsampler)

    classes = ('plane', 'car', 'bird', 'cat', 'deer',
               'dog', 'frog', 'horse', 'ship', 'truck')
    start = datetime.now()
    total_step = len(trainloader)
    for epoch in range(args.epochs):
        for i, (images, labels) in enumerate(trainloader):
            images = images.cuda(non_blocking=True)
            labels = labels.cuda(non_blocking=True)
            # Forward pass
            outputs = model(images)
            loss = criterion(outputs, labels)

            # Backward and optimize
            optimizer.zero_grad()
            with amp.scale_loss(loss, optimizer) as scaled_loss:
                scaled_loss.backward()
            optimizer.step()
            print('Epoch [{}/{}], Step [{}/{}], Loss: {:.4f}'.format(
                epoch + 1,
                args.epochs,
                i + 1,
                total_step,
                loss.item())
            )
    if gpu == 0:
        print("Training complete in: " + str(datetime.now() - start))
~~~~
The PAI_TASK_INDEX is the sequence number of the node in the cluster.


amp.initialize wraps the model and optimizer for mixed precision training. Note that that the model must already be on the correct GPU before calling amp.initialize. The opt_level goes from O0, which uses all floats, through O3, which uses half-precision throughout. O1 and O2 are different degrees of mixed-precision, the details of which can be found in the Apex documentation. Yes, the first character in all those codes is a capital letter ‘O’, while the second character is a number. Yes, if you use a zero instead, you will get a baffling error message.。

 apex.parallel.DistributedDataParallel is a drop-in replacement for nn.DistributedDataParallel. We no longer have to specify the GPUs because Apex only allows one GPU per process. It also assumes that the script calls torch.cuda.set_device(local_rank) before moving the model to GPU.
 
 Mixed-precision training requires that the loss is scaled in order to prevent the gradients from underflowing. Apex does this automatically.
## OpenPai Example Yaml

