// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
'use strict';


/**
 * Implementation of RESTful API server.
 * Init and start server instance.
 */

// module dependencies
require('module-alias/register');
const https = require('https');
const config = require('@pai/config');
const {serverPrivateKey, serverCertificate} = require('@pai/config/ssl');
const logger = require('@pai/config/logger');
const app = require('@pai/config/express');
const HDFSCache = require('@pai/controllers/mp/hdfsCache');


logger.info('config: %j', config);

const HDFSCacheInstance = new HDFSCache();
Object.freeze(HDFSCacheInstance);

// start the server
if (config.serverProtocol === 'https') {
  const server = https.createServer({
    key: serverPrivateKey,
    cert: serverCertificate,
    secureProtocol: 'TLSv1_2_method',
  }, app);
  server.listen(config.serverPort, async () => {
    logger.info('RESTful API server starts on port %d with HTTPS', config.serverPort);
  });
} else if (config.serverProtocol === 'http') {
  app.listen(config.serverPort, async () => {
    logger.info('RESTful API server starts on port %d', config.serverPort);
  });
} else {
  throw new Error(`Unexpected server protocol ${config.serverProtocol}`);
}

function updateAllModuleAndExampleCache(callback) {
  return HDFSCacheInstance.updateAllModuleAndExampleCache(callback);
}

function updateAllModuleCache(callback) {
  return HDFSCacheInstance.updateAllModuleCache(callback);
}

function updateAllExampleCache(callback) {
  return HDFSCacheInstance.updateAllExampleCache(callback);
}

function updateExampleCache(exampleId, callback) {
  return HDFSCacheInstance.updateExampleCache(exampleId, callback);
}

function updateModuleCache(moduleId, callback) {
  return HDFSCacheInstance.updateModuleCache(moduleId, callback);
}

function getModuleCacheContent() {
  return HDFSCacheInstance.getModuleCache();
}

function getExampleCacheContent() {
  return HDFSCacheInstance.getExampeCache();
}

module.exports = app;
exports.getModuleCacheContent = getModuleCacheContent;
exports.getExampleCacheContent = getExampleCacheContent;
exports.updateModuleAndExampleCache = updateAllModuleAndExampleCache;
exports.updateAllModuleCache = updateAllModuleCache;
exports.updateAllExampleCache = updateAllExampleCache;
exports.updateModuleCache = updateModuleCache;
exports.updateExampleCache = updateExampleCache;
