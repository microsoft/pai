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
const tokenConfig = require('@pai/config/token');
const param = require('@pai/middlewares/parameter');
const userController = require('@pai/controllers/v2/user');
const tokenController = require('@pai/controllers/v2/token');
const azureADController = require('@pai/controllers/v2/azureAD');
const authnConfig = require('@pai/config/authn');

const router = new express.Router();

router.route('/info')
  .get(
    async function(req, res, next) {
      const authnMode = authnConfig.authnMethod;
      const loginURI = authnConfig.authnMethod === 'OIDC' ? '/api/v1/authn/oidc/login' : '/api/v1/authn/basic/login';
      const loginURIMethod = authnConfig.authnMethod === 'OIDC' ? 'get' : 'post';
      return res.status(200).json({
        authn_type: authnMode,
        loginURI: loginURI,
        loginURIMethod: loginURIMethod,
      });
    }
  );


if (authnConfig.authnMethod === 'OIDC') {
  router.route('/oidc/login')
  /** POST /api/v1/authn/oidc/login - Return a token OIDC authn is passed and the user has the access to OpenPAI */
    .get(
      azureADController.requestAuthCode
    );

  router.route('/oidc/logout')
  /** POST /api/v1/authn/oidc/logout */
    .get(
      azureADController.signoutAzureAD
    );

  router.route('/oidc/return')
  /** GET /api/v1/authn/oidc/return - AAD AUTH RETURN */
    .get(
      azureADController.requestTokenWithCode,
      azureADController.parseTokenData,
      userController.createUserIfUserNotExist,
      userController.updateUserGroupListFromExternal,
      tokenController.getAAD
    )
    /** POST /api/v1/authn/oidc/return - AAD AUTH RETURN */
    .post(
      azureADController.requestTokenWithCode,
      azureADController.parseTokenData,
      userController.createUserIfUserNotExist,
      userController.updateUserGroupListFromExternal,
      tokenController.getAAD
    );
} else {
  router.route('/basic/login')
  /** POST /api/v1/authn/basic/login - Return a token if username and password is correct */
    .post(
      param.validate(tokenConfig.tokenPostInputSchema), tokenController.get);
}

// module exports
module.exports = router;
