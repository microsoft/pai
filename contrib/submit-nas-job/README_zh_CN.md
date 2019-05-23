# Submit NFS Job Plugin

A web portal plugin to submit job with data on NFS.

## Build

```bash
git clone https://github.com/Microsoft/pai.git
cd pai/contrib/submit-nas-job
yarn
yarn build
```

The built file will be located in `dist/plugin.js`.

## Deploy

Put the built plugin file to a static file server that is accessible by the user.

Read [PLUGINS](../../docs/webportal/PLUGINS.md#publish) for details.

## Install

Append the following plugin configuration to the `webportal.plugins` section of `service-configuration.yaml` file.

```yaml
webportal:
  plugins:
  - id: submit-nas-job
    title: Submit NAS Job
    uri: # URL of the deployed plugin file.
```

## Storage Preparation

See <https://github.com/Microsoft/pai/wiki/Simplified-Job-Submission-for-OpenPAI-with-NFS-deployment>

## Develop

```bash
git clone https://github.com/Microsoft/pai.git
cd pai/contrib/submit-nas-job
yarn
yarn start
```

Configure the plugin of webportal env file with the uri `http://localhost:8080/plugin.js`.

## License

    Copyright (c) Microsoft Corporation
    All rights reserved.
    
    MIT License
    
    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:
    
    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.