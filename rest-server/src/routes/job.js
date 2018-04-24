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
const tokenConfig = require('../config/token');
const jobConfig = require('../config/job');
const jobController = require('../controllers/job');
const param = require('../middlewares/parameter');


const router = new express.Router();

router.route('/')
    /** GET /api/v1/jobs - Get list of jobs */
    .get(param.jobQuery, jobController.list)

    /** POST /api/v1/jobs - Update job */
    .post(tokenConfig.check, param.validate(jobConfig.schema), jobController.init, jobController.update);

router.route('/:jobName')
    /** GET /api/v1/jobs/:jobName - Get job status */
    .get(jobController.get)

    /** PUT /api/v1/jobs/:jobName - Update job */
    .put(tokenConfig.check, param.validate(jobConfig.schema), jobController.update)

    /** DELETE /api/v1/jobs/:jobName - Remove job */
    .delete(tokenConfig.check, jobController.remove);


router.route('/:jobName/executionType')
    .put(tokenConfig.check, jobController.execute);

router.route('/:jobName/config')
    .get(jobController.getConfig);

router.route('/:jobName/ssh')
    .get(jobController.getSshInfo);


/** Load job when API with jobName route parameter is hit */
router.param('jobName', jobController.load);

// module exports
module.exports = router;
