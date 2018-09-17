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

const param = require('../middlewares/parameter');
const config = require('../config/template');
const template = require('../controllers/template');
const token = require('../middlewares/token');

const router = new express.Router();

router.route('/')
  /** GET /api/v2/template?query=XXX[&type=YYY][&pageno=ZZZ] - Search templates by keywords */
  .get(token.tryCheck, template.filter)
  /** POST /api/v2/template - Share the job and its resources as template */
  .post(token.check, param.validate(config.schema), template.share);

router.route('/:type')
  /** GET /api/v2/template/:type[?pageno=XXX] - Get list of templates */
  .get(template.list);

router.route('/:type/:name')
  /** GET /api/v2/template/:type/:name[?version=XXX] - Return the template content */
  .get(template.fetch);

module.exports = router;
