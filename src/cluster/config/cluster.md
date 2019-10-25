## cluster section parser 

- [Default Configuration](#D_Config)
- [How to Configure](#HT_Config)
- [Generated Configuraiton](#G_Config)
- [Data Table](#T_config)



#### Default configuration <a name="D_Config"></a>

[cluster default configuration](cluster.yaml)

#### How to configure cluster section in service-configuraiton.yaml <a name="HT_Config"></a>

All configurations in this section is optional. If you wanna customized these value, you can configure it in service-configuration.yaml.

For example, if you wanna reconfigure ```cluster.common.data-path``` with a new value. You should configure it in [service-configuration.yaml](../../../examples/cluster-configuration/services-configuration.yaml) with the yaml style as following.
```yaml
cluster:
    common:
      data-path: new-value
```

#### Generated Configuration <a name="G_Config"></a>

Generated configuration means the object model after parsing. The parsed data will be presented by a yaml format.
```yaml
cluster:
    common:
      cluster-id: pai
      cluster-type: yarn
      data-path: "/datastorage"
      qos-switch: "true"
      az-rdma: "false"
      k8s-rbac: "false"
      deploy-in-aks: "false"
    docker-registry:
      namespace: openpai
      domain: docker.io
      #username: your_registry_username (optional, depend on whether you configure it or not)
      #password: your_registry_password (optional, depend on whether you configure it or not)
      tag: latest
      secret-name: regsecret
      base64code: output of "cat ~/.docker/config.json | base64"
      credential: output of "cat ~/.docker/config.json"
      prefix: ${cluster.docker-registry.domain}/${cluster.docker-registry.namespace}/
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
    <td>cluster.common.cluster-id</td>
    <td>com["cluster"]["common"]["cluster-id"]</td>
    <td>cluster_cfg["cluster"]["common"]["cluster-id"]</td>
    <td>string</td>
</tr>
<tr>
    <td>cluster.common.cluster-type</td>
    <td>com["cluster"]["common"]["cluster-type"]</td>
    <td>cluster_cfg["cluster"]["common"]["cluster-type"]</td>
    <td>string</td>
</tr>
<tr>
    <td>cluster.common.data-path</td>
    <td>com["cluster"]["common"]["data-path"]</td>
    <td>cluster_cfg["cluster"]["common"]["data-path"]</td>
    <td>string</td>
</tr>
<tr>
    <td>cluster.common.qos-switch</td>
    <td>com["cluster"]["common"]["qos-switch"]</td>
    <td>cluster_cfg["cluster"]["common"]["qos-switch"]</td>
    <td>string</td>
</tr>
<tr>
    <td>cluster.common.az-rdma</td>
    <td>com["cluster"]["common"]["az-rdma"]</td>
    <td>cluster_cfg["cluster"]["common"]["az-rdma"]</td>
    <td>string, "true" or "false"</td>
</tr>
<tr>
    <td>cluster.docker-registry.namespace</td>
    <td>com["cluster"]["docker-registry"]["namespace"]</td>
    <td>cluster_cfg["cluster"]["docker-registry"]["namespace"]</td>
    <td>string</td>
</tr>
<tr>
    <td>cluster.docker-registry.namespace</td>
    <td>com["cluster"]["docker-registry"]["namespace"]</td>
    <td>cluster_cfg["cluster"]["docker-registry"]["namespace"]</td>
    <td>string</td>
</tr>
<tr>
    <td>cluster.docker-registry.namespace</td>
    <td>com["cluster"]["docker-registry"]["namespace"]</td>
    <td>cluster_cfg["cluster"]["docker-registry"]["namespace"]</td>
    <td>string</td>
</tr>
<tr>
    <td>cluster.docker-registry.domain</td>
    <td>com["cluster"]["docker-registry"]["domain"]</td>
    <td>cluster_cfg["cluster"]["docker-registry"]["domain"]</td>
    <td>string</td>
</tr>
<tr>
    <td>cluster.docker-registry.username</td>
    <td>com["cluster"]["docker-registry"]["username"]</td>
    <td>cluster_cfg["cluster"]["docker-registry"]["username"]</td>
    <td>string, optional</td>
</tr>
<tr>
    <td>cluster.docker-registry.password</td>
    <td>com["cluster"]["docker-registry"]["password"]</td>
    <td>cluster_cfg["cluster"]["docker-registry"]["password"]</td>
    <td>string, optional</td>
</tr>
<tr>
    <td>cluster.docker-registry.tag</td>
    <td>com["cluster"]["docker-registry"]["tag"]</td>
    <td>cluster_cfg["cluster"]["docker-registry"]["tag"]</td>
    <td>string</td>
</tr>
<tr>
    <td>cluster.docker-registry.secret-name</td>
    <td>com["cluster"]["docker-registry"]["secret-name"]</td>
    <td>cluster_cfg["cluster"]["docker-registry"]["secret-name"]</td>
    <td>string</td>
</tr>
<tr>
    <td>None</td>
    <td>com["cluster"]["docker-registry"]["base64code"]</td>
    <td>cluster_cfg["cluster"]["docker-registry"]["base64code"]</td>
    <td>string</td>
</tr>
<tr>
    <td>None</td>
    <td>com["cluster"]["docker-registry"]["credential"]</td>
    <td>cluster_cfg["cluster"]["docker-registry"]["credential"]</td>
    <td>string</td>
</tr>
<tr>
    <td>None</td>
    <td>com["cluster"]["docker-registry"]["prefix"]</td>
    <td>cluster_cfg["cluster"]["docker-registry"]["prefix"]</td>
    <td>string, "domain/namespace/"</td>
</tr>
</table>



