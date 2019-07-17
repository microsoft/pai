## Log-manager section parser

- [Default Configuration](#D_Config)
- [How to Configure](#HT_Config)
- [Generated Configuraiton](#G_Config)
- [Data Table](#T_config)

#### Default configuration <a name="D_Config"></a>

[log-manager default configuration](log-manager.yaml)

#### How to configure cluster section in service-configuraiton.yaml <a name="HT_Config"></a>

All configurations in this section is optional. If you want to customized these value, you can configure it in service-configuration.yaml.

For example, if you want to use different port than the default 9103, add following to your service-configuration.yaml as following:
```yaml
log-manager:
    port: new-value
```

#### Generated Configuration <a name="G_Config"></a>

Generated configuration means the object model after parsing. The parsed data will be presented by a yaml format.
```yaml
log-manager:
    port: 9103
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
    <td>log-manager.port</td>
    <td>com["log-manager"]["port"]</td>
    <td>cluster_cfg["log-manager"]["port"]</td>
    <td>Int</td>
</tr>
</table>
