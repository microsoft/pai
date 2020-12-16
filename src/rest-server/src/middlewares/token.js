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
'use strict';

const httpContext = require('express-http-context');
const config = require('@pai/config/token');
const tokenModel = require('@pai/models/v2/token');
const createError = require('@pai/utils/error');
const logger = require('@pai/config/logger');

const check = (req, _, next) => {
  try {
    const token = getToken(req);
    const payload = tokenModel.verify(token);
    req[config.userProperty] = {
      username: payload.userName,
      admin: payload.admin,
      payload: payload,
    };
    httpContext.set('token', token);
    if (payload.userName) {
      httpContext.set('userName', payload.userName);
    }
  } catch (error) {
    const err = createError(
      'Unauthorized', 'UnauthorizedUserError', 'Invalid MTToken: ' + error +
      'See https://aka.ms/MTToken to get a valid MTToken');
    logger.debug(err);
    return next(err);
  }
  next();
};

const getToken = (req) => {
  if (req.headers.authorization) {
    let parts = req.headers.authorization.split(' ');
    if (parts.length === 2) {
      let scheme = parts[0];
      let credentials = parts[1];
      if (/^Bearer$/i.test(scheme)) {
        return credentials;
      }
    }
  }
  throw new Error('Bearer Authorization Header is required');
};

module.exports = {
  check,
};
