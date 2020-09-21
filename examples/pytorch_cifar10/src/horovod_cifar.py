#!/bin/env python
import re
import os
import sys
import argparse
import torch 
import torch.cuda as cuda
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
import torch.backends.cudnn as cudnn
import torchvision
import torchvision.transforms as transforms
import horovod.torch as hvd
if not os.path.exists('pytorch-cifar'):
    print('Please run init.sh first')    
    sys.exit(-1)
from cifar import models
from cifar import support_models


def parse_args():
    # Training configurations 
    parser = argparse.ArgumentParser(description='Configuration for cifar training')
    parser.add_argument('--lr', default=0.1, type=float, help='Learing Rate')
    parser.add_argument('--batchsize', type=int, default=128, help='Batchsize for training')
    parser.add_argument('--epoch', type=int, default=200, help='The number of epochs')
    parser.add_argument('--momentum', type=float, default=0.9, help='Momentum value for optimizer')
    parser.add_argument('--weight_decay', type=float, default=5e-4, help='Weight decay for the optimizer')
    # parser.add_argument('--lr_decay', choices=[None, 'cos', 'stage', 'step'], default=None, help='Learing rate decay')
    # Horovod configurations
    parser.add_argument('--seed', type=int, default=0, help='Random seed for pytorch.')
    parser.add_argument('--num_threads_per', type=int, default=4, help='Number of threads for each worker.')
    # parser.add_argument('--use-adasum', action='store_true', default=False, help='use adasum algorithm to do reduction')
    # Other configurations
    parser.add_argument('--arch', choices=support_models, default='ResNet18', help='Network type used for training')
    parser.add_argument('--outdir', type=str, default='./log', help='Outdir of results')
    return parser.parse_args()


def metric_average(val, name):
    tensor = torch.tensor(val)
    avg_tensor = hvd.allreduce(tensor, name=name)
    return avg_tensor.item()


def train_epoch(net, train_loader, optimizer, args):
    net.train()
    loss_sum = 0
    count = 0
    correct = 0
    for bid, (data, target) in enumerate(train_loader):
        data, target = data.cuda(), target.cuda()
        optimizer.zero_grad()
        output = net(data)
        loss = F.cross_entropy(output, target)
        loss.backward()
        optimizer.step()
        
        loss_sum += loss.item()
        count += data.size(0)
        _, predict = output.max(1)
        correct += predict.eq(target).sum().item()
    print('Loss: %.3f , Accuracy: %.3f' %(loss_sum/len(train_loader), correct/count) )


def validate(net, data_loader, args):
    net.eval()
    loss_sum = 0
    correct = 0
    count = 0
    with torch.no_grad():
        for bid, (data, target) in enumerate(data_loader):
            data, target = data.cuda(), target.cuda()
            output = net(data)
            loss = F.cross_entropy(output, target)
            _, predict = output.max(1)
            loss_sum += loss.item()
            count += target.size(0)
            correct += predict.eq(target).sum().item()
        
        val_acc = correct / count
        val_acc = metric_average(val_acc, 'avg_acc')
        val_loss = loss_sum / len(data_loader)
        val_loss = metric_average(val_loss, 'avg_loss')
        if hvd.rank() == 0:
            print('Loss: %.3f  Accuracy: %.3f' % (val_loss, val_acc))
    return val_acc


def prepare_data(args):
    print('==> Preparing Data...')
    cifar_transform_train = transforms.Compose([
        transforms.RandomCrop(32, padding=4),
        transforms.RandomHorizontalFlip(),
        transforms.ToTensor(),
        transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2023, 0.1994, 0.2010)),
    ])
    cifar_transform_val = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2023, 0.1994, 0.2010))
    ])
    # data-%d is used to avoid data corruption due data contention
    # or you can only put the data downloading part before the hvd.init
    train_set = torchvision.datasets.CIFAR10(root='./data-%d' % hvd.rank(), transform=cifar_transform_train, train=True, download=True)
    val_set = torchvision.datasets.CIFAR10(root='./data-%d' % hvd.rank(), transform=cifar_transform_val, train=False, download=False)
    train_sampler = torch.utils.data.distributed.DistributedSampler(train_set, num_replicas=hvd.size(), rank=hvd.rank())
    val_sampler = torch.utils.data.distributed.DistributedSampler(val_set, num_replicas=hvd.size(), rank=hvd.rank())
    train_loader = torch.utils.data.DataLoader(train_set, batch_size=args.batchsize, sampler=train_sampler, num_workers=4)
    val_loader = torch.utils.data.DataLoader(val_set, batch_size=args.batchsize, sampler=val_sampler, num_workers=4)
    return train_loader, val_loader, train_sampler, val_sampler


def train(args):
    train_loader, val_loader, train_sampler, _ = prepare_data(args)
    assert(cuda.is_available() and cuda.device_count() > 0)
    net = models.__dict__[args.arch]()
    net = net.cuda()
    optimizer = optim.SGD(net.parameters(), lr=args.lr, momentum=args.momentum, weight_decay=args.weight_decay)
    optimizer = hvd.DistributedOptimizer(optimizer, named_parameters=net.named_parameters())
    lr_scheduler = optim.lr_scheduler.MultiStepLR(optimizer, milestones=[int(args.epoch*0.5), int(args.epoch*0.75)], gamma=0.1)

    hvd.broadcast_parameters(net.state_dict(), root_rank=0)
    hvd.broadcast_optimizer_state(optimizer, root_rank=0)

    best_acc = 0
    checkpoint = {}
    for epochid in range(args.epoch):
        # Horovod: set epoch to sampler for shuffling.
        train_sampler.set_epoch(epochid)
        print("==> Training Epoch %d, Learning Rate %.4f" % (epochid, lr_scheduler.get_lr()[0]))
        train_epoch(net, train_loader, optimizer, args)
        print('==> Validating ')
        acc = validate(net, val_loader, args)
        lr_scheduler.step()
        if acc > best_acc:
            best_acc = acc
            checkpoint = net.state_dict()
            
                
    fname = args.arch + '_' + str(best_acc) + '.pth.tar'
    os.makedirs(args.outdir, exist_ok=True)
    fname = os.path.join(args.outdir, fname)
    if hvd.rank() == 0:
        torch.save(checkpoint, fname)
    print('Best Accuracy: ', best_acc)

if __name__ == '__main__':
    args = parse_args()
    hvd.init()
    torch.manual_seed(args.seed)
    torch.cuda.set_device(hvd.local_rank())
    torch.set_num_threads(args.num_threads_per)
    train(args)