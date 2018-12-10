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


## Customize Your service-configuration.yaml

### Index
- [Configuration Example](#example)
- [Necessary Configuration](#necessary)
- [Customized Configuration (Optional)](#optional)

### Configuration Example <a name="example"></a>
An example service-configuration.yaml file is available [here](../../../examples/cluster-configuration/service-configuration.yaml). The yaml file includes the following fields.

### Necessary Configuration - Minimal configuration to setup OpenPai <a name="necessary"></a>

There are only 2 mandatory configuration for admin to configure in ```service-configuration.yaml```. And see the yaml format data following.

```YAML
rest-server:
  # database admin username
  default-pai-admin-username: your_default_pai_admin_username
  # database admin password
  default-pai-admin-password: your_default_pai_admin_password
```  

### Necessary Configuration - Minimal configuration to setup OpenPai <a name="optional"></a>

Besides the default cofiguration to make OpenPai start, admin could customize each service component within permissible scope. From the example ```serivce-configuration.yaml```, you could find a lot of commented fileds, such as the following. For example, If you wanna customize ```drivers```, you can uncomment the filed, and overwrite the default value with your expected value. 
```YAML
#drivers:
#  set-nvidia-runtime: false
#  # You can set drivers version here. If this value is miss, default value will be 384.111
#  # Current supported version list
#  # 384.111
#  # 390.25
#  # 410.73
#  version: "384.111"
```  


According to your requirements, choose the component which you wanna customized. Please read the table and the link in the table carefully. 

| Service | Description | Tutorial |
| --- | --- | --- |
| cluster| Configure common configuration for  cluster and docker-registry to pull image. | [Link](../../../src/cluster/config/cluster.md)|









