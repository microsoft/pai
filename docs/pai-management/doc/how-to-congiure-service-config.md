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

### Necessary Configuration <a name="necessary"></a>

There are only 2 configuration which is mandatory for admin to configure. And see the yaml format data following。

```YAML
rest-server:
  # database admin username
  default-pai-admin-username: your_default_pai_admin_username
  # database admin password
  default-pai-admin-password: your_default_pai_admin_password
```  









