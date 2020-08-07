## Prometheus section parser

- [Default Configuration](#D_Config)
- [How to Configure](#HT_Config)
- [Generated Configuration](#G_Config)
- [Data Table](#T_config)

#### Default configuration <a name="D_Config"></a>

[prometheus default configuration](prometheus.yaml)

When jobs in certain virtual clusters have gpu utilization percent lower than a threshold for some time, the alert "PaiJobLowGpuPercent" will be triggered. The virtuals clusters, gpu utilization threshold, and time can be customized in the `low_gpu_utilization_job` field.

#### How to configure cluster section in service-configuration.yaml <a name="HT_Config"></a>

All configurations in this section are optional. If you want to customize these values, you can configure it in service-configuration.yaml.

For example, if you want to use different a port than the default 9091, add following to your service-configuration.yaml as following:
```yaml
prometheus:
    port: new-value
    scrape_interval: 30
    low_gpu_utilization_job: 
        virtual_clusters: default # format: vc_name1|vc_name2|vc_name3
        gpu_percent: 0.3
        last_time: 10m
```

#### Generated Configuration <a name="G_Config"></a>

After parsing, object model looks like:
```yaml
prometheus:
    port: 9091
    scrape_interval: 30
    url: "http://master_ip:9091"
    low_gpu_utilization_job: 
        virtual_clusters: default
        gpu_percent: 0.3
        last_time: 10m
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
    <td>Int</td>
</tr>
<tr>
    <td>prometheus.url</td>
    <td>com["prometheus"]["url"]</td>
    <td>cluster_cfg["prometheus"]["url"]</td>
    <td>URL</td>
</tr>
<tr>
    <td>prometheus.low_gpu_utilization_job</td>
    <td>com["prometheus"]["low_gpu_utilization_job"]</td>
    <td>cluster_cfg["prometheus"]["low_gpu_utilization_job"]</td>
    <td>YAML</td>
</tr>
</table>
