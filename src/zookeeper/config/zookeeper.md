## zookeeper section parser

- [Generated Configuraiton](#G_Config)
- [Data Table](#T_config)

#### Generated Configuration <a name="G_Config"></a>

Generated configuration means the object model after parsing. The parsed data will be presented by a yaml format.
```yaml
zookeeper:
    host-list:
      - hostname1
      - hostname2
      - hostname3

    quorum: hostip1:2181,hostip2:2181,hostip3:2181
    zk-servers: "server.1=zoo1:2888:3888
server.2=zoo2:2888:3888
server.3=zoo3:2888:3888"

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
    <td>None</td>
    <td>com["zookeeper"]["quorum"]</td>
    <td>cluster_cfg["zookeeper"]["quorum"]</td>
    <td>string</td>
</tr>
<tr>
    <td>None</td>
    <td>com["zookeeper"]["host-list"]</td>
    <td>cluster_cfg["zookeeper"]["host-list"]</td>
    <td>string list</td>
</tr>
<tr>
    <td>None</td>
    <td>com["zookeeper"]["zk-servers"]</td>
    <td>cluster_cfg["zookeeper"]["zk-servers"]</td>
    <td>string</td>
</tr>
</table>



