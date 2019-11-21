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
const controller = require('@pai/controllers/v2/job-attempt');


const router = new express.Router({mergeParams: true});

/** GET /api/v2/jobs/:frameworkName/job-attempts/healthz - health check of job retry endpoint*/
router.route('/healthz')
  .get(controller.healthCheck);

/** GET /api/v2/jobs/:frameworkName/job-attempts - list job retries by job frameworkName */
router.route('/')
  .get(controller.list);

/** GET /api/v2/jobs/:frameworkName/job-attempts/:jobAttemptIndex - get certain job retry by retry index */
router.route('/:jobAttemptIndex')
  .get(controller.get);

module.exports = router;
