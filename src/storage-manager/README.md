## Storage Manager

- [Storage Manager](#Storage-Manager)
  - [Default Configuration](#Default-Configuration)
  - [Manual Configuration](#Manual-Configuration)
  - [Teamwise Storage Integration](#Teamwise-Integration)
  - [SMB with AAD Configuraiton](#SMBAAD-Configuration)
  - [Data Table](#T_config)

---

## Default Configuration <a name="Default-Configuration"></a>

[storage-manager default configuration](config/storage-manager.yaml)

---

## Manual Configuration <a name="Manual-Configuration"></a>

All configurations in this section is optional. If you want to customized these value, you can configure it in service-configuration.yaml.

For example, if you want to use different local path than the default /share, add following to your service-configuration.yaml as following:

```yaml
storage-manager:
    localpath: new-value
```
---

## Teamwise Storage Integration <a name="Teamwise-Integration"></a>

Storage-manager service can be integrated with team-wise storage. By setting storageServerName and storageConfigName in storage-manager, team-wise storage data will be generated when deploy.

```yaml
storage-manager:
  storageServerName: # storage server name
  storageConfigName: # storage config name 
```
For more details about team-wise storage, please refer to [storage plugin](../../contrib/storage_plugin/README.MD)

---

## SMB with AAD Configuraiton <a name="SMBAAD-Configuration"></a>

If you want to use storage-manager with AAD, please add these extra info in  service-configuration.yaml.

```yaml
storage-manager:
  workgroup: # workgroup
  security-type: ADS
  default_realm: # default realm
  krb5_realms: # realms
    XXX1: # relam name
      kdc: # kdc
      default_domain: # default domain
    XXX2: # relam name
      kdc: # kdc
      default_domain: # default domain
  domain_realm: # domain realm
    kdc: # kdc
    default_domain: # default domain
  domainuser: # domain user
  domainpwd: # password of domain user
  idmap: # idmap
  - "idmap config XXX1"
  - "idmap config XXX2"
  - "idmap config XXX3"
  - "idmap config XXX4"

```

---

## Configuration Table <a name="T_Config"></a>

<table>
<tr>
    <td>Data in Configuration File</td>
    <td>Data in Cluster Object Model</td>
    <td>Data in Jinja2 Template</td>
    <td>Data type</td>
</tr>
<tr>
    <td>storage-manager.localpath</td>
    <td>com["storage-manager"]["localpath"]</td>
    <td>cluster_cfg["storage-manager"]["localpath"]</td>
    <td>String</td>
</tr>
<tr>
    <td>storage-manager.workgroup</td>
    <td>com["storage-manager"]["workgroup"]</td>
    <td>cluster_cfg["storage-manager"]["workgroup"]</td>
    <td>String</td>
</tr>
<tr>
    <td>storage-manager.security-type</td>
    <td>com["storage-manager"]["security-type"]</td>
    <td>cluster_cfg["storage-manager"]["security-type"]</td>
    <td>Can only be `Auto` or `ADS`</td>
</tr>
<tr>
    <td>storage-manager.storageServerName</td>
    <td>com["storage-manager"]["storageServerName"]</td>
    <td>cluster_cfg["storage-manager"]["storageServerName"]</td>
    <td>String</td>
</tr>
<tr>
    <td>storage-manager.storageConfigName</td>
    <td>com["storage-manager"]["storageConfigName"]</td>
    <td>cluster_cfg["storage-manager"]["storageConfigName"]</td>
    <td>String</td>
</tr>
<tr>
    <td>storage-manager.smbuser</td>
    <td>com["storage-manager"]["smbuser"]</td>
    <td>cluster_cfg["storage-manager"]["smbuser"]</td>
    <td>String</td>
</tr>
<tr>
    <td>storage-manager.smbpwd</td>
    <td>com["storage-manager"]["smbpwd"]</td>
    <td>cluster_cfg["storage-manager"]["smbpwd"]</td>
    <td>String</td>
</tr>
</table>
