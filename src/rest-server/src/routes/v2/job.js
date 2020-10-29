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
const limiter = require('@pai/config/rate-limit');
const token = require('@pai/middlewares/token');
const controller = require('@pai/controllers/v2/job');
const taskController = require('@pai/controllers/v2/task');
const protocol = require('@pai/middlewares/v2/protocol');
const jobAttemptRouter = require('@pai/routes/v2/job-attempt.js');
const param = require('@pai/middlewares/parameter');
const tagInputSchema = require('@pai/config/v2/tag');
const executionTypeInputSchema = require('@pai/config/v2/execution-type');

const router = new express.Router();

router
  .route('/')
  /** GET /api/v2/jobs - List job */
  .get(token.check, limiter.listJob, controller.list)
  /** POST /api/v2/jobs - Update job */
  .post(token.check, limiter.submitJob, protocol.submit, controller.update);

router
  .route('/:frameworkName')
  /** GET /api/v2/jobs/:frameworkName - Get job */
  .get(token.check, controller.get);

router
  .route('/:frameworkName/attempts/:jobAttemptId')
  /** GET /api/v2/jobs/:frameworkName/attempts/:jobAttemptId - Get job with specific attempt */
  .get(token.check, controller.get);

router
  .route(
    '/:frameworkName/attempts/:jobAttemptId/taskRoles/:taskRoleName/taskIndex/:taskIndex/attempts',
  )
  /** GET /api/v2/jobs/frameworkName/attempts/:jobAttemptId/taskRoles/:taskRoleName/taskIndex/:taskIndex/attempts - get certain task retry */
  .get(token.check, taskController.get);

router
  .route('/:frameworkName/executionType')
  /** PUT /api/v2/jobs/:frameworkName/executionType - Start or stop job */
  .put(
    token.check,
    param.validate(executionTypeInputSchema.executionTypeInputSchema),
    controller.execute,
  );

router
  .route('/:frameworkName/config')
  /** GET /api/v2/jobs/:frameworkName/config - Get job config */
  .get(token.check, controller.getConfig);

router
  .route('/:frameworkName/ssh')
  /** GET /api/v2/jobs/:frameworkName/ssh - Get job ssh info */
  .get(token.check, controller.getSshInfo);

router.use('/:frameworkName/job-attempts', jobAttemptRouter);

router
  .route('/:frameworkName/tag')
  /** PUT /api/v2/jobs/:frameworkName/tag - Add a framework tag */
  .put(
    token.check,
    param.validate(tagInputSchema.tagInputSchema),
    controller.addTag,
  );

router
  .route('/:frameworkName/tag')
  /** DELETE /api/v2/jobs/:frameworkName/tag - Delete a framework tag */
  .delete(
    token.check,
    param.validate(tagInputSchema.tagInputSchema),
    controller.deleteTag,
  );

router
  .route('/:frameworkName/events')
  /** GET /api/v2/jobs/:frameworkName/events - Get events of a framework */
  .get(token.check, controller.getEvents);

// module exports
module.exports = router;
