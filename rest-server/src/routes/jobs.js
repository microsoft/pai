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
const authConfig = require('../config/auth');
const jobsConfig = require('../config/jobs');
const jobsController = require('../controllers/jobs');
const param = require('../middlewares/parameter');


const router = express.Router();

router.route('/')
    /** GET /api/v1/jobs - Get list of jobs */
    .get(jobsController.list);

router.route('/:jobName')
    /** GET /api/v1/jobs/:jobName - Get job status */
    .get(jobsController.get)

    /** PUT /api/v1/jobs/:jobName - Update job */
    .put(authConfig.check, param.validate(jobsConfig.jobConfigSchema), jobsController.update)

    /** DELETE /api/v1/jobs/:jobName - Remove job */
    .delete(authConfig.check, jobsController.remove);

/** Load job when API with jobName route parameter is hit */
router.param('jobName', jobsController.load);

// module exports
module.exports = router;