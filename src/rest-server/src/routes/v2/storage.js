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

// module dependencies
const express = require('express');
const storageController = require('@pai/controllers/v2/storage');
const token = require('@pai/middlewares/token');
// const storageInputSchema = require('@pai/config/v2/storage');

const router = new express.Router();

router
  .route('/server/:name')
  /** Get /api/v2/storage/server/:name */
  .get(token.check, storageController.getStorageServer);

router
  .route('/server')
  /** Get /api/v2/storage/server */
  .get(token.check, storageController.getStorageServers);

router
  .route('/server')
  /** Post /api/v2/storage/server */
  .post(token.check, storageController.createStorageServer);

router
  .route('/server')
  /** Put /api/v2/storage/server */
  .put(token.check, storageController.updateStorageServer);

router
  .route('/server/:name')
  /** Post /api/v2/storage/server/delete */
  .delete(token.check, storageController.deleteStorageServer);

router
  .route('/config/:name')
  /** Get /api/v2/storage/config/:name */
  .get(token.check, storageController.getStorageConfig);

router
  .route('/config')
  /** Get /api/v2/storage/config */
  .get(token.check, storageController.getStorageConfigs);

router
  .route('/config')
  /** Post /api/v2/storage/config */
  .post(token.check, storageController.createStorageConfig);

router
  .route('/config')
  /** Put /api/v2/storage/config */
  .put(token.check, storageController.updateStorageConfig);

router
  .route('/config/:name')
  /** Delete /api/v2/storage/config/:name */
  .delete(token.check, storageController.deleteStorageConfig);

module.exports = router;
