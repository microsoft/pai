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


// module dependencies
const express = require('express');
const controller = require('@pai/controllers/v2/job');
const token = require('@pai/middlewares/token');
const schema = require('@pai/config/mp/schema');
const marketController = require('@pai/controllers/mp/market');
const stopwatchMiddleware = require('@pai/middlewares/stopwatch');


const router = new express.Router();

router.route('/')
  /** GET /api/v2/mp/jobs - List all type job */
  .get(
    // list merged jobs
    stopwatchMiddleware,
    token.check,
    marketController.listMergedJobs,
  )
  .post(
    // submit job
    token.check,
    schema.validate(schema.jobSubmissionSchema),
    marketController.submitJob,
  );

router.route('/appsCount')
  /** GET /api/v2/mp/jobs/appsCount */
  .get(controller.getAppsCount);

router.route('/homeDir')
  /** GET /api/v2/mp/jobs/homeDir - Get user home dir path in hdfs */
  .get(token.check, marketController.getUserHomeDir);

router.route('/jobName/:jobName')
  /** GET /api/v2/mp/jobs/jobName/:jobName- Get job generatic info by job name */
  .get(
    stopwatchMiddleware,
    token.check,
    controller.getGenericInfoByName,
  );

router.route('/appId/:appId')
  /** GET /api/v2/mp/jobs/appId/:appId- Get job generatic info by application id */
  .get(
    stopwatchMiddleware,
    token.check,
    controller.getGenericInfoByAppId,
  );

router.route('/jobName/:jobName/dumpContainerLogs')
  /** GET /api/v2/mp/jobs/jobName/:jobName/dumpContainerLogs- dump Container log by job name */
  .get(token.check, controller.dumpContainerLogByName);

router.route('/appId/:appId/dumpContainerLogs')
  /** GET /api/v2/mp/jobs/appId/:appId/dumpContainerLogs- dump Container log by application id */
  .get(token.check, controller.dumpContainerLogByAppId);

router.route('/appId/:appId/resourceRequests')
/** GET /api/v2/mp/jobs/appId/:appId/resourceRequests- Get job resource requests by application id */
  .get(token.check, controller.getResourceRequestsByAppId);

router.route('/jobName/:jobName/executionType')
  /** PUT /api/v2/jobs/:frameworkName/executionType - Start or stop job */
  .put(
    stopwatchMiddleware,
    token.check,
    controller.executeJobByJobName,
  );

router.route('/appId/:appId/executionType')
  /** PUT /api/v2/jobs/appId/:appId/executionType - Start or stop job */
  .put(token.check, controller.executeAppByType);

router.route('/jobName/:jobName/heapDumpContainer')
  /** GET /api/v2/mp/jobs/jobName/:jobName/heapDumpContainerByJobName- heapDump Container  by job name */
  .get(token.check, controller.heapDumpContainerByJobName);

router.route('/appId/:appId/heapDumpContainer')
  /** GET /api/v2/mp/jobs/appId/:appId/heapDumpContainerByAppId- heapdump Container  by application id */
  .get(token.check, controller.heapDumpContainerByAppId);

router.route('/jobName/:jobName/threadDumpContainer')
  /** GET /api/v2/mp/jobs/jobName/:jobName/threadDumpContainerByJobName- ThreadDump Container  by job name */
  .get(token.check, controller.threadDumpContainerByJobName);

router.route('/appId/:appId/threadDumpContainer')
  /** GET /api/v2/mp/jobs/appId/:appId/threadDumpContainerByAppId- ThreadDump Container  by application id */
  .get(token.check, controller.threadDumpContainerByAppId);

router.route('/jobName/:jobName/pTreeDumpContainer')
  /** GET /api/v2/mp/jobs/jobName/:jobName/processTreeDumpContainerByJobName- processTreeDump Container  by job name */
  .get(token.check, controller.processTreeDumpContainerByJobName);

router.route('/appId/:appId/pTreeDumpContainer')
  /** GET /api/v2/mp/jobs/appId/:appId/processTreeDumpContainerByAppId- processTreeDump Container  by application id */
  .get(token.check, controller.processTreeDumpContainerByAppId);

router.route('/jobName/:jobName/containerDumpFileUrl')
  /** GET /api/v2/mp/jobs/jobName/:jobName/containerDumpFileUrl- get container dump file url by job name */
  .get(token.check, controller.getContainerDumpFileUrlByJobName);

router.route('/appId/:appId/containerDumpFileUrl')
  /** GET /api/v2/mp/jobs/appId/:appId/containerDumpFileUrl- get container dump file url by application id */
  .get(token.check, controller.getContainerDumpFileUrlByAppId);

// module exports
module.exports = router;
