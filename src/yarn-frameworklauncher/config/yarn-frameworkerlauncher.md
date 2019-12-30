## yarn-frameworkerlauncher section parser

- [Default Configuration](#D_Config)
- [How to Configure](#HT_Config)
- [Generated Configuration](#G_Config)
- [Data Table](#T_config)



#### Default configuration <a name="D_Config"></a>

[yarn-frameworklauncher default configuration](yarn-frameworklauncher.yaml)

#### How to configure cluster section in service-configuration.yaml <a name="HT_Config"></a>

All configurations in this section is optional. If you wanna customized these value, you can configure it in service-configuration.yaml.

For example, if you wanna reconfigure ```yarn-frameworklauncher.frameworklauncher-port``` with a new value. You should configure it in [service-configuration.yaml](../../../examples/cluster-configuration/services-configuration.yaml) with the yaml style as following.
```yaml
yarn-frameworklauncher:
    frameworklauncher-port: new-value
```

#### Generated Configuration <a name="G_Config"></a>

Generated configuration means the object model after parsing. The parsed data will be presented by a yaml format.
```yaml
yarn-frameworklauncher:
    frameworklauncher-port: 9086
    node-list:
      - hostname1
    webservice: http://hostip1:${frameworklauncher-port}
    launcher-address: hostip1

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
    <td>drivers.frameworklauncher-port</td>
    <td>com["yarn-frameworklauncher"]["frameworklauncher-port"]</td>
    <td>cluster_cfg["yarn-frameworklauncher"]["frameworklauncher-port"]</td>
    <td>Int</td>
</tr>
<tr>
    <td>None</td>
    <td>com["yarn-frameworklauncher"]["node-list"]</td>
    <td>cluster_cfg["yarn-frameworklauncher"]["node-list"]</td>
    <td>string list</td>
</tr>
<tr>
    <td>None</td>
    <td>com["yarn-frameworklauncher"]["webservice"]</td>
    <td>cluster_cfg["yarn-frameworklauncher"]["webservice"]</td>
    <td>string</td>
</tr>
<tr>
    <td>None</td>
    <td>com["yarn-frameworklauncher"]["launcher-address"]</td>
    <td>cluster_cfg["yarn-frameworklauncher"]["launcher-address"]</td>
    <td>string</td>
</tr>
</table>



