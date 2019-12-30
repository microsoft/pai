## Hadoop resource manager section parser

- [Default Configuration](#D_Config)
- [How to Configure](#HT_Config)
- [Generated Configuration](#G_Config)
- [Data Table](#T_config)

#### Default configuration <a name="D_Config"></a>

[hadoop-resource-manager default configuration](hadoop-resource-manager.yaml)

#### How to configure cluster section in service-configuration.yaml <a name="HT_Config"></a>

All configurations in this section is optional.
If you want to customized these value, you can configure it in service-configuration.yaml.


- `virtualClusters` Initial virtual cluster, containers multiple sub-clusters, the total capacity should equal to 100.
    - `virtualClusters.{name}` Sub-cluster name.
        - `virtualClusters.{name}.description` Comments, no influence.
        - `virtualClusters.{name}.capacity` Resource quota.

- `yarn_exporter_port` The port used to export yarn metrics.



#### Generated Configuration <a name="G_Config"></a>

After parsing, object model looks like:
```yaml
hadoop-resource-manager:
    virtualClusters:
      default:
        description: Default VC.
        capacity: 100

    yarn_exporter_port: 9459
    yarn_log_retain_seconds: 2592000
```


#### Table <a name="T_Config"></a>

<table>
<tr>
    <td>Data in Configuration File</td>
    <td>Data in Cluster Object Model</td>
    <td>Data in Jinja2 Template</td>
    <td>Data type</td>
</tr>
<tr>
    <td>hadoop-resource-manager.virtualClusters</td>
    <td>com["hadoop-resource-manager"]["virtualClusters"]</td>
    <td>cluster_cfg["hadoop-resource-manager"]["virtualClusters"]</td>
    <td>Dict</td>
</tr>
<tr>
    <td>hadoop-resource-manager.virtualClusters.{ vcName }.description</td>
    <td>com["hadoop-resource-manager"]["virtualClusters"][{ vcName }]["description"]</td>
    <td>cluster_cfg["hadoop-resource-manager"]["virtualClusters"][{ vcName }]["description"]</td>
    <td>Str</td>
</tr>
<tr>
    <td>hadoop-resource-manager.virtualClusters.{ vcName }.capacity</td>
    <td>com["hadoop-resource-manager"]["virtualClusters"][{ vcName }]["capacity"]</td>
    <td>cluster_cfg["hadoop-resource-manager"]["virtualClusters"][{ vcName }]["capacity"]</td>
    <td>Int</td>
</tr>
<tr>
    <td>hadoop-resource-manager.yarn_exporter_port</td>
    <td>com["hadoop-resource-manager"]["yarn_exporter_port"]</td>
    <td>cluster_cfg["hadoop-resource-manager"]["yarn_exporter_port"]</td>
    <td>Int</td>
</tr>
<tr>
    <td>hadoop-resource-manager.yarn_log_retain_seconds</td>
    <td>com["hadoop-resource-manager"]["yarn_log_retain_seconds"]</td>
    <td>cluster_cfg["hadoop-resource-manager"]["yarn_log_retain_seconds"]</td>
    <td>Int</td>
</tr>
</table>
