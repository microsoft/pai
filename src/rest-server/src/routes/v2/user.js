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
const token = require('../../middlewares/token');
const userController = require('../../controllers/v2/user');
const jobRouter = require('../job');
const authnConfig = require('../../config/authn');

const router = new express.Router();

/** Only in OIDC mode, v2 user api could be accessed */
if (authnConfig.authnMethod === 'OIDC') {
  router.route('/get/:username/')
  /** Get api/v2/user/get/:username */
    .get(userController.getUser);

  router.route('/get/')
  /** Get api/v2/user/get */
    .get(userController.getAllUser);

  router.route('/update/:username/extension')
  /** Put api/v2/user/update/:username/extension */
    .put(token.check, userController.updateUserExtension);

  router.use('/:username/jobs', jobRouter);
}

module.exports = router;
