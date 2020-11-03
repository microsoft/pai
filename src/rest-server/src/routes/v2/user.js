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
const authnConfig = require('@pai/config/authn');

const router = new express.Router();

router
  .route('/:username/')
  /** Get /api/v2/users/:username */
  .get(token.check, userController.getUser);

router
  .route('/')
  /** Get /api/v2/users */
  .get(token.check, userController.getAllUser);

/** Legacy API and will be deprecated in the future. Please use put /api/v2/users */
router
  .route('/:username/extension')
  /** Put /api/v2/users/:username/extension */
  .put(
    token.checkNotApplication,
    param.validate(userInputSchema.userExtensionUpdateInputSchema),
    userController.updateUserExtension,
  );

if (authnConfig.authnMethod === 'basic') {
  router
    .route('/:username')
    /** Delete /api/v2/users/:username */
    .delete(
      token.checkNotApplication,
      token.checkAdmin,
      userController.deleteUser,
    );

  router
    .route('/')
    /** Create /api/v2/users */
    .post(
      token.checkNotApplication,
      param.validate(userInputSchema.userCreateInputSchema),
      token.checkAdmin,
      userController.createUser,
    );

  router
    .route('/')
    /** Put /api/v2/users */
    .put(
      token.checkNotApplication,
      param.validate(userInputSchema.basicAdminUserUpdateInputSchema),
      token.checkAdmin,
      userController.basicAdminUserUpdate,
    );

  router
    .route('/me')
    /** Put /api/v2/users/me */
    .put(
      token.checkNotApplication,
      param.validate(userInputSchema.basicUserUpdateInputSchema),
      userController.checkSelf,
      userController.basicUserUpdate,
    );

  router
    .route('/:username/grouplist')
    /** put /api/v2/users/:username/grouplist */
    .put(
      token.checkNotApplication,
      param.validate(userInputSchema.userGrouplistUpdateInputSchema),
      token.checkAdmin,
      userController.updateUserGroupList,
    );

  router
    .route('/:username/group')
    /** put /api/v2/users/:username/group */
    .put(
      token.checkNotApplication,
      param.validate(userInputSchema.addOrRemoveGroupInputSchema),
      token.checkAdmin,
      userController.addGroupIntoUserGrouplist,
    );

  router
    .route('/:username/group')
    /** delete /api/v2/users/:username/group */
    .delete(
      token.checkNotApplication,
      param.validate(userInputSchema.addOrRemoveGroupInputSchema),
      token.checkAdmin,
      userController.removeGroupFromUserGrouplist,
    );

  /** Legacy API and will be deprecated in the future. Please use put /api/v2/users */
  router
    .route('/:username/virtualcluster')
    /** Update /api/v2/users/:username/virtualcluster */
    .put(
      token.checkNotApplication,
      param.validate(userInputSchema.userVirtualClusterUpdateInputSchema),
      token.checkAdmin,
      userController.updateUserVirtualCluster,
    );

  /** Legacy API and will be deprecated in the future. Please use put /api/v2/users */
  router
    .route('/:username/password')
    /** Update /api/v2/users/:username/password */
    .put(
      token.checkNotApplication,
      param.validate(userInputSchema.userPasswordUpdateInputSchema),
      userController.updateUserPassword,
    );

  /** Legacy API and will be deprecated in the future. Please use put /api/v2/users */
  router
    .route('/:username/email')
    /** Update /api/v2/users/:username/email */
    .put(
      token.checkNotApplication,
      param.validate(userInputSchema.userEmailUpdateInputSchema),
      userController.updateUserEmail,
    );

  /** Legacy API and will be deprecated in the future. Please use put /api/v2/users */
  router
    .route('/:username/admin')
    /** Update /api/v2/users/:username/admin */
    .put(
      token.checkNotApplication,
      param.validate(userInputSchema.userAdminPermissionUpdateInputSchema),
      token.checkAdmin,
      userController.updateUserAdminPermission,
    );
} else {
  router
    .route('/')
    /** Put /api/v2/users */
    .put(
      token.checkNotApplication,
      param.validate(userInputSchema.oidcUserUpdateInputSchema),
      token.checkAdmin,
      userController.oidcUserUpdate,
    );

  router
    .route('/me')
    /** Put /api/v2/users/me */
    .put(
      token.checkNotApplication,
      param.validate(userInputSchema.oidcUserUpdateInputSchema),
      userController.checkSelf,
      userController.oidcUserUpdate,
    );
}

module.exports = router;
