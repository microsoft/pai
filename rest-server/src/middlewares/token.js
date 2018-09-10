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


const jwt = require('jsonwebtoken');

const config = require('../config/token');
const createError = require('../util/error');

const createMiddleware = (throwErrorIfUnauthorized) => {
  return function(req, _, next) {
    try {
      let token = getToken(req);
      let result = jwt.verify(token, config.secret);
      req[config.userProperty] = result;
    } catch (_) {
      if (throwErrorIfUnauthorized) {
        let error = createError('Unauthorized', 'UnauthorizedUserError', 'Guest is not allowed to do this operation.');
        return next(error);
      }
    }
    next();
  };
};

const getToken = (req) => {
  let parts = req.headers.authorization.split(' ');
  if (parts.length == 2) {
    let scheme = parts[0];
    let credentials = parts[1];
    if (/^Bearer$/i.test(scheme)) {
      return credentials;
    }
  }
  throw new Error('Could not find JWT token in the request.');
};

module.exports = {
  check: createMiddleware(true),
  tryCheck: createMiddleware(false),
};
