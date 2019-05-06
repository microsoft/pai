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
const tokenController = require('../controllers/token');
const param = require('../middlewares/parameter');
const authnConfig = require('../config/authn');
const passport = require('passport');

const router = new express.Router();

if (authnConfig.authnMethod === 'OIDC') {
  router.route('/oidc/login')
  /** POST /api/v1/auth/oidc/login - Return a token OIDC authn is passed and the user has the access to OpenPAI */
    .get( function(req, res, next) {
      passport.authenticate('azuread-openidconnect', {
          response: res,
          resourceURL: authnConfig.OIDCConfig.resourceURL,
          customState: 'my_state',
          failureRedirect: '/',
        }
      )(req, res, next);
    });

  router.route('/oidc/logout')
  /** POST /api/v1/auth/oidc/logout */
    .get(
      function(req, res) {
        req.session.destroy(function(err) {
          req.logOut();
          res.redirect(authnConfig.OIDCConfig.destroySessionUrl);
        });
      }
    );

  router.route('/oidc/return')
  /** GET /api/v1/auth/oidc/return - AAD AUTH RETURN */
    .get(
      function(req, res, next) {
        passport.authenticate('azuread-openidconnect',
          {
            response: res,
            failureRedirect: '/',
          }
        )(req, res, next);
      },
      function(req, res) {
          // TODO，check user name and return token
      }
    )
    /** POST /api/v1/auth/openid/return - AAD AUTH RETURN */
    .post(
      function(req, res, next) {
        passport.authenticate('azuread-openidconnect',
          {
            response: res,
            failureRedirect: '/',
          }
        )(req, res, next);
      },
      function(req, res) {
        // TODO，check user name and return token
      }
    );
} else {
  router.route('/basic/login')
  /** POST /api/v1/authn/basic/login - Return a token if username and password is correct */
    .post(param.validate(tokenConfig.tokenPostInputSchema), tokenController.get);
}

// module exports
module.exports = router;
