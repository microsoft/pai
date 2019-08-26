# Remote Development

## 1. Overview

Remote Development can allow users to develop locally with PAI's resources and improve users’ development experience.

For now, Remote Development support CLI, VS Code, and PyCharm.

***NOTICE: This is still an experiment solution and may be changed in future release.***

## 2. Directory Structure

```
remote-dev/
├── README.md
├── conf
│   ├── clusters.template        # pai cluster conf
│   ├── exports.template         # NFS conf
│   └── job.template             # PAI template job
└── start.sh                     # start script
```

## 3. Usage

### 3.1 Ask PAI for resources

First, please configure the vars in ```.env.template``` and rename this file to ```.env```.

```sh
# PAI ENV
export username=""               # PAI user name
export password=""               # PAI user password
export serverip=""               # PAI cluster ip

# HOST ENV
export hostip=""                 # Local host IP
export share=""                  # Local workspace
```

After configuration, you can edit the ```gpu, cpu, memoryMB``` section of ```conf/job.template```.

Then you can run ```./start.sh``` to get a container with resources from PAI.

### 3.2 CLI

For CLI usage, just run ```./start.sh```, and you will ssh into the container. Your workspace will be mounted at ```/workspace``` using NFS.

### 3.3 PyCharm

For PyCharm usage, you can configure PyCharm ```Deployment``` and ```Project Interpreter``` refer to this [doc](https://www.jetbrains.com/help/pycharm/remote-debugging-with-product.html).

### 3.4 VS Code

For VS Code usage, you can use a plugin named ```Remote Development``` and configure it refer to this [doc](https://www.jetbrains.com/help/pycharm/remote-debugging-with-product.html).

## License

    MIT License

    Copyright (c) Microsoft Corporation. All rights reserved.

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE