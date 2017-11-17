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
const jobConfig = require('../config/job');
const jobCtrl = require('../controllers/job');
const param = require('../middlewares/parameter');


const router = express.Router();

router.route('/')
    /** GET /api/job - Get list of jobs */
    .all(jobCtrl.list)

router.route('/:jobName')
    /** GET /api/job/:jobName - Get job status */
    .get(jobCtrl.get)

    /** PUT /api/job/:jobName - Update job */
    .put(param.validate(jobConfig.schema), jobCtrl.update)

    /** DELETE /api/job/:jobName - Remove job */
    .delete(jobCtrl.remove);

/** Load job when API with jobName route parameter is hit */
router.param('jobName', jobCtrl.load);

// module exports
module.exports = router;