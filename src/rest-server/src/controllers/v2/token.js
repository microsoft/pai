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
const jwt = require('jsonwebtoken');
const tokenConfig = require('@pai/config/token');
const createError = require('@pai/utils/error');
const userModel = require('@pai/models/v2/user');
const authConfig = require('@pai/config/authn');
const querystring = require('querystring');

function jwtSignPromise(userInfo, admin, expiration = 7 * 24 * 60 * 60) {
  return new Promise((res, rej) => {
    jwt.sign({
      username: userInfo.username,
      admin: admin,
    }, tokenConfig.secret, {expiresIn: expiration}, (signError, token) => {
      signError ? rej(signError) : res(token);
    });
  });
}

/**
 * Get the token.
 */
const get = async (req, res, next) => {
  try {
    const username = req.body.username;
    const userInfo = await userModel.getUser(username);
    let admin = false;
    if (userInfo.grouplist.includes(authConfig.groupConfig.adminGroup.groupname)) {
      admin = true;
    }
    const token = await jwtSignPromise(userInfo, admin);
    return res.status(200).json({
      user: userInfo.username,
      token: token,
      admin: admin,
      hasGitHubPAT: userInfo.extension.hasOwnProperty('githubPAT')&& Boolean(userInfo.extension['githubPAT']),
    });
  } catch (error) {
    if (error.status && error.status === 404) {
      return next(createError('Bad Request', 'NoUserError', `User ${req.params.username} is not found.`));
    }
    return next(createError.unknown(error));
  }
};

/**
 *  Get the token in AAD Mode.
 */
const getAAD = async (req, res, next) => {
  try {
    const username = req.username;
    const userInfo = await userModel.getUser(username);
    let admin = false;
    if (userInfo.grouplist.includes(authConfig.groupConfig.adminGroup.groupname)) {
      admin = true;
    }
    const token = await jwtSignPromise(userInfo, admin);
    return res.redirect(req.returnBackURL + '?'+ querystring.stringify({
      user: userInfo.username,
      token: token,
      admin: admin,
      hasGitHubPAT: userInfo.extension.hasOwnProperty('githubPAT')&& Boolean(userInfo.extension['githubPAT']),
    }));
  } catch (error) {
    return next(createError.unknown(error));
  }
};

// module exports
module.exports = {
  get,
  getAAD,
};
