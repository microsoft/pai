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

# Prometheus Monitoring Service
The monitor service is the entrance for cluster monitoring.
User can monitor cluster and node through the web UI.

## Installation
The [readme](../service-deployment/README.md) in service deployment introduces the overall installation process, including that of the web portal. 
The following parameters in the [clusterconfig.yaml](../service-deployment/clusterconfig-example.yaml) are of interest to web portal.
* grafana_addr: String, the address of the grafana server which is the entry of the monitor service, for example, http://10.0.3.9:3000
* grafana_port: Int, the port to use when launching grafana, for example, 3000
* prometheus_addr: String, the address of the prometheus dashboard, for example, http://10.0.3.9:9090
* prometheus_port: Int, the port to use when launching prometheus, for example, 9090
* grafana_port: Int, the port to use when launching node exporter, for example, 9100

## Usage

### Documentation
Click the tab "Documentation" to view the documentation of our system.

### View cluster status (PAI_ClusterView Dashboard)


Click the link http://{grafana_addr}/dashboard/db/pai_clusterview (For example: http://10.0.1.9:3003/dashboard/db/pai_clusterview) to go to the dashboard of grafana, where it shows all nodes metrics running on the cluster.

### View single node status (PAI_NodeView Dashboard)
Click the tab "Node Dashboard"'s IP address to display the single node metrics. 

