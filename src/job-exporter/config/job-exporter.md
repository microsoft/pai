## Job-exporter section parser

- [Default Configuration](#D_Config)
- [How to Configure](#HT_Config)
- [Generated Configuraiton](#G_Config)
- [Data Table](#T_config)

#### Default configuration <a name="D_Config"></a>

[job-exporter default configuration](job-exporter.yaml)

#### How to configure cluster section in service-configuraiton.yaml <a name="HT_Config"></a>

All configurations in this section is optional. If you want to customized these value, you can configure it in service-configuration.yaml.

For example, if you want to use different port than the default 9102, add following to your service-configuration.yaml as following:
```yaml
job-exporter:
    port: new-value
    logging-level: DEBUG
```

#### Generated Configuration <a name="G_Config"></a>

Generated configuration means the object model after parsing. The parsed data will be presented by a yaml format.
```yaml
job-exporter:
    port: 9100
    logging-level: DEBUG
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
    <td>job-exporter.port</td>
    <td>com["job-exporter"]["port"]</td>
    <td>cluster_cfg["job-exporter"]["port"]</td>
    <td>Int</td>
</tr>
<tr>
    <td>job-exporter.logging-level</td>
    <td>com["job-exporter"]["logging-level"]</td>
    <td>cluster_cfg["job-exporter"]["logging-level"]</td>
    <td>String</td>
</tr>
</table>
