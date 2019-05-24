# Marketplace Plugin

A web portal plugin for marketplace on OpenPAI.

## Usage

This plugin is used to browse shared v2 jobs in marketplace. The marketplace can be either public (e.g. public GitHub repo) or private (e.g. private Azure DevOps repo).

User can configure the marketplace with a URI and a token:
  * GitHub
    * URI: directory uri of shared marketplace on GitHub, e.g. [OpenPAI marketplace](https://github.com/microsoft/pai/tree/master/marketplace-v2)
    * token: if the uri needs authentication to read, you need to [create a personal access token on GitHub](https://help.github.com/en/articles/creating-a-personal-access-token-for-the-command-line), then set marketplace token field to `your_github_username:your_personal_access_token`
  * Azure DevOps
    * URI: directory uri of shared marketplace on Azure DevOps
    * token: if the uri needs authentication to read, you need to [create a personal access token on Azure DevOps](https://docs.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate?view=azure-devops), then set marketplace token field to `your_devops_username:your_personal_access_token`

After correct configuration, user can browse all v2 jobs in marketplace, view each job's protocol yaml, or clone and submit a job in marketplace.

## Build

```sh
git clone https://github.com/Microsoft/pai.git
cd pai/contrib/marketplace
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
  - id: marketplace
    title: Marketplace
    uri: # uri of dist/plugin.js
```

## Development

```sh
git clone https://github.com/Microsoft/pai.git
cd pai/contrib/marketplace
yarn install
yarn start
```

Configure the plugin of webportal env file with the uri `http://localhost:9091/plugin.js`.

## License

[MIT License](../../LICENSE)
