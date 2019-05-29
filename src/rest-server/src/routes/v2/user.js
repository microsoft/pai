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
const userInputSchema = require('../../config/v2/user');
const param = require('../../middlewares/parameter');
const jobRouter = require('../job');
const authnConfig = require('../../config/authn');

const router = new express.Router();

router.route('/get/:username/')
  /** Get /api/v2/user/get/:username */
  .get(token.check, userController.getUser);

router.route('/get/')
  /** Get /api/v2/user/get */
  .get(token.check, userController.getAllUser);

router.route('/:username/')
  .get(token.check, userController.getUser);

router.route('/update/:username/extension')
  /** Put /api/v2/user/update/:username/extension */
  .put(token.check, param.validate(userInputSchema.userExtensionUpdateInputSchema), userController.updateUserExtension);

if (authnConfig.authnMethod === 'basic') {
  router.route('/delete/:user')
  /** Delete /api/v2/user/delete/:username */
    .delete(token.check, userController.deleteUser);

  router.route('/update/:username/grouplist')
  /** Update /api/v2/user/update/:username/grouplist */
    .put(token.check, param.validate(userInputSchema.userGrouplistUpdateInputSchema), userController.updateUserGroupList);

  router.route('/update/:username/password')
  /** Update /api/v2/user/:username/password */
    .put(token.check, param.validate(userInputSchema.userPasswordUpdateInputSchema), userController.updateUserPassword);

  router.route('/create')
  /** Create /api/v2/user/create */
    .post(token.check, param.validate(userInputSchema.userCreateInputSchema), userController.createUser);
}

router.use('/:username/jobs', jobRouter);

module.exports = router;
