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
const groupController = require('@pai/controllers/v2/group');
const token = require('@pai/middlewares/token');
const param = require('@pai/middlewares/parameter');
const groupInputSchema = require('@pai/config/v2/group');

const router = new express.Router();

router
  .route('/:groupname/')
  /** Get /api/v2/group/:groupname */
  .get(token.check, groupController.getGroup);

router
  .route('/')
  /** Get /api/v2/group */
  .get(token.check, groupController.getAllGroup);

router
  .route('/:groupname')
  /** Post /api/v2/group/:groupname */
  .delete(
    token.checkNotApplication,
    token.checkAdmin,
    groupController.deleteGroup,
  );

router
  .route('/')
  /** Create /api/v2/group */
  .post(
    token.checkNotApplication,
    param.validate(groupInputSchema.groupCreateInputSchema),
    token.checkAdmin,
    groupController.createGroup,
  );

router
  .route('/')
  /** put /api/v2/group/ */
  .put(
    token.checkNotApplication,
    param.validate(groupInputSchema.groupUpdateInputSchema),
    token.checkAdmin,
    groupController.updateGroup,
  );

/** Internal API */
router
  .route('/:groupname/extension/*')
  .put(
    token.checkNotApplication,
    param.validate(groupInputSchema.groupExtensionAttrUpdateInputSchema),
    token.checkAdmin,
    groupController.updateGroupExtensionAttr,
  );

router
  .route('/:groupname/userlist')
  /** get /api/v2/group/:groupname/userlist */
  .get(token.check, token.checkAdmin, groupController.getGroupUserList);

/** Legacy API and will be deprecated in the future. Please use put /api/v2/group */
router
  .route('/:groupname/extension')
  .put(
    token.checkNotApplication,
    param.validate(groupInputSchema.groupExtensionUpdateInputSchema),
    token.checkAdmin,
    groupController.updateGroupExtension,
  );

/** Legacy API and will be deprecated in the future. Please use put /api/v2/group */
router
  .route('/:groupname/description')
  .put(
    token.checkNotApplication,
    param.validate(groupInputSchema.groupDescriptionUpdateInputSchema),
    token.checkAdmin,
    groupController.updateGroupDescription,
  );

/** Legacy API and will be deprecated in the future. Please use put /api/v2/group */
router
  .route('/:groupname/externalname')
  .put(
    token.checkNotApplication,
    param.validate(groupInputSchema.groupExternalNameUpdateInputSchema),
    token.checkAdmin,
    groupController.updateGroupExternalName,
  );

module.exports = router;
