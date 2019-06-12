# Pylon section parser

- [Default Configuration](#D_Config)
- [How to Configure](#HT_Config)
- [Generated Configuraiton](#G_Config)
- [Data Table](#T_config)

## Default configuration <a name="D_Config"></a>

[pylon default configuration](pylon.yaml)

## How to configure pylon section in service-configuraiton.yaml <a name="HT_Config"></a>

All configurations in this section is optional. If you want to customized these value, you can configure it in service-configuration.yaml.

For example, if you want to use different port than the default 80, add following to your service-configuration.yaml as following:

```yaml
pylon:
    port: new-value
```

## Generated Configuration <a name="G_Config"></a>

After parsing, object model looks like:

```yaml
pylon:
    port: 80
    uri: "http://master_ip:80"
```

## Table <a name="T_Config"></a>

<table>
  
<tr>
    <td>Data in Configuration File</td>
    <td>Data in Cluster Object Model</td>
    <td>Data in Jinja2 Template</td>
    <td>Data type</td>
</tr>
<tr>
    <td>pylon.port</td>
    <td>com["pylon"]["port"]</td>
    <td>cluster_cfg["pylon"]["port"]</td>
    <td>Int</td>
</tr>
<tr>
    <td>pylon.uri</td>
    <td>com["pylon"]["uri"]</td>
    <td>cluster_cfg["pylon"]["uri"]</td>
    <td>URL</td>
</tr>
</table>