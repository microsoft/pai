# OpenPAI JS SDK

The `Javascript` SDK for `OpenPAI`

## Installation

This module is installed via npm:

```bash
npm install --save npm install yiyione/pai#openpai-js-sdk
```

## Example

### Submit job

Import from `openpai-js-sdk`.

```ts
import * as fs from 'fs-extra';
import * as yaml from 'js-yaml';
import { IPAICluster, OpenPAIClient } from 'openpai-js-sdk';
```

Submit job from job config yaml file.

```ts
const cluster: IPAICluster = {
    username: '<username>',
    password: '<password>',
    rest_server_uri: '<The host>/rest-server'
};
const client = new OpenPAIClient(cluster);
const jobConfig = yaml.safeLoad(await fs.readFile('<the path of config yaml file>', 'utf8'));
await client.job.submit(jobConfig);
```

Or use OpenPAI access token without username and password.

```ts
const cluster: IPAICluster = {
    rest_server_uri: '<The host>/rest-server'
};
const client = new OpenPAIClient(cluster);
const jobConfig = yaml.safeLoad(await fs.readFile('<the path of config yaml file>', 'utf8'));
await client.job.submit(jobConfig, '<access token>');
```
