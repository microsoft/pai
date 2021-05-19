# Pylon section parser

- [Default Configuration](#D_Config)
- [How to Configure](#HT_Config)
- [Generated Configuration](#G_Config)
- [Data Table](#T_config)

## Default configuration <a name="D_Config"></a>

[pylon default configuration](pylon.yaml)

## How to configure pylon section in service-configuration.yaml <a name="HT_Config"></a>

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
    #ssl:
    #  port: 443
    #  # self-sign
    #  crt_name: xxxxxx
    #  crt_path: /path/to/xxxxxx
    #  key_name: yyyyyy
    #  key_path: /path/to/yyyyyy
```

## Table <a name="T_Config"></a>

| Data in Configuration File | Data in Cluster Object Model | ata in Jinja2 Template | Data type|
| --- | --- | --- | --- |
| pylon.port | com["pylon"]["port"] | cluster_cfg["pylon"]["port"] | Int |
| pylon.uri  | com["pylon"]["uri"]  | cluster_cfg["pylon"]["uri"]  | URL |
| pylon.ssl.port | com["pylon"]["ssl"]["port"] | cluster_cfg["pylon"]["ssl"]["crt_name"] | Int |
| pylon.ssl.crt_name | com["pylon"]["ssl"]["crt_name"] | cluster_cfg["pylon"]["ssl"]["crt_name"] | certificate file name |
| pylon.ssl.crt_path | com["pylon"]["ssl"]["crt_path"] | cluster_cfg["pylon"]["ssl"]["crt_path"] | the path to certificate file |
| pylon.ssl.key_name | com["pylon"]["ssl"]["key_name"] | cluster_cfg["pylon"]["ssl"]["key_name"] | certificate key file name |
| pylon.ssl.key_path | com["pylon"]["ssl"]["key_path"] | cluster_cfg["pylon"]["ssl"]["key_path"] | the path to certificate key file |

