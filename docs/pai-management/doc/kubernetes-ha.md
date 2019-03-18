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

### ```Deploy Kubernetes on a Single Master Node (without HA)```

Single master mode does not have high availability.

- Only set one node's k8s-role as master
- Set this field ```load-balance-ip``` to your master's ip address

### ```Kubernetes with High Availability: The `proxy` Role```

There are 3 roles in [k8s-role-definition](../../../examples/cluster-configuration/k8s-role-definition.yaml). The ```master``` will start a k8s-master component on the specified machine. And the ```proxy``` will start a proxy component on the specified machine. In layout.yaml,

- One or more than one nodes are labeled with ```k8s-role: master```
- One node should be labeled with ```k8s-role: proxy```
- Set the field ```load-balance-ip``` to your proxy node's ip address

Node: the proxy node itself is not in ha mode. How to configure the proxy node in ha mode is out of the scope of PAI deployment.

### ```Kubernetes with High Availability: External Load Balancer```

If your cluster has a reliable load-balance server (e.g. in a cloud environment such as Azure), you could set up a load-balancer and set the field ```load-balance-ip``` in the kubernetes-configuration.yaml to the load-balancer.

- Set the field ```load-balance-ip`` to the ip-address of your load-balancer.


