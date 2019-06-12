## Hadoop data node section parser

- [Default Configuration](#D_Config)
- [How to Configure](#HT_Config)
- [Generated Configuraiton](#G_Config)
- [Data Table](#T_config)

#### Default configuration <a name="D_Config"></a>

[hadoop-data-node default configuration](hadoop-data-node.yaml)

#### How to configure cluster section in service-configuraiton.yaml <a name="HT_Config"></a>

All configurations in this section is optional. If you want to customized these value, you can configure it in service-configuration.yaml.

- `storage_path` The hdfs storage folders, support comma-delimited list of directories. if isn't specified, will use `cluster.common.data-path/hdfs/data`

#### Generated Configuration <a name="G_Config"></a>

After parsing, object model will be a comma-delimited string, every substring is a directory:

```yaml
storage_path: /path/to/folder1,/path/to/folder2,...
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
    <td>hadoop-data-node.virtualClusters</td>
    <td>com["hadoop-data-node"]["storage_path"]</td>
    <td>cluster_cfg["hadoop-data-node"]["storage_path"]</td>
    <td>Str</td>
</tr>
</table>