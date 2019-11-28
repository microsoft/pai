## Storage Manager <a name="Storage-Manager"></a>

Storage-manager is a k8s managed NFS+SMB storage service deployed on configured node.

## Index

- [Storage Manager](#Storage-Manager)
  - [Node Configuration](#Node-Configuration)
  - [Default Configuration](#Default-Configuration)
  - [Manual Configuration](#Manual-Configuration)
  - [SMB with AAD Configuraiton](#SMBAAD-Configuration)
  - [Data Table](#T_config)

---

## Node Configuration <a name="Node-Configuration"></a>

To deploy storage-manager, in layout.yaml, set a node's attribute "pai-storage" to "true".

For example:
```yaml
  - docker-data: # docker path
    hostip: # host ip
    hostname: # host name
    k8s-role: # k8s role
    machine-type: # machine type
    nodename: # node name
    pai-storage: "true"
    password: # password
    ssh-port: # ssh port
    username: # user name
```
The storage-manager will be deployed on that node.

---

## Default Configuration <a name="Default-Configuration"></a>

[storage-manager default configuration](config/storage-manager.yaml)

NFS default root path: `/share/pai`

Samba default share paths:

| Share path | Acctully path in the storage machine |
| --- | --- |
| `/root` | `/share/pai` |
| `/users`  | `/share/pai/users` |
| `/data` | `/share/pai/data` |
| `/home` | `/share/pai/users/${user_name}` |


---

## Manual Configuration <a name="Manual-Configuration"></a>

All configurations in this section is optional. If you want to customized these value, you can configure it in service-configuration.yaml.

For example, if you want to use different local path than the default /share, add following to your service-configuration.yaml as following:

```yaml
storage-manager:
    localpath: new-value
```

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

| Data in Configuration File | Data in Cluster Object Model | Data in Jinja2 Template | Data type |
| --- | --- | --- | --- |
| storage-manager.localpath | com["storage-manager"]["localpath"] | cluster_cfg["storage-manager"]["localpath"] | String |
| storage-manager.workgroup | com["storage-manager"]["workgroup"] | cluster_cfg["storage-manager"]["workgroup"] | String |
| storage-manager.security-type | com["storage-manager"]["security-type"] | cluster_cfg["storage-manager"]["security-type"] | Can only be `Auto` or `ADS` |
| storage-manager.smbuser | com["storage-manager"]["smbuser"] | cluster_cfg["storage-manager"]["smbuser"] | String |
| storage-manager.smbpwd | com["storage-manager"]["smbpwd"] | cluster_cfg["storage-manager"]["smbpwd"] | String |

