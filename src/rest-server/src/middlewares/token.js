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

const {userProperty} = require('@pai/config/token');
const userModel = require('@pai/models/v2/user');
const tokenModel = require('@pai/models/token');
const createError = require('@pai/utils/error');

const getToken = async (req) => {
  const [scheme, credentials] = req.headers.authorization.split(' ');
  if (/^Basic$/i.test(scheme)) {
    // application token
    const raw = Buffer.from(credentials, 'base64').toString();
    const [username, password] = raw.split(':');
    const token = await tokenModel.verify(password);
    if (token.username === username && token.application) {
      return token;
    } else {
      throw new Error('Invalid authorization header');
    }
  } else if (/^Bearer$/i.test(scheme)) {
    return tokenModel.verify(credentials);
  } else {
    throw new Error('Invalid authorization header');
  }
};

const check = async (req, _, next) => {
  if (!req.headers.authorization) {
    return next(createError('Unauthorized', 'UnauthorizedUserError', 'Guest is not allowed to do this operation.'));
  }
  try {
    req[userProperty] = await getToken(req);
    req[userProperty].admin = await userModel.checkAdmin(req[userProperty].username);
    next();
  } catch (error) {
    return next(createError('Unauthorized', 'UnauthorizedUserError', 'Your token is invalid.'));
  }
};

const notApplication = async (req, _, next) => {
  const token = req[userProperty];
  if (!token.application) {
    next();
  } else {
    return next(createError('Forbidden', 'ForbiddenUserError', 'Applications are not allowed to do this operation.'));
  }
};

module.exports = {
  check,
  checkNotApplication: [check, notApplication],
};
