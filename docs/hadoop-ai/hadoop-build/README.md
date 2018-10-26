<!--
  Copyright (c) Microsoft Corporation
  All rights reserved.

  MIT License

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
  documentation files (the "Software"), to deal in the Software without restriction, including without limitation
  the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
  to permit persons to whom the Software is furnished to do so, subject to the following conditions:
  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
  BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
-->
## Build hadoop-ai in docker container


```yaml

sudo docker build -t hadoop-build .

sudo docker run --rm --name=hadoop-build --volume=/hadoop-binary:/hadoop-binary hadoop-build

```

Waiting until building finished. 
Then you will find hadoop binary in the path ```/hadoop-binary```


## Change hadoop version


currently we support two hadoop versions: 2.7.2 and 2.9.0, If you want to switch the hadoop version, please follow below steps:

1. Change the patch file url in build.sh in the same folder.

2. Change the patch file name in build.sh if necessary.

3. Change hadoop-binary setting in services-configuration.yaml under your cluster configs path:

           custom-hadoop-binary-path: /hadoop-binary/hadoop-2.9.0.tar.gz

4. Change the done file ID in ```src/hadoop-ai/build/build-pre.sh ``` and ```src/hadoop-ai/build/build.sh```

5. Use paictl to build, push the image.

6. Stop/start the hadoop-resource-manager and hadoop-node-manager
