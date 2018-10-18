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
const token = require('../middlewares/token');
const userConfig = require('../config/user');
const userController = require('../controllers/user');
const param = require('../middlewares/parameter');
const jobRouter = require('./job');

const router = new express.Router();

router.route('/')
    /** PUT /api/v1/user - Create or update a user */
    .put(token.check, param.validate(userConfig.userPutInputSchema), userController.update)

    /** DELETE /api/v1/user - Remove a user */
    .delete(token.check, param.validate(userConfig.userDeleteInputSchema), userController.remove)

    /** Get /api/v1/user - Get user info list */
    .get(token.check, userController.getUserList);

router.route('/:username/virtualClusters')
    .put(token.check, param.validate(userConfig.userVcUpdateInputSchema), userController.updateUserVc);

router.route('/:username/githubPAT')
    .put(token.check, param.validate(userConfig.userGithubPATUpdateInputSchema), userController.updateUserGithubPAT);

router.use('/:username/jobs', jobRouter);

// module exports
module.exports = router;
