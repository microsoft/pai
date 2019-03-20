## Prometheus section parser

- [Default Configuration](#D_Config)
- [How to Configure](#HT_Config)
- [Generated Configuraiton](#G_Config)
- [Data Table](#T_config)

#### Default configuration <a name="D_Config"></a>

[prometheus default configuration](prometheus.yaml)

#### How to configure cluster section in service-configuraiton.yaml <a name="HT_Config"></a>

All configurations in this section is optional. If you want to customized these value, you can configure it in service-configuration.yaml.

For example, if you want to use different port than the default 9091, add following to your service-configuration.yaml as following:

```yaml
prometheus:
    port: new-value
    scrape_interval: 30
```

#### Generated Configuration <a name="G_Config"></a>

After parsing, object model looks like:

```yaml
prometheus:
    port: 9091
    scrape_interval: 30
    url: "http://master_ip:9091"
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
    <td>prometheus.port</td>
    <td>com["prometheus"]["port"]</td>
    <td>cluster_cfg["prometheus"]["port"]</td>
    <td>Int</td>
</tr>
<tr>
    <td>prometheus.scrape_interval</td>
    <td>com["prometheus"]["scrape_interval"]</td>
    <td>cluster_cfg["prometheus"]["scrape_interval"]</td>
    <td>URL</td>
</tr>
<tr>
    <td>prometheus.url</td>
    <td>com["prometheus"]["url"]</td>
    <td>cluster_cfg["prometheus"]["url"]</td>
    <td>URL</td>
</tr>
</table>