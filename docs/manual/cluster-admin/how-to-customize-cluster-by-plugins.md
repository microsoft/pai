# How to Customize Cluster by Plugins

## How to Install a Webportal Plugin

Webportal plugin provides a way to add custom web pages to the OpenPAI web portal. It can communicate with other PAI services, like the rest-server. It could provide customized solutions to different requirements.

As an administrator, you can configure the webportal plugins in the `webportal.plugins` field of `services-configuration.yaml` (If you don't know what `services-configuration.yaml` is, please refer to [PAI Service Management and Paictl](./basic-management-operations.md#pai-service-management-and-paictl)):

```yaml
webportal:
  server-port: 9286

  plugins:
  - title: Marketplace
    uri: /scripts/plugins/marketplace.bundle.js
    config:
      repo: Microsoft/pai
```


- The `title` field is the title of the webportal plugin listed in the menu, it could be customized by administrators for the same plugin with different configurations.
- The `uri` field is the entry file of the webportal plugin, usually provided by the plugin developer. It may be an absolute URL or a root-relative URL, as the different deploy type of the webportal plugin.
- The `config` field is a key-value dictionary to configure the webportal plugin, available configs are listed in the webportal plugin's specific document.

After modifying the configuration, push it to the cluster and restart webportal by:

```bash
./paictl.py service stop -n webportal
./paictl.py config push -p <config-folder> -m service
./paictl.py service start -n webportal
```

## Deploy Openpaimarketplace as Webportal Plugin

[Openpaimarketplace](https://github.com/microsoft/openpaimarketplace) is a place that stores examples and job templates of OpenPAI. Users could use Openpaimarketplace to share their jobs or run-and-learn others' sharing jobs.

To deploy Openpaimarketplace, please refer to [the project doc](https://github.com/microsoft/openpaimarketplace) about how to deploy the marketplace service and webportal plugin.

After deployment, follow the [previous part](#how-to-install-a-webportal-plugin) to change the webportal configuration with marketplace plugin URL and restart webportal. Then you could use marketplace from the sidebar.

   <img src="./imgs/marketplace.png" width="100%" height="100%" /> 
