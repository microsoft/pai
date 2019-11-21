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
const token = require('@pai/middlewares/token');
const userController = require('@pai/controllers/v2/user');
const userInputSchema = require('@pai/config/v2/user');
const param = require('@pai/middlewares/parameter');
const jobRouter = require('@pai/routes/job');
const authnConfig = require('@pai/config/authn');

const router = new express.Router();

router.route('/:username/')
  /** Get /api/v2/user/:username */
  .get(token.check, userController.getUser);

router.route('/')
  /** Get /api/v2/user */
  .get(token.check, userController.getAllUser);

router.route('/:username/extension')
  /** Put /api/v2/user/:username/extension */
  .put(token.checkNotApplication, param.validate(userInputSchema.userExtensionUpdateInputSchema), userController.updateUserExtension);

if (authnConfig.authnMethod === 'basic') {
  router.route('/:username')
  /** Delete /api/v2/user/:username */
    .delete(token.checkNotApplication, userController.deleteUser);

  router.route('/:username/virtualcluster')
  /** Update /api/v2/user/:username/virtualcluster */
    .put(token.checkNotApplication, param.validate(userInputSchema.userVirtualClusterUpdateInputSchema), userController.updateUserVirtualCluster);

  router.route('/:username/password')
  /** Update /api/v2/user/:username/password */
    .put(token.checkNotApplication, param.validate(userInputSchema.userPasswordUpdateInputSchema), userController.updateUserPassword);

  router.route('/')
  /** Create /api/v2/user */
    .post(token.checkNotApplication, param.validate(userInputSchema.userCreateInputSchema), userController.createUser);

  router.route('/:username/email')
  /** Update /api/v2/user/:username/email */
    .put(token.checkNotApplication, param.validate(userInputSchema.userEmailUpdateInputSchema), userController.updateUserEmail);

  router.route('/:username/admin')
  /** Update /api/v2/user/:username/admin */
    .put(token.checkNotApplication, param.validate(userInputSchema.userAdminPermissionUpdateInputSchema), userController.updateUserAdminPermission);

  router.route('/:username/grouplist')
    .put(token.checkNotApplication, param.validate(userInputSchema.userGrouplistUpdateInputSchema), userController.updateUserGroupList);

  router.route('/:username/group')
    .put(token.checkNotApplication, param.validate(userInputSchema.addOrRemoveGroupInputSchema), userController.addGroupIntoUserGrouplist);

  router.route('/:username/group')
    .delete(token.checkNotApplication, param.validate(userInputSchema.addOrRemoveGroupInputSchema), userController.removeGroupFromUserGrouplist);
}

router.use('/:username/jobs', jobRouter);

module.exports = router;
