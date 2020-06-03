import os
import tempfile
import torch
import torch.distributed as dist
import torch.nn as nn
import torch.optim as optim
import torch.multiprocessing as mp
import argparse

from torch.nn.parallel import DistributedDataParallel as DDP

def cleanup():
    dist.destroy_process_group()


class ToyModel(nn.Module):
    def __init__(self):
        super(ToyModel, self).__init__()
        self.net1 = nn.Linear(10, 10)
        self.relu = nn.ReLU()
        self.net2 = nn.Linear(10, 5)

    def forward(self, x):
        return self.net2(self.relu(self.net1(x)))


def demo_basic(rank, world_size):
    print(f"Running basic DDP example on rank {rank}.")

    print(type(rank))

    os.environ['MASTER_ADDR'] = os.environ['PAI_HOST_IP_chief_0']
    os.environ['MASTER_PORT'] = os.environ['PAI_PORT_LIST_chief_0_http']

    # initialize the process group
    dist.init_process_group("nccl", rank=rank, world_size=world_size)

    local_rank = int(rank)
    # if os.environ['PAI_CURRENT_TASK_ROLE_CURRENT_TASK_INDEX'] == 1:
    if local_rank > 3:
        local_rank -= 4
    print("rank", rank)
    print("local_rank", local_rank)
    dp_device_ids = [local_rank]
    torch.cuda.set_device(local_rank)

    # create model and move it to GPU with id rank
    # model = ToyModel().to(rank)
    # ddp_model = DDP(model, device_ids=[rank])
    model = ToyModel().cuda()
    ddp_model = DDP(model, device_ids=dp_device_ids, output_device=local_rank)

    loss_fn = nn.MSELoss()
    optimizer = optim.SGD(ddp_model.parameters(), lr=0.001)

    optimizer.zero_grad()
    outputs = ddp_model(torch.randn(20, 10))
    labels = torch.randn(20, 5).cuda()
    loss_fn(outputs, labels).backward()
    optimizer.step()

    cleanup()


def run_demo(demo_fn, world_size):
    mp.spawn(demo_fn,
             args=(world_size,),
             nprocs=world_size,
             join=True)

if __name__ == "__main__":
    print("os.environ", os.environ)

    n_gpus = torch.cuda.device_count()
    print("ngpus:", n_gpus)
    # if n_gpus < 8:
    #     print(f"Requires at least 8 GPUs to run, but got {n_gpus}.")
    # else:
        
    run_demo(demo_basic, 8)
