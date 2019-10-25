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
const token = require('@pai/middlewares/token');
const controller = require('@pai/controllers/v2/virtual-cluster');
const param = require('@pai/middlewares/parameter');
const vcConfig = require('@pai/config/vc');

const router = new express.Router();

router.route('/')
  /** GET /api/v2/virtual-clusters - Return cluster virtual cluster info */
  .get(controller.list);

router.route('/:virtualClusterName')
  /** GET /api/v2/virtual-clusters/:virtualClusterName - Get virtual cluster */
  .get(controller.get)
  /** PUT /api/v2/virtual-clusters/:virtualClusterName - Create a virtual cluster */
  .put(token.checkNotApplication, param.validate(vcConfig.vcCreateInputSchema), controller.update)
  /** DELETE /api/v2/virtual-clusters/:virtualClusterName - Remove a virtual cluster */
  .delete(token.checkNotApplication, controller.remove);

router.route('/:virtualClusterName/status')
  /** PUT /api/v2/virtual-clusters/:virtualClusterName/status - Change virtual cluster status (running or stopped) */
  .put(token.checkNotApplication, param.validate(vcConfig.vcStatusPutInputSchema), controller.updateStatus);

router.route('/:virtualClusterName/resource-units')
  /** GET /api/v2/virtual-clusters/:virtualClusterName/resource-units - Get virtual cluster available resource units */
  .get(controller.getResourceUnits);

router.param('virtualClusterName', controller.validate);

// module exports
module.exports = router;
