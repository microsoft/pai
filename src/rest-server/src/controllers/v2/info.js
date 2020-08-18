// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// module dependencies
const authnConfig = require('@pai/config/authn');
const launcherConfig = require('@pai/config/launcher');
const paiConfig = require('@pai/config/paiConfig');

const info = (req, res) => {
  return res.status(200).json({
    name: 'PAI RESTful API',
    version: paiConfig.version,
    launcherType: launcherConfig.type,
    authnMethod: authnConfig.authnMethod,
  });
};

// module exports
module.exports = { info };
