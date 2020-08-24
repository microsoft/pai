#         在OpenPai中进行分布式数据并行训练

## 动机
加快神经网络训练速度的最简单方法是使用GPU，该GPU在神经网络中常见的计算类型（矩阵乘法和加法）上提供了比CPU大的加速。随着模型或数据集变得更大，一个GPU很快就会变得不足。例如，BERT和GPT-2等大型语言模型在数百个GPU上进行了训练。要执行多GPU训练，我们必须有一种在不同GPU之间拆分模型和数据并协调训练的方法。

## 为什么要并行分配数据？
Pytorch有两种在多个GPU之间拆分模型和数据的方式：nn.DataParallel和nn.DistributedDataParallel。nn.DataParallel更易于使用（只需包装模型并运行训练脚本）。但是，由于它使用一个过程来计算模型权重，然后在每批中将它们分配给每个GPU，因此网络很快成为瓶颈，并且GPU利用率通常非常低。此外，nn.DataParallel要求所有GPU都在同一节点上，并且不能与Apex一起使用以进行混合精度训练。



## 有关使用Pytorch编写分布式应用程序的教程
pytorch官方教程：https://pytorch.org/tutorials/intermediate/ddp_tutorial.html

Pytorch提供的example（https://github.com/pytorch/examples/tree/master/imagenet）   
培训示例。该示例还演示了Pytorch几乎具有的所有其他功能，因此很难找出与分布式多GPU培训有关的内容。




## 大纲
本教程实际上是针对已经熟悉Pytorch中的神经网络模型训练的人员的。然后，我展示了在GPU上使用cifar10进行培训的最小工作示例。我修改了此示例，以在可能跨多个节点的多个GPU上进行训练，并逐行解释更改。重要的是，我还解释了如何运行代码。另外，我还演示了如何使用Apex进行简单的混合精度分布式培训。

## DDP原理
多处理 DistributedDataParallel在多个GPU中复制模型，每个GPU都由一个进程控制。（一个进程是在计算机上运行的python的一个实例；通过并行运行多个进程，我们可以利用具有多个CPU内核的procressor。如果需要，可以让每个进程控制多个GPU，但这显然比每个进程拥有一个GPU慢。也可能有多个工作进程为每个GPU提取数据，但是为了简单起见，我将其省略。）GPU都可以在同一节点上或分散跨多个节点。（节点是一台“计算机”，包括其所有CPU和GPU。）每个进程执行相同的任务，每个进程与所有其他进程通信。

![image](289EA5072CF94054A99B9CE9414DC1C1)

在训练期间，每个进程都从磁盘加载自己的minibatches并将它们传递到其GPU。每个GPU都有自己的forward pass，然后梯度在GPU上全部减小。每层的梯度不依赖于先前的层，因此梯度下降与反向传递同时计算，以进一步缓解网络瓶颈。向后遍历结束时，每个节点都具有平均梯度，从而确保模型权重保持同步。

所有这一切都需要同步并通信可能在多个节点上的多个进程。Pytorch通过其distributed.init_process_group功能来做到这一点。此功能需要知道在哪里可以找到进程0，以便所有进程都可以同步，并可以预期到进程总数。每个单独的进程还需要知道进程总数，在进程中的排名以及使用哪个GPU。通常将进程总数称为world size。最后，每个流程都需要知道要处理的数据片段，以便批次不重叠。Pytorch提供nn.utils.data.DistributedSampler了完成此任务的方法。

最少的工作示例及说明
为了演示如何执行此操作，我将创建一个在Cifar10上进行训练的示例，然后将其修改为在多个节点上的多个GPU上运行，最后还允许进行混合精度训练。

## 单机单卡不加到OpenPai
首先，我们导入包

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

我们定义了一个非常简单的卷积模型来预测cifar10
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
该main()函数将接受一些参数并运行训练函数。
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
这是train功能
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
最后，我们要确保main()函数被调用。

if __name__ == '__main__':
    main()
这里肯定有一些我们不需要的额外内容（例如，gpu和节点的数量），但是对于整个文档有用。

我们可以通过打开终端并输入来运行此代码python main.py -n 1 -g 1 -nr 0，这将在单个节点上的单个gpu上进行训练。

## 多机多卡并且加到openpai上
为此，我们需要一个脚本来为每个GPU启动一个进程。每个进程都需要知道要使用哪个GPU，以及它在所有正在运行的进程中的位置。我们需要在每个节点上运行脚本。

让我们看一下每个函数的更改。我已经标记了新代码，以使其易于查找。
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

args.nodes 是我们将要使用的节点总数。
args.gpus 是每个节点上的GPU数量。
args.nr是当前节点在所有节点中的排名，从0到args.nodes-1。
现在，让我们逐行介绍新的更改：

第16行：基于节点数和每个节点的GPU，我们可以计算world_size或要运行的进程总数，它等于GPU的总数，因为我们为每个进程分配一个GPU。

第18行：告诉多处理模块要为进程0查找哪个IP地址。它需要此地址，以便所有进程可以首先同步，MASTER_ADDR即为主节点地址，PAI_HOST_IP_worker_0中的worker_0为主节点机器的名称。主节点IP是通过读取环境变量的方式初始化。

第19行：同样，这是查找进程0时要使用主节点的端口，通过python读取环境变量来初始化。

（注意：主节点地址和通信端口为集群共有，可以通过不同的方式初始化）

在这个程序中，启动train并不是一次, 这个程序spawn args.gpus processes, e每一个进程执行train(i, args), 0 <= i < args.gpus - 1.我会在每个节点上执行main()函数，所以一共有 args.nodes * args.gpus = args.world_size个进程。

接下来，让我们看一下对的修改train
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

rank = int(os.environ['PAI_TASK_INDEX']) * args.gpus + gpu来替代 rank = args.nr * args.gpus + gpu：这是所有进程中每个进程的全局排名（每个GPU一个进程）。PAI_TASK_INDEX是节点在集群的的序号，替代参数nr。

dist.init_process_group：初始化流程并与其他流程结合。这是“阻塞”，这意味着在所有进程都加入之前，没有任何进程会继续。我在nccl这里使用后端，因为pytorch文档说它是可用版本中最快的。在init_method告诉所有进程如何寻找一些设置。在这种情况下，它将查看我们在中设置的MASTER_ADDR和的环境变量。我也可以在那里设置，但是我选择在这里将其设置为关键字参数，以及当前进程的全局排名。

nn.parallel.DistributedDataParallel(model,
                                                device_ids=[gpu])：将模型包装为DistributedDataParallel模型。这会将模型复制到GPU上进行处理。

nn.utils.data.DistributedSampler:确保每个过程都获得不同的训练数据片段。

torch.utils.data.DataLoader使用nn.utils.data.DistributedSampler而不是按常规方法改组。

例如，要在具有8个GPU的4个节点上运行此程序，我们需要4个终端来分别跑这个程序。在节点0上：

python cifar10-distributed.py -n 4 -g 8

然后，在其他节点上：

python cifar10-distributed.py -n 4 -g 8

对于 我∈ 1 ，2 ，3。换句话说，我们在每个节点上运行此脚本，告诉它args.gpus在培训开始之前启动彼此同步的进程。

请注意，集群的批处理大小现在是每个GPU批处理大小（脚本中的值）* GPU的总数（worldsize）。

## 与Apex混合精度
混合精度训练（结合浮点（FP32）和半精度（FP16）精度的训练）使我们可以使用更大的批处理大小，并利用NVIDIA Tensor Core进行更快的计算。。我们只需要更改train功能。为了简洁起见，我从这里的示例中取出了数据加载代码和向后传递的代码
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
PAI_TASK_INDEX是节点在集群的的序号。

amp.initialize包装模型和优化器以进行混合精度训练。请注意，在调用之前，该模型必须已经在正确的GPU上amp.initialize。opt_level从O0，它采用all floats，通过O3，它使用half-precision。O1和O2是不同程度的混合精度，有关详细信息，请参见Apex文档（https://nvidia.github.io/apex/amp.html#opt-levels-and-properties） 
是的，所有这些代码中的第一个字符是大写字母“ O”，而第二个字符是数字。是的，如果您改用零，则会报错。

apex.parallel.DistributedDataParallel替代品nn.DistributedDataParallel。我们不再需要指定GPU，因为Apex每个进程只允许一个GPU。它还假设脚本torch.cuda.set_device(local_rank)在将模型移至GPU之前调用（torch.cuda.set_device(gpu)）。
