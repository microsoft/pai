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
const azureConfig = require('../config/azure');


const router = new express.Router();


router.route('/')
    /** GET /api/v1/auth - AAD AUTH */
    .get(
    function(req, res, next) {
        passport.authenticate('azuread-openidconnect',
            {
                response: res,                      // required
                resourceURL: azureConfig.azAAD.resourceURL,    // optional. Provide a value if you want to specify the resource.
                customState: 'my_state',            // optional. Provide a value if you want to provide custom state value.
                failureRedirect: '/'
            }
        )(req, res, next);
    },
    function(req, res) {
        log.info('Login was called in the Sample');
        res.redirect('/');
    }
    );

router.route('/openid/return')
    /** GET /api/v1/auth/openid/return - AAD AUTH RETURN */
    .get(
        function(req, res, next) {
            passport.authenticate('azuread-openidconnect',
                {
                    response: res,                      // required
                    failureRedirect: '/'
                }
            )(req, res, next);
        },
        function(req, res) {
            log.info('We received a return from AzureAD.');
            //TODO: handle user account
            res.redirect('/');
        }
    )
    /** POST /api/v1/auth/openid/return - AAD AUTH RETURN */
    .post(
        function(req, res, next) {
            passport.authenticate('azuread-openidconnect',
                {
                    response: res,                      // required
                    failureRedirect: '/'
                }
            )(req, res, next);
        },
        function(req, res) {
            log.info('We received a return from AzureAD.');
            //TODO: handle user account
            res.redirect('/');
        }
    );
// module exports
module.exports = router;
