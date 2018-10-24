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
import re
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F

from torchtext import data
from torchtext import datasets

class Model(nn.Module):
    def __init__(self, vocab_size, idim=20, hdim = 50, nlayers = 2, use_attention = True, ndirections = 2):
        super(Model, self).__init__()
        self.embeds = nn.Embedding(vocab_size, idim, padding_idx=1)
        self.gru = nn.GRU(input_size = idim, hidden_size = hdim, num_layers = nlayers, bidirectional = (ndirections == 2), dropout = 0.5)
        self.fc = nn.Sequential(nn.Linear(nlayers * ndirections * hdim, 1), nn.Sigmoid())

        self.use_attention = use_attention
        self.att = nn.Linear(hdim * ndirections + idim, 1)
        self.fc_att = nn.Sequential(nn.Linear(hdim * ndirections, 100), nn.Dropout(0.5), nn.Linear(100, 1), nn.Sigmoid())
    
    def forward(self, inputs):
        x = self.embeds(inputs)
        out, hidden = self.gru(x)
        if self.use_attention:
            out = torch.transpose(out, 0, 1).contiguous()
            att_weights = None
            for i, batch in enumerate(out):
                att_out = self.att(torch.cat((batch,x[:,i,:]), 1))
                if att_weights is None:
                    att_weights = att_out
                else:
                    att_weights = torch.cat((att_weights, att_out), 1)
            att_weights = F.softmax(att_weights, dim=0)
            att_weights = torch.transpose(att_weights, 0, 1).unsqueeze(2)
            att_applied = torch.sum(out * att_weights, 1)
            att_result = self.fc_att(att_applied)
            return att_result
        return self.fc(torch.transpose(hidden, 0, 1).contiguous().view(x.size(1), -1))

def replace(matched):
    return " " + matched.group("m") + " "

def tokenize_line_en(line):
    line = re.sub(r"\t", "", line)
    line = re.sub(r"^\s+", "", line)
    line = re.sub(r"\s+$", "", line)
    line = re.sub(r"<br />", "", line)
    line = re.sub(r"(?P<m>\W)", replace, line)
    line = re.sub(r"\s+", " ", line)
    return line.split()

def preprocessing(x):
    return x[:400]

def get_imdb_iter(args):
    if not os.path.exists(args.data_dir):
        os.mkdir(args.data_dir)

    TEXT  = data.Field(tokenize=tokenize_line_en, lower=True, preprocessing = preprocessing)
    LABEL = data.Field(unk_token=None, pad_token=None)
    train, test = datasets.IMDB.splits(TEXT, LABEL, root=args.data_dir)
    TEXT.build_vocab(train)
    LABEL.build_vocab(train)
    print('Number of train dataset:', len(train))
    print('Number of validation dataset:', len(test))
    train_iter, test_iter = data.BucketIterator.splits(
        (train, test), batch_size=args.batch_size, device="cuda:0")
    return train_iter, test_iter, TEXT.vocab

def save_model(args, model):
    if not os.path.exists(args.model_dir):
        os.mkdir(args.model_dir)
    torch.save(model.state_dict(), os.path.join(args.model_dir, args.model_name))

def validate(model, val_iter, criterion):
    model.eval()
    val_loss = 0
    corrects = 0
    num = 0
    with torch.no_grad():
        for batch in iter(val_iter):
            output = model(batch.text).squeeze()
            val_loss += criterion(output, batch.label.squeeze().float()).item()
            preds = torch.ge(output, 0.5).long()
            corrects += preds.eq(batch.label.squeeze()).sum().item()

            num += len(batch)
            print(num, end='\r')
    return val_loss, corrects, num

def predict(movie_reviews, args):
    _, _, vocab = get_imdb_iter(args)
    model = Model(len(vocab)).cuda()
    try:
        model.load_state_dict(torch.load(os.path.join(args.model_dir, args.model_name)))
    except:
        print('Error loading model file, please train the model and make sure model file({}) exists.'
            .format(os.path.join(args.model_dir, args.model_name)))
    model.eval()

    with torch.no_grad():
        for movie_review in movie_reviews:
            data = preprocessing(tokenize_line_en(movie_review))
            data = [vocab.stoi[x] for x in data]
            data = torch.LongTensor(data).unsqueeze(1).cuda()
            positive_probablity = model(data).item()
            prediction = 'positive' if positive_probablity >= 0.5 else 'negative'
            print('\nMovie review: {}\nPrediction: {} ({:.4f})'.format(movie_review, prediction, positive_probablity))

def train(args):
    train_iter, val_iter, vocab = get_imdb_iter(args)
    model = Model(len(vocab)).cuda()
    criterion = nn.BCELoss()
    optimizer = optim.Adam(model.parameters(), lr=args.lr)
    best_val_corrects = 0
    train_corrects = 0
    nIteration = 0
    numTrain = 0

    for batch in iter(train_iter):
        nIteration += 1
        model.train()
        optimizer.zero_grad()
        output = model(batch.text).squeeze()
        loss = criterion(output, batch.label.squeeze().float())
        loss.backward()
        optimizer.step()

        preds = torch.ge(output, 0.5).long()
        train_corrects = preds.eq(batch.label.squeeze()).sum().item()

        numTrain += len(batch)
        epoch = numTrain / len(train_iter.dataset)
        print('Epoch: {:.2f} \tLoss: {:.4f} Acc: {:.2f}% ({} / {})'
            .format(epoch, loss.item(), 100. * train_corrects / len(batch), train_corrects, len(batch)), end='\r')

        if nIteration % 200 == 0:
            print('\n')
            val_loss, corrects, num = validate(model, val_iter, criterion)
            val_loss /= (num / args.batch_size)
            print('\nVal Loss: {:.4f}, Val Acc: {}/{} ({:.02f}%)\n'.format(
                val_loss, corrects, num, 100. * corrects / num))

            if corrects > best_val_corrects:
                save_model(args, model)
                best_val_corrects = corrects
        if epoch > args.epochs:
            return

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("--lr", type=float, default=0.002, help="Learning rate", required=False)
    parser.add_argument("--batch_size", type=int, default=128, help="Batch size", required=False)
    parser.add_argument('--epochs', type=int, default=20, help='Number of training epochs', required=False)
    parser.add_argument('--data_dir', type=str, default='data', help='Directory to put training data', required=False)
    parser.add_argument('--model_dir', type=str, default='model', help='Directory to save models', required=False)
    parser.add_argument('--model_name', type=str, default='best_model.pth', help='Directory to save models', required=False)

    args, unknown = parser.parse_known_args()

    train(args)
    predict(['I love this movie!',
        'This movie is too bad.',
        'It\'s not Citizen Kane, but it does deliver. Cleavage, and lots of it. \
        Badly acted and directed, poorly scripted. Who cares? I didn\'t watch it for the dialog.'
        ], args)
