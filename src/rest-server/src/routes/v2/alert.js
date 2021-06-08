// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// module dependencies
const express = require('express');
const token = require('@pai/middlewares/token');
const controller = require('@pai/controllers/v2/alert');

const router = new express.Router();

router.route('/').get(token.check, controller.list);

module.exports = router;
