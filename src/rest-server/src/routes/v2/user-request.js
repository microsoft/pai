// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// module dependencies
const express = require('express');
const token = require('@pai/middlewares/token');
const controller = require('@pai/controllers/v2/user-request');
const param = require('@pai/middlewares/parameter');
const config = require('@pai/config/v2/user-request');

const router = new express.Router();

router
  .route('/:requestType')
  /** GET /api/v2/request/:requestType - Return all requests by request type */
  .get(token.check, controller.listRequest)
  /** POST /api/v2/request - Create a request */
  .post(
    param.validate(config.requestPostInputSchema),
    controller.createRequest,
  );

router
  .route('/:requestType/:requestId')
  /** PUT /api/v2/request/:requestId - Update a request */
  .put(
    token.check,
    param.validate(config.requestPutInputSchema),
    controller.updateRequest,
  )
  /** DELETE /api/v2/request/:requestId - Delete a request */
  .delete(token.check, controller.deleteRequest);

router.param('requestId', controller.validateId);
router.param('requestType', controller.validateType);

// module exports
module.exports = router;
