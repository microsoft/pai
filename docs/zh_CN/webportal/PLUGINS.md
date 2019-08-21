# Web Portal Plugin

Web portal plugin provides a way to add custom web pages to the web portal of PAI deployments, and easy to communicate with other PAI services, like REST server. It could provide customized solutions to different requirements.

## For PAI User: Use a Web Portal Plugin

The web portal plugins are listed in the menu on the left of the web portal, you could find one and access by a click. If some plugin you like is not listed, by now you can contact your system administrator to enable it.

## For System Administrator: Enable a Web Portal Plugin

Before the PAI deploy / redeploy, you can configure the web portal plugins in the `webportal.plugins` field of `service-configuration.yaml`:

```yaml
webportal:
  server-port: 9286
  log-type: yarn

  plugins:

  - title: Marketplace
    uri: /scripts/plugins/marketplace.bundle.js
    config:
      repo: Microsoft/pai
```

- The `title` field is the title of the web portal plugin listed in the menu, it could be customized by administrators for the same plugin with different configurations.
- The `uri` field is the entry file of the web portal plugin, usually previded by the plugin developer. It may be an absolute URL or a root-relative URL, as the different deploy type of the web portal plugin.
- The `config` field is a key-value dictionary to configure the web portal plugin, available configs are listed in web portal plugin's specific document.

In addition, you can also lock the plugin version if the uri refers the Internet, follow the [Publish](#publish) section to move the online web portal plugin to offline.

## For Plugin Developer: Build a Web Portal Plugin

A plugin is a JavaScript file that will be injected to plugin page of web portal, which is called "entry file". If you have multiple files, bundle them by packagers like webpack or rollup.

### Plugin Page

To decouple with the web portal itself, the plugin page will execute the entry file of the plugin, and then create an empty `<pai-plugin>` tag in the content area of the page.

### `<pai-plugin>` Tag

It is encouraged to use [Custom Elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements) to put the plugin code into the `<pai-plugin>` tag. Polyfills have already included in the page, so feel free to use `window.customElements.define` to define your `<pai-plugin>`.

### Communicate with Other PAI Services

To communicate with REST server, there is a `pai-rest-server-endpoint` attribute in the tag, looks like

```HTML
<pai-plugin pai-rest-server-endpoint="http://pylon/rest-server/"></pai-plugin>
```

Either an `Element#getAttribute` call, or an `attributeChangedCallback` of the custom element could help you get the REST server url.

If any other PAI configuration is needed, please open an issue, PAI developers will provide them in the next release.

### Provide Plugin Configurations

The config of the plugin will be set as the query string of the entry file, like `http://example.com/github-plugin.js?repo=Microsoft%2Fpai`, `document.currentScript.src` would help you get the full uri of the script, including the query string.

### Migrate Current AI Web Tools to PAI Web Portal Plugin

The easist way is to append an iframe to the `<pai-plugin>` tag:

```JavaScript
class ExamplePlugin extends HTMLElement { 
  constructor() { 
    super() 
    const iframe = document.createElement('iframe') 
    iframe.width = '100%' 
    iframe.height = '480px' 
    iframe.setAttribute('src', 'https://example.com/') 
    this.appendChild(iframe) 
  } 
} 

customElements.define('pai-plugin', ExamplePlugin)
```

Because Custom Elements is in the web standard, most web libraries / frameworks provide tools to enclose their component to a standard custom elements. [Custom Elements Everywhere](https://custom-elements-everywhere.com) would help you migrate your third-party components into Custom Elements, and become a PAI web portal plugins seamlessly.

### <a name="publish">Publish</a>

There are 2 simple ways to publish your plugin:

1. Put your plugin entry file to the Internet, and provide the full URL of the file to the system administrator. It is encouraged to use HTTPS to access your entry file to avoid XSS security issues.
2. Fork the PAI repo and place your plugin code to the `src/webportal/src/plugins`, add your entry file to webpack config to make your plugin outputed. And then provide the relative URL based on web portal root to the system administrator.

For advance users, a new PAI service that exports a plugin entry file also works. This is out of the scope of web portal plugin, please follow the [add a service](../pai-management/doc/add-service.md) document.

## FAQ

TBD