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
const marketController = require('@pai/controllers/mp/market');
const jobGroupController = require('@pai/controllers/mp/jobGroup');
const token = require('@pai/middlewares/token');
const schema = require('@pai/config/mp/schema');
const express = require('express');
const jobRouter = require('@pai/routes/mp/job');
const router = new express.Router();

router.route('/examples/:exampleId')
  .get(token.check, marketController.getExampleInfo) // get example information
  .put(token.check, schema.validate(schema.exampleDataSchema), marketController.postUpdateExample) // update example
  .delete(token.check, marketController.deleteExample); // detele example

router.route('/examples')
  .post(token.check, schema.validate(schema.exampleDataSchema), marketController.postCreateExample) // create example
  .get(token.check, marketController.getExampleListFromCache); // list example

// get module metadata (module list cache content)
router.route('/modules')
  .get(token.check, marketController.getModuleListMetadataFromCache);

// get module information
router.route('/modules/:moduleId')
  .get(token.check, marketController.getInfo);

router.route('/modules/:moduleId/jsonSchema')
  .get(marketController.getJsonSchema);

router.route('/groups/:groupId/apps')
  .get(token.check, jobGroupController.get);

router.route('/groups/:groupId/executionType')
  .put(token.check, jobGroupController.executeJobsByGroupId);

router.use('/jobs', jobRouter);

module.exports = router;
