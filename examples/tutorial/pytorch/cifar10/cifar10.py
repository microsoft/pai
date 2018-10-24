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
import torch.optim as optim
from torchvision import datasets, transforms

def make_conv_block(in_channels, out_channels):
    return [
        nn.Conv2d(in_channels, out_channels, 3, 1, 1),
        nn.ReLU(),
        nn.BatchNorm2d(out_channels),
        nn.Conv2d(out_channels, out_channels, 3, 1, 1),
        nn.ReLU(),
        nn.BatchNorm2d(out_channels),
        nn.MaxPool2d(2)
    ]

class Model(nn.Module):
    def __init__(self, nc=3, nclass=10):
        super(Model, self).__init__()
        self.conv = nn.Sequential(
            *make_conv_block(nc, 32),
            *make_conv_block(32, 64),
            *make_conv_block(64, 128),
            nn.Dropout2d(0.5)
        )
        self.fc = nn.Sequential(
            nn.Linear(128*4*4, 100),
            nn.ReLU(),
            nn.BatchNorm1d(100),
            nn.Dropout(0.5),
            nn.Linear(100, nclass)
        )

    def forward(self, x):
        x = self.conv(x)
        x = self.fc(x.view(-1, 128*4*4))
        return x

def test_model_forward():
    # Use random data to quick test network architecture connections
    x = torch.randn(2, 3, 32, 32)
    model = Model()
    out = model(x)
    print(out.size())

def get_data_loader(args, train, shuffle = True):
    if not os.path.exists(args.data_dir):
        os.mkdir(args.data_dir)
    ts = transforms.Compose([transforms.ToTensor(), # Convert to tensor and scale to [0, 1]
                             transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))]);
    ds = datasets.CIFAR10(args.data_dir, train=train, download=True, transform = ts)
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
    optimizer = optim.Adam(model.parameters(), lr=args.lr)
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
    parser.add_argument("--lr", type=float, default=0.01, help="Learning rate", required=False)
    parser.add_argument("--batch_size", type=int, default=256, help="Batch size", required=False)
    parser.add_argument('--epochs', type=int, default=20, help='Number of training epochs', required=False)
    parser.add_argument('--data_dir', type=str, default='data', help='Directory to put training data', required=False)
    parser.add_argument('--model_dir', type=str, default='model', help='Directory to save models', required=False)

    args, unknown = parser.parse_known_args()

    train(args)
