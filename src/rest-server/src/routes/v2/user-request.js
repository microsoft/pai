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
  .route('/user')
  /** POST /api/v2/requests/user - Create a user request */
  .post(
    param.validate(config.requestPostInputSchema),
    controller.createRequest,
  );

router
  .route('/:requestType')
  /** GET /api/v2/requests/:requestType - Return all requests by request type */
  .get(token.check, controller.listRequest)
  /** POST /api/v2/requests/:requestType - Create a request */
  .post(
    token.check,
    param.validate(config.requestPostInputSchema),
    controller.createRequest,
  );

router
  .route('/:requestType/:requestId')
  /** PUT /api/v2/requests/:requestId - Update a request */
  .put(
    token.check,
    param.validate(config.requestPutInputSchema),
    controller.updateRequest,
  )
  /** DELETE /api/v2/requests/:requestId - Delete a request */
  .delete(token.check, controller.deleteRequest);

router.param('requestId', controller.validateId);
router.param('requestType', controller.validateType);

// module exports
module.exports = router;
