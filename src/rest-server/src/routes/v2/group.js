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

router.route('/get/:groupname/')
/** Get /api/v2/group/get/:groupname */
  .get(token.check, groupController.getGroup);

router.route('/get/')
/** Get /api/v2/group/get */
  .get(token.check, groupController.getAllGroup);

router.route('/update/:groupname/extension')
/** Put /api/v2/group/update/:groupname/extension */
  .put(token.check, param.validate(groupInputSchema.groupExtensionUpdateInputSchema), groupController.updateGroupExtension);

router.route('/update/:groupname/description')
/** Put /api/v2/group/update/:groupname/description */
  .put(token.check, param.validate(groupInputSchema.groupDescriptionUpdateInputSchema), groupController.updateGroupDescription);

router.route('/delete/:groupname')
/** Post /api/v2/group/delete/:groupname */
  .delete(token.check, groupController.deleteGroup);

router.route('/create')
/** Create /api/v2/user/create */
  .post(token.check, param.validate(groupInputSchema.groupCreateInputSchema), groupController.createGroup);

router.route('/update/:groupname/externalname')
/** put /api/v2/group/update/:groupname/external' */
  .put(token.check, param.validate(groupInputSchema.groupExternalNameUpdateInputSchema), groupController.updateGroupExternalName);

module.exports = router;


