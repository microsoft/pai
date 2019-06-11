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
const tokenConfig = require('../config/token');
const param = require('../middlewares/parameter');
const authnConfig = require('../config/authn');
const passport = require('passport');
const userController = require('../controllers/v2/user');
const tokenV2Controller = require('../controllers/v2/token');

const router = new express.Router();

if (authnConfig.authnMethod === 'OIDC') {
  router.route('/oidc/login')
  /** POST /api/v1/authn/oidc/login - Return a token OIDC authn is passed and the user has the access to OpenPAI */
    .get(
      function(req, res, next) {
        try {
          // eslint-disable-next-line no-console
          console.log('AAD coming');
          passport.authenticate('azuread-openidconnect', {
              response: res,
              resourceURL: authnConfig.OIDCConfig.resourceURL,
              customState: 'my_state',
              failureRedirect: '/',
            }
          )(req, res, next);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log('failed to reqeust reponse');
          // eslint-disable-next-line no-console
          console.log(error);
        }
      },
      function(req, res) {
        res.redirect('/');
      }
    );

  router.route('/oidc/logout')
  /** POST /api/v1/authn/oidc/logout */
    .get(
      function(req, res) {
        req.session.destroy(function(err) {
          req.logOut();
          res.redirect(authnConfig.OIDCConfig.destroySessionUrl);
        });
      }
    );

  router.route('/oidc/return')
  /** GET /api/v1/authn/oidc/return - AAD AUTH RETURN */
    .get(
      function(req, res, next) {
        passport.authenticate('azuread-openidconnect',
          {
            response: res,
            failureRedirect: '/',
          }
        )(req, res, next);
      },
      function(req, res, next) {
        // TODO，check user name and return token
        const email = req._json.email;
        const username = email.substring(0, email.lastIndexOf('@'));
        const oid = req._json.oid;
        const userBasicInfo = {
          email: email,
          username: username,
          oid: oid,
        };
        req.userData = userBasicInfo;
        next();
      },
      userController.createUserIfUserNotExist,
      tokenV2Controller.getAAD
    )
    /** POST /api/v1/authn/openid/return - AAD AUTH RETURN */
    .post(
      function(req, res, next) {
        passport.authenticate('azuread-openidconnect',
          {
            response: res,
            failureRedirect: '/',
          }
        )(req, res, next);
      },
      function(req, res, next) {
        // TODO，check user name and return token
        const email = req._json.email;
        const username = email.substring(0, email.lastIndexOf('@'));
        const oid = req._json.oid;
        const userBasicInfo = {
          email: email,
          username: username,
          oid: oid,
        };
        req.username = username;
        req.userData = userBasicInfo;
        next();
      },
      userController.createUserIfUserNotExist,
      userController.updateUserGroupListFromExternal,
      tokenV2Controller.getAAD
    );
} else {
  router.route('/basic/login')
  /** POST /api/v1/authn/basic/login - Return a token if username and password is correct */
    .post(
      param.validate(tokenConfig.tokenPostInputSchema), userController.checkUserPassword, tokenV2Controller.get);
}

// module exports
module.exports = router;
