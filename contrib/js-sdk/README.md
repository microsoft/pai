# OpenPAI JS SDK

The `Javascript` SDK for `OpenPAI`

## Installation

This module is installed via npm:

```bash
npm install --save npm install yiyione/pai#openpai-js-sdk
```

## Example

### Submit job

Import from js sdk.

```ts
import * as fs from 'fs-extra';
import * as yaml from 'js-yaml';
import { IPAICluster, OpenPAIClient } from 'openpai-js-sdk';
```

Submit job from job config yaml file.

```ts
const cluster: IPAICluster = {
    username: 'test',
    password: 'test',
    rest_server_uri: '<The host>/rest-server',
};
const client = new OpenPAIClient(cluster);
const jobConfig = yaml.safeLoad(await fs.readFile('<the path of config yaml file>', 'utf8'));
await client.job.submit(jobConfig);
```
