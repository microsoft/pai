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
const controller = require('@pai/controllers/v2/job');
const protocol = require('@pai/middlewares/v2/protocol');
const jobAttemptRouter = require('@pai/routes/v2/job-attempt.js');


const router = new express.Router();

router.route('/')
  /** GET /api/v2/jobs - List job */
  .get(controller.list)
  /** POST /api/v2/jobs - Update job */
  .post(
    token.check,
    protocol.submit,
    controller.update
  );

router.route('/:frameworkName')
  /** GET /api/v2/jobs/:frameworkName - Get job */
  .get(controller.get);

router.route('/:frameworkName/executionType')
  /** PUT /api/v2/jobs/:frameworkName/executionType - Start or stop job */
  .put(token.check, controller.execute);

router.route('/:frameworkName/config')
  /** GET /api/v2/jobs/:frameworkName/config - Get job config */
  .get(controller.getConfig);

router.route('/:frameworkName/ssh')
  /** GET /api/v2/jobs/:frameworkName/ssh - Get job ssh info */
  .get(controller.getSshInfo);

router.use('/:frameworkName/job-attempts', jobAttemptRouter);

// module exports
module.exports = router;
