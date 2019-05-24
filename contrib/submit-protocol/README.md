# Submit Protocol Plugin

A web portal plugin to submit protocol job on OpenPAI.

## Usage

This plugin is used to submit PAI protocol job on web portal.

User can upload a protocol yaml file from disk, choose a protcol job from marketplace, or use the submission form to fill in a protocol config.

Please refer to [PAI protocol spec](../../docs/pai-job-protocol.yaml) for more details.

## Build

```sh
git clone https://github.com/Microsoft/pai.git
cd pai/contrib/submit-protocol
yarn install
yarn build
```

The built files will be located in `dist/`.

## Deployment

Put the built plugin files to a static file server that is accessible by the user.
Read [PLUGINS](../../docs/webportal/PLUGINS.md#publish) for details.

Append the following plugin configuration block to the `webportal.plugins` section of `service-configuration.yaml` file.

```yaml
webportal:
  plugins:
  - id: protocol
    title: Submit Protocol
    uri: # uri of dist/plugin.js
```

## Development

```sh
git clone https://github.com/Microsoft/pai.git
cd pai/contrib/submit-protocol
yarn install
yarn start
```

Configure the plugin of webportal env file with the uri `http://localhost:9090/plugin.js`.

## License

[MIT License](../../LICENSE)
