
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
const jwt = require('jsonwebtoken');
const authnConfig = require('@pai/config/authn');
const tokenConfig = require('@pai/config/token');
const tokenController = require('@pai/controllers/v2/token');
const param = require('@pai/middlewares/parameter');
const tokenMiddleware = require('@pai/middlewares/token');
const tokenModel = require('@pai/models/token');
const createError = require('@pai/utils/error');

const router = new express.Router();


/** GET /api/v1/token - Get list of tokens */
router.get('/', tokenMiddleware.checkNotApplication, async (req, res, next) => {
  try {
    const list = await tokenModel.list(req.user.username);
    res.status(200).json({
      tokens: list,
    });
  } catch (err) {
    next(createError.unknown(err));
  }
});

if (authnConfig.authnMethod !== 'OIDC') {
  /** POST /api/v1/token - Generate a token */
  router.post('/',
    param.validate(tokenConfig.tokenPostInputSchema),
    tokenController.get
  );
}
/** POST /api/v1/token/application - Generate an application token */
router.post('/application', tokenMiddleware.checkNotApplication, async (req, res, next) => {
  try {
    const token = await tokenModel.create(req.user.username, true);
    res.status(200).json({
      token,
      application: true,
    });
  } catch (err) {
    next(createError.unknown(err));
  }
});

/** DELETE /api/v1/token/:token - Revoke a token */
router.delete('/:token', tokenMiddleware.checkNotApplication, async (req, res, next) => {
  const token = req.params.token;
  try {
    const {username} = jwt.decode(token);
    if (username === req.user.username) {
      await tokenModel.revoke(token);
      res.status(200).json({
        message: 'revoke successfully',
      });
    } else {
      next(createError('Forbidden', 'ForbiddenUserError', `User ${req.user.username} is not allowed to do this operation.`));
    }
  } catch (err) {
    next(createError.unknown(err));
  }
});

// module exports
module.exports = router;
