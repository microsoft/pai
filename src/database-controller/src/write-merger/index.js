// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

require('module-alias/register');
require('dotenv').config();
const app = require('@dbc/write-merger/app');
const { port } = require('@dbc/write-merger/config');

app.listen(port, () => console.log(`Write merger listening on port ${port}!`));
