## Cleaner section parser

- [Default Configuration](#D_Config)
- [How to Configure](#HT_Config)
- [Generated Configuraiton](#G_Config)
- [Data Table](#T_config)

#### Default configuration <a name="D_Config"></a>

[cleaner default configuration](cleaner.yaml)

#### How to configure cluster section in service-configuraiton.yaml <a name="HT_Config"></a>

All configurations in this section is optional. If you want to customized these value, you can configure it in service-configuration.yaml.

For example, if you want to use different threshold than the default value 94, add following to your service-configuration.yaml as following:

```yaml
cleaner:
    threshold: new-value
    interval: new-value
```

#### Generated Configuration <a name="G_Config"></a>

After parsing, object model looks like:

```yaml
cleaner:
    threshold: 90
    interval: 60
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
    <td>cleaner.threshold</td>
    <td>com["cleaner"]["threshold"]</td>
    <td>cluster_cfg["cleaner"]["threshold"]</td>
    <td>Int</td>
</tr>
<tr>
    <td>cleaner.interval</td>
    <td>com["cleaner"]["interval"]</td>
    <td>cluster_cfg["cleaner"]["interval"]</td>
    <td>Int</td>
</tr>
</table>