## cluster section parser 

- [Default Configuration](#D_Config)
- [How to Configure](#HT_Config)
- [Generated Configuraiton](#G_Config)
- [Data Table](#T_config)



#### Default configuration <a name="D_Config"></a>

[drivers default configuration](drivers.yaml)

#### How to configure cluster section in service-configuraiton.yaml <a name="HT_Config"></a>

All configurations in this section is optional. If you wanna customized these value, you can configure it in service-configuration.yaml.

For example, if you wanna reconfigure ```drivers.set-nvidia-runtme``` with a new value. You should configure it in [service-configuration.yaml](../../../examples/cluster-configuration/services-configuration.yaml) with the yaml style as following.
```yaml
drivers:
    set-nvidia-runtme: true
```

#### Generated Configuration <a name="G_Config"></a>

Generated configuration means the object model after parsing. The parsed data will be presented by a yaml format.
```yaml
drivers:
    set-nvidia-runtme: false
    version: 384.111
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
    <td>drivers.set-nvidia-runtme</td>
    <td>com["drivers"]["set-nvidia-runtime"]</td>
    <td>cluster_cfg["drivers"]["set-nvidia-runtime"]</td>
    <td>Bool</td>
</tr>
<tr>
    <td>drivers.version</td>
    <td>com["drivers"]["version"]</td>
    <td>cluster_cfg["drivers"]["version"]</td>
    <td>string</td>
</tr>
</table>



