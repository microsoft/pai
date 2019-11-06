## Storage Manager

- [Storage Manager](#Storage-Manager)
  - [Default Configuration](#Default-Configuration)
  - [How to Configure](#Manual-Configuration)
  - [Generated Configuraiton](#G_Config)
  - [Data Table](#T_config)

---

## Default Configuration

[storage-manager default configuration](config/storage-manager.yaml)

---

## Manual Configuration
For now, `nfsport` is 2049 and `smbport` is 445 and can not be changed.

All configurations in this section is optional. If you want to customized these value, you can configure it in service-configuration.yaml.

For example, if you want to use different local path than the default /share, add following to your service-configuration.yaml as following:

```yaml
storage-manager:
    localpath: new-value
```

---

## SMB with AAD enabled

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
