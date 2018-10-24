# ====================================================================================================== #
# The MIT License (MIT)
# Copyright (c) Microsoft Corporation
#
# Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
# associated documentation files (the "Software"), to deal in the Software without restriction,
# including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
# and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
# subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all copies or substantial
# portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
# NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
# IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
# WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
# SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
# ====================================================================================================== #

import os
import argparse

import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from torchvision import datasets, transforms

class Model(nn.Module):
    def __init__(self):
        super(Model, self).__init__()
        self.conv1 = nn.Conv2d(1, 32, 3, padding = 1)
        self.bn1 = nn.BatchNorm2d(32)
        self.conv2 = nn.Conv2d(32, 16, 3, padding = 1)
        self.bn2 = nn.BatchNorm2d(16)
        self.fc1 = nn.Linear(7*7*16, 100)
        self.fc2 = nn.Linear(100, 10)

    def forward(self, x):
        x = F.leaky_relu(F.max_pool2d(self.bn1(self.conv1(x)), 2))
        x = F.leaky_relu(F.max_pool2d(self.bn2(self.conv2(x)), 2))
        x = x.view(-1, 7*7*16)
        x = self.fc1(x)
        x = F.leaky_relu(F.dropout(x, 0.5))
        x = self.fc2(x)
        return x

def test_model_forward():
    # Use random data to quick test network architecture connections
    x = torch.randn(2, 1, 28, 28)
    model = Model()
    out = model(x)
    print(out.size())

def get_data_loader(args, train, shuffle = True):
    if not os.path.exists(args.data_dir):
        os.mkdir(args.data_dir)
    ts = transforms.Compose([transforms.ToTensor(), # Convert to tensor and scale to [0, 1]
                             transforms.Normalize((0.13,), (0.31,))]);
    ds = datasets.MNIST(args.data_dir, train=train, download=True, transform = ts)
    return torch.utils.data.DataLoader(ds, batch_size = args.batch_size, shuffle = shuffle)

def save_model(args, model, filename):
    if not os.path.exists(args.model_dir):
        os.mkdir(args.model_dir)
    torch.save(model.state_dict(), os.path.join(args.model_dir, filename))

def validate(model, device, val_loader, criterion):
    model.eval()
    val_loss = 0
    corrects = 0
    with torch.no_grad():
        for inputs, label in val_loader:
            inputs, label = inputs.to(device), label.to(device)
            output = model(inputs)
            val_loss += criterion(output, label).item()
            preds = output.max(1, keepdim=True)[1]
            corrects += preds.eq(label.view_as(preds)).sum().item()
    return val_loss, corrects, len(val_loader.dataset)

def train(args):
    train_loader = get_data_loader(args, True)
    val_loader = get_data_loader(args, False, shuffle = False)

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = Model().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.SGD(model.parameters(), lr=args.lr, momentum=0.6)
    best_corrects = 0

    for epoch in range(args.epochs):
        model.train()
        count = 0
        for inputs, label in train_loader:
            inputs, label = inputs.to(device), label.to(device)
            optimizer.zero_grad()
            output = model(inputs)
            loss = criterion(output, label)
            loss.backward()
            optimizer.step()
            count += len(inputs)
            print('Epoch {}: ({}/{})\tLoss: {:.4f}'.format(epoch, count, len(train_loader.dataset), loss.item()), end='\r')

        val_loss, corrects, num = validate(model, device, val_loader, criterion)
        val_loss /= (num / args.batch_size)
        print('\nValidation loss: {:.4f}, Validation accuracy: {}/{} ({:.02f}%)\n'.format(
            val_loss, corrects, num, 100. * corrects / num))

        if corrects > best_corrects:
            save_model(args, model, 'best_model.pth')
            best_corrects = corrects

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--lr', type=float, default=0.01, help='Learning rate', required=False)
    parser.add_argument('--batch_size', type=int, default=1000, help='Batch size', required=False)
    parser.add_argument('--epochs', type=int, default=20, help='Number of training epochs', required=False)
    parser.add_argument('--data_dir', type=str, default='data', help='Directory to put training data', required=False)
    parser.add_argument('--model_dir', type=str, default='model', help='Directory to save models', required=False)

    args, unknown = parser.parse_known_args()

    train(args)
