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

const express = require('express');
const emailController = require('@alert-handler/controllers/mail');
const jobController = require('@alert-handler/controllers/job');
const nodeController = require('@alert-handler/controllers/node');

const router = express.Router();

// email
router
  .route('/alert-handler/send-email-to-admin')
  /** POST /alert-handler/send-email-to-admin */
  .post(emailController.sendEmailToAdmin);

router
  .route('/alert-handler/send-email-to-user')
  /** POST /alert-handler/send-email-to-user */
  .post(emailController.sendEmailToUser);

// job
router
  .route('/alert-handler/stop-jobs')
  /** POST /alert-handler/stop-jobs */
  .post(jobController.stopJobs);

router
  .route('/alert-handler/tag-jobs/:tag')
  /** POST /alert-handler/tag-jobs/:tag */
  .post(jobController.tagJobs);

// node
router
  .route('/alert-handler/cordon-nodes')
  /** POST /alert-handler/cordon-nodes */
  .post(nodeController.cordonNodes);

module.exports = router;
