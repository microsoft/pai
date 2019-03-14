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

job-exporter needs to expose network related metrics by listening to one of network interface. By default, job-exporter will listen to card of eth0 or eno2 whichever it found in the node. But if your card name is different from these, you should edit job-exporter config in your service-configuration.yaml like following:

```yaml
job-exporter:
    interface: eth1,eno1
```

the interface field is comma separated string, and job-exporter will listen to the one that found in your node. If none of interfaces found, job-exporter will select one that can access the internet.

#### Generated Configuration <a name="G_Config"></a>

Generated configuration means the object model after parsing. The parsed data will be presented by a yaml format.

```yaml
job-exporter:
    port: 9100
    logging-level: DEBUG
    interface: eth0,eno2
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
<tr>
    <td>job-exporter.interface</td>
    <td>com["job-exporter"]["interface"]</td>
    <td>cluster_cfg["job-exporter"]["interface"]</td>
    <td>String</td>
</tr>
</table>