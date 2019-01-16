## Hadoop resource manager section parser

- [Default Configuration](#D_Config)
- [How to Configure](#HT_Config)
- [Generated Configuraiton](#G_Config)
- [Data Table](#T_config)

#### Default configuration <a name="D_Config"></a>

[hadoop-resource-manager default configuration](hadoop-resource-manager.yaml)

#### How to configure cluster section in service-configuraiton.yaml <a name="HT_Config"></a>

All configurations in this section is optional. If you want to customized these value, you can configure it in service-configuration.yaml.

   
- `yarn_exporter_port` The port used to export yarn metrics.



#### Generated Configuration <a name="G_Config"></a>

After parsing, object model looks like:
```yaml
hadoop-resource-manager:
    
    yarn_exporter_port: 9459
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
    <td>hadoop-resource-manager.yarn_exporter_port</td>
    <td>com["hadoop-resource-manager"]["yarn_exporter_port"]</td>
    <td>cluster_cfg["hadoop-resource-manager"]["yarn_exporter_port"]</td>
    <td>Int</td>
</tr>
</table>
